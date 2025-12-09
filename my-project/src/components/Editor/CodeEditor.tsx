import React, { useRef } from "react";
import { KEYWORDS } from "../../utils/constants";
import type { Keyword, FileItem } from "../../types/index";

// --- SYNTAX HIGHLIGHTING ENGINE ---
const highlightSyntax = (text: string) => {
  if (!text) return <span> </span>; // Maintain height for empty lines

  // Regex matches: Comments, Strings, Chars, Numbers, Keywords, Operators
  const regex = /(\/\/.*)|(".*?")|('.*?')|(\b\d+\.\d+\b)|(\b\d+\b)|(\+\+|--|\+=|-=|\*=|\/=|[\+\-\*\/=,;()\[\]{}])|(\b(?:ilimbag|numero|sulat|letra|desimal|kung|habang|para)\b)/g;

  return text.split(regex).filter(Boolean).map((token, i) => {
    if (token.startsWith("//")) return <span key={i} className="text-gray-500 italic">{token}</span>;
    if (token.startsWith('"')) return <span key={i} className="text-green-400">{token}</span>;
    if (token.startsWith("'")) return <span key={i} className="text-yellow-300">{token}</span>;
    if (/^(ilimbag|numero|sulat|letra|desimal|kung|habang|para)$/.test(token)) return <span key={i} className="text-purple-400 font-bold">{token}</span>;
    if (/^\d+(\.\d+)?$/.test(token)) return <span key={i} className="text-orange-300">{token}</span>;
    if (/^[\+\-\*\/=,;()\[\]{}]+$/.test(token)) return <span key={i} className="text-blue-300">{token}</span>;
    return <span key={i} className="text-gray-100">{token}</span>;
  });
};

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  showIntellisense: boolean;
  setShowIntellisense: (show: boolean) => void;
  intellisensePos: { top: number; left: number };
  setIntellisensePos: (pos: { top: number; left: number }) => void;
  filteredKeywords: Keyword[];
  setFilteredKeywords: (keywords: Keyword[]) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

export default function CodeEditor({
  code,
  setCode,
  setFiles,
  showIntellisense,
  setShowIntellisense,
  intellisensePos,
  setIntellisensePos,
  filteredKeywords,
  setFilteredKeywords,
  selectedIndex,
  setSelectedIndex,
}: CodeEditorProps) {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // --- 1. Sync Scroll ---
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;

    // Sync Syntax Highlighting
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }

    // Sync Line Numbers (Vertical scroll only)
    if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
    }

    setShowIntellisense(false); 
  };

  // --- 2. Handle Text Input ---
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    setFiles(prev => prev.map(f => f.active ? { ...f, content: newCode } : f));

    // --- Intellisense Trigger Logic ---
    const cursor = e.target.selectionStart;
    const textBeforeCursor = newCode.slice(0, cursor);
    const lastWordMatch = textBeforeCursor.match(/[\w\u00C0-\u024F]+$/);

    if (lastWordMatch) {
      const currentWord = lastWordMatch[0];
      const matches = KEYWORDS.filter(k => 
        k.label.split(" ")[0].toLowerCase().startsWith(currentWord.toLowerCase())
      );

      if (matches.length > 0) {
        setFilteredKeywords(matches);
        setSelectedIndex(0);
        setShowIntellisense(true);

        const lines = textBeforeCursor.split('\n');
        const currentLineIndex = lines.length;
        const currentCharIndex = lines[lines.length - 1].length;
        
        const topOffset = (currentLineIndex * 24) - e.target.scrollTop;
        const leftOffset = (currentCharIndex * 8.5) + 40; 

        setIntellisensePos({
          top: topOffset,
          left: leftOffset
        });
      } else {
        setShowIntellisense(false);
      }
    } else {
      setShowIntellisense(false);
    }
  };

  // --- 3. Insert Suggestion ---
  const insertSuggestion = (keyword: Keyword) => {
    if (!textareaRef.current) return;
    
    const cursor = textareaRef.current.selectionStart;
    const textBefore = code.slice(0, cursor);
    const textAfter = code.slice(cursor);
    
    const match = textBefore.match(/[\w\u00C0-\u024F]+$/);
    if (match) {
      const wordStart = cursor - match[0].length;
      const insertion = keyword.label; 
      const newCode = code.slice(0, wordStart) + insertion + textAfter;
      
      setCode(newCode);
      setFiles(prev => prev.map(f => f.active ? { ...f, content: newCode } : f));
      setShowIntellisense(false);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = wordStart + insertion.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // --- Helper: Update Code & Restore Cursor ---
  const updateCode = (newVal: string, newCursorPos: number) => {
    setCode(newVal);
    setFiles(prev => prev.map(f => f.active ? { ...f, content: newVal } : f));
    
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.value = newVal; // Force update for immediate UI feel
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  // --- 4. Key Handlers (Enhanced) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // A. Intellisense Navigation
    if (showIntellisense) {
      if (e.key === "ArrowDown") { 
        e.preventDefault(); 
        setSelectedIndex((selectedIndex + 1) % filteredKeywords.length); 
        return; 
      }
      if (e.key === "ArrowUp") { 
        e.preventDefault(); 
        setSelectedIndex((selectedIndex - 1 + filteredKeywords.length) % filteredKeywords.length); 
        return; 
      }
      if (e.key === "Enter" || e.key === "Tab") { 
        e.preventDefault(); 
        insertSuggestion(filteredKeywords[selectedIndex]); 
        return; 
      }
      if (e.key === "Escape") { setShowIntellisense(false); return; }
    }

    const { selectionStart, selectionEnd, value } = e.currentTarget;

    // B. EDITOR SHORTCUTS

    // 1. Toggle Comment (Ctrl + /)
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      
      const lines = value.split("\n");
      const currentLineIndex = value.substring(0, selectionStart).split("\n").length - 1;
      const line = lines[currentLineIndex];

      if (line.trim().startsWith("//")) {
        lines[currentLineIndex] = line.replace("//", "");
      } else {
        lines[currentLineIndex] = "//" + line;
      }

      const newCode = lines.join("\n");
      updateCode(newCode, selectionStart);
      return;
    }

    // 2. Move Line Up (Alt + ArrowUp)
    if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      const lines = value.split("\n");
      const currentLineIndex = value.substring(0, selectionStart).split("\n").length - 1;

      if (currentLineIndex > 0) {
        const temp = lines[currentLineIndex];
        lines[currentLineIndex] = lines[currentLineIndex - 1];
        lines[currentLineIndex - 1] = temp;

        const newCode = lines.join("\n");
        const moveAmount = lines[currentLineIndex].length + 1;
        updateCode(newCode, selectionStart - moveAmount);
      }
      return;
    }

    // 3. Move Line Down (Alt + ArrowDown)
    if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      const lines = value.split("\n");
      const currentLineIndex = value.substring(0, selectionStart).split("\n").length - 1;

      if (currentLineIndex < lines.length - 1) {
        const temp = lines[currentLineIndex];
        lines[currentLineIndex] = lines[currentLineIndex + 1];
        lines[currentLineIndex + 1] = temp;

        const newCode = lines.join("\n");
        const moveAmount = lines[currentLineIndex].length + 1;
        updateCode(newCode, selectionStart + moveAmount);
      }
      return;
    }

    // 4. Duplicate Line (Shift + Alt + ArrowDown)
    if (e.shiftKey && e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      const lines = value.split("\n");
      const currentLineIndex = value.substring(0, selectionStart).split("\n").length - 1;

      lines.splice(currentLineIndex + 1, 0, lines[currentLineIndex]);
      
      const newCode = lines.join("\n");
      updateCode(newCode, selectionStart);
      return;
    }

    // 5. Tab Key -> Insert Spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
      updateCode(newValue, selectionStart + 2);
    }
  };

  return (
    <div className="flex flex-1 relative bg-gray-900 overflow-hidden font-mono text-sm group">
      
      {/* Line Numbers */}
      <div 
        ref={lineNumbersRef}
        className="w-10 bg-gray-900 text-gray-600 text-right pr-2 pt-2 select-none border-r border-gray-800 leading-6 font-mono z-20 overflow-hidden"
      >
        {code.split('\n').map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Editor Container */}
      <div className="relative flex-1 h-full">
        
        {/* Layer 1: Syntax Highlighting (Bottom) */}
        <pre
          ref={preRef}
          className="absolute inset-0 m-0 p-2 pointer-events-none whitespace-pre overflow-hidden leading-6 font-mono"
          aria-hidden="true"
        >
          {highlightSyntax(code)}
          <br /> 
        </pre>

        {/* Layer 2: Input (Top) */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          className="absolute inset-0 w-full h-full m-0 p-2 bg-transparent text-transparent caret-white resize-none border-none outline-none overflow-auto whitespace-pre leading-6 font-mono z-10"
        />

        {/* Intellisense Menu */}
        {showIntellisense && (
          <div 
            className="absolute bg-gray-800 border border-blue-500 rounded shadow-xl z-50 w-72 max-h-60 overflow-y-auto"
            style={{ top: intellisensePos.top + 24, left: intellisensePos.left }}
          >
            {filteredKeywords.map((kw, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 cursor-pointer border-b border-gray-700 last:border-0 ${
                  idx === selectedIndex ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur
                    insertSuggestion(kw);
                }}
              >
                <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-100">{kw.label}</span>
                    <span className="text-xs text-blue-300 italic">{kw.detail}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{kw.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}