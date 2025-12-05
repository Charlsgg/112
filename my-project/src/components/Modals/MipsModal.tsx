import React from 'react';

interface MipsModalProps {
  showMips: boolean;
  setShowMips: (show: boolean) => void;
  assembly: string;
}

const MipsModal: React.FC<MipsModalProps> = ({ showMips, setShowMips, assembly }) => {
  if (!showMips) return null;

  const copyAssemblyToClipboard = () => {
    navigator.clipboard.writeText(assembly);
    alert('MIPS Assembly code copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Title bar */}
        <div className="bg-blue-900 text-white px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">🚀 EduMIPS64 Assembly Runner</span>
            <span className="text-sm bg-yellow-500 text-blue-900 px-2 py-1 rounded font-semibold">
              Running MIPS assembly from Lex/Yacc compiler
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAssemblyToClipboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              📋 Copy Assembly
            </button>
            <button
              onClick={() => setShowMips(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Assembly code */}
          <div className="w-1/3 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 font-semibold text-yellow-300">
              Generated MIPS Assembly
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-green-300 whitespace-pre-wrap text-sm font-mono">
                {assembly || "# No assembly code available"}
              </pre>
            </div>
            <div className="bg-gray-800 p-3 border-t border-gray-700">
              <div className="text-sm text-yellow-200 mb-2">💡 Instructions:</div>
              <div className="text-xs text-gray-400">
                1. Copy the assembly code above<br />
                2. Paste into EduMIPS64 on the right<br />
                3. Click "Assemble" then "Run"
              </div>
            </div>
          </div>

          {/* Right panel - EduMIPS iframe */}
          <div className="w-2/3 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 font-semibold text-yellow-300">
              EduMIPS64 Simulator
            </div>
            <iframe
              src="https://edumips64.github.io/"
              className="flex-1 bg-white"
              title="EduMIPS64 Simulator"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="bg-gray-900 px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
          <div className="flex justify-between">
            <span>PinoyCode → Lex/Yacc → MIPS Assembly → EduMIPS64</span>
            <span>Status: {assembly ? "Assembly ready" : "No assembly generated"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MipsModal;