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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarView, setSidebarView] = useState<"files" | "debug">("files");
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([
    { name: "main.pinoy", content: "sulat('Mabuhay, Pilipinas!')", active: true, open: true },
    { name: "utils.pinoy", content: "// Utility functions", active: false, open: false },
    { name: "helpers.pinoy", content: "// Helper functions", active: false, open: false },
    { name: "README.md", content: "# PinoyCode Project", active: false, open: false }
  ]);
  
  const [terminalHeight, setTerminalHeight] = useState(256);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveFile = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const activeFile = files.find(f => f.active);
    link.download = activeFile?.name || "main.pinoy";
    link.click();
    URL.revokeObjectURL(url);
  };

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
    const handleKeyDown = (e: KeyboardEvent) => {
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingTerminal) {
        e.preventDefault();
        const newHeight = window.innerHeight - e.clientY;
        setTerminalHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 200)));
      }
      if (isResizingSidebar) {
        e.preventDefault();
        const newWidth = e.clientX - 48; // 48 is the width of the icon bar
        setSidebarWidth(Math.max(200, Math.min(newWidth, 600)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingTerminal(false);
      setIsResizingSidebar(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizingTerminal) {
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    
    if (isResizingSidebar) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingTerminal, isResizingSidebar]);

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
        
        asm = `LOAD R1, #${result.length}
MOV R2, [STRING_ADDR]
CALL PRINT_FUNC
RET`;
        
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    for (const file of droppedFiles) {
      const content = await file.text();
      const newFile = {
        name: file.name,
        content: content,
        active: false,
        open: false
      };
      
      setFiles(prev => {
        const exists = prev.find(f => f.name === file.name);
        if (exists) {
          return prev.map(f => f.name === file.name ? { ...f, content } : f);
        }
        return [...prev, newFile];
      });
    }
  };

  const handleFileClick = (fileName: string) => {
    const file = files.find(f => f.name === fileName);
    if (file) {
      setFiles(prevFiles => prevFiles.map(f => ({
        ...f,
        active: f.name === fileName,
        open: f.name === fileName ? true : f.open
      })));
      setCode(file.content);
    }
  };

  const handleCloseTab = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const openFiles = files.filter(f => f.open);
    
    // Don't allow closing the last open file
    if (openFiles.length === 0) {
      return;
    }

    const fileIndex = files.findIndex(f => f.name === fileName);
    const wasActive = files[fileIndex].active;
    
    // Close the file
    const newFiles = files.map(f => 
      f.name === fileName ? { ...f, open: false, active: false } : f
    );
    
    // If we closed the active file, activate another open one
    if (wasActive) {
      const openFilesAfterClose = newFiles.filter(f => f.open);
      if (openFilesAfterClose.length > 0) {
        const nextFileIndex = openFilesAfterClose.findIndex(f => files.indexOf(f) > fileIndex);
        const nextFile = nextFileIndex >= 0 
          ? openFilesAfterClose[nextFileIndex] 
          : openFilesAfterClose[openFilesAfterClose.length - 1];
        
        newFiles.forEach(f => {
          if (f.name === nextFile.name) {
            f.active = true;
          }
        });
        setCode(nextFile.content);
      }
    }
    
    setFiles(newFiles);
  };

  const handleRemoveFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't allow removing the last file
    if (files.length === 1) {
      return;
    }

    const fileIndex = files.findIndex(f => f.name === fileName);
    const wasActive = files[fileIndex].active;
    
    // Remove the file
    const newFiles = files.filter(f => f.name !== fileName);
    
    // If we removed the active file, activate another one
    if (wasActive && newFiles.length > 0) {
      const openFiles = newFiles.filter(f => f.open);
      if (openFiles.length > 0) {
        openFiles[0].active = true;
        setCode(openFiles[0].content);
      } else {
        newFiles[0].active = true;
        newFiles[0].open = true;
        setCode(newFiles[0].content);
      }
    }
    
    setFiles(newFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(async (file) => {
      const content = await file.text();
      const newFile = {
        name: file.name,
        content: content,
        active: false,
        open: false
      };
      
      setFiles(prev => {
        const exists = prev.find(f => f.name === file.name);
        if (exists) {
          return prev.map(f => f.name === file.name ? { ...f, content } : f);
        }
        return [...prev, newFile];
      });
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".pinoy,.txt,.md,.js,.py"
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-yellow-400 text-blue-900 px-8 py-6 rounded-lg text-2xl font-bold">
            📁 Drop files here to add to project
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-9 flex items-center justify-between px-3 bg-blue-900 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          <span className="text-sm text-yellow-200">PinoyCode Studio</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runCode}
            disabled={isRunning}
            className="bg-yellow-400 text-blue-900 px-4 py-1 rounded text-xs hover:bg-yellow-300 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isRunning ? "⏳ Tumatakbo..." : "▶ Takbo"}
          </button>

          <button
            onClick={saveFile}
            className="bg-green-400 text-blue-900 px-4 py-1 rounded text-xs hover:bg-green-300 font-bold transition-colors flex items-center gap-1"
          >
            💾 Save File
          </button>
        </div>
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
      <main 
        className="flex flex-1 overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Sidebar */}
        <div className="w-12 bg-blue-900 border-r border-blue-700 flex flex-col items-center py-2 gap-2">
          <div 
            onClick={() => {
              setSidebarView("files");
              setSidebarOpen(true);
            }}
            className={`w-10 h-10 flex items-center justify-center hover:bg-blue-800 cursor-pointer rounded ${
              sidebarOpen && sidebarView === "files" ? "bg-blue-800 text-yellow-300" : "text-yellow-400"
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
          </div>
          <div 
            onClick={() => {
              setSidebarView("debug");
              setSidebarOpen(true);
            }}
            className={`w-10 h-10 flex items-center justify-center hover:bg-blue-800 cursor-pointer rounded ${
              sidebarOpen && sidebarView === "debug" ? "bg-blue-800 text-yellow-300" : "text-yellow-300"
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd"/>
              <path fillRule="evenodd" d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>

        {/* Sidebar Panel */}
        {sidebarOpen && (
          <div 
            className="bg-gray-900 border-r border-blue-700 flex flex-col relative"
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className="h-9 flex items-center justify-between px-3 bg-blue-800 border-b border-blue-700">
              <span className="text-xs text-yellow-300 font-semibold uppercase">
                {sidebarView === "files" ? "Explorer" : "Debug"}
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-yellow-300 hover:text-yellow-100 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {sidebarView === "files" && (
                <div className="p-2">
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-1 text-yellow-300 text-sm font-semibold mb-2 px-1">
                      <div className="flex items-center gap-1">
                        <span>📁</span>
                        <span>PINOYCODE PROJECT</span>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-yellow-400 hover:text-yellow-200 text-lg"
                        title="Add file"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="ml-4">
                      {files.map((file) => (
                        <div
                          key={file.name}
                          onClick={() => handleFileClick(file.name)}
                          className={`flex items-center justify-between gap-2 px-2 py-1 hover:bg-blue-900 cursor-pointer rounded text-sm group ${
                            file.active ? "bg-blue-900 text-yellow-100" : "text-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {file.active ? (
                              <span className="text-red-400 shrink-0">●</span>
                            ) : (
                              <span className="shrink-0">📄</span>
                            )}
                            <span className="truncate">{file.name}</span>
                          </div>
                          {files.length > 1 && (
                            <button
                              onClick={(e) => handleRemoveFile(file.name, e)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity shrink-0"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 px-2 py-2 bg-blue-900 bg-opacity-30 rounded text-xs text-yellow-200 border border-blue-800">
                      <div className="font-semibold mb-1">💡 Tip:</div>
                      <div>Drag & drop files here to add them to your project</div>
                    </div>
                  </div>
                </div>
              )}

              {sidebarView === "debug" && (
                <div className="p-3 text-sm text-yellow-200">
                  <div className="mb-3">
                    <div className="text-yellow-300 font-semibold mb-2">Variables</div>
                    <div className="ml-2 text-gray-400 text-xs">No variables in scope</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-yellow-300 font-semibold mb-2">Breakpoints</div>
                    <div className="ml-2 text-gray-400 text-xs">No breakpoints set</div>
                  </div>
                  <div>
                    <div className="text-yellow-300 font-semibold mb-2">Call Stack</div>
                    <div className="ml-2 text-gray-400 text-xs">Not running</div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar resize handle */}
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-yellow-400 hover:bg-opacity-50 transition-colors z-10"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingSidebar(true);
              }}
            >
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="h-9 flex items-center bg-blue-800 border-b border-blue-700 overflow-x-auto">
            {files.filter(f => f.open).map(file => (
              <div 
                key={file.name} 
                onClick={() => handleFileClick(file.name)}
                className={`flex items-center px-3 h-full border-r gap-2 text-sm cursor-pointer shrink-0 ${
                  file.active 
                    ? "bg-red-700 border-red-600 text-yellow-100" 
                    : "bg-blue-700 border-blue-600 text-gray-300 hover:bg-blue-600"
                }`}
              >
                <span className={file.active ? "text-yellow-400" : "text-gray-400"}>●</span>
                <span>{file.name}</span>
                <button
                  onClick={(e) => handleCloseTab(file.name, e)}
                  className={`hover:bg-opacity-20 hover:bg-white rounded px-1 ${
                    file.active ? "text-yellow-300 hover:text-yellow-100" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

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
        </div>
      </main>

      {/* Terminal Panel */}
      <div 
        className="bg-red-900 border-t border-red-700 flex flex-col relative"
        style={{ height: `${terminalHeight}px` }}
      >
        {/* Terminal resize handle */}
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-row-resize hover:bg-yellow-400 hover:bg-opacity-50 transition-colors z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingTerminal(true);
          }}
        >
        </div>

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