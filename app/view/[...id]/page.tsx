"use client";
export const runtime = 'edge';
import { useState } from "react";

export default function ViewPage({ params }: { params: { id: string[] } }) {
  const public_id = params.id.join("/");
  const [copied, setCopied] = useState(false);
  const imgUrl = `https://res.cloudinary.com/yndad4ue/image/upload/${public_id}.jpg`;

  const copyLink = () => {
    navigator.clipboard.writeText(imgUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center px-4 py-6">
      <a href="https://imgbazar.pages.dev" className="font-black text-[20px]">IMG<span className="text-orange-500">BAZAR</span></a>
      <div className="w-full max-w-[500px] mt-4 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
        <img src={imgUrl} alt="photo" className="w-full h-auto max-h-[70vh] object-contain block" />
      </div>
      <div className="w-full max-w-[500px] flex gap-2 mt-4">
        <button onClick={copyLink} className="flex-1 bg-orange-500 py-3 rounded-full font-black text-[13px]">{copied ? "✅ Copied!" : "📋 Copy Link"}</button>
        <a href={imgUrl} download className="flex-1 text-center bg-white/10 py-3 rounded-full font-black text-[13px]">⬇️ Download</a>
      </div>
      <a href={`/delete/${public_id}`} className="mt-3 text-red-400 text-[12px] font-bold">🗑️ Delete This Photo</a>
      <a href="https://imgbazar.pages.dev" className="mt-6 text-white/50 text-[12px]">Upload New Photo →</a>
    </div>
  );
}
