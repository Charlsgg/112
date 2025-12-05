import { useRef, useEffect } from "react";
import { KEYWORDS } from "../../utils/constants";
import type { Keyword, FileItem } from "../../types";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  files: FileItem[];
  setFiles: (files: FileItem[]) => void;
  showIntellisense: boolean;
  setShowIntellisense: (show: boolean) => void;
  intellisensePos: { top: number; left: number };
  setIntellisensePos: (pos: { top: number; left: number }) => void;
  cursorPos: number;
  setCursorPos: (pos: number) => void;
  filteredKeywords: Keyword[];
  setFilteredKeywords: (keywords: Keyword[]) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

export default function CodeEditor({
  code,
  setCode,
  files,
  setFiles,
  showIntellisense,
  setShowIntellisense,
  intellisensePos,
  setIntellisensePos,
  setCursorPos,
  filteredKeywords,
  setFilteredKeywords,
  selectedIndex,
  setSelectedIndex
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showIntellisense) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((selectedIndex + 1) % filteredKeywords.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((selectedIndex - 1 + filteredKeywords.length) % filteredKeywords.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(filteredKeywords[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowIntellisense(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntellisense, filteredKeywords, selectedIndex]);

  const insertSuggestion = (keyword: Keyword) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = code.slice(0, cursorPosition);
    const textAfterCursor = code.slice(cursorPosition);
    
    const words = textBeforeCursor.split(/[\s\(\)\{\}\[\];,]/);
    const currentWord = words[words.length - 1];
    const textBeforeWord = textBeforeCursor.slice(0, -currentWord.length);
    
    const newCode = textBeforeWord + keyword.label + textAfterCursor;
    setCode(newCode);
    setShowIntellisense(false);
    
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(
          textBeforeWord.length + keyword.label.length,
          textBeforeWord.length + keyword.label.length
        );
      }
    }, 0);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setCode(newCode);
    setCursorPos(cursorPosition);

    // Update active file content
    setFiles(files.map(f => f.active ? { ...f, content: newCode } : f));

    const textBeforeCursor = newCode.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/[\s\(\)\{\}\[\];,]/);
    const currentWord = words[words.length - 1];
    if (currentWord.length > 0) {
      const matches = KEYWORDS.filter(k => 
        k.label.toLowerCase().startsWith(currentWord.toLowerCase())
      );
      
      if (matches.length > 0) {
        setFilteredKeywords(matches);
        setSelectedIndex(0);
        setShowIntellisense(true);
        
        const lineHeight = 24;
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const charWidth = 8.4;
        const lastLineLength = lines[lines.length - 1].length;
        
        setIntellisensePos({
          top: currentLine * lineHeight + 60,
          left: 56 + (lastLineLength * charWidth)
        });
      } else {
        setShowIntellisense(false);
      }
    } else {
      setShowIntellisense(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div className="w-14 bg-gray-900 text-gray-500 text-right pr-3 py-3 text-sm font-mono select-none overflow-hidden border-r border-gray-700">
        {Array.from({ length: code.split("\n").length }, (_, i) => (
          <div key={i} className="leading-6 hover:text-gray-300">
            {i + 1}
          </div>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleCodeChange}
        className="flex-1 p-3 text-gray-100 text-sm outline-none resize-none bg-gray-900 font-mono leading-6"
        placeholder="// Magsulat ng code dito..."
        spellCheck={false}
        style={{ caretColor: 'white' }}
      />

      {showIntellisense && (
        <div 
          className="absolute bg-blue-900 border border-yellow-400 rounded shadow-2xl z-50 overflow-hidden"
          style={{ 
            top: `${intellisensePos.top}px`, 
            left: `${intellisensePos.left}px`,
            minWidth: '300px'
          }}
        >
          {filteredKeywords.map((kw, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 cursor-pointer flex items-start gap-2 ${
                idx === selectedIndex ? 'bg-red-600 text-yellow-100' : 'hover:bg-blue-800 text-yellow-200'
              }`}
              onClick={() => insertSuggestion(kw)}
            >
              <div className="w-5 h-5 bg-yellow-500 text-blue-900 rounded flex items-center justify-center text-xs font-bold shrink-0">
                K
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{kw.label}</div>
                <div className="text-xs text-yellow-300 truncate">{kw.desc}</div>
              </div>
              <div className="text-xs text-yellow-400">{kw.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}