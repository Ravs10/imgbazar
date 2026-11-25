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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [bulkMode, setBulkMode] = useState(false);
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
          } else { lastError = data.error?.message || "Unknown Error"; }
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
      showToast("Share not available, Link Copied!");
    }
  };

  const downloadImage = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url; a.download = name; a.target = "_blank"; a.click();
    showToast("Download Started!");
  };

  const showQR = (url: string) => {
    setQr(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`);
    setQrUrl(url);
  };

  // REMOVE - History only
  const removeFromHistory = (public_id: string) => {
    if (!confirm("Remove from History only? Photo link will still work.")) return;
    saveHistory(history.filter((h) => h.public_id !== public_id));
    setShowDeleteMenu(null);
    showToast("Removed From History");
  };

  // DELETE PERMANENT - Navigate to delete page
  const getDeleteLink = (public_id: string) => `${window.location.origin}/delete/${public_id}`;

  const deletePermanent = (item: HistoryItem) => {
    if (!confirm(`PERMANENT DELETE?\n\n${item.name}\n\nDelete Page will open. Pressing Yes will delete from Cloudinary forever.`)) return;
    window.location.href = `/delete/${item.public_id}`;
  };

  const copyDeleteLink = (public_id: string) => {
    const link = getDeleteLink(public_id);
    navigator.clipboard.writeText(link);
    showToast("Delete Link Copied! You can share it with anyone.");
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

  // === BULK SELECT HELPERS ===
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(h => h.public_id));
  };
  const bulkRemove = () => {
    if (!confirm(`Remove ${selectedIds.length} photos from History?`)) return;
    saveHistory(history.filter(h => !selectedIds.includes(h.public_id)));
    setSelectedIds([]); setBulkMode(false); showToast("Bulk Removed!");
  };
  const bulkDeletePermanent = async () => {
    if (!confirm(`${selectedIds.length} photos PERMANENT delete? Cloudinary se bhi hat jayengi, link band ho jayega!`)) return;
    showToast("Bulk Deleting...");
    for (const pid of selectedIds) {
      await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public_id: pid }) });
    }
    saveHistory(history.filter(h => !selectedIds.includes(h.public_id)));
    setSelectedIds([]); setBulkMode(false); showToast("Bulk Permanently Deleted!");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white px-4 py-5 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="text-[38px]">📸</div>
          <div>
            <div className="font-black text-[26px] leading-none">Img<span className="text-orange-500">Bazar</span></div>
            <p className="text-[10px] tracking-[2px] text-white/50 mt-1">BY VELORA • FREE IMAGE HOSTING</p>
          </div>
        </div>
        <span className="bg-white/10 px-4 py-2 rounded-full text-[13px] font-bold">⚡ Velora</span>
      </div>

      <div className="text-center mt-8">
        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-[12px] font-bold">● LIVE • NO LOGIN • UNLIMITED BANDWIDTH</span>
        <h1 className="font-black text-[38px] leading-[1.1] mt-5">Upload Image.<br /><span className="text-orange-500">Get Link. Use</span><br /><span className="text-orange-500">Anywhere.</span></h1>
        <p className="text-white/50 text-[14px] mt-3">Blogger, WordPress, Bazaru, Reddit, GitHub, Forums - Use Anywhere. 9 Types of Links Instantly!</p>
      </div>

      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }} onClick={() => fileRef.current?.click()} className="mt-7 border-2 border-dashed border-white/20 rounded-[30px] p-8 text-center cursor-pointer bg-white/[0.02]">
        <div className="text-[55px]">📷</div>
        <p className="font-bold text-[20px] mt-2">Drag & Drop Images Here</p>
        <p className="text-white/50 text-[13px] mt-1">or Click to Browse • Paste (Ctrl+V) works too!</p>
        <button className="mt-5 bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-3 rounded-full font-bold text-[15px]">Choose Images →</button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        {uploading && <p className="mt-4 text-orange-400 font-bold text-[14px] animate-pulse">{progressText}</p>}
      </div>

      <div className="flex justify-between items-center mt-8">
        <h3 className="font-bold text-[19px]">🕒 Your History ({filtered.length})</h3>
        {history.length > 0 && <button onClick={() => { if (confirm("Clear All History?")) saveHistory([]); }} className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-1.5 rounded-full text-[13px] font-bold">Clear All</button>}
      </div>

      {/* BULK DELETE BAR */}
      <div className="flex gap-2 mt-4 flex-wrap">
        <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }} className="bg-white/10 px-4 py-2 rounded-full text-[12px] font-bold">
          {bulkMode ? "❌ Cancel Bulk" : "☑️ Bulk Select"}
        </button>
        {bulkMode && (
          <>
            <button onClick={selectAll} className="bg-white/10 px-4 py-2 rounded-full text-[12px] font-bold">
              {selectedIds.length === filtered.length ? "Unselect All" : "Select All"}
            </button>
            {selectedIds.length > 0 && (
              <>
                <button onClick={bulkRemove} className="bg-orange-500 px-4 py-2 rounded-full text-[12px] font-bold">🙈 Remove {selectedIds.length}</button>
                <button onClick={bulkDeletePermanent} className="bg-red-500 px-4 py-2 rounded-full text-[12px] font-bold">🗑️ Delete Permanent {selectedIds.length}</button>
              </>
            )}
          </>
        )}
      </div>
      {bulkMode && selectedIds.length > 0 && <p className="text-[12px] text-orange-400 mt-2 font-bold">{selectedIds.length} photos selected</p>}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search photos..." className="w-full mt-3 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-[13px] outline-none" />

      {filtered.length === 0 ? (
        <p className="text-white/40 text-center py-10 text-[13px]">No photos yet. Select photo - Auto Upload will start!</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {filtered.map((h) => (
            <div key={h.public_id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="relative cursor-pointer" onClick={() => bulkMode ? toggleSelect(h.public_id) : setSelectedPhoto(h)}>
                <img src={h.url} className="w-full h-[170px] object-cover" />
                {bulkMode && (
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(h.public_id); }} className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[14px] font-bold z-10 ${selectedIds.includes(h.public_id) ? "bg-orange-500 border-orange-500" : "bg-black/60 border-white"}`}>
                    {selectedIds.includes(h.public_id) ? "✓" : ""}
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(showDeleteMenu === h.public_id ? null : h.public_id); }} className="absolute top-2 right-2 bg-red-500 w-7 h-7 rounded-full text-[12px] font-bold">✕</button>
                {showDeleteMenu === h.public_id && (
                  <div className="absolute top-10 right-2 bg-[#1A1A1A] border border-white/20 rounded-xl p-2 w-[180px] z-10" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => removeFromHistory(h.public_id)} className="w-full text-left px-2 py-2 rounded-lg text-[12px] hover:bg-white/10">🙈 Remove (History Only)</button>
                    <button onClick={() => deletePermanent(h)} className="w-full text-left px-2 py-2 rounded-lg text-[12px] text-red-400 hover:bg-red-500/20 font-bold">🗑️ Delete Permanent</button>
                    <button onClick={() => copyDeleteLink(h.public_id)} className="w-full text-left px-2 py-2 rounded-lg text-[12px] hover:bg-white/10">🔗 Copy Delete Link</button>
                    <button onClick={() => setShowDeleteMenu(null)} className="w-full text-center text-[11px] text-white/40 mt-1">Cancel</button>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold truncate">{h.name}</p>
                <p onClick={() => setSelectedPhoto(h)} className="text-emerald-400 text-[12px] mt-1 cursor-pointer">Click to Get Links →</p>
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
            <button onClick={() => deletePermanent(selectedPhoto)} className="w-full mt-2 bg-red-500/20 border border-red-500/40 text-red-300 font-bold py-2.5 rounded-xl text-[12px]">🗑️ Delete Permanent - From Cloudinary</button>
            <button onClick={() => copyDeleteLink(selectedPhoto.public_id)} className="w-full mt-2 bg-white/10 font-bold py-2.5 rounded-xl text-[12px]">🔗 Copy Delete Link</button>
            <button onClick={() => setSelectedPhoto(null)} className="w-full mt-3 text-white/50 text-[12px]">Close</button>
          </div>
        </div>
      )}

      {qr && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setQr("")}>
          <div className="bg-white text-black rounded-3xl p-6 text-center max-w-[320px] w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black">Scan QR Code</h3>
            <p className="text-[11px] text-gray-500 mt-1">Scan with another phone's Camera,<br />photo will open</p>
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

      {/* ============ SEO CONTENT + GUIDE + FAQ + TOOLS ============ */}
      <div className="mt-16 space-y-10 pb-10">

        {/* HOW TO USE */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[22px]">How To Use ImgBazar - Free Image Hosting?</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">Uploading images with ImgBazar is super easy. This is the <b className="text-white">best free image hosting</b> tool for Blogger, WordPress, Reddit and Forums. No login, no signup, 100% free.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <div className="bg-black/40 p-4 rounded-2xl"><p className="text-[24px]">1️⃣</p><h3 className="font-bold text-[14px] mt-2">Step 1 - Upload Image</h3><p className="text-white/50 text-[12px] mt-1">Click Choose Images, Drag & Drop, or Paste with Ctrl+V. Photo uploads to Cloudinary instantly.</p></div>
            <div className="bg-black/40 p-4 rounded-2xl"><p className="text-[24px]">2️⃣</p><h3 className="font-bold text-[14px] mt-2">Step 2 - Get Direct Link</h3><p className="text-white/50 text-[12px] mt-1">Click on the photo. Direct, Markdown, HTML, BBCode, Blogger, WordPress — 9 types of links.</p></div>
            <div className="bg-black/40 p-4 rounded-2xl"><p className="text-[24px]">3️⃣</p><h3 className="font-bold text-[14px] mt-2">Step 3 - Use Anywhere</h3><p className="text-white/50 text-[12px] mt-1">Paste the link into Blogger, WordPress, GitHub, Reddit, Forums. Or share via QR Code.</p></div>
          </div>
        </section>

        {/* WHY IMGBAZAR */}
        <section>
          <h2 className="font-black text-[22px]">Why ImgBazar Is Best ImgBB & Postimages Alternative?</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-[13px]">
            <div className="bg-white/5 p-4 rounded-2xl">⚡ <b>Unlimited Bandwidth</b><p className="text-white/50 mt-1">No limits — as many views as you need.</p></div>
            <div className="bg-white/5 p-4 rounded-2xl">🔗 <b>Delete Link System</b><p className="text-white/50 mt-1">Separate Delete Link for every photo. Permanently delete anytime.</p></div>
            <div className="bg-white/5 p-4 rounded-2xl">📷 <b>QR Code Generator</b><p className="text-white/50 mt-1">Generate QR for any photo, scan from another phone to open.</p></div>
            <div className="bg-white/5 p-4 rounded-2xl">🔒 <b>No Login, 100% Free</b><p className="text-white/50 mt-1">No account, no signup. Just upload directly.</p></div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[22px]">Frequently Asked Questions - FAQ</h2>
          {[
            { q: "What is ImgBazar and how does it work?", a: "ImgBazar is a free image hosting website. You upload images here, they are saved to Cloudinary, and you get a direct link that works anywhere — Blogger, WordPress, Reddit, and more." },
            { q: "Will my uploaded photo stay forever?", a: "Yes, as long as you don't click Delete Permanent, the photo stays on Cloudinary and the link keeps working." },
            { q: "How do I permanently delete a photo?", a: "Click the ✕ on the photo → press Delete Permanent. A Delete Page opens, press Yes and it's deleted from Cloudinary forever." },
            { q: "How do I use an ImgBazar link in Blogger?", a: "Click the photo → select the Blogger tab → copy → paste into your Blogger post in HTML view. The photo shows up." },
            { q: "Is ImgBazar better than ImgBB?", a: "ImgBazar gives you No-Login Upload like ImgBB, plus QR Code, Bulk Delete, and Delete Link which ImgBB doesn't offer." },
          ].map((f, i) => (
            <div key={i} className="border-b border-white/10 last:border-0">
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex justify-between text-left py-3 font-bold text-[14px]">{f.q}<span>{faqOpen === i ? "−" : "+"}</span></button>
              {faqOpen === i && <p className="text-white/60 text-[13px] pb-3 leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </section>

        {/* OTHER USEFUL TOOLS */}
        <section>
          <h2 className="font-black text-[22px]">Other Useful Tools By Velora</h2>
          <p className="text-white/50 text-[13px] mt-1">Free tools for creators - No login, 100% free.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { icon: "🗜️", title: "Image Compressor", desc: "Reduce photo size", color: "from-orange-500 to-pink-500", tag: "Popular" },
              { icon: "📐", title: "Image Resizer", desc: "Resize to 300x300, 1080p", color: "from-blue-500 to-cyan-500", tag: "New" },
              { icon: "🔄", title: "JPG to PNG", desc: "Convert format", color: "from-emerald-500 to-teal-500", tag: "Free" },
              { icon: "📷", title: "QR Generator", desc: "QR for any link", color: "from-purple-500 to-pink-500", tag: "Free" },
              { icon: "✂️", title: "Background Remover", desc: "Remove photo background", color: "from-red-500 to-orange-500", tag: "Coming Soon" },
              { icon: "😂", title: "Meme Maker", desc: "Add text to photos", color: "from-yellow-500 to-orange-500", tag: "Coming Soon" },
            ].map((t, i) => (
              <div key={i} onClick={() => showToast(`${t.title} - Coming Soon!`)} className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/50 hover:shadow-[0_20px_40px_rgba(249,115,22,0.3)] hover:bg-white/10 active:scale-95">
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <span className="absolute top-3 right-3 bg-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full">{t.tag}</span>
                <div className="text-[36px] transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">{t.icon}</div>
                <h3 className="font-black text-[14px] mt-3 group-hover:text-orange-400 transition-colors">{t.title}</h3>
                <p className="text-white/50 text-[11px] mt-1">{t.desc}</p>
                <p className="text-orange-400 text-[11px] font-bold mt-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">Try Now →</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-white/30 text-[11px]">© 2026 ImgBazar By Velora • Free Image Hosting • Upload Image Get Link • Blogger • WordPress • Reddit • Forums</p>
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-[13px] shadow-2xl z-50">{toast}</div>}
    </div>
  );
}
