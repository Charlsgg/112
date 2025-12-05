export type SidebarView = "files" | "debug";

export interface FileItem {
  name: string;
  content: string;
  active: boolean;
  open: boolean;
}

export interface Keyword {
  label: string;
  detail: string;
  desc: string;
}

export interface CompilerResponse {
  success: boolean;
  output: string;
  assembly: string;
  machineCode: string;
  tokens?: string[];
  error?: string;
  compilerOutput?: string;
}