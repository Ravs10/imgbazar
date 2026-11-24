export const runtime = 'edge';

import { NextResponse } from "next/server";

async function sha1Hex(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: Request) {
  try {
    const { public_id } = await req.json();
    if (!public_id) return NextResponse.json({ error: "No id" }, { status: 400 });

    const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
    const key = process.env.CLOUDINARY_API_KEY!;
    const secret = process.env.CLOUDINARY_API_SECRET!;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sha1Hex(`public_id=${public_id}&timestamp=${timestamp}${secret}`);

    const fd = new FormData();
    fd.append("public_id", public_id);
    fd.append("api_key", key);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body: fd });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
