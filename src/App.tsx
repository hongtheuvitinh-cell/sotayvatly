import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Search, 
  Menu, 
  X, 
  ChevronDown,
  GraduationCap,
  Calculator,
  Lightbulb,
  Dumbbell,
  Settings,
  Folder,
  ChevronRight as ChevronRightIcon,
  Link,
  Check
} from 'lucide-react';

import Markdown from "react-markdown";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Chapter, FullLesson } from './types';
import Admin from './Admin';
import { QuizDisplay } from './components/QuizDisplay';
import { GalleryViewer } from './components/GalleryViewer';

import remarkGfm from "remark-gfm";

const preprocessMarkdown = (content: string) => {
  if (!content) return '';
  return content
    .replace(/(<(div|p|center|header|section|footer)[^>]*>)/gi, '$1\n\n')
    .replace(/(<\/(div|p|center|header|section|footer)>)/gi, '\n\n$1');
};

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  // Initialize states from URL Search Parameters
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('subject') || 'Toán học';
  });
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('grade') || 'Lớp 12';
  });
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const lessonIdStr = params.get('lesson');
    return lessonIdStr ? parseInt(lessonIdStr, 10) : null;
  });
  const [hasInitializedLesson, setHasInitializedLesson] = useState(false);

  const [lessonData, setLessonData] = useState<FullLesson | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return window.location.pathname.startsWith('/admin') || params.get('admin') === 'true';
  });
  const [activeTab, setActiveTab] = useState('formulas');
  const [isGalleryView, setIsGalleryView] = useState(false);
  const [selectedExampleId, setSelectedExampleId] = useState<number | null>(null);
  const [visibleSolutions, setVisibleSolutions] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh'];
  const grades = ['Lớp 10', 'Lớp 11', 'Lớp 12'];

  // Memoized sorted arrays to absolutely guarantee stable sorting on the client side
  const sortedFormulas = useMemo(() => {
    return [...(lessonData?.formulas || [])].sort((a, b) => a.id - b.id);
  }, [lessonData?.formulas]);

  const sortedExamples = useMemo(() => {
    return [...(lessonData?.examples || [])].sort((a, b) => a.id - b.id);
  }, [lessonData?.examples]);

  const sortedPractice = useMemo(() => {
    return [...(lessonData?.practice || [])].sort((a, b) => a.id - b.id);
  }, [lessonData?.practice]);

  const sortedQuizzes = useMemo(() => {
    return [...(lessonData?.quizzes || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [lessonData?.quizzes]);

  // Detect image-only content for gallery mode using stable sorted formulas
  const imageUrls = useMemo(() => {
    if (!lessonData || activeTab !== 'formulas') return [];
    return sortedFormulas
      .map(f => {
        const match = f.content.match(/!\[.*?\]\((.*?)\)/);
        // Also check for raw URLs that might be images
        if (match) return match[1];
        if (f.content.trim().match(/^https?:\/\/.*?\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) {
          return f.content.trim();
        }
        return null;
      })
      .filter(Boolean) as string[];
  }, [lessonData, activeTab, sortedFormulas]);

  useEffect(() => {
    // Reset gallery view when changing lesson or tab
    setIsGalleryView(false);
  }, [selectedLessonId, activeTab]);

  // Synchronize URL search params when selection changes or admin toggle changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('subject', selectedSubject);
      params.set('grade', selectedGrade);
      if (selectedLessonId) {
        params.set('lesson', selectedLessonId.toString());
      } else {
        params.delete('lesson');
      }
      const pathname = isAdmin ? '/admin' : '/';
      const newUrl = `${pathname}?${params.toString()}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } catch (error) {
      console.warn("Failed to update history state (Safari iOS iframe safety restriction):", error);
    }
  }, [selectedSubject, selectedGrade, selectedLessonId, isAdmin]);

  // Fetch chapters on mount / selector change
  useEffect(() => {
    fetchChapters();
  }, [selectedSubject, selectedGrade]);

  const fetchChapters = () => {
    setLoading(true);
    const params = new URLSearchParams({
      subject: selectedSubject,
      grade: selectedGrade
    });
    fetch(`/api/chapters?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChapters(data);
          
          if (!hasInitializedLesson) {
            setHasInitializedLesson(true);
            const paramsUrl = new URLSearchParams(window.location.search);
            const initialLessonId = paramsUrl.get('lesson');
            if (initialLessonId) {
              const lessonIdNum = parseInt(initialLessonId, 10);
              setSelectedLessonId(lessonIdNum);
              // Auto-expand the chapter containing the preset lesson
              const chapterWithLesson = data.find(c => (c.lessons || []).some((l: any) => l.id === lessonIdNum));
              if (chapterWithLesson) {
                setExpandedChapters(new Set([chapterWithLesson.id]));
              }
            } else {
              setSelectedLessonId(null);
              setLessonData(null);
            }
          } else {
            setSelectedLessonId(null);
            setLessonData(null);
          }
        } else {
          console.error("Data is not an array:", data);
          setChapters([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching chapters:", err);
        setChapters([]);
        setLoading(false);
      });
  };

  // Fetch lesson details when selectedLessonId changes
  useEffect(() => {
    if (selectedLessonId !== null) {
      fetch(`/api/lessons/${selectedLessonId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Fetched lesson data:", data);
          if (data && !data.error) {
            setLessonData(data);
            // Set default tab based on available content
            if (data.formulas && data.formulas.length > 0) setActiveTab('formulas');
            else if (data.examples && data.examples.length > 0) setActiveTab('examples');
            else if (data.practice && data.practice.length > 0) setActiveTab('practice');
            else if (data.quizzes && data.quizzes.length > 0) setActiveTab('quizzes');

            if (data.examples && data.examples.length > 0) {
              const sortedEx = [...data.examples].sort((a, b) => a.id - b.id);
              setSelectedExampleId(sortedEx[0].id);
            }
          } else {
            console.error("Error in lesson data:", data);
          }
        })
        .catch(err => console.error("Error fetching lesson:", err));
    }
  }, [selectedLessonId]);

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('subject', selectedSubject);
    url.searchParams.set('grade', selectedGrade);
    if (selectedLessonId) {
      url.searchParams.set('lesson', selectedLessonId.toString());
    }
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
      });
  };

  const toggleChapter = (chapterId: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const filteredChapters = useMemo(() => {
    if (!searchQuery) return chapters || [];
    return (chapters || []).map(chapter => ({
      ...chapter,
      lessons: (chapter.lessons || []).filter(lesson => 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(chapter => (chapter.lessons || []).length > 0);
  }, [searchQuery, chapters]);

  if (isAdmin) {
    return (
      <Admin 
        onBack={() => { 
          setIsAdmin(false); 
          fetchChapters();
          // Also refresh current lesson if one is selected
          if (selectedLessonId !== null) {
            fetch(`/api/lessons/${selectedLessonId}`)
              .then(res => res.json())
              .then(data => setLessonData(data))
              .catch(err => console.error("Error refreshing lesson:", err));
          }
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Mobile Sidebar overlay backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Toggle */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900 text-white rounded-full shadow-lg lg:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? '320px' : '0px',
          x: isSidebarOpen ? 0 : -320
        }}
        className="fixed lg:relative z-40 h-full bg-white border-r border-zinc-100 flex flex-col shadow-xl lg:shadow-none"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <h1 className="font-bold text-sm tracking-tight">Menu</h1>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-zinc-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-full transition-all outline-none text-sm shadow-sm"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {filteredChapters.map((chapter) => (
            <div key={chapter.id} className="space-y-1">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg group transition-colors"
              >
                <ChevronRightIcon 
                  size={16} 
                  className={`text-zinc-400 transition-transform duration-200 ${expandedChapters.has(chapter.id) ? 'rotate-90' : ''}`} 
                />
                <Folder 
                  size={20} 
                  className={`text-amber-500 fill-amber-500/10 transition-colors`} 
                />
                <span className="text-[13px] font-bold text-zinc-700 group-hover:text-zinc-900 text-left uppercase tracking-tight truncate">
                  {chapter.title}
                </span>
              </button>
              
              <AnimatePresence initial={false}>
                {expandedChapters.has(chapter.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-1 ml-9 border-l border-zinc-100 pl-4"
                  >
                    {(chapter.lessons || []).map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setSelectedLessonId(lesson.id);
                          if (window.innerWidth < 1024) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={`w-full text-left py-2 px-3 rounded-lg text-[13px] font-medium transition-all ${
                          selectedLessonId === lesson.id
                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 rounded-l-none'
                            : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        {lesson.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Admin Link */}
        <div className="p-4 border-t border-zinc-100">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="relative">
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-zinc-900 transition-all cursor-pointer"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-zinc-900 transition-all cursor-pointer"
              >
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <button 
            onClick={() => setIsAdmin(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <Settings size={14} />
            QUẢN TRỊ VIÊN
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {lessonData ? (
          <div className="max-w-7xl pt-4 px-6 pb-12 lg:pt-6 lg:px-10 lg:pb-20">
            <motion.div
              key={lessonData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <header className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                  <span>{selectedSubject}</span>
                  <ChevronRight size={14} />
                  <span>{selectedGrade}</span>
                  <ChevronRight size={14} />
                  <span>{(chapters || []).find(c => (c.lessons || []).some(l => l.id === lessonData.id))?.title}</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                    {lessonData.title}
                  </h2>
                  <button 
                    onClick={handleCopyLink}
                    className="flex self-start md:self-center items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Đã sao chép liên kết!</span>
                      </>
                    ) : (
                      <>
                        <Link size={14} className="text-zinc-500" />
                        <span>Sao chép link chia sẻ</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
                  <p className="text-lg text-zinc-600 max-w-2xl leading-relaxed">
                    {lessonData.description}
                  </p>
                </div>
              </header>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide border-b border-zinc-100 mb-8 sticky top-0 bg-zinc-50 z-10 pt-2">
                {[
                  { id: 'formulas', label: 'Công thức', icon: Calculator, count: sortedFormulas.length },
                  { id: 'examples', label: 'Phân dạng & Ví dụ', icon: Lightbulb, count: sortedExamples.length },
                  { id: 'practice', label: 'Tự rèn luyện', icon: Dumbbell, count: sortedPractice.length },
                  { id: 'quizzes', label: 'Trắc nghiệm', icon: GraduationCap, count: sortedQuizzes.length }
                ].map((tab) => (
                  tab.count > 0 && (
                    <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                         activeTab === tab.id 
                           ? 'bg-zinc-900 text-white shadow-lg' 
                           : 'text-zinc-500 hover:bg-zinc-100'
                       }`}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-zinc-100'}`}>
                        {tab.count}
                      </span>
                    </button>
                  )
                ))}
              </div>

              <div className="min-h-[400px]">
                {/* 1. Công thức Section */}
                {activeTab === 'formulas' && sortedFormulas.length > 0 && (
                  <motion.section 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                      <div className="flex items-center gap-2 text-zinc-900">
                        <Calculator size={24} />
                        <h3 className="text-xl font-bold uppercase tracking-tight">Tóm tắt bài học</h3>
                      </div>
                      
                      {imageUrls.length > 1 && (
                        <div className="flex bg-zinc-100 p-1 rounded-2xl self-start">
                          <button
                            onClick={() => setIsGalleryView(false)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isGalleryView ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                          >
                            Dạng danh sách
                          </button>
                          <button
                            onClick={() => setIsGalleryView(true)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isGalleryView ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                          >
                            Duyệt ảnh ({imageUrls.length})
                          </button>
                        </div>
                      )}
                    </div>

                    {isGalleryView && imageUrls.length > 1 ? (
                      <div className="animate-in fade-in zoom-in-95 duration-500">
                        <GalleryViewer images={imageUrls} title={lessonData.title} />
                      </div>
                    ) : (
                      <div className="grid gap-4 animate-in fade-in duration-500">
                        {sortedFormulas.map((f) => (
                          <div key={f.id} className="bg-white border border-zinc-200 rounded-[32px] p-6 md:p-10 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
                            <div className="markdown-body prose prose-zinc max-w-none">
                              <Markdown 
                                remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                rehypePlugins={[rehypeKatex, rehypeRaw]}
                              >
                                {preprocessMarkdown(f.content)}
                              </Markdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.section>
                )}

                {/* 2. Dạng bài & Phương pháp Section */}
                {activeTab === 'examples' && sortedExamples.length > 0 && (
                  <motion.section 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                      <div className="flex items-center gap-2 text-zinc-900">
                        <Lightbulb size={24} className="text-amber-500" />
                        <h3 className="text-xl font-black uppercase tracking-tight">Phân dạng & Ví dụ</h3>
                      </div>

                      {/* Example Type Selector (Listbox/Select style) */}
                      <div className="relative group">
                        <select 
                          value={selectedExampleId || ''}
                          onChange={(e) => {
                            setSelectedExampleId(Number(e.target.value));
                            setVisibleSolutions(new Set());
                          }}
                          className="appearance-none bg-white border-2 border-zinc-900 px-4 py-2 pr-10 rounded-2xl text-xs font-bold outline-none cursor-pointer hover:bg-zinc-50 transition-all shadow-sm min-w-[200px]"
                        >
                          {sortedExamples.map((ex, i) => (
                            <option key={ex.id} value={ex.id}>
                              Dạng {i + 1}: {ex.name || ex.title.replace(/[#*`]/g, '').slice(0, 30)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Active Example Content */}
                    {selectedExampleId && sortedExamples.find(e => e.id === selectedExampleId) && (
                      <div className="space-y-8 animate-in fade-in duration-500">
                        {(() => {
                          const example = sortedExamples.find(e => e.id === selectedExampleId)!;
                          return (
                            <div className="space-y-8">
                              {/* Dạng Header Card */}
                              <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="relative z-10 flex items-center gap-4">
                                  <div className="px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest text-black">
                                    Dạng {sortedExamples.indexOf(example) + 1}
                                  </div>
                                  <h4 className="text-lg font-bold">
                                    {example.name || "Phương pháp giải"}
                                  </h4>
                                </div>
                              </div>

                              <div className="bg-white border border-zinc-200 rounded-[32px] p-6 md:p-8 shadow-sm space-y-10">
                                <div className="space-y-6">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-zinc-900">1</div>
                                    <h5 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Phương pháp giải</h5>
                                  </div>
                                  <div className="markdown-body prose prose-zinc max-w-none bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                                    <Markdown 
                                      remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                                    >
                                      {preprocessMarkdown(example.title)}
                                    </Markdown>
                                  </div>
                                </div>

                                <div className="space-y-10">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-zinc-900">2</div>
                                    <h5 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Các ví dụ minh họa</h5>
                                  </div>
                                  {(example.items || []).map((item, i) => {
                                    const solKey = `${example.id}-${i}`;
                                    const isVisible = visibleSolutions.has(solKey);

                                    return (
                                      <div key={i} className="space-y-4">
                                        <div className="p-6 bg-blue-50/50 rounded-[24px] border border-blue-100 relative">
                                          <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">Đề bài ví dụ {i + 1}</p>
                                          </div>
                                          <div className="markdown-body prose prose-sm prose-zinc max-w-none font-semibold text-zinc-800">
                                            <Markdown 
                                              remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                              rehypePlugins={[rehypeKatex, rehypeRaw]}
                                            >
                                              {preprocessMarkdown(item.problem)}
                                            </Markdown>
                                          </div>
                                        </div>

                                        <div className={`rounded-[24px] border-2 transition-all duration-300 ${
                                          isVisible 
                                            ? 'bg-emerald-50/50 border-emerald-100' 
                                            : 'bg-white border-zinc-100 hover:border-zinc-300 border-dashed'
                                        }`}>
                                          <button 
                                            onClick={() => {
                                              const next = new Set(visibleSolutions);
                                              if (next.has(solKey)) next.delete(solKey);
                                              else next.add(solKey);
                                              setVisibleSolutions(next);
                                            }}
                                            className="w-full flex items-center justify-between p-5 text-left"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isVisible ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                                <Lightbulb size={16} />
                                              </div>
                                              <div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isVisible ? 'text-emerald-600' : 'text-zinc-500'}`}>
                                                  {isVisible ? 'Lời giải chi tiết' : 'Xem lời giải ví dụ ' + (i + 1)}
                                                </p>
                                              </div>
                                            </div>
                                            <ChevronDown size={18} className={`transition-transform duration-300 ${isVisible ? 'rotate-180 text-emerald-500' : 'text-zinc-400'}`} />
                                          </button>
                                          
                                          <AnimatePresence>
                                            {isVisible && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                              >
                                                <div className="px-6 pb-8 pt-2">
                                                  <div className="h-px bg-emerald-100/50 mb-6" />
                                                  <div className="markdown-body prose prose-sm prose-zinc max-w-none font-light text-zinc-600">
                                                    <Markdown 
                                                      remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                                                    >
                                                      {preprocessMarkdown(item.solution)}
                                                    </Markdown>
                                                  </div>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </motion.section>
                )}

                {/* 3. Bài tập tự rèn Section */}
                {activeTab === 'practice' && sortedPractice.length > 0 && (
                  <motion.section 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 text-zinc-900">
                      <Dumbbell size={24} />
                      <h3 className="text-xl font-bold">Bài tập tự rèn luyện</h3>
                    </div>
                    <div className="grid gap-6">
                      {sortedPractice.map((exercise, idx) => (
                        <div key={exercise.id} className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="markdown-body prose prose-zinc max-w-none flex-1">
                              <Markdown 
                                remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                rehypePlugins={[rehypeKatex, rehypeRaw]}
                              >
                                {preprocessMarkdown(exercise.title)}
                              </Markdown>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider ml-4 shrink-0">
                              Tự luyện {idx + 1}
                            </span>
                          </div>
                          <div className="space-y-8">
                            {(exercise.items || []).map((item, i) => (
                              <div key={i} className="space-y-4">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                  <p className="text-sm font-bold text-blue-600/60 uppercase tracking-widest mb-2">Đề bài {(exercise.items || []).length > 1 ? i + 1 : ''}</p>
                                  <div className="markdown-body prose prose-sm prose-zinc max-w-none font-semibold text-zinc-800">
                                    <Markdown 
                                      remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                                    >
                                      {preprocessMarkdown(item.problem)}
                                    </Markdown>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                  {item.hint && (
                                    <details className="group flex-1 min-w-[200px]">
                                      <summary className="cursor-pointer text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors list-none flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                                          <ChevronDown size={14} />
                                        </div>
                                        Xem gợi ý {(exercise.items || []).length > 1 ? i + 1 : ''}
                                      </summary>
                                      <div className="mt-4 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 text-sm text-zinc-600 italic">
                                        <div className="markdown-body prose prose-sm max-w-none font-light text-zinc-500">
                                          <Markdown 
                                            remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                            rehypePlugins={[rehypeKatex, rehypeRaw]}
                                          >
                                            {preprocessMarkdown(item.hint)}
                                          </Markdown>
                                        </div>
                                      </div>
                                    </details>
                                  )}
                                  {item.answer && (
                                    <details className="group flex-1 min-w-[200px]">
                                      <summary className="cursor-pointer text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors list-none flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                                          <ChevronDown size={14} />
                                        </div>
                                        Xem đáp số {(exercise.items || []).length > 1 ? i + 1 : ''}
                                      </summary>
                                      <div className="mt-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 font-mono text-emerald-700 font-bold">
                                        <div className="markdown-body prose prose-sm max-w-none font-light text-emerald-700/70">
                                          <Markdown 
                                            remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                                            rehypePlugins={[rehypeKatex, rehypeRaw]}
                                          >
                                            {preprocessMarkdown(item.answer)}
                                          </Markdown>
                                        </div>
                                      </div>
                                    </details>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* 4. Bài tập trắc nghiệm Section */}
                {activeTab === 'quizzes' && sortedQuizzes.length > 0 && (
                  <motion.section 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 text-zinc-900">
                      <GraduationCap size={24} />
                      <h3 className="text-xl font-bold">Bài tập trắc nghiệm</h3>
                    </div>
                    <div className="grid gap-6">
                      {sortedQuizzes.map((quiz) => (
                        <QuizDisplay key={quiz.id} quiz={quiz} />
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400">
            Chọn một bài học để xem nội dung
          </div>
        )}
      </main>
    </div>
  );
}
