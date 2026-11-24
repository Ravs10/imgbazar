"use client";
import { use, useState } from "react";

export default function ViewPage({ params }: { params: Promise<{ id: string[] }> }) {
  const { id } = use(params);
  const public_id = id.join("/");
  const url = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "yndad4ue"}/image/upload/${public_id}`;
  const [copied, setCopied] = useState(false);

  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center px-4 pt-6 pb-10">
      <h1 className="font-black text-[22px]">Img<span className="text-orange-500">Bazar</span> <span className="text-white/40 text-[12px]">BY VELORA</span></h1>
      <div className="max-w-[700px] w-full mt-6 bg-white/[0.04] border border-white/10 rounded-[24px] p-4">
        <img src={url} className="w-full rounded-2xl max-h-[70vh] object-contain bg-black/40" alt="ImgBazar Image" />
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={copy} className="bg-orange-500 font-black px-5 py-2.5 rounded-full text-[13px]">{copied ? "✅ Copied!" : "📋 Copy Direct Link"}</button>
          <a href={url} download target="_blank" className="bg-white text-black font-black px-5 py-2.5 rounded-full text-[13px]">⬇️ Download</a>
          <a href="https://imgbazar.pages.dev" className="bg-white/10 font-black px-5 py-2.5 rounded-full text-[13px]">📸 Upload Your Own →</a>
        </div>
        <p className="text-white/40 text-[11px] mt-4 text-center">Free Image Hosting • Powered by Velora</p>
      </div>
    </div>
  );
}
