import { MerchProduct, ProductStatus } from "../entities/MerchProducts";
import { MerchProductDetail } from "../entities/MerchProductDetail";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Not } from "typeorm";
import { Gallery } from "../entities/Gallery";
import { MerchCategory } from "../entities/MerchCategory";

export default class ProductController {

  async create(req: any, res: any) {
    const utilLib = new Util();
    const { name, description, media_url, unit, details, galleries } = req.body;
    try {
      if (!name || !description || !unit) {
        throw new Error("Name, description and unit are required!");
      }

      // Check if product name already exists
      const merchRepo = AppDataSource.getRepository(MerchProduct);
      const dataExists = await merchRepo.findOneBy({ name, deletedBy: IsNull() });
      if (dataExists) {
        throw new Error("Product name already exists!");
      }
      // create transactional insert
      await AppDataSource.transaction(async (entityManager) => {
        const newProduct = new MerchProduct();
        newProduct.uuid = uuidv4();
        newProduct.name = name;
        newProduct.description = description;
        newProduct.media_url = media_url || null;
        newProduct.unit = unit;
        newProduct.status = ProductStatus.ACTIVE;
        newProduct.createdBy = req.data?.uuid || undefined;
        const data = await entityManager.save(newProduct);

        if (details && details.length > 0) {
          const detailsData = details.map((detail: any) => {
            const newDetail = new MerchProductDetail();
            newDetail.uuid = uuidv4();
            newDetail.product_uuid = data.uuid;
            newDetail.size = detail.size;
            newDetail.price = detail.price;
            newDetail.quantity = detail.quantity;
            newDetail.createdBy = req.data?.uuid || undefined;
            return newDetail;
          });
          await entityManager.save(detailsData);
        }

        if (galleries && galleries.length > 0) {
          for (const gallery of galleries) {
            const newGallery = new Gallery();
            newGallery.uuid = uuidv4();
            newGallery.product_uuid = data.uuid;
            newGallery.link = gallery.link;
            newGallery.name = gallery.name;
            newGallery.createdBy = req.data?.uuid || undefined;
            await entityManager.save(newGallery);
            if (gallery.pinned) {
              newProduct.pinned_image_uuid = newGallery.uuid;
              await entityManager.save(newProduct);
            }
          }
        }


        utilLib.loggingRes(req, { data, message: "Product created successfully" });
        return res.json({ data, message: "Product created successfully" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async list(req: any, res: any) {
    const utilLib = new Util();
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const unit = (req.query.unit as string) || "";

      const merchRepo = AppDataSource.getRepository(MerchProduct);
      const queryBuilder = merchRepo
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.details", "details")
        .leftJoinAndSelect("product.galleries", "galleries")
        .leftJoinAndSelect("product.pinnedImage", "pinnedImage")
        .where("product.name LIKE :search", { search: `%${search}%` })
        .andWhere("product.deletedBy IS NULL");

      if (unit) {
        queryBuilder.andWhere("product.unit = :unit", { unit });
      }

      queryBuilder
        .orderBy("product.createdAt", "DESC")
        .skip(offset)
        .take(limit);
      const [data, totalRecords] = await queryBuilder.getManyAndCount();
      const resultData = data.map((product) => ({
        ...product,
        image_cover: product.pinnedImage?.link || null,
        galleries: product.galleries?.map((gallery) => ({
          uuid: gallery.uuid,
          link: gallery.link,
          name: gallery.name
        })) || [],
      }));
      const totalPages = Math.ceil(totalRecords / limit);

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
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const merchRepo = AppDataSource.getRepository(MerchProduct);
      const data = await merchRepo.findOne({
        where: {
          uuid, deletedBy: IsNull(),
          details: { deletedBy: IsNull() },
          galleries: { deletedBy: IsNull() },
          pinnedImage: { deletedBy: IsNull() }
        },
        relations: {
          details: true,
          galleries: true,
          pinnedImage: true
        }
      });

      if (!data) throw new Error(`Product not found`);
      const resultData = {
        ...data,
        image_cover: data?.pinnedImage?.link || null,
        galleries: data.galleries?.map((gallery) => ({
          uuid: gallery.uuid,
          link: gallery.link,
          name: gallery.name
        })) || [],
      };
      utilLib.loggingRes(req, { data: resultData, message: "Product detail" });
      return res.json({ data: resultData, message: "Product detail" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async update(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    const { name, description, media_url, unit, details, galleries } = req.body;
    try {
      const merchRepo = AppDataSource.getRepository(MerchProduct);

      // Check if name already exists (excluding current product)
      if (name) {
        const nameExist = await merchRepo.findOneBy({
          name,
          uuid: Not(uuid),
          deletedBy: IsNull()
        });
        if (nameExist) throw new Error("Product name already exists!");
      }
      // update transactional 
      await AppDataSource.transaction(async (entityManager) => {
        const data = await merchRepo.findOneBy({ uuid, deletedBy: IsNull() });
        if (!data) throw new Error(`Product not found`);

        data.name = name || data.name;
        data.description = description || data.description;
        data.media_url = media_url || data.media_url;
        data.unit = unit || data.unit;
        data.updatedBy = req.data?.uuid || undefined;
        const savedData = await entityManager.save(data);

        if (details && details.length > 0) {
          const detailRepo = AppDataSource.getRepository(MerchProductDetail);
          for (const detail of details) {
            if (!!detail.is_delete) {
              const detailData = await detailRepo.findOneBy({ uuid: detail.uuid, deletedBy: IsNull() });
              if (!detailData) throw new Error(`Product detail not found`);
              detailData.deletedBy = req.data?.uuid || undefined;
              await entityManager.save(detailData);
            } else if (!detail.is_delete && !!detail.uuid) {
              const detailData = await detailRepo.findOneBy({ uuid: detail.uuid, deletedBy: IsNull() });
              if (!detailData) throw new Error(`Product detail not found`);
              detailData.size = detail.size;
              detailData.price = detail.price;
              detailData.quantity = detail.quantity;
              detailData.updatedBy = req.data?.uuid || undefined;
              await entityManager.save(detailData);
            }
            else {
              const newDetail = new MerchProductDetail();
              newDetail.uuid = uuidv4();
              newDetail.product_uuid = savedData.uuid;
              newDetail.size = detail.size;
              newDetail.price = detail.price;
              newDetail.quantity = detail.quantity;
              newDetail.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newDetail);
            }
          }
        }
        if (galleries && galleries.length > 0) {
          const galleryRepo = AppDataSource.getRepository(Gallery);
          for (const gallery of galleries) {
            if (!!gallery.is_delete) {
              const galleryData = await galleryRepo.findOneBy({ uuid: gallery.uuid, deletedBy: IsNull() });
              if (!galleryData) throw new Error(`Gallery not found`);
              galleryData.deletedBy = req.data?.uuid || undefined;
              await entityManager.save(galleryData);
            } else if (!gallery.is_delete && !!gallery.uuid) {
              const galleryData = await galleryRepo.findOneBy({ uuid: gallery.uuid, deletedBy: IsNull() });
              if (!galleryData) throw new Error(`Gallery not found`);
              galleryData.link = gallery.link;
              galleryData.name = gallery.name;
              await entityManager.save(galleryData);
              if (gallery.pinned) {
                savedData.pinned_image_uuid = galleryData.uuid;
                await entityManager.save(savedData);
              }
            }
            else {
              const newGallery = new Gallery();
              newGallery.uuid = uuidv4();
              newGallery.product_uuid = savedData.uuid;
              newGallery.link = gallery.link;
              newGallery.name = gallery.name;
              newGallery.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newGallery);
              if (gallery.pinned) {
                savedData.pinned_image_uuid = newGallery.uuid;
                await entityManager.save(savedData);
              }
            }
          }
        }
        utilLib.loggingRes(req, { data: savedData, message: "Product updated successfully" });
        return res.json({ data: savedData, message: "Product updated successfully" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const merchRepo = AppDataSource.getRepository(MerchProduct);
      const data = await merchRepo.findOneBy({ uuid, deletedBy: IsNull() });

      if (!data) throw new Error(`Product not found`);

      data.deletedBy = req.data?.uuid || undefined;

      await merchRepo.save(data);
      utilLib.loggingRes(req, { message: "Product deleted successfully" });
      return res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async toggleFeatured(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const merchRepo = AppDataSource.getRepository(MerchProduct);
      const data = await merchRepo.findOneBy({ uuid, deletedBy: IsNull() });

      if (!data) throw new Error(`Product not found`);

      data.featured_at = !data.featured_at ? new Date() : null;

      await merchRepo.save(data);
      utilLib.loggingRes(req, { message: "Product featured status toggled successfully" });
      return res.json({ message: "Product featured status toggled successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async listCategories(req: any, res: any) {
    try {
      const categoryRepo = AppDataSource.getRepository(MerchCategory);
      const categories = await categoryRepo.find({
        order: { name: "ASC" },
      });

      return res.json({ data: categories });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
  async featured(req: any, res: any) {
    const utilLib = new Util();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const categoryId = req.query.category_id || null;
    const sortBy = req.query.sort_by === "price" ? "details.price" : "product.name";
    const sortDir = (req.query.sort_dir || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";

    try {
      const merchRepo = AppDataSource.getRepository(MerchProduct);
      const qbuilder = merchRepo.createQueryBuilder("product");

      qbuilder
        .leftJoinAndSelect("product.details", "details")
        .leftJoinAndSelect("product.galleries", "galleries")
        .leftJoinAndSelect("product.pinnedImage", "pinnedImage")
        .leftJoinAndSelect("product.category", "category")
        .where("product.deletedBy IS NULL");
      // search by name
      if (search) {
        qbuilder.andWhere("product.name LIKE :search", { search: `%${search}%` });
      }
      // filter by category
      if (categoryId) {
        qbuilder.andWhere("product.category_id = :categoryId", { categoryId });
      }
      // sort
      qbuilder.orderBy(sortBy, sortDir as "ASC" | "DESC");
      // pagination
      qbuilder.skip((page - 1) * limit).take(limit);
      const [data, total] = await qbuilder.getManyAndCount();

      const result = data.map((product) => ({
        ...product,
        image_cover: product.pinnedImage?.link || "",
        category_name: product.category?.name || null,
      }));

      const response = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: result,
      };

      utilLib.loggingRes(req, response);
      return res.json(response);
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicDetail(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const merchRepo = AppDataSource.getRepository(MerchProduct);
      const data = await merchRepo.findOne({
        where: {
          uuid, deletedBy: IsNull(),
          details: { deletedBy: IsNull() },
          galleries: { deletedBy: IsNull() },
          pinnedImage: { deletedBy: IsNull() }
        },
        relations: {
          details: true,
          galleries: true,
          pinnedImage: true
        }
      });

      if (!data) throw new Error(`Product not found`);
      const resultData = {
        ...data,
        image_cover: data?.pinnedImage?.link || null,
        galleries: data.galleries?.map((gallery) => ({
          uuid: gallery.uuid,
          link: gallery.link,
          name: gallery.name
        })) || [],
      };
      utilLib.loggingRes(req, { data: resultData, message: "Public Product detail" });
      return res.json({ data: resultData, message: "Product detail" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}