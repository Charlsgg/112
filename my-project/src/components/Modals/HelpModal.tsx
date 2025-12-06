import React from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-blue-600 w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-blue-900 rounded-t-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-yellow-400">wikaxd Documentation</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-red-600 rounded p-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto text-gray-200 space-y-6">
          
          {/* Section: Variables */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">1. Variables (Mga Variable)</h3>
            <p className="text-sm text-gray-400 mb-2">Declare variables using specific types.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <code className="text-yellow-300">numero</code>
                <p className="text-xs text-gray-500 mt-1">Integers / Whole numbers</p>
                <div className="mt-2 text-xs font-mono bg-black p-2 rounded text-green-400">
                  numero age = 21
                </div>
              </div>
              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <code className="text-yellow-300">sulat</code>
                <p className="text-xs text-gray-500 mt-1">Strings / Text</p>
                <div className="mt-2 text-xs font-mono bg-black p-2 rounded text-green-400">
                  sulat name = "Jose"
                </div>
              </div>
            </div>
          </section>

          {/* Section: Printing */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">2. Output (Pag-ilimbag)</h3>
            <p className="text-sm text-gray-400 mb-2">Use <code className="text-yellow-300">ilimbag</code> to print to the terminal. Use format specifiers for variables.</p>
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                <tr>
                  <th className="px-4 py-2">Specifier</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="bg-gray-800">
                  <td className="px-4 py-2 text-pink-400">%d</td>
                  <td className="px-4 py-2">Number (numero)</td>
                  <td className="px-4 py-2 font-mono">ilimbag "Age: %d", age</td>
                </tr>
                <tr className="bg-gray-800">
                  <td className="px-4 py-2 text-pink-400">%s</td>
                  <td className="px-4 py-2">String (sulat)</td>
                  <td className="px-4 py-2 font-mono">ilimbag "Hi %s", name</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section: Arithmetic */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">3. Math Operations</h3>
            <div className="bg-gray-900 p-4 rounded border border-gray-700 font-mono text-sm">
              <p><span className="text-purple-400">c</span> = <span className="text-yellow-300">10</span> + <span className="text-yellow-300">5</span> <span className="text-gray-500">// Addition</span></p>
              <p><span className="text-purple-400">c</span> = <span className="text-yellow-300">10</span> - <span className="text-yellow-300">2</span> <span className="text-gray-500">// Subtraction</span></p>
              <p><span className="text-purple-400">c</span> = <span className="text-yellow-300">5</span> * <span className="text-yellow-300">5</span> <span className="text-gray-500">// Multiplication</span></p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end rounded-b-lg">
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            Close Help
          </button>
        </div>
      </div>
    </div>
  );
}