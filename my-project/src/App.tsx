import { useState, useRef, useEffect } from "react";
import CodeEditor from "./components/Editor/CodeEditor";
import Terminal from "./components/Terminal/Terminal";
import Sidebar from "./components/Sidebar/Sidebar";
import MipsModal from "./components/Modals/MipsModal";
import HelpModal from "./components/Modals/HelpModal";
import { DEFAULT_FILES } from "./utils/constants";
import type { Keyword, FileItem, SidebarView } from "./types/index";

export default function App() {
  // --- STATE: Files & Code ---
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);
  // Initialize code with the active file's content
  const [code, setCode] = useState(DEFAULT_FILES.find(f => f.active)?.content || "");
  
  // --- STATE: Compiler & Output ---
  const [output, setOutput] = useState("");
  const [assembly, setAssembly] = useState("");
  const [compilerLog, setCompilerLog] = useState(""); 
  const [activeTab, setActiveTab] = useState("output");

  const [isRunning, setIsRunning] = useState(false);
  const [showMips, setShowMips] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // --- STATE: Intellisense (Managed here to pass to Editor) ---
  const [showIntellisense, setShowIntellisense] = useState(false);
  const [intellisensePos, setIntellisensePos] = useState({ top: 0, left: 0 });
  const [filteredKeywords, setFilteredKeywords] = useState<Keyword[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // --- STATE: Layout ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarView] = useState<SidebarView>("files");
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [terminalHeight, setTerminalHeight] = useState(256);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null!);

  // --- Handlers: Compiler (Defined early for useEffect) ---
  const runCode = async () => {
    setIsRunning(true);
    setCompilerLog("Compiling...");
    setOutput("");
    setAssembly("");

    try {
      const res = await fetch("http://localhost:3001/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success) {
        setOutput(data.output);
        setAssembly(data.assembly);
        setCompilerLog("Compilation Successful.");
        setActiveTab("output");
      } else {
        setOutput("Build Failed. Check Compiler Log.");
        setCompilerLog(data.error); 
        setActiveTab("compilerLog");
      }
    } catch (err: any) {
      setCompilerLog("❌ Error connecting to compiler server: " + err.message);
      setActiveTab("compilerLog");
    } finally {
      setIsRunning(false);
    }
  };

  const saveFile = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const activeFile = files.find(f => f.active);
    link.download = activeFile?.name || "main.wxd";
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- GLOBAL SHORTCUTS HANDLER ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Run Code (F5 or Ctrl+Enter)
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key === "Enter")) {
        e.preventDefault(); // Stop F5 from refreshing the page
        if (!isRunning) runCode();
      }

      // 2. Save File (Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // Stop browser "Save Page"
        saveFile();
      }

      // 3. Toggle Sidebar (Ctrl+B)
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }

      // 4. New File (Alt+N)
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [code, isRunning, files]); // Dependencies ensuring latest state

  // --- Effects: Resizing ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingTerminal) {
        const newHeight = window.innerHeight - e.clientY;
        setTerminalHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 200)));
      }
      if (isResizingSidebar) {
        const newWidth = e.clientX; 
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

  // --- Handlers: File System ---
  const handleFileClick = (fileName: string) => {
    const updatedFiles = files.map(f => f.active ? { ...f, active: false, content: code } : f);
    const targetFile = updatedFiles.find(f => f.name === fileName);
    if (targetFile) {
        targetFile.active = true;
        targetFile.open = true;
        setFiles(updatedFiles);
        setCode(targetFile.content); 
    }
  };

  const handleMoveFile = (dragIndex: number, hoverIndex: number) => {
    const updatedFiles = [...files];
    const activeFileIndex = updatedFiles.findIndex(f => f.active);
    if (activeFileIndex !== -1) {
        updatedFiles[activeFileIndex] = { ...updatedFiles[activeFileIndex], content: code };
    }
    const [draggedItem] = updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(hoverIndex, 0, draggedItem);
    setFiles(updatedFiles);
  };

  const handleRemoveFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const removed = files.filter(f => f.name !== fileName);
    setFiles(removed);
    
    if (files.find(f => f.name === fileName)?.active && removed.length > 0) {
      removed[0].active = true;
      setFiles([...removed]);
      setCode(removed[0].content);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    const newFileItems: FileItem[] = [];
    for (const file of droppedFiles) {
      const content = await file.text();
      newFileItems.push({ name: file.name, content, active: false, open: true });
    }

    setFiles(prev => {
        const combined = [...prev];
        newFileItems.forEach(nf => {
            if(!combined.find(cf => cf.name === nf.name)) combined.push(nf);
        });
        return combined;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    Array.from(selectedFiles).forEach(async file => {
      const content = await file.text();
      const newFile: FileItem = { name: file.name, content, active: false, open: true };
      setFiles(prev => {
        const exists = prev.find(f => f.name === file.name);
        if (exists) return prev.map(f => f.name === file.name ? { ...f, content, open: true } : f);
        return [...prev, newFile];
      });
    });
  };

  const handleOpenMips = async () => {
    if (assembly) {
        setShowMips(true);
        return;
    }
    await runCode();
    setShowMips(true);
  };

  const testCompilerServer = () => {
    fetch('http://localhost:3001/test')
      .then(res => {
        if (!res.ok) throw new Error('Server not responding');
        return res.json();
      })
      .then(data => alert(`✅ Compiler server is running!\nMessage: ${data.message}`))
      .catch(() => alert('❌ Compiler server not found.\nStart it with: node server.js'));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept=".wxd,.txt,.md,.js" />

      {isDragging && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-yellow-400 text-blue-900 px-8 py-6 rounded-lg text-2xl font-bold">
            📁 Drop files here to add to project
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-9 flex items-center justify-between px-3 bg-blue-900 border-b border-blue-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          <span className="text-sm text-yellow-200">Wikaxd IDE</span>
        </div>

        <div className="flex gap-2">
          <button onClick={runCode} disabled={isRunning} className="bg-yellow-400 text-blue-900 px-4 py-1 rounded text-xs hover:bg-yellow-300 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            {isRunning ? "⏳ Compiling..." : "▶ Takbo (Run) (F5)"}
          </button>
          <button onClick={saveFile} className="bg-green-400 text-blue-900 px-4 py-1 rounded text-xs hover:bg-green-300 font-bold transition-colors flex items-center gap-1">
            💾 Save
          </button>
          <button onClick={testCompilerServer} className="bg-purple-400 text-blue-900 px-3 py-1 rounded text-xs hover:bg-purple-300 font-bold flex items-center gap-1" title="Test compiler server">
            🔌 Test
          </button>
        </div>
      </header>

      {/* Modals */}
      <MipsModal showMips={showMips} setShowMips={setShowMips} assembly={assembly} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Menu Bar */}
      <div className="h-8 flex items-center px-3 bg-blue-800 border-b border-blue-700 text-xs text-yellow-100 shrink-0">
        <span className="px-2 hover:bg-blue-700 cursor-pointer select-none" onClick={() => setShowHelp(true)}>Help</span>
        <button onClick={handleOpenMips} disabled={isRunning} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 ml-2 text-white">
          🚀 Open Assembly Runner
        </button>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        
        {/* Sidebar */}
        {/* ✅ CORRECT: Always render Sidebar, let Sidebar decide how to look */}
<Sidebar
  sidebarOpen={sidebarOpen} // Ensure this prop is passed!
  setSidebarOpen={setSidebarOpen}
  sidebarView={sidebarView}
  files={files}
  handleFileClick={handleFileClick}
  handleRemoveFile={handleRemoveFile}
  handleMoveFile={handleMoveFile}
  sidebarWidth={sidebarWidth}
  isResizingSidebar={isResizingSidebar}
  setIsResizingSidebar={setIsResizingSidebar}
  fileInputRef={fileInputRef}
/>

        {/* Sidebar Resizer */}
        {sidebarOpen && (
            <div 
                className="w-1 bg-gray-800 hover:bg-yellow-400 cursor-col-resize transition-colors z-10"
                onMouseDown={() => setIsResizingSidebar(true)}
            />
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-900 relative">
          <CodeEditor
            code={code}
            setCode={setCode}
            setFiles={setFiles} 
            showIntellisense={showIntellisense}
            setShowIntellisense={setShowIntellisense}
            intellisensePos={intellisensePos}
            setIntellisensePos={setIntellisensePos}
            filteredKeywords={filteredKeywords}
            setFilteredKeywords={setFilteredKeywords}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        </div>
      </main>

      {/* Terminal Resizer */}
      <div 
        className="h-1 bg-gray-800 hover:bg-yellow-400 cursor-row-resize transition-colors z-10"
        onMouseDown={() => setIsResizingTerminal(true)}
      />

      {/* Terminal */}
      <div style={{ height: terminalHeight }} className="shrink-0 bg-black">
        <Terminal
            output={output}
            assembly={assembly}
            compilerLog={compilerLog}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            terminalHeight={terminalHeight}
            isResizingTerminal={isResizingTerminal}
            setIsResizingTerminal={setIsResizingTerminal}
        />
      </div>

      {/* Status Bar */}
      <footer className="h-6 bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600 flex items-center justify-between px-3 text-xs font-semibold shrink-0">
        <div className="flex items-center gap-3 text-white">
          <span>🇵🇭 Wikaxd Compiler</span>
          <span>Total Lines: {code.split("\n").length}</span>
          {isRunning && <span className="animate-pulse">🔧 Lex/Yacc Compiling...</span>}
        </div>
        <div className="flex items-center gap-3 text-white">
          <span>Compiler: Lex/Yacc</span>
          {compilerLog.includes("Successful") && <span className="text-green-300">✓ Compiler Connected</span>}
        </div>
      </footer>
    </div>
  );
}