import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { EmailVerification } from "../entities/EmailVerification";
import { Player } from "../entities/Player";
import { v4 as uuidv4 } from "uuid";
import { IsNull } from "typeorm";
import Util from "../lib/util.lib";
import EmailService from "../services/email.service";

export default class EmailVerificationController {
  async sendVerification(req: Request, res: Response) {
    const utilLib = Util.getInstance();
    const { email } = req.body;
    
    try {
      if (!email) {
        throw new Error("Email is required!");
      }

      const playerRepo = AppDataSource.getRepository(Player);
      const player = await playerRepo.findOne({
        where: { email, deletedAt: IsNull() }
      });

      if (!player) {
        throw new Error("Player not found!");
      }

      if (player.isVerified) {
        return res.json({ message: "Email already verified!" });
      }

      // Generate verification code
      const verificationCode = uuidv4().replace(/-/g, '').substring(0, 8);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save verification record
      const verificationRepo = AppDataSource.getRepository(EmailVerification);
      
      // Mark any existing verifications as used
      await verificationRepo.update(
        { playerId: player.id, isUsed: false },
        { isUsed: true }
      );

      const newVerification = new EmailVerification();
      newVerification.playerId = player.id!;
      newVerification.code = verificationCode;
      newVerification.expiresAt = expiresAt;
      newVerification.isUsed = false;

      await verificationRepo.save(newVerification);

      // Send confirmation email
      await EmailService.sendConfirmationEmail(
        player.email,
        player.name,
        verificationCode
      );

      utilLib.loggingRes(req, { message: "Verification email sent successfully" });
      return res.json({ message: "Verification email sent successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    const utilLib = Util.getInstance();
    const { code } = req.body;
    
    try {
      if (!code) {
        throw new Error("Verification code is required!");
      }

      const verificationRepo = AppDataSource.getRepository(EmailVerification);
      const playerRepo = AppDataSource.getRepository(Player);

      const verification = await verificationRepo.findOne({
        where: { 
          code, 
          isUsed: false 
        },
        relations: ['player']
      });

      if (!verification) {
        throw new Error("Invalid verification code!");
      }

      if (new Date() > verification.expiresAt) {
        throw new Error("Verification code has expired!");
      }

      if (verification.player.isVerified) {
        return res.json({ message: "Email already verified!" });
      }

      // Mark verification as used
      verification.isUsed = true;
      verification.verifiedAt = new Date();
      await verificationRepo.save(verification);

      // Mark player as verified
      verification.player.isVerified = true;
      await playerRepo.save(verification.player);

      utilLib.loggingRes(req, { message: "Email verified successfully" });
      return res.json({ message: "Email verified successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async resendVerification(req: Request, res: Response) {
    const utilLib = Util.getInstance();
    const { email } = req.body;
    
    try {
      if (!email) {
        throw new Error("Email is required!");
      }

      const playerRepo = AppDataSource.getRepository(Player);
      const player = await playerRepo.findOne({
        where: { email, deletedAt: IsNull() }
      });

      if (!player) {
        throw new Error("Player not found!");
      }

      if (player.isVerified) {
        return res.json({ message: "Email already verified!" });
      }

      // Generate new verification code
      const verificationCode = uuidv4().replace(/-/g, '').substring(0, 8);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save verification record
      const verificationRepo = AppDataSource.getRepository(EmailVerification);
      
      // Mark any existing verifications as used
      await verificationRepo.update(
        { playerId: player.id, isUsed: false },
        { isUsed: true }
      );

      const newVerification = new EmailVerification();
      newVerification.playerId = player.id!;
      newVerification.code = verificationCode;
      newVerification.expiresAt = expiresAt;
      newVerification.isUsed = false;

      await verificationRepo.save(newVerification);

      // Send confirmation email
      await EmailService.sendConfirmationEmail(
        player.email,
        player.name,
        verificationCode
      );

      utilLib.loggingRes(req, { message: "Verification email resent successfully" });
      return res.json({ message: "Verification email resent successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
