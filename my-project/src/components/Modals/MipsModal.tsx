import React, { useState, useMemo } from 'react';

// --- Types for our Simulator Data ---
interface Register {
  name: string;
  alias: string;
  value: string; // Hex string representation
}

interface MemoryRow {
  address: string;
  value: string;
  label: string;
}

// --- Constants for MIPS Register Names ---
const REGISTER_NAMES = [
  { name: 'R0', alias: '$zero' }, { name: 'R1', alias: '$at' }, 
  { name: 'R2', alias: '$v0' }, { name: 'R3', alias: '$v1' },
  { name: 'R4', alias: '$a0' }, { name: 'R5', alias: '$a1' },
  { name: 'R6', alias: '$a2' }, { name: 'R7', alias: '$a3' },
  { name: 'R8', alias: '$t0' }, { name: 'R9', alias: '$t1' },
  { name: 'R10', alias: '$t2' }, { name: 'R11', alias: '$t3' },
  { name: 'R12', alias: '$t4' }, { name: 'R13', alias: '$t5' },
  { name: 'R14', alias: '$t6' }, { name: 'R15', alias: '$t7' },
  { name: 'R16', alias: '$s0' }, { name: 'R17', alias: '$s1' },
  { name: 'R18', alias: '$s2' }, { name: 'R19', alias: '$s3' },
  { name: 'R20', alias: '$s4' }, { name: 'R21', alias: '$s5' },
  { name: 'R22', alias: '$s6' }, { name: 'R23', alias: '$s7' },
  { name: 'R24', alias: '$t8' }, { name: 'R25', alias: '$t9' },
  { name: 'R26', alias: '$k0' }, { name: 'R27', alias: '$k1' },
  { name: 'R28', alias: '$gp' }, { name: 'R29', alias: '$sp' },
  { name: 'R30', alias: '$fp' }, { name: 'R31', alias: '$ra' }
];

interface MipsModalProps {
  showMips: boolean;
  setShowMips: (show: boolean) => void;
  assembly: string;
}

const MipsModal: React.FC<MipsModalProps> = ({ showMips, setShowMips, assembly }) => {
  if (!showMips) return null;

  // --- Mock Data Generation ---
  // In a real app, these would be state variables updated by your parser/runner
  const registers = useMemo(() => {
    return REGISTER_NAMES.map(reg => ({
      ...reg,
      value: "0000000000000000"
    }));
  }, []);

  const floatRegisters = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => ({
      name: `F${i}`,
      alias: '',
      value: "0000000000000000"
    }));
  }, []);

  const memory = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => {
      const addr = (i * 8).toString(16).toUpperCase().padStart(4, '0');
      return {
        address: addr,
        value: "0000000000000000",
        label: ""
      };
    });
  }, []);

  const copyAssemblyToClipboard = () => {
    navigator.clipboard.writeText(assembly);
    alert('MIPS Assembly code copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-gray-800 border-2 border-yellow-500 rounded-xl w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* === Title bar === */}
        <div className="bg-blue-900 text-white px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">🚀 EduMIPS64 Clone</span>
            <span className="text-sm bg-yellow-500 text-blue-900 px-2 py-1 rounded font-semibold">
              Visual Simulator
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAssemblyToClipboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              📋 Copy Assembly
            </button>
            <button
              onClick={() => setShowMips(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* === Content Area === */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT PANEL: Assembly Code */}
          <div className="w-1/3 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 font-semibold text-yellow-300 border-b border-gray-700">
              Generated MIPS Assembly
            </div>
            <div className="flex-1 p-4 overflow-auto bg-[#1e1e1e]">
              <pre className="text-green-400 whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {assembly || "# No assembly code available"}
              </pre>
            </div>
          </div>

          {/* RIGHT PANEL: Custom Simulator UI */}
          <div className="w-2/3 flex flex-col bg-gray-200">
            
            {/* --- TOP HALF: REGISTERS --- */}
            <div className="h-1/2 flex flex-col border-b-4 border-gray-400">
              {/* Header mimicking the screenshot */}
              <div className="bg-gradient-to-b from-gray-100 to-gray-300 px-2 py-1 border-b border-gray-400 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
                <span className="font-bold text-gray-800 text-sm">Registers</span>
              </div>
              
              {/* Register Grid Container */}
              <div className="flex-1 overflow-auto bg-white p-1">
                <div className="flex">
                  {/* CPU Registers (Left Side) */}
                  <div className="w-1/2 border-r border-gray-300">
                    <table className="w-full text-left border-collapse font-mono text-sm">
                      <tbody>
                        {registers.map((reg, idx) => (
                          <tr key={reg.name} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100`}>
                            <td className="pl-2 py-0.5 text-gray-600 w-12 font-bold">{reg.name}</td>
                            <td className="px-1 py-0.5 text-blue-800 w-16">({reg.alias})</td>
                            <td className="px-2 py-0.5 text-gray-900 tracking-wider text-right border-l border-gray-200">
                              {reg.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Floating Point Registers (Right Side) */}
                  <div className="w-1/2">
                    <table className="w-full text-left border-collapse font-mono text-sm">
                      <tbody>
                        {floatRegisters.map((reg, idx) => (
                          <tr key={reg.name} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100`}>
                            <td className="pl-4 py-0.5 text-gray-600 w-16 font-bold">{reg.name}</td>
                            <td className="px-2 py-0.5 text-gray-900 tracking-wider text-right border-l border-gray-200">
                              {reg.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* --- BOTTOM HALF: DATA / MEMORY --- */}
            <div className="h-1/2 flex flex-col">
              {/* Header mimicking the screenshot */}
              <div className="bg-gradient-to-b from-gray-100 to-gray-300 px-2 py-1 border-b border-gray-400 flex items-center">
                <div className="w-3 h-3 bg-pink-500 rounded-sm mr-2"></div>
                <span className="font-bold text-gray-800 text-sm">Data</span>
              </div>

              {/* Memory Table */}
              <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left border-collapse font-mono text-sm">
                  <thead className="bg-gray-100 sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-4 py-1 border-r border-gray-300 text-gray-600 font-semibold w-24">Address</th>
                      <th className="px-4 py-1 border-r border-gray-300 text-gray-600 font-semibold w-48">Representation</th>
                      <th className="px-4 py-1 text-gray-600 font-semibold">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memory.map((row, idx) => (
                      <tr key={row.address} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50'} hover:bg-yellow-100 border-b border-gray-100`}>
                        <td className="px-4 py-0.5 text-gray-500 font-bold border-r border-gray-200">
                          {row.address}
                        </td>
                        <td className="px-4 py-0.5 text-gray-900 tracking-widest border-r border-gray-200">
                          {row.value}
                        </td>
                        <td className="px-4 py-0.5 text-gray-400 italic">
                          {row.label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-900 px-4 py-2 text-xs text-gray-400 border-t border-gray-700 flex justify-between">
            <span>Visual Simulation View</span>
            <span>MIPS64 Compatible Layout</span>
        </div>

      </div>
    </div>
  );
};

export default MipsModal;