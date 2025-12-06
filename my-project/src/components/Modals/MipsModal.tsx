import React, { useState, useEffect } from 'react';

// --- Constants & Types ---
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

interface Register {
  name: string;
  alias: string;
  value: bigint; 
}

interface MipsModalProps {
  showMips: boolean;
  setShowMips: (show: boolean) => void;
  assembly: string;
}

// Helper to format BigInt as 16-char Hex string
const toHex = (val: bigint) => val.toString(16).toUpperCase().padStart(16, '0');
const toByteHex = (val: number) => val.toString(16).toUpperCase().padStart(2, '0');

const MipsModal: React.FC<MipsModalProps> = ({ showMips, setShowMips, assembly }) => {
  // --- Simulator State ---
  const [pc, setPc] = useState<number>(0); 
  const [registers, setRegisters] = useState<Register[]>([]);
  const [hi, setHi] = useState<bigint>(BigInt(0));
  const [lo, setLo] = useState<bigint>(BigInt(0));
  const [memory, setMemory] = useState<Record<number, number>>({}); 
  const [parsedLines, setParsedLines] = useState<{ text: string, originalIndex: number }[]>([]);

  // --- Initialization ---
  useEffect(() => {
    if (showMips) {
      resetSimulator();
    }
  }, [showMips, assembly]);

  const resetSimulator = () => {
    setPc(0);
    setHi(BigInt(0));
    setLo(BigInt(0));
    setMemory({});
    
    // Reset Registers (R0-R31)
    setRegisters(REGISTER_NAMES.map(reg => ({ ...reg, value: BigInt(0) })));

    // Parse Code
    const lines = assembly.split('\n');
    const executableLines: { text: string, originalIndex: number }[] = [];
    
    lines.forEach((line, idx) => {
      let clean = line.trim();
      if (clean.includes(';')) clean = clean.split(';')[0].trim();
      if (clean.toLowerCase().startsWith('.code')) return;
      if (clean.length === 0) return;
      executableLines.push({ text: clean, originalIndex: idx });
    });
    setParsedLines(executableLines);
  };

  // --- Execution Logic (Same as before) ---
  const executeLine = (line: string, currentRegs: Register[], currentHi: bigint, currentLo: bigint, currentMem: Record<number, number>) => {
    const parts = line.replace(/,/g, ' ').trim().split(/\s+/);
    const opcode = parts[0].toUpperCase();
    const nextRegs = currentRegs.map(r => ({ ...r }));
    let nextHi = currentHi;
    let nextLo = currentLo;
    const nextMem = { ...currentMem };

    const getRegIdx = (name: string) => {
      const cleanName = name ? name.replace(',', '') : '';
      return nextRegs.findIndex(r => r.name.toUpperCase() === cleanName.toUpperCase() || r.alias.toUpperCase() === cleanName.toUpperCase());
    };
    const getRegVal = (idx: number) => (idx !== -1 ? nextRegs[idx].value : BigInt(0));
    const setRegVal = (idx: number, val: bigint) => {
      if (idx > 0 && idx < 32) nextRegs[idx].value = val;
    };

    try {
      switch (opcode) {
        case 'DADDIU': case 'DADDI': {
            const rt = getRegIdx(parts[1]); const rs = getRegIdx(parts[2]); const imm = BigInt(parseInt(parts[3]));
            if (rt !== -1 && rs !== -1) setRegVal(rt, getRegVal(rs) + imm); break;
        }
        case 'DADDU': case 'DADD': {
            const rd = getRegIdx(parts[1]); const rs = getRegIdx(parts[2]); const rt = getRegIdx(parts[3]);
            if (rd !== -1 && rs !== -1 && rt !== -1) setRegVal(rd, getRegVal(rs) + getRegVal(rt)); break;
        }
        case 'DSUBU': case 'DSUB': {
            const rd = getRegIdx(parts[1]); const rs = getRegIdx(parts[2]); const rt = getRegIdx(parts[3]);
            if (rd !== -1 && rs !== -1 && rt !== -1) setRegVal(rd, getRegVal(rs) - getRegVal(rt)); break;
        }
        case 'DMULU': case 'DMUL': {
            const rs = getRegIdx(parts[1]); const rt = getRegIdx(parts[2]);
            if (rs !== -1 && rt !== -1) { const result = getRegVal(rs) * getRegVal(rt); nextLo = result; nextHi = BigInt(0); } break;
        }
        case 'MFLO': { const rd = getRegIdx(parts[1]); if (rd !== -1) setRegVal(rd, nextLo); break; }
        case 'SB': {
            const rt = getRegIdx(parts[1]); const match = parts[2].match(/(-?\d+)\((.+)\)/);
            if (match && rt !== -1) {
              const baseIdx = getRegIdx(match[2]);
              if (baseIdx !== -1) { nextMem[Number(getRegVal(baseIdx)) + parseInt(match[1])] = Number(getRegVal(rt) & BigInt(0xFF)); }
            } break;
        }
        case 'LB': {
            const rt = getRegIdx(parts[1]); const match = parts[2].match(/(-?\d+)\((.+)\)/);
            if (match && rt !== -1) {
              const baseIdx = getRegIdx(match[2]);
              if (baseIdx !== -1) { setRegVal(rt, BigInt(nextMem[Number(getRegVal(baseIdx)) + parseInt(match[1])] || 0)); }
            } break;
        }
        default: break;
      }
    } catch (e) { console.error(e); }
    return { nextRegs, nextHi, nextLo, nextMem };
  };

  const stepForward = () => {
    if (pc >= parsedLines.length) return;
    const result = executeLine(parsedLines[pc].text, registers, hi, lo, memory);
    setRegisters(result.nextRegs); setHi(result.nextHi); setLo(result.nextLo); setMemory(result.nextMem); setPc(prev => prev + 1);
  };

  const runAll = () => {
    let tempPc = pc; let tempRegs = [...registers]; let tempHi = hi; let tempLo = lo; let tempMem = { ...memory };
    while (tempPc < parsedLines.length) {
      const result = executeLine(parsedLines[tempPc].text, tempRegs, tempHi, tempLo, tempMem);
      tempRegs = result.nextRegs; tempHi = result.nextHi; tempLo = result.nextLo; tempMem = result.nextMem; tempPc++;
    }
    setRegisters(tempRegs); setHi(tempHi); setLo(tempLo); setMemory(tempMem); setPc(tempPc);
  };

  if (!showMips) return null;

  // View Helpers
  const memoryRows = Array.from({ length: 16 }, (_, i) => ({
    addr: i.toString(16).toUpperCase().padStart(4, '0'),
    val: memory[i] !== undefined ? toByteHex(memory[i]) : "00"
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-6 font-sans backdrop-blur-sm">
      {/* Modal Container: Dark Blue/Gray theme with Yellow Sun Borders */}
      <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg w-[95vw] h-[90vh] shadow-[0_0_20px_rgba(250,204,21,0.3)] flex flex-col overflow-hidden">
        
        {/* === Header (Flag Blue) === */}
        <div className="h-12 flex items-center justify-between px-4 bg-blue-900 border-b border-blue-700">
          <div className="flex items-center gap-3">
             {/* Pinoy Dots */}
             <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-red-600 shadow-md"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-md animate-pulse"></div>
               <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md"></div>
             </div>
             <span className="text-yellow-200 font-bold text-lg tracking-wide">MIPS64 Simulator</span>
          </div>
          
          <button 
            onClick={() => setShowMips(false)} 
            className="text-gray-400 hover:text-white transition-colors text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* === Toolbar (Blue Accent) === */}
        <div className="flex items-center p-3 bg-blue-900/50 gap-3 border-b border-gray-700">
          {/* Run Button (Sun Yellow) */}
          <button 
            onClick={runAll} 
            disabled={pc >= parsedLines.length} 
            className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded text-sm hover:bg-yellow-300 font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run All
          </button>

          {/* Step Button (Blue) */}
          <button 
            onClick={stepForward} 
            disabled={pc >= parsedLines.length} 
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-500 font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400"
          >
          Step
          </button>

          <div className="w-[1px] h-6 bg-gray-600 mx-2"></div>

          {/* Reset Button (Red) */}
          <button 
            onClick={resetSimulator} 
            className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-500 font-bold transition-all shadow-lg flex items-center gap-2 border border-red-400"
          >
            <span>↺</span> Reset
          </button>

          <div className="ml-auto flex items-center gap-2 text-sm bg-gray-800 px-3 py-1.5 rounded border border-gray-700">
            <span className="text-gray-400">Program Counter:</span>
            <span className="font-mono font-bold text-yellow-400">{pc}</span>
          </div>
        </div>

        {/* === Content Grid === */}
        <div className="flex flex-1 overflow-hidden p-3 gap-3 bg-gray-900">
          
          {/* LEFT: Code View */}
          <div className="w-1/4 flex flex-col rounded-lg border border-gray-700 overflow-hidden bg-gray-800">
            <div className="px-3 py-2 text-xs font-bold text-yellow-400 uppercase tracking-wider bg-gray-900/50 border-b border-gray-700">
              Source Code
            </div>
            <div className="flex-1 overflow-auto p-0 font-mono text-sm">
              {parsedLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`flex px-3 py-1 border-l-4 ${idx === pc ? 'bg-yellow-900/40 border-yellow-400 text-yellow-100' : 'border-transparent text-gray-400 hover:bg-gray-700/50'}`}
                >
                  <span className={`w-6 text-right mr-3 select-none ${idx === pc ? 'text-yellow-500 font-bold' : 'text-gray-600'}`}>{idx}</span>
                  <span>{line.text}</span>
                </div>
              ))}
              {parsedLines.length === 0 && <div className="p-4 text-gray-500 italic text-center text-xs">Waiting for assembly...</div>}
            </div>
          </div>

          {/* CENTER: Registers */}
          <div className="w-1/2 flex flex-col rounded-lg border border-gray-700 overflow-hidden bg-gray-800">
             <div className="px-3 py-2 text-xs font-bold text-blue-300 uppercase tracking-wider bg-gray-900/50 border-b border-gray-700">
               Registers
             </div>
             <div className="flex-1 overflow-auto p-3">
                {/* HI/LO Special */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-blue-900/30 border border-blue-800 rounded p-2 flex justify-between items-center">
                    <span className="font-bold text-blue-400 text-xs">HI</span>
                    <span className="font-mono text-blue-200">{toHex(hi)}</span>
                  </div>
                  <div className="flex-1 bg-blue-900/30 border border-blue-800 rounded p-2 flex justify-between items-center">
                    <span className="font-bold text-blue-400 text-xs">LO</span>
                    <span className="font-mono text-blue-200">{toHex(lo)}</span>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {registers.map((reg) => (
                    <div key={reg.name} className="flex justify-between items-center text-xs border-b border-gray-700 py-1 hover:bg-gray-700/50 rounded px-1">
                      <div className="flex gap-2">
                        <span className="font-bold text-gray-400">{reg.name}</span>
                        <span className="text-gray-600">{reg.alias}</span>
                      </div>
                      <span className={`font-mono ${reg.value !== BigInt(0) ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>
                        {toHex(reg.value)}
                      </span>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* RIGHT: Memory */}
          <div className="w-1/4 flex flex-col rounded-lg border border-gray-700 overflow-hidden bg-gray-800">
            <div className="px-3 py-2 text-xs font-bold text-red-300 uppercase tracking-wider bg-gray-900/50 border-b border-gray-700">
              Data Memory (0-15)
            </div>
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-xs font-mono">
                <thead className="bg-gray-900 text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Addr</th>
                    <th className="px-3 py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {memoryRows.map((row) => (
                    <tr key={row.addr} className="hover:bg-gray-700/50">
                      <td className="px-3 py-1.5 text-gray-500">{row.addr}</td>
                      <td className={`px-3 py-1.5 text-right ${row.val !== "00" ? 'text-red-400 font-bold' : 'text-gray-600'}`}>
                        {row.val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* === Footer === */}
        <div className="bg-blue-900 h-6 flex items-center justify-between px-3 text-[10px] text-blue-200 border-t border-blue-800">
            <span>🇵🇭 Pinoy MIPS64 Engine</span>
            <span>Ready for Input</span>
        </div>

      </div>
    </div>
  );
};

export default MipsModal;