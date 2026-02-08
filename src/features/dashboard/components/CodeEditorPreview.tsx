'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useAppStore } from '@/store/useAppStore';
import { useState, useEffect } from 'react';
import { detectLanguage } from '@/lib/languageDetector';


export const CodeEditorPreview = () => {
    const {
        agentStatus,
        setAgentStatus,
        addLog,
        setCurrentCode,
        editorCode,
        isReviewMode,
        setIsReviewMode,
        activeReviewFile,
        proposedChanges,
        setProposedChanges
    } = useAppStore();

    // If agent is THINKING/SUCCESS (Fixing), use typing. If IDLE (Viewing), instant.
    const isInstant = agentStatus === 'IDLE';

    const { displayText } = useTypewriter(editorCode, isInstant ? 0 : 15, 1000);
    const [fileName, setFileName] = useState("DemoPage.tsx");
    const [fileIcon, setFileIcon] = useState("⚛");
    const [flashFile, setFlashFile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const activeChange = proposedChanges.find(c => c.fileName === activeReviewFile);

    const handleAccept = () => {
        if (!activeChange) return;
        setProposedChanges(proposedChanges.filter(c => c.fileName !== activeReviewFile));
        setIsReviewMode(false);
        addLog(`Accepted changes for ${activeReviewFile}`);
        // In real app, we would write to disk here
    };

    const handleReject = () => {
        setProposedChanges(proposedChanges.filter(c => c.fileName !== activeReviewFile));
        setIsReviewMode(false);
        addLog(`Rejected changes for ${activeReviewFile}`);
    };

    // Sync content to store for Global Access (Dashboard)
    useEffect(() => {
        setCurrentCode(displayText);
    }, [displayText, setCurrentCode]);

    useEffect(() => {
        const lowerCode = editorCode.toLowerCase();
        const { language, extension, icon } = detectLanguage(editorCode);

        let newName = `file.${extension}`;
        // If we have a known context name, prefere that, otherwise use generic
        if (fileName !== "DemoPage.tsx" && !fileName.endsWith(extension)) {
            newName = fileName.split('.')[0] + "." + extension;
        } else if (fileName === "DemoPage.tsx" && extension !== 'tsx') {
            newName = `script.${extension}`;
        } else {
            newName = fileName;
        }

        let newIcon = icon;

        if (newName !== fileName) {
            setFileName(newName);
            setFileIcon(newIcon);
            setFlashFile(true);
            setTimeout(() => setFlashFile(false), 500);
        }
    }, [editorCode, fileName]); // Added fileName to dependencies to be safe

    const handleApprove = async () => {
        setIsSaving(true);
        setAgentStatus('THINKING');
        addLog("Compiling changes...");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/save-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `src/app/${fileName}`,
                    content: editorCode
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            setShowSuccess(true);
            setAgentStatus('SUCCESS');
            addLog(`Write confirmed: src/app/${fileName}`);
            addLog("Task successfully completed.");

            setTimeout(() => {
                setShowSuccess(false);
                setAgentStatus('IDLE');
            }, 3000);
        } catch (error) {
            console.error("Save failed:", error);
            setAgentStatus('ERROR');
            addLog("Error: Write access denied.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 h-full p-8 overflow-hidden relative"
            >
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0E14] to-[#0B0E14] -z-10" />

                <div className="flex flex-col h-full max-w-5xl mx-auto relative">

                    {/* Success Toast */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, x: "-50%" }}
                                animate={{ opacity: 1, y: 0, x: "-50%" }}
                                exit={{ opacity: 0, y: -20, x: "-50%" }}
                                className="absolute top-4 left-1/2 z-50 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-2 text-sm font-bold tracking-wide"
                            >
                                <span>✓</span> FILE SAVED SUCCESSFULLY
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                            <motion.div
                                animate={flashFile ? { color: ["#fff", "#00f0ff", "#fff"] } : {}}
                                transition={{ duration: 0.4 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-neon-cyan">{fileName}</span>
                            </motion.div>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">Review Pending</span>
                        </h2>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 rounded transition-colors" disabled={isSaving}>
                                Diff View
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isSaving}
                                className="px-4 py-1.5 text-xs font-medium text-black bg-neon-cyan hover:bg-cyan-400 rounded shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="animate-spin h-3 w-3 border-2 border-black border-t-transparent rounded-full" />
                                        Saving...
                                    </>
                                ) : (
                                    "Approve Changes"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Editor Window */}
                    <div className="flex-1 rounded-xl border border-slate-800 bg-[#0F131C] shadow-2xl overflow-hidden flex flex-col">
                        {/* Tab Bar */}
                        <div className="h-9 bg-[#0B0E14] border-b border-slate-800 flex items-center px-2 gap-1">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0F131C] rounded-t-lg border-t border-l border-r border-slate-800/50 text-xs text-slate-300 font-mono">
                                <span className="text-blue-400">{fileIcon}</span>
                                <motion.span
                                    animate={flashFile ? { opacity: [0.5, 1, 0.5] } : {}}
                                >
                                    {fileName}
                                </motion.span>
                            </div>
                        </div>

                        {/* Code Area */}
                        <div className="flex-1 p-6 font-mono text-sm overflow-auto custom-scrollbar">
                            <div className="grid grid-cols-[3rem_1fr] gap-4">
                                {/* Line Numbers */}
                                <div className="text-right text-slate-600 select-none flex flex-col gap-[2px]">
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <span key={i} className="leading-6">{i + 1}</span>
                                    ))}
                                </div>

                                {/* Code Content */}
                                <div className="text-slate-300 whitespace-pre font-jet-mono leading-6">
                                    {displayText}
                                    <span className="animate-pulse inline-block w-2.5 h-5 bg-neon-cyan align-middle ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- REVIEW MODE MODAL --- */}
            <AnimatePresence>
                {isReviewMode && activeChange && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsReviewMode(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-7xl h-[80vh] bg-[#0F131C] border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
                        >
                            {/* Review Header */}
                            <div className="p-4 border-b border-slate-800 bg-[#0B0E14] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-yellow-500 font-mono text-sm tracking-widest uppercase">[Neural Patch Review]</span>
                                    <span className="text-slate-300 font-mono text-xs">{activeChange.fileName}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleReject}
                                        className="px-4 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/30 rounded-full transition-all"
                                    >
                                        REJECT
                                    </button>
                                    <button
                                        onClick={handleAccept}
                                        className="px-6 py-1.5 text-xs font-bold text-black bg-green-500 hover:bg-green-400 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all"
                                    >
                                        ACCEPT CHANGE
                                    </button>
                                </div>
                            </div>

                            {/* Split Diff View */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Original */}
                                <div className="flex-1 border-r border-slate-800 flex flex-col">
                                    <div className="p-2 bg-red-500/10 border-b border-red-500/20 text-[10px] text-red-400 font-mono uppercase tracking-widest text-center">Original Code</div>
                                    <div className="flex-1 p-6 font-mono text-xs overflow-auto bg-red-500/[0.02] text-slate-400 custom-scrollbar whitespace-pre">
                                        {activeChange.originalCode}
                                    </div>
                                </div>
                                {/* Fixed */}
                                <div className="flex-1 flex flex-col">
                                    <div className="p-2 bg-green-500/10 border-b border-green-500/20 text-[10px] text-green-400 font-mono uppercase tracking-widest text-center">AI Optimized</div>
                                    <div className="flex-1 p-6 font-mono text-xs overflow-auto bg-green-500/[0.02] text-slate-200 custom-scrollbar whitespace-pre">
                                        {activeChange.fixedCode}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
