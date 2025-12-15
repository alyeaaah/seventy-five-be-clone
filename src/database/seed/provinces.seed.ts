import { DataSource, Not } from "typeorm";
import { MerchCategory } from "../../entities/MerchCategory";
import { AppDataSource } from "../../data-source";
import { v4 as uuidv4 } from "uuid";
import { Province } from "../../entities/Province";
import { Cities } from "../../entities/Cities";
import { District } from "../../entities/District";
import axios from "axios";
import config from "../../config";

const seedCities = async () => {
  const dataSource: DataSource = await AppDataSource.initialize();
  const provinceRepo = dataSource.getRepository(Province);
  let fetchedProvinces = (await fetchProvinces()).data;
  await AppDataSource.transaction(async (entityManager) => {
    await entityManager.delete(Province, { id: Not(0) })
    await entityManager.insert(Province, fetchedProvinces);
  });


  console.log("\n✅ Provinces seeded.\n------------------------------\n", fetchedProvinces);
  await dataSource.destroy();
};

async function fetchProvinces() {
  try {
    const response = await axios.get(`${config.rajaongkir.baseUrl}/destination/province`, {
      headers: {
        Key: config.rajaongkir.apiKey,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
  }
}

seedCities().catch((err) => {
  console.error("❌ Failed to seed Cities Address:", err);
});
