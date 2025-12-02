import { useState, useRef, useEffect } from "react";

export default function App() {
  const [code, setCode] = useState("sulat('Mabuhay, Pilipinas!')");
  const [output, setOutput] = useState("");
  const [assembly, setAssembly] = useState("");
  const [machineCode, setMachineCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("output");
  const [showIntellisense, setShowIntellisense] = useState(false);
  const [intellisensePos, setIntellisensePos] = useState({ top: 0, left: 0 });
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  type Keyword = { label: string; detail: string; desc: string; };

  const keywords: Keyword[] = [
    { label: "sulat", detail: "Print statement", desc: "sulat('message')" },
    { label: "basahin", detail: "Read input", desc: "basahin()" },
    { label: "kung", detail: "If statement", desc: "kung (condition) { }" },
    { label: "habang", detail: "While loop", desc: "habang (condition) { }" },
    { label: "para", detail: "For loop", desc: "para (i = 0; i < 10; i++) { }" },
    { label: "function", detail: "Function declaration", desc: "function name() { }" },
  ];

  const [filteredKeywords, setFilteredKeywords] = useState<Keyword[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: { key: string; preventDefault: () => void; }) => {
      if (!showIntellisense) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredKeywords.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredKeywords.length) % filteredKeywords.length);
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

  const handleCodeChange = (e: { target: { value: any; selectionStart: any; }; }) => {
    const newCode = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setCode(newCode);
    setCursorPos(cursorPosition);

    // Get current word being typed
    const textBeforeCursor = newCode.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/[\s\(\)\{\}\[\];,]/);
    const currentWord = words[words.length - 1];

    if (currentWord.length > 0) {
      const matches = keywords.filter(k => 
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

  const runCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      let result = "";
      let asm = "";
      let machine = "";
      
      if (code.includes("sulat")) {
        const match = code.match(/sulat\(['"](.+?)['"]\)/);
        result = match ? match[1] : "Mabuhay, Pilipinas!";
        
        // Generate mock assembly
        asm = `LOAD R1, #${result.length}
MOV R2, [STRING_ADDR]
CALL PRINT_FUNC
RET`;
        
        // Generate mock machine code
        machine = `0x48 0x8B 0x0D 0x00 0x00 0x00 0x00
0x48 0x8D 0x15 0x00 0x00 0x00 0x00
0xE8 0x00 0x00 0x00 0x00
0xC3`;
      }
      
      setOutput(result || "Walang output");
      setAssembly(asm);
      setMachineCode(machine);
      setIsRunning(false);
      setActiveTab("output");
    }, 300);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Top Bar - VS Code Style */}
      <header className="h-9 flex items-center justify-between px-3 bg-blue-900 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          <span className="text-sm text-yellow-200">PinoyCode Studio</span>
        </div>
        <button
          onClick={runCode}
          disabled={isRunning}
          className="bg-yellow-400 text-blue-900 px-4 py-1 rounded text-xs hover:bg-yellow-300 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isRunning ? "⏳ Tumatakbo..." : "▶ Takbo"}
        </button>
      </header>

      {/* Menu Bar */}
      <div className="h-8 flex items-center px-3 bg-blue-800 border-b border-blue-700 text-xs text-yellow-100">
        <span className="px-2 hover:bg-blue-700 cursor-pointer">File</span>
        <span className="px-2 hover:bg-blue-700 cursor-pointer">Edit</span>
        <span className="px-2 hover:bg-blue-700 cursor-pointer">View</span>
        <span className="px-2 hover:bg-blue-700 cursor-pointer">Run</span>
        <span className="px-2 hover:bg-blue-700 cursor-pointer">Help</span>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-12 bg-blue-900 border-r border-blue-700 flex flex-col items-center py-2 gap-2">
          <div className="w-10 h-10 flex items-center justify-center text-yellow-400 hover:bg-blue-800 cursor-pointer rounded">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
          </div>
          <div className="w-10 h-10 flex items-center justify-center text-yellow-300 hover:bg-blue-800 cursor-pointer rounded">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-9 flex items-center bg-blue-800 border-b border-blue-700">
            <div className="flex items-center px-3 bg-red-700 h-full border-r border-red-600 gap-2 text-sm">
              <span className="text-yellow-400">●</span>
              <span className="text-yellow-100">main.pinoy</span>
              <span className="text-yellow-300 hover:text-yellow-100 cursor-pointer">✕</span>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* Line Numbers */}
            <div className="w-14 bg-gray-900 text-gray-500 text-right pr-3 py-3 text-sm font-mono select-none overflow-hidden border-r border-gray-700">
              {Array.from({ length: code.split("\n").length }, (_, i) => (
                <div key={i} className="leading-6 hover:text-gray-300">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Editor */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              className="flex-1 p-3 text-gray-100 text-sm outline-none resize-none bg-gray-900 font-mono leading-6"
              placeholder="// Magsulat ng code dito..."
              spellCheck={false}
              style={{ caretColor: 'white' }}
            />

            {/* Intellisense Popup */}
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
                    <div className="w-5 h-5 bg-yellow-500 text-blue-900 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
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
        </div>
      </main>

      {/* Terminal Panel */}
      <div className="h-64 bg-red-900 border-t border-red-700 flex flex-col">
        {/* Terminal Tabs */}
        <div className="h-9 flex items-center bg-red-800 border-b border-red-700 text-sm">
          <button
            onClick={() => setActiveTab("output")}
            className={`px-4 h-full border-r border-red-700 hover:bg-red-700 ${
              activeTab === "output" ? "bg-red-900 text-yellow-300" : "text-yellow-100"
            }`}
          >
            OUTPUT
          </button>
          <button
            onClick={() => setActiveTab("assembly")}
            className={`px-4 h-full border-r border-red-700 hover:bg-red-700 ${
              activeTab === "assembly" ? "bg-red-900 text-yellow-300" : "text-yellow-100"
            }`}
          >
            ASSEMBLY
          </button>
          <button
            onClick={() => setActiveTab("machine")}
            className={`px-4 h-full hover:bg-red-700 ${
              activeTab === "machine" ? "bg-red-900 text-yellow-300" : "text-yellow-100"
            }`}
          >
            MACHINE CODE
          </button>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 p-3 overflow-auto font-mono text-sm">
          {activeTab === "output" && (
            <pre className="text-yellow-300">
              {output || "> Wala pang output. I-run ang code! 🚀"}
            </pre>
          )}
          {activeTab === "assembly" && (
            <pre className="text-yellow-200">
              {assembly || "; Wala pang assembly code"}
            </pre>
          )}
          {activeTab === "machine" && (
            <pre className="text-yellow-100">
              {machineCode || "// Wala pang machine code"}
            </pre>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <footer className="h-6 bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600 flex items-center justify-between px-3 text-xs font-semibold">
        <div className="flex items-center gap-3 text-white">
          <span>🇵🇭 PinoyCode</span>
          <span>Ln {code.split('\n').length}, Col {cursorPos}</span>
        </div>
        <div className="flex items-center gap-3 text-white">
          <span>UTF-8</span>
          <span>PinoyLang</span>
        </div>
      </footer>
    </div>
  );
}


