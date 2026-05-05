import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { TournamentEvent } from "../entities/TournamentEvent";
import { Tournament } from "../entities/Tournament";
import { statusTournamentEventEnum } from "../entities/TournamentEvent";
import {
  tournamentEventCreatePayloadSchema,
  tournamentEventUpdatePayloadSchema,
  tournamentEventListQuerySchema
} from "../schemas/tournamentEvent.schema";
import { DraftPick, DraftPickStatus } from "../entities/DraftPick";
import { IsNull } from "typeorm";

export default class TournamentEventController {
  async list(req: Request, res: Response) {
    try {
      // Validate query parameters
      const queryValidation = tournamentEventListQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: queryValidation.error.errors
        });
      }

      const { page, limit, search, status, published } = queryValidation.data;
      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      
      // Build query
      const queryBuilder = tournamentEventRepo.createQueryBuilder("tournament_event")
        .leftJoinAndSelect("tournament_event.tournaments", "tournament");
      
      if (search) {
        queryBuilder.andWhere("tournament_event.name LIKE :search", { search: `%${search}%` });
      }
      
      if (status) {
        queryBuilder.andWhere("tournament_event.status = :status", { status });
      }
      
      // Add published_at filter for published events
      if (published === "true") {
        queryBuilder.andWhere("tournament_event.published_at IS NOT NULL");
      } else if (published === "false") {
        queryBuilder.andWhere("tournament_event.published_at IS NULL");
      }
      
      queryBuilder.orderBy("tournament_event.created_at", "DESC");
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [tournamentEvents, total] = await queryBuilder.getManyAndCount();
                              
      return res.json({
        success: true,
        data: tournamentEvents.map((event) => ({
          ...event,
          commitment_fee: event.commitment_fee ? Number(event.commitment_fee || "0") : null
        })),
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        message: "Tournament events retrieved successfully"
      });
    } catch (error) {
      console.error("Error fetching tournament events:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tournament events"
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      // Validate payload
      const payloadValidation = tournamentEventCreatePayloadSchema.safeParse(req.body);
      if (!payloadValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request body",
          errors: payloadValidation.error.errors
        });
      }

      const { name, description, rules, commitment_fee, status, published_at, media_url } = payloadValidation.data;
      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      
      const tournamentEvent = new TournamentEvent();
      tournamentEvent.name = name;
      tournamentEvent.description = description || "";
      tournamentEvent.rules = rules || "";
      tournamentEvent.commitment_fee = commitment_fee || 0;
      tournamentEvent.status = status as any || statusTournamentEventEnum.DRAFT;
      tournamentEvent.published_at = published_at ? new Date(published_at) : null;
      tournamentEvent.media_url = media_url || undefined;
      tournamentEvent.created_by = (req as any).user?.uuid;

      const savedEvent = await tournamentEventRepo.save(tournamentEvent);

      return res.status(201).json({
        success: true,
        data: savedEvent,
        message: "Tournament event created successfully"
      });
    } catch (error) {
      console.error("Error creating tournament event:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create tournament event"
      });
    }
  }

  async detail(req: Request, res: Response) {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({
          success: false,
          message: "UUID is required"
        });
      }

      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      const dpRepo = AppDataSource.getRepository(DraftPick);
      
      const tournamentEvent = await tournamentEventRepo.findOne({
        where: { uuid },
        relations: {
          tournaments: {
            league:true
          }
        }
      });

      if (!tournamentEvent) {
        return res.status(404).json({
          success: false,
          message: "Tournament event not found"
        });
      }
      tournamentEvent.commitment_fee = Number(tournamentEvent.commitment_fee || "0");
      
        const [requested, approved] = await Promise.all([
          dpRepo.find({
            where: {
              tournament_event_uuid: tournamentEvent.uuid,
              status: DraftPickStatus.REQUESTED,
              deletedAt: IsNull()
            }
          }),
          dpRepo.find({
            where: {
              tournament_event_uuid: tournamentEvent.uuid,
              status: DraftPickStatus.APPROVED,
              deletedAt: IsNull()
            }
          })
        ]);
        
      
      const result = {
        ...tournamentEvent,
        tournaments: tournamentEvent.tournaments?.map(t => ({
          ...t,
          counter: {
            requested: requested.filter(dp => dp.tournament_uuid === t.uuid).length,
            approved: approved.filter(dp => dp.tournament_uuid === t.uuid).length
          }
        }))
      };
      return res.json({
        success: true,
        data: result,
        message: "Tournament event retrieved successfully"
      });
    } catch (error) {
      console.error("Error fetching tournament event:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tournament event"
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({
          success: false,
          message: "UUID is required"
        });
      }

      // Validate payload
      const payloadValidation = tournamentEventUpdatePayloadSchema.safeParse(req.body);
      if (!payloadValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request body",
          errors: payloadValidation.error.errors
        });
      }

      const { name, description, rules, commitment_fee, status, published_at, media_url } = payloadValidation.data;
      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      
      const tournamentEvent = await tournamentEventRepo.findOne({
        where: { uuid }
      });

      if (!tournamentEvent) {
        return res.status(404).json({
          success: false,
          message: "Tournament event not found"
        });
      }

      // Update fields
      if (name !== undefined) tournamentEvent.name = name;
      if (description !== undefined) tournamentEvent.description = description;
      if (rules !== undefined) tournamentEvent.rules = rules;
      if (commitment_fee !== undefined) tournamentEvent.commitment_fee = commitment_fee;
      if (status !== undefined) tournamentEvent.status = status as any;
      if (published_at !== undefined) tournamentEvent.published_at = published_at ? new Date(published_at) : null;
      if (media_url !== undefined) tournamentEvent.media_url = media_url;
      tournamentEvent.updated_by = (req as any).user?.uuid;

      const updatedEvent = await tournamentEventRepo.save(tournamentEvent);

      return res.json({
        success: true,
        data: updatedEvent,
        message: "Tournament event updated successfully"
      });
    } catch (error) {
      console.error("Error updating tournament event:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update tournament event"
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({
          success: false,
          message: "UUID is required"
        });
      }

      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      
      const tournamentEvent = await tournamentEventRepo.findOne({
        where: { uuid }
      });

      if (!tournamentEvent) {
        return res.status(404).json({
          success: false,
          message: "Tournament event not found"
        });
      }

      // Note: TournamentEvent entity doesn't have deletedAt field for soft delete
      // This would need to be added to the entity if soft delete functionality is required
      // For now, we'll just remove the record
      await tournamentEventRepo.remove(tournamentEvent);

      return res.json({
        success: true,
        message: "Tournament event deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting tournament event:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete tournament event"
      });
    }
  }

  async assignTournamentEvent(req: Request, res: Response) {
    try {
      const { tournament_uuid, tournament_event_uuid } = req.body;
      
      if (!tournament_uuid || !tournament_event_uuid) {
        return res.status(400).json({
          success: false,
          message: "Tournament UUID and Tournament Event UUID are required"
        });
      }

      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      
      // Find the tournament
      const tournament = await tournamentRepo.findOne({
        where: { uuid: tournament_uuid }
      });

      if (!tournament) {
        return res.status(400).json({
          success: false,
          message: "Tournament not found"
        });
      }

      // Find the tournament event
      const tournamentEvent = await tournamentEventRepo.findOne({
        where: { uuid: tournament_event_uuid }
      });

      if (!tournamentEvent) {
        return res.status(404).json({
          success: false,
          message: "Tournament event not found"
        });
      }

      // Assign tournament event to tournament
      tournament.tournament_event_uuid = tournament_event_uuid;
      tournament.updatedBy = (req as any).user?.uuid;

      const updatedTournament = await tournamentRepo.save(tournament);

      return res.json({
        success: true,
        data: updatedTournament,
        message: "Tournament assigned to tournament event successfully"
      });
    } catch (error) {
      console.error("Error assigning tournament to tournament event:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to assign tournament to tournament event"
      });
    }
  }

  async publicList(req: Request, res: Response) {
    try {
      // Validate query parameters
      const queryValidation = tournamentEventListQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: queryValidation.error.errors
        });
      }

      const { page, limit, search, status, published } = queryValidation.data;
      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      
      // Build query for public events - only show published events
      const queryBuilder = tournamentEventRepo.createQueryBuilder("tournament_event")
        .leftJoinAndSelect("tournament_event.tournaments", "tournament")
        .where("tournament_event.published_at IS NOT NULL");
      
      if (search) {
        queryBuilder.andWhere("tournament_event.name LIKE :search", { search: `%${search}%` });
      }
      
      if (status) {
        queryBuilder.andWhere("tournament_event.status = :status", { status });
      }
      
      // For public API, only show published events
      if (published === "false") {
        return res.status(400).json({
          success: false,
          message: "Cannot access unpublished events"
        });
      }
      
      queryBuilder.orderBy("tournament_event.published_at", "DESC");
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [tournamentEvents, total] = await queryBuilder.getManyAndCount();

      return res.json({
        success: true,
        data: tournamentEvents.map((event) => ({
          ...event,
          commitment_fee: event.commitment_fee ? Number(event.commitment_fee || "0") : null,
          tournaments: event.tournaments?.map((tournament) => ({
            ...tournament,
            commitment_fee: tournament.commitment_fee ? Number(tournament.commitment_fee.toString()) : null
          }))
        })),
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        message: "Tournament events fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching public tournament events:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tournament events"
      });
    }
  }

  async publicDetail(req: any, res: Response) {
    try {
      const { uuid } = req.params;
      const playerUuid = req.data?.uuid || req.user?.uuid;
      
      if (!uuid) {
        return res.status(400).json({
          success: false,
          message: "UUID is required"
        });
      }

      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      const dpRepo = AppDataSource.getRepository(DraftPick);
      
      const tournamentEvent = await tournamentEventRepo.findOne({
        where: { uuid },
        relations: {
          tournaments: {
            court: {
              fields: true
            },
            level: true,
            rules: true,
            draft_picks: true
          },
          
        }
      });

      if (!tournamentEvent) {
        return res.status(404).json({
          success: false,
          message: "Tournament event not found"
        });
      }
      
      // Only allow access to published events
      if (!tournamentEvent.published_at) {
        return res.status(404).json({
          success: false,
          message: "Tournament event not found"
        });
      }
      
      const result = {
        ...tournamentEvent,
        commitment_fee: Number(tournamentEvent.commitment_fee || "0"),
        tournaments: tournamentEvent.tournaments?.map( tournament => {
          return ({
            ...tournament,
            commitment_fee: parseInt(Number(tournament.commitment_fee || 0).toString()),
            court: tournament.court?.name,
            level: tournament.level?.name,
            court_info: tournament.court,
            join_status: playerUuid && tournament.draft_picks?.find(dp => dp.player_uuid === playerUuid) ? tournament.draft_picks?.filter(dp => dp.player_uuid === playerUuid).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.status : null
            })
          }
        ),
      };
      
      
      return res.json({
        success: true,
        data: result,
        message: "Tournament event fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching public tournament event:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tournament event"
      });
    }
  }

  async checkQuota(req: Request, res: Response) {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({
          success: false,
          message: "UUID is required"
        });
      }

      const tournamentEventRepo = AppDataSource.getRepository(TournamentEvent);
      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const draftPickRepo = AppDataSource.getRepository(DraftPick);
      
      // Find tournament event with its tournaments
      const tournamentEvent = await tournamentEventRepo.findOne({
        where: { uuid },
        relations: {
          tournaments: {
            draft_picks: true
          }
        }
      });

      if (!tournamentEvent) {
        return res.status(404).json({
          success: false,
          message: "Tournament event not found"
        });
      }

      // Check quota for each tournament in the event
      const quotaInfo = [];
      for (const tournament of tournamentEvent.tournaments || []) {
        const maxPlayers = tournament.max_player || 0;
        const currentRegistrations = tournament.draft_picks?.filter(
          dp => dp.status !== 'REJECTED'
        ).length || 0;
        
        // Check early bird status
        const now = new Date();
        const isEarlyBird = tournament.early_bird_start_date && 
                           tournament.early_bird_end_date && 
                           currentRegistrations < (tournament.early_bird_limit || 0) &&
                           now >= tournament.early_bird_start_date && 
                           now <= tournament.early_bird_end_date;
        
        // Calculate early bird quota
        const earlyBirdRegistrations = isEarlyBird ? 
          tournament.draft_picks?.filter(
            dp => dp.status !== 'REJECTED' && 
            dp.commitment_fee == (tournament.early_bird_price || 0) && 
              dp.createdAt <= tournament.early_bird_end_date! &&
              dp.createdAt >= tournament.early_bird_start_date!
          ).length || 0 : 0;
        
        const remainingEarlyBirdQuota = isEarlyBird ? 
          Math.max(0, (tournament.early_bird_limit || 0) - earlyBirdRegistrations) : 0;
        
        // Calculate remaining quota
        const remainingQuota = Math.max(0, maxPlayers - currentRegistrations);
        
        // Check if user has joined (if user info is available)
        const playerUuid = (req as any).user?.uuid || (req as any).data?.uuid;
        const hasJoined = playerUuid ? 
          tournament.draft_picks?.some(dp => dp.player_uuid === playerUuid && dp.status !== 'REJECTED') || false : false;

        quotaInfo.push({
          tournament_uuid: tournament.uuid,
          is_early_bird: isEarlyBird,
          remaining_quota_early_bird: remainingEarlyBirdQuota,
          has_joined: hasJoined,
          remaining_quota: remainingQuota
        });
      }

      return res.json({
        success: true,
        data: quotaInfo,
        message: "Tournament event quota retrieved successfully"
      });
    } catch (error) {
      console.error("Error checking tournament event quota:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to check tournament event quota"
      });
    }
  }
}
