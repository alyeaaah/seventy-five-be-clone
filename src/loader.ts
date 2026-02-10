import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import config from './config';
import { createClient } from 'redis';
import { Container } from 'typedi';
import { AppDataSource } from "./data-source";
import { v2 as cloudinary } from 'cloudinary';
import { createServer } from 'http';

import { route } from './routes/route';
import webSocketService from './websocket';

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
      
      // Create HTTP server for WebSocket
      const server = createServer(this.app);
      
      // Initialize WebSocket service
      webSocketService.initialize(server);
      
      // Compression middleware - harus diletakkan sebelum body parser
      this.app.use(compression());
      
      // Body parser dengan limit yang lebih besar untuk upload
      this.app.use(bodyParser.json({ limit: '10mb' }));
      this.app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
      
      // CORS dengan optimasi
      this.app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      }));
      
      route(this.app);
      
      // Start server with WebSocket support
      const PORT = config.port;
      server.listen(PORT, () => {
        console.log(`Server with WebSocket is running on port ${PORT}`);
      });
      
    } catch (error:any) {
      console.log(error);
    }
  }
}
