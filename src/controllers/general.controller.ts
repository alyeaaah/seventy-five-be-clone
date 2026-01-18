import { statusTournamentEnum, Tournament, typeTournamentEnum } from "../entities/Tournament";
import { Rule } from "../entities/Rule";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { In, IsNull, Like, MoreThan, Not } from "typeorm";
import { PlayerTeam } from "../entities/PlayerTeam";
import { Matches, MatchStatus } from "../entities/Matches";
import { TournamentSponsors } from "../entities/TournamentSponsors";
import { Player } from "../entities/Player"; 
import { MerchOrder, OrderStatus } from "../entities/MerchOrder";
import { formatDate, calculateAge } from "../lib/date.util";

export default class GeneralController {
  async report(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const result = {
        matches: {
          total: 0,
          upcoming: 0,
          finished: 0
        },
        players: {
          total: 0,
          verified: 0,
          unverified: 0
        },
        tournaments: {
          total: 0,
          upcoming: 0,
        },
        orders: {
          total: 0,
          new: 0,
          monthly_gmv: 0,
          done: 0,
        }
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const playerRepo = AppDataSource.getRepository(Player);
      const orderRepo = AppDataSource.getRepository(MerchOrder);

      result.matches.total = await matchesRepo.count();
      result.players.total = await playerRepo.count();
      result.tournaments.total = await tournamentRepo.count();
      result.orders.total = await orderRepo.count();

      result.matches.upcoming = await matchesRepo.count({ where: { status: MatchStatus.UPCOMING } });
      result.matches.finished = await matchesRepo.count({ where: { status: MatchStatus.ENDED } });
      result.players.verified = await playerRepo.count({ where: { isVerified: true } });
      result.players.unverified = await playerRepo.count({ where: { isVerified: false } });
      result.tournaments.upcoming = await tournamentRepo.count({ where: [{ status: In([statusTournamentEnum.PUBLISHED, statusTournamentEnum.POSTPONED]) }, { end_date: MoreThan(new Date()) }] });
      result.orders.new = await orderRepo.count({ where: { status: OrderStatus.ORDERED } });
      result.orders.done = await orderRepo.count({ where: { status: OrderStatus.COMPLETED } });
      const monthlyGMV = await orderRepo
        .createQueryBuilder("order")
        .select("SUM(order.grand_total)", "total")
        .where("order.status = :status", { status: OrderStatus.COMPLETED })
        .andWhere("order.createdAt > :date", { date: new Date().setDate(new Date().getDate() - 30) })
        .getRawOne();
      result.orders.monthly_gmv = +monthlyGMV.total || 0;

      utilLib.loggingRes(req, { message: "Success", data: result })
      return res.status(200).json({ message: "Success", data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async topPlayer(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const topPlayer = await playerRepo.find({
        where: {
          isVerified: true
        },
        order: {
          point: "DESC"
        },
        take: 10
      });
      const result = topPlayer.map((d) => ({
              ...d,
              password: "*****",
              skills: d.skills ? JSON.parse(d.skills) : undefined,
              phone: '00000000',
              phoneNumber: 88888888,
              address: '*****',
              email: 'hidden_email@seventy.five',
              username: '********',
              age: calculateAge(d.dateOfBirth),
              turnDate: formatDate(d.turnDate),
            }));
      utilLib.loggingRes(req, { message: "Success", data: result })
      return res.status(200).json({ message: "Success", data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async upcomingTournament(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const upcoming = await tournamentRepo.find({
        where: {
          end_date: MoreThan(new Date())
        },
        order: {
          end_date: "ASC"
        },
        take: 20
      });
      utilLib.loggingRes(req, { message: "Success", data: upcoming })
      return res.status(200).json({ message: "Success", data: upcoming });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
