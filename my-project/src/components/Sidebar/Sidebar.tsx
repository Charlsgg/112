import type { FileItem, SidebarView } from "../../types";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarView: SidebarView;
  files: FileItem[];
  handleFileClick: (fileName: string) => void;
  handleRemoveFile: (fileName: string, e: React.MouseEvent) => void;
  sidebarWidth: number;
  isResizingSidebar: boolean;
  setIsResizingSidebar: (resizing: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function Sidebar({
  setSidebarOpen,
  sidebarView,
  files,
  handleFileClick,
  handleRemoveFile,
  sidebarWidth,
  setIsResizingSidebar,
  fileInputRef
}: SidebarProps) {

  return (
    <div 
      className="bg-gray-900 border-r border-blue-700 flex flex-col relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="h-9 flex items-center justify-between px-3 bg-blue-800 border-b border-blue-700">
        <span className="text-xs text-yellow-300 font-semibold uppercase">
          {sidebarView === "files" ? "Explorer" : "Debug"}
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-yellow-300 hover:text-yellow-100 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {sidebarView === "files" && (
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
              
              <div className="ml-4">
                {files.map((file) => (
                  <div
                    key={file.name}
                    onClick={() => handleFileClick(file.name)}
                    className={`flex items-center justify-between gap-2 px-2 py-1 hover:bg-blue-900 cursor-pointer rounded text-sm group ${
                      file.active ? "bg-blue-900 text-yellow-100" : "text-gray-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
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
                <div>Drag & drop files here to add them to your project</div>
              </div>
            </div>
          </div>
        )}

        {sidebarView === "debug" && (
          <div className="p-3 text-sm text-yellow-200">
            <div className="mb-3">
              <div className="text-yellow-300 font-semibold mb-2">Variables</div>
              <div className="ml-2 text-gray-400 text-xs">No variables in scope</div>
            </div>
            <div className="mb-3">
              <div className="text-yellow-300 font-semibold mb-2">Breakpoints</div>
              <div className="ml-2 text-gray-400 text-xs">No breakpoints set</div>
            </div>
            <div>
              <div className="text-yellow-300 font-semibold mb-2">Call Stack</div>
              <div className="ml-2 text-gray-400 text-xs">Not running</div>
            </div>
          </div>
        )}
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