import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Config, ConfigType } from "../entities/Config";
import { IsNull, Not } from "typeorm";
import Util from "../lib/util.lib";

interface AuthenticatedRequest extends Request {
    data?: {
        uuid: string;
        [key: string]: any;
    };
}

export class ConfigController {
    // GET /api/config - Get all configs
    async getAll(req: AuthenticatedRequest, res: Response) {
        const utilLib = Util.getInstance();
        const { type, page = 1, limit = 10, search } = req.query;
        
        try {
            const configRepo = AppDataSource.getRepository(Config);
            const queryBuilder = configRepo
                .createQueryBuilder("config")
                .where("config.deletedAt IS NULL");

            // Filter by type if provided
            if (type && Object.values(ConfigType).includes(type as ConfigType)) {
                queryBuilder.andWhere("config.type = :type", { type });
            }

            // Search functionality
            if (search) {
                queryBuilder.andWhere(
                    "(config.key LIKE :search OR config.description LIKE :search)",
                    { search: `%${search}%` }
                );
            }

            // Pagination
            const offset = (Number(page) - 1) * Number(limit);
            queryBuilder.skip(offset).take(Number(limit));
            queryBuilder.orderBy("config.createdAt", "DESC");

            const [configs, total] = await queryBuilder.getManyAndCount();

            utilLib.loggingRes(req, {
                data: configs,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
            return res.json({
                data: configs,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error: any) {
            utilLib.loggingError(req, error.message);
            return res.status(400).json({ message: error.message });
        }
    }

    // GET /api/config/:key - Get config by key
    async getByKey(req: AuthenticatedRequest, res: Response) {
        const utilLib = Util.getInstance();
        const { key } = req.params;
        
        try {
            const configRepo = AppDataSource.getRepository(Config);
            const config = await configRepo.findOne({
                where: { 
                    key,
                    deletedAt: IsNull()
                }
            });

            if (!config) {
                throw new Error("Config not found");
            }

            utilLib.loggingRes(req, config);
            return res.json(config);
        } catch (error: any) {
            utilLib.loggingError(req, error.message);
            return res.status(404).json({ message: error.message });
        }
    }

    // POST /api/config - Create new config
    async create(req: AuthenticatedRequest, res: Response) {
        const utilLib = Util.getInstance();
        const { key, value, type = ConfigType.CONFIG, description } = req.body;
        
        try {
            // Validation
            if (!key) {
                throw new Error("Key is required");
            }

            if (type && !Object.values(ConfigType).includes(type)) {
                throw new Error("Invalid config type");
            }

            const configRepo = AppDataSource.getRepository(Config);
            
            // Check if key already exists
            const existingConfig = await configRepo.findOne({
                where: { 
                    key,
                    deletedAt: IsNull()
                }
            });

            if (existingConfig) {
                throw new Error("Config with this key already exists");
            }

            // Create new config
            const newConfig = new Config();
            newConfig.key = key;
            newConfig.value = value || "";
            newConfig.type = type;
            newConfig.description = description || "";
            newConfig.createdBy = req.data?.uuid;

            const savedConfig = await configRepo.save(newConfig);

            utilLib.loggingRes(req, savedConfig);
            return res.status(201).json({
                message: "Config created successfully",
                data: savedConfig
            });
        } catch (error: any) {
            utilLib.loggingError(req, error.message);
            return res.status(400).json({ message: error.message });
        }
    }

    // PUT /api/config/:key - Update config by key
    async update(req: AuthenticatedRequest, res: Response) {
        const utilLib = Util.getInstance();
        const { key } = req.params;
        const { value, type, description } = req.body;
        
        try {
            const configRepo = AppDataSource.getRepository(Config);
            const config = await configRepo.findOne({
                where: { 
                    key,
                    deletedAt: IsNull()
                }
            });

            if (!config) {
                throw new Error("Config not found");
            }

            // Validate type if provided
            if (type && !Object.values(ConfigType).includes(type)) {
                throw new Error("Invalid config type");
            }

            // Update fields
            if (value !== undefined) config.value = value;
            if (type !== undefined) config.type = type;
            if (description !== undefined) config.description = description;
            config.updatedBy = req.data?.uuid ;

            const updatedConfig = await configRepo.save(config);

            utilLib.loggingRes(req, updatedConfig);
            return res.json({
                message: "Config updated successfully",
                data: updatedConfig
            });
        } catch (error: any) {
            utilLib.loggingError(req, error.message);
            return res.status(400).json({ message: error.message });
        }
    }

    // DELETE /api/config/:key - Soft delete config by key
    async delete(req: AuthenticatedRequest, res: Response) {
        const utilLib = Util.getInstance();
        const { key } = req.params;
        
        try {
            const configRepo = AppDataSource.getRepository(Config);
            const config = await configRepo.findOne({
                where: { 
                    key,
                    deletedAt: IsNull()
                }
            });

            if (!config) {
                throw new Error("Config not found");
            }

            config.deletedAt = new Date();
            config.deletedBy = req.data?.uuid ;

            await configRepo.save(config);

            utilLib.loggingRes(req, { message: "Config deleted successfully" });
            return res.json({ message: "Config deleted successfully" });
        } catch (error: any) {
            utilLib.loggingError(req, error.message);
            return res.status(400).json({ message: error.message });
        }
    }

    // GET /api/config/type/:type - Get configs by type
    async getByType(req: AuthenticatedRequest, res: Response) {
        const utilLib = Util.getInstance();
        const { type } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        try {
            // Validate type
            if (!Object.values(ConfigType).includes(type as ConfigType)) {
                throw new Error("Invalid config type");
            }

            const configRepo = AppDataSource.getRepository(Config);
            const queryBuilder = configRepo
                .createQueryBuilder("config")
                .where("config.type = :type", { type })
                .andWhere("config.deletedAt IS NULL");

            // Pagination
            const offset = (Number(page) - 1) * Number(limit);
            queryBuilder.skip(offset).take(Number(limit));
            queryBuilder.orderBy("config.createdAt", "DESC");

            const [configs, total] = await queryBuilder.getManyAndCount();

            utilLib.loggingRes(req, {
                data: configs,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
            return res.json({
                data: configs,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error: any) {
            utilLib.loggingError(req, error.message);
            return res.status(400).json({ message: error.message });
        }
    }

    // POST /api/config/bulk - Bulk create/update configs
    async bulkUpsert(req: AuthenticatedRequest, res: Response) {
        const utilLib = Util.getInstance();
        const { configs } = req.body;
        
        try {
            if (!configs || !Array.isArray(configs) || configs.length === 0) {
                throw new Error("Configs array is required");
            }

            const configRepo = AppDataSource.getRepository(Config);
            const results = [];

            for (const configData of configs) {
                const { key, value, type = ConfigType.CONFIG, description } = configData;

                if (!key) {
                    throw new Error("Key is required for all configs");
                }

                if (type && !Object.values(ConfigType).includes(type)) {
                    throw new Error(`Invalid config type: ${type}`);
                }

                // Check if config exists
                const existingConfig = await configRepo.findOne({
                    where: { 
                        key,
                        deletedAt: IsNull()
                    }
                });

                if (existingConfig) {
                    // Update existing
                    existingConfig.value = value !== undefined ? value : existingConfig.value;
                    existingConfig.type = type !== undefined ? type : existingConfig.type;
                    existingConfig.description = description !== undefined ? description : existingConfig.description;
                    existingConfig.updatedBy = req.data?.uuid;
                    const updated = await configRepo.save(existingConfig);
                    results.push({ action: "updated", data: updated });
                } else {
                    // Create new
                    const newConfig = new Config();
                    newConfig.key = key;
                    newConfig.value = value || "";
                    newConfig.type = type;
                    newConfig.description = description || "";
                    newConfig.createdBy = req.data?.uuid;
                    const created = await configRepo.save(newConfig);
                    results.push({ action: "created", data: created });
                }
            }

            utilLib.loggingRes(req, { 
                message: `Bulk operation completed successfully`,
                results 
            });
            return res.json({
                message: "Bulk operation completed successfully",
                results
            });
        } catch (error: any) {
            utilLib.loggingError(req, error.message);
            return res.status(400).json({ message: error.message });
        }
    }
}
