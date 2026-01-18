import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "local",
    jwtSecret: process.env.JWTSECRET || "secret",
    jwtExpiration: process.env.JWTEXP || '1d',
    mysql : {
      host: process.env.DBHOST || 'localhost',
      user: process.env.DBUSER || 'root',
      database: process.env.DBNAME || 'dbname',
      password: process.env.DBPASS || '',
      port: Number(process.env.DBPORT) || 3306,
    },
    redis: {
      url : process.env.REDISURL,
    },
    cloudinary : {
      cloudName : process.env.CLOUNINARY_CLOUD_NAME,
      apiKey : process.env.CLOUNINARY_API_KEY,
      apiSecret : process.env.CLOUNINARY_API_SECRET,
    },
    rajaongkir : {
      apiKey: process.env.RAJAONGKIR_API,
      baseUrl: process.env.RAJAONGKIR_BASE_URL,
  },
  smtp:{
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    from: process.env.SMTP_FROM ? process.env.SMTP_FROM : "Seventy Five Club <noreply@seventyfive.club>"
  }
};
  