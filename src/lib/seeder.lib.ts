import axios from "axios";
import config from "../config";
import { AppDataSource } from "./../data-source";
import { Cities } from "../entities/Cities";
import { Not } from "typeorm";
import { District } from "../entities/District";

async function fetchCities(provinceId: string) {
  try {
    const response = await axios.get(`${config.rajaongkir.baseUrl}/destination/city/${provinceId}`, {
      headers: {
        Key: config.rajaongkir.apiKey,
      },
    }).then(async (res: any) => {
      await AppDataSource.transaction(async (entityManager) => {
        await entityManager.delete(Cities, { id: Not(0) })
        const citiesToAdd: Cities[] = res.data.data.map((city: any) => {
          return {
            id: city.id,
            name: city.name,
            provinceId: provinceId,
          }
        });
        await entityManager.insert(Cities, citiesToAdd);
      });
      return res.data;
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching cities:', error);
  }
}
async function fetchDistricts(cityId: string) {
  try {
    const response = await axios.get(`${config.rajaongkir.baseUrl}/destination/district/${cityId}`, {
      headers: {
        Key: config.rajaongkir.apiKey,
      },
    }).then(async (res: any) => {
      await AppDataSource.transaction(async (entityManager) => {
        await entityManager.delete(District, { id: Not(0) })
        await entityManager.insert(District, res.data.data.map((district: any) => {
          return {
            id: district.id,
            name: district.name,
            cityId: cityId,
          }
        }));
      });
      return res.data;
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching districts:', error);
  }
}
export {
  fetchCities,
  fetchDistricts
}