import { Player } from "../entities/Player";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Like, Not } from "typeorm";
import bcrypt from "bcryptjs";
import moment from "moment";
import { Levels } from "../entities/Levels";
import { PlayerAddress } from "../entities/PlayerAddress";
import { District } from "../entities/District";
import { Cities } from "../entities/Cities";
import { Province } from "../entities/Province";
import { fetchCities } from "../lib/seeder.lib";
import { fetchDistricts } from "../lib/seeder.lib";

export default class PlayerController {
  async detail(req: any, res: any) {
    const utilLib = new Util();
    if (!req.data?.uuid) {
      return res.status(400).json({ message: "Player not found" });
    }
    try {
      const playerAddressRepo = AppDataSource.getRepository(PlayerAddress);
      let data = await playerAddressRepo.findOneBy({ player_uuid: req.data?.uuid, deleted_at: IsNull() },);
      if (!data) {
        const newAddress = new PlayerAddress();
        newAddress.player_uuid = req.data?.uuid;
        newAddress.address = "";
        newAddress.city_id = 0;
        newAddress.district_id = 0;
        newAddress.phone = "";
        newAddress.receiver_name = "";
        newAddress.created_at = new Date();
        newAddress.updated_at = new Date();
        newAddress.updated_by = req.data?.uuid;
        data = await playerAddressRepo.save(newAddress);
      };
      utilLib.loggingRes(req, { data: data, message: "Address fetched successfully" });
      return res.json({ data: data, message: "Address fetched successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async update(req: any, res: any) {
    const utilLib = new Util();
    if (!req.data?.uuid) {
      return res.status(400).json({ message: "Player not found" });
    }
    const {
      receiver_name,
      phone,
      address,
      city_id,
      province_id,
      district_id,
      note,
      lat,
      long,
    } = req.body;
    try {
      const playerAddressRepo = AppDataSource.getRepository(PlayerAddress);
      let data = await playerAddressRepo.findOneBy({ player_uuid: req.data?.uuid, deleted_at: IsNull() },);
      if (data) {
        data.address = address || data.address;
        data.city_id = city_id || data.city_id;
        data.province_id = province_id || data.province_id;
        data.district_id = district_id || data.district_id;
        data.phone = phone || data.phone;
        data.receiver_name = receiver_name || data.receiver_name;
        data.note = note || data.note;
        data.lat = lat || data.lat;
        data.long = long || data.long;
        data.updated_at = new Date();
        data.updated_by = req.data?.uuid;
        data = await playerAddressRepo.save(data);
      }else{
        const newAddress = new PlayerAddress();
        newAddress.player_uuid = req.data?.uuid;
        newAddress.address = address || "";
        newAddress.city_id = city_id || 0;
        newAddress.province_id = province_id || 0;
        newAddress.district_id = district_id || 0;
        newAddress.phone = phone || "";
        newAddress.receiver_name = receiver_name || "";
        newAddress.note = note || "";
        newAddress.lat = lat || "";
        newAddress.long = long || "";
        newAddress.created_at = new Date();
        newAddress.updated_at = new Date();
        newAddress.updated_by = req.data?.uuid;
        data = await playerAddressRepo.save(newAddress);
      };
      utilLib.loggingRes(req, { data: data, message: "Address updated successfully" });
      return res.json({ data: data, message: "Address updated successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async province(req: any, res: any) {
    const utilLib = new Util();
    try {
      const provinceRepo = AppDataSource.getRepository(Province);
      const data = await provinceRepo.find({ order: { name: "ASC" } });
      utilLib.loggingRes(req, { data: data, message: "Province fetched successfully" });
      return res.json({ data: data, message: "Province fetched successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async city(req: any, res: any) {
    const utilLib = new Util();
    const { province_id } = req.query;
    try {
      const cityRepo = AppDataSource.getRepository(Cities);
      let data = await cityRepo.find({ where: { provinceId: province_id }, order: { name: "ASC" } });
      
      if (!data?.length) {
        await fetchCities(province_id);
        data = await cityRepo.find({ where: { provinceId: province_id }, order: { name: "ASC" } });
      }
      const result = data.map((item) => {
        return {
          id: item.id,
          name: item.name,
          province_id: item.provinceId,
        }
      });
      utilLib.loggingRes(req, { data: result, message: "City fetched successfully" });
      return res.json({ data: result, message: "City fetched successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async district(req: any, res: any) {
    const utilLib = new Util();
    const { city_id } = req.query;
    try {
      const districtRepo = AppDataSource.getRepository(District);
      let data = await districtRepo.find({ where: { cityId: city_id }, order: { name: "ASC" } });
      if (!data?.length) {
        await fetchDistricts(city_id);
        data = await districtRepo.find({ where: { cityId: city_id }, order: { name: "ASC" } });
      } 
      const result = data.map((item) => {
        return {
          id: item.id,
          name: item.name,
          city_id: item.cityId,
        }
      });
      utilLib.loggingRes(req, { data: result, message: "District fetched successfully" });
      return res.json({
        data: result, message: "District fetched successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  
}
