export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { public_id } = await req.json();

    const cloud_name = "yndad4ue";
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    if (!api_key || !api_secret) {
      return Response.json({ error: "API_KEY ya API_SECRET Cloudflare me nahi hai!", api_key_exists: !!api_key, secret_exists: !!api_secret });
    }

    // Basic Auth - Signature se zyada aasan aur pakka
    const auth = btoa(`${api_key}:${api_secret}`);

    const form = new FormData();
    form.append("public_id", public_id);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`, {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}` },
      body: form,
    });

    const result = await res.json();
    return Response.json({ ...result, debug_public_id: public_id });
  } catch (e: any) {
    return Response.json({ error: e.message });
  }
}
