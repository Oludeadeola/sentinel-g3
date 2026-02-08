import { create } from 'zustand';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

interface ProposedChange {
    fileName: string;
    originalCode: string;
    fixedCode: string;
    status: 'MODIFIED' | 'STAGED' | 'ACCEPTED';
}

interface AppState {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;

    files: FileNode[];
    setFiles: (files: FileNode[]) => void;

    isScanning: boolean;
    setIsScanning: (isScanning: boolean) => void;

    agentStatus: 'IDLE' | 'THINKING' | 'SUCCESS' | 'ERROR';
    setAgentStatus: (status: 'IDLE' | 'THINKING' | 'SUCCESS' | 'ERROR') => void;

    logs: string[];
    addLog: (log: string) => void;
    clearLogs: () => void;

    missionReport: { scanned: number; ignored: number; issues: number } | null;
    setMissionReport: (report: { scanned: number; ignored: number; issues: number } | null) => void;

    currentCode: string;
    setCurrentCode: (code: string) => void;

    editorCode: string;
    setEditorCode: (code: string) => void;

    // Batch & Review
    globalInstruction: string;
    setGlobalInstruction: (instr: string) => void;
    proposedChanges: ProposedChange[];
    setProposedChanges: (changes: ProposedChange[]) => void;
    isReviewMode: boolean;
    setIsReviewMode: (mode: boolean) => void;
    activeReviewFile: string | null;
    setActiveReviewFile: (fileName: string | null) => void;

    // Vision Repair
    screenshot: string | null; // Base64 string
    setScreenshot: (screenshot: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    files: [],
    setFiles: (files) => set({ files }),

    isScanning: false,
    setIsScanning: (isScanning) => set({ isScanning }),

    agentStatus: 'IDLE',
    setAgentStatus: (status) => set({ agentStatus: status }),

    logs: [],
    addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
    clearLogs: () => set({ logs: [] }),

    missionReport: null,
    setMissionReport: (report) => set({ missionReport: report }),

    currentCode: "",
    setCurrentCode: (code) => set({ currentCode: code }),

    editorCode: `import React from 'react';
import { motion } from 'framer-motion';

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black z-0" />

      <div className="z-10 text-center max-w-2xl px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400"
        >
          Join the Revolution
        </motion.h1>
      </div>
    </main>
  );
}`,
    setEditorCode: (code) => set({ editorCode: code }),

    globalInstruction: "",
    setGlobalInstruction: (globalInstruction) => set({ globalInstruction }),
    proposedChanges: [],
    setProposedChanges: (proposedChanges) => set({ proposedChanges }),
    isReviewMode: false,
    setIsReviewMode: (isReviewMode) => set({ isReviewMode }),
    activeReviewFile: null,
    setActiveReviewFile: (activeReviewFile) => set({ activeReviewFile }),

    screenshot: null,
    setScreenshot: (screenshot) => set({ screenshot }),
}));
