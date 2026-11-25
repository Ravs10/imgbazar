export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { public_id } = await req.json();
    
    const cloud_name = "yndad4ue";
    const api_key = process.env.CLOUDINARY_API_KEY!;
    const api_secret = process.env.CLOUDINARY_API_SECRET!;

    const timestamp = Math.round(Date.now() / 1000);
    
    // Signature banana - Ye sabse important hai
    const str = `public_id=${public_id}&timestamp=${timestamp}${api_secret}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const form = new FormData();
    form.append("public_id", public_id);
    form.append("api_key", api_key);
    form.append("timestamp", timestamp.toString());
    form.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`, {
      method: "POST",
      body: form,
    });
    
    const result = await res.json();
    console.log("Delete Result:", result);
    
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
