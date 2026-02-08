'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AgentStatus } from '@/components/ui/AgentStatus';
import { useAppStore } from '@/store/useAppStore';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
    const {
        files, setFiles, setIsScanning, agentStatus, setAgentStatus,
        addLog, logs, clearLogs, isScanning,
        globalInstruction, setGlobalInstruction,
        proposedChanges, setProposedChanges,
        setIsReviewMode, setActiveReviewFile
    } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBatchFix = async () => {
        setIsScanning(true);
        setAgentStatus('THINKING');
        addLog("Batch neural processing initiated...");
        addLog(`Instruction: "${globalInstruction}"`);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/fix-project`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folderPath: ".",
                    instruction: globalInstruction
                })
            });

            if (!res.ok) throw new Error("Batch processing failed");

            const data = await res.json();
            setProposedChanges(data.changes || []);
            addLog(`Analysis complete. ${data.changes?.length || 0} modifications proposed.`);
            setAgentStatus('SUCCESS');

            setTimeout(() => setAgentStatus('IDLE'), 2000);
        } catch (error) {
            console.error("Batch fix failed:", error);
            setAgentStatus('ERROR');
            addLog("Error: Neural Batch process aborted.");
        } finally {
            setIsScanning(false);
        }
    };

    const listVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // We trigger the backend scan regardless of the specific file input for this demo
        // This simulates "reading" the project.
        setIsScanning(true);
        setAgentStatus('THINKING');
        clearLogs();
        addLog("Initializing Project Scanner...");
        addLog("Reading directory structure...");

        try {
            await new Promise(resolve => setTimeout(resolve, 600)); // Dramatic pause
            addLog("Executing recursive walk...");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/project/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: '.' })
            });
            const data = await res.json();

            addLog(`Scanned ${data.tree ? data.tree.length : 0} root nodes.`);
            if (data.stats) {
                addLog(`Processed ${data.stats.scanned} files total.`);
                addLog(`Safely ignored ${data.stats.ignored} directories.`);
            }

            if (data.tree && Array.isArray(data.tree)) {
                setFiles(data.tree);
            } else {
                addLog("Warning: No file tree returned.");
            }
            addLog("Generating file tree visualization...");

            setTimeout(() => {
                setAgentStatus('SUCCESS');
                addLog("Project Context Loaded.");
                setTimeout(() => setAgentStatus('IDLE'), 2000);
            }, 800);

        } catch (error) {
            console.error("Scan failed:", error);
            setAgentStatus('ERROR');
            addLog("Critical Failure: Scan aborted.");
        } finally {
            // Simulate a brief delay for the "Deep Think" effect if the API is too fast
            setTimeout(() => setIsScanning(false), 800);
        }
    };

    // Recursive Tree Item Component
    const FileTreeItem = ({ node, depth = 0 }: { node: any, depth?: number }) => {
        const [isOpen, setIsOpen] = useState(false);
        const isFolder = node.type === 'folder';

        return (
            <div className="select-none">
                <div
                    className={cn(
                        "flex items-center gap-1.5 py-0.5 px-2 hover:bg-white/5 rounded cursor-pointer text-slate-400 hover:text-white transition-colors",
                        isFolder && "font-medium text-slate-300"
                    )}
                    onClick={() => isFolder && setIsOpen(!isOpen)}
                    style={{ paddingLeft: `${depth * 8 + 8}px` }}
                >
                    <span className="opacity-70 text-[10px] w-3 text-center">
                        {isFolder ? (isOpen ? '▼' : '▶') : '•'}
                    </span>
                    <span className="truncate text-xs">{node.name}</span>
                </div>

                {isOpen && node.children && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                    >
                        {node.children.map((child: any, i: number) => (
                            <FileTreeItem key={i} node={child} depth={depth + 1} />
                        ))}
                    </motion.div>
                )}
            </div>
        );
    }

    // Logo Scramble Effect
    const [logoText, setLogoText] = useState("SENTINEL");
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const scrambleLogo = () => {
        let iterations = 0;
        const interval = setInterval(() => {
            setLogoText(prev =>
                prev.split("")
                    .map((letter, index) => {
                        if (index < iterations) {
                            return "SENTINEL"[index];
                        }
                        return letters[Math.floor(Math.random() * 26)];
                    })
                    .join("")
            );

            if (iterations >= "SENTINEL".length) {
                clearInterval(interval);
            }

            iterations += 1 / 3;
        }, 30);
    };

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
            className="w-80 h-full border-r border-slate-800/50 bg-[#0B0E14]/80 backdrop-blur-xl flex flex-col z-20 relative"
        >
            {/* Header */}
            <div
                className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-gradient-to-r from-transparent to-slate-900/20 cursor-default group"
                onMouseEnter={scrambleLogo}
            >
                <div className="text-xl font-bold tracking-tight text-white relative flex items-center">
                    <div className="flex overflow-hidden font-mono tracking-tighter">
                        {logoText.split("").map((char, index) => (
                            <motion.span
                                key={index}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    delay: index * 0.05 + 0.5, // Initial delay after sidebar slides in
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20
                                }}
                                className="inline-block"
                            >
                                {char}
                            </motion.span>
                        ))}
                    </div>
                    <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-neon-cyan text-base align-super ml-1.5 font-mono"
                    >
                        G3
                    </motion.span>
                </div>
            </div>

            {/* Agent Status Section */}
            <div className="p-6 border-b border-slate-800/30 flex-shrink-0 relative">
                <AgentStatus />
            </div>

            {/* Global Instruction UI */}
            <div className="p-6 border-b border-slate-800/30 flex-shrink-0">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                    Global Instruction
                </div>
                <textarea
                    value={globalInstruction}
                    onChange={(e) => setGlobalInstruction(e.target.value)}
                    placeholder="e.g., Convert to Dark Mode, Fix Accessibility, Refactor to TypeScript..."
                    className="w-full h-24 bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 outline-none transition-all resize-none custom-scrollbar placeholder:text-slate-600"
                />
                <button
                    onClick={handleBatchFix}
                    disabled={!globalInstruction || isScanning}
                    className="w-full mt-3 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan text-neon-cyan text-[10px] font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-30 disabled:grayscale"
                >
                    Fix Project
                </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col relative">
                {/* Proposed Changes Section */}
                {proposedChanges.length > 0 && (
                    <div className="mb-6 flex-shrink-0">
                        <div className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Proposed Changes</span>
                            <span className="bg-yellow-500/10 px-2 py-0.5 rounded text-[8px] border border-yellow-500/20">{proposedChanges.length}</span>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar -mx-2 px-2">
                            {proposedChanges.map((change, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setActiveReviewFile(change.fileName);
                                        setIsReviewMode(true);
                                    }}
                                    className="flex items-center justify-between p-2 hover:bg-yellow-500/5 rounded border border-transparent hover:border-yellow-500/20 cursor-pointer group transition-all"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                        <span className="text-[10px] text-slate-300 group-hover:text-yellow-400 truncate font-mono">{change.fileName}</span>
                                    </div>
                                    <span className="text-[8px] text-yellow-600 uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">Review</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col relative">
                    {(!files || files.length === 0) ? (
                        <>
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Live Thinking Traces</div>

                            {/* CRT Scanline Container */}
                            <div className="relative overflow-hidden rounded-lg bg-slate-900/20 border border-slate-800/40 p-1 min-h-[120px]">
                                <div className="scanline" />
                                <div className="p-2 space-y-1 font-mono text-[10px] text-slate-400">
                                    {(logs || []).length === 0 && (
                                        <div className="opacity-50 italic">System Idle. Waiting for input...</div>
                                    )}
                                    {(logs || []).slice(-8).map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.1 }} // Matrix Speed
                                            className="flex items-start gap-2"
                                        >
                                            <span className="text-neon-cyan">test@sentinel:~$</span>
                                            <span className="truncate">{log}</span>
                                        </motion.div>
                                    ))}
                                    {agentStatus === 'THINKING' && (
                                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.2 }} className="h-4 w-2 bg-neon-cyan/50" />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between flex-shrink-0">
                                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Project Files</div>
                                <span className="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full">Indexed</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2">
                                {Array.isArray(files) && files.map((file, i) => (
                                    <FileTreeItem key={i} node={file} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Import Zone */}
            <div className="p-6 pt-0 mt-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full group relative overflow-hidden rounded-lg bg-slate-900/50 border border-slate-700/50 p-4 hover:border-neon-cyan/50 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl mb-1">📂</span>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-neon-cyan tracking-wide">OPEN LOCAL PROJECT</span>
                        <span className="text-[10px] text-slate-500">Drag folder or click to browse</span>
                    </div>
                </button>
            </div>

            <div className="p-4 relative">
                <div className="text-[10px] text-slate-600 font-mono text-center tracking-widest opacity-50">
                    // SYSTEM READY
                </div>
            </div>
        </motion.aside>
    );
};
