import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, AlertCircle } from 'lucide-react';

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
      const res = await fetch('https://squrx-backend.onrender.com/api/v1/admin/quiz?limit=50', {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        const quizList = Array.isArray(data.data) 
          ? data.data 
          : (data.data?.docs || data.data?.quizzes || data.data?.data || []);
        setQuizzes(quizList);
      } else {
        setError(data.message || 'Failed to fetch quizzes');
      }
    } catch (err) {
      setError('Network error');
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
    if (newOptions.length <= 2) return; // Minimum 2 options
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
    <div className="w-full max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            Quiz Management
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl">
            Create and manage interactive quizzes for users. Add multiple choices and toggle active status.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 ${
            isAdding ? 'bg-gray-500 hover:bg-gray-600' : 'bg-black hover:bg-gray-800 hover:shadow-black/20 hover:-translate-y-0.5'
          }`}
        >
          {isAdding ? 'Cancel' : <><Plus className="w-5 h-5" /> Add New Quiz</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-6">Create New Quiz</h2>
          <form onSubmit={handleCreateQuiz} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. What is your favourite programming language?"
                className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="e.g. Choose the language you enjoy coding in the most"
                className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options (Minimum 2)</label>
              <div className="space-y-3">
                {newOptions.map((opt, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Icon (e.g. 🟨)"
                      value={opt.icon}
                      onChange={e => updateOption(index, 'icon', e.target.value)}
                      className="w-20 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-center"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
                      onChange={e => updateOption(index, 'text', e.target.value)}
                      className="flex-1 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={newOptions.length <= 2}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-3 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Option
              </button>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingQuiz}
                className={`px-8 py-3.5 rounded-xl text-white font-semibold flex justify-center items-center gap-2 transition-all duration-300 shadow-lg ${
                  savingQuiz ? 'bg-gray-800 opacity-80 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:shadow-black/20'
                }`}
              >
                {savingQuiz ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Create Quiz'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Existing Quizzes</h2>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center p-12 text-gray-500 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
            No quizzes found.
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{quiz.title}</h3>
                    {quiz.description && <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${quiz.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => toggleQuizStatus(quiz._id, quiz.isActive)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                        quiz.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div 
                        className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-300 shadow-sm ${
                          quiz.isActive ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {quiz.options.map((opt, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                      {opt.icon && <span className="text-lg">{opt.icon}</span>}
                      <span className="text-sm font-medium text-gray-700">{opt.text}</span>
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
