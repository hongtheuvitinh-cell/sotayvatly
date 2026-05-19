import { Edit2 } from 'lucide-react';
import { FullLesson } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';

interface LessonHeaderProps {
  lessonData: FullLesson | null;
  selectedLessonId: number | null;
  editingContent: { type: string; id: number; data: any } | null;
  setEditingContent: (content: { type: string; id: number; data: any } | null) => void;
  fetchLessonDetails: (id: number) => void;
  setActiveTab: (tab: 'chapters' | 'content') => void;
}

export function LessonHeader({
  lessonData,
  selectedLessonId,
  editingContent,
  setEditingContent,
  fetchLessonDetails,
  setActiveTab
}: LessonHeaderProps) {
  if (!lessonData || !selectedLessonId) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-zinc-900">{lessonData?.title}</h2>
        {editingContent?.type === 'lesson_desc' ? (
          <div className="mt-4 space-y-2">
            <MarkdownEditor 
              label="Mô tả bài học"
              value={editingContent.data.description}
              onChange={(val) => setEditingContent({...editingContent, data: {description: val}})}
              minHeight="200px"
            />
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  await fetch(`/api/lessons/${selectedLessonId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description: editingContent.data.description })
                  });
                  setEditingContent(null);
                  fetchLessonDetails(selectedLessonId);
                }}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold"
              >
                Lưu mô tả
              </button>
              <button 
                onClick={() => setEditingContent(null)}
                className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 group">
            <p className="text-zinc-500">{lessonData?.description || "Chưa có mô tả bài học..."}</p>
            <button 
              onClick={() => setEditingContent({type: 'lesson_desc', id: selectedLessonId, data: {description: lessonData?.description || ''}})}
              className="p-1 text-zinc-300 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}
      </div>
      <button onClick={() => setActiveTab('chapters')} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
        Đổi bài học
      </button>
    </div>
  );
}
