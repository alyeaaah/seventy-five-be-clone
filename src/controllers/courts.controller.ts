import { Courts } from "../entities/Courts";
import { CourtFields } from "../entities/CourtFields";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { In, IsNull, Not } from "typeorm";
import { Gallery } from "../entities/Gallery";

export default class CourtsController {
  async create(req: any, res: any) {
    const utilLib = new Util();
    const { name, address, city, lat, long, fields } = req.body;
    try {
      if (!name || !address || !city || !lat || !long || !fields) {
        throw new Error("All fields are required!");
      }

      const courtsRepo = AppDataSource.getRepository(Courts);

      // Check if a court with the same name already exists
      const existingCourt = await courtsRepo.findOneBy({ name });
      if (existingCourt) {
        throw new Error("A court with the same name already exists!");
      }

      // Start a transaction
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Create the court
        const newCourt = new Courts();
        newCourt.uuid = uuidv4();
        newCourt.name = name;
        newCourt.address = address;
        newCourt.city = city;
        newCourt.lat = lat;
        newCourt.long = long;
        newCourt.createdBy = req.data?.uuid || undefined;

        // Save the court
        const savedCourt = await transactionalEntityManager.save(newCourt);
        const savedFields: CourtFields[] = [];
        // Create and save the court fields
        for (const field of fields) {
          const newField = new CourtFields();
          newField.uuid = uuidv4();
          newField.name = field.name;
          newField.type = field.type;
          newField.court_uuid = savedCourt.uuid;
          const savedField = await transactionalEntityManager.save(newField);
          savedFields.push(savedField);
        }
        let idx = 0;
        for (const field of fields) {
          if (field.media_url) {
            const newGallery = new Gallery();
            newGallery.uuid = uuidv4();
            newGallery.link = field.media_url;
            newGallery.type = "COURT";
            newGallery.name = `${savedCourt.name} - ${field.name}`;
            newGallery.court_uuid = savedCourt.uuid;
            newGallery.court_field_uuid = savedFields[idx].uuid;
            await transactionalEntityManager.save(newGallery);
          }
          idx++;
        }
        utilLib.loggingRes(req, { data: savedCourt });
        return res.json({ data: savedCourt });
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
      const courtFieldsRepo = AppDataSource.getRepository(CourtFields); // Assuming this is your fields repository
      const courtsRepo = AppDataSource.getRepository(Courts); // Assuming this is your fields repository
      const subQuery = courtFieldsRepo
      .createQueryBuilder("cf")
      .select("COUNT(cf.uuid)", "count")
      .where("cf.court_uuid = c.uuid").andWhere("cf.deletedBy IS NULL")
      .getQuery();

    const queryBuilder = courtsRepo
      .createQueryBuilder("c")
      // .select(["c.*", `(${subQuery}) AS fields_count`])
      .leftJoinAndSelect("c.fields", "cf")
      .where("c.name LIKE :search", { search: `%${search}%` })
      .andWhere("c.deletedBy IS NULL")
      .skip(offset)
      .take(limit);
      const data = await queryBuilder.getMany(); // Use getRawMany() for grouped data

      // Query to count total records (without grouping)
      const totalRecordsQuery = courtsRepo
        .createQueryBuilder("c")
        .where("c.name LIKE :search", { search: `%${search}%` })
        .andWhere("c.deletedBy IS NULL")
        .groupBy("c.uuid")

      const totalRecords = await totalRecordsQuery.getCount(); // Get total count of courts

      const totalPages = Math.ceil(totalRecords / limit);
      utilLib.loggingRes(req, { data });
      return res.json({
        data,
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
      const courtsRepo = AppDataSource.getRepository(Courts);
      const data = await courtsRepo.findOne({
        where: { uuid, deletedBy: IsNull(), fields: { deletedBy: IsNull() } },
        relations: ["fields"], // Load the associated fields
      });
      const fieldsUuid = data?.fields?.map((field) => field.uuid) || [];
      const galleryRepo = AppDataSource.getRepository(Gallery);
      const gallery = await galleryRepo.find({
        where: { "court_field_uuid": In(fieldsUuid), "deletedBy": IsNull() },
      });
      const result = {
        ...data,
        fields: data?.fields?.map((field) => ({
          ...field,
          media_url: gallery.find((g) => g.court_field_uuid === field.uuid)?.link,
          media_uuid: gallery.find((g) => g.court_field_uuid === field.uuid)?.uuid,
        }))
      };
      if (!data) throw new Error(`Data not found`);
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async update(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    const { name, address, city, lat, long, fields } = req.body;
    try {
      const courtsRepo = AppDataSource.getRepository(Courts);

      // Check if a court with the same name already exists (excluding the current court)
      if (name) {
        const existingCourt = await courtsRepo.findOneBy({ name, uuid: Not(uuid) });
        if (existingCourt) {
          throw new Error("A court with the same name already exists!");
        }
      }

      const courtFieldsRepo = AppDataSource.getRepository(CourtFields);

      // Start a transaction
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Find the existing court
        let court = await courtsRepo.findOneBy({ uuid });
        if (!court) throw new Error(`Court not found`);

        // Update the court
        court.name = name || court.name;
        court.address = address || court.address;
        court.city = city || court.city;
        court.lat = lat || court.lat;
        court.long = long || court.long;
        const updatedCourt = await transactionalEntityManager.save(court);

        // Process the fields
        if (fields && fields.length > 0) {
          for (const field of fields) {
            if (field.uuid) {
              // Update existing field
              const existingField = await courtFieldsRepo.findOneBy({ uuid: field.uuid });
              if (existingField) {
                if (field.is_delete === 1) {
                  // Delete the field
                  existingField.deletedBy = req.data?.uuid || "1";
                  existingField.deletedAt = new Date();
                  await transactionalEntityManager.save(existingField);
                } else {
                  // Update the field
                  existingField.name = field.name || existingField.name;
                  existingField.type = field.type || existingField.type;
                  const savedField = await transactionalEntityManager.save(existingField);
                  if (field.media_url && !field.media_uuid) {
                    const newGallery = new Gallery();
                    newGallery.uuid = uuidv4();
                    newGallery.link = field.media_url;
                    newGallery.type = "COURT";
                    newGallery.name = `${updatedCourt.name} - ${field.name}`;
                    newGallery.court_uuid = updatedCourt.uuid;
                    newGallery.court_field_uuid = savedField.uuid;
                    await transactionalEntityManager.save(newGallery);
                  } else if (field.media_url && field.media_uuid) {
                    const existingGallery = await transactionalEntityManager.findOne(Gallery, { where: { court_field_uuid: savedField.uuid, uuid: field.media_uuid } });
                    if (existingGallery) {
                      existingGallery.link = field.media_url;
                      existingGallery.type = "COURT";
                      existingGallery.name = `${updatedCourt.name} - ${field.name}`;
                      existingGallery.court_uuid = updatedCourt.uuid;
                      existingGallery.court_field_uuid = savedField.uuid;
                      await transactionalEntityManager.save(existingGallery);
                    }
                  }
                  else if (!field.media_url && field.media_uuid) {

                    const existingGallery = await transactionalEntityManager.findOne(Gallery, { where: { court_field_uuid: savedField.uuid, uuid: field.media_uuid } });
                      if (existingGallery) { 
                        existingGallery.deletedBy = req.data?.uuid || "1";
                        existingGallery.deletedAt = new Date();
                        await transactionalEntityManager.save(existingGallery);
                      }
                  }
                }
              }
            } else {
              // Create new field
              const newField = new CourtFields();
              newField.uuid = uuidv4();
              newField.name = field.name;
              newField.type = field.type;
              newField.court_uuid = updatedCourt.uuid;
              const savedField = await transactionalEntityManager.save(newField);
               if (field.media_url) {
                const newGallery = new Gallery();
                newGallery.uuid = uuidv4();
                newGallery.link = field.media_url;
                newGallery.type = "COURT";
                newGallery.name = `${updatedCourt.name} - ${field.name}`;
                newGallery.court_uuid = updatedCourt.uuid;
                newGallery.court_field_uuid = savedField.uuid;
                await transactionalEntityManager.save(newGallery);
              }
            }
          }
        }

        utilLib.loggingRes(req, { data: updatedCourt });
        return res.json({ data: updatedCourt });
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
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        const courtsRepo = AppDataSource.getRepository(Courts);
        const court = await courtsRepo.findOneBy({ uuid });
        if (!court) throw new Error(`Court not found`);
        court.deletedBy = req.data?.uuid || undefined;
        court.deletedAt = new Date();
        await transactionalEntityManager.save(court);

        const courtFieldsRepo = AppDataSource.getRepository(CourtFields);
        const courtFields = await courtFieldsRepo.find({ where: { court_uuid: uuid, deletedBy: IsNull() } });
        for (const field of courtFields) {
          field.deletedBy = req.data?.uuid || undefined;
          field.deletedAt = new Date();
          await transactionalEntityManager.save(field);
        }

        const galleryRepo = AppDataSource.getRepository(Gallery);
        const galleries = await galleryRepo.find({ where: { court_uuid: uuid , court_field_uuid: In(courtFields.map(f => f.uuid)), deletedBy: IsNull() } });
        for (const gallery of galleries) {
          gallery.deletedBy = req.data?.uuid || undefined;
          gallery.deletedAt = new Date();
          await transactionalEntityManager.save(gallery);
        }
      });
      utilLib.loggingRes(req, { message: "Court deleted successfully" });
      return res.json({ message: "Court deleted successfully" });
      
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}