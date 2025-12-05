import React from 'react';

interface TerminalProps {
  output: string;
  assembly: string;
  machineCode: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  terminalHeight: number;
  isResizingTerminal: boolean;
  setIsResizingTerminal: (resizing: boolean) => void;
}

const Terminal: React.FC<TerminalProps> = ({
  output,
  assembly,
  machineCode,
  activeTab,
  setActiveTab,
  terminalHeight,
  isResizingTerminal,
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
          MIPS ASSEMBLY
        </button>
        <button
          onClick={() => setActiveTab("machine")}
          className={`px-4 h-full hover:bg-red-700 ${
            activeTab === "machine" ? "bg-red-900 text-yellow-300" : "text-yellow-100"
          }`}
        >
          COMPILER LOG
        </button>
      </div>

      <div className="flex-1 p-3 overflow-auto font-mono text-sm">
        {activeTab === "output" && (
          <pre className="text-yellow-300 whitespace-pre-wrap">
            {output || "> Click 'Takbo (Lex/Yacc)' to compile"}
          </pre>
        )}
        {activeTab === "assembly" && (
          <pre className="text-yellow-200 whitespace-pre-wrap">
            {assembly || "# No assembly code generated yet\n# Compile first to see MIPS assembly"}
          </pre>
        )}
        {activeTab === "machine" && (
          <pre className="text-green-300 whitespace-pre-wrap font-mono text-xs">
            {machineCode || "// Compiler log will appear here"}
          </pre>
        )}
      </div>
    </div>
  );
};

export default Terminal;