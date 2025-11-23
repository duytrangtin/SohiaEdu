import React, { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

// Common Python keywords for high school level
const PYTHON_KEYWORDS = [
  'print', 'input', 'if', 'else', 'elif', 'for', 'while', 'range', 
  'len', 'int', 'float', 'str', 'def', 'return', 'True', 'False', 
  'and', 'or', 'not', 'in', 'import', 'math', 'random'
];

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, readOnly = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const getWordAtCursor = (text: string, cursorPosition: number) => {
    const leftPart = text.slice(0, cursorPosition);
    const match = leftPart.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
    return match ? match[1] : '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Suggestion logic
    const cursorPosition = e.target.selectionStart;
    const currentWord = getWordAtCursor(newValue, cursorPosition);
    
    if (currentWord && currentWord.length >= 1) {
      const matched = PYTHON_KEYWORDS.filter(k => 
        k.startsWith(currentWord) && k !== currentWord
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(matched);
      setActiveSuggestionIndex(0);
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    
    const cursorPosition = textareaRef.current.selectionStart;
    const currentWord = getWordAtCursor(code, cursorPosition);
    
    const newValue = 
      code.slice(0, cursorPosition - currentWord.length) + 
      suggestion + 
      code.slice(cursorPosition);
    
    onChange(newValue);
    setSuggestions([]);
    
    // Move cursor to end of inserted word
    const newCursorPos = cursorPosition - currentWord.length + suggestion.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;

    // Handle Tab: Indent or Complete Suggestion
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (suggestions.length > 0) {
        applySuggestion(suggestions[activeSuggestionIndex]);
      } else {
        // Insert 4 spaces
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newValue = code.substring(0, start) + "    " + code.substring(end);
        onChange(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          }
        }, 0);
      }
      return;
    }

    // Handle Suggestion Navigation (if exists)
    if (suggestions.length > 0) {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
         // Optional: Allow Enter/Right to accept suggestion? 
         // Let's stick to Tab for completion to avoid conflict with new line on Enter, 
         // but user might expect Enter to complete.
         // We'll allow Enter to complete IF a suggestion is explicitly highlighted
         // BUT for now, let's separate concerns: Tab completes, Enter indents.
      }
    }

    // Handle Enter: Auto-indent
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (suggestions.length > 0) {
          // If suggestions are open, maybe user meant to select?
          // For now, let's close suggestions and proceed to newline logic
          setSuggestions([]);
      }

      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      const lines = code.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Calculate indentation
      const indentMatch = currentLine.match(/^(\s*)/);
      let indentation = indentMatch ? indentMatch[1] : '';
      
      // Check for colon to increase indentation
      if (currentLine.trim().endsWith(':')) {
        indentation += '    ';
      }
      
      const newValue = code.substring(0, start) + '\n' + indentation + code.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1 + indentation.length;
        }
      }, 0);
    }
  };

  return (
    <div className="relative w-full border-2 border-black rounded-xl overflow-hidden shadow-hard-sm bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 relative z-10">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-xs text-gray-400 font-mono">main.py</span>
      </div>
      
      {/* Suggestion Bar */}
      {suggestions.length > 0 && !readOnly && (
        <div className="absolute top-10 left-0 right-0 bg-gray-800 border-b border-gray-700 z-20 flex items-center px-2 py-1 overflow-x-auto">
          <div className="text-yellow-400 mr-2 animate-pulse">
             <Sparkles size={14} />
          </div>
          <div className="flex gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={s}
                onClick={() => applySuggestion(s)}
                className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer transition-colors ${
                  idx === activeSuggestionIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {s}
                {idx === 0 && <span className="ml-1 opacity-50 text-[10px]">(Tab)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        className="w-full h-48 sm:h-64 p-4 font-mono text-sm sm:text-base bg-gray-900 text-green-400 outline-none resize-none no-scrollbar pt-4"
        placeholder="# Viết mã Python của bạn ở đây..."
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
};

export default CodeEditor;