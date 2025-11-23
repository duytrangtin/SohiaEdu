import React, { useState } from 'react';
import { GameStatus, Topic, UserState } from './types';
import Intro from './components/Intro';
import Game from './components/Game';
import Result from './components/Result';
import Button from './components/Button';
import { Code, GitBranch, Repeat, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.INTRO);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [userState, setUserState] = useState<UserState>({
    studentCode: '',
    score: 0,
    totalQuestions: 10, // Updated to 10 questions per session
    currentQuestionIndex: 0,
    history: []
  });

  const handleStart = (code: string) => {
    setUserState(prev => ({ ...prev, studentCode: code }));
    setStatus(GameStatus.TOPIC_SELECTION);
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setStatus(GameStatus.PLAYING);
  };

  const handleScoreUpdate = (isCorrect: boolean) => {
    setUserState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      history: [...prev.history, { 
        questionId: `q-${prev.currentQuestionIndex}`, 
        isCorrect 
      }]
    }));
  };

  const handleFinish = () => {
    setStatus(GameStatus.FINISHED);
  };

  const handleRestart = () => {
    setUserState({
      studentCode: userState.studentCode, // Keep student code
      score: 0,
      totalQuestions: 10, // Reset to 10
      currentQuestionIndex: 0,
      history: []
    });
    setStatus(GameStatus.TOPIC_SELECTION);
    setSelectedTopic(null);
  };

  // Topic Selection Screen
  if (status === GameStatus.TOPIC_SELECTION) {
    const topics = [
      { id: Topic.SEQUENTIAL, icon: <Code />, desc: "Cấu trúc tuần tự cơ bản" },
      { id: Topic.BRANCHING, icon: <GitBranch />, desc: "Câu lệnh if-else" },
      { id: Topic.LOOP, icon: <Repeat />, desc: "Vòng lặp for và while" },
      { id: Topic.COMBINED, icon: <Layers />, desc: "Bài tập tổng hợp" },
    ];

    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
        <h2 className="text-2xl font-black mb-6 text-center">Chọn chủ đề ôn tập</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTopicSelect(t.id)}
              className="flex flex-col items-center p-6 bg-white border-2 border-black rounded-xl shadow-hard hover:bg-gray-100 transition-all active:translate-y-1 active:shadow-none"
            >
              <div className="mb-3 p-3 bg-black text-white rounded-full">
                {t.icon}
              </div>
              <h3 className="font-bold text-lg">{t.id}</h3>
              <p className="text-sm text-gray-500">{t.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-12">
           <Button variant="outline" onClick={() => setStatus(GameStatus.INTRO)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-yellow-200 selection:text-black">
      {status === GameStatus.INTRO && <Intro onStart={handleStart} />}
      
      {status === GameStatus.PLAYING && selectedTopic && (
        <div className="p-4 sm:p-8">
           <Game 
             topic={selectedTopic} 
             userState={userState} 
             updateScore={handleScoreUpdate}
             onFinish={handleFinish}
           />
        </div>
      )}

      {status === GameStatus.FINISHED && (
        <Result userState={userState} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default App;