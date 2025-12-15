import cors from 'cors';
import bodyParser from 'body-parser';
import config from './config';
import { createClient } from 'redis';
import { Container } from 'typedi';
import { AppDataSource } from "./data-source";
import { v2 as cloudinary } from 'cloudinary';

import { route } from './routes/route';

export default class Loaders {
  app: any;
  constructor(app:any) {
    this.app = app;
  }

  async typeormLoad(){
    await AppDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization:", err);
    });
  }

  async setupRedis(){
    const client = createClient({
      url: config.redis.url
    });
    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();
    console.log("Redis client connected");
    Container.set('redis', client);
  }

  async loadCloudinary() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      shorten: true,
    });
    Container.set('cloudinary', cloudinary);
  }

  async load() {
    try {
      await this.typeormLoad();
      await this.setupRedis();
      await this.loadCloudinary();
      this.app.use(bodyParser.json());
      this.app.use(bodyParser.urlencoded({ extended: false }));
      this.app.use(cors());
      route(this.app);
    } catch (error:any) {
      console.log(error);
    }
  }
}
