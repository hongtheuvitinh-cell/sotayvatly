import { Calculator, Plus, Edit2, Trash2, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from "rehype-raw";
import { FullLesson } from '../../types';
import { MarkdownEditor, preprocessMarkdown } from '../MarkdownEditor';

interface FormulasSectionProps {
  lessonData: FullLesson | null;
  newFormula: string;
  setNewFormula: (val: string) => void;
  addContent: (type: 'formula', payload: any) => Promise<void>;
  updateContent: (type: 'formula', id: number, payload: any) => Promise<void>;
  deleteContent: (type: 'formula', id: number) => Promise<void>;
  editingContent: { type: string; id: number; data: any } | null;
  setEditingContent: (val: { type: string; id: number; data: any } | null) => void;
}

export function FormulasSection({
  lessonData,
  newFormula,
  setNewFormula,
  addContent,
  updateContent,
  deleteContent,
  editingContent,
  setEditingContent
}: FormulasSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <Calculator size={20} className="text-zinc-900" />
          Tóm tắt công thức
        </h3>
      </div>

      {/* Add New Formula Form AT TOP */}
      <div className="bg-zinc-900 rounded-3xl p-6 space-y-4 shadow-xl shadow-zinc-200">
        <MarkdownEditor 
          label="Thêm công thức mới (LaTeX)"
          value={newFormula}
          onChange={(val) => setNewFormula(val)}
          placeholder="Nhập mã LaTeX (VD: $$\sin^2 x + \cos^2 x = 1$$)..."
          minHeight="600px"
        />
        <button 
          onClick={() => {
            if (newFormula) {
              addContent('formula', { content: newFormula });
              setNewFormula('');
            }
          }}
          className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-bold text-sm hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Plus size={18} />
          Thêm vào danh sách công thức
        </button>
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-100">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Danh sách công thức hiện có</h4>
        {[...(lessonData?.formulas || [])].sort((a, b) => a.id - b.id).map(f => (
          <div key={f.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow group">
            {editingContent?.type === 'formula' && editingContent?.id === f.id ? (
              <div className="space-y-3">
                <MarkdownEditor 
                  label="Nội dung công thức (LaTeX)"
                  value={editingContent.data.content}
                  onChange={(val) => setEditingContent({...editingContent, data: {content: val}})}
                  minHeight="600px"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateContent('formula', f.id, editingContent.data)}
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
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 overflow-x-auto py-2 markdown-body">
                  <Markdown 
                    remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} 
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                  >
                    {preprocessMarkdown(f.content)}
                  </Markdown>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingContent({type: 'formula', id: f.id, data: {content: f.content}})}
                    className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteContent('formula', f.id)} className="p-2 hover:bg-red-50 rounded-xl text-zinc-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
