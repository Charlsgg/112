import { useState, useRef, useEffect } from "react";
import CodeEditor from "./components/Editor/CodeEditor";
import Terminal from "./components/Terminal/Terminal";
import Sidebar from "./components/Sidebar/Sidebar";
import MipsModal from "./components/Modals/MipsModal";
import HelpModal from "./components/Modals/HelpModal"; // <--- IMPORT ADDED
import { DEFAULT_FILES, KEYWORDS } from "./utils/constants";
import type { Keyword, FileItem, SidebarView, CompilerResponse } from "./types/index";

export default function App() {
  const [code, setCode] = useState("numero c = 10+10*2 \nnumero b = 2*10+10 \nsulat g = \"hello\" \nilimbag \"%d\", c \nilimbag \"%s\", g \nilimbag \"%s\", g \nilimbag \"%s\",g \nilimbag \"Number: %d\", c \nilimbag \"%s\", g \ng = \"yoooo\" \nilimbag \"%s\", g \nc = c + c \nc = c - c \nc = c * c + 14 \nc = c * c + c ");
  const [output, setOutput] = useState("");
  const [assembly, setAssembly] = useState("");
  const [machineCode, setMachineCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showMips, setShowMips] = useState(false);
  const [showHelp, setShowHelp] = useState(false); // <--- STATE ADDED
  const [activeTab, setActiveTab] = useState("output");

  // Intellisense
  const [showIntellisense, setShowIntellisense] = useState(false);
  const [intellisensePos, setIntellisensePos] = useState({ top: 0, left: 0 });
  const [cursorPos, setCursorPos] = useState(0);
  const [filteredKeywords, setFilteredKeywords] = useState<Keyword[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sidebar & files
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarView, setSidebarView] = useState<SidebarView>("files");
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  // Terminal resizing
  const [terminalHeight, setTerminalHeight] = useState(256);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);

  // --- Effects ---
  // Handle resizing of terminal & sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingTerminal) {
        const newHeight = window.innerHeight - e.clientY;
        setTerminalHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 200)));
      }
      if (isResizingSidebar) {
        const newWidth = e.clientX - 48;
        setSidebarWidth(Math.max(200, Math.min(newWidth, 600)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingTerminal(false);
      setIsResizingSidebar(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizingTerminal || isResizingSidebar) {
      document.body.style.cursor = isResizingTerminal ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizingTerminal, isResizingSidebar]);

  // --- File & Editor Handlers ---
  const handleFileClick = (fileName: string) => {
    const file = files.find(f => f.name === fileName);
    if (!file) return;
    setFiles(prev => prev.map(f => ({ ...f, active: f.name === fileName, open: f.name === fileName ? true : f.open })));
    setCode(file.content);
  };

  const handleCloseTab = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const file = files.find(f => f.name === fileName);
    if (!file) return;

    const newFiles = files.map(f => f.name === fileName ? { ...f, open: false, active: false } : f);
    if (file.active) {
      const nextOpen = newFiles.find(f => f.open);
      if (nextOpen) {
        setFiles(newFiles.map(f => ({ ...f, active: f.name === nextOpen.name })));
        setCode(nextOpen.content);
        return;
      }
    }
    setFiles(newFiles);
  };

  const handleRemoveFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const removed = files.filter(f => f.name !== fileName);
    setFiles(removed);
    if (files.find(f => f.name === fileName)?.active && removed.length > 0) {
      setFiles(prev => prev.map((f, i) => i === 0 ? { ...f, active: true } : f));
      setCode(removed[0].content);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      const content = await file.text();
      const newFile: FileItem = { name: file.name, content, active: false, open: false };
      setFiles(prev => {
        const exists = prev.find(f => f.name === file.name);
        if (exists) return prev.map(f => f.name === file.name ? { ...f, content } : f);
        return [...prev, newFile];
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    Array.from(selectedFiles).forEach(async file => {
      const content = await file.text();
      const newFile: FileItem = { name: file.name, content, active: false, open: false };
      setFiles(prev => {
        const exists = prev.find(f => f.name === file.name);
        if (exists) return prev.map(f => f.name === file.name ? { ...f, content } : f);
        return [...prev, newFile];
      });
    });
  };

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

  // --- Compiler & MIPS ---
  const runCode = async () => {
    setIsRunning(true);
    setOutput("⏳ Compiling...");
    try {
      const res = await fetch("http://localhost:3001/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: CompilerResponse = await res.json();
      setOutput(data.output || data.error || "");
      setAssembly(data.assembly || "");
      setMachineCode(data.machineCode || "");
      setActiveTab("output");
    } catch (err: any) {
      setOutput("❌ Error connecting to compiler server: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Handler to compile and immediately open MIPS runner
  const handleOpenMips = async () => {
    setIsRunning(true);
    setActiveTab("output");
    setOutput("⏳ Compiling for Assembly Runner...");

    try {
      const res = await fetch("http://localhost:3001/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: CompilerResponse = await res.json();

      setOutput(data.output || data.error || "");
      setAssembly(data.assembly || "");
      setMachineCode(data.machineCode || "");

      if (data.assembly) {
        setShowMips(true);
      } else {
        alert("Compilation failed. Fix errors before running Assembly.");
      }
    } catch (err: any) {
      setOutput("❌ Error connecting to compiler server: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const testCompilerServer = () => {
    fetch('http://localhost:3001/health')
      .then(res => {
        if (!res.ok) throw new Error('Server not responding');
        return res.json();
      })
      .then(data => alert(`✅ Compiler server is running!\nStatus: ${data.status}\nTimestamp: ${new Date(data.timestamp).toLocaleString()}`))
      .catch(() => alert('❌ Compiler server not found.\nStart it with:\ncd backend\nnode server.js'));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pinoy,.txt,.md,.js,.py" />

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
          <span className="text-sm text-yellow-200">Wikaxd</span>
        </div>

        <div className="flex gap-2">
          <button onClick={runCode} disabled={isRunning} className="bg-yellow-400 text-blue-900 px-4 py-1 rounded text-xs hover:bg-yellow-300 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            {isRunning ? "⏳ Compiling..." : "▶ Takbo (Lex/Yacc)"}
          </button>
          <button onClick={saveFile} className="bg-green-400 text-blue-900 px-4 py-1 rounded text-xs hover:bg-green-300 font-bold transition-colors flex items-center gap-1">
            💾 Save File
          </button>
          <button onClick={testCompilerServer} className="bg-purple-400 text-blue-900 px-3 py-1 rounded text-xs hover:bg-purple-300 font-bold flex items-center gap-1" title="Test compiler server connection">
            🔌 Test Server
          </button>
        </div>
      </header>

      {/* MODALS RENDERED HERE */}
      <MipsModal showMips={showMips} setShowMips={setShowMips} assembly={assembly} />
      
      {/* ADDED: Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Menu Bar */}
      <div className="h-8 flex items-center px-3 bg-blue-800 border-b border-blue-700 text-xs text-yellow-100">
        {/* ADDED: onClick handler for Help */}
        <span 
          className="px-2 hover:bg-blue-700 cursor-pointer select-none"
          onClick={() => setShowHelp(true)}
        >
          Help
        </span>
        
        <button
          onClick={handleOpenMips}
          disabled={isRunning}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-wait ml-2"
        >
          🚀 Open Assembly Runner
        </button>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarView={sidebarView}
          files={files}
          handleFileClick={handleFileClick}
          handleRemoveFile={handleRemoveFile}
          sidebarWidth={sidebarWidth}
          isResizingSidebar={isResizingSidebar}
          setIsResizingSidebar={setIsResizingSidebar}
          fileInputRef={fileInputRef}
        />

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <CodeEditor
            code={code}
            setCode={setCode}
            files={files}
            setFiles={setFiles}
            showIntellisense={showIntellisense}
            setShowIntellisense={setShowIntellisense}
            intellisensePos={intellisensePos}
            setIntellisensePos={setIntellisensePos}
            cursorPos={cursorPos}
            setCursorPos={setCursorPos}
            filteredKeywords={filteredKeywords}
            setFilteredKeywords={setFilteredKeywords}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        </div>
      </main>

      {/* Terminal */}
      <Terminal
        output={output}
        assembly={assembly}
        machineCode={machineCode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        terminalHeight={terminalHeight}
        isResizingTerminal={isResizingTerminal}
        setIsResizingTerminal={setIsResizingTerminal}
      />

      {/* Status Bar */}
      <footer className="h-6 bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600 flex items-center justify-between px-3 text-xs font-semibold">
        <div className="flex items-center gap-3 text-white">
          <span>🇵🇭 PinoyCode Compiler</span>
          <span>Ln {code.split('\n').length}, Col {cursorPos}</span>
          {isRunning && <span className="animate-pulse">🔧 Lex/Yacc Compiling...</span>}
        </div>
        <div className="flex items-center gap-3 text-white">
          <span>Compiler: Lex/Yacc</span>
          <span>Target: MIPS Assembly</span>
          {machineCode && <span className="text-green-300">✓ Compiler Connected</span>}
        </div>
      </footer>
    </div>
  );
}