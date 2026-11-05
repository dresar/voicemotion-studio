import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as fs from "fs";

try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
} catch (e) {
  console.warn("Could not read .env.local", e);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function run() {
  console.log("Testing Neon Object Storage (S3)...");
  const bucket = "uploads";
  
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: "test-init.txt",
      Body: "VoiceMotion Studio Neon Storage Initialized",
      ContentType: "text/plain",
    })
  );
  console.log("PutObjectCommand succeeded!");

  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
    })
  );
  console.log("Bucket objects:", list.Contents?.map((o) => o.Key));
}

run().catch((err) => {
  console.error("S3 test failed:", err);
  process.exit(1);
});
