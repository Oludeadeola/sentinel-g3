'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useState, useEffect } from 'react';
import { detectLanguage } from '@/lib/languageDetector';
import Editor from '@monaco-editor/react';

export const CodeEditorPreview = () => {
    const {
        agentStatus,
        setAgentStatus,
        addLog,
        setCurrentCode,
        editorCode,
        setEditorCode,
        isReviewMode,
        setIsReviewMode,
        activeReviewFile,
        proposedChanges,
        setProposedChanges
    } = useAppStore();

    const [fileName, setFileName] = useState("DemoPage.tsx");
    const [fileIcon, setFileIcon] = useState("⚛");
    const [fileLang, setFileLang] = useState("typescript");
    const [flashFile, setFlashFile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const activeChange = proposedChanges.find(c => c.fileName === activeReviewFile);

    const handleAccept = () => {
        if (!activeChange) return;
        setProposedChanges(proposedChanges.filter(c => c.fileName !== activeReviewFile));
        setIsReviewMode(false);
        addLog(`Accepted changes for ${activeReviewFile}`);
    };

    const handleReject = () => {
        setProposedChanges(proposedChanges.filter(c => c.fileName !== activeReviewFile));
        setIsReviewMode(false);
        addLog(`Rejected changes for ${activeReviewFile}`);
    };

    // Auto-Detect Language & Update Header
    useEffect(() => {
        const { language, extension, icon } = detectLanguage(editorCode);

        let newName = `file.${extension}`;
        // Smart Naming Logic
        if (fileName !== "DemoPage.tsx" && !fileName.endsWith(extension)) {
            newName = fileName.split('.')[0] + "." + extension;
        } else if (fileName === "DemoPage.tsx" && extension !== 'tsx') {
            newName = `script.${extension}`;
        } else {
            newName = fileName;
        }

        if (newName !== fileName) {
            setFileName(newName);
            setFileIcon(icon);
            setFileLang(language);
            setFlashFile(true);
            setTimeout(() => setFlashFile(false), 500);
        }
    }, [editorCode, fileName]);

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
                                <span>✓</span> FILE SAVED & PUSHED TO CLOUD
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
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">Editable Mode</span>
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
                                    "Save & Push"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Editor Window */}
                    <div className="flex-1 rounded-xl border border-slate-800 bg-[#1e1e1e] shadow-2xl overflow-hidden flex flex-col">
                        {/* Tab Bar */}
                        <div className="h-9 bg-[#0B0E14] border-b border-slate-800 flex items-center px-2 gap-1">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded-t-lg border-t border-l border-r border-slate-800/50 text-xs text-slate-300 font-mono">
                                <span className="text-blue-400">{fileIcon}</span>
                                <motion.span
                                    animate={flashFile ? { opacity: [0.5, 1, 0.5] } : {}}
                                >
                                    {fileName}
                                </motion.span>
                            </div>
                        </div>

                        {/* Monaco Editor */}
                        <div className="flex-1 overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="typescript"
                                language={fileLang}
                                theme="vs-dark"
                                value={editorCode}
                                onChange={(value) => {
                                    setEditorCode(value || "");
                                    setCurrentCode(value || "");
                                }}
                                options={{
                                    readOnly: false,
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 16, bottom: 16 }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Review Mode Overlay */}
                <AnimatePresence>
                    {isReviewMode && activeChange && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                        >
                            <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                    <h3 className="text-lg font-bold text-slate-200">Review Changes: <span className="text-neon-cyan monospace">{activeChange.fileName}</span></h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleReject} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/50 transition-colors">Reject</button>
                                        <button onClick={handleAccept} className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded border border-green-500/50 transition-colors">Accept</button>
                                    </div>
                                </div>
                                <div className="flex-1 flex overflow-hidden">
                                    <div className="flex-1 border-r border-slate-800 flex flex-col">
                                        <div className="p-2 text-xs text-red-400 bg-red-900/10 text-center uppercase tracking-widest font-mono">Original</div>
                                        <div className="flex-1 p-4 overflow-auto font-mono text-sm text-slate-400 bg-[#0F131C]">
                                            <pre>{activeChange.originalCode}</pre>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="p-2 text-xs text-green-400 bg-green-900/10 text-center uppercase tracking-widest font-mono">Proposed Fix</div>
                                        <div className="flex-1 p-4 overflow-auto font-mono text-sm text-slate-300 bg-[#0F131C]">
                                            <pre>{activeChange.fixedCode}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};
