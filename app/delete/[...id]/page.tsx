"use client";
export const runtime = 'edge';
import { useState } from "react";

export default function DeletePage({ params }: { params: { id: string[] } }) {
  const public_id = params.id.join("/");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const doDelete = async () => {
    setLoading(true);
    setMsg("Deleting...");
    const res = await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public_id }) });
    const data = await res.json();
    setMsg(JSON.stringify(data, null, 2));
    if (data.result === "ok") {
      // History se bhi auto hata do
      try {
        const saved = JSON.parse(localStorage.getItem("imgbazar_history") || "[]");
        const filtered = saved.filter((h: any) => !h.public_id?.includes(public_id) && h.public_id !== public_id && !h.url?.includes(public_id));
        localStorage.setItem("imgbazar_history", JSON.stringify(filtered));
        // Agar history ka naam alag hai to ye bhi try karo
        localStorage.removeItem("history");
      } catch(e) {}
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-black text-[20px]">Delete: {public_id}</h1>
      <button onClick={doDelete} className="mt-5 bg-red-500 font-black px-6 py-3 rounded-full text-[13px]">{loading ? "Deleting..." : "🗑️ Delete Kar Do"}</button>
      {msg && <pre className="mt-4 bg-black/50 p-3 rounded-xl text-left text-[11px] whitespace-pre-wrap w-full max-w-[500px] overflow-auto">{msg}</pre>}
      {msg.includes('"ok"') && <p className="mt-3 text-green-400 text-[13px] font-bold">✅ Cloudinary se delete ho gayi! History se bhi hata di! Ab Home pe ja ke refresh kar.</p>}
      <a href="https://imgbazar.pages.dev" className="mt-4 text-white/50 text-[12px]">Home →</a>
    </div>
  );
}
