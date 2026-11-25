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
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-black text-[20px]">Delete: {public_id}</h1>
      <button onClick={doDelete} className="mt-5 bg-red-500 font-black px-6 py-3 rounded-full text-[13px]">{loading ? "Deleting..." : "🗑️ Delete Kar Do"}</button>
      {msg && <pre className="mt-4 bg-black/50 p-3 rounded-xl text-left text-[11px] whitespace-pre-wrap w-full max-w-[500px] overflow-auto">{msg}</pre>}
      <a href="https://imgbazar.pages.dev" className="mt-4 text-white/50 text-[12px]">Home →</a>
    </div>
  );
}
