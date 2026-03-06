import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Search, 
  FileText, 
  BrainCircuit, 
  HelpCircle, 
  MessageSquare,
  Trash2,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { StudySet, ViewState } from './types';
import { Button, Card, Input, cn } from './components/UI';
import Markdown from 'react-markdown';
import { extractTextFromPdf, generateId } from './utils';
import { generateStudyMaterials, chatWithMaterial } from './services/gemini';
import { useDropzone } from 'react-dropzone';

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudySets();
  }, []);

  const fetchStudySets = async () => {
    const res = await fetch('/api/study-sets');
    const data = await res.json();
    setStudySets(data.map((s: any) => ({
      ...s,
      flashcards: JSON.parse(s.flashcards),
      quiz: JSON.parse(s.quiz)
    })));
  };

  const handleCreateSet = async (title: string, content: string, type: 'text' | 'pdf' | 'link') => {
    setIsLoading(true);
    try {
      const result = await generateStudyMaterials(content);
      const newSet: StudySet = {
        id: generateId(),
        title: result.title || title,
        source_type: type,
        source_content: content,
        notes: result.notes,
        flashcards: result.flashcards,
        quiz: result.quiz,
        created_at: new Date().toISOString()
      };

      await fetch('/api/study-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSet)
      });

      await fetchStudySets();
      setCurrentSet(newSet);
      setView('study');
    } catch (error) {
      console.error('Error creating study set:', error);
      alert('Failed to generate study materials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this study set?')) {
      await fetch(`/api/study-sets/${id}`, { method: 'DELETE' });
      await fetchStudySets();
      if (currentSet?.id === id) {
        setCurrentSet(null);
        setView('dashboard');
      }
    }
  };

  const filteredSets = studySets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">TurboStudy</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === 'dashboard' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setView('create')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === 'create' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Plus size={18} />
            Create New
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              RS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Student User</p>
              <p className="text-xs text-gray-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 max-w-6xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Your Study Sets</h1>
                  <p className="text-gray-500 mt-1">Manage and access your AI-generated study materials.</p>
                </div>
                <Button onClick={() => setView('create')} className="gap-2">
                  <Plus size={18} />
                  New Study Set
                </Button>
              </div>

              <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search your study sets..." 
                  className="pl-10 h-12 bg-white border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredSets.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <BookOpen size={32} />
                  </div>
                  <h3 className="text-lg font-medium">No study sets found</h3>
                  <p className="text-gray-500 mt-1">Create your first study set to get started.</p>
                  <Button variant="secondary" onClick={() => setView('create')} className="mt-6">
                    Create New Set
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSets.map((set) => (
                    <Card 
                      key={set.id} 
                      className="group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="p-6" onClick={() => { setCurrentSet(set); setView('study'); }}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            {set.source_type === 'pdf' ? <FileText size={20} /> : <BookOpen size={20} />}
                          </div>
                          <button 
                            onClick={(e) => handleDeleteSet(set.id, e)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-1">{set.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            Notes
                          </span>
                          <span className="flex items-center gap-1">
                            <BrainCircuit size={14} />
                            {set.flashcards.length} Cards
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle size={14} />
                            Quiz
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                            {new Date(set.created_at).toLocaleDateString()}
                          </span>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'create' && (
            <CreateStudySet 
              onBack={() => setView('dashboard')} 
              onCreate={handleCreateSet}
              isLoading={isLoading}
            />
          )}

          {view === 'study' && currentSet && (
            <StudyView 
              studySet={currentSet} 
              onBack={() => setView('dashboard')} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={20} />
          </div>
          <h2 className="text-xl font-bold mt-6">Turbocharging your learning...</h2>
          <p className="text-gray-500 mt-2">Our AI is generating notes, flashcards, and quizzes for you.</p>
          <div className="mt-8 flex gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateStudySet({ onBack, onCreate, isLoading }: { onBack: () => void, onCreate: (title: string, content: string, type: 'text' | 'pdf' | 'link') => void, isLoading: boolean }) {
  const [type, setType] = useState<'text' | 'pdf' | 'link'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsExtracting(true);
      try {
        const text = await extractTextFromPdf(acceptedFiles[0]);
        setContent(text);
        if (!title) setTitle(acceptedFiles[0].name.replace('.pdf', ''));
      } catch (error) {
        console.error('PDF extraction failed:', error);
        alert('Failed to extract text from PDF. Please try pasting the text instead.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false 
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-8 max-w-3xl mx-auto"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Create New Study Set</h1>
        <p className="text-gray-500 mt-1">Upload your materials and let AI do the heavy lifting.</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-semibold mb-2">Study Set Title</label>
          <Input 
            placeholder="e.g., Biology Chapter 4: Photosynthesis" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-4">Source Material</label>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            <button 
              onClick={() => setType('text')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                type === 'text' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Paste Text
            </button>
            <button 
              onClick={() => setType('pdf')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                type === 'pdf' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Upload PDF
            </button>
            <button 
              onClick={() => setType('link')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                type === 'link' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              YouTube Link
            </button>
          </div>

          {type === 'text' && (
            <textarea 
              placeholder="Paste your lecture notes, article, or any text here..."
              className="w-full min-h-[300px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}

          {type === 'pdf' && (
            <div 
              {...getRootProps()} 
              className={cn(
                "w-full min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer",
                isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
              )}
            >
              <input {...getInputProps()} />
              {isExtracting ? (
                <>
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <p className="font-medium">Extracting text from PDF...</p>
                </>
              ) : content ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} />
                  </div>
                  <p className="font-medium text-green-700">PDF Uploaded Successfully</p>
                  <p className="text-sm text-gray-500 mt-1">{content.slice(0, 100)}...</p>
                  <Button variant="ghost" className="mt-4" onClick={(e) => { e.stopPropagation(); setContent(''); }}>
                    Change File
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <Plus size={32} />
                  </div>
                  <p className="font-bold text-lg">Click or drag PDF here</p>
                  <p className="text-sm text-gray-500 mt-1">Support for lecture slides, textbooks, and research papers.</p>
                </>
              )}
            </div>
          )}

          {type === 'link' && (
            <div className="space-y-4">
              <Input 
                placeholder="Paste YouTube video URL..." 
                className="h-12"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <Sparkles className="text-amber-600 shrink-0" size={20} />
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> For YouTube links, our AI will attempt to analyze the video content based on its metadata and transcripts.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6">
          <Button 
            className="w-full h-12 text-lg gap-2" 
            disabled={!content || !title || isLoading}
            onClick={() => onCreate(title, content, type)}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            Generate Study Set
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function StudyView({ studySet, onBack }: { studySet: StudySet, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'chat'>('notes');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput;
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user' as const, parts: [{ text: userMsg }] }];
    setChatMessages(newHistory);
    setIsChatLoading(true);

    try {
      const response = await chatWithMaterial(studySet.source_content, newHistory, userMsg);
      setChatMessages([...newHistory, { role: 'model' as const, parts: [{ text: response }] }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-bottom border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-xl">{studySet.title}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Study Mode</p>
          </div>
        </div>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {[
            { id: 'notes', icon: FileText, label: 'Notes' },
            { id: 'flashcards', icon: BrainCircuit, label: 'Flashcards' },
            { id: 'quiz', icon: HelpCircle, label: 'Quiz' },
            { id: 'chat', icon: MessageSquare, label: 'AI Tutor' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === tab.id ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'notes' && (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 prose prose-indigo max-w-none"
              >
                <Markdown>{studySet.notes}</Markdown>
              </motion.div>
            )}

            {activeTab === 'flashcards' && (
              <motion.div 
                key="flashcards"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div className="w-full max-w-2xl aspect-[3/2] relative perspective-1000">
                  <motion.div
                    className="w-full h-full relative preserve-3d cursor-pointer"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-12 text-center">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-6">Question</span>
                      <h3 className="text-2xl font-bold text-gray-800 leading-tight">
                        {studySet.flashcards[currentCardIndex].question}
                      </h3>
                      <p className="mt-12 text-gray-400 text-sm">Click to flip</p>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-12 text-center text-white rotate-y-180">
                      <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-6">Answer</span>
                      <p className="text-xl font-medium leading-relaxed">
                        {studySet.flashcards[currentCardIndex].answer}
                      </p>
                      <p className="mt-12 text-indigo-300 text-sm">Click to flip back</p>
                    </div>
                  </motion.div>
                </div>

                <div className="mt-12 flex items-center gap-8">
                  <Button 
                    variant="secondary" 
                    disabled={currentCardIndex === 0}
                    onClick={() => { setCurrentCardIndex(currentCardIndex - 1); setIsFlipped(false); }}
                  >
                    Previous
                  </Button>
                  <span className="font-bold text-gray-500">
                    {currentCardIndex + 1} / {studySet.flashcards.length}
                  </span>
                  <Button 
                    variant="primary"
                    disabled={currentCardIndex === studySet.flashcards.length - 1}
                    onClick={() => { setCurrentCardIndex(currentCardIndex + 1); setIsFlipped(false); }}
                  >
                    Next
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'quiz' && (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {studySet.quiz.map((q, idx) => (
                  <Card key={idx} className="p-8">
                    <h3 className="text-lg font-bold mb-6 flex gap-4">
                      <span className="text-indigo-600">Q{idx + 1}.</span>
                      {q.question}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((option) => {
                        const isSelected = quizAnswers[idx] === option;
                        const isCorrect = option === q.correctAnswer;
                        const showResult = showQuizResults;

                        return (
                          <button
                            key={option}
                            disabled={showQuizResults}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: option })}
                            className={cn(
                              "text-left p-4 rounded-xl border-2 transition-all",
                              !showResult && isSelected ? "border-indigo-600 bg-indigo-50" : "border-gray-100 hover:border-indigo-200",
                              showResult && isCorrect ? "border-green-500 bg-green-50 text-green-700" : "",
                              showResult && isSelected && !isCorrect ? "border-red-500 bg-red-50 text-red-700" : ""
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {showQuizResults && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 p-4 bg-gray-50 rounded-xl text-sm border border-gray-200"
                      >
                        <p className="font-bold text-gray-700 mb-1">Explanation:</p>
                        <p className="text-gray-600">{q.explanation}</p>
                      </motion.div>
                    )}
                  </Card>
                ))}

                <div className="flex justify-center pt-8">
                  {!showQuizResults ? (
                    <Button 
                      className="h-12 px-12 text-lg" 
                      disabled={Object.keys(quizAnswers).length < studySet.quiz.length}
                      onClick={() => setShowQuizResults(true)}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary"
                      className="h-12 px-12 text-lg"
                      onClick={() => { setQuizAnswers({}); setShowQuizResults(false); }}
                    >
                      Retake Quiz
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-[70vh] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={32} />
                      </div>
                      <h3 className="text-lg font-bold">Ask your AI Tutor</h3>
                      <p className="text-gray-500 mt-2">I've analyzed your study material. Ask me anything about it!</p>
                      <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {["Summarize the main points", "Explain the most difficult concept", "Give me an example of this"].map(q => (
                          <button 
                            key={q}
                            onClick={() => { setChatInput(q); }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-2xl",
                        msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                      )}>
                        <Markdown>{msg.parts[0].text}</Markdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-4 rounded-2xl flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <Input 
                    placeholder="Ask a question..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                    className="h-12"
                  />
                  <Button onClick={handleChat} disabled={isChatLoading || !chatInput.trim()}>
                    Send
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
