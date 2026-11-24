export const runtime = 'edge';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) return Response.json({ error: "No file" }, { status: 400 });

    const ext = file.name.split(".").pop() || "png";
    const fileName = Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + "." + ext;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    return Response.json({ url, fileName, del: Math.random().toString(36).slice(2, 10) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
