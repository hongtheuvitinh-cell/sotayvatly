import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { QuizSection, QuizItem } from '../types';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface QuizDisplayProps {
  quiz: QuizSection;
}

export function QuizDisplay({ quiz }: QuizDisplayProps) {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  const handleSelectOption = (questionIdx: number, label: string) => {
    if (userAnswers[questionIdx]) return; // Không cho chọn lại sau khi đã trả lời (tùy chọn)
    setUserAnswers({
      ...userAnswers,
      [questionIdx]: label
    });
  };

  const toggleExplanation = (idx: number) => {
    setShowExplanations({
      ...showExplanations,
      [idx]: !showExplanations[idx]
    });
  };

  return (
    <div className="my-8 space-y-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <HelpCircle className="text-indigo-600" size={24} />
        <h3 className="text-xl font-bold text-slate-800">{quiz.title}</h3>
      </div>

      <div className="space-y-12">
        {quiz.items.map((item, qIdx) => {
          const selectedAnswer = userAnswers[qIdx];
          const isCorrect = selectedAnswer === item.correct_answer;
          const hasAnswered = !!selectedAnswer;

          return (
            <div key={qIdx} className="space-y-4">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {qIdx + 1}
                </span>
                <div className="text-lg text-slate-800 pt-0.5 prose prose-slate max-w-none">
                  <Markdown 
                    remarkPlugins={[remarkMath, remarkBreaks]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {item.question}
                  </Markdown>
                </div>
              </div>

              {/* Grid hiển thị các phương án - Tự động canh tab 2 cột trên Desktop, 1 cột trên Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                {item.options.map((option) => {
                  let bgColor = "bg-slate-50 hover:bg-slate-100 border-slate-200";
                  let textColor = "text-slate-700";
                  let icon = null;

                  if (hasAnswered) {
                    if (option.label === item.correct_answer) {
                      bgColor = "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500";
                      textColor = "text-emerald-700";
                      if (selectedAnswer === option.label) icon = <CheckCircle2 size={18} className="text-emerald-600" />;
                    } else if (selectedAnswer === option.label) {
                      bgColor = "bg-rose-50 border-rose-200 ring-1 ring-rose-500";
                      textColor = "text-rose-700";
                      icon = <XCircle size={18} className="text-rose-600" />;
                    } else {
                      bgColor = "bg-slate-50 opacity-50 border-slate-100";
                    }
                  } else if (selectedAnswer === option.label) {
                    bgColor = "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500";
                  }

                  return (
                    <button
                      key={option.label}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(qIdx, option.label)}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${bgColor}`}
                    >
                      <span className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        hasAnswered && option.label === item.correct_answer ? 'bg-emerald-500 text-white border-emerald-500' : 
                        hasAnswered && selectedAnswer === option.label ? 'bg-rose-500 text-white border-rose-500' :
                        'bg-white border-slate-300 text-slate-500'
                      }`}>
                        {option.label}
                      </span>
                      <div className={`flex-1 prose prose-sm max-w-none ${textColor}`}>
                        <Markdown 
                          remarkPlugins={[remarkMath, remarkBreaks]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {option.content}
                        </Markdown>
                      </div>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Hiển thị giải thích sau khi trả lời */}
              {hasAnswered && item.explanation && (
                <div className="ml-11 mt-4">
                  <button 
                    onClick={() => toggleExplanation(qIdx)}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {showExplanations[qIdx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showExplanations[qIdx] ? "Ẩn lời giải chi tiết" : "Xem lời giải chi tiết"}
                  </button>
                  
                  {showExplanations[qIdx] && (
                    <div className="mt-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 prose prose-indigo max-w-none animate-in fade-in slide-in-from-top-2 duration-300">
                      <Markdown 
                        remarkPlugins={[remarkMath, remarkBreaks]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {item.explanation}
                      </Markdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
