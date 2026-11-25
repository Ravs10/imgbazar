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
    const res = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id })
    });
    const data = await res.json();
    setMsg(JSON.stringify(data, null, 2));

    if (data.result === "ok") {
      try {
        const keys = ["imgbazar_history", "history", "imgbazarHistory"];
        keys.forEach((key) => {
          const saved = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(saved)) {
            const filtered = saved.filter((h: any) => {
              const val = typeof h === "string" ? h : h.public_id || h.url || "";
              return !val.includes(public_id);
            });
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        });
      } catch (e) {}
    }
    setLoading(false);
  };

  const isDeleted = msg.includes('"ok"');

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col items-center justify-center px-4 text-center">
      <div className="text-[50px]">🗑️</div>
      <h1 className="font-black text-[20px] mt-2">Delete This Photo?</h1>
      <p className="text-white/50 text-[12px] mt-1 break-all max-w-[500px]">{public_id}</p>
      <p className="text-white/50 text-[12px] mt-1 max-w-[400px]">This photo will be permanently deleted from Cloudinary.</p>

      {!isDeleted && (
        <button
          onClick={doDelete}
          className="mt-5 bg-red-500 font-black px-6 py-3 rounded-full text-[13px]"
        >
          {loading ? "Deleting..." : "Yes, Delete Photo"}
        </button>
      )}

      {msg && (
        <pre className="mt-4 bg-black/50 p-3 rounded-xl text-left text-[11px] whitespace-pre-wrap w-full max-w-[500px] overflow-auto">
          {msg}
        </pre>
      )}

      {isDeleted && (
        <div className="mt-4">
          <p className="text-green-400 text-[14px] font-bold">✅ Photo deleted from Cloudinary!</p>
          <p className="text-white/50 text-[12px] mt-1">It has also been removed from your history.</p>
        </div>
      )}

      <a href="https://imgbazar.pages.dev" className="mt-6 text-white/50 text-[12px]">
        Back to Home →
      </a>
    </div>
  );
}
