"use client";
import { use, useState } from "react";

export default function DeletePage({ params }: { params: Promise<{ id: string[] }> }) {
  const { id } = use(params);
  const public_id = id.join("/");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const doDelete = async () => {
    setLoading(true);
    const res = await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public_id }) });
    const data = await res.json();
    if (data.result === "ok" || data.result === "not found") setDone(true);
    else alert("Delete Failed: " + JSON.stringify(data));
    setLoading(false);
  };

  if (done) return <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center justify-center px-4 text-center"><div className="text-[60px]">🗑️</div><h1 className="font-black text-[24px] mt-2">Photo Delete Ho Gayi!</h1><a href="https://imgbazar.pages.dev" className="mt-4 bg-orange-500 px-6 py-3 rounded-full font-black text-[13px]">Upload New Photo →</a></div>;

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center justify-center px-4 text-center">
      <div className="text-[60px]">⚠️</div>
      <h1 className="font-black text-[22px] mt-2">Pakka Delete Karna Hai?</h1>
      <p className="text-white/50 text-[12px] mt-1 max-w-[400px]">Ye photo Cloudinary se hamesha ke liye delete ho jayegi.</p>
      <button onClick={doDelete} className="mt-5 bg-red-500 font-black px-6 py-3 rounded-full text-[13px]">{loading ? "⏳ Deleting..." : "🗑️ Haan, Delete Kar Do"}</button>
    </div>
  );
}
