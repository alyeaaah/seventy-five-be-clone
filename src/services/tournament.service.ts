import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { Player } from "../entities/Player";
import { PlayerTeam } from "../entities/PlayerTeam";
import { PTStatusEnum } from "../entities/PlayerTeam";
import { EntityManager, FindOptionsWhere, In, IsNull, Not } from "typeorm";
import { v4 as uuidv4 } from 'uuid';
import { Team } from "../entities/Team";
import { TournamentGroup } from "../entities/TournamentGroups";
import { DraftPick, DraftPickStatus } from "../entities/DraftPick";
import config from "../config";
import nodemailer from "nodemailer";

export class TournamentService {
  async requestJoinTournament(playerUuid: string, tournamentUuid: string, partnerUuid?: string, body?: any) {
    const tRepo = AppDataSource.getRepository(Tournament);
    const ptRepo = AppDataSource.getRepository(PlayerTeam);
    const dpRepo = AppDataSource.getRepository(DraftPick);

    // Check if tournament exists
    const tournament = await tRepo.findOne({ where: { uuid: tournamentUuid, deletedAt: IsNull() } });
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (!tournament.draft_pick && !partnerUuid) {
      return {
        message: "Partner is required for this tournament",
        error: 400
      };
    }

    // Check if player already joined
    const [hasJoined, hasRequested] = await Promise.all([
      ptRepo.findOne({
      where: {
        player_uuid: playerUuid,
        tournament_uuid: tournamentUuid,
        deletedAt: IsNull()
      }
    }),
      dpRepo.findOne({
      where: {
        player_uuid: In([playerUuid, partnerUuid]),
        tournament_uuid: tournamentUuid,
        status: Not(In([DraftPickStatus.REJECTED])),
        deletedAt: IsNull(),
      },
    })]);

    if (hasJoined) {
      throw new Error("You have already joined this tournament");
    }
    if (hasRequested) {
      throw new Error("You have already Requested to join this tournament");
    }

    // Check tournament quota availability
    const currentRegistrations = await dpRepo.count({
      where: {
        tournament_uuid: tournamentUuid,
        status: Not(In([DraftPickStatus.REJECTED])),
        deletedAt: IsNull()
      }
    });

    const currentEarlyBirdRegistrations = await dpRepo.count({
      where: {
        tournament_uuid: tournamentUuid,
        status: Not(In([DraftPickStatus.REJECTED])),
        commitment_fee: tournament.early_bird_price,
        deletedAt: IsNull()
      }
    });
    if (tournament.max_player && currentRegistrations >= tournament.max_player) {
      throw new Error("This tournament has reached its maximum capacity. No more spots are available.");
    }

    // validate early bird
    if (body.commitment_fee && tournament.early_bird_price == body.commitment_fee) {
      if (
        !tournament.early_bird_price
      ) {
        throw new Error("This tournament is not available for early bird registration");
      }
      if (
        tournament.early_bird_end_date && new Date() >= tournament.early_bird_end_date &&
        tournament.early_bird_start_date && new Date() <= tournament.early_bird_start_date
      ) {
        throw new Error("This tournament is not available for early bird registration");
      }
      if (tournament.early_bird_limit && currentEarlyBirdRegistrations >= tournament.early_bird_limit && body.commitment_fee === tournament.early_bird_price) {
        throw new Error("This tournament has reached its early bird limit");
      }
    }

    await AppDataSource.transaction(async (tm) => {
      
      const teamUuid = uuidv4();
      // Create join request
      const playerTeams: PlayerTeam[] = [];
      const draftPickEntity = new DraftPick;
        draftPickEntity.status = DraftPickStatus.REQUESTED;
      draftPickEntity.tournament_uuid = tournamentUuid;
      if (body?.media_url) {
        draftPickEntity.attachment = body.media_url;
      }
      if (body?.commitment_fee) {
        draftPickEntity.commitment_fee = body.commitment_fee;
      }
      if (!tournament.draft_pick && partnerUuid) {
        draftPickEntity.player_uuid = partnerUuid;
        draftPickEntity.drafted_by = playerUuid;
      }
      if (!!tournament.draft_pick) {
        draftPickEntity.player_uuid = playerUuid;
      }
      await tm.save(draftPickEntity);

      // old logic started
      // const playerTeam = new PlayerTeam();
      // playerTeam.uuid = uuidv4();
      // playerTeam.player_uuid = playerUuid;
      // playerTeam.tournament_uuid = tournamentUuid;
      // playerTeam.team_uuid = teamUuid;
      // playerTeam.status = PTStatusEnum.REQUESTED;
      // playerTeam.createdBy = playerUuid;
      // playerTeam.captain = true; // First player is captain

      // playerTeams.push(playerTeam);

      // if (partnerUuid && !tournament.draft_pick) {
      //   const partnerTeam = new PlayerTeam();
      //   partnerTeam.uuid = uuidv4();
      //   partnerTeam.player_uuid = partnerUuid;
      //   partnerTeam.tournament_uuid = tournamentUuid;
      //   partnerTeam.team_uuid = teamUuid;
      //   partnerTeam.status = PTStatusEnum.REQUESTED;
      //   partnerTeam.createdBy = playerUuid;
      //   partnerTeam.captain = false; // Partner is not captain

      //   playerTeams.push(partnerTeam);
      // }

      await tm.save(playerTeams);

      // old logic ended
      this.sendPaymentReceiptEmail(playerUuid, tournamentUuid, body.commitment_fee);
    });


    return {
      message: "Join request sent successfully",
      status: PTStatusEnum.REQUESTED
    };
  }

  async sendPaymentReceiptEmail(playerUuid: string, tournamentUuid: string, paymentAmount: number) {
    try {
      // Fetch player information
      const playerRepo = AppDataSource.getRepository(Player);
      const player = await playerRepo.findOne({ 
        where: { uuid: playerUuid, deletedAt: IsNull() } 
      });
      
      if (!player) {
        throw new Error('Player not found');
      }

      // Fetch tournament information
      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const tournament = await tournamentRepo.findOne({ 
        where: { uuid: tournamentUuid, deletedAt: IsNull() } 
      });
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const smtpConfig = {
        host: config.smtp.host,
        port: config.smtp.port,
        family: 4,
        secure: false,
        logger: true,
        debug: true,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      };

      const transporter = nodemailer.createTransport(smtpConfig);

      const mailOptions = {
        from: config.smtp.from,
        to: player.email,
        subject: "Payment Receipt - Seventy Five Club",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Payment Receipt</h2>
            <p>Hello ${player.name},</p>
            <p>Thank you for your payment! This is your official receipt for the tournament registration.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Tournament:</td>
                  <td style="padding: 8px 0; text-align: right;">${tournament.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Payment Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #28a745;">IDR ${paymentAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Payment Date:</td>
                  <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                      PAID
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Important:</strong> Please keep this receipt for your records. If you have any questions about your payment, please contact our support team.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">Seventy Five Club Tennis Management</p>
            <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Payment receipt sent to ${player.email} for tournament: ${tournament.name}`);
    } catch (error) {
      console.error('Error sending payment receipt email:', error);
      throw new Error('Failed to send payment receipt email');
    }
  }

  async updateJoinRequestStatus(playerUuid: string, tournamentUuid: string, adminUuid: string, status: 'approve' | 'reject', tournamentEventUuid?: string) {
    const ptRepo = AppDataSource.getRepository(PlayerTeam);
    const tRepo = AppDataSource.getRepository(Tournament);
    const dpRepo = AppDataSource.getRepository(DraftPick);

    // Check if tournament exists
    const tournament = await tRepo.findOne({ where: { uuid: tournamentUuid, deletedAt: IsNull() } });
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const whereParams: FindOptionsWhere<DraftPick> = {
      player_uuid: playerUuid,
      tournament_uuid: tournamentUuid,
      status: DraftPickStatus.REQUESTED,
      deletedAt: IsNull()
    };
    if (tournamentEventUuid) {
      whereParams.tournament_event_uuid = tournamentEventUuid;
    }
    const requestedDraftPick = await dpRepo.findOne({
      where: whereParams
    });
    if (!requestedDraftPick) {
      throw new Error("Player request not found");
    }
    // old logic started
    // const playerTeam = await ptRepo.findOne({
    //   where: {
    //     player_uuid: playerUuid,
    //     tournament_uuid: tournamentUuid,
    //     status: PTStatusEnum.REQUESTED,
    //     deletedAt: IsNull()
    //   }
    // });

    // if (!playerTeam) {
    //   throw new Error("Join request not found");
    // }
    // old logic ended

    await AppDataSource.transaction(async (tm) => {
      requestedDraftPick.status = status === 'approve' ? DraftPickStatus.APPROVED : DraftPickStatus.REJECTED;
      await tm.save(requestedDraftPick);

      // old logic started

        // if (!tournament.draft_pick) {
        //   const teamRepo = tm.getRepository(Team);
        //   const [currentTeams, teamIsExist] = await Promise.all([
        //     teamRepo.find({
        //       where: {
        //         tournament_uuid: tournamentUuid,
        //         deletedAt: IsNull()
        //       }
        //     }),
        //     teamRepo.findOne({
        //       where: {
        //         tournament_uuid: tournamentUuid,
        //         uuid: playerTeam.team_uuid,
        //         deletedAt: IsNull()
        //       }
        //     })
        //   ]);

        //   if (!teamIsExist) {
        //     const team = new Team();
        //     team.uuid = playerTeam.team_uuid || uuidv4();
        //     team.tournament_uuid = tournamentUuid;
        //     team.name = `Team ${currentTeams.length + 1}`;
        //     team.createdBy = adminUuid;
        //     await tm.save(team);
        //   }else{
        //     throw new Error("Team already exists");
            
        //   }
        // }

        // playerTeam.status = status === 'approve' ? PTStatusEnum.APPROVED : PTStatusEnum.REJECTED;
        // // Note: updatedBy field doesn't exist in PlayerTeam entity
        // await tm.save(playerTeam);
      // old logic ended
    });

    return {
      message: `Join request ${status}d successfully`,
      status: requestedDraftPick.status
    };
  }

  async getTournamentParticipants(tournamentUuid: string) {
    const ptRepo = AppDataSource.getRepository(PlayerTeam);

    const participants = await ptRepo.find({
      where: {
        tournament_uuid: tournamentUuid,
        deletedAt: IsNull()
      },
      relations: {
        player: true
      }
    });

    return participants.map(pt => ({
      uuid: pt.uuid,
      player_uuid: pt.player_uuid,
      player_name: pt.player?.name,
      status: pt.status,
      createdAt: pt.createdAt,
      // Note: updatedAt field doesn't exist in PlayerTeam entity
    }));
  }

  async getTeamParticipants(tournamentUuid: string, status?: PTStatusEnum[], page: number = 1, limit: number = 10) {
    const ptRepo = AppDataSource.getRepository(PlayerTeam);


    // Build where condition based on status
    const whereCondition: any = {
      tournament_uuid: tournamentUuid,
      deletedAt: IsNull(),
      status: status ? In(status) : PTStatusEnum.CONFIRMED
    };

    // Get all participants first
    const allParticipants = await ptRepo.find({
      where: whereCondition,
      relations: {
        player: {
          level: true
        },
        team: true
      },
      order: {
        createdAt: 'ASC'
      }
    });
    // Group participants by team_uuid
    const teamGroups = allParticipants.reduce((acc, pt) => {
      const teamUuid = pt.team_uuid || 'individual';
      
      if (!acc[teamUuid]) {
        acc[teamUuid] = {
          id: pt.team?.id,
          uuid: teamUuid,
          name: pt.team?.name || 'Individual Team',
          alias: pt.team?.alias || 'Individual Team',
          players: [],
          registeredAt: pt.createdAt,
          status: pt.status
        };
      }
      

      acc[teamUuid].players.push({
        id: pt.player?.id,
        uuid: pt.uuid,
        player_uuid: pt.player_uuid,
        name: pt.player?.name,
        nickname: pt.player?.nickname,
        level: pt.player?.level?.name,
        media_url: pt.player?.media_url,
        team_uuid: pt.team_uuid,
        team_name: pt.team?.name,
        city: pt.player?.city,
        status: pt.status,
        captain: pt.captain // Include captain field
      });

      return acc;
    }, {} as Record<string, any>);
    
    // Sort players by name first, then by captain status (captain first) within each team
    Object.keys(teamGroups).forEach(teamUuid => {
      teamGroups[teamUuid].players.sort((a: any, b: any) => {
        // First sort by name
        const nameComparison = (a.name || '').localeCompare(b.name || '');
        if (nameComparison !== 0) return nameComparison;
        
        // If names are the same, sort by captain (captain first)
        return (b.captain ? 1 : 0) - (a.captain ? 1 : 0);
      });
    });
    
    // Convert to array and apply pagination
    const teamsArray = Object.values(teamGroups);
    const totalCount = teamsArray.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalCount);
    const paginatedTeams = teamsArray.slice(startIndex, endIndex);

    return {
      data: {
        teams: paginatedTeams,
        totalTeams: totalCount,
        totalParticipants: allParticipants.length,
        pagination: {
          current: page,
          pageSize: limit,
          total: totalCount
        }
      }
    };
  }

  async updateTeamJoinRequestStatus(playerTeamUuid: string, tournamentUuid: string, adminUuid: string, status: PTStatusEnum) {
    const generatedTeamUuid = uuidv4();
    const ptRepo = AppDataSource.getRepository(PlayerTeam);
    const playerTeams = await ptRepo.find({
      where: {
        uuid: playerTeamUuid,
        tournament_uuid: tournamentUuid,
        deletedAt: IsNull()
      }
    });
    const playerTeam = playerTeams.find(pt => pt.uuid = playerTeamUuid)

    try {

      // Update status for all players in team      
      await AppDataSource.transaction(async (tm) => {

      // Find all PlayerTeam entries for this team in this tournament

      if (playerTeams.length === 0) {
        throw new Error("Team join request not found");
      }
        
        const tourneyRepo = tm.getRepository(Tournament);
        const tourney = await tourneyRepo.findOne({
          where: {
            uuid: tournamentUuid,
            deletedAt: IsNull()
          }
        });
        if (!tourney) {
          throw new Error("Tournament not found");
        }
        // Create team record if status is approve/confirmed
        if (status === PTStatusEnum.APPROVED || status === PTStatusEnum.CONFIRMED) {
          const teamRepo = tm.getRepository(Team);
          const [currentTeams, teamIsExist] = await Promise.all([
            teamRepo.find({
              where: {
                tournament_uuid: tournamentUuid,
                deletedAt: IsNull()
              }
            }),
            teamRepo.findOne({
              where: {
                tournament_uuid: tournamentUuid,
                uuid: playerTeam?.team_uuid || generatedTeamUuid,
                deletedAt: IsNull()
              }
            })
          ]);

          if (!teamIsExist && !tourney.draft_pick) {
            const team = new Team();
            team.uuid = playerTeam?.team_uuid || generatedTeamUuid;
            team.tournament_uuid = tournamentUuid;
            
            // Generate unique team name
            let teamNumber = currentTeams.length + 1;
            let teamName = `Team ${teamNumber}`;
            
            // Check if team name already exists and increment if needed
            const existingTeamWithName = await teamRepo.findOne({
              where: {
                name: teamName,
                tournament_uuid: tournamentUuid,
                deletedAt: IsNull()
              }
            });
            
            if (existingTeamWithName) {
              // Find the next available team number by getting teams ordered by name descending
              const usedNumbers = currentTeams
                .filter(t => t.name.startsWith('Team '))
                .map(t => {
                  const match = t.name.match(/Team (\d+)/);
                  return match ? parseInt(match[1]) : 0;
                })
                .sort((a, b) => b - a);
              
              teamNumber = usedNumbers.length > 0 ? usedNumbers[0] + 1 : currentTeams.length + 1;
              teamName = `Team ${teamNumber}`;
            }
            
            team.name = teamName;
            team.createdBy = adminUuid;
            await tm.save(team);
          }
        }

        // Update all PlayerTeam entries
        await ptRepo.update(
          {
            uuid: playerTeamUuid,
            tournament_uuid: tournamentUuid,
            deletedAt: IsNull()
          },
          {
            status: status
          }
        );
      });

      return {
        message: `Team join request ${status} successfully`,
        teamUuid:playerTeam?.team_uuid || generatedTeamUuid,
        playerTeamUuid:playerTeamUuid,
        tournamentUuid,
        status: status,
        affectedPlayers: playerTeams.length
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async addTeam(playerUuids: string[], tournamentUuid: string, status: PTStatusEnum = PTStatusEnum.REQUESTED) {
    // Validation
    if (!playerUuids) {
      throw new Error("Player UUIDs are required");
    }

    // Check for duplicate UUIDs
    const uniqueUuids = [...new Set(playerUuids)];
    if (uniqueUuids.length !== playerUuids.length) {
      throw new Error("Player UUIDs must be unique");
    }

    const tRepo = AppDataSource.getRepository(Tournament);
    const ptRepo = AppDataSource.getRepository(PlayerTeam);

    // Check if tournament exists
    const tournament = await tRepo.findOne({ where: { uuid: tournamentUuid, deletedAt: IsNull() } });
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    if (!tournament.draft_pick && playerUuids.length !== 2) {
      throw new Error("Tournament is not a draft pick tournament and team must have exactly 2 players");
    }

    // Check if players already joined this tournament
    const existingTeams = await ptRepo.find({
      where: {
        player_uuid: In(playerUuids),
        tournament_uuid: tournamentUuid,
        status: In([PTStatusEnum.CONFIRMED, PTStatusEnum.REQUESTED, PTStatusEnum.APPROVED]),
        deletedAt: IsNull()
      }
    });

    if (existingTeams.length > 0) {
      throw new Error("One or more players have already joined this tournament");
    }

    const createdTeamUuid = uuidv4();
    
    await AppDataSource.transaction(async (tm) => {
      
      // Create team entries for both players
      const playerTeams: PlayerTeam[] = [];
      
      for (let i = 0; i < playerUuids.length; i++) {
        const playerUuid = playerUuids[i];
        const playerTeam = new PlayerTeam();
        playerTeam.uuid = uuidv4();
        playerTeam.player_uuid = playerUuid;
        playerTeam.tournament_uuid = tournamentUuid;
        playerTeam.team_uuid = createdTeamUuid;
        playerTeam.status = status;
        playerTeam.createdBy = 'admin'; // Indicate admin created this team
        playerTeam.captain = i === 0; // First player is captain
        playerTeams.push(playerTeam);
      }

      await tm.save(playerTeams);

      // directly create team record if status is approve/confirmed
      if (!tournament.draft_pick && (status === PTStatusEnum.APPROVED || status === PTStatusEnum.CONFIRMED)) {
        const teamRepo = tm.getRepository(Team);
        
        // Get current teams count for naming
        const currentTeams = await teamRepo.find({
          where: {
            tournament_uuid: tournamentUuid,
            deletedAt: IsNull()
          }
        });
        
        // Check if team UUID already exists
        const existingTeam = await teamRepo.findOne({
          where: {
            uuid: createdTeamUuid,
            deletedAt: IsNull()
          }
        });
        
        if (!existingTeam) {
          const team = new Team();
          team.uuid = createdTeamUuid;
          team.tournament_uuid = tournamentUuid;
          
          // Generate unique team name
          let teamNumber = currentTeams.length + 1;
          let teamName = `Team ${teamNumber}`;
          
          // Check if team name already exists and increment if needed
          const existingTeamWithName = await teamRepo.findOne({
            where: {
              name: teamName,
              tournament_uuid: tournamentUuid,
              deletedAt: IsNull()
            }
          });
          
          if (existingTeamWithName) {
            // Find the next available team number
            const usedNumbers = currentTeams
              .filter(t => t.name.startsWith('Team '))
              .map(t => {
                const match = t.name.match(/Team (\d+)/);
                return match ? parseInt(match[1]) : 0;
              })
              .sort((a, b) => b - a);
            
            teamNumber = usedNumbers.length > 0 ? usedNumbers[0] + 1 : currentTeams.length + 1;
            teamName = `Team ${teamNumber}`;
          }
          
          team.name = teamName;
          team.createdBy = 'admin';
          await tm.save(team);
        }
      }
    });

    return {
      message: "Team added successfully",
      status,
      teamUuid: createdTeamUuid
    };
  }

  async resetTournamentGroups(adminUuid:string, tournamentUuid: string, em: EntityManager) {
    const teamRepo = em.getRepository(Team);

    // Get current tournament to check the new total_group
    const tournamentRepo = em.getRepository(Tournament);
    const tournament = await tournamentRepo.findOne({ 
      where: { uuid: tournamentUuid },
      relations: ['groups']
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const currentGroups = tournament.groups?.filter(g => !g.deletedAt) || [];
    const currentGroupCount = currentGroups.length;
    const targetGroupCount = tournament.total_group || 0;

    if (targetGroupCount > currentGroupCount) {
      // Add more groups with alphabetical names
      const groupsToAdd = targetGroupCount - currentGroupCount;
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // Get all groups (including soft-deleted) to check for existing ones
      const allGroups = await em.getRepository(TournamentGroup).find({
        where: { tournament_uuid: tournamentUuid },
        withDeleted: true
      });
      
      const deletedGroups = allGroups.filter(g => g.deletedAt !== null);
      for (let i = 0; i < groupsToAdd; i++) {
        const desiredGroupName = "Group "+alphabet[currentGroupCount + i];
        
        // Check if there's a soft-deleted group with this name
        
        const existingDeletedGroup = deletedGroups.find(g => g.group_name === desiredGroupName);
        
        if (existingDeletedGroup) {
          // Restore the soft-deleted group
          existingDeletedGroup.deletedAt = null;
          existingDeletedGroup.deletedBy = null;
          existingDeletedGroup.updatedAt = new Date();
          await em.save(existingDeletedGroup);
        } else {
          // Create new group only if no existing one found
          const newGroup = new TournamentGroup();
          newGroup.group_uuid = uuidv4();
          newGroup.tournament_uuid = tournamentUuid;
          newGroup.group_name = desiredGroupName;
          newGroup.createdBy = adminUuid;
          newGroup.updatedAt = new Date();
          await em.save(newGroup);
        }
      }
    } else if (targetGroupCount < currentGroupCount) {
      // Soft delete excess groups based on highest group name
      const groupsToDelete = currentGroupCount - targetGroupCount;
      
      // Sort groups by group_name to identify the highest ones (alphabetical order)
      const sortedGroups = currentGroups.sort((a, b) => {
        const aName = a.group_name || '';
        const bName = b.group_name || '';
        return bName.localeCompare(aName); // Sort in descending alphabetical order
      });

      // Soft delete the highest groups
      for (let i = 0; i < groupsToDelete && i < sortedGroups.length; i++) {
        const groupToDelete = sortedGroups[i];
        groupToDelete.deletedAt = new Date();
        groupToDelete.deletedBy = adminUuid;
        await em.save(groupToDelete);

        // Reset team assignments for teams in the deleted groups
        await teamRepo.update(
          { group_uuid: groupToDelete.group_uuid },
          { group_uuid: null }
        );
      }
    }

    return {
      message: `Tournament groups adjusted successfully. Current groups: ${targetGroupCount}`,
      tournamentUuid,
      previousGroupCount: currentGroupCount,
      newGroupCount: targetGroupCount
    };
  }
}
