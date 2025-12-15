import "reflect-metadata";
import { AppDataSource } from "../../data-source";
import { User } from "./../../entities/User";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Levels } from "../../entities/Levels";
import { BackhandEnum, ForehandEnum, GenderEnum, Player } from "../../entities/Player";
import { faker } from "@faker-js/faker"; // Fixed import
import { Courts } from "../../entities/Courts";
import { CourtFields, CourtTyoeEnum } from "../../entities/CourtFields";

const run = async () => {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);
    const levelsRepository = AppDataSource.getRepository(Levels);
    const playerRepository = AppDataSource.getRepository(Player);
    const courtsRepository = AppDataSource.getRepository(Courts);
    const courtFieldsRepository = AppDataSource.getRepository(CourtFields);
    const password: any = await new Promise((resolve, reject) => {
      bcrypt.hash("123456", 10, function (err, hash) {
        if (err) reject(err);
        resolve(hash);
      });
    });

    const userData = new User();
    userData.uuid = uuidv4();
    userData.name = "75admin";
    userData.username = "75admin";
    userData.password = password;
    userData.isBlocked = false;
    userData.lastLogin = new Date();
    userData.createdBy = "";
    userData.role = "admin";
    const user = await userRepository.save(userData);

    const levelData = new Levels();
    levelData.uuid = uuidv4();
    levelData.name = "(ex) Pro Player";
    levelData.level_tier = 1;
    levelData.createdBy = user.uuid;
    await levelsRepository.save(levelData);

    const levelData2 = new Levels();
    levelData2.uuid = uuidv4();
    levelData2.name = "Advance";
    levelData2.level_tier = 2;
    levelData2.createdBy = user.uuid;
    await levelsRepository.save(levelData2);

    const levelData3 = new Levels();
    levelData3.uuid = uuidv4();
    levelData3.name = "Intermediate";
    levelData3.level_tier = 3;
    levelData3.createdBy = user.uuid;
    await levelsRepository.save(levelData3);

    const courtData = new Courts();
    courtData.uuid = uuidv4();
    courtData.name = "PDAM Ngagel";
    courtData.address = faker.location.streetAddress();
    courtData.city = faker.location.city();
    courtData.lat = faker.location.latitude().toString();
    courtData.long = faker.location.longitude().toString();
    courtData.createdBy = user.uuid;
    const savedCourt = await courtsRepository.save(courtData);

    const courtFieldData = new CourtFields();
    courtFieldData.uuid = uuidv4();
    courtFieldData.name = "Court 1";
    courtFieldData.court_uuid = savedCourt.uuid;
    courtFieldData.type = CourtTyoeEnum.hardCourt;
    courtFieldData.createdBy = user.uuid;
    await courtFieldsRepository.save(courtFieldData);


    const totalPlayers = 36;
    // create array of number
    const playerArray = Array.from({ length: totalPlayers }, (_, i) => i + 1);
    for (const num of playerArray) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const levelDatas = [levelData, levelData2, levelData3]
      const mediaUrls = [
        "https://res.cloudinary.com/doqyrkqgw/image/upload/v1743511470/tgmrkv5iksdyqaqlvfnn.gif",
        "https://res.cloudinary.com/doqyrkqgw/image/upload/v1743511741/hqzyediwamxthzh1oikx.gif",
        "https://res.cloudinary.com/doqyrkqgw/image/upload/v1743511881/onwhohfmsnqfmskjzcdm.gif",
        "https://res.cloudinary.com/doqyrkqgw/image/upload/v1742852033/wwshajtirnm2bnpyy5zy.jpg",
      ]
      
      const playerData = new Player();
      playerData.uuid = uuidv4();
      playerData.name = firstName + " " + lastName;
      playerData.username = faker.internet.username({ firstName, lastName });
      playerData.password = password;
      playerData.nickname = lastName.slice(0, 3).toUpperCase();
      playerData.level_uuid = levelDatas[(num % 3)].uuid;
      playerData.address = faker.location.streetAddress();
      playerData.phoneNumber = faker.phone.number({
        style: "international",
      }).replace("+", "");
      playerData.city = faker.location.city();
      playerData.placeOfBirth = faker.location.city();
      playerData.dateOfBirth = faker.date.past();
      playerData.gender = [GenderEnum.male, GenderEnum.female][num % 2];
      playerData.isVerified = num % 2 === 0;
      playerData.height = faker.number.int({ min: 150, max: 187 });
      playerData.playstyleBackhand = [BackhandEnum.double, BackhandEnum.one][Math.floor(Math.random() * 2) + 1];
      playerData.playstyleForehand = [ForehandEnum.left, ForehandEnum.right][Math.floor(Math.random() * 2) + 1];
      playerData.turnDate = faker.date.past({ years: 10 });
      playerData.socialMediaIg = faker.internet.userName({ lastName });
      playerData.socialMediaX = faker.internet.userName({ firstName });
      playerData.media_url = num < mediaUrls.length ? mediaUrls[num] : faker.image.personPortrait({ sex: num % 2 === 0 ? "male" : "female"});
      playerData.skills = JSON.stringify({
        forehand: faker.number.int({ min: 50, max: 100 }),
        backhand: faker.number.int({ min: 50, max: 100 }),
        serve: faker.number.int({ min: 50, max: 100 }),
        volley: faker.number.int({ min: 50, max: 100 }),
        overhead: faker.number.int({ min: 50, max: 100 }),
      })
      playerData.createdBy = user.uuid;
      await playerRepository.save(playerData);
    }
    console.log("Data successfully seeded");

  } catch (err) {
    console.error("Error during Data Source initialization or seeding:", err);
  } finally {
    await AppDataSource.destroy();
  }
};

run();
