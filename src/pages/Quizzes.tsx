import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface QuizOption {
  _id?: string;
  text: string;
  icon?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  options: QuizOption[];
  isActive: boolean;
}

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOptions, setNewOptions] = useState<QuizOption[]>([{ text: '', icon: '' }, { text: '', icon: '' }]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  });

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('https://squrx-backend.onrender.com/api/v1/admin/quiz', {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        const docs = Array.isArray(data.data)
          ? data.data
          : (data.data?.docs || data.data?.quizzes || data.data?.data || []);
        setQuizzes(docs);
      } else {
        setError(data.message || 'Failed to fetch quizzes');
      }
    } catch (err) {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setNewOptions([...newOptions, { text: '', icon: '' }]);
  };

  const updateOption = (index: number, field: 'text' | 'icon', value: string) => {
    const updated = [...newOptions];
    updated[index][field] = value;
    setNewOptions(updated);
  };

  const removeOption = (index: number) => {
    if (newOptions.length <= 2) return;
    const updated = [...newOptions];
    updated.splice(index, 1);
    setNewOptions(updated);
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newOptions.some(o => !o.text.trim())) {
      setError('Please fill in title and all option texts');
      return;
    }

    try {
      setSavingQuiz(true);
      setError('');
      const res = await fetch('https://squrx-backend.onrender.com/api/v1/admin/quiz', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          options: newOptions.map(o => ({ text: o.text, icon: o.icon || undefined })),
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdding(false);
        setNewTitle('');
        setNewDescription('');
        setNewOptions([{ text: '', icon: '' }, { text: '', icon: '' }]);
        fetchQuizzes();
      } else {
        setError(data.message || 'Failed to create quiz');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSavingQuiz(false);
    }
  };

  const toggleQuizStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setQuizzes(quizzes.map(q => q._id === id ? { ...q, isActive: !currentStatus } : q));
      const res = await fetch(`https://squrx-backend.onrender.com/api/v1/admin/quiz/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (!data.success) {
        fetchQuizzes();
        setError(data.message || 'Failed to update quiz status');
      }
    } catch (err) {
      fetchQuizzes();
      setError('Network error');
    }
  };

  return (
    <div className="w-full max-w-5xl pb-16 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-md shadow-black/10 select-none">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            Quiz Management
          </h1>
          <p className="text-gray-500 mt-2 text-[13px] font-medium max-w-2xl ml-[52px]">
            Create and manage onboarding quizzes shown to users during sign-up. Add multiple choices and toggle active status.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[13px] text-white shadow-lg transition-all duration-300 ${
            isAdding 
              ? 'bg-gray-500 hover:bg-gray-600 shadow-gray-500/10' 
              : 'bg-black hover:bg-gray-800 hover:shadow-black/20 hover:-translate-y-0.5 shadow-black/10'
          }`}
        >
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add New Quiz</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6 flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Create New Quiz</h2>
          <form onSubmit={handleCreateQuiz} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Quiz Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Where are you on the journey?"
                className="w-full bg-gray-50/30 px-4 py-3 h-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white text-gray-900 placeholder-gray-400 text-[13px] font-semibold transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Description (Optional)</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="e.g. Select your stage to map the career path."
                className="w-full bg-gray-50/30 px-4 py-3 h-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white text-gray-900 placeholder-gray-400 text-[13px] font-semibold transition-all"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Options (Minimum 2)</label>
              <div className="space-y-3">
                {newOptions.map((opt, index) => (
                  <div key={index} className="flex gap-3 items-center group">
                    <input
                      type="text"
                      placeholder="Icon (e.g. 🧭)"
                      value={opt.icon || ''}
                      onChange={e => updateOption(index, 'icon', e.target.value)}
                      className="w-16 h-12 text-center text-xl bg-gray-50/30 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-bold shrink-0"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
                      onChange={e => updateOption(index, 'text', e.target.value)}
                      className="flex-1 h-12 bg-gray-50/30 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white text-gray-900 placeholder-gray-400 text-[13px] font-semibold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={newOptions.length <= 2}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="text-[12px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-3 transition-colors hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Answer Option
              </button>
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-100 mt-6">
              <button
                type="submit"
                disabled={savingQuiz}
                className={`px-6 py-3 rounded-xl text-white font-bold text-[13px] flex justify-center items-center gap-2 transition-all duration-300 shadow-lg shadow-black/10 ${
                  savingQuiz ? 'bg-gray-800 opacity-80 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:-translate-y-0.5'
                }`}
              >
                {savingQuiz ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create Quiz'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-gray-100">
        <h2 className="text-base font-black text-gray-900 mb-6 uppercase tracking-wider select-none">Existing Quizzes</h2>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-black animate-spin" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed text-[13px] font-semibold">
            No quizzes found. Add your first one above.
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="p-6 rounded-2xl bg-gray-50/30 border border-gray-100 flex flex-col gap-5 hover:bg-white hover:border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-gray-900 text-[16px] tracking-tight">{quiz.title}</h3>
                    {quiz.description && <p className="text-[12px] font-semibold text-gray-400 mt-1">{quiz.description}</p>}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {quiz.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100/50 uppercase tracking-wider select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black text-gray-400 bg-gray-50 rounded-full border border-gray-200 uppercase tracking-wider select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Inactive
                      </span>
                    )}
                    <button
                      onClick={() => toggleQuizStatus(quiz._id, quiz.isActive)}
                      className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center ${
                        quiz.isActive ? 'bg-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' : 'bg-gray-200'
                      }`}
                    >
                      <div 
                        className={`w-4.5 h-4.5 bg-white rounded-full mx-1 transition-transform duration-300 shadow-md ${
                          quiz.isActive ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                  {quiz.options.map((opt, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2.5 shadow-sm hover:border-gray-200 hover:shadow transition-all duration-300">
                      {opt.icon ? (
                        <span className="text-base shrink-0 filter drop-shadow-sm select-none">{opt.icon}</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      )}
                      <span className="text-[13px] font-bold text-gray-700 truncate">{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
