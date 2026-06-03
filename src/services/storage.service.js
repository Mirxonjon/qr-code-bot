const Minio = require('minio');
const config = require('../config');

const minioClient = new Minio.Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

const bucketName = config.storage.bucket;

/**
 * Initialize storage (ensure bucket exists)
 */
async function initStorage() {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      console.log(`Creating bucket: ${bucketName}`);
      await minioClient.makeBucket(bucketName);
      console.log(`Bucket ${bucketName} created successfully.`);
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  } catch (err) {
    console.error('Error initializing MinIO:', err);
    throw err;
  }
}

/**
 * Upload a file from a stream
 * @param {ReadableStream} stream 
 * @param {string} fileName 
 * @param {number} size
 * @returns {Promise<string>} Object name
 */
async function uploadFile(stream, fileName, size, contentType = 'video/mp4') {
  try {
    const metaData = {
      'Content-Type': contentType,
    };
    await minioClient.putObject(bucketName, fileName, stream, size, metaData);
    return fileName;
  } catch (err) {
    console.error('Error uploading to MinIO:', err);
    throw err;
  }
}

/**
 * Build a permanent public URL (bucket must allow anonymous GET).
 */
function getPublicUrl(fileName) {
  const base = (config.storage.baseUrl || '').replace(/\/+$/, '');
  return `${base}/${bucketName}/${encodeURIComponent(fileName)}`;
}

/**
 * Get a URL for an object. Returns a public URL when STORAGE_USE_PRESIGNED_URLS
 * is false; otherwise a time-limited presigned URL.
 */
async function getPresignedUrl(fileName, contentType = 'video/mp4') {
  if (!config.storage.usePresigned) {
    return getPublicUrl(fileName);
  }
  try {
    const respHeaders = {
      'response-content-disposition': 'inline',
      'response-content-type': contentType
    };
    return await minioClient.presignedUrl('GET', bucketName, fileName, config.storage.expiry, respHeaders);
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    throw err;
  }
}

module.exports = {
  initStorage,
  uploadFile,
  getPresignedUrl
};
