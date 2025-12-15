

import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { BlogContent, ContentStatus } from "../entities/BlogContents";
import { BlogContentTag } from "../entities/BlogContentTags";
import { Gallery } from "../entities/Gallery";
import RedisLib from "../lib/redis.lib";

export default class BlogContentController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { title, content, category_uuid, status, tags, image_cover  } = req.body;
    try {
      if (!title || !content || !image_cover) {
        throw new Error("Title and content are required!");
      }

      // Check if blog title already exists
      const blogRepo = AppDataSource.getRepository(BlogContent);
      const dataExists = await blogRepo.findOneBy({ title, deletedBy: IsNull() });
      if (dataExists) {
        throw new Error("Blog title already exists!");
      }
      // create transaction from appdatasource
      await AppDataSource.transaction(async (entityManager) => { 

        const newBlog = new BlogContent();
        newBlog.uuid = uuidv4();
        newBlog.title = title;
        newBlog.content = content;
        newBlog.category_uuid = category_uuid || null;
        newBlog.status = status || ContentStatus.DRAFT;
        newBlog.createdBy = req.data?.uuid || undefined;
        const savedContent = await entityManager.save(newBlog);

        if (tags && tags.length > 0) {
          for (const tag of tags) {
            const newTag = new BlogContentTag();
            newTag.uuid = uuidv4();
            newTag.content_uuid = savedContent.uuid;
            newTag.tag_uuid = tag.tag_uuid;
            newTag.createdBy = req.data?.uuid || undefined;
            await entityManager.save(newTag);
          }
        }
        
        if (image_cover) {
          const newImage = new Gallery();
          newImage.uuid = uuidv4();
          newImage.blog_uuid = savedContent.uuid || "";
          newImage.name = title;
          newImage.link = image_cover;
          newImage.createdBy = req.data?.uuid || undefined;
          await entityManager.save(newImage);
        }

        utilLib.loggingRes(req, { data: savedContent, message:"Blog post created successfully" });
        return res.json({ data: savedContent, message:"Blog post created successfully" });
      });
        
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async list(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "";
      
      const blogRepo = AppDataSource.getRepository(BlogContent);
      const queryBuilder = blogRepo
        .createQueryBuilder("blog")
        .leftJoinAndSelect("blog.tags", "tags")
        .leftJoinAndSelect("tags.tag", "tag")
        .leftJoinAndSelect("blog.galleries", "gallery")
        .leftJoinAndSelect("blog.author", "author")
        .where("blog.title LIKE :search", { search: `%${search}%` })
        .andWhere("blog.deletedBy IS NULL")
        .andWhere("tags.deletedBy IS NULL")
        .andWhere("tag.deletedBy IS NULL")
        .andWhere("gallery.deletedBy IS NULL");

      if (status) {
        queryBuilder.andWhere("blog.status = :status", { status });
      }

      queryBuilder
        .orderBy("blog.createdAt", "DESC")
        .skip(offset)
        .take(limit);

      const [data, totalRecords] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(totalRecords / limit);

      const resultData = data.map((blog) => ({
        ...blog,
        image_cover: blog.galleries?.[0]?.link || null,
        tags: blog.tags?.map((tag) => ({
          name: tag.tag?.name || "",
          tag_uuid: tag.tag?.uuid || "",
          uuid: tag.uuid || "",
        })) || [],
        author: blog.author?.name || null
      }));
    
      utilLib.loggingRes(req, { data: resultData });
      return res.json({
        data: resultData,
        totalRecords,
        totalPages,
        currentPage: page,
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async detail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const blogRepo = AppDataSource.getRepository(BlogContent);
      const data = await blogRepo.findOne({
        where: {
          uuid, deletedBy: IsNull(), tags: {
            deletedAt: IsNull(), tag: {
              deletedAt: IsNull()
            }
          },
          galleries: {
            deletedBy: IsNull()
          },
        },
        relations: {
          tags: {
            tag: true
          },
          author: true,
          galleries: true
        }
      });
      
      if (!data) throw new Error(`Blog content not found`);
      
      // Increment read count
      if (data.status === ContentStatus.PUBLISHED) {
        data.read = (data.read || 0) + 1;
        await blogRepo.save(data);
      }
      const resultData = {
        ...data,
        image_cover: data.galleries?.[0]?.link || null,
        tags: data.tags?.map((tag) => ({
          name: tag.tag?.name || "",
          tag_uuid: tag.tag?.uuid || "",
          uuid: tag.uuid || "",
        })) || [],
        author: data.author?.name || null
      }
      utilLib.loggingRes(req, { data: resultData, message:"Blog retrieved successfully" });
      return res.json({ data: resultData, message:"Blog retrieved successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async update(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { title, content, category_uuid, status, tags, image_cover } = req.body;
    try {
      const blogRepo = AppDataSource.getRepository(BlogContent);
      
      // Check if title already exists (excluding current blog)
      if (title) {
        const titleExist = await blogRepo.findOneBy({ 
          title, 
          uuid: Not(uuid), 
          deletedBy: IsNull()
        });
        if (titleExist) throw new Error("Blog title already exists!");
      }

      await AppDataSource.transaction(async (entityManager) => { 
        const data = await blogRepo.findOneBy({ uuid, deletedBy: IsNull() });
        if (!data) throw new Error(`Blog content not found`);

        data.title = title || data.title;
        data.content = content || data.content;
        data.category_uuid = category_uuid || data.category_uuid;
        data.status = status || data.status;
        data.updatedBy = req.data?.uuid || undefined;
      
        const savedContent = await entityManager.save(data);

        if (tags && tags.length > 0) {
          const tagRepo = AppDataSource.getRepository(BlogContentTag);
          for (const tag of tags) {
            if (!!tag.is_delete) {
              const tagData = await tagRepo.findOneBy({ content_uuid: savedContent.uuid, tag_uuid: tag.tag_uuid, deletedBy: IsNull() });
              if (!tagData) throw new Error(`Tag not found`);
              tagData.deletedBy = req.data?.uuid || undefined;
              tagData.deletedAt = new Date();
              await entityManager.save(tagData);
            } else if (!tag.is_delete && !!tag.uuid) {
              // do nothing bcs tag is not updated
            } else {
              const newTag = new BlogContentTag();
              newTag.uuid = uuidv4();
              newTag.content_uuid = savedContent.uuid;
              newTag.tag_uuid = tag.tag_uuid;
              newTag.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newTag);
            }
          }
        }

        if (image_cover) {
          const galleryRepo = AppDataSource.getRepository(Gallery);
          const existingImage = await galleryRepo.findOneBy({ blog_uuid: savedContent.uuid, deletedBy: IsNull() });
          if (existingImage) {
            if (existingImage.link != image_cover) {
              existingImage.link = image_cover;
              await entityManager.save(existingImage);
            }
          } else {
            const newImage = new Gallery();
            newImage.uuid = uuidv4();
            newImage.blog_uuid = savedContent.uuid || "";
            newImage.link = image_cover;
            newImage.createdBy = req.data?.uuid || undefined;
            await entityManager.save(newImage);
          }
        }

        utilLib.loggingRes(req, { data: savedContent , message:"Blog post updated successfully"});
          return res.json({ data: savedContent , message:"Blog post updated successfully"});
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async publish(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { unpublish } = req.body;
    try {
      const blogRepo = AppDataSource.getRepository(BlogContent);
      const data = await blogRepo.findOneBy({ uuid, deletedBy: IsNull() });
      
      if (!data) throw new Error(`Blog content not found`);
      if (data.status === ContentStatus.PUBLISHED && !unpublish) {
        throw new Error("Blog is already published");
      }
      data.status = unpublish ? ContentStatus.DRAFT : ContentStatus.PUBLISHED;
      data.updatedBy = req.data?.uuid || undefined;
      
      await blogRepo.save(data);
      utilLib.loggingRes(req, { message: "Blog post published successfully" });
      return res.json({ message: "Blog post published successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const blogRepo = AppDataSource.getRepository(BlogContent);
      const data = await blogRepo.findOneBy({ uuid, deletedBy: IsNull() });
      
      if (!data) throw new Error(`Blog content not found`);
      
      data.deletedBy = req.data?.uuid || undefined;
      data.updatedAt = new Date();
      
      await blogRepo.save(data);
      utilLib.loggingRes(req, { message: "Blog deleted successfully" });
      return res.json({ message: "Blog deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async toggleFeatured(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const blogRepo = AppDataSource.getRepository(BlogContent);
      const data = await blogRepo.findOneBy({ uuid, deletedBy: IsNull() });
      
      if (!data) throw new Error(`Blog content not found`);
      
      data.featured_at = data.featured_at ? null : new Date();
      data.updatedBy = req.data?.uuid || undefined;
      
      await blogRepo.save(data);
      utilLib.loggingRes(req, { message: "Blog featured status toggled successfully" });
      return res.json({ message: "Blog featured status toggled successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async featured(req: any, res: any) {
    const utilLib = Util.getInstance();
    const redisLib = RedisLib.getInstance();
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const redisKey = `blog-list-home-${page}-${limit}-${search}`;
      const cachedData = await redisLib.redisget(redisKey);
      
      if (cachedData) {
        utilLib.loggingRes(req, { cachedData });
        return res.json(cachedData);
      }

      const blogRepo = AppDataSource.getRepository(BlogContent);
      const queryBuilder = blogRepo
        .createQueryBuilder("blog")
        .leftJoinAndSelect("blog.tags", "tags")
        .leftJoinAndSelect("tags.tag", "tag")
        .leftJoinAndSelect("blog.author", "author")
        .leftJoinAndSelect("blog.galleries", "gallery")
        .where("blog.title LIKE :search", { search: `%${search}%` })
        .andWhere("blog.status = :status", { status: ContentStatus.PUBLISHED })
        .andWhere("blog.createdAt >= :date", { date: new Date(new Date().setDate(new Date().getDate() - 60)) })
        .andWhere("blog.featured_at >= :date", { date: new Date(new Date().setDate(new Date().getDate() - 60)) })
        .andWhere("tags.deletedBy IS NULL")
        .andWhere("tag.deletedBy IS NULL")
        .andWhere("blog.deletedBy IS NULL")
        .orderBy("blog.read", "DESC")
        .skip(offset)
        .take(limit);
      
      let [data, totalRecords] = await queryBuilder.getManyAndCount();
      if (!data) throw new Error(`Blog content not found`);
      if (data.length < limit) {
        const [newData, newTotalRecords] = await queryBuilder
          .orWhere("blog.featured_at IS NULL")
          .orWhere("blog.featured_at IS NOT NULL")
          .orWhere("blog.createdAt IS NULL")
          .orWhere("blog.createdAt IS NOT NULL")
          .getManyAndCount();
        data.push(...newData);
        totalRecords += newTotalRecords;
      }
      const totalPages = Math.ceil(totalRecords / limit);

      const resultData = data.map((blog) => ({
        ...blog,
        image_cover: blog.galleries?.[0]?.link || null,
        tags: blog.tags?.map((tag) => ({
          name: tag.tag?.name || "",
          tag_uuid: tag.tag?.uuid || "",
          uuid: tag.uuid || "",
        })) || [],
        author: blog.author?.name || ""
      }));
      const result = {
        data: resultData,
        totalRecords,
        totalPages,
        currentPage: page,
      }
      // redisset with 1 day expiration
      await redisLib.redisset(redisKey, {...result, cache: true}, 60 * 60 * 12);
      utilLib.loggingRes(req, result);
      return res.json(result);
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async publicDetail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const blogRepo = AppDataSource.getRepository(BlogContent);
      const data = await blogRepo.findOne({
        where: {
          uuid, deletedBy: IsNull(), tags: {
            deletedAt: IsNull(), tag: {
              deletedAt: IsNull()
            }
          },
          galleries: {
            deletedBy: IsNull()
          },
        },
        relations: {
          tags: {
            tag: true
          },
          author: true,
          galleries: true
        }
      });
      
      if (!data) throw new Error(`Blog content not found`);
      
      // Increment read count
      if (data.status === ContentStatus.PUBLISHED) {
        data.read = (data.read || 0) + 1;
        await blogRepo.save(data);
      }
      const resultData = {
        ...data,
        image_cover: data.galleries?.[0]?.link || null,
        tags: data.tags?.map((tag) => ({
          name: tag.tag?.name || "",
          tag_uuid: tag.tag?.uuid || "",
          uuid: tag.uuid || "",
        })) || [],
        author: data.author?.name || null
      }
      utilLib.loggingRes(req, { data: resultData, message:"Blog retrieved successfully" });
      return res.json({ data: resultData, message:"Blog retrieved successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}