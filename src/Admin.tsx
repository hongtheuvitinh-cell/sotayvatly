import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Save, 
  ArrowLeft,
  LayoutGrid,
  FileText,
  Calculator,
  Lightbulb,
  Dumbbell,
  Edit2,
  Check,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Chapter, FullLesson } from './types';

import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AdminProps {
  onBack: () => void;
}

function ImageUploader({ onUpload, className = "" }: { onUpload: (url: string) => void, className?: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const { url } = await res.json();
        onUpload(url);
      } else {
        alert("Upload ảnh thất bại!");
      }
    } catch (error) {
      alert("Lỗi kết nối server!");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className={className}>
      <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      <button 
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-wider"
      >
        {isUploading ? (
          <div className="w-3 h-3 border border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        ) : (
          <ImageIcon size={12} />
        )}
        {isUploading ? "Đang tải..." : "Chèn ảnh"}
      </button>
    </div>
  );
}

function FloatingImageTool() {
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

export default function Admin({ onBack }: AdminProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonData, setLessonData] = useState<FullLesson | null>(null);
  const [activeTab, setActiveTab] = useState<'chapters' | 'content'>('chapters');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Form states
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterSubject, setNewChapterSubject] = useState('Toán học');
  const [newChapterGrade, setNewChapterGrade] = useState('Lớp 12');
  const [isDeleting, setIsDeleting] = useState<{type: string, id: number} | null>(null);
  const [editingTitle, setEditingTitle] = useState<{type: 'chapter' | 'lesson', id: number, title: string} | null>(null);
  const [editingContent, setEditingContent] = useState<{type: string, id: number, data: any} | null>(null);
  const [newExample, setNewExample] = useState({
    title: '',
    items: [{ problem: '', solution: '' }]
  });
  const [newPractice, setNewPractice] = useState({
    title: '',
    items: [{ problem: '', hint: '', answer: '' }]
  });

  useEffect(() => {
    fetchChapters();
  }, []);

  useEffect(() => {
    if (selectedLessonId) {
      fetchLessonDetails(selectedLessonId);
    }
  }, [selectedLessonId]);

  const fetchChapters = async () => {
    try {
      const res = await fetch('/api/chapters');
      const data = await res.json();
      if (Array.isArray(data)) {
        setChapters(data);
      } else {
        console.error("Chapters data is not an array:", data);
        setChapters([]);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setChapters([]);
    }
  };

  const fetchLessonDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/lessons/${id}`);
      const data = await res.json();
      if (data && !data.error) {
        setLessonData(data);
      } else {
        console.error("Error in lesson details:", data);
      }
    } catch (error) {
      console.error("Error fetching lesson details:", error);
    }
  };

  const addChapter = async () => {
    if (!newChapterTitle.trim()) return;
    await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: newChapterTitle.trim(), 
        subject: newChapterSubject,
        grade: newChapterGrade,
        sort_order: chapters.length + 1 
      })
    });
    setNewChapterTitle('');
    fetchChapters();
  };

  const deleteChapter = async (id: number) => {
    await fetch(`/api/chapters/${id}`, { method: 'DELETE' });
    setIsDeleting(null);
    fetchChapters();
  };

  const updateChapter = async (id: number, title: string) => {
    await fetch(`/api/chapters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    setEditingTitle(null);
    fetchChapters();
  };

  const addLesson = async (chapterId: number, title: string) => {
    if (!title.trim()) return;
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chapter_id: chapterId, 
        title: title.trim(), 
        description: '',
        sort_order: 1 
      })
    });
    fetchChapters();
  };

  const deleteLesson = async (id: number) => {
    await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
    setIsDeleting(null);
    fetchChapters();
    if (selectedLessonId === id) {
      setSelectedLessonId(null);
      setLessonData(null);
    }
  };

  const updateLesson = async (id: number, title: string) => {
    await fetch(`/api/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    setEditingTitle(null);
    fetchChapters();
    if (selectedLessonId === id) {
      fetchLessonDetails(id);
    }
  };

  const addContent = async (type: 'formula' | 'example' | 'practice', payload: any) => {
    // Cấu trúc dữ liệu gửi lên server
    let body = { ...payload, lesson_id: selectedLessonId };
    
    // Nếu là bài tập tự rèn, đảm bảo có trường 'items'
    if (type === 'practice') {
      // Lọc bỏ các bài tập trống (không có problem)
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.filter((item: any) => item.problem && item.problem.trim() !== '');
      }
      
      // Đảm bảo payload có 'items', nếu không thì tạo từ các trường cũ
      if (!body.items || body.items.length === 0) {
        body.items = [{ 
          problem: body.problem || '', 
          hint: body.hint || '', 
          answer: body.answer || '' 
        }];
      }
      // Loại bỏ các trường cũ không cần thiết để tránh xung đột
      delete body.problem;
      delete body.hint;
      delete body.answer;
    }
    
    const res = await fetch(`/api/content/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (selectedLessonId) fetchLessonDetails(selectedLessonId);
  };

  const deleteContent = async (type: 'formula' | 'example' | 'practice', id: number) => {
    await fetch(`/api/content/${type}/${id}`, { method: 'DELETE' });
    if (selectedLessonId) fetchLessonDetails(selectedLessonId);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) setIsAuthenticated(true);
    else alert("Sai mật khẩu!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
          <h2 className="text-lg font-bold mb-4">Nhập mật khẩu quản trị</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded-lg mb-4"
            placeholder="Mật khẩu"
          />
          <button type="submit" className="w-full bg-zinc-900 text-white py-2 rounded-lg font-medium">
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  const updateContent = async (type: 'formula' | 'example' | 'practice', id: number, payload: any) => {
    // Cấu trúc dữ liệu gửi lên server
    let body = { ...payload };
    
    // Nếu là bài tập tự rèn, đảm bảo có trường 'items' chuẩn
    if (type === 'practice') {
      // Lọc bỏ các bài tập trống (không có problem)
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.filter((item: any) => item.problem && item.problem.trim() !== '');
      }
      
      // Loại bỏ các trường cũ không cần thiết để tránh xung đột
      delete body.problem;
      delete body.hint;
      delete body.answer;
    }

    const res = await fetch(`/api/content/${type}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setEditingContent(null);
    if (selectedLessonId) fetchLessonDetails(selectedLessonId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Quản trị nội dung</h1>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('chapters')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'chapters' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Cấu trúc
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'content' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Nội dung chi tiết
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {activeTab === 'chapters' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Chapters Management */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <LayoutGrid size={20} className="text-zinc-400" />
                  Danh sách Chương
                </h2>
              </div>
              
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Tên chương mới..." 
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                  />
                  <div className="flex gap-2">
                    <select 
                      value={newChapterSubject}
                      onChange={(e) => setNewChapterSubject(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none"
                    >
                      {['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                      value={newChapterGrade}
                      onChange={(e) => setNewChapterGrade(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none"
                    >
                      {['Lớp 10', 'Lớp 11', 'Lớp 12'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button onClick={addChapter} className="px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm font-bold">
                      <Plus size={18} /> Thêm
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {chapters.map(chapter => (
                    <div key={chapter.id} className="group border border-zinc-100 rounded-xl p-3 hover:border-zinc-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        {editingTitle?.type === 'chapter' && editingTitle?.id === chapter.id ? (
                          <div className="flex-1 flex gap-2">
                            <input 
                              autoFocus
                              type="text" 
                              className="flex-1 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded outline-none text-sm"
                              value={editingTitle.title}
                              onChange={(e) => setEditingTitle({...editingTitle, title: e.target.value})}
                              onKeyDown={(e) => e.key === 'Enter' && updateChapter(chapter.id, editingTitle.title)}
                            />
                            <button onClick={() => updateChapter(chapter.id, editingTitle.title)} className="p-1 text-emerald-600"><Check size={16}/></button>
                            <button onClick={() => setEditingTitle(null)} className="p-1 text-zinc-400"><X size={16}/></button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-zinc-900">{chapter.title}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setEditingTitle({type: 'chapter', id: chapter.id, title: chapter.title})}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              {isDeleting?.id === chapter.id && isDeleting?.type === 'chapter' ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => deleteChapter(chapter.id)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded">Xóa</button>
                                  <button onClick={() => setIsDeleting(null)} className="text-[10px] bg-zinc-200 px-2 py-1 rounded">Hủy</button>
                                </div>
                              ) : (
                                <button onClick={() => setIsDeleting({type: 'chapter', id: chapter.id})} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Lessons in Chapter */}
                      <div className="pl-4 border-l-2 border-zinc-100 space-y-2">
                        {chapter.lessons.map(lesson => (
                          <div 
                            key={lesson.id} 
                            onClick={() => { setSelectedLessonId(lesson.id); setActiveTab('content'); }}
                            className="flex items-center justify-between text-sm bg-zinc-50 p-2 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors group/lesson"
                          >
                            {editingTitle?.type === 'lesson' && editingTitle?.id === lesson.id ? (
                              <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  autoFocus
                                  type="text" 
                                  className="flex-1 px-2 py-0.5 bg-white border border-zinc-200 rounded outline-none text-xs"
                                  value={editingTitle.title}
                                  onChange={(e) => setEditingTitle({...editingTitle, title: e.target.value})}
                                  onKeyDown={(e) => e.key === 'Enter' && updateLesson(lesson.id, editingTitle.title)}
                                />
                                <button onClick={() => updateLesson(lesson.id, editingTitle.title)} className="text-emerald-600"><Check size={14}/></button>
                                <button onClick={() => setEditingTitle(null)} className="text-zinc-400"><X size={14}/></button>
                              </div>
                            ) : (
                              <>
                                <span className="text-zinc-600 group-hover/lesson:text-zinc-900 font-medium">{lesson.title}</span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingTitle({type: 'lesson', id: lesson.id, title: lesson.title}); }}
                                    className="p-1 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover/lesson:opacity-100 transition-opacity"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <div className="p-1 text-zinc-400">
                                    <ChevronRight size={16} />
                                  </div>
                                  {isDeleting?.id === lesson.id && isDeleting?.type === 'lesson' ? (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }} 
                                      className="text-[10px] text-red-500 font-bold px-1"
                                    >
                                      Xác nhận
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setIsDeleting({type: 'lesson', id: lesson.id}); }} 
                                      className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover/lesson:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        <div className="pt-2 flex flex-col gap-2">
                          <input 
                            type="text" 
                            placeholder="Tên bài học mới..." 
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addLesson(chapter.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="hidden lg:flex flex-col items-center justify-center text-zinc-400 space-y-4 border-2 border-dashed border-zinc-200 rounded-3xl">
              <FileText size={48} />
              <p className="text-sm">Chọn một bài học để chỉnh sửa nội dung chi tiết</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {!selectedLessonId ? (
              <div className="text-center py-20 text-zinc-400">
                Vui lòng chọn một bài học từ tab "Cấu trúc" để nhập nội dung
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900">{lessonData?.title}</h2>
                    <p className="text-zinc-500">{lessonData?.description}</p>
                  </div>
                  <button onClick={() => setActiveTab('chapters')} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
                    Đổi bài học
                  </button>
                </div>

                {/* 1. Formulas */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                      <Calculator size={20} className="text-zinc-400" />
                      Công thức
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(lessonData?.formulas || []).map(f => (
                      <div key={f.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col gap-4">
                        {editingContent?.type === 'formula' && editingContent?.id === f.id ? (
                          <div className="space-y-3">
                            <textarea 
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 min-h-[100px]"
                              value={editingContent.data.content}
                              onChange={(e) => setEditingContent({...editingContent, data: {content: e.target.value}})}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => updateContent('formula', f.id, editingContent.data)}
                                className="flex-1 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                              >
                                <Check size={16} /> Lưu
                              </button>
                              <button 
                                onClick={() => setEditingContent(null)}
                                className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-4">
                            <code className="text-sm bg-zinc-50 p-2 rounded block flex-1 overflow-x-auto">{f.content}</code>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditingContent({type: 'formula', id: f.id, data: {content: f.content}})}
                                className="text-zinc-400 hover:text-zinc-900"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => deleteContent('formula', f.id)} className="text-zinc-400 hover:text-red-500">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
                      <textarea 
                        placeholder="Nhập mã LaTeX (VD: $$\sin^2 x + \cos^2 x = 1$$)" 
                        className="w-full bg-zinc-800 text-white border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-white/20 min-h-[100px]"
                        id="new-formula"
                      />
                      <button 
                        onClick={() => {
                          const el = document.getElementById('new-formula') as HTMLTextAreaElement;
                          if (el.value) {
                            addContent('formula', { content: el.value });
                            el.value = '';
                          }
                        }}
                        className="w-full py-2 bg-white text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-colors"
                      >
                        Thêm công thức
                      </button>
                    </div>
                  </div>
                </section>

                {/* 2. Examples */}
                <section className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Lightbulb size={20} className="text-zinc-400" />
                    Dạng bài & Phương pháp
                  </h3>
                  <div className="space-y-4">
                    {(lessonData?.examples || []).map(ex => (
                      <div key={ex.id} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 relative group">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <button 
                            onClick={() => setEditingContent({
                              type: 'example', 
                              id: ex.id, 
                              data: {
                                title: ex.title, 
                                items: ex.items || [{ problem: (ex as any).problem || '', solution: (ex as any).solution || '' }]
                              }
                            })}
                            className="text-zinc-400 hover:text-zinc-900"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => deleteContent('example', ex.id)} className="text-zinc-400 hover:text-red-500">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        {editingContent?.type === 'example' && editingContent?.id === ex.id ? (
                          <div className="space-y-4 pt-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">Mô tả dạng bài & phương pháp</label>
                                <ImageUploader onUpload={(url) => setEditingContent({...editingContent, data: {...editingContent.data, title: editingContent.data.title + `\n![image](${url})`}})} />
                              </div>
                              <textarea 
                                className="w-full px-4 py-2 bg-zinc-50 rounded-xl outline-none text-sm border border-zinc-200 min-h-[120px]"
                                value={editingContent.data.title}
                                onChange={(e) => setEditingContent({...editingContent, data: {...editingContent.data, title: e.target.value}})}
                              />
                            </div>
                            
                            <div className="space-y-4">
                              {(editingContent.data.items || []).map((item: any, i: number) => (
                                <div key={i} className="p-4 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-3 relative">
                                  <button 
                                    onClick={() => {
                                      const newItems = [...(editingContent.data.items || [])];
                                      newItems.splice(i, 1);
                                      setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                    }}
                                    className="absolute top-2 right-2 text-zinc-300 hover:text-red-500"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Ví dụ {i + 1} - Đề bài</label>
                                      <ImageUploader onUpload={(url) => {
                                        const newItems = [...editingContent.data.items];
                                        newItems[i].problem += `\n![image](${url})`;
                                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                      }} />
                                    </div>
                                    <textarea 
                                      className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm min-h-[80px] border border-zinc-200"
                                      value={item.problem}
                                      onChange={(e) => {
                                        const newItems = [...editingContent.data.items];
                                        newItems[i].problem = e.target.value;
                                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Ví dụ {i + 1} - Lời giải</label>
                                      <ImageUploader onUpload={(url) => {
                                        const newItems = [...editingContent.data.items];
                                        newItems[i].solution += `\n![image](${url})`;
                                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                      }} />
                                    </div>
                                    <textarea 
                                      className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm min-h-[80px] border border-zinc-200"
                                      value={item.solution}
                                      onChange={(e) => {
                                        const newItems = [...(editingContent.data.items || [])];
                                        newItems[i].solution = e.target.value;
                                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  const newItems = [...(editingContent.data.items || []), { problem: '', solution: '' }];
                                  setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                }}
                                className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-bold hover:border-zinc-400 hover:text-zinc-600 transition-all"
                              >
                                + Thêm ví dụ minh họa
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => updateContent('example', ex.id, editingContent.data)}
                                className="flex-1 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                              >
                                <Check size={16} /> Lưu thay đổi
                              </button>
                              <button 
                                onClick={() => setEditingContent(null)}
                                className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="markdown-body prose prose-zinc max-w-full mb-4 break-words">
                              <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
                                {ex.title}
                              </Markdown>
                            </div>
                            <div className="space-y-4">
                              {(ex.items || []).map((item, i) => (
                                <div key={i} className="relative group/item grid md:grid-cols-2 gap-4 text-sm">
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('Bạn có chắc muốn xóa ví dụ này?')) {
                                        const newItems = [...(ex.items || [])];
                                        newItems.splice(i, 1);
                                        updateContent('example', ex.id, { ...ex, items: newItems });
                                      }
                                    }}
                                    className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all z-10"
                                    title="Xóa ví dụ này"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <p className="font-bold text-blue-600/60 text-[10px] uppercase mb-1">Đề bài {(ex.items || []).length > 1 ? i + 1 : ''}</p>
                                    <div className="markdown-body prose prose-sm prose-zinc max-w-none">
                                      <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.problem}</Markdown>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <p className="font-bold text-emerald-600/60 text-[10px] uppercase mb-1">Lời giải {(ex.items || []).length > 1 ? i + 1 : ''}</p>
                                    <div className="markdown-body prose prose-sm prose-emerald max-w-none">
                                      <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.solution}</Markdown>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(!ex.items || ex.items.length === 0) && (
                                <div className="relative group/item grid md:grid-cols-2 gap-4 text-sm">
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('Bạn có chắc muốn xóa ví dụ này?')) {
                                        updateContent('example', ex.id, { ...ex, problem: '', solution: '' });
                                      }
                                    }}
                                    className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all z-10"
                                    title="Xóa ví dụ này"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <p className="font-bold text-blue-600/60 text-[10px] uppercase mb-1">Đề bài</p>
                                    <div className="markdown-body prose prose-sm prose-zinc max-w-none">
                                      <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{(ex as any).problem}</Markdown>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <p className="font-bold text-emerald-600/60 text-[10px] uppercase mb-1">Lời giải</p>
                                    <div className="markdown-body prose prose-sm prose-emerald max-w-none">
                                      <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{(ex as any).solution}</Markdown>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    
                    <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-6 space-y-6">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Mô tả dạng bài & phương pháp</label>
                          <ImageUploader onUpload={(url) => setNewExample({...newExample, title: newExample.title + `\n![image](${url})`})} />
                        </div>
                        <textarea 
                          placeholder="Nhập mô tả dạng bài và phương pháp giải (hỗ trợ LaTeX)..." 
                          className="w-full px-4 py-2 bg-zinc-50 rounded-xl outline-none text-sm min-h-[120px]"
                          value={newExample.title}
                          onChange={(e) => setNewExample({...newExample, title: e.target.value})}
                        />
                      </div>

                      <div className="space-y-4">
                        {newExample.items.map((item, i) => (
                          <div key={i} className="p-4 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-3 relative">
                            {newExample.items.length > 1 && (
                              <button 
                                onClick={() => {
                                  const newItems = [...newExample.items];
                                  newItems.splice(i, 1);
                                  setNewExample({...newExample, items: newItems});
                                }}
                                className="absolute top-2 right-2 text-zinc-300 hover:text-red-500"
                              >
                                <X size={14} />
                              </button>
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">Ví dụ minh họa {i + 1} - Đề bài</label>
                                <ImageUploader onUpload={(url) => {
                                  const newItems = [...newExample.items];
                                  newItems[i].problem += `\n![image](${url})`;
                                  setNewExample({...newExample, items: newItems});
                                }} />
                              </div>
                              <textarea 
                                placeholder="Nhập đề bài..." 
                                className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm min-h-[80px] border border-zinc-200"
                                value={item.problem}
                                onChange={(e) => {
                                  const newItems = [...newExample.items];
                                  newItems[i].problem = e.target.value;
                                  setNewExample({...newExample, items: newItems});
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">Ví dụ minh họa {i + 1} - Lời giải</label>
                                <ImageUploader onUpload={(url) => {
                                  const newItems = [...newExample.items];
                                  newItems[i].solution += `\n![image](${url})`;
                                  setNewExample({...newExample, items: newItems});
                                }} />
                              </div>
                              <textarea 
                                placeholder="Nhập lời giải..." 
                                className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm min-h-[80px] border border-zinc-200"
                                value={item.solution}
                                onChange={(e) => {
                                  const newItems = [...newExample.items];
                                  newItems[i].solution = e.target.value;
                                  setNewExample({...newExample, items: newItems});
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => setNewExample({...newExample, items: [...newExample.items, { problem: '', solution: '' }]})}
                          className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-bold hover:border-zinc-400 hover:text-zinc-600 transition-all"
                        >
                          + Thêm ví dụ minh họa
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          if (newExample.title && newExample.items[0].problem) {
                            addContent('example', newExample);
                            setNewExample({ title: '', items: [{ problem: '', solution: '' }] });
                          }
                        }}
                        className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                      >
                        Lưu Dạng bài & Phương pháp
                      </button>
                    </div>
                  </div>
                </section>

                {/* 3. Practice */}
                <section className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Dumbbell size={20} className="text-zinc-400" />
                    Bài tập Tự rèn
                  </h3>
                  <div className="space-y-4">
                    {(lessonData?.practice || []).map(p => (
                      <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 relative group">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <button 
                            onClick={() => setEditingContent({
                              type: 'practice', 
                              id: p.id, 
                              data: { 
                                ...p, 
                                items: p.items || [{ problem: (p as any).problem || '', hint: (p as any).hint || '', answer: (p as any).answer || '' }] 
                              }
                            })}
                            className="text-zinc-400 hover:text-zinc-900"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => deleteContent('practice', p.id)} className="text-zinc-400 hover:text-red-500">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        {editingContent?.type === 'practice' && editingContent?.id === p.id ? (
                          <div className="space-y-4 pt-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">Tiêu đề (hỗ trợ LaTeX)</label>
                                <ImageUploader onUpload={(url) => setEditingContent({...editingContent, data: {...editingContent.data, title: editingContent.data.title + `\n![image](${url})`}})} />
                              </div>
                              <textarea 
                                className="w-full px-4 py-2 bg-zinc-50 rounded-xl outline-none text-sm min-h-[60px] border border-zinc-200"
                                value={editingContent.data.title}
                                onChange={(e) => setEditingContent({...editingContent, data: {...editingContent.data, title: e.target.value}})}
                              />
                            </div>
                            
                            <div className="space-y-4">
                              {(editingContent.data.items || []).map((item: any, i: number) => (
                                <div key={i} className="p-4 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-3 relative">
                                  {(editingContent.data.items || []).length > 1 && (
                                    <button 
                                      onClick={() => {
                                        const newItems = [...editingContent.data.items];
                                        newItems.splice(i, 1);
                                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                      }}
                                      className="absolute top-2 right-2 text-zinc-300 hover:text-red-500"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Bài tập {i + 1} - Đề bài</label>
                                      <ImageUploader onUpload={(url) => {
                                        const newItems = [...editingContent.data.items];
                                        newItems[i].problem += `\n![image](${url})`;
                                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                      }} />
                                    </div>
                                    <textarea 
                                      placeholder="Nhập đề bài..." 
                                      className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm min-h-[80px] border border-zinc-200"
                                      value={item.problem}
                                      onChange={(e) => {
                                        const newItems = [...editingContent.data.items];
                                        newItems[i].problem = e.target.value;
                                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                      }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Gợi ý</label>
                                        <ImageUploader onUpload={(url) => {
                                          const newItems = [...editingContent.data.items];
                                          newItems[i].hint += `\n![image](${url})`;
                                          setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                        }} />
                                      </div>
                                      <input 
                                        type="text" 
                                        placeholder="Gợi ý..." 
                                        className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm border border-zinc-200"
                                        value={item.hint}
                                        onChange={(e) => {
                                          const newItems = [...editingContent.data.items];
                                          newItems[i].hint = e.target.value;
                                          setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Đáp số</label>
                                        <ImageUploader onUpload={(url) => {
                                          const newItems = [...editingContent.data.items];
                                          newItems[i].answer += `\n![image](${url})`;
                                          setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                        }} />
                                      </div>
                                      <input 
                                        type="text" 
                                        placeholder="Đáp số..." 
                                        className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm border border-zinc-200"
                                        value={item.answer}
                                        onChange={(e) => {
                                          const newItems = [...editingContent.data.items];
                                          newItems[i].answer = e.target.value;
                                          setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button 
                                onClick={() => setEditingContent({...editingContent, data: {...editingContent.data, items: [...(editingContent.data.items || []), { problem: '', hint: '', answer: '' }]}})}
                                className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-bold hover:border-zinc-400 hover:text-zinc-600 transition-all"
                              >
                                + Thêm bài tập
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => updateContent('practice', p.id, editingContent.data)}
                                className="flex-1 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                              >
                                <Check size={16} /> Lưu thay đổi
                              </button>
                              <button 
                                onClick={() => setEditingContent(null)}
                                className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="markdown-body prose prose-zinc max-w-full mb-4 break-words">
                              <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
                                {p.title}
                              </Markdown>
                            </div>
                            <div className="space-y-4">
                              {(p.items || []).map((item, i) => (
                                <div key={i} className="relative group/item space-y-2">
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('Bạn có chắc muốn xóa bài tập này?')) {
                                        const newItems = [...(p.items || [])];
                                        newItems.splice(i, 1);
                                        updateContent('practice', p.id, { ...p, items: newItems });
                                      }
                                    }}
                                    className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all z-10"
                                    title="Xóa bài tập này"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <p className="font-bold text-blue-600/60 text-[10px] uppercase mb-1">Đề bài {(p.items || []).length > 1 ? i + 1 : ''}</p>
                                    <div className="markdown-body prose prose-sm prose-zinc max-w-none">
                                      <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.problem}</Markdown>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="flex-1 p-2 bg-indigo-50 rounded-lg text-[11px] text-indigo-600 italic">
                                      <div className="markdown-body prose prose-sm max-w-none">
                                        <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{`Gợi ý: ${item.hint}`}</Markdown>
                                      </div>
                                    </div>
                                    <div className="flex-1 p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-600 font-bold">
                                      <div className="markdown-body prose prose-sm max-w-none">
                                        <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{`Đáp số: ${item.answer}`}</Markdown>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(!p.items || p.items.length === 0) && (
                                <div className="relative group/item space-y-2">
                                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <p className="font-bold text-blue-600/60 text-[10px] uppercase mb-1">Đề bài</p>
                                    <div className="markdown-body prose prose-sm prose-zinc max-w-none">
                                      <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{(p as any).problem}</Markdown>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="flex-1 p-2 bg-indigo-50 rounded-lg text-[11px] text-indigo-600 italic">Gợi ý: {(p as any).hint}</div>
                                    <div className="flex-1 p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-600 font-bold">Đáp số: {(p as any).answer}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    
                    <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-6 space-y-6">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Tiêu đề bài tập (hỗ trợ LaTeX)</label>
                          <ImageUploader onUpload={(url) => setNewPractice({...newPractice, title: newPractice.title + `\n![image](${url})`})} />
                        </div>
                        <textarea 
                          placeholder="Nhập tiêu đề (ví dụ: Câu 1, Bài 1...)" 
                          className="w-full px-4 py-2 bg-zinc-50 rounded-xl outline-none text-sm min-h-[60px]"
                          value={newPractice.title}
                          onChange={(e) => setNewPractice({...newPractice, title: e.target.value})}
                        />
                      </div>

                      <div className="space-y-4">
                        {newPractice.items.map((item, i) => (
                          <div key={i} className="p-4 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-3 relative">
                            {newPractice.items.length > 1 && (
                              <button 
                                onClick={() => {
                                  const newItems = [...newPractice.items];
                                  newItems.splice(i, 1);
                                  setNewPractice({...newPractice, items: newItems});
                                }}
                                className="absolute top-2 right-2 text-zinc-300 hover:text-red-500"
                              >
                                <X size={14} />
                              </button>
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">Bài tập {i + 1} - Đề bài</label>
                                <ImageUploader onUpload={(url) => {
                                  const newItems = [...newPractice.items];
                                  newItems[i].problem += `\n![image](${url})`;
                                  setNewPractice({...newPractice, items: newItems});
                                }} />
                              </div>
                              <textarea 
                                placeholder="Nhập đề bài..." 
                                className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm min-h-[80px] border border-zinc-200"
                                value={item.problem}
                                onChange={(e) => {
                                  const newItems = [...newPractice.items];
                                  newItems[i].problem = e.target.value;
                                  setNewPractice({...newPractice, items: newItems});
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Gợi ý</label>
                                  <ImageUploader onUpload={(url) => {
                                    const newItems = [...newPractice.items];
                                    newItems[i].hint += `\n![image](${url})`;
                                    setNewPractice({...newPractice, items: newItems});
                                  }} />
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Gợi ý..." 
                                  className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm border border-zinc-200"
                                  value={item.hint}
                                  onChange={(e) => {
                                    const newItems = [...newPractice.items];
                                    newItems[i].hint = e.target.value;
                                    setNewPractice({...newPractice, items: newItems});
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Đáp số</label>
                                  <ImageUploader onUpload={(url) => {
                                    const newItems = [...newPractice.items];
                                    newItems[i].answer += `\n![image](${url})`;
                                    setNewPractice({...newPractice, items: newItems});
                                  }} />
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Đáp số..." 
                                  className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm border border-zinc-200"
                                  value={item.answer}
                                  onChange={(e) => {
                                    const newItems = [...newPractice.items];
                                    newItems[i].answer = e.target.value;
                                    setNewPractice({...newPractice, items: newItems});
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => setNewPractice({...newPractice, items: [...newPractice.items, { problem: '', hint: '', answer: '' }]})}
                          className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-bold hover:border-zinc-400 hover:text-zinc-600 transition-all"
                        >
                          + Thêm bài tập
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          const filteredItems = newPractice.items.filter(item => item.problem.trim() !== '');
                          if (newPractice.title && filteredItems.length > 0) {
                            addContent('practice', { ...newPractice, items: filteredItems });
                            setNewPractice({ title: '', items: [{ problem: '', hint: '', answer: '' }] });
                          } else {
                            alert("Vui lòng nhập tiêu đề và ít nhất một đề bài.");
                          }
                        }}
                        className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                      >
                        Lưu Bài tập tự rèn
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </main>
      <FloatingImageTool />
    </div>
  );
}
