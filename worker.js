const CLOUD_NAME = "yndad4ue";
const API_KEY = "892495511144558";

async function getSignature(toSign) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  const hashArray = Array.from(new Uint8Array(buf));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS ke liye
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }});
    }

    // /upload aur /api/upload dono chalega - taaki frontend kahin se bhi bulaye!
    if ((url.pathname === "/upload" || url.pathname === "/api/upload") && request.method === "POST") {
      try {
        const secret = env.CLOUDINARY_API_SECRET;
        if (!secret) {
          return new Response(JSON.stringify({ error: "ENV MISSING: CLOUDINARY_API_SECRET not set in Worker" }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return new Response(JSON.stringify({ error: "No file" }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "imgbazar";
        const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
        const signature = await getSignature(toSign);

        const up = new FormData();
        up.append("file", file);
        up.append("api_key", API_KEY);
        up.append("timestamp", timestamp.toString());
        up.append("folder", folder);
        up.append("signature", signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: up });
        const data = await res.json();

        if (!data.secure_url) {
          return new Response(JSON.stringify({ error: "Cloudinary fail", details: data }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        return new Response(JSON.stringify({ url: data.secure_url, public_id: data.public_id }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
      }
    }

    return new Response("ImgBazar Worker Running! 🔥");
  }
}
