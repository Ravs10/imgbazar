const CLOUD_NAME = "yndad4ue";
const API_KEY = "892495511144558";

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }});
      }

      if ((url.pathname === "/upload" || url.pathname === "/api/upload") && request.method === "POST") {
        const secret = env?.CLOUDINARY_API_SECRET;
        if (!secret) {
          return Response.json({ error: "ENV MISSING: Worker me CLOUDINARY_API_SECRET nahi hai! Settings > Variables me jake dobara dalo aur Redeploy karo!" }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return Response.json({ error: "No file mili!" }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "imgbazar";
        const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
        const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
        const hashArray = Array.from(new Uint8Array(buf));
        const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const up = new FormData();
        up.append("file", file);
        up.append("api_key", API_KEY);
        up.append("timestamp", timestamp.toString());
        up.append("folder", folder);
        up.append("signature", signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: up });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { return Response.json({ error: "Cloudinary ne JSON nahi bheja: " + text.slice(0,200) }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }); }

        if (!data.secure_url) {
          return Response.json({ error: "Cloudinary fail: " + (data.error?.message || JSON.stringify(data)) }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        return Response.json({ url: data.secure_url, public_id: data.public_id }, { headers: { "Access-Control-Allow-Origin": "*" } });
      }

      return Response.json({ ok: true, msg: "ImgBazar Worker Running! 🔥" }, { headers: { "Access-Control-Allow-Origin": "*" } });
    } catch (e) {
      return Response.json({ error: "Worker Crash: " + e.message + " | Stack: " + (e.stack || "").slice(0,300) }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
    }
  }
}
