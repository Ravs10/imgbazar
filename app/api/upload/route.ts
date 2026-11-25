export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const cloud_name = "yndad4ue";
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "imgbazar_preset";

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("upload_preset", uploadPreset);
    uploadForm.append("folder", "imgbazar");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
      method: "POST",
      body: uploadForm,
    });
    const data = await res.json();
    return Response.json({ url: data.secure_url, public_id: data.public_id });
  } catch (e: any) {
    return Response.json({ error: e.message });
  }
}
