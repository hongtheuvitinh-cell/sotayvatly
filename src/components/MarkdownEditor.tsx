import { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Heading3, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Link as LinkIcon, 
  Palette, 
  ALargeSmall, 
  Type, 
  Sigma,
  Image as ImageIcon,
  X
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from "rehype-raw";

export const preprocessMarkdown = (content: string) => {
  if (!content) return '';
  return content
    .replace(/(<(div|p|center|header|section|footer)[^>]*>)/gi, '$1\n\n')
    .replace(/(<\/(div|p|center|header|section|footer)>)/gi, '\n\n$1');
};

export function ImageUploader({ onUpload, className = "" }: { onUpload: (url: string) => void, className?: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUpload(data.url);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center w-full h-full"
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
        ) : (
          <ImageIcon size={16} />
        )}
      </button>
    </div>
  );
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Nhập nội dung...", 
  label = "",
  minHeight = "600px"
}: { 
  value: string, 
  onChange: (val: string) => void, 
  placeholder?: string,
  label?: string,
  minHeight?: string
}) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [activeMenu, setActiveMenu] = useState<'color' | 'size' | 'font' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || "Nội dung";
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    
    onChange(newText);
    setActiveMenu(null);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const colors = [
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Xanh dương', value: '#3b82f6' },
    { name: 'Xanh lá', value: '#22c55e' },
    { name: 'Vàng', value: '#eab308' },
    { name: 'Tím', value: '#a855f7' },
    { name: 'Cam', value: '#f97316' },
    { name: 'Đen', value: '#000000' }
  ];

  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '32px'];
  const fonts = ['Inter', 'serif', 'monospace', 'system-ui', 'Space Grotesk'];

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</label>}
      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-zinc-900/5 transition-all">
        {/* Toolbar */}
        <div className="bg-zinc-50 border-b border-zinc-100 px-3 py-2 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              <button 
                type="button"
                onClick={() => insertText('**', '**')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="In đậm"
              >
                <Bold size={16} />
              </button>
              <button 
                type="button"
                onClick={() => insertText('*', '*')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="In nghiêng"
              >
                <Italic size={16} />
              </button>
              <button 
                type="button"
                onClick={() => insertText('### ', '')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="Tiêu đề"
              >
                <Heading3 size={16} />
              </button>
              <div className="w-px h-4 bg-zinc-200 mx-1" />
              
              {/* Alignment */}
              <button 
                type="button"
                onClick={() => insertText('<div style="text-align: left">\n\n', '\n\n</div>')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="Canh trái"
              >
                <AlignLeft size={16} />
              </button>
              <button 
                type="button"
                onClick={() => insertText('<div style="text-align: center">\n\n', '\n\n</div>')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="Canh giữa"
              >
                <AlignCenter size={16} />
              </button>
              <button 
                type="button"
                onClick={() => insertText('<div style="text-align: right">\n\n', '\n\n</div>')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="Canh phải"
              >
                <AlignRight size={16} />
              </button>
              <button 
                type="button"
                onClick={() => insertText('<div style="text-align: justify">\n\n', '\n\n</div>')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="Canh đều"
              >
                <AlignJustify size={16} />
              </button>
              
              <div className="w-px h-4 bg-zinc-200 mx-1" />
              <button 
                type="button"
                onClick={() => insertText('[', '](url)')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                title="Link liên kết"
              >
                <LinkIcon size={16} />
              </button>
              <button 
                type="button"
                onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')}
                className={`p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all ${activeMenu === 'color' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                title="Màu sắc"
              >
                <Palette size={16} />
              </button>
              <button 
                type="button"
                onClick={() => setActiveMenu(activeMenu === 'size' ? null : 'size')}
                className={`p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all ${activeMenu === 'size' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                title="Kích thước"
              >
                <ALargeSmall size={16} />
              </button>
              <button 
                type="button"
                onClick={() => setActiveMenu(activeMenu === 'font' ? null : 'font')}
                className={`p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all ${activeMenu === 'font' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                title="Phông chữ"
              >
                <Type size={16} />
              </button>
 
              <div className="w-px h-4 bg-zinc-200 mx-1" />
              <button 
                type="button"
                onClick={() => insertText('$', '$')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all flex items-center gap-1"
                title="Công thức toán (Inline)"
              >
                <Sigma size={14} />
                <span className="text-[9px] font-bold">Inline</span>
              </button>
              <button 
                type="button"
                onClick={() => insertText('\n$$\n', '\n$$\n')}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-900 transition-all flex items-center gap-1"
                title="Công thức toán (Block)"
              >
                <Sigma size={14} />
                <span className="text-[9px] font-bold">Block</span>
              </button>
              <div className="w-px h-4 bg-zinc-200 mx-1" />
              <ImageUploader 
                onUpload={(url) => insertText(`\n![image](${url})\n`)} 
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              />
            </div>
            
            <div className="flex items-center bg-zinc-200/50 p-1 rounded-xl gap-1">
              <button 
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'edit' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Soạn
              </button>
              <button 
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all hidden md:block ${
                  viewMode === 'split' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Chia đôi
              </button>
              <button 
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'preview' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Xem
              </button>
            </div>
          </div>
 
          {/* Sub Menus */}
          {activeMenu === 'color' && (
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-zinc-100 shadow-sm animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase mr-2.5">Chọn màu:</span>
              <div className="flex items-center gap-1.5">
                {colors.map(c => (
                  <button 
                    key={c.value}
                    onClick={() => insertText(`<span style="color: ${c.value}">`, '</span>')}
                    className="w-5 h-5 rounded-full border border-zinc-100 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
          {activeMenu === 'size' && (
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-zinc-100 shadow-sm animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase mr-2.5">Cỡ chữ:</span>
              <div className="flex items-center gap-1.5">
                {sizes.map(s => (
                  <button 
                    key={s}
                    onClick={() => insertText(`<span style="font-size: ${s}">`, '</span>')}
                    className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 rounded text-[10px] font-bold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeMenu === 'font' && (
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-zinc-100 shadow-sm animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase mr-2.5">Phông chữ:</span>
              <div className="flex items-center gap-1.5">
                {fonts.map(f => (
                  <button 
                    key={f}
                    onClick={() => insertText(`<span style="font-family: ${f}">`, '</span>')}
                    className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 rounded text-[10px] font-bold"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* Editor Area */}
        <div className={`flex flex-col md:flex-row ${viewMode === 'split' ? 'divide-x divide-zinc-100' : ''}`}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`flex-1 p-6 outline-none font-mono text-sm resize-none min-h-[400px] leading-relaxed bg-zinc-50/10 focus:bg-white transition-colors`}
              style={{ minHeight }}
            />
          )}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div 
              className={`flex-1 p-6 overflow-y-auto bg-white markdown-body`}
              style={{ minHeight }}
            >
              {value ? (
                <Markdown 
                  remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                >
                  {preprocessMarkdown(value)}
                </Markdown>
              ) : (
                <span className="text-zinc-300 italic text-xs">Chưa có nội dung để xem trước...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
