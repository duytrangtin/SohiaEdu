import React, { useState } from 'react';
import { Terminal, Play } from 'lucide-react';
import Button from './Button';

interface IntroProps {
  onStart: (studentCode: string) => void;
}

const Intro: React.FC<IntroProps> = ({ onStart }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 3) {
      setError('Mã số cần ít nhất 3 ký tự nha!');
      return;
    }
    onStart(code);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-md mx-auto text-center">
      <div className="mb-8 p-6 bg-white border-2 border-black rounded-full shadow-hard animate-pop">
        <Terminal size={64} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-4xl font-black mb-2 tracking-tight">PyMaster</h1>
      <p className="text-gray-600 mb-8 text-lg">
        Chào bạn! Sẵn sàng chinh phục Python chưa?
        <br/>
        <span className="text-sm text-gray-500">Đăng nhập để bắt đầu hành trình nhé!</span>
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="text-left">
          <label className="block font-bold text-sm mb-1 ml-1">Mã học sinh</label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            placeholder="Nhập mã số của bạn..."
            className="w-full p-4 text-lg border-2 border-black rounded-xl outline-none focus:shadow-hard transition-shadow"
          />
          {error && <p className="text-red-500 text-sm mt-1 ml-1 font-medium">{error}</p>}
        </div>

        <Button type="submit" fullWidth className="mt-4 flex items-center justify-center gap-2">
          <Play size={20} /> Bắt đầu ngay
        </Button>
      </form>
      
      <div className="mt-12 text-xs text-gray-400">
        Thiết kế cho học sinh THPT Việt Nam ❤️
      </div>
    </div>
  );
};

export default Intro;