import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'zken-genai',
});

const BUCKET_NAME = 'idea-app-static-content';

export async function uploadFile(fileBuffer: Buffer, filename: string, mimeType?: string): Promise<string> {
  const bucket = storage.bucket(BUCKET_NAME);
  const blob = bucket.file(filename);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: mimeType,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
      resolve(publicUrl);
    });
    blobStream.end(fileBuffer);
  });
}

export async function uploadFileFromPath(filePath: string, filename?: string): Promise<string> {
  const bucket = storage.bucket(BUCKET_NAME);
  const destFilename = filename || path.basename(filePath);
  
  await bucket.upload(filePath, {
    destination: destFilename,
  });

  return `https://storage.googleapis.com/${BUCKET_NAME}/${destFilename}`;
}
