// import React from "react";

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
        <div className="p-6 overflow-y-auto text-gray-200 space-y-8">
          
          {/* Section: Variables */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-3 border-b border-gray-700 pb-1">1. Variables (Mga Variable)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <code className="text-yellow-300">numero</code>
                <p className="text-xs text-gray-500 mt-1">Integers / Whole numbers</p>
                <div className="mt-2 text-xs font-mono bg-black p-2 rounded text-green-400">
                  numero age = 21
                </div>
              </div>

              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <code className="text-yellow-300">desimal</code>
                <p className="text-xs text-gray-500 mt-1">Floating point numbers</p>
                <div className="mt-2 text-xs font-mono bg-black p-2 rounded text-green-400">
                  desimal pi = 3.14
                </div>
              </div>

              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <code className="text-yellow-300">sulat</code>
                <p className="text-xs text-gray-500 mt-1">Strings (Double Quotes)</p>
                <div className="mt-2 text-xs font-mono bg-black p-2 rounded text-green-400">
                  sulat name = "Wikaxd"
                </div>
              </div>

              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <code className="text-yellow-300">letra</code>
                <p className="text-xs text-gray-500 mt-1">Characters (Single Quotes)</p>
                <div className="mt-2 text-xs font-mono bg-black p-2 rounded text-green-400">
                  letra grade = 'A'
                </div>
              </div>

            </div>
          </section>

          {/* Section: Printing */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-3 border-b border-gray-700 pb-1">2. Output (Pag-ilimbag)</h3>
            <p className="text-sm text-gray-400 mb-2">
              Use <code className="text-yellow-300">ilimbag</code> to print. You can print multiple items separated by commas.
            </p>
            
            <div className="bg-gray-900 p-4 rounded border border-gray-700 font-mono text-sm space-y-3">
              <div>
                <p className="text-gray-500 text-xs mb-1">// Print a single variable</p>
                <p className="text-green-400">ilimbag name</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-xs mb-1">// Print text and number</p>
                <p className="text-green-400">ilimbag "Value is:", x</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">// Print multiple items</p>
                <p className="text-green-400">ilimbag "Age:", 21, "Grade:", 'A'</p>
              </div>
            </div>
          </section>

          {/* Section: Operations */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-3 border-b border-gray-700 pb-1">3. Operations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Arithmetic */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Arithmetic</h4>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 font-mono text-xs space-y-2">
                  <p><span className="text-purple-400">x</span> = 10 <span className="text-blue-400">+</span> 5</p>
                  <p><span className="text-purple-400">x</span> = 10 <span className="text-blue-400">-</span> 2</p>
                  <p><span className="text-purple-400">x</span> = 5 <span className="text-blue-400">*</span> 5</p>
                  <p><span className="text-purple-400">x</span> = 10 <span className="text-blue-400">/</span> 2</p>
                </div>
              </div>

              {/* Compound */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Assignment</h4>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 font-mono text-xs space-y-2">
                  <p><span className="text-purple-400">x</span> <span className="text-pink-400">+=</span> 10</p>
                  <p><span className="text-purple-400">x</span> <span className="text-pink-400">-=</span> 5</p>
                  <p><span className="text-purple-400">x</span> <span className="text-pink-400">*=</span> 2</p>
                  <p><span className="text-purple-400">x</span> <span className="text-pink-400">/=</span> 2</p>
                </div>
              </div>
            </div>

            {/* Increment/Decrement */}
            <div className="mt-4">
               <h4 className="text-sm font-semibold text-gray-300 mb-2">Increment & Decrement</h4>
               <div className="bg-gray-900 p-3 rounded border border-gray-700 font-mono text-xs grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 mb-1">// Postfix</p>
                    <p>x<span className="text-orange-400">++</span></p>
                    <p>x<span className="text-orange-400">--</span></p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">// Prefix</p>
                    <p><span className="text-orange-400">++</span>x</p>
                    <p><span className="text-orange-400">--</span>x</p>
                  </div>
               </div>
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