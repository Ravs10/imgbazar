export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) return Response.json({ error: "No file" }, { status: 400 });

    const cloudName = "yndad4ue";
    const apiKey = "892495511144558";
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiSecret) {
      return Response.json({ error: "ENV MISSING: CLOUDINARY_API_SECRET not set in Cloudflare" }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "imgbazar";
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
    const signature = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

    const up = new FormData();
    up.append("file", file);
    up.append("api_key", apiKey);
    up.append("timestamp", timestamp.toString());
    up.append("folder", folder);
    up.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: up });
    const data: any = await res.json();
    if (!data.secure_url) return Response.json({ error: "Cloudinary fail", details: data }, { status: 500 });

    return Response.json({ url: data.secure_url, public_id: data.public_id });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
