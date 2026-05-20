import { useState, useEffect, useRef } from "react";
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
  Image as ImageIcon,
  ListChecks,
  Sigma,
  Eye,
  Code,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Chapter, FullLesson } from "./types";

import Markdown from "react-markdown";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

interface AdminProps {
  onBack: () => void;
}

import remarkGfm from "remark-gfm";
import {
  MarkdownEditor,
  preprocessMarkdown,
} from "./components/MarkdownEditor";
import { FloatingImageTool } from "./components/FloatingImageTool";
import { FormulasSection } from "./components/admin/FormulasSection";
import { ExamplesSection } from "./components/admin/ExamplesSection";
import { ExercisesSection } from "./components/admin/ExercisesSection";
import { QuizzesSection } from "./components/admin/QuizzesSection";
import { LessonHeader } from "./components/admin/LessonHeader";

export default function Admin({ onBack }: AdminProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonData, setLessonData] = useState<FullLesson | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "content">(
    "chapters",
  );
  const [lessonTab, setLessonTab] = useState<
    "formulas" | "examples" | "exercises" | "quizzes"
  >("formulas");
  const [exampleSubTab, setExampleSubTab] = useState<"methods" | "items">(
    "methods",
  );
  const [selectedExampleId, setSelectedExampleId] = useState<number | null>(
    null,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("admin_auth") === "true";
  });
  const [password, setPassword] = useState("");

  // Form states
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterSubject, setNewChapterSubject] = useState("Toán học");
  const [newChapterGrade, setNewChapterGrade] = useState("Lớp 12");
  const [filterSubject, setFilterSubject] = useState("Toán học");
  const [filterGrade, setFilterGrade] = useState("Lớp 12");
  const [isDeleting, setIsDeleting] = useState<{
    type: string;
    id: number;
  } | null>(null);
  const [editingTitle, setEditingTitle] = useState<{
    type: "chapter" | "lesson";
    id: number;
    title: string;
  } | null>(null);
  const [editingContent, setEditingContent] = useState<{
    type: string;
    id: number;
    data: any;
  } | null>(null);
  const [newExample, setNewExample] = useState({
    name: "",
    title: "",
    items: [{ problem: "", solution: "" }],
  });
  const [newPractice, setNewPractice] = useState({
    title: "",
    items: [{ problem: "", hint: "", answer: "" }],
  });
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    items: [
      {
        question: "",
        options: [
          { label: "A", content: "" },
          { label: "B", content: "" },
          { label: "C", content: "" },
          { label: "D", content: "" },
        ],
        correct_answer: "A",
        explanation: "",
      },
    ],
  });
  const [newFormula, setNewFormula] = useState("");

  useEffect(() => {
    fetchChapters();
  }, [filterSubject, filterGrade]);

  useEffect(() => {
    // Sync new chapter defaults with filters
    setNewChapterSubject(filterSubject);
    setNewChapterGrade(filterGrade);
  }, [filterSubject, filterGrade]);

  useEffect(() => {
    if (selectedLessonId) {
      fetchLessonDetails(selectedLessonId);
    }
  }, [selectedLessonId]);

  const fetchChapters = async () => {
    try {
      const url = new URL("/api/chapters", window.location.origin);
      if (filterSubject) url.searchParams.append("subject", filterSubject);
      if (filterGrade) url.searchParams.append("grade", filterGrade);

      const res = await fetch(url.toString());
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
    await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newChapterTitle.trim(),
        subject: newChapterSubject,
        grade: newChapterGrade,
        sort_order: chapters.length + 1,
      }),
    });
    setNewChapterTitle("");
    fetchChapters();
  };

  const deleteChapter = async (id: number) => {
    await fetch(`/api/chapters/${id}`, { method: "DELETE" });
    setIsDeleting(null);
    fetchChapters();
  };

  const updateChapter = async (id: number, title: string) => {
    await fetch(`/api/chapters/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setEditingTitle(null);
    fetchChapters();
  };

  const addLesson = async (chapterId: number, title: string) => {
    if (!title.trim()) return;
    const chapter = chapters.find((c) => c.id === chapterId);
    const order = chapter ? chapter.lessons.length + 1 : 1;
    await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapter_id: chapterId,
        title: title.trim(),
        description: "",
        sort_order: order,
      }),
    });
    fetchChapters();
  };

  const deleteLesson = async (id: number) => {
    await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    setIsDeleting(null);
    fetchChapters();
    if (selectedLessonId === id) {
      setSelectedLessonId(null);
      setLessonData(null);
    }
  };

  const updateLesson = async (id: number, title: string) => {
    await fetch(`/api/lessons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setEditingTitle(null);
    fetchChapters();
    if (selectedLessonId === id) {
      fetchLessonDetails(id);
    }
  };

  const moveChapter = async (chapterId: number, direction: "up" | "down") => {
    const currentIndex = chapters.findIndex((c) => c.id === chapterId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const currentChapter = chapters[currentIndex];
    const targetChapter = chapters[targetIndex];

    const currentOrder = currentChapter.sort_order || currentIndex + 1;
    const targetOrder = targetChapter.sort_order || targetIndex + 1;

    await Promise.all([
      fetch(`/api/chapters/${currentChapter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: targetOrder }),
      }),
      fetch(`/api/chapters/${targetChapter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: currentOrder }),
      }),
    ]);

    fetchChapters();
  };

  const moveLesson = async (
    chapterId: number,
    lessonId: number,
    direction: "up" | "down",
  ) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    const currentIndex = chapter.lessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= chapter.lessons.length) return;

    const currentLesson = chapter.lessons[currentIndex];
    const targetLesson = chapter.lessons[targetIndex];

    const currentOrder = currentLesson.sort_order || currentIndex + 1;
    const targetOrder = targetLesson.sort_order || targetIndex + 1;

    await Promise.all([
      fetch(`/api/lessons/${currentLesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: targetOrder }),
      }),
      fetch(`/api/lessons/${targetLesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: currentOrder }),
      }),
    ]);

    fetchChapters();
  };

  const addContent = async (
    type: "formula" | "example" | "practice" | "quiz",
    payload: any,
  ) => {
    // Cấu trúc dữ liệu gửi lên server
    let body = { ...payload, lesson_id: selectedLessonId };

    // Nếu là bài tập tự rèn, đảm bảo có trường 'items'
    if (type === "practice") {
      // Lọc bỏ các bài tập trống (không có problem)
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.filter(
          (item: any) => item.problem && item.problem.trim() !== "",
        );
      }

      // Đảm bảo payload có 'items', nếu không thì tạo từ các trường cũ
      if (!body.items || body.items.length === 0) {
        body.items = [
          {
            problem: body.problem || "",
            hint: body.hint || "",
            answer: body.answer || "",
          },
        ];
      }
      // Loại bỏ các trường cũ không cần thiết để tránh xung đột
      delete body.problem;
      delete body.hint;
      delete body.answer;
    }

    if (type === "quiz") {
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.filter(
          (item: any) => item.question && item.question.trim() !== "",
        );
      }
    }

    const res = await fetch(`/api/content/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      if (selectedLessonId) fetchLessonDetails(selectedLessonId);
      alert("Thêm thành công!");
    } else {
      const errData = await res.json();
      alert("Lỗi khi thêm: " + (errData.error || "Không xác định"));
    }
  };

  const deleteContent = async (
    type: "formula" | "example" | "practice" | "quiz",
    id: number,
  ) => {
    await fetch(`/api/content/${type}/${id}`, { method: "DELETE" });
    if (selectedLessonId) fetchLessonDetails(selectedLessonId);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Sai mật khẩu!");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200"
        >
          <h2 className="text-lg font-bold mb-4">Nhập mật khẩu quản trị</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded-lg mb-4"
            placeholder="Mật khẩu"
          />
          <button
            type="submit"
            className="w-full bg-zinc-900 text-white py-2 rounded-lg font-medium"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  const updateContent = async (
    type: "formula" | "example" | "practice" | "quiz",
    id: number,
    payload: any,
  ) => {
    // Cấu trúc dữ liệu gửi lên server
    let body = { ...payload };

    // Nếu là bài tập tự rèn, đảm bảo có trường 'items' chuẩn
    if (type === "practice") {
      // Lọc bỏ các bài tập trống (không có problem)
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.filter(
          (item: any) => item.problem && item.problem.trim() !== "",
        );
      }

      // Loại bỏ các trường cũ không cần thiết để tránh xung đột
      delete body.problem;
      delete body.hint;
      delete body.answer;
    }

    if (type === "quiz") {
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.filter(
          (item: any) => item.question && item.question.trim() !== "",
        );
      }
    }

    const res = await fetch(`/api/content/${type}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setEditingContent(null);
      if (selectedLessonId) fetchLessonDetails(selectedLessonId);
      alert("Cập nhật thành công!");
    } else {
      const errData = await res.json();
      alert("Lỗi khi cập nhật: " + (errData.error || "Không xác định"));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Quản trị nội dung</h1>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("chapters")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "chapters" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Cấu trúc
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "content" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Nội dung chi tiết
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 w-full mx-0">
        {activeTab === "chapters" ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Chapters Management */}
            <section className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-6 shadow-sm">
                <h2 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter text-zinc-400">
                  <LayoutGrid size={16} />
                  Bộ lọc & Quản lý chương
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                      Môn học
                    </label>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none"
                    >
                      {[
                        "Toán học",
                        "Vật lý",
                        "Hóa học",
                        "Sinh học",
                        "Tiếng Anh",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                      Khối lớp
                    </label>
                    <select
                      value={filterGrade}
                      onChange={(e) => setFilterGrade(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none"
                    >
                      {["Lớp 10", "Lớp 11", "Lớp 12"].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="h-px bg-zinc-100" />

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                    Thêm chương mới vào đây
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập tên chương..."
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-medium"
                    />
                    <button
                      onClick={addChapter}
                      className="px-6 py-3 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-zinc-200 active:scale-95"
                    >
                      <Plus size={20} /> Thêm
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-4 shadow-sm min-h-[400px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Cấu trúc Chương & Bài học
                  </h3>
                  <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                    {chapters.length} Chương
                  </span>
                </div>

                <div className="space-y-3">
                  {chapters.length === 0 && (
                    <div className="py-20 text-center text-zinc-300 italic text-sm">
                      Chưa có chương nào trong bộ lọc này...
                    </div>
                  )}
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="group border border-zinc-100 rounded-xl p-3 hover:border-zinc-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        {editingTitle?.type === "chapter" &&
                        editingTitle?.id === chapter.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              autoFocus
                              type="text"
                              className="flex-1 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded outline-none text-sm"
                              value={editingTitle.title}
                              onChange={(e) =>
                                setEditingTitle({
                                  ...editingTitle,
                                  title: e.target.value,
                                })
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                updateChapter(chapter.id, editingTitle.title)
                              }
                            />
                            <button
                              onClick={() =>
                                updateChapter(chapter.id, editingTitle.title)
                              }
                              className="p-1 text-emerald-600"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingTitle(null)}
                              className="p-1 text-zinc-400"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-zinc-900">
                              {chapter.title}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-0.5 mr-2 bg-zinc-100 rounded-lg p-0.5">
                                <button
                                  onClick={() => moveChapter(chapter.id, "up")}
                                  disabled={chapters.indexOf(chapter) === 0}
                                  className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Di chuyển lên"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    moveChapter(chapter.id, "down")
                                  }
                                  disabled={
                                    chapters.indexOf(chapter) ===
                                    chapters.length - 1
                                  }
                                  className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Di chuyển xuống"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                              <button
                                onClick={() =>
                                  setEditingTitle({
                                    type: "chapter",
                                    id: chapter.id,
                                    title: chapter.title,
                                  })
                                }
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              {isDeleting?.id === chapter.id &&
                              isDeleting?.type === "chapter" ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => deleteChapter(chapter.id)}
                                    className="text-[10px] bg-red-500 text-white px-2 py-1 rounded"
                                  >
                                    Xóa
                                  </button>
                                  <button
                                    onClick={() => setIsDeleting(null)}
                                    className="text-[10px] bg-zinc-200 px-2 py-1 rounded"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setIsDeleting({
                                      type: "chapter",
                                      id: chapter.id,
                                    })
                                  }
                                  className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Lessons in Chapter */}
                      <div className="pl-4 border-l-2 border-zinc-100 space-y-2">
                        {chapter.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              setSelectedLessonId(lesson.id);
                              setActiveTab("content");
                            }}
                            className="flex items-center justify-between text-sm bg-zinc-50 p-2 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors group/lesson"
                          >
                            {editingTitle?.type === "lesson" &&
                            editingTitle?.id === lesson.id ? (
                              <div
                                className="flex-1 flex gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  autoFocus
                                  type="text"
                                  className="flex-1 px-2 py-0.5 bg-white border border-zinc-200 rounded outline-none text-xs"
                                  value={editingTitle.title}
                                  onChange={(e) =>
                                    setEditingTitle({
                                      ...editingTitle,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    updateLesson(lesson.id, editingTitle.title)
                                  }
                                />
                                <button
                                  onClick={() =>
                                    updateLesson(lesson.id, editingTitle.title)
                                  }
                                  className="text-emerald-600"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => setEditingTitle(null)}
                                  className="text-zinc-400"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-zinc-600 group-hover/lesson:text-zinc-900 font-medium">
                                  {lesson.title}
                                </span>
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-0.5 mr-1 bg-white rounded-lg p-0.5 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveLesson(chapter.id, lesson.id, "up");
                                      }}
                                      disabled={
                                        chapter.lessons.indexOf(lesson) === 0
                                      }
                                      className="p-0.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Di chuyển lên"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveLesson(
                                          chapter.id,
                                          lesson.id,
                                          "down",
                                        );
                                      }}
                                      disabled={
                                        chapter.lessons.indexOf(lesson) ===
                                        chapter.lessons.length - 1
                                      }
                                      className="p-0.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Di chuyển xuống"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTitle({
                                        type: "lesson",
                                        id: lesson.id,
                                        title: lesson.title,
                                      });
                                    }}
                                    className="p-1 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover/lesson:opacity-100 transition-opacity"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <div className="p-1 text-zinc-400">
                                    <ChevronRight size={16} />
                                  </div>
                                  {isDeleting?.id === lesson.id &&
                                  isDeleting?.type === "lesson" ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteLesson(lesson.id);
                                      }}
                                      className="text-[10px] text-red-500 font-bold px-1"
                                    >
                                      Xác nhận
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsDeleting({
                                          type: "lesson",
                                          id: lesson.id,
                                        });
                                      }}
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
                              if (e.key === "Enter") {
                                addLesson(chapter.id, e.currentTarget.value);
                                e.currentTarget.value = "";
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
              <p className="text-sm">
                Chọn một bài học để chỉnh sửa nội dung chi tiết
              </p>
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
                <LessonHeader
                  lessonData={lessonData}
                  selectedLessonId={selectedLessonId}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  fetchLessonDetails={fetchLessonDetails}
                  setActiveTab={setActiveTab}
                />

                {/* Sub-tabs for content sections */}
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                  <button
                    onClick={() => setLessonTab("formulas")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${lessonTab === "formulas" ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "text-zinc-500 hover:bg-zinc-100"}`}
                  >
                    <Calculator size={18} />
                    Tóm tắt công thức
                  </button>
                  <button
                    onClick={() => setLessonTab("examples")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${lessonTab === "examples" ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "text-zinc-500 hover:bg-zinc-100"}`}
                  >
                    <Lightbulb size={18} />
                    Phân dạng & PP giải
                  </button>
                  <button
                    onClick={() => setLessonTab("exercises")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${lessonTab === "exercises" ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "text-zinc-500 hover:bg-zinc-100"}`}
                  >
                    <Dumbbell size={18} />
                    Bài tập
                  </button>
                  <button
                    onClick={() => setLessonTab("quizzes")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${lessonTab === "quizzes" ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "text-zinc-500 hover:bg-zinc-100"}`}
                  >
                    <ListChecks size={18} />
                    Trắc nghiệm
                  </button>
                </div>

                {lessonTab === "formulas" && (
                  <FormulasSection
                    lessonData={lessonData}
                    newFormula={newFormula}
                    setNewFormula={setNewFormula}
                    addContent={addContent}
                    updateContent={updateContent}
                    deleteContent={deleteContent}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                  />
                )}

                {lessonTab === "examples" && (
                  <ExamplesSection
                    lessonData={lessonData}
                    selectedExampleId={selectedExampleId}
                    setSelectedExampleId={setSelectedExampleId}
                    exampleSubTab={exampleSubTab}
                    setExampleSubTab={setExampleSubTab}
                    newExample={newExample}
                    setNewExample={setNewExample}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    addContent={addContent}
                    updateContent={updateContent}
                    deleteContent={deleteContent}
                  />
                )}

                {lessonTab === "exercises" && (
                  <ExercisesSection
                    lessonData={lessonData}
                    newPractice={newPractice}
                    setNewPractice={setNewPractice}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    addContent={addContent}
                    updateContent={updateContent}
                    deleteContent={deleteContent}
                  />
                )}

                {lessonTab === "quizzes" && (
                  <QuizzesSection
                    lessonData={lessonData}
                    newQuiz={newQuiz}
                    setNewQuiz={setNewQuiz}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    addContent={addContent}
                    updateContent={updateContent}
                    deleteContent={deleteContent}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>
      <FloatingImageTool />
    </div>
  );
}
