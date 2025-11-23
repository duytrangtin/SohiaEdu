import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Play, RefreshCw, SkipForward, LogOut, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { Topic, UserState, Question, EvaluationResult } from '../types';
import { generateQuestion, evaluateStudentCode } from '../services/geminiService';
import { playCorrectSound, playIncorrectSound } from '../services/soundService';
import Button from './Button';
import CodeEditor from './CodeEditor';

interface GameProps {
  topic: Topic;
  userState: UserState;
  updateScore: (correct: boolean) => void;
  onFinish: () => void;
}

const Game: React.FC<GameProps> = ({ topic, userState, updateScore, onFinish }) => {
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  
  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setCode('');
    const q = await generateQuestion(topic);
    setCurrentQuestion(q);
    setLoading(false);
  }, [topic]);

  useEffect(() => {
    // Only load question if we haven't finished yet
    if (userState.currentQuestionIndex < userState.totalQuestions) {
      loadQuestion();
    }
  }, [loadQuestion, userState.currentQuestionIndex, userState.totalQuestions]);

  const handleRun = async () => {
    if (!currentQuestion) return;
    
    setEvaluating(true);
    const evalResult = await evaluateStudentCode(currentQuestion, code);
    setEvaluating(false);
    setResult(evalResult);

    if (evalResult.correct) {
      playCorrectSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#ffffff', '#facc15']
      });
    } else {
      playIncorrectSound();
    }
  };

  const handleNext = () => {
    if (result) {
      // Check if this was the last question
      const isLastQuestion = userState.currentQuestionIndex + 1 >= userState.totalQuestions;
      updateScore(result.correct);
      
      if (isLastQuestion) {
        onFinish();
      }
    }
  };

  const handleSkip = () => {
    // Bỏ qua ngay lập tức, chuyển đến câu tiếp theo, tính là sai (không được điểm)
    const isLastQuestion = userState.currentQuestionIndex + 1 >= userState.totalQuestions;
    updateScore(false); // Count as incorrect/skipped
    
    if (isLastQuestion) {
      onFinish();
    }
  };

  const handleEarlyFinish = () => {
    // Calculate how many questions done so far
    const done = userState.currentQuestionIndex; 
    const confirmMsg = done === 0 
      ? "Bạn chưa làm câu nào. Bạn có chắc muốn kết thúc và lưu kết quả?"
      : `Bạn mới hoàn thành ${done} câu. Kết thúc ngay và lưu kết quả vào Google Sheet?`;

    if (window.confirm(confirmMsg)) {
      onFinish();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-xl">Đang lấy câu hỏi mới...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-28 sm:pb-20">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between bg-white p-3 rounded-xl border-2 border-black shadow-hard-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-bold uppercase">Câu hỏi</span>
            <span className="font-black text-xl">{userState.currentQuestionIndex + 1} <span className="text-gray-400 text-base">/ {userState.totalQuestions}</span></span>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-bold uppercase">Điểm</span>
            <span className="font-black text-xl text-black">{userState.score}</span>
          </div>
        </div>
        
        <button 
          onClick={handleEarlyFinish}
          className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors border border-transparent hover:border-red-200"
          title="Dừng chơi và lưu kết quả hiện tại"
        >
          <span className="text-xs font-bold">KẾT THÚC</span>
          <LogOut size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 h-2 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
        <div 
          className="h-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${((userState.currentQuestionIndex) / userState.totalQuestions) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-black rounded-xl p-6 mb-6 shadow-hard relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-black"></div>
        <div className="flex items-start gap-3">
          <BookOpen size={28} className="shrink-0 mt-1" />
          <div className="w-full">
            <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              {topic}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold leading-tight text-justify">
              {currentQuestion?.text}
            </h3>
          </div>
        </div>
        {currentQuestion?.hint && (
          <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 italic">
            💡 Gợi ý: {currentQuestion.hint}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="mb-6">
        <CodeEditor code={code} onChange={setCode} readOnly={!!result && result.correct} />
      </div>

      {/* Result Feedback */}
      {result && (
        <div className={`mb-6 p-5 rounded-xl border-2 border-black shadow-hard ${result.correct ? 'bg-green-100' : 'bg-white animate-shake'}`}>
          <div className="flex items-center gap-3 mb-2">
            {result.correct ? (
              <CheckCircle className="text-green-600 fill-green-100" size={32} />
            ) : (
              <XCircle className="text-red-600 fill-red-100" size={32} />
            )}
            <h4 className="font-black text-xl">
              {result.correct ? "TING! Chính xác! 🎉" : "OOPS! Chưa đúng rồi 😅"}
            </h4>
          </div>
          <p className="text-gray-900 font-medium mb-3 ml-11">{result.message}</p>
          
          <div className="ml-11 bg-black text-green-400 p-3 rounded-lg font-mono text-sm">
            <div className="text-xs text-gray-500 mb-1 border-b border-gray-800 pb-1">TERMINAL OUTPUT</div>
            {result.output}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-black sm:relative sm:border-0 sm:bg-transparent sm:p-0 z-50">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          
          {(!result || !result.correct) && (
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="col-span-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
                title="Bỏ qua câu này và chuyển sang câu mới"
              >
                <SkipForward size={20} />
                <span className="hidden sm:inline">Bỏ qua</span>
              </Button>

              <Button 
                onClick={handleRun} 
                disabled={evaluating} 
                fullWidth 
                className="col-span-2 flex items-center justify-center gap-2"
              >
                {evaluating ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
                {evaluating ? "Đang chạy..." : "Chạy mã (Run)"}
              </Button>
            </div>
          )}

          {result && result.correct && (
            <Button 
              onClick={handleNext} 
              fullWidth 
              variant="primary"
              className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black border-black"
            >
              Tiếp theo <ArrowRight size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;