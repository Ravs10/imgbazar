"use client";
import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";

type HistoryItem = {
  public_id: string;
  url: string;
  name: string;
  size: number;
  date: string;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [qr, setQr] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("imgbazar_history") || "[]");
    setHistory(saved);
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("imgbazar_history", JSON.stringify(items));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...arr]);
    const newPreviews = arr.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (files.length === 0) return showToast("Please select images first");
    setUploading(true);
    setProgress(0);
    const newItems: HistoryItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const form = new FormData();
      form.append("file", files[i]);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        newItems.push({
          public_id: data.public_id,
          url: data.url,
          name: files[i].name,
          size: files[i].size,
          date: new Date().toLocaleDateString(),
        });
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    saveHistory([...newItems, ...history]);
    setFiles([]); setPreviews([]);
    setUploading(false); setProgress(0);
    showToast(`${newItems.length} Photos Uploaded Successfully!`);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("Link Copied!");
  };

  const downloadImage = async (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url; a.download = name; a.target = "_blank";
    a.click();
    showToast("Download Started!");
  };

  const shareImage = async (url: string) => {
    if (navigator.share) {
      await navigator.share({ title: "Imgbazar Photo", url });
    } else { copyLink(url); }
  };

  const showQR = async (url: string) => {
    const qrData = await QRCode.toDataURL(url);
    setQr(qrData); setQrUrl(url);
  };

  const deleteOne = async (public_id: string) => {
    if (!confirm("Delete this photo permanently?")) return;
    await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public_id }) });
    saveHistory(history.filter(h => h.public_id !== public_id));
    showToast("Photo Deleted!");
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return showToast("Select photos first");
    if (!confirm(`Delete ${selected.length} photos?`)) return;
    for (const id of selected) {
      await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public_id: id }) });
    }
    saveHistory(history.filter(h => !selected.includes(h.public_id)));
    setSelected([]); showToast("Selected Photos Deleted!");
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = history.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "today") return matchSearch && h.date === new Date().toLocaleDateString();
    return matchSearch;
  });

  const totalSize = (history.reduce((s, h) => s + (h.size || 0), 0) / 1024 / 1024).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white px-4 py-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-black text-[26px]">📸 <span className="text-purple-400">Img</span>Bazar</h1>
        <span className="bg-white/10 px-3 py-1 rounded-full text-[11px]">PRO • Advanced</span>
      </div>
      <p className="text-white/50 text-[13px] mt-1">Upload, Share, Manage Photos - Fast & Free</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center"><p className="text-[22px] font-black">{history.length}</p><p className="text-[11px] text-white/50">Total Photos</p></div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center"><p className="text-[22px] font-black">{totalSize} MB</p><p className="text-[11px] text-white/50">Storage Used</p></div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center"><p className="text-[22px] font-black">{selected.length}</p><p className="text-[11px] text-white/50">Selected</p></div>
      </div>

      {/* Upload Box */}
      <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }} onClick={() => fileRef.current?.click()} className="mt-5 border-2 border-dashed border-purple-500/50 bg-purple-500/5 rounded-3xl p-8 text-center cursor-pointer">
        <div className="text-[45px]">☁️</div>
        <p className="font-bold text-[15px] mt-2">Drag & Drop Images Here</p>
        <p className="text-white/50 text-[12px]">or Click to Browse • Multiple Photos Allowed</p>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-3">{previews.map((p, i) => (
            <div key={i} className="relative"><img src={p} className="w-[90px] h-[90px] object-cover rounded-xl" /><button onClick={() => removePreview(i)} className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full text-[12px]">✕</button></div>
          ))}</div>
          <button onClick={uploadAll} disabled={uploading} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 font-black py-3 rounded-full text-[14px]">{uploading ? `Uploading... ${progress}%` : `Upload ${files.length} Photos →`}</button>
          {uploading && <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden"><div className="bg-purple-500 h-full transition-all" style={{ width: `${progress}%` }} /></div>}
        </div>
      )}

      {/* History Controls */}
      <div className="flex gap-2 mt-8">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search photos..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-[13px] outline-none" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-3 text-[13px] outline-none text-white"><option value="all" className="text-black">All</option><option value="today" className="text-black">Today</option></select>
      </div>
      {selected.length > 0 && <button onClick={bulkDelete} className="w-full mt-3 bg-red-500 font-bold py-2.5 rounded-full text-[13px]">🗑️ Delete Selected ({selected.length})</button>}

      {/* History Grid */}
      <h2 className="font-black text-[18px] mt-6">Your History ({filtered.length})</h2>
      {filtered.length === 0 ? <p className="text-white/40 text-[13px] mt-3 text-center py-8">No photos yet. Upload your first photo above!</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {filtered.map(h => (
            <div key={h.public_id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="relative"><img src={h.url} className="w-full h-[160px] object-cover" /><input type="checkbox" checked={selected.includes(h.public_id)} onChange={() => toggleSelect(h.public_id)} className="absolute top-2 left-2 w-5 h-5 accent-purple-500" /><span className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded-full text-[10px]">{h.date}</span></div>
              <div className="p-2.5"><p className="text-[12px] font-bold truncate">{h.name}</p><p className="text-[10px] text-white/40">{(h.size / 1024).toFixed(0)} KB</p>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  <button onClick={() => copyLink(h.url)} className="bg-white/10 py-1.5 rounded-lg text-[11px]">📋</button>
                  <button onClick={() => downloadImage(h.url, h.name)} className="bg-white/10 py-1.5 rounded-lg text-[11px]">⬇️</button>
                  <button onClick={() => shareImage(h.url)} className="bg-white/10 py-1.5 rounded-lg text-[11px]">🔗</button>
                  <button onClick={() => showQR(h.url)} className="bg-white/10 py-1.5 rounded-lg text-[11px]">📷</button>
                </div>
                <div className="flex gap-1 mt-1"><a href={`/view/${h.public_id}`} className="flex-1 text-center bg-purple-500 py-1.5 rounded-lg text-[11px] font-bold">View</a><button onClick={() => deleteOne(h.public_id)} className="flex-1 bg-red-500/80 py-1.5 rounded-lg text-[11px] font-bold">Delete</button></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qr && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setQr("")}>
          <div className="bg-white text-black rounded-3xl p-6 text-center max-w-[300px] w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-black">Scan QR Code</h3><img src={qr} className="w-[200px] mx-auto mt-3" /><p className="text-[11px] break-all mt-2 text-gray-500">{qrUrl}</p><button onClick={() => setQr("")} className="mt-4 bg-black text-white px-6 py-2 rounded-full text-[13px] font-bold">Close</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-[13px] shadow-2xl z-50">{toast}</div>}
    </div>
  );
}
