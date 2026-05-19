import { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

export function FloatingImageTool() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setUploadedUrl(url);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(`![image](${uploadedUrl})`);
      alert("Đã copy mã hình ảnh! Bạn có thể dán vào bài viết.");
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {uploadedUrl && (
        <div className="bg-white p-3 rounded-2xl shadow-2xl border border-zinc-200 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <img src={uploadedUrl} className="w-12 h-12 object-cover rounded-lg border border-zinc-100" />
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Ảnh đã tải lên</p>
            <button 
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              Copy mã ảnh
            </button>
          </div>
          <button onClick={() => setUploadedUrl(null)} className="p-1 text-zinc-400 hover:text-zinc-900">
            <X size={18} />
          </button>
        </div>
      )}
      <input type="file" ref={inputRef} onChange={handleUpload} className="hidden" accept="image/*" />
      <button 
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-14 h-14 bg-zinc-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group relative"
        title="Upload ảnh nhanh"
      >
        {isUploading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <ImageIcon size={28} />
        )}
        {!isUploading && (
          <div className="absolute right-full mr-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
            Upload ảnh nhanh
          </div>
        )}
      </button>
    </div>
  );
}
