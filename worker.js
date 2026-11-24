const CLOUD_NAME = "yndad4ue";
const API_KEY = "892495511144558";
async function sha1(str) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }});
    }
    if (url.pathname === "/upload" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return new Response(JSON.stringify({error: "No file"}), {status: 400});
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "imgbazar";
        const toSign = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
        const signature = await sha1(toSign);
        const up = new FormData();
        up.append("file", file);
        up.append("api_key", API_KEY);
        up.append("timestamp", timestamp.toString());
        up.append("folder", folder);
        up.append("signature", signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: up });
        const data = await res.json();
        if (!data.secure_url) return new Response(JSON.stringify(data), {status: 500, headers: {"Access-Control-Allow-Origin": "*"}});
        return new Response(JSON.stringify({ url: data.secure_url, public_id: data.public_id }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }});
      } catch (e) {
        return new Response(JSON.stringify({error: e.message}), {status: 500, headers: {"Access-Control-Allow-Origin": "*"}});
      }
    }
    return new Response("ImgBazar Cloudinary Worker Running! 🔥");
  }
}
