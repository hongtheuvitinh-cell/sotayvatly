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
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Chapter, FullLesson } from './types';
import Admin from './Admin';
import { QuizDisplay } from './components/QuizDisplay';

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonData, setLessonData] = useState<FullLesson | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('Toán học');
  const [selectedGrade, setSelectedGrade] = useState('Lớp 12');

  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh'];
  const grades = ['Lớp 10', 'Lớp 11', 'Lớp 12'];

  // Fetch chapters on mount
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
          // Do not automatically expand or select on load
          setSelectedLessonId(null);
          setLessonData(null);
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
          } else {
            console.error("Error in lesson data:", data);
          }
        })
        .catch(err => console.error("Error fetching lesson:", err));
    }
  }, [selectedLessonId]);

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
                        onClick={() => setSelectedLessonId(lesson.id)}
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
          <div className="max-w-4xl mx-auto pt-4 px-6 pb-12 lg:pt-6 lg:px-12 lg:pb-20">
            <motion.div
              key={lessonData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
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
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {lessonData.title}
                </h2>
                <p className="text-lg text-zinc-600 max-w-2xl leading-relaxed">
                  {lessonData.description}
                </p>
              </header>

              {/* 1. Công thức Section */}
              {lessonData.formulas.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-zinc-900">
                    <Calculator size={24} />
                    <h3 className="text-xl font-bold">1. Công thức cần nhớ</h3>
                  </div>
                  <div className="grid gap-4">
                    {(lessonData.formulas || []).map((f) => (
                      <div key={f.id} className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm overflow-x-auto">
                        <div className="markdown-body prose prose-zinc max-w-none">
                          <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
                            {f.content}
                          </Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Dạng bài & Phương pháp Section */}
              {lessonData.examples.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-900">
                    <Lightbulb size={24} />
                    <h3 className="text-xl font-bold">2. Dạng bài & Phương pháp</h3>
                  </div>
                  <div className="grid gap-6">
                    {(lessonData.examples || []).map((example, idx) => (
                      <div key={example.id} className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="markdown-body prose prose-zinc max-w-none flex-1">
                            <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
                              {example.title}
                            </Markdown>
                          </div>
                          <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full uppercase tracking-wider ml-4 shrink-0">
                            Dạng {idx + 1}
                          </span>
                        </div>
                        <div className="space-y-8">
                          {(example.items || []).map((item, i) => (
                            <div key={i} className="space-y-4">
                              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-sm font-bold text-blue-600/60 uppercase tracking-widest mb-2">Đề bài {(example.items || []).length > 1 ? i + 1 : ''}</p>
                                <div className="markdown-body prose prose-sm prose-zinc max-w-none">
                                  <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.problem}</Markdown>
                                </div>
                              </div>
                              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <p className="text-sm font-bold text-emerald-600/60 uppercase tracking-widest mb-2">Lời giải chi tiết {(example.items || []).length > 1 ? i + 1 : ''}</p>
                                <div className="markdown-body prose prose-sm prose-emerald max-w-none">
                                  <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.solution}</Markdown>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!example.items || example.items.length === 0) && (
                            <div className="space-y-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Đề bài</p>
                                <div className="markdown-body prose prose-sm prose-zinc max-w-none whitespace-pre-wrap">
                                  {(example as any).problem}
                                </div>
                              </div>
                              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <p className="text-sm font-bold text-emerald-600/50 uppercase tracking-widest mb-2">Lời giải chi tiết</p>
                                <div className="markdown-body prose prose-sm prose-emerald max-w-none whitespace-pre-wrap">
                                  {(example as any).solution}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 3. Bài tập tự rèn Section */}
              {lessonData.practice && lessonData.practice.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-900">
                    <Dumbbell size={24} />
                    <h3 className="text-xl font-bold">3. Bài tập tự rèn</h3>
                  </div>
                  <div className="grid gap-6">
                    {(lessonData.practice || []).map((exercise, idx) => (
                      <div key={exercise.id} className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="markdown-body prose prose-zinc max-w-none flex-1">
                            <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
                              {exercise.title}
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
                                <div className="markdown-body prose prose-sm prose-zinc max-w-none">
                                  <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.problem}</Markdown>
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
                                      <div className="markdown-body prose prose-sm max-w-none">
                                        <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.hint}</Markdown>
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
                                      <div className="markdown-body prose prose-sm max-w-none">
                                        <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>{item.answer}</Markdown>
                                      </div>
                                    </div>
                                  </details>
                                )}
                              </div>
                            </div>
                          ))}
                          {(!exercise.items || exercise.items.length === 0) && (
                            <div className="space-y-4">
                              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-sm font-bold text-blue-600/60 uppercase tracking-widest mb-2">Đề bài</p>
                                <div className="markdown-body prose prose-sm prose-zinc max-w-none whitespace-pre-wrap">
                                  {(exercise as any).problem}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                {(exercise as any).hint && (
                                  <details className="group flex-1 min-w-[200px]">
                                    <summary className="cursor-pointer text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors list-none flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                                        <ChevronDown size={14} />
                                      </div>
                                      Xem gợi ý
                                    </summary>
                                    <div className="mt-4 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 text-sm text-zinc-600 italic">
                                      <div className="markdown-body prose prose-sm max-w-none whitespace-pre-wrap">
                                        {(exercise as any).hint}
                                      </div>
                                    </div>
                                  </details>
                                )}
                                {(exercise as any).answer && (
                                  <details className="group flex-1 min-w-[200px]">
                                    <summary className="cursor-pointer text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors list-none flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                                        <ChevronDown size={14} />
                                      </div>
                                      Xem đáp số
                                    </summary>
                                    <div className="mt-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 font-mono text-emerald-700 font-bold">
                                      <div className="markdown-body prose prose-sm max-w-none whitespace-pre-wrap">
                                        {(exercise as any).answer}
                                      </div>
                                    </div>
                                  </details>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Bài tập trắc nghiệm Section */}
              {lessonData.quizzes && lessonData.quizzes.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-900">
                    <GraduationCap size={24} />
                    <h3 className="text-xl font-bold">4. Bài tập trắc nghiệm</h3>
                  </div>
                  <div className="grid gap-6">
                    {lessonData.quizzes.map((quiz) => (
                      <QuizDisplay key={quiz.id} quiz={quiz} />
                    ))}
                  </div>
                </section>
              )}
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
