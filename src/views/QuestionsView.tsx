import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { ParliamentaryQuestion } from '../types/ysp';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

export const QuestionsView: React.FC = () => {
  const [questions, setQuestions] = useState<ParliamentaryQuestion[]>([]);

  useEffect(() => {
    fetchApi<ParliamentaryQuestion[]>('/questions').then(setQuestions).catch(console.warn);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Question Hour</span>
        <h1 className="text-3xl font-extrabold">Parliamentary Questions</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Questions submitted by Youth Senators to Standing Committee Chairs regarding policy execution.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map(pq => (
          <div key={pq.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded uppercase">
                {pq.questionNumber}
              </span>
              <span className="text-xs font-semibold text-emerald-700">{pq.status}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{pq.questionText}</h3>
            <p className="text-xs text-slate-500">Asked by: {pq.memberName} | Committee: {pq.committeeName}</p>
            {pq.answerText && (
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-bold text-emerald-800">Official Committee Answer:</span>
                <p>{pq.answerText}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
