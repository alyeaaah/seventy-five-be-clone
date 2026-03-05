import { Request, Response } from "express";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config";
import Util from "../lib/util.lib";
import { Player } from "../entities/Player";
import { IsNull, Not } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

export default class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    try {
      if (!username || !password)
        throw new Error("Username and password needed!");
      const userRepository = AppDataSource.getRepository(User);
      const playerRepo = AppDataSource.getRepository(Player);

      const userPlayer = await playerRepo.findOne({
        where: [{
          email: username, 
          deletedAt: IsNull()
        }, {
          username: username, 
          deletedAt: IsNull()
        }, {
          phoneNumber: username, 
          deletedAt: IsNull()
        }],
      }); 
      const userAdmin = await userRepository.findOne({
        where: { username },
      });
      let role;
      let dbPasswd;
      if (!!userPlayer) {
        role = userPlayer.role;
        dbPasswd = userPlayer.password;
      } else if (!!userAdmin) {
        role = userAdmin.role;
        dbPasswd = userAdmin.password;
      } else {
        return res.status(400).json({ message: "Player is not found, please register!" });
      }
      const user = userPlayer || userAdmin;
      
      if (!user) throw new Error("Player is not found, please register!");
      const isMatch = await bcrypt.compare(password, (dbPasswd || ""));
      if (!isMatch) throw new Error("Username or password is incorrect!");

      const payload = {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        role: role,
        name: user.name,
      };
      
      const token = await new Promise((resolve, reject) => {
        jwt.sign(
          payload,
          config.jwtSecret,
          { expiresIn: '1d' },
          (error, token) => {
            if (error) reject(error);
            resolve(token);
          }
        );
      });
      Util.getInstance().loggingRes(req, { token });
      return res.json({ token });
    } catch (error: any) {
      Util.getInstance().loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    try {
      if (!email)
        throw new Error("Email is required!");

      const userRepository = AppDataSource.getRepository(User);
      const playerRepo = AppDataSource.getRepository(Player);

      // Find user by email (check both User and Player tables)
      const userPlayer = await playerRepo.findOne({
        where: { email: email, deletedAt: IsNull() },
      });
      const userAdmin = await userRepository.findOne({
        where: { username: email }, // Admin users use username as email field
      });

      const user = userPlayer || userAdmin;
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + (3600000 * 6)); // 1 hour from now

      // Store reset token in database (we'll need to add these fields to entities)
      if (userPlayer) {
        userPlayer.resetToken = resetToken;
        userPlayer.resetTokenExpiry = resetTokenExpiry;
        await playerRepo.save(userPlayer);
      } else if (userAdmin) {
        userAdmin.resetToken = resetToken;
        userAdmin.resetTokenExpiry = resetTokenExpiry;
        await userRepository.save(userAdmin);
      }
      const smtpConfig = {
        host: config.smtp.host,
        port: config.smtp.port,
        family: 4, // force IPv4
        secure: false,
        logger: true,
        debug: true,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      }
      console.log("\n\n conf\n", smtpConfig);
      
      // Send reset email
      const transporter = nodemailer.createTransport(smtpConfig);

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: config.smtp.from,
        to: email,
        subject: "Password Reset - Seventy Five Club",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested a password reset for your Seventy Five Club account.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">Seventy Five Club Tennis Management</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      
      Util.getInstance().loggingRes(req, { message: "Password reset email sent" });
      return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error: any) {
      Util.getInstance().loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;
    try {
      if (!token || !newPassword)
        throw new Error("Token and new password are required!");

      const userRepository = AppDataSource.getRepository(User);
      const playerRepo = AppDataSource.getRepository(Player);

      // Find user by reset token
      const userPlayer = await playerRepo.findOne({
        where: { 
          resetToken: token, 
          resetTokenExpiry: Not(IsNull()), 
          deletedAt: IsNull() 
        },
      });
      const userAdmin = await userRepository.findOne({
        where: { 
          resetToken: token, 
          resetTokenExpiry: Not(IsNull())
        },
      });

      const user = userPlayer || userAdmin;
      
      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Check if token has expired
      if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
        throw new Error("Reset token has expired");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      if (userPlayer) {
        userPlayer.password = hashedPassword;
        userPlayer.resetToken = undefined;
        userPlayer.resetTokenExpiry = undefined;
        await playerRepo.save(userPlayer);
      } else if (userAdmin) {
        userAdmin.password = hashedPassword;
        userAdmin.resetToken = undefined;
        userAdmin.resetTokenExpiry = undefined;
        await userRepository.save(userAdmin);
      }

      Util.getInstance().loggingRes(req, { message: "Password reset successful" });
      return res.json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      Util.getInstance().loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
