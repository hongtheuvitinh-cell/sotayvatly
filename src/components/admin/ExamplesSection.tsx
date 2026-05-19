import { Lightbulb, Edit2, Trash2, Check, Plus, X } from 'lucide-react';
import { FullLesson } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';

interface ExamplesSectionProps {
  lessonData: FullLesson | null;
  selectedExampleId: number | null;
  setSelectedExampleId: (id: number | null) => void;
  exampleSubTab: 'methods' | 'items';
  setExampleSubTab: (tab: 'methods' | 'items') => void;
  newExample: any;
  setNewExample: (val: any) => void;
  editingContent: { type: string; id: number; data: any } | null;
  setEditingContent: (val: { type: string; id: number; data: any } | null) => void;
  addContent: (type: 'example', payload: any) => Promise<void>;
  updateContent: (type: 'example', id: number, payload: any) => Promise<void>;
  deleteContent: (type: 'example', id: number) => Promise<void>;
}

export function ExamplesSection({
  lessonData,
  selectedExampleId,
  setSelectedExampleId,
  exampleSubTab,
  setExampleSubTab,
  newExample,
  setNewExample,
  editingContent,
  setEditingContent,
  addContent,
  updateContent,
  deleteContent
}: ExamplesSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-bold flex items-center gap-2 text-lg text-zinc-900">
          <Lightbulb size={20} className="text-zinc-400" />
          Phân dạng & Phương pháp giải
        </h3>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button 
            onClick={() => setExampleSubTab('methods')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${exampleSubTab === 'methods' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
             1. Phân dạng & PP
          </button>
          <button 
            onClick={() => {
              setExampleSubTab('items');
              if (!selectedExampleId && (lessonData?.examples || []).length > 0) {
                setSelectedExampleId(lessonData!.examples[0].id);
              }
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${exampleSubTab === 'items' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
            2. Các ví dụ minh họa
          </button>
        </div>
      </div>

      {exampleSubTab === 'methods' ? (
        <div className="space-y-6">
          <div className="bg-white border-2 border-zinc-900 rounded-3xl p-6 space-y-4 shadow-xl shadow-zinc-100">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Tên dạng bài (Dùng để hiển thị trong danh sách)</label>
                <input 
                  type="text"
                  value={editingContent?.type === 'example' ? (editingContent.data.name || '') : newExample.name}
                  onChange={(e) => {
                    if (editingContent?.type === 'example') {
                      setEditingContent({...editingContent, data: {...editingContent.data, name: e.target.value}});
                    } else {
                      setNewExample({...newExample, name: e.target.value});
                    }
                  }}
                  placeholder="Ví dụ: Dạng 1: Tính đơn điệu của hàm số..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-bold"
                />
              </div>
              <MarkdownEditor 
                label={editingContent?.type === 'example' ? "Sửa mô tả dạng bài & phương pháp" : "Thêm dạng bài & phương pháp mới"}
                value={editingContent?.type === 'example' ? editingContent.data.title : newExample.title}
                onChange={(val) => {
                  if (editingContent?.type === 'example') {
                    setEditingContent({...editingContent, data: {...editingContent.data, title: val}});
                  } else {
                    setNewExample({...newExample, title: val});
                  }
                }}
                placeholder="Nhập mô tả dạng bài và phương pháp giải..."
                minHeight="600px"
              />
            </div>
            <div className="flex gap-2">
              {editingContent?.type === 'example' ? (
                <>
                  <button 
                    onClick={() => {
                      updateContent('example', editingContent.id, editingContent.data);
                      setEditingContent(null);
                    }}
                    className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Check size={18} /> Cập nhật
                  </button>
                  <button 
                    onClick={() => setEditingContent(null)}
                    className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    if (!newExample.title || !newExample.name) {
                      alert("Vui lòng nhập đầy đủ tên dạng bài và phương pháp giải!");
                      return;
                    }
                    addContent('example', { 
                      name: newExample.name, 
                      title: newExample.title, 
                      items: newExample.items 
                    });
                    setNewExample({ name: '', title: '', items: [{ problem: '', solution: '' }] });
                  }}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Plus size={18} /> Thêm Dạng bài mới
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Danh sách các dạng (Nhấn sửa để cập nhật lên màn hình soạn thảo)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(lessonData?.examples || []).map((ex, idx) => (
                <div key={ex.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between group hover:border-zinc-900 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                      {idx + 1}
                    </span>
                    <div className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">
                      {ex.name || ex.title.replace(/[#*`]/g, '').slice(0, 50) + '...'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingContent({
                        type: 'example', 
                        id: ex.id, 
                        data: { name: ex.name || '', title: ex.title, items: ex.items || [] }
                      })}
                      className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900"
                      title="Sửa phương pháp"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => { if(confirm('Xóa dạng này?')) deleteContent('example', ex.id); }}
                      className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500"
                      title="Xóa dạng này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chọn dạng bài</label>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                {(lessonData?.examples || []).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setSelectedExampleId(ex.id);
                      setEditingContent(null);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedExampleId === ex.id 
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg' 
                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1 opacity-60">Dạng {lessonData?.examples.indexOf(ex)! + 1}</div>
                    <div className="text-sm font-bold truncate">{ex.name || ex.title.replace(/[#*`]/g, '')}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {selectedExampleId ? (
                <>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-900">
                        {(editingContent as any)?.itemIndex !== undefined ? `Sửa Bài ${(editingContent as any).itemIndex + 1}` : 'Thêm Ví dụ mới cho dạng này'}
                      </h4>
                      {editingContent?.type === 'example_item' && (
                        <button 
                          onClick={() => setEditingContent(null)}
                          className="text-[10px] font-bold text-zinc-400 uppercase hover:text-zinc-900"
                        >
                          Hủy sửa & Thêm mới
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <MarkdownEditor 
                        label="Đề bài"
                        value={editingContent?.type === 'example_item' ? editingContent.data.problem : newExample.items[0].problem}
                        onChange={(val) => {
                          if (editingContent?.type === 'example_item') {
                            setEditingContent({...editingContent, data: {...editingContent.data, problem: val}});
                          } else {
                            const newItems = [...newExample.items];
                            newItems[0].problem = val;
                            setNewExample({...newExample, items: newItems});
                          }
                        }}
                        minHeight="120px"
                      />
                      <MarkdownEditor 
                        label="Lời giải chi tiết"
                        value={editingContent?.type === 'example_item' ? editingContent.data.solution : newExample.items[0].solution}
                        onChange={(val) => {
                          if (editingContent?.type === 'example_item') {
                            setEditingContent({...editingContent, data: {...editingContent.data, solution: val}});
                          } else {
                            const newItems = [...newExample.items];
                            newItems[0].solution = val;
                            setNewExample({...newExample, items: newItems});
                          }
                        }}
                        minHeight="120px"
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingContent?.type === 'example_item' ? (
                        <>
                          <button 
                            onClick={() => {
                              const ex = lessonData?.examples.find(e => e.id === selectedExampleId);
                              if (ex) {
                                const newItems = [...(ex.items || [])];
                                newItems[(editingContent as any).itemIndex] = { 
                                  problem: editingContent.data.problem, 
                                  solution: editingContent.data.solution 
                                };
                                updateContent('example', ex.id, { ...ex, items: newItems });
                                setEditingContent(null);
                              }
                            }}
                            className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Check size={18} /> Cập nhật ví dụ
                          </button>
                          <button 
                            onClick={() => setEditingContent(null)}
                            className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            const ex = lessonData?.examples.find(e => e.id === selectedExampleId);
                            if (ex && newExample.items[0].problem) {
                              const newItems = [...(ex.items || []), { problem: newExample.items[0].problem, solution: newExample.items[0].solution }];
                              updateContent('example', ex.id, { ...ex, items: newItems });
                              setNewExample({...newExample, items: [{ problem: '', solution: '' }]});
                            }
                          }}
                          className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Plus size={18} /> Thêm vào danh sách ví dụ
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Danh sách câu đã thêm trong dạng này</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(lessonData?.examples.find(e => e.id === selectedExampleId)?.items || []).map((item, idx) => (
                        <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between group shadow-sm transition-all hover:border-zinc-900">
                          <span className="font-bold text-zinc-900 text-sm">Bài {idx + 1}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingContent({
                                type: 'example_item',
                                id: selectedExampleId,
                                itemIndex: idx,
                                data: { problem: item.problem, solution: item.solution }
                              } as any)}
                              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900"
                              title="Sửa câu này"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Xóa ví dụ này?')) {
                                  const ex = lessonData?.examples.find(e => e.id === selectedExampleId);
                                  if (ex) {
                                    const newItems = [...(ex.items || [])];
                                    newItems.splice(idx, 1);
                                    updateContent('example', ex.id, { ...ex, items: newItems });
                                  }
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500"
                              title="Xóa câu này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl">
                  <Lightbulb size={48} className="opacity-20" />
                  <p className="text-sm font-bold">Vui lòng chọn hoặc thêm Dạng bài trước</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
