import { useState } from "react";
import type { FileItem, SidebarView } from "../../types";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarView: SidebarView;
  files: FileItem[];
  handleFileClick: (fileName: string) => void;
  handleRemoveFile: (fileName: string, e: React.MouseEvent) => void;
  handleMoveFile: (dragIndex: number, hoverIndex: number) => void;
  sidebarWidth: number;
  isResizingSidebar: boolean;
  setIsResizingSidebar: (resizing: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function Sidebar({
  setSidebarOpen,
  sidebarOpen,
  // sidebarView, 
  files,
  handleFileClick,
  handleRemoveFile,
  handleMoveFile,
  sidebarWidth,
  setIsResizingSidebar,
  fileInputRef
}: SidebarProps) {

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;
    
    if (draggedItemIndex !== dropIndex) {
      handleMoveFile(draggedItemIndex, dropIndex);
    }
    setDraggedItemIndex(null);
  };

  // --- 1. THE MINI SIDEBAR RENDER ---
  if (!sidebarOpen) {
    return (
      <div className="w-12 bg-gray-900 border-r border-blue-700 flex flex-col items-center py-4 h-full shrink-0">
        {/* Expand Button REMOVED. Clicking the icon below now handles expansion. */}

        <div className="flex flex-col items-center gap-4 text-gray-500">
           <div 
             className="p-2 rounded cursor-pointer text-yellow-300 hover:bg-blue-800 transition-colors"
             onClick={() => setSidebarOpen(true)}
             title="Open Explorer"
           >
             📁
           </div>
        </div>
      </div>
    );
  }

  // --- 2. THE FULL SIDEBAR RENDER ---
  return (
    <div 
      className="bg-gray-900 border-r border-blue-700 flex flex-col relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="h-9 flex items-center justify-between px-3 bg-blue-800 border-b border-blue-700">
        <span className="text-xs text-yellow-300 font-semibold uppercase">
          Explorer
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-yellow-300 hover:text-yellow-100 text-lg leading-none"
          title="Minimize Sidebar"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-auto">
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
            
            <div className="ml-4 space-y-0.5">
              {files.map((file, index) => (
                <div
                  key={file.name}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, index)}
                  onClick={() => handleFileClick(file.name)}
                  className={`flex items-center justify-between gap-2 px-2 py-1 cursor-pointer rounded text-sm group transition-colors 
                    ${file.active ? "bg-blue-900 text-yellow-100" : "text-gray-400 hover:bg-blue-900"}
                    ${draggedItemIndex === index ? "opacity-50 border border-dashed border-yellow-400" : ""} 
                  `}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
                    {file.active ? (
                      <span className="text-red-400 shrink-0">●</span>
                    ) : (
                      <span className="shrink-0">📄</span>
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                  {files.length > 0 && (
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
              <div>Drag files in the list to reorder, or drop new files here.</div>
            </div>
          </div>
        </div>
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
  );
} 