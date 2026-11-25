"use client";
import { useState, useRef, useEffect } from "react";

type HistoryItem = {
  public_id: string;
  url: string;
  name: string;
  size: number;
  date: string;
};

const CLOUD_NAME = "yndad4ue";
const UPLOAD_PRESET = "imgbazar_preset";

export default function Home() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [toast, setToast] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<HistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState("direct");
  const [qr, setQr] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [search, setSearch] = useState("");
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("imgbazar_history") || localStorage.getItem("history") || "[]");
      if (Array.isArray(saved)) {
        const fixed = saved.map((h: any) => {
          if (typeof h === "string") return { public_id: h, url: h, name: h.split("/").pop() || "Photo", size: 0, date: new Date().toLocaleDateString() };
          return { public_id: h.public_id || h.url, url: h.url || h.secure_url, name: h.name || "Photo", size: h.size || 0, date: h.date || new Date().toLocaleDateString() };
        });
        setHistory(fixed);
      }
    } catch {}
  }, []);

  // Paste Support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files: File[] = [];
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const f = items[i].getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) uploadFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [history]);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("imgbazar_history", JSON.stringify(items));
    localStorage.setItem("history", JSON.stringify(items));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // MAIN FIX: Try All Presets + Show Real Error
  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setUploading(true);
    const newItems: HistoryItem[] = [];
    const PRESETS_TO_TRY = ["imgbazar_preset", "ml_default", "unsigned_preset", "velora"];

    for (let i = 0; i < files.length; i++) {
      setProgressText(`Uploading ${i + 1} / ${files.length}...`);
      let uploaded = false;
      let lastError = "";
      for (const preset of PRESETS_TO_TRY) {
        try {
          const form = new FormData();
          form.append("file", files[i]);
          form.append("upload_preset", preset);
          form.append("folder", "imgbazar");
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
          const data = await res.json();
          if (data.secure_url) {
            newItems.push({ public_id: data.public_id, url: data.secure_url, name: files[i].name, size: files[i].size, date: new Date().toLocaleDateString() });
            uploaded = true;
            break;
          } else {
            lastError = data.error?.message || "Unknown Error";
          }
        } catch (e: any) { lastError = e.message; }
      }
      if (!uploaded) showToast("Error: " + lastError);
    }

    if (newItems.length > 0) {
      saveHistory([...newItems, ...history]);
      showToast(`${newItems.length} Photos Uploaded!`);
    }
    setUploading(false);
    setProgressText("");
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("Link Copied!");
  };

  const shareLink = async (url: string, name: string) => {
    if (navigator.share) {
      try { await navigator.share({ title: name, text: name, url }); } catch {}
    } else {
      copyLink(url);
      showToast("Share nahi hai, Link Copy ho gaya!");
    }
  };

  const downloadImage = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
    showToast("Download Started!");
  };

  const showQR = (url: string) => {
    setQr(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`);
    setQrUrl(url);
  };

  // 1. REMOVE - Sirf History se hatayega
  const removeFromHistory = (public_id: string) => {
    if (!confirm("Sirf History se hataye? Photo ka link chalta rahega.")) return;
    saveHistory(history.filter((h) => h.public_id !== public_id));
    setShowDeleteMenu(null);
    showToast("Removed From History");
  };

  // 2. DELETE PERMANENT - Cloudinary se hamesha ke liye
  const deletePermanent = async (item: HistoryItem) => {
    if (!confirm(`PERMANENT DELETE?\n\n${item.name}\n\nYe photo Cloudinary se hamesha ke liye delete ho jayegi, link bhi kaam nahi karega. Pakka?`)) return;
    setShowDeleteMenu(null);
    showToast("Deleting Permanent...");
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: item.public_id }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        saveHistory(history.filter((h) => h.public_id !== item.public_id));
        if (selectedPhoto?.public_id === item.public_id) setSelectedPhoto(null);
        showToast("Permanently Deleted!");
      } else {
        // Agar API nahi bani hai to sirf history se hatao aur batao
        saveHistory(history.filter((h) => h.public_id !== item.public_id));
        showToast("Removed - Permanent ke liye STEP 2 wala API banao");
      }
    } catch {
      saveHistory(history.filter((h) => h.public_id !== item.public_id));
      showToast("Removed From History");
    }
  };

  const getLinks = (item: HistoryItem) => ({
    direct: item.url,
    markdown: `![${item.name}](${item.url})`,
    html: `<img src="${item.url}" alt="${item.name}" />`,
    bbcode: `[img]${item.url}[/img]`,
    blogger: `<a href="${item.url}"><img src="${item.url}" /></a>`,
    wordpress: `[img src="${item.url}"]`,
    reddit: `[${item.name}](${item.url})`,
    forum: `[URL=${item.url}][IMG]${item.url}[/IMG][/URL]`,
    thumbnail: item.url.replace("/upload/", "/upload/w_300,h_300,c_fill/"),
  });

  const filtered = history.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));
  const currentLinks = selectedPhoto ? getLinks(selectedPhoto) : null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white px-4 py-5 max-w-[1100px] mx-auto">
      {/* OLD BEAUTIFUL HEADER - WAPAS */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="text-[38px]">📸</div>
          <div>
            <h1 className="font-black text-[26px] leading-none">Img<span className="text-orange-500">Bazar</span></h1>
            <p className="text-[10px] tracking-[2px] text-white/50 mt-1">BY VELORA • FREE IMAGE HOSTING</p>
          </div>
        </div>
        <span className="bg-white/10 px-4 py-2 rounded-full text-[13px] font-bold">⚡ Velora</span>
      </div>

      <div className="text-center mt-8">
        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-[12px] font-bold">● LIVE • NO LOGIN • UNLIMITED BANDWIDTH</span>
        <h2 className="font-black text-[38px] leading-[1.1] mt-5">Upload Image.<br /><span className="text-orange-500">Get Link. Use</span><br /><span className="text-orange-500">Anywhere.</span></h2>
        <p className="text-white/50 text-[14px] mt-3">Blogger, WordPress, Bazaru, Reddit, GitHub, Forums - Kahi bhi Use Karo. 9 Tarah ke Link Instantly!</p>
      </div>

      {/* OLD BEAUTIFUL UPLOAD BOX */}
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }} onClick={() => fileRef.current?.click()} className="mt-7 border-2 border-dashed border-white/20 rounded-[30px] p-8 text-center cursor-pointer bg-white/[0.02]">
        <div className="text-[55px]">📷</div>
        <p className="font-bold text-[20px] mt-2">Drag & Drop Images Here</p>
        <p className="text-white/50 text-[13px] mt-1">or Click to Browse • Paste (Ctrl+V) bhi Chalega!</p>
        <button className="mt-5 bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-3 rounded-full font-bold text-[15px]">Choose Images →</button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        {uploading && <p className="mt-4 text-orange-400 font-bold text-[14px] animate-pulse">{progressText}</p>}
      </div>

      {/* History */}
      <div className="flex justify-between items-center mt-8">
        <h3 className="font-bold text-[19px]">🕒 Your History ({filtered.length})</h3>
        {history.length > 0 && <button onClick={() => { if (confirm("Clear All History?")) saveHistory([]); }} className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-1.5 rounded-full text-[13px] font-bold">Clear All</button>}
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search photos..." className="w-full mt-3 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-[13px] outline-none" />

      {filtered.length === 0 ? (
        <p className="text-white/40 text-center py-10 text-[13px]">No photos yet. Select photo - Auto Upload ho jayega!</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {filtered.map((h) => (
            <div key={h.public_id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="relative cursor-pointer" onClick={() => setSelectedPhoto(h)}>
                <img src={h.url} className="w-full h-[170px] object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(showDeleteMenu === h.public_id ? null : h.public_id); }} className="absolute top-2 right-2 bg-red-500 w-7 h-7 rounded-full text-[12px] font-bold">✕</button>
                {/* Delete Menu - Remove / Permanent */}
                {showDeleteMenu === h.public_id && (
                  <div className="absolute top-10 right-2 bg-[#1A1A1A] border border-white/20 rounded-xl p-2 w-[160px] z-10" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => removeFromHistory(h.public_id)} className="w-full text-left px-2 py-2 rounded-lg text-[12px] hover:bg-white/10">🙈 Remove (History Only)</button>
                    <button onClick={() => deletePermanent(h)} className="w-full text-left px-2 py-2 rounded-lg text-[12px] text-red-400 hover:bg-red-500/20 font-bold">🗑️ Delete Permanent</button>
                    <button onClick={() => setShowDeleteMenu(null)} className="w-full text-center text-[11px] text-white/40 mt-1">Cancel</button>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold truncate">{h.name}</p>
                <p onClick={() => setSelectedPhoto(h)} className="text-emerald-400 text-[12px] mt-1 cursor-pointer">Click to Get Links →</p>
                {/* NEW - 4 Buttons Direct on Card */}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  <button onClick={() => copyLink(h.url)} className="bg-white/10 py-1.5 rounded-lg text-[14px]">📋</button>
                  <button onClick={() => shareLink(h.url, h.name)} className="bg-white/10 py-1.5 rounded-lg text-[14px]">🔗</button>
                  <button onClick={() => showQR(h.url)} className="bg-white/10 py-1.5 rounded-lg text-[14px]">📷</button>
                  <button onClick={() => downloadImage(h.url, h.name)} className="bg-white/10 py-1.5 rounded-lg text-[14px]">⬇️</button>
                </div>
                <p className="text-[10px] text-white/30 mt-1 text-center">📋 Copy • 🔗 Share • 📷 QR • ⬇️ Download</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Links Modal */}
      {selectedPhoto && currentLinks && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-[#1A1A1A] rounded-3xl p-5 w-full max-w-[500px] max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} className="w-full h-[220px] object-cover rounded-2xl" />
            <h3 className="font-black mt-3 truncate">{selectedPhoto.name}</h3>
            <div className="flex flex-wrap gap-1 mt-3">
              {Object.keys(currentLinks).map((k) => (
                <button key={k} onClick={() => setActiveTab(k)} className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize ${activeTab === k ? "bg-orange-500" : "bg-white/10"}`}>{k}</button>
              ))}
            </div>
            <div className="bg-black/50 p-3 rounded-xl mt-3 break-all text-[11px]">{(currentLinks as any)[activeTab]}</div>
            <button onClick={() => copyLink((currentLinks as any)[activeTab])} className="w-full mt-3 bg-orange-500 font-bold py-2.5 rounded-full text-[13px]">Copy {activeTab} Link</button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => shareLink(selectedPhoto.url, selectedPhoto.name)} className="bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 rounded-xl text-[12px] font-bold">🔗 Share Photo</button>
              <button onClick={() => showQR(selectedPhoto.url)} className="bg-white/10 py-2.5 rounded-xl text-[12px]">📷 QR Code</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button onClick={() => downloadImage(selectedPhoto.url, selectedPhoto.name)} className="bg-white/10 py-2 rounded-xl text-[12px]">⬇️ Download</button>
              <button onClick={() => copyLink(selectedPhoto.url)} className="bg-white/10 py-2 rounded-xl text-[12px]">📋 Copy</button>
              <button onClick={() => removeFromHistory(selectedPhoto.public_id)} className="bg-white/10 py-2 rounded-xl text-[12px]">🙈 Remove</button>
            </div>
            <button onClick={() => deletePermanent(selectedPhoto)} className="w-full mt-2 bg-red-500/20 border border-red-500/40 text-red-300 font-bold py-2.5 rounded-xl text-[12px]">🗑️ Delete Permanent - Cloudinary Se Bhi</button>
            <button onClick={() => setSelectedPhoto(null)} className="w-full mt-3 text-white/50 text-[12px]">Close</button>
          </div>
        </div>
      )}

      {/* QR Modal - NEW with Share / Download */}
      {qr && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setQr("")}>
          <div className="bg-white text-black rounded-3xl p-6 text-center max-w-[320px] w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black">Scan QR Code</h3>
            <p className="text-[11px] text-gray-500 mt-1">Dusre phone ke Camera se scan karo,<br />photo khul jayegi</p>
            <img src={qr} className="w-[200px] mx-auto mt-3" />
            <p className="text-[11px] break-all mt-2 text-gray-500">{qrUrl}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <button onClick={() => shareLink(qrUrl, "Photo")} className="bg-orange-500 text-white px-4 py-2 rounded-full text-[12px] font-bold">🔗 Share Link</button>
              <a href={qr} download="qr-code.png" className="bg-black text-white px-4 py-2 rounded-full text-[12px] font-bold">⬇️ QR Download</a>
            </div>
            <button onClick={() => copyLink(qrUrl)} className="mt-2 w-full bg-gray-100 py-2 rounded-full text-[12px] font-bold">📋 Copy Link</button>
            <button onClick={() => setQr("")} className="mt-3 text-gray-500 text-[12px]">Close</button>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-[13px] shadow-2xl z-50">{toast}</div>}
    </div>
  );
}
