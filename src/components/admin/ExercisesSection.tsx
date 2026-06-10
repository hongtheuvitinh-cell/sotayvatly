import { Dumbbell, Plus, X, Edit2, Trash2, Check } from 'lucide-react';
import { FullLesson } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';

interface ExercisesSectionProps {
  lessonData: FullLesson | null;
  newPractice: any;
  setNewPractice: (val: any) => void;
  editingContent: { type: string; id: number; data: any } | null;
  setEditingContent: (val: { type: string; id: number; data: any } | null) => void;
  addContent: (type: 'practice', payload: any) => Promise<void>;
  updateContent: (type: 'practice', id: number, payload: any) => Promise<void>;
  deleteContent: (type: 'practice', id: number) => Promise<void>;
}

export function ExercisesSection({
  lessonData,
  newPractice,
  setNewPractice,
  editingContent,
  setEditingContent,
  addContent,
  updateContent,
  deleteContent
}: ExercisesSectionProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-6">
        <h3 className="font-bold flex items-center gap-2 text-lg text-zinc-900">
          <Dumbbell size={20} className="text-zinc-400" />
          Bài tập Tự rèn luyện
        </h3>

        {/* Add New Practice Form AT TOP */}
        <div className="bg-zinc-50 border-2 border-zinc-200 rounded-3xl p-6 space-y-6 shadow-xl shadow-zinc-50">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Thêm bộ bài tập mới</div>
          <input 
            type="text"
            value={newPractice.title}
            onChange={(e) => setNewPractice({...newPractice, title: e.target.value})}
            className="w-full p-4 bg-white border border-zinc-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-sans"
            placeholder="Tiêu đề bài tập (VD: Bài tập luyện tập 1)..."
          />
          
          <div className="space-y-6">
            {newPractice.items.map((item: any, idx: number) => (
              <div key={idx} className="p-6 bg-white rounded-2xl border border-zinc-200 space-y-6 relative shadow-sm">
                {newPractice.items.length > 1 && (
                  <button 
                    onClick={() => {
                      const newItems = [...newPractice.items];
                      newItems.splice(idx, 1);
                      setNewPractice({...newPractice, items: newItems});
                    }}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-rose-600"
                  >
                    <X size={18} />
                  </button>
                )}
                
                <MarkdownEditor 
                  label={`Đề bài câu ${idx + 1}`}
                  value={item.problem}
                  onChange={(val) => {
                    const newItems = [...newPractice.items];
                    newItems[idx] = { ...newItems[idx], problem: val };
                    setNewPractice({...newPractice, items: newItems});
                  }}
                  minHeight="150px"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MarkdownEditor 
                    label="Gợi ý/Hướng dẫn"
                    value={item.hint}
                    onChange={(val) => {
                      const newItems = [...newPractice.items];
                      newItems[idx] = { ...newItems[idx], hint: val };
                      setNewPractice({...newPractice, items: newItems});
                    }}
                    minHeight="100px"
                  />
                  <MarkdownEditor 
                    label="Đáp số"
                    value={item.answer}
                    onChange={(val) => {
                      const newItems = [...newPractice.items];
                      newItems[idx] = { ...newItems[idx], answer: val };
                      setNewPractice({...newPractice, items: newItems});
                    }}
                    minHeight="100px"
                  />
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => setNewPractice({...newPractice, items: [...newPractice.items, { problem: '', hint: '', answer: '' }]})}
              className="w-full py-3 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 text-xs font-bold hover:border-zinc-400 hover:text-zinc-600 transition-all uppercase tracking-widest"
            >
              + Thêm câu hỏi vào bộ này
            </button>
          </div>

          <button 
            onClick={() => {
              const filteredItems = newPractice.items.filter((item: any) => item.problem.trim() !== '');
              if (newPractice.title && filteredItems.length > 0) {
                addContent('practice', { ...newPractice, items: filteredItems });
                setNewPractice({ title: '', items: [{ problem: '', hint: '', answer: '' }] });
              } else {
                alert("Vui lòng nhập tiêu đề và ít nhất một câu hỏi.");
              }
            }}
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg"
          >
            Lưu bộ bài tập tự luyện
          </button>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-100">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Danh sách bài tập tự luyện</h4>
          <div className="space-y-4">
            {[...(lessonData?.practice || [])].sort((a, b) => a.id - b.id).map(ex => (
              <div key={ex.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm group">
                {editingContent?.type === 'practice' && editingContent?.id === ex.id ? (
                  <div className="space-y-6">
                    <input 
                      type="text"
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold outline-none"
                      value={editingContent.data.title}
                      onChange={(e) => setEditingContent({...editingContent, data: {...editingContent.data, title: e.target.value}})}
                    />
                    <div className="space-y-4">
                      {(editingContent.data.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="p-4 border border-zinc-100 rounded-2xl space-y-4 relative">
                          <button 
                            onClick={() => {
                              const newItems = [...editingContent.data.items];
                              newItems.splice(idx, 1);
                              setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                            }}
                            className="absolute top-2 right-2 text-zinc-300 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                          <MarkdownEditor 
                            label={`Câu ${idx + 1}`}
                            value={item.problem}
                            onChange={(val) => {
                              const newItems = [...editingContent.data.items];
                              newItems[idx].problem = val;
                              setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                            }}
                            minHeight="100px"
                          />
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newItems = [...(editingContent.data.items || []), { problem: '', hint: '', answer: '' }];
                          setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                        }}
                        className="w-full py-2 border border-dashed border-zinc-200 rounded-xl text-[10px] uppercase font-bold text-zinc-400"
                      >
                        + Thêm câu hỏi
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateContent('practice', ex.id, editingContent.data)}
                        className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm"
                      >
                        Cập nhật bộ bài tập
                      </button>
                      <button 
                        onClick={() => setEditingContent(null)}
                        className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-zinc-900">{ex.title}</h5>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingContent({type: 'practice', id: ex.id, data: {title: ex.title, items: ex.items || []}})}
                          className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteContent('practice', ex.id)} className="p-2 hover:bg-red-50 rounded-xl text-zinc-400 hover:text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {(ex.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs font-bold text-zinc-500">
                          Câu {idx + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
