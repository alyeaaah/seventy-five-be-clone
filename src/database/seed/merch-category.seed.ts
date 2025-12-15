import { DataSource } from "typeorm";
import { MerchCategory } from "../../entities/MerchCategory";
import { AppDataSource } from "../../data-source";
import { v4 as uuidv4 } from "uuid";

const seedMerchCategory = async () => {
  const dataSource: DataSource = await AppDataSource.initialize();
  const repo = dataSource.getRepository(MerchCategory);

  const categories = [
    { id: uuidv4(), name: "Kaos" },
    { id: uuidv4(), name: "Topi" },
    { id: uuidv4(), name: "Aksesoris" },
    { id: uuidv4(), name: "Stiker" },
    { id: uuidv4(), name: "Botol" },
  ];

  for (const category of categories) {
    const exists = await repo.findOneBy({ name: category.name });
    if (!exists) {
      await repo.save(repo.create(category));
    }
  }

  console.log("✅ Merch categories seeded.");
  await dataSource.destroy();
};

seedMerchCategory().catch((err) => {
  console.error("❌ Failed to seed merch categories:", err);
});
