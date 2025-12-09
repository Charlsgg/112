import React from 'react';

interface TerminalProps {
  output: string;
  assembly: string;
  compilerLog: string; // Renamed from machineCode to clearly hold errors/logs
  activeTab: string;
  setActiveTab: (tab: string) => void;
  terminalHeight: number;
  isResizingTerminal: boolean;
  setIsResizingTerminal: (resizing: boolean) => void;
}

const Terminal: React.FC<TerminalProps> = ({
  output,
  assembly,
  compilerLog, // Updated prop name
  activeTab,
  setActiveTab,
  terminalHeight,
  // isResizingTerminal,
  setIsResizingTerminal
}) => {
  return (
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
      />

      {/* Tabs Header */}
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
          Edumips64 Assembly
        </button>
        <button
          onClick={() => setActiveTab("compilerLog")}
          className={`px-4 h-full hover:bg-red-700 ${
            activeTab === "compilerLog" ? "bg-red-900 text-yellow-300" : "text-yellow-100"
          }`}
        >
          COMPILER LOG
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-3 overflow-auto font-mono text-sm">
        
        {/* OUTPUT TAB */}
        {activeTab === "output" && (
          <pre className="text-yellow-300 whitespace-pre-wrap">
            {output || "> Ready to compile..."}
          </pre>
        )}
        
        {/* ASSEMBLY TAB */}
        {activeTab === "assembly" && (
          <pre className="text-yellow-200 whitespace-pre-wrap">
            {assembly || "# No assembly code generated yet\n# Compile first to see MIPS assembly"}
          </pre>
        )}
        
        {/* COMPILER LOG TAB (Updated for Errors) */}
        {activeTab === "compilerLog" && (
          <pre className={`whitespace-pre-wrap font-mono text-xs ${
            // If the log contains "Error", show Red. Otherwise show Green.
            compilerLog && (compilerLog.includes("Error") || compilerLog.includes("Failed")) 
              ? "text-red-300 font-bold" 
              : "text-green-300"
          }`}>
            {compilerLog || "// Compiler logs and system status will appear here"}
          </pre>
        )}
      </div>
    </div>
  );
};

export default Terminal;