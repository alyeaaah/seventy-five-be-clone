import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull } from "typeorm";

import { AppDataSource } from "../data-source";
import { Tournament, typeTournamentEnum } from "../entities/Tournament";
import { Team } from "../entities/Team";
import { Matches, MatchStatus } from "../entities/Matches";
import { TournamentMatchPoint } from "../entities/TournamentMatchPoint";
import { MatchPoint } from "../entities/MatchPoint";
import { Player } from "../entities/Player";
import { PlayerMatchPoint } from "../entities/PlayerPoint";
import { PointConfig } from "../entities/PointConfig";
import { MatchHistories, MatchHistoryType } from "../entities/MatchHistories";
import { Game } from "../entities/Game";
import { SetLog } from "../entities/SetLog";
import { CoinLogs, CoinSourceEnum, CoinStatusEnum } from "../entities/CoinLogs";
import { PointLogs, PointSourceEnum, PointStatusEnum } from "../entities/PointLogs";
import { PlayerTeam } from "../entities/PlayerTeam";
import { Titles } from "../entities/Titles";
import { PlayerTitles } from "../entities/PlayerTitles";

export class MatchScoreService {
  async updateScore(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { home_team_score, away_team_score, game_scores, notes, status, player_uuid } = req.body;
    try {
      if ((!home_team_score && home_team_score !== 0) || (!away_team_score && away_team_score !== 0)) {
        throw new Error("All fields are required!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        // check Exist
        const matchesRepo = AppDataSource.getRepository(Matches);
        const match = await matchesRepo.findOne({
          where: { uuid },
          relations: {
            home_team: {
              players: true
            },
            away_team: {
              players: true
            },
          }
        });
        if (!match) {
          throw new Error("Match not found!");
        }
        if (match.status == MatchStatus.ENDED && status !== "RESET") {

          const responses = {
            message: "reload",
            match: { ...match,
              home_team: {
                ...match.home_team,
                players: null
              },
              away_team: {
                ...match.away_team,
                players: null
              }
            }
          };
          
          return res.status(206).json(responses);
        }
        match.home_team_score = home_team_score;
        match.away_team_score = away_team_score;
        match.game_scores = game_scores ? game_scores : match.game_scores
        if (home_team_score >= 6) {
          match.winner_team_uuid = match.home_team_uuid;
          match.status = MatchStatus.ENDED;
        } else if (away_team_score >= 6) {
          match.winner_team_uuid = match.away_team_uuid;
          match.status = MatchStatus.ENDED;
        }
        if (status === "RESET") {
          match.home_team_score = 0;
          match.away_team_score = 0;
          match.winner_team_uuid = '';
          match.status = MatchStatus.UPCOMING;
        }
        
        await entityManager.save(match);
        if (match.status == MatchStatus.ENDED && status !== "RESET") {
          // BEGIN: set player point
          let rewardPoint: MatchPoint | undefined = undefined;
          if (match.tournament_uuid) {
            const tournamentRepo = AppDataSource.getRepository(Tournament);
            const point = await tournamentRepo.findOne({
              select: ["point_config", "point_config"],
              where: {
                uuid: match.tournament_uuid, point_config: { points: { round: match.round != null && match.round != undefined ? match.round + 1 : 1 } }
              },
              relations: ["point_config", "point_config.points"]
            });
            rewardPoint = !!point?.point_config?.points?.length ? point.point_config.points[0] : undefined;
          } else {
            const pointConfigRepo = AppDataSource.getRepository(PointConfig);
            const point = await pointConfigRepo.findOne({
              select: ["points", "points"],
              where: {
                uuid: match.point_config_uuid,
                points: {
                  round: 1
                }
              },
              relations: ["points"]
            });
            rewardPoint = !!point?.points?.length ? point.points[0] : undefined;
          }
          if (rewardPoint) {
            const matchTeam = await matchesRepo.findOne({
              where: {
                uuid: match.uuid},
              relations: ["home_team", "away_team", "home_team.players", "away_team.players"]
            });
            if (!matchTeam?.home_team?.players || !matchTeam?.away_team?.players) {
              throw new Error("Home team or Away team players not found!");
            }
            
            const playerPoints: { uuid: string; point: number }[] = [];
            for (const player of matchTeam?.home_team?.players) {
              const playerPointHome = new PlayerMatchPoint();
              playerPointHome.uuid = uuidv4();
              playerPointHome.round = rewardPoint.round;
              playerPointHome.player_uuid = player?.player_uuid || "";
              playerPointHome.point = match?.winner_team_uuid == match?.home_team_uuid ? rewardPoint.win_point : rewardPoint.lose_point;
              playerPointHome.round = match?.round || 0;
              playerPointHome.tournament_uuid = match?.tournament_uuid || "";
              playerPointHome.match_uuid = match?.uuid || "";
              playerPointHome.tournament_match_point_uuid = rewardPoint.uuid || "";
              playerPointHome.createdBy = req.match?.uuid || undefined;
              await entityManager.save(playerPointHome);
              playerPoints.push({ uuid: player?.player_uuid || "", point: playerPointHome.point });
            }
            for (const player of matchTeam?.away_team?.players) {
              const playerPointAway = new PlayerMatchPoint();
              playerPointAway.uuid = uuidv4();
              playerPointAway.round = rewardPoint.round;
              playerPointAway.player_uuid = player?.player_uuid || "";
              playerPointAway.point = match?.winner_team_uuid == match?.away_team_uuid ? rewardPoint.win_point : rewardPoint.lose_point;
              playerPointAway.round = match?.round || 0;
              playerPointAway.tournament_uuid = match?.tournament_uuid || "";
              playerPointAway.match_uuid = match?.uuid || "";
              playerPointAway.tournament_match_point_uuid = rewardPoint.uuid || "";
              playerPointAway.createdBy = req.match?.uuid || undefined;
              await entityManager.save(playerPointAway);
              playerPoints.push({ uuid: player?.player_uuid || "", point: playerPointAway.point });
            }
            

            const playerRepo = AppDataSource.getRepository(Player);
            for (const playerPoint of playerPoints) {
              const player = await playerRepo.findOneBy({ uuid: playerPoint.uuid });
              
              if (!player) {
                throw new Error("Player not found!");
              }
              player.point = player.point + playerPoint.point;
              await entityManager.save(player);
            }
          }
          // END: set player point
        }
        if ((status == MatchHistoryType.INJURY || status == MatchHistoryType.NO_SHOW || status == MatchHistoryType.OTHERS) && player_uuid) {
          const teamUuid = match?.away_team?.players?.find((player) => player.player_uuid === player_uuid)?.team_uuid || match?.home_team?.players?.find((player) => player.player_uuid === player_uuid)?.team_uuid || undefined;
          if (player_uuid.includes("BOTH")) {
            const players = []
            if (player_uuid.includes("HOME")) {
              for (const pl of match?.home_team?.players || []) {
                players.push(pl)
              }
            }
            if (player_uuid.includes("AWAY")) {
              for (const pl of match?.away_team?.players || []) {
                players.push(pl)
              }
            }
            for (const pl of players) {
              const matchHistory = new MatchHistories();
              matchHistory.uuid = uuidv4();
              matchHistory.match_uuid = uuid;
              matchHistory.notes = notes;
              matchHistory.type = status;
              matchHistory.player_uuid = pl.player_uuid || "";
              if (game_scores?.length) {
                matchHistory.set = game_scores.length;
              }
              if (teamUuid) {
                matchHistory.team_uuid = teamUuid;
              }
              matchHistory.createdBy = req.data?.uuid || undefined;
              await entityManager.save(matchHistory);
            }
          } else {
            const matchHistory = new MatchHistories();
            matchHistory.uuid = uuidv4();
            matchHistory.match_uuid = uuid;
            matchHistory.type = status;
            matchHistory.notes = notes;
            matchHistory.player_uuid = player_uuid;
            if (game_scores?.length) {
              matchHistory.set = game_scores.length;
            }
            if (teamUuid) {
              matchHistory.team_uuid = teamUuid;
            }
            matchHistory.createdBy = req.data?.uuid || undefined;
            await entityManager.save(matchHistory);
          }
        }
        if (status === "RESET") {
          // soft delete match histories
          const pmpRepo = entityManager.getRepository(PlayerMatchPoint);
          const playerRepo = entityManager.getRepository(Player);
          const playersPoint = await pmpRepo.find({ where: { match_uuid: uuid, deletedAt: IsNull() } });
          for (const pp of playersPoint) {
            const player = await playerRepo.findOne({ where: { uuid: pp.player_uuid, deletedAt: IsNull() } });
            if (player) {
              // TODO: update player point
              player.point = player.point - pp.point;
              player.point_updated_at = new Date();
              await entityManager.save(player);
            }
          }

          await Promise.all([
            entityManager.update(MatchHistories, { match_uuid: uuid, deletedAt: IsNull() }, {
              deletedAt: new Date(),
            }),
            entityManager.update(PlayerMatchPoint, { match_uuid: uuid, deletedAt: IsNull() }, {
              deletedAt: new Date(),
              deletedBy: req.data?.uuid || undefined,
            }),
            // also if semifinal or final, reset the playertitles
            ["SEMIFINAL", "FINAL"].includes(match.category) ? entityManager.update(PlayerTitles, { match_uuid: match.uuid }, {
              deletedAt: new Date()
            }) : null
          ]); 
        }


        const responses = {
          message: "Match updated successfully!",
          data: { ...match,
            home_team: {
              ...match.home_team,
              players: null
            },
            away_team: {
              ...match.away_team,
              players: null
            }
          }
        };
        
        utilLib.loggingRes(req, responses);
        return res.json(responses);
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateNextRound(req: any, res: any) {
    const utilLib = Util.getInstance();

    const { uuid: matchUUID } = req.params;
    try {
      if (!matchUUID) {
        throw new Error("Match UUID is required!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        // check Exist
        const matchesRepo = AppDataSource.getRepository(Matches);
        const match = await matchesRepo.findOne({
          where: { uuid: matchUUID },
          relations: {
            home_team: {
              players: true
            },
            away_team: {
              players: true
            },
          }
        });
        if (!match) {
          throw new Error("Match not found!");
        }
        if (match.status != MatchStatus.ENDED) {
          throw new Error("Match not ended yet!");
        }
        if (match.status == MatchStatus.ENDED ) {
          const tournament = await entityManager.getRepository(Tournament).findOne({
            where: {
              uuid: match.tournament_uuid,
              deletedAt: IsNull()
            }
          });

          if (tournament?.type === typeTournamentEnum.KNOCKOUT) {
            // BEGIN: update next round
            // check if this match is a knockout tournament match
            const nextSeed = utilLib.getNextSeed({
              round: match.round != null && match.round != undefined ? match.round + 1 : 1,
              seedIndex: match.seed_index != null && match.seed_index != undefined ? match.seed_index+1 : 0
            });
            const nextMatch = await matchesRepo.findOne({
              where: {
                tournament_uuid: match.tournament_uuid,
                round: nextSeed.round - 1,
                seed_index: nextSeed.seedIndex - 1
              }
            });
            if (nextMatch) {
              if (nextSeed.teamPosition == "home") {
                nextMatch.home_team_uuid = match.winner_team_uuid;
              } else {
                nextMatch.away_team_uuid = match.winner_team_uuid;
              }
              nextMatch.status =
                !["TBD", "BYE"].includes((!!nextMatch.home_team_uuid ? nextMatch.home_team_uuid : "TBD")) &&
                !["TBD", "BYE"].includes((!!nextMatch.away_team_uuid ? nextMatch.away_team_uuid : "TBD"))
                  ? MatchStatus.ONGOING : MatchStatus.UPCOMING;
              
              await entityManager.save(nextMatch);
            }
            if (match.category === "SEMIFINAL") {
              const losesTeam = match.home_team_uuid === match.winner_team_uuid ? match.away_team_uuid : match.home_team_uuid;
              const playerTeamRepo = entityManager.getRepository(PlayerTeam);
              const titlesRepo = entityManager.getRepository(Titles);
              
              // Get player teams and find title in parallel
              const [playerTeams, titles] = await Promise.all([
                playerTeamRepo.find({
                  where: {
                    team_uuid: losesTeam,
                    deletedAt: IsNull()
                  }
                }),
                titlesRepo.findOne({
                  where: {
                    refId: match.tournament_uuid,
                    rank: 3,
                    deletedAt: IsNull()
                  }
                })
              ]);
              let titleData = titles;
              if (!titleData) {
                const newTitles = new Titles();
                newTitles.refId = match.tournament_uuid;
                newTitles.rank = 3;
                newTitles.deletedAt = null;
                titleData = await entityManager.save(newTitles);
              }
              // soft delete prev data
              await entityManager.update(PlayerTitles,{
                title_id: titleData.id,
                match_uuid: match.uuid
              }, {
                deletedAt: new Date()
              })
              const playerTitle: PlayerTitles[] = [];
              for (const playerTeam of playerTeams) {
                const newPlayerTitle = new PlayerTitles();
                newPlayerTitle.player_uuid = playerTeam.player_uuid || "";
                newPlayerTitle.team_uuid = playerTeam.team_uuid || null;
                newPlayerTitle.match_uuid = match.uuid;
                newPlayerTitle.title_id = titleData.id || 0;
                playerTitle.push(newPlayerTitle);
              }
              await entityManager.save(playerTitle);
            } else if (match.category === "FINAL") {
              const winnerTeam = match.winner_team_uuid;
              const runnerUpTeam = match.home_team_uuid === match.winner_team_uuid ? match.away_team_uuid : match.home_team_uuid;
              
              const playerTeamRepo = entityManager.getRepository(PlayerTeam);
              
              // Create title for winner (rank 1)
              let winnerTitle = await entityManager.getRepository(Titles).findOne({
                where: {
                  refId: match.tournament_uuid,
                  rank: 1,
                  deletedAt: IsNull()
                }
              });
              if (!winnerTitle) {
                const newWinnerTitle = new Titles();
                newWinnerTitle.refId = match.tournament_uuid;
                newWinnerTitle.rank = 1;
                newWinnerTitle.deletedAt = null;
                winnerTitle = await entityManager.save(newWinnerTitle);
              }
              
              // Create title for runner-up (rank 2)
              let runnerUpTitle = await entityManager.getRepository(Titles).findOne({
                where: {
                  refId: match.tournament_uuid,
                  rank: 2,
                  deletedAt: IsNull()
                }
              });
              if (!runnerUpTitle) {
                const newRunnerUpTitle = new Titles();
                newRunnerUpTitle.refId = match.tournament_uuid;
                newRunnerUpTitle.rank = 2;
                newRunnerUpTitle.deletedAt = null;
                runnerUpTitle = await entityManager.save(newRunnerUpTitle);
              }
              
              // Get players for both teams in parallel
              // also update the prev data in parallel
              const playerTitlesRepo = entityManager.getRepository(PlayerTitles);
              const [winnerPlayers, runnerUpPlayers] = await Promise.all([
                playerTeamRepo.find({
                  where: {
                    team_uuid: winnerTeam,
                    deletedAt: IsNull()
                  }
                }),
                playerTeamRepo.find({
                  where: {
                    team_uuid: runnerUpTeam,
                    deletedAt: IsNull()
                  }
                }),
                playerTitlesRepo.update({
                  title_id: winnerTitle.id,
                  match_uuid: match.uuid
                }, {
                  deletedAt: new Date()
                }),
                playerTitlesRepo.update({
                  title_id: runnerUpTitle.id,
                  match_uuid: match.uuid
                }, {
                  deletedAt: new Date()
                })
              ]);
              
              // Assign titles to both teams
              const allPlayerTitles: PlayerTitles[] = [];
              
              // Add winner titles
              for (const playerTeam of winnerPlayers) {
                const newPlayerTitle = new PlayerTitles();
                newPlayerTitle.player_uuid = playerTeam.player_uuid || "";
                newPlayerTitle.title_id = winnerTitle.id || 0;
                newPlayerTitle.team_uuid = playerTeam.team_uuid || null;
                newPlayerTitle.match_uuid = match.uuid;
                allPlayerTitles.push(newPlayerTitle);
              }
              
              // Add runner-up titles
              for (const playerTeam of runnerUpPlayers) {
                const newPlayerTitle = new PlayerTitles();
                newPlayerTitle.player_uuid = playerTeam.player_uuid || "";
                newPlayerTitle.title_id = runnerUpTitle.id || 0;
                newPlayerTitle.team_uuid = playerTeam.team_uuid || null;
                newPlayerTitle.match_uuid = match.uuid;
                allPlayerTitles.push(newPlayerTitle);
              }
              
              await entityManager.save(allPlayerTitles);
            }
          }
            // END: update next match
        }
        utilLib.loggingRes(req, { match, message: "Match updated successfully!" });
        return res.json({ match, message: "Match updated successfully!" });
      }).catch((error) => {
        utilLib.loggingError(req, error.message);
        return res.status(400).json({ message: error.message });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async endMatch(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { home_team_score, away_team_score, winner_team_uuid } = req.body;
    try {
      if (!home_team_score || !away_team_score || !winner_team_uuid) {
        return res.status(400).json({ message: "All fields are required!" });
      }
      await AppDataSource.transaction(async (entityManager) => {
        // check Exist
        const matchesRepo = AppDataSource.getRepository(Matches);
        const data = await matchesRepo.findOneBy({ uuid });
        if (!data) {
          throw new Error("Match not found!");
        }
        if (data.status == MatchStatus.ENDED) {
          throw new Error("Match already ended!");
        }

        const teamRepo = AppDataSource.getRepository(Team);
        const dataTeam = await teamRepo.findOne({
          where: { uuid: winner_team_uuid },
          relations: [
            "players.player",
            "tournament",
            "home_matches",
            "away_matches",
          ],
        });

        if (!dataTeam) {
          throw new Error("Winner UUID not found!");
        }
        if (
          winner_team_uuid != data.home_team_uuid &&
          winner_team_uuid != data.away_team_uuid
        ) {
          throw new Error(
            "Winner UUID should be home_team_uuid or away_team_uuid!"
          );
        }

        data.home_team_score = home_team_score;
        data.away_team_score = away_team_score;
        data.winner_team_uuid = winner_team_uuid;
        data.status = MatchStatus.ENDED;
        await entityManager.save(data);

        // set player point
        let playerPoint = 0;
        let playerCoin = 0;
        const tmRepo = AppDataSource.getRepository(TournamentMatchPoint);
        const tmData = await tmRepo.findOneBy({
          round: data.round != undefined && data.round != null ? data.round : 1,
          tournament_uuid: data.tournament_uuid,
        });

        let mpUuid = "";
        const mpRepo = AppDataSource.getRepository(MatchPoint);
        const mpData = await mpRepo.findOneBy({
          round: data.round != undefined && data.round != null ? data.round : 1,
        });

        if (tmData) {
          playerPoint = tmData.point;
          playerCoin = tmData.coin;
          mpUuid = tmData.uuid;
        } else if (mpData) {
          playerPoint = mpData.win_point;
          playerCoin = mpData.win_coin;
          mpUuid = mpData.uuid;
        }
        // get Players
        if (dataTeam?.players && (playerPoint > 0 || playerCoin > 0)) {
          const playerRepo = AppDataSource.getRepository(Player);
          dataTeam.players.forEach(async (player: any) => {
            let p : any = await playerRepo.findOneBy({ uuid : player.player_uuid });
            if (p) {
              p.point = p.point + playerPoint;
              p.coin = p.coin + playerCoin;
              entityManager.save(p);
              const newPlayerPoint = new PlayerMatchPoint();
              newPlayerPoint.player_uuid = player.uuid;
              newPlayerPoint.point = playerPoint || 0;
              newPlayerPoint.coin = playerCoin || 0;
              newPlayerPoint.match_uuid = data.uuid;
              newPlayerPoint.tournament_uuid = data.tournament_uuid;
              newPlayerPoint.round = data.round != null && data.round != undefined ? data.round + 1 : 1;
              newPlayerPoint.match_point_uuid = mpUuid;
              newPlayerPoint.tournament_match_point_uuid = mpUuid;
              newPlayerPoint.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newPlayerPoint);
              const newCoinLog = new CoinLogs();
              newCoinLog.player_uuid = player.uuid;
              newCoinLog.coin = playerCoin || 0;
              newCoinLog.before = p.coin - playerCoin;
              newCoinLog.after = p.coin;
              newCoinLog.ref_uuid = data.uuid;
              newCoinLog.status = CoinStatusEnum.IN;
              newCoinLog.source = CoinSourceEnum.MATCH;
              newCoinLog.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newCoinLog);
              const newPointLog = new PointLogs();
              newPointLog.player_uuid = player.uuid;
              newPointLog.point = playerPoint || 0;
              newPointLog.before = p.point - playerPoint;
              newPointLog.after = p.point;
              newPointLog.ref_uuid = data.uuid;
              newPointLog.status = PointStatusEnum.IN;
              newPointLog.source = PointSourceEnum.MATCH;
              newPointLog.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newPointLog);
            }
          });
        }
        utilLib.loggingRes(req, { data });
        return res.json({ dataTeam });
        
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateMatchStatus(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { status, notes } = req.body;
    try {
      if (!status) {
        throw new Error("Status is required!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        const matchesRepo = AppDataSource.getRepository(Matches);
        const data = await matchesRepo.findOneBy({ uuid });
        if (!data) {
          throw new Error("Match not found!");
        }
        const oldStatus = data.status;
        data.status = status;
        data.notes = notes || undefined;
        await entityManager.save(data);
        const newMatchHistory = new MatchHistories();
        newMatchHistory.uuid = uuidv4();
        newMatchHistory.match_uuid = uuid;
        newMatchHistory.prev_status = oldStatus;
        newMatchHistory.status = status;
        newMatchHistory.createdBy = req.data?.uuid || undefined;
        await entityManager.save(newMatchHistory);
        
        utilLib.loggingRes(req, { data, message: "Match status updated successfully!" });
        return res.json({ data, message: "Match status updated successfully!" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateSetScore(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { home_team_score, away_team_score, set_number, type, game_history } =
      req.body;
    try {
      if (
        !home_team_score ||
        !away_team_score ||
        !set_number ||
        !type ||
        !game_history
      ) {
        throw new Error("All fields are required!");
      }

      // check Exist
      const matchesRepo = AppDataSource.getRepository(Matches);
      const matchExist = await matchesRepo.findOneBy({ uuid });
      if (!matchExist) {
        throw new Error("Match not found!");
      }

      if (!["regular", "tiebreak"].includes(type)) {
        throw new Error("Type should be regular or tiebreak!");
      }

      const setRepo = AppDataSource.getRepository(Game);
      const setLogrepo = AppDataSource.getRepository(SetLog);
      const set = await setRepo.findOneBy({
        match_uuid: uuid,
        set: Number(set_number),
      });
      let data: any;
      if (set) {
        if (set.winner_team_uuid) throw new Error("Set already finished!");
        if (
          home_team_score != set.home_team_score ||
          away_team_score != set.away_team_score
        ) {
          set.home_team_score = home_team_score;
          set.away_team_score = away_team_score;
          set.type = type;
          await setRepo.save(set);
          await setLogrepo.save({
            uuid: uuidv4(),
            set_uuid: set.uuid,
            home_team_score,
            away_team_score,
            gameHistory: game_history,
          });
        }
        data = set;
      } else {
        const newSet = new Game();
        newSet.match_uuid = uuid;
        newSet.uuid = uuidv4();
        newSet.set = Number(set_number);
        newSet.home_team_score = home_team_score;
        newSet.away_team_score = away_team_score;
        newSet.type = type;
        await setRepo.save(newSet);
        await setLogrepo.save({
          uuid: uuidv4(),
          set_uuid: newSet.uuid,
          home_team_score,
          away_team_score,
          gameHistory: game_history,
        });
        data = newSet;
      }
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async endSet(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { winner_team_uuid, set_number } = req.body;
    try {
      if (!set_number || !winner_team_uuid) {
        throw new Error("All fields are required!");
      }

      // check Exist
      const matchesRepo = AppDataSource.getRepository(Matches);
      const matchExist = await matchesRepo.findOneBy({ uuid });
      if (!matchExist) {
        throw new Error("Match not found!");
      }
      const setRepo = AppDataSource.getRepository(Game);
      const data = await setRepo.findOneBy({
        match_uuid: uuid,
        set: Number(set_number),
      });
      if (!data) throw new Error("Set not found!");
      if (data.winner_team_uuid) throw new Error("Set already finished!");
      if (winner_team_uuid) {
        data.winner_team_uuid = winner_team_uuid;
        await setRepo.save(data);
      }
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}

