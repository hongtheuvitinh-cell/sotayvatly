import { ListChecks, Plus, X, Edit2, Trash2, Check } from 'lucide-react';
import { FullLesson } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';

interface QuizzesSectionProps {
  lessonData: FullLesson | null;
  newQuiz: any;
  setNewQuiz: (val: any) => void;
  editingContent: { type: string; id: number; data: any } | null;
  setEditingContent: (val: { type: string; id: number; data: any } | null) => void;
  addContent: (type: 'quiz', payload: any) => Promise<void>;
  updateContent: (type: 'quiz', id: number, payload: any) => Promise<void>;
  deleteContent: (type: 'quiz', id: number) => Promise<void>;
}

export function QuizzesSection({
  lessonData,
  newQuiz,
  setNewQuiz,
  editingContent,
  setEditingContent,
  addContent,
  updateContent,
  deleteContent
}: QuizzesSectionProps) {
  return (
    <section className="space-y-6">
      <h3 className="font-bold flex items-center gap-2 text-lg text-zinc-900">
        <ListChecks size={20} className="text-zinc-400" />
        Trắc nghiệm (Quiz)
      </h3>

      {/* Add New Quiz Form AT TOP */}
      <div className="bg-zinc-50 border-2 border-zinc-200 rounded-3xl p-6 space-y-6 shadow-xl shadow-zinc-50">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Thêm bài trắc nghiệm mới</div>
        <input 
          type="text"
          value={newQuiz.title}
          onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
          className="w-full p-4 bg-white border border-zinc-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
          placeholder="Tiêu đề bài trắc nghiệm..."
        />
        
        <div className="space-y-8">
          {newQuiz.items.map((item: any, i: number) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-zinc-200 space-y-6 relative shadow-sm">
              <button 
                onClick={() => {
                  const newItems = [...newQuiz.items];
                  newItems.splice(i, 1);
                  setNewQuiz({...newQuiz, items: newItems});
                }}
                className="absolute top-4 right-4 text-zinc-300 hover:text-red-500"
              >
                <X size={18} />
              </button>
              
              <div className="space-y-4">
                <MarkdownEditor 
                  label={`Câu hỏi ${i + 1}`}
                  value={item.question}
                  onChange={(val) => {
                    const newItems = [...newQuiz.items];
                    newItems[i].question = val;
                    setNewQuiz({...newQuiz, items: newItems});
                  }}
                  minHeight="200px"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.options.map((opt: any, optIdx: number) => (
                    <div key={optIdx} className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Lựa chọn {opt.label}</label>
                      <MarkdownEditor 
                        value={opt.content}
                        onChange={(val) => {
                          const newItems = [...newQuiz.items];
                          newItems[i].options[optIdx].content = val;
                          setNewQuiz({...newQuiz, items: newItems});
                        }}
                        placeholder={`Nội dung lựa chọn ${opt.label}...`}
                        minHeight="150px"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Đáp án đúng</label>
                    <select 
                      className="w-full px-4 py-2 bg-white rounded-xl outline-none text-sm border border-zinc-200"
                      value={item.correct_answer}
                      onChange={(e) => {
                        const newItems = [...newQuiz.items];
                        newItems[i].correct_answer = e.target.value;
                        setNewQuiz({...newQuiz, items: newItems});
                      }}
                    >
                      {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <MarkdownEditor 
                    label="Giải thích (tùy chọn)"
                    value={item.explanation}
                    onChange={(val) => {
                      const newItems = [...newQuiz.items];
                      newItems[i].explanation = val;
                      setNewQuiz({...newQuiz, items: newItems});
                    }}
                    minHeight="80px"
                  />
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={() => setNewQuiz({...newQuiz, items: [...newQuiz.items, { 
              question: '', 
              options: [{label: 'A', content: ''}, {label: 'B', content: ''}, {label: 'C', content: ''}, {label: 'D', content: ''}], 
              correct_answer: 'A', 
              explanation: '' 
            }]})}
            className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-bold hover:border-zinc-400 hover:text-zinc-600 transition-all"
          >
            + Thêm câu hỏi trắc nghiệm
          </button>
        </div>

        <button 
          onClick={() => {
            const filteredItems = newQuiz.items.filter((item: any) => item.question.trim() !== '');
            if (newQuiz.title && filteredItems.length > 0) {
              addContent('quiz', { ...newQuiz, items: filteredItems });
              setNewQuiz({
                title: '',
                items: [{ 
                  question: '', 
                  options: [{label: 'A', content: ''}, {label: 'B', content: ''}, {label: 'C', content: ''}, {label: 'D', content: ''}], 
                  correct_answer: 'A', 
                  explanation: '' 
                }]
              });
            } else {
              alert("Vui lòng nhập tiêu đề và ít nhất một câu hỏi.");
            }
          }}
          className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
        >
          Lưu phần Trắc nghiệm
        </button>
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-100">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Danh sách bài Trắc nghiệm</h4>
        <div className="space-y-4">
          {[...(lessonData?.quizzes || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id).map(q => (
            <div key={q.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm group">
              {editingContent?.type === 'quiz' && editingContent?.id === q.id ? (
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
                          label={`Câu hỏi ${idx + 1}`}
                          value={item.question}
                          onChange={(val) => {
                            const newItems = [...editingContent.data.items];
                            newItems[idx].question = val;
                            setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                          }}
                          minHeight="100px"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newItems = [...(editingContent.data.items || []), { 
                          question: '', 
                          options: [{label: 'A', content: ''}, {label: 'B', content: ''}, {label: 'C', content: ''}, {label: 'D', content: ''}], 
                          correct_answer: 'A', 
                          explanation: '' 
                        }];
                        setEditingContent({...editingContent, data: {...editingContent.data, items: newItems}});
                      }}
                      className="w-full py-2 border border-dashed border-zinc-200 rounded-xl text-[10px] uppercase font-bold text-zinc-400"
                    >
                      + Thêm câu hỏi
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateContent('quiz', q.id, editingContent.data)}
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm"
                    >
                      Cập nhật bài trắc nghiệm
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
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-zinc-900">{q.title}</h5>
                    <p className="text-xs text-zinc-400 font-medium">{(q.items || []).length} câu hỏi</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingContent({type: 'quiz', id: q.id, data: {title: q.title, items: q.items || []}})}
                      className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteContent('quiz', q.id)} className="p-2 hover:bg-red-50 rounded-xl text-zinc-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
