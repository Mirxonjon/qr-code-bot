require('dotenv').config();

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT) || 443,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  },
  storage: {
    bucket: process.env.STORAGE_BUCKET || 'hr-bot',
    baseUrl: process.env.STORAGE_BASE_URL,
    usePresigned: process.env.STORAGE_USE_PRESIGNED_URLS === 'true',
    expiry: parseInt(process.env.STORAGE_PRESIGNED_URL_EXPIRY) || 604800, // Default 7 days
  }
};
