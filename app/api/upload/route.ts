import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file mili!" }, { status: 400 });

    const cloudName = "yndad4ue";
    const apiKey = "892495511144558";
    const secret = process.env.CLOUDINARY_API_SECRET;

    if (!secret) return NextResponse.json({ error: "ENV MISSING: Pages me CLOUDINARY_API_SECRET nahi hai!" }, { status: 500 });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "imgbazar";
    const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;

    const msgUint8 = new TextEncoder().encode(toSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const up = new FormData();
    up.append("file", file);
    up.append("api_key", apiKey);
    up.append("timestamp", timestamp.toString());
    up.append("folder", folder);
    up.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: up });
    const data = await res.json();

    if (!data.secure_url) return NextResponse.json({ error: "Cloudinary fail", details: data }, { status: 500 });

    return NextResponse.json({ url: data.secure_url, public_id: data.public_id });
  } catch (e: any) {
    return NextResponse.json({ error: "Server Crash: " + e.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
