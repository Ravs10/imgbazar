"use client";
import { useState, useRef, useEffect, useCallback } from "react";

type Item = { name: string; url: string; del: string; time: string };

export default function Home() {
  const [history, setHistory] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [copied, setCopied] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem("imgbazar_history") || "[]"));
    } catch { setHistory([]); }
  }, []);

  // PASTE FIX: Ctrl+V ab sach me chalega
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) uploadFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [history, results]);

  const saveHistory = (list: Item[]) => {
    setHistory(list);
    localStorage.setItem("imgbazar_history", JSON.stringify(list));
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(t.slice(0, 20));
    setTimeout(() => setCopied(""), 1500);
  };

  // DELETE FIX: History + Results dono se delete hoga
  const deleteItem = (delId: string) => {
    if (!confirm("Pakka delete karna hai? Ye sirf yahan se hategi, Cloudinary se delete karne ke liye neeche Removal Link use karo.")) return;
   // Asli delete - Cloudinary se bhi udao
fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public_id: delId }) });
    const newHist = history.filter((it) => it.del !== delId);
    saveHistory(newHist);
    setResults(results.filter((it) => it.del !== delId));
  };

  const clearHistory = () => {
    if (!confirm("Saari History clear kar du?")) return;
    saveHistory([]);
    setResults([]);
  };

  const getLinks = (it: Item) => {
    const u = it.url, name = it.name, page = `https://imgbazar.pages.dev/view/${it.del}`;
    return [
      { label: "🔗 Direct Link", desc: "Blogger / WhatsApp / Bazaru", code: u },
      { label: "🌐 HTML for Websites", desc: "Blogger / WordPress", code: `<img src="${u}" alt="${name}" />` },
      { label: "📝 Markdown - Reddit", desc: "Reddit / Quora / Discord", code: `[${name}](${u})` },
      { label: "🐙 Markdown - GitHub", desc: "GitHub README", code: `![${name}](${u})` },
      { label: "💬 Thumbnail for Forums", desc: "BBCode - Choti Photo", code: `[url=${page}][img]${u}[/img][/url]` },
      { label: "🖼️ Thumbnail for Websites", desc: "HTML - Choti Photo", code: `<a href="${page}"><img src="${u}" alt="${name}" width="200" /></a>` },
      { label: "🔥 Hotlink for Forums", desc: "BBCode - Puri Photo", code: `[url=${page}][img]${u}[/img][/url]` },
      { label: "🚀 Hotlink for Websites", desc: "HTML - Puri Photo", code: `<a href="${page}"><img src="${u}" alt="${name}" /></a>` },
      { label: "🗑️ Removal Link", desc: "Delete karne ke liye - Secret!", code: `https://imgbazar.pages.dev/delete/${it.del}` },
    ];
  };

  const uploadFiles = async (files: FileList | File[]) => {
    for (let file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) { alert("10MB se Badi File!"); continue; }
      setUploading(true);
      const fd = new FormData(); fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { alert("Server ne ye bheja (JSON nahi): " + text.slice(0, 300)); setUploading(false); continue; }
        if (!res.ok || !data.url) { alert("Upload Failed: " + (data.error || text.slice(0, 300))); setUploading(false); continue; }
        const item: Item = { name: file.name, url: data.url, del: data.public_id || data.del || "x", time: new Date().toLocaleString() };
        // BUG FIX: Functional update - ab 2 photo ek saath bhi gayab nahi hongi
        setHistory((prev) => {
          const newHist = [item, ...prev].slice(0, 50);
          localStorage.setItem("imgbazar_history", JSON.stringify(newHist));
          return newHist;
        });
        setResults((prev) => [item, ...prev]);
      } catch (e: any) { alert("Upload Failed! Real Error: " + e.message); }
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white px-4">
      <header className="max-w-[1100px] mx-auto pt-4 flex justify-between items-center">
        <div className="flex items-center gap-2"><div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl animate-bounce">📸</div><div><h1 className="font-black text-[22px] leading-none">Img<span className="text-orange-500">Bazar</span></h1><p className="text-[10px] text-white/50 tracking-widest">BY VELORA • FREE IMAGE HOSTING</p></div></div>
        <a href="https://velora-cloud.pages.dev" target="_blank" className="bg-white/10 px-4 py-2 rounded-full text-[12px] font-bold hover:bg-orange-500">⚡ Velora</a>
      </header>

      {copied && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full text-[12px] font-bold z-50 shadow-lg">✅ Copied!</div>}

      <section className="max-w-[1100px] mx-auto text-center pt-8">
        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-black">● LIVE • NO LOGIN • UNLIMITED BANDWIDTH</span>
        <h2 className="text-[34px] md:text-[52px] font-black leading-[1.05] mt-4">Upload Image.<br /><span className="text-orange-500">Get Link. Use Anywhere.</span></h2>
        <p className="text-white/60 text-[13px] max-w-[520px] mx-auto mt-3">Blogger, WordPress, Bazaru, Reddit, GitHub, Forums - Kahi bhi Use Karo. 9 Tarah ke Link Instantly!</p>
      </section>

      <main className="max-w-[900px] mx-auto mt-6 pb-10">
        <div onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFiles(e.dataTransfer.files); }} className={`border-2 border-dashed rounded-[28px] p-8 md:p-10 text-center cursor-pointer transition-all ${drag ? "border-orange-500 bg-orange-500/10 scale-[1.02]" : "border-white/20 bg-white/[0.03] hover:border-orange-500"}`}>
          <div className="text-[48px]">📸</div>
          <h3 className="font-black text-[18px] mt-2">{uploading ? "⏳ Uploading..." : "Drag & Drop Images Here"}</h3>
          <p className="text-white/50 text-[12px] mt-1">or Click to Browse • Paste (Ctrl+V) bhi Chalega!</p>
          <span className="inline-block mt-5 bg-gradient-to-r from-orange-500 to-pink-500 font-black px-6 py-3 rounded-full text-[14px]">Choose Images →</span>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        </div>

        {results.map((it, idx) => (
          <div key={idx} className="bg-white/[0.04] border border-orange-500/30 rounded-[24px] p-4 md:p-6 mt-5">
            <div className="flex gap-4 flex-col sm:flex-row"><img src={it.url} className="w-full sm:w-[160px] h-[140px] object-cover rounded-2xl" /><div><h3 className="font-black">✅ Upload Ho Gaya! - {it.name}</h3><p className="text-[11px] text-white/50">{it.time}</p><div className="flex gap-2 mt-3 flex-wrap"><button onClick={() => copy(it.url)} className="bg-orange-500 font-black px-4 py-2 rounded-full text-[12px]">📋 Copy Direct Link</button><a href={it.url} target="_blank" className="bg-white text-black font-black px-4 py-2 rounded-full text-[12px]">👁️ View</a><button onClick={() => deleteItem(it.del)} className="bg-red-500/20 border border-red-500/50 text-red-300 font-black px-4 py-2 rounded-full text-[12px]">🗑️ Delete</button></div></div></div>
            <div className="space-y-3 mt-5">{getLinks(it).map((l, i) => (
              <div key={i}><p className="font-bold text-[12px]">{l.label} <span className="text-white/40 font-normal text-[10px]">- {l.desc}</span></p><div className="flex mt-1"><input readOnly value={l.code} className="flex-1 bg-black/40 border border-white/10 rounded-l-xl px-3 py-2.5 text-[11px] truncate outline-none" /><button onClick={() => copy(l.code)} className="bg-orange-500 px-4 rounded-r-xl font-black">📋</button></div></div>
            ))}</div>
          </div>
        ))}

        <div className="mt-8">
          <div className="flex justify-between items-center"><h3 className="font-black">🕒 Your History ({history.length})</h3>{history.length > 0 && <button onClick={clearHistory} className="text-[11px] bg-red-500/20 border border-red-500/40 text-red-300 px-3 py-1.5 rounded-full font-bold">Clear All</button>}</div>
          {history.length === 0 && <p className="text-white/40 text-[12px] mt-3">Abhi koi photo nahi hai. Upar se upload karo, yahan dikhegi!</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">{history.slice(0, 12).map((it, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-2 hover:scale-105 transition relative group">
              <div onClick={() => setResults([it])}><img src={it.url} className="w-full h-[90px] object-cover rounded-xl cursor-pointer" /><p className="text-[10px] font-bold truncate mt-1">{it.name}</p><p className="text-[9px] text-emerald-400">Click to Get Links →</p></div>
              <button onClick={() => deleteItem(it.del)} className="absolute top-3 right-3 bg-red-500 w-6 h-6 rounded-full text-[11px] font-black">×</button>
            </div>
          ))}</div>
        </div>
        <p className="text-center pb-8 text-[11px] text-white/30 mt-8">© 2026 ImgBazar • Powered by <span className="text-orange-500 font-bold">Velora - Digital Product Lab</span></p>
      </main>
    </div>
  );
}
