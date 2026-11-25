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

  const removeFromHistory = (public_id: string) => {
    if (!confirm("Remove from History only? Photo link will still work.")) return;
    saveHistory(history.filter((h) => h.public_id !== public_id));
    setShowDeleteMenu(null);
    showToast("Removed From History");
  };

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
                <p onClick={() => bulkMode ? toggleSelect(h.public_id) : setSelectedPhoto(h)} className="text-emerald-400 text-[12px] mt-1 cursor-pointer">{bulkMode ? "Tap to Select ✓" : "Click to Get Links →"}</p>
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

      {/* ============ DETAILED SEO CONTENT + GUIDE + FAQ + TOOLS ============ */}
      <div className="mt-16 space-y-10 pb-10">

        {/* WHAT IS IMGBAZAR */}
        <section className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-[25px] p-6">
          <h2 className="font-black text-[24px]">What is ImgBazar? The Complete Free Image Hosting Solution</h2>
          <p className="text-white/70 text-[13.5px] mt-3 leading-relaxed">
            <b className="text-white">ImgBazar</b> is a modern, lightning-fast, and completely free image hosting platform built for bloggers, content creators, developers, forum posters, and everyday users who need to share images online quickly. Whether you are writing a blog post on Blogger, creating a product listing on Bazaru, building a GitHub README, posting on Reddit, or sharing a screenshot on a forum — ImgBazar gives you a permanent, direct, hotlink-friendly image link in seconds.
          </p>
          <p className="text-white/60 text-[13.5px] mt-3 leading-relaxed">
            Unlike traditional image hosts that force you to create an account, verify your email, or pay for a "pro" plan, ImgBazar works on a completely no-login basis. No signup. No password. No email verification. Just drag your image in, wait two seconds, and grab your link. Our backend is powered by Cloudinary's enterprise-grade CDN infrastructure, which means your images load blazing fast from anywhere in the world, with unlimited bandwidth and 99.9% uptime.
          </p>
          <p className="text-white/60 text-[13.5px] mt-3 leading-relaxed">
            We built ImgBazar because we were tired of image hosts that watermark your photos, add ugly redirect pages, or delete your images after 30 days. ImgBazar images stay forever unless you explicitly delete them. We also give you <b className="text-white">9 different link formats</b> — Direct, Markdown, HTML, BBCode, Blogger, WordPress, Reddit, Forum, and Thumbnail — so you never have to manually format your image links again.
          </p>
        </section>

        {/* COMPLETE GUIDE */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[24px]">Complete Step-by-Step User Guide - How To Use ImgBazar</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">Using ImgBazar is incredibly simple. You can upload an image and get a shareable link in under 5 seconds. Here is the complete walkthrough:</p>

          <div className="mt-5 space-y-4">
            <div className="bg-black/40 p-5 rounded-2xl">
              <h3 className="font-bold text-[15px] text-orange-400">Step 1: Upload Your Image (3 Ways)</h3>
              <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
                There are three different ways to upload your image to ImgBazar, and all of them work perfectly. <b className="text-white">Method 1 — Click Upload:</b> Click the large dashed upload box in the center of the page and select one or more images from your device. You can select multiple files at once — ImgBazar will upload them all simultaneously.
              </p>
              <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
                <b className="text-white">Method 2 — Drag & Drop:</b> If you have images open in your file explorer, just drag them directly onto the upload box and drop them. This is the fastest method for uploading from a desktop or laptop.
              </p>
              <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
                <b className="text-white">Method 3 — Paste (Ctrl+V):</b> This is the most underrated feature. If you copied an image to your clipboard — for example, by taking a screenshot with Win+Shift+S or pressing Cmd+Shift+4 on Mac — simply press <b className="text-white">Ctrl+V</b> (or Cmd+V) anywhere on the ImgBazar page, and the screenshot will automatically upload. Perfect for sharing screenshots in chat groups, forums, or support tickets.
              </p>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl">
              <h3 className="font-bold text-[15px] text-orange-400">Step 2: Get Your Link (9 Formats)</h3>
              <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
                Once your image finishes uploading, it appears in your History section below. Click on the image (or click "Click to Get Links →"), and a modal opens showing you all the details. You will see 9 tabs at the top of the modal — each one gives you a different link format. Click any tab to instantly see that format, then click the big orange <b className="text-white">"Copy Link"</b> button to grab it.
              </p>
              <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
                The 9 formats are: <b className="text-white">Direct</b> (raw image URL — works in every image embed), <b className="text-white">Markdown</b> (for GitHub, Reddit, Discord, Notion), <b className="text-white">HTML</b> (for any website's source code), <b className="text-white">BBCode</b> (for phpBB, XenForo, vBulletin forums), <b className="text-white">Blogger</b> (ready-to-paste link tag for Blogger posts), <b className="text-white">WordPress</b> (shortcode format for WordPress), <b className="text-white">Reddit</b> (auto-formatted for Reddit's markdown), <b className="text-white">Forum</b> (combined URL+IMG BBCode), and <b className="text-white">Thumbnail</b> (300x300 cropped version for grid layouts).
              </p>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl">
              <h3 className="font-bold text-[15px] text-orange-400">Step 3: Use Anywhere</h3>
              <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
                Paste your copied link into any platform — Blogger HTML view, WordPress text editor, GitHub README.md file, Reddit comments, Facebook posts, WhatsApp chats, Twitter, Discord, Telegram, or any forum. The image will render instantly because ImgBazar uses Cloudinary's global CDN with servers in over 20 countries. Load times are typically under 200ms anywhere in the world.
              </p>
            </div>
          </div>
        </section>

        {/* WHY IMGBAZAR DETAILED */}
        <section>
          <h2 className="font-black text-[24px]">Why ImgBazar is the Best Free Image Hosting in 2026</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">Compared to ImgBB, Postimages, Imgur, TinyPic, and dozens of other free image hosts, ImgBazar brings a set of features that no competitor offers — all completely free, with no hidden paywalls.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-[13px]">
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">⚡</div>
              <b className="text-white">Unlimited Bandwidth</b>
              <p className="text-white/50 mt-1 leading-relaxed">Upload once, view a million times. ImgBazar has no view limits, no bandwidth caps, no hotlink protection. Your image can go viral on Reddit or Hacker News and it will still load instantly for every visitor.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">🔗</div>
              <b className="text-white">Delete Link System</b>
              <p className="text-white/50 mt-1 leading-relaxed">Every photo gets its own unique Delete Link. Share it with anyone and they can permanently delete the image from Cloudinary with one click — no login needed. Perfect for time-limited content or privacy-sensitive uploads.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">📷</div>
              <b className="text-white">QR Code Generator</b>
              <p className="text-white/50 mt-1 leading-relaxed">Generate a scannable QR code for any uploaded image. Print it on a poster, add to a physical document, or share with someone who is on another device. Just point their phone camera at the QR and the image opens instantly.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">🔒</div>
              <b className="text-white">No Login, No Tracking</b>
              <p className="text-white/50 mt-1 leading-relaxed">Zero accounts, zero cookies from us, zero advertising trackers. Your uploads are stored on Cloudinary's secure infrastructure and never sold, scanned, or shared with third parties. What you upload is what you get.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">☑️</div>
              <b className="text-white">Bulk Upload + Bulk Delete</b>
              <p className="text-white/50 mt-1 leading-relaxed">Select 50 images at once, upload them all together, and manage them with the Bulk Select mode. Delete or remove 100+ photos in one click — something ImgBB and Postimages don't allow without an account.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">🌐</div>
              <b className="text-white">Cloudinary CDN Backend</b>
              <p className="text-white/50 mt-1 leading-relaxed">Your images are served from Cloudinary — the same CDN used by Netflix, Spotify, and Fortune 500 companies. Global edge servers mean your images load in under 200ms from anywhere in the world, guaranteed.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">💾</div>
              <b className="text-white">No Expiry, No Watermark</b>
              <p className="text-white/50 mt-1 leading-relaxed">Unlike TinyPic (RIP) or other hosts that auto-delete after 30/60 days, ImgBazar images never expire. No watermark, no logo overlay, no compression artifacts. Pure, original quality, forever.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[20px]">📱</div>
              <b className="text-white">Mobile-Friendly Design</b>
              <p className="text-white/50 mt-1 leading-relaxed">The entire ImgBazar interface is fully responsive. Upload, copy, share, and delete from your phone just as easily as on desktop. Touch-optimized buttons, smooth scrolling, and instant paste support on iOS and Android.</p>
            </div>
          </div>
        </section>

        {/* PLATFORM INTEGRATION GUIDES */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[24px]">How To Use ImgBazar Links on Every Platform</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">Here is exactly how to embed an ImgBazar image on the most popular platforms. Bookmark this section if you frequently post images online.</p>

          <div className="mt-5 space-y-3">
            <div className="bg-black/40 p-4 rounded-2xl">
              <h3 className="font-bold text-[14px] text-emerald-400">📝 Blogger</h3>
              <p className="text-white/60 text-[12.5px] mt-1 leading-relaxed">Click the image → select "Blogger" tab → copy the full HTML link. In your Blogger post editor, switch to <b className="text-white">HTML view</b> (not Compose), paste the code, and click Preview. The image appears. Switch back to Compose view and continue writing.</p>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl">
              <h3 className="font-bold text-[14px] text-emerald-400">🌐 WordPress</h3>
              <p className="text-white/60 text-[12.5px] mt-1 leading-relaxed">Copy the "Direct" link from ImgBazar. In WordPress editor (Gutenberg or Classic), click <b className="text-white">Add Media → Insert from URL</b>, paste the link, and the image loads directly into your media library. No upload needed. Also works perfectly with Elementor, Divi, and other page builders.</p>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl">
              <h3 className="font-bold text-[14px] text-emerald-400">👽 Reddit</h3>
              <p className="text-white/60 text-[12.5px] mt-1 leading-relaxed">Reddit natively supports Markdown. Copy the "Markdown" tab and paste directly into your Reddit comment or post. Example: <code className="bg-black/60 px-1 rounded text-[11px]">![name](url)</code> renders as an inline image. Use the "Direct" link if you want to share a clickable URL instead.</p>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl">
              <h3 className="font-bold text-[14px] text-emerald-400">💻 GitHub</h3>
              <p className="text-white/60 text-[12.5px] mt-1 leading-relaxed">Paste the Markdown link into your README.md file or any issue/PR comment. GitHub automatically renders it as an image. For repository images, you can also use the ImgBazar "Thumbnail" link to keep README loading fast on mobile.</p>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl">
              <h3 className="font-bold text-[14px] text-emerald-400">🗨️ Forums (phpBB / XenForo / vBulletin)</h3>
              <p className="text-white/60 text-[12.5px] mt-1 leading-relaxed">Copy the "BBCode" tab. Paste it into your forum post's source editor. Example: <code className="bg-black/60 px-1 rounded text-[11px]">[img]url[/img]</code>. If you want a clickable thumbnail (image on left, opens in new tab), use the "Forum" tab which combines <code className="bg-black/60 px-1 rounded text-[11px]">[URL=]</code> and <code className="bg-black/60 px-1 rounded text-[11px]">[IMG]</code> tags.</p>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl">
              <h3 className="font-bold text-[14px] text-emerald-400">💬 Discord / Telegram / WhatsApp</h3>
              <p className="text-white/60 text-[12.5px] mt-1 leading-relaxed">Just copy the "Direct" link and paste it into the chat. All three platforms auto-embed the image preview. On Discord, images under 8 MB are automatically unfurled. On Telegram, direct links show a preview card. On WhatsApp, the image loads as an inline thumbnail you can tap to view full-size.</p>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl">
              <h3 className="font-bold text-[14px] text-emerald-400">📧 Email (Gmail / Outlook)</h3>
              <p className="text-white/60 text-[12.5px] mt-1 leading-relaxed">Copy the "Direct" link and paste it into your email body. Gmail and Outlook will auto-detect it as an image and show a preview. For newsletters, use the HTML tab to embed the image with proper alt text.</p>
            </div>
          </div>
        </section>

        {/* BULK MANAGEMENT GUIDE */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[24px]">Bulk Upload & Bulk Delete - Managing Large Image Collections</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            If you are a power user who uploads many images regularly (for product listings, blog posts, documentation, or social media), ImgBazar's bulk management features are a lifesaver.
          </p>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            <b className="text-white">Bulk Upload:</b> Simply select multiple files in the file picker (Ctrl+A or Shift+Click) or drag a whole folder of images onto the upload box. ImgBazar uploads them sequentially with a live progress indicator showing "Uploading X / Y". Each image gets its own unique link, so you can differentiate them easily.
          </p>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            <b className="text-white">Bulk Select Mode:</b> Click the "☑️ Bulk Select" button below the History header. Now every image card shows a checkbox in the top-left corner. Tap images to select them (or click "Select All" to select everything at once). The bottom bar shows how many photos are selected.
          </p>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            <b className="text-white">Bulk Remove:</b> Click "🙈 Remove N" to strip the selected photos from your History list without affecting their Cloudinary URLs. Their links will continue to work — only your local list is cleaned up. This is perfect when you're done with a batch of images but want the links to stay alive.
          </p>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            <b className="text-white">Bulk Delete Permanent:</b> Click "🗑️ Delete Permanent N" to permanently delete the selected images from Cloudinary. <b className="text-red-400">Warning:</b> This is irreversible. Anywhere those links are embedded (blog posts, forums, comments) will show broken images forever. Use this only when you're 100% sure.
          </p>
        </section>

        {/* DELETE SYSTEM */}
        <section>
          <h2 className="font-black text-[24px]">Understanding ImgBazar's Delete System - Remove vs Delete Permanent</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            ImgBazar has two distinct deletion methods, and understanding the difference is important:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-[13px]">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
              <b className="text-amber-300">🙈 Remove from History</b>
              <p className="text-white/60 mt-2 leading-relaxed">Removes the photo from your local browser's History list only. The image stays on Cloudinary, so all your links continue to work. If someone visits your blog post or forum, they still see the image. This is what you want 90% of the time.</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
              <b className="text-red-300">🗑️ Delete Permanent</b>
              <p className="text-white/60 mt-2 leading-relaxed">Permanently deletes the image from Cloudinary's servers. All links break immediately and forever. Use this only when you truly want the image gone from the internet. ImgBazar takes you to a separate Delete Page where you confirm with a "Yes" click.</p>
            </div>
          </div>
          <p className="text-white/60 text-[13px] mt-3 leading-relaxed">
            <b className="text-white">Copy Delete Link</b> lets you share a one-click delete URL with anyone. Give it to a client, a collaborator, or a friend — they don't need a login. Just open the link, press Yes, and the image is permanently gone. This is extremely useful for content creators who want to give clients control over their own images without handing over account access.
          </p>
        </section>

        {/* QR GUIDE */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[24px]">QR Code Feature - Share Images Offline</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            Every ImgBazar photo can be instantly converted to a scannable QR code. Click the 📷 icon next to any image, and a QR modal pops up. Point any phone camera (iOS, Android, or third-party) at the QR code and the image will open in their browser instantly.
          </p>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">
            <b className="text-white">Real-world use cases for QR codes:</b> Print QR on business cards to share your portfolio images. Add QR to event flyers so attendees can view the full-size poster. Print QR on product packaging so customers can see additional product photos. Add QR to physical documents (contracts, invoices, reports) to attach image evidence. Or simply use it to share an image with someone nearby — no typing, no email, just point and scan.
          </p>
        </section>

        {/* FAQ - DETAILED */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[24px]">Frequently Asked Questions (FAQ) - Everything You Need to Know</h2>
          <div className="mt-3">
            {[
              { q: "What is ImgBazar and how does it work?", a: "ImgBazar is a completely free image hosting website. You upload an image, it is stored on Cloudinary's global CDN, and you instantly get a permanent direct link plus 8 other link formats (Markdown, HTML, BBCode, Blogger, WordPress, Reddit, Forum, Thumbnail). No login, no signup, no credit card — just paste, upload, and share. The image stays online forever unless you explicitly delete it." },
              { q: "Is ImgBazar really 100% free? Are there hidden limits?", a: "Yes, ImgBazar is completely free forever. There are no view limits, no bandwidth caps, no file-size restrictions (up to Cloudinary's 10 MB free-tier limit), no watermarks, no "premium" tiers, and no forced ads. You can upload as many images as you want, from as many devices as you want, with zero restrictions." },
              { q: "Will my uploaded photo stay online forever?", a: "Yes. As long as you do not click 'Delete Permanent', your image stays on Cloudinary's servers indefinitely. There is no automatic expiry like TinyPic or ImageShack. Links stay active forever and always load fast." },
              { q: "How do I permanently delete a photo from Cloudinary?", a: "Open any photo, click the red '🗑️ Delete Permanent' button. A confirmation modal appears warning you that this is irreversible. Press OK, and ImgBazar navigates you to a dedicated Delete Page. Click 'Yes, Delete Forever' and the image is instantly removed from Cloudinary's servers. All links to that image will now show as broken." },
              { q: "Can I bulk delete multiple photos at once?", a: "Yes! Click '☑️ Bulk Select' below the History header. Every card shows a checkbox. Tap photos to select them or click 'Select All'. Then choose '🙈 Remove N' (removes from your list but keeps image alive) or '🗑️ Delete Permanent N' (deletes from Cloudinary forever). Bulk delete uses the /api/delete endpoint to process each image in sequence." },
              { q: "Is ImgBazar better than ImgBB and Postimages?", a: "Yes, in several ways. ImgBazar offers: (1) No-login upload like ImgBB but with (2) Bulk Delete + Bulk Select which ImgBB doesn't have, (3) QR code generation for every image which neither ImgBB nor Postimages offers, (4) Copy Delete Link to share deletion control without account access, (5) 9 link formats including Thumbnail auto-resize. Postimages caps free uploads at 32 MB; ImgBazar doesn't." },
              { q: "How do I paste a screenshot directly without saving it?", a: "Press Ctrl+V (Windows/Linux) or Cmd+V (Mac) anywhere on the ImgBazar page. If your clipboard contains an image (like a Snipping Tool screenshot, Win+Shift+S capture, or copied image from a browser), it will auto-upload instantly. No need to save a temp file first." },
              { q: "What is the maximum image file size I can upload?", a: "ImgBazar supports images up to 10 MB per file on Cloudinary's free tier. Supported formats include JPG, PNG, GIF, WebP, BMP, SVG, and AVIF. For images larger than 10 MB, compress them first using the 'Image Compressor' tool (coming soon) or an external tool like TinyPNG." },
              { q: "How do I embed ImgBazar images in a Blogger post?", a: "Click the image → select the Blogger tab → copy the full HTML <a href=\"...\"> tag. In Blogger post editor, click the '< >' button to switch to HTML view. Paste the code. Click Preview — the image should appear. Switch back to Compose view and continue editing normally." },
              { q: "Will my image links work on WhatsApp, Discord, and Telegram?", a: "Yes, absolutely. Copy the 'Direct' link and paste it into any chat. WhatsApp shows a thumbnail preview (tap to open full-size). Discord auto-unfurls images under 8 MB. Telegram generates a rich preview card. All three platforms work perfectly because ImgBazar URLs are hotlink-friendly and end with proper image extensions." },
              { q: "Do you store my images? Is my data private?", a: "Your images are stored on Cloudinary — the same CDN used by Netflix, Spotify, and Fortune 500 companies. ImgBazar does not store any images on our own servers, does not track you with cookies, and does not sell or share your data. Your upload history is stored only in your browser's localStorage — nothing is sent to us. What you upload is what you get." },
              { q: "Can I use ImgBazar for commercial purposes?", a: "Yes. You can upload images for client work, business websites, e-commerce product photos, marketing materials, email newsletters — anything you want. There are no restrictions on commercial use. Just make sure you have legal rights to the images you upload." },
              { q: "What happens if I clear my browser data?", a: "Your ImgBazar History list is stored in your browser's localStorage. If you clear browser data or switch to a different device/browser, your History list will be empty — but the images themselves remain on Cloudinary and all links you've already shared continue to work perfectly. Only your local list is affected." },
              { q: "Can I use ImgBazar on my phone?", a: "Yes, ImgBazar is fully mobile-responsive. Upload from your phone's camera roll, paste screenshots from mobile clipboard, and share links via WhatsApp/Instagram/Telegram directly from the browser's native share sheet. The entire interface is touch-optimized." },
              { q: "How do I report a bug or request a feature?", a: "ImgBazar is built by the Velora team. You can reach out via the Velora dashboard or email. We read every message and ship improvements weekly. If you find a bug, please describe the steps to reproduce it — screenshots (uploaded via ImgBazar, of course!) help a lot." },
            ].map((f, i) => (
              <div key={i} className="border-b border-white/10 last:border-0">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex justify-between text-left py-3 font-bold text-[14px] gap-3">{f.q}<span className="shrink-0">{faqOpen === i ? "−" : "+"}</span></button>
                {faqOpen === i && <p className="text-white/60 text-[13px] pb-3 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* TIPS & BEST PRACTICES */}
        <section className="bg-white/5 border border-white/10 rounded-[25px] p-6">
          <h2 className="font-black text-[24px]">Tips & Best Practices for Better Image Hosting</h2>
          <p className="text-white/60 text-[13px] mt-2 leading-relaxed">Follow these tips to get the most out of ImgBazar and make sure your images stay fast, safe, and accessible:</p>
          <ul className="mt-3 space-y-2 text-[13px] text-white/60 leading-relaxed">
            <li><b className="text-white">1. Compress before uploading.</b> Even though ImgBazar has no limits, compressing your images with TinyPNG or Squoosh before upload reduces load time on your end and saves mobile data for your viewers. Aim for under 300 KB for web images.</li>
            <li><b className="text-white">2. Use the Thumbnail link for grids.</b> If you're displaying 20 product photos in a grid, use the Thumbnail link (300x300 cropped). It loads 10x faster than the full-size version and looks better in uniform grids.</li>
            <li><b className="text-white">3. Add alt text with the HTML link.</b> For SEO and accessibility, always include descriptive alt text when embedding. Example: <code className="bg-black/60 px-1 rounded text-[11px]">&lt;img src="..." alt="Wireless Bluetooth Earbuds - Black" /&gt;</code>. Google uses alt text to understand the image.</li>
            <li><b className="text-white">4. Keep important images backed up.</b> While ImgBazar never auto-deletes, if you're storing critical images (product photos, client work), keep a backup on Google Drive or your local disk. This protects you if you accidentally click "Delete Permanent".</li>
            <li><b className="text-white">5. Share the Delete Link carefully.</b> Once you share a Delete Link, anyone holding it can permanently delete your image. Only give it to trusted parties (clients, collaborators). Never post it publicly.</li>
            <li><b className="text-white">6. Use descriptive filenames.</b> Before uploading, rename your file to something meaningful like "smart-watch-fitness-tracker.jpg" instead of "IMG_1234.jpg". The filename becomes part of the URL, which helps with SEO on platforms like Blogger and WordPress.</li>
            <li><b className="text-white">7. Never upload sensitive content.</b> No matter how "private" a link feels, anything on the internet can be shared. Don't upload ID cards, bank statements, passwords, or private documents. ImgBazar is for public image hosting only.</li>
            <li><b className="text-white">8. Preview before posting.</b> Always preview your blog post or forum thread before publishing. This confirms that the ImgBazar link is working, that the image renders at the correct size, and that alt text appears properly if the image fails to load.</li>
          </ul>
        </section>

        {/* OTHER TOOLS */}
        <section>
          <h2 className="font-black text-[24px]">Other Free Tools By Velora</h2>
          <p className="text-white/50 text-[13px] mt-1">Free tools for creators — No login, 100% free, built for the same mission as ImgBazar.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { icon: "🗜️", title: "Image Compressor", desc: "Reduce photo size without losing quality", color: "from-orange-500 to-pink-500", tag: "Popular" },
              { icon: "📐", title: "Image Resizer", desc: "Resize to 300x300, 1080p, or custom", color: "from-blue-500 to-cyan-500", tag: "New" },
              { icon: "🔄", title: "JPG to PNG Converter", desc: "Convert format instantly", color: "from-emerald-500 to-teal-500", tag: "Free" },
              { icon: "📷", title: "QR Generator", desc: "QR for any link or text", color: "from-purple-500 to-pink-500", tag: "Free" },
              { icon: "✂️", title: "Background Remover", desc: "Remove photo background with AI", color: "from-red-500 to-orange-500", tag: "Coming Soon" },
              { icon: "😂", title: "Meme Maker", desc: "Add text to photos in seconds", color: "from-yellow-500 to-orange-500", tag: "Coming Soon" },
            ].map((t, i) => (
              <div key={i} onClick={() => showToast(`${t.title} - Coming Soon!`)} className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/50 hover:shadow-[0_20px_40px_rgba(249,115,22,0.3)] hover:bg-white/10 active:scale-95">
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <span className="absolute top-3 right-3 bg-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full">{t.tag}</span>
                <div className="text-[36px] transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">{t.icon}</div>
                <h3 className="font-black text-[14px] mt-3 group-hover:text-orange-400 transition-colors">{t.title}</h3>
                <p className="text-white/50 text-[11px] mt-1 leading-relaxed">{t.desc}</p>
                <p className="text-orange-400 text-[11px] font-bold mt-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">Try Now →</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-white/30 text-[11px] leading-relaxed">© 2026 ImgBazar By Velora • Free Image Hosting • Upload Image Get Link • Blogger • WordPress • Reddit • Forums • Unlimited Bandwidth • No Login Required</p>
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-[13px] shadow-2xl z-50">{toast}</div>}
    </div>
  );
}
