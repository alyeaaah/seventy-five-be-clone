import { Request, Response } from "express";
import { Container } from "typedi";
import { AppDataSource } from "../data-source";
import { Gallery } from "../entities/Gallery";
import { GalleryAlbum } from "../entities/GalleryAlbum";
import { v4 as uuidv4 } from "uuid";
import Util from "../lib/util.lib";
import { In, IsNull, Like, Not } from "typeorm";
import { GalleryTags } from "../entities/GalleryTags";
import { galleriesMediaSchema, galleryPlayersPayloadSchema } from "../schemas/gallery.schema";
import { Player } from "../entities/Player";
import { PlayerGallery } from "../entities/PlayerGallery";

export default class MediaController {
  async upload(req: Request, res: Response) {
    const cloudinary: any = Container.get("cloudinary");
    try {
      // Upload the image to Cloudinary
      const result = await cloudinary.uploader
        .upload_stream({ resource_type: "auto" }, (error: any, result: any) => {
          if (error) {
            console.log(error);
            
            return res
              .status(500)
              .json({ error: "Error uploading image to Cloudinary" });
          }

          // If successful, you can save the Cloudinary URL or other details in your database
          const imageUrl = result.secure_url;
          res.status(200).json({ imageUrl });
        })
        .end(req?.file?.buffer);
    } catch (error: any) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  }

  // Category

  async categoryList(req: any, res: any) {
    const utilLib = new Util();
    try {
      const mediaRepo = AppDataSource.getRepository(GalleryAlbum);
      let [data, totalRecords] = await mediaRepo.findAndCount({
        where: {
          deletedBy: undefined,
        },
      });
      return res.json({
        data,
        totalRecords,
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async categoryCreate(req: any, res: any) {
    const utilLib = new Util();
    const { name } = req.body;
    try {
      if(!name) {
        throw new Error("All fields are required!");
      }
      // check exists
      const mediaRepo = AppDataSource.getRepository(GalleryAlbum);
      const dataExists = await mediaRepo.findOneBy({ name });
      if (dataExists) {
        throw new Error("Category name already exists!");
      }
      const newData = new GalleryAlbum();
      newData.uuid = uuidv4();
      newData.name = name;
      const data = await mediaRepo.save(newData);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }


  // Media
  async list(req: any, res: any) {
    const utilLib = new Util();
    const { category_uuid } = req.query;
    try {
      const mediaRepo = AppDataSource.getRepository(Gallery);
      let where: any = {
        deletedBy: undefined,
      };
      if (category_uuid) {
        where.category_uuid = category_uuid;
      }
      
      let [data, totalRecords] = await mediaRepo.findAndCount({
        where,
      });
      return res.json({
        data,
        totalRecords,
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async listAlbums(req: any, res: any) {
    const utilLib = new Util();
    try {

      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "1");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const mediaRepo = AppDataSource.getRepository(GalleryAlbum);
      let [data, totalRecords] = await mediaRepo.findAndCount({
        where: {
          deletedBy: IsNull(),
          name: Like(`%${search}%`),
        },
        order: {
          createdAt: "DESC",
        },
        relations: {
          pinnedGallery: true,
          tournament: true,
          match: {
            away_team: true,
            home_team: true,
          },

        },
        skip: offset,
        take:limit
      });
      const result = data.map((d) => ({
        id: d.id,
        uuid: d.uuid,
        name: d.name,
        description: d.description,
        createdAt: d.createdAt,
        media: d.pinnedGallery ? {
          uuid: d.pinnedGallery.uuid,
          name: d.pinnedGallery.name,
          link: d.pinnedGallery.link,
          description: d.pinnedGallery.description,
        } : undefined,
        tournament: d.tournament ? {
          name: d.tournament?.name,
          description: d.tournament.description,
          start_date: d.tournament.start_date,
          end_date: d.tournament.end_date,
        } : undefined,
        match: d.match ? {
          round: d.match.round,
          seed_index: d.match.seed_index,
          youtube_url: d.match.youtube_url,
          home_team: d.match.home_team ? {
            name: d.match.home_team.name,
            alias: d.match.home_team.alias,
            uuid: d.match.home_team.uuid,
          } : undefined,
          away_team: d.match.away_team ? {
            name: d.match.away_team.name,
            alias: d.match.away_team.alias,
            uuid: d.match.away_team.uuid,
          } : undefined,
        } : undefined,
      }));
      const totalPages = Math.ceil(totalRecords / limit);
      utilLib.loggingRes(req, { data: result, totalRecords, totalPages, currentPage: page });
      return res.json({
        data : result,
        totalRecords,
        totalPages,
        currentPage: page,
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async createAlbum(req: any, res: any) {
    const utilLib = new Util();
    const {  name, description, galleries, tags} = req.body;
    try {
      if(!name || !description || !galleries) {
        throw new Error("All fields are required!");
      }
      const catRepo = await AppDataSource.getRepository(GalleryAlbum);
      const catData = await catRepo.findOneBy({ name: name, deletedAt: IsNull() });
      if (catData) {
        throw new Error("Album already exists!");
      }
      // create transaction
      await AppDataSource.transaction(async (transactionalEntityManager) => { 
        const newData = new GalleryAlbum();
        newData.uuid = uuidv4();
        newData.name = name;
        newData.description = description;
        newData.createdBy = req.data?.uuid || undefined;
        const savedAlbum = await transactionalEntityManager.save(newData);

        if (!!galleries?.length) {
          for (const gallery of galleries) {
            const newGallery = new Gallery();
            newGallery.uuid = uuidv4();
            newGallery.name = gallery.name;
            newGallery.link = gallery.link;
            newGallery.type = gallery.type;
            newGallery.description = gallery.description;
            newGallery.album_uuid = savedAlbum.uuid;
            newGallery.createdBy = req.data?.uuid || undefined;
            await transactionalEntityManager.save(newGallery);
            if (!!gallery.pinned) {
              savedAlbum.pinned_gallery_uuid = newGallery.uuid;
              await transactionalEntityManager.save(savedAlbum);
            }
          }
        }
        if (!!tags?.length) {
          for (const tag of tags) {
            const newTag = new GalleryTags();
            newTag.uuid = uuidv4();;
            newTag.gallery_album_uuid = savedAlbum.uuid;
            newTag.tag_uuid = tag.uuid;
            newTag.createdBy = req.data?.uuid || undefined;
            await transactionalEntityManager.save(newTag);
          }
        }

        const response = {
          message: "Album created successfully!",
          data: savedAlbum
        }
        utilLib.loggingRes(req, response);
        return res.json(response);
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateAlbum(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    const { name, description, tags, galleries} = req.body;
    try {
      if(!name || !description) {
        throw new Error("All fields are required!");
      }
      const catRepo = await AppDataSource.getRepository(GalleryAlbum);
      const catData = await catRepo.findOneBy({ name: name, uuid: Not(uuid), deletedAt: IsNull() });
      if (catData) {
        throw new Error("Album already exists!");
      }
      // create transaction
      await AppDataSource.transaction(async (transactionalEntityManager) => { 
        const updateAlbum = await catRepo.findOneBy({ uuid: uuid, deletedAt: IsNull() });
        if (!updateAlbum) {
          throw new Error("Album not found!");
        }
        updateAlbum.name = name;
        updateAlbum.description = description;
        const savedAlbum = await transactionalEntityManager.save(updateAlbum);
        if (!!galleries?.length) {
          for (const gallery of galleries) {
            if (!!gallery.is_delete) {
              const galleryRepo = AppDataSource.getRepository(Gallery);
              const galleryData = await galleryRepo.findOneBy({ uuid: gallery.uuid, deletedAt: IsNull() });
              if (!!galleryData) {
                galleryData.deletedAt = new Date();
                galleryData.deletedBy = req.data?.uuid || undefined;
                await transactionalEntityManager.save(galleryData);
              }
            } else if (!gallery.is_delete && !!gallery.uuid) { 
              const galleryRepo = AppDataSource.getRepository(Gallery);
              const galleryData = await galleryRepo.findOneBy({ uuid: gallery.uuid, deletedAt: IsNull() });
              if (!!galleryData) {
                galleryData.name = gallery.name;
                galleryData.link = gallery.link;
                galleryData.type = gallery.type;
                galleryData.description = gallery.description;
                galleryData.album_uuid = savedAlbum.uuid;
                await transactionalEntityManager.save(galleryData);
                if (!!gallery.pinned) {
                  updateAlbum.pinned_gallery_uuid = gallery.uuid;
                  await transactionalEntityManager.save(updateAlbum);
                }
              }
            } else { 
              const newGallery = new Gallery();
              newGallery.uuid = uuidv4();
              newGallery.name = gallery.name;
              newGallery.link = gallery.link;
              newGallery.type = gallery.type;
              newGallery.description = gallery.description;
              newGallery.album_uuid = savedAlbum.uuid;
              newGallery.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(newGallery);
              if (!!gallery.pinned) {
                updateAlbum.pinned_gallery_uuid = newGallery.uuid;
                await transactionalEntityManager.save(updateAlbum);
              }
            }
          }
        }
        if (!!tags?.length) {
          for (const tag of tags) {
            if (!!tag.is_delete) {
              const tagRepo = AppDataSource.getRepository(GalleryTags);
              const foundTag = await tagRepo.findOneBy({ uuid: tag.uuid });
              if (!!foundTag) {
                foundTag.deletedAt = new Date();
                foundTag.deletedBy = req.data?.uuid || undefined;
                await transactionalEntityManager.save(foundTag);
              }
            } else if (!tag.is_delete && !!tag.tag_uuid) { 
              // nothing to update
            } else {
              const newTag = new GalleryTags();
              newTag.uuid = uuidv4();;
              newTag.gallery_album_uuid = savedAlbum.uuid;
              newTag.tag_uuid = tag.tag_uuid;
              newTag.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(newTag);
            }
          }
        }
        const response = {
          message: "Album created successfully!",
          data: savedAlbum
        }
        utilLib.loggingRes(req, response);
        return res.json(response);
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async deleteAlbum(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const galleryAlbumRepo = AppDataSource.getRepository(GalleryAlbum);
      const newData = await galleryAlbumRepo.findOneBy({ uuid: uuid, deletedAt: IsNull() });
      if (!newData) {
        throw new Error("Album not found!");
      }
      newData.deletedAt = new Date();
      newData.deletedBy = req.data?.uuid || undefined;
      const savedAlbum = await galleryAlbumRepo.save(newData);
      const response = {
        message: "Album deleted successfully!",
        data: savedAlbum
      }
      utilLib.loggingRes(req, response);
      return res.json(response);
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async detailAlbum(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const galleryAlbumRepo = AppDataSource.getRepository(GalleryAlbum);
      const foundData = await galleryAlbumRepo.findOne({
        where: {
          uuid: uuid,
          deletedAt: IsNull(),
          galleries:{
            deletedAt: IsNull(),
            tags: {
              deletedAt: IsNull(),
              tag: {
                deletedAt: IsNull()
              }
            },
            playerGalleries: {
              deletedAt: IsNull(),
              player: {
                deletedAt: IsNull()
              }
            }
          },
          tags: {
            deletedAt: IsNull(), 
            tag: {
              deletedAt: IsNull()
            }
          }
        },
        relations: {
          galleries: {
            tags: {
              tag: true
            },
            playerGalleries: {
              player: true
            }
          },
          tags: {
            tag: true
          }
        }
      });
      if (!foundData) {
        throw new Error("Album not found!");
      }
      const response = {
        message: "Album details retrieved successfully!",
        data: {
          ...foundData,
          galleries: foundData.galleries?.map((gallery:any) => {
            return {
              ...gallery,
              playerGalleries: gallery.playerGalleries?.map((playerGallery: any) => ({
                ...playerGallery,
                player_name: playerGallery.player?.name,
                player_uuid: playerGallery.player?.uuid,
              }))
            }
          })
        }
      }
      utilLib.loggingRes(req, response);
      return res.json(response);
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateGalleryPlayers(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;

    const validatedBody = galleryPlayersPayloadSchema.safeParse(req.body);
    if (validatedBody.error) {
      return res.status(400).json({ message: "Invalid checkout data", errors: validatedBody.error?.issues.map((e:any) => e.path + ': ' + e.message) });
    }
    const body = validatedBody.data;
    
    try {
      const galleryRepo = AppDataSource.getRepository(Gallery);
      const playerRepo = AppDataSource.getRepository(Player);
      const playerGalleryRepo = AppDataSource.getRepository(PlayerGallery);
      const galleryData = await galleryRepo.findOneBy({ uuid: uuid, deletedAt: IsNull() });


      const playersCheck = await playerRepo.find({
        where: {
          uuid: In(body.players.map((player:any) => player.player_uuid)),
          deletedAt: IsNull()
        }
      });
      if(playersCheck.length !== body.players.length) {
        throw new Error("Some player(s) not found!");
      }

      if (!galleryData) {
        throw new Error("Gallery not found!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        const deletedPlayers = body.players.filter((player:any) => player.isDeleted);
        await entityManager.update(PlayerGallery, {
          gallery_uuid: uuid,
          player_uuid: In(deletedPlayers.map((player: any) => player.player_uuid))
        }, {
          deletedAt: new Date()
        });
        const nonDeletedPlayers = body.players.filter((player: any) => !player.isDeleted);
        const playerInGallery = await playerGalleryRepo.find({
          where: {
            gallery_uuid: uuid,
            player_uuid: In(nonDeletedPlayers.map((player: any) => player.player_uuid))
          }
        });
        const addedPlayers = nonDeletedPlayers.filter((player: any) => !playerInGallery.some((pg: any) => pg.player_uuid === player.player_uuid));
        await entityManager.insert(PlayerGallery, addedPlayers.map((player:any) => {
          return {
            uuid: uuidv4(),
            gallery_uuid: uuid,
            player_uuid: player.player_uuid,
            x_percent: player.x_percent ?? 0,
            y_percent: player.y_percent ?? 0,
            createdBy: req.data?.uuid || undefined
          }
        }));
        const updatedPlayer = nonDeletedPlayers.filter((player: any) => playerInGallery.some((pg: any) => pg.player_uuid === player.player_uuid));
        for (const player of updatedPlayer) {
          await entityManager.update(PlayerGallery, {
            gallery_uuid: uuid,
            player_uuid: player.player_uuid
          }, {
            x_percent: player.x_percent ?? 1,
            y_percent: player.y_percent ?? 2,
            updatedAt: new Date()
          });
        }
      });

      const response = {
        message: "Gallery updated successfully!",
      }
      utilLib.loggingRes(req, response);
      return res.json(response);
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async addPhoto(req: any, res: any) {
    const utilLib = new Util();
    const {  name, description, link, album_uuid, tournament_uuid, category_uuid, court_uuid, court_field_uuid, match_uuid, player_uuid } = req.body;
    try {
      if(!name || !link) {
        throw new Error("All fields are required!");
      }
      // create transaction
      await AppDataSource.transaction(async (transactionalEntityManager) => { 
        const newData = new Gallery();
        newData.uuid = uuidv4();
        newData.name = name;
        newData.description = description;
        newData.link = link;
        newData.album_uuid = album_uuid;
        newData.tournament_uuid = tournament_uuid;
        newData.category_uuid = category_uuid;
        newData.court_uuid = court_uuid;
        newData.court_field_uuid = court_field_uuid;
        newData.match_uuid = match_uuid;
        newData.player_uuid = player_uuid;
        newData.createdBy = req.data?.uuid || undefined;
        const savedGallery = await transactionalEntityManager.save(newData);
       
        const response = {
          message: "Gallery added successfully!",
          data: savedGallery
        }
        utilLib.loggingRes(req, response);
        return res.json(response);
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updatePhoto(req: any, res: any) {
    const utilLib = new Util();
    const {uuid} = req.params
    const {  name, description, link, album_uuid, tournament_uuid, category_uuid, court_uuid, court_field_uuid, match_uuid, player_uuid } = req.body;
    try {
      if(!name || !link) {
        throw new Error("All fields are required!");
      }
      // create transaction
      await AppDataSource.transaction(async (transactionalEntityManager) => { 
        const galleryRepo = AppDataSource.getRepository(Gallery);
        const newData = await galleryRepo.findOneBy({ uuid: uuid, deletedAt: IsNull() });
        if (!newData) {
          throw new Error("Gallery not found!");
        }
        newData.name = name;
        newData.description = description;
        newData.link = link;
        newData.album_uuid = album_uuid;
        newData.tournament_uuid = tournament_uuid;
        newData.category_uuid = category_uuid;
        newData.court_uuid = court_uuid;
        newData.court_field_uuid = court_field_uuid;
        newData.match_uuid = match_uuid;
        newData.player_uuid = player_uuid;
        const savedGallery = await transactionalEntityManager.save(newData);
       
        const response = {
          message: "Gallery updated successfully!",
          data: savedGallery
        }
        utilLib.loggingRes(req, response);
        return res.json(response);
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async deletePhoto(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const galleryRepo = AppDataSource.getRepository(Gallery);
      const newData = await galleryRepo.findOneBy({ uuid: uuid, deletedAt: IsNull() });
      if (!newData) {
        throw new Error("Gallery not found!");
      }
      newData.deletedAt = new Date();
      newData.deletedBy = req.data?.uuid || undefined;
      const savedGallery = await galleryRepo.save(newData);
      const response = {
        message: "Gallery deleted successfully!",
        data: savedGallery
      }
      utilLib.loggingRes(req, response);
      return res.json(response);
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async create(req: any, res: any) {
    const utilLib = new Util();
    const { category_uuid, link, name, type, description } = req.body;
    try {
      if(!category_uuid || !link || !name || !type) {
        throw new Error("All fields are required!");
      }

      if(!["photo", "video", "youtube"].includes(type)){
        throw new Error("Type should be photo, video or youtube!");
      }

      const catRepo = await AppDataSource.getRepository(GalleryAlbum);
      const catData = await catRepo.findOneBy({ uuid: category_uuid });
      if (!catData) {
        throw new Error("Category not found!");
      }

      const mediaRepo = AppDataSource.getRepository(Gallery);
      const newData = new Gallery();
      newData.name = name;
      newData.uuid = uuidv4();
      newData.category_uuid = category_uuid;
      newData.link = link;
      newData.type = type;
      newData.description = description;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await mediaRepo.save(newData);
      return res.json({ data });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async toggleFeatured(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const mediaRepo = AppDataSource.getRepository(Gallery);
      const data = await mediaRepo.findOneBy({ uuid, deletedAt: IsNull() });
      
      if (!data) throw new Error(`Media not found`);
      
      data.featured_at = !data.featured_at ? new Date() : null;
      
      await mediaRepo.save(data);
      utilLib.loggingRes(req, { message: "Media featured status toggled successfully" });
      return res.json({ message: "Media featured status toggled successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async listGalleryByPlayer(req: any, res: any) {
    const utilLib = new Util();
    const { limit, page} = req.query;
    try {
      const playerGalleryRepo = AppDataSource.getRepository(PlayerGallery);
      // use query builder to get featured media
      const data = await playerGalleryRepo.find({
        where: {
          player_uuid: req.data?.uuid || req.params.player_uuid || 0,
          deletedAt: IsNull()
        },
        relations: {
          gallery: true
        },
        take: limit,
        skip: (page - 1) * limit
      });
      const count = await playerGalleryRepo.count({
        where: {
          player_uuid: req.params.player_uuid,
          deletedAt: IsNull()
        }
      });
      const resultData = data.map((item) => {
        return galleriesMediaSchema.parse({
          ...item.gallery,
          player_uuid: item.player_uuid,
        })
      })
      utilLib.loggingRes(req, { data: resultData, count });  
      return res.json({ data: resultData, count });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async featured(req: any, res: any) {
    const utilLib = new Util();
    const { limit, page} = req.query;
    try {
      const mediaRepo = AppDataSource.getRepository(Gallery);
      // use query builder to get featured media
      const qbuilder = mediaRepo.createQueryBuilder("gallery");
      qbuilder.where("gallery.deletedAt IS NOT NULL");
      qbuilder.andWhere("(gallery.featured_at IS NOT NULL");
      qbuilder.andWhere("gallery.featured_at >= :featuredOn )", { featuredOn: new Date() });
      qbuilder.limit(limit);
      
      let [data, count] = await qbuilder.getManyAndCount();
      if (limit && data.length < limit) {
        qbuilder.orWhere("(gallery.featured_at IS NOT NULL)")
        qbuilder.limit(limit - data.length);
        const [newData, newCount ] = await qbuilder.getManyAndCount();
        data = [...data, ...newData];
        count = newCount;
      }
      if (limit && data.length < limit) {
        qbuilder.orWhere("gallery.featured_at IS NULL")
        qbuilder.orderBy("gallery.createdAt", "DESC")
        qbuilder.limit(limit - data.length);
        const [newData, newCount ] = await qbuilder.getManyAndCount();
        data = [...data, ...newData];
        count = newCount;
      }
      utilLib.loggingRes(req, { data, count });  
      return res.json({ data, count });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async publicDetailAlbum(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const galleryAlbumRepo = AppDataSource.getRepository(GalleryAlbum);
      const foundData = await galleryAlbumRepo.findOne({
        where: {
          uuid: uuid,
          deletedAt: IsNull(),
          galleries:{
            deletedAt: IsNull(),
            tags: {
              deletedAt: IsNull(),
              tag: {
                deletedAt: IsNull()
              }
            },
            playerGalleries: {
              deletedAt: IsNull(),
              player: {
                deletedAt: IsNull()
              }
            }
          },
          tags: {
            deletedAt: IsNull(), 
            tag: {
              deletedAt: IsNull()
            }
          }
        },
        relations: {
          galleries: {
            tags: {
              tag: true
            },
            playerGalleries: {
              player: true
            }
          },
          tags: {
            tag: true
          },
          author: true
        }
      });

      if (!foundData) {
        throw new Error("Album not found!");
      }
      const response = {
        message: "Album details retrieved successfully!",
        data: {
          ...foundData,
          author: foundData.author?.name
        }
      }
      utilLib.loggingRes(req, response);
      return res.json(response);
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicAlbums(req: any, res: any) {const utilLib = new Util();
    try {

      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "1");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const mediaRepo = AppDataSource.getRepository(GalleryAlbum);
      let [data, totalRecords] = await mediaRepo.findAndCount({
        where: {
          deletedBy: IsNull(),
          name: Like(`%${search}%`),
        },
        order: {
          createdAt: "DESC",
        },
        relations: {
          pinnedGallery: true,
          tournament: true,
          match: {
            away_team: true,
            home_team: true,
          },
          galleries: true,
          author: true
        },
        skip: offset,
        take:limit
      });
      const result = data.map((d) => ({
        id: d.id,
        uuid: d.uuid,
        name: d.name,
        description: d.description,
        createdAt: d.createdAt,
        media: d.pinnedGallery ? {
          uuid: d.pinnedGallery.uuid,
          name: d.pinnedGallery.name,
          link: d.pinnedGallery.link,
          description: d.pinnedGallery.description,
        } : undefined,
        tournament: d.tournament ? {
          name: d.tournament?.name,
          description: d.tournament.description,
          start_date: d.tournament.start_date,
          end_date: d.tournament.end_date,
        } : undefined,
        match: d.match ? {
          round: d.match.round,
          seed_index: d.match.seed_index,
          youtube_url: d.match.youtube_url,
          home_team: d.match.home_team ? {
            name: d.match.home_team.name,
            alias: d.match.home_team.alias,
            uuid: d.match.home_team.uuid,
          } : undefined,
          away_team: d.match.away_team ? {
            name: d.match.away_team.name,
            alias: d.match.away_team.alias,
            uuid: d.match.away_team.uuid,
          } : undefined,
        } : undefined,
        galleries: d.galleries,
        author: d.author?.name
      }));
      const totalPages = Math.ceil(totalRecords / limit);
      utilLib.loggingRes(req, { data: result, totalRecords, totalPages, currentPage: page });
      return res.json({
        data : result,
        totalRecords,
        totalPages,
        currentPage: page,
      });
    } catch (error:any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
