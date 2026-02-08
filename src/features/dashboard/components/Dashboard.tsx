'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { CodeEditorPreview } from './CodeEditorPreview';
import { ScanningOverlay } from './ScanningOverlay';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { MissionReport } from '@/components/ui/MissionReport';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const {
        currentCode,
        addLog,
        setAgentStatus,
        setEditorCode,
        isReviewMode,
        screenshot,
        setScreenshot
    } = useAppStore();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setScreenshot(reader.result as string);
            addLog("Visual context attached: Screenshot captured.");
        };
        reader.readAsDataURL(file);
    };

    const handleFixUI = async () => {
        setAgentStatus('THINKING');
        setIsScanning(true);
        addLog(screenshot ? "ANALYZING PIXELS..." : "Initiating Gemini Neural Analysis...");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: currentCode,
                    fileName: "DemoPage.tsx",
                    image: screenshot // This could be null
                })
            });

            if (!res.ok) throw new Error("AI Analysis failed");

            const data = await res.json();

            if (data.fixedCode) {
                setEditorCode(data.fixedCode);

                // AUTO-SAVE TRIGGER (The "Push" Part)
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/save-file`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            path: `src/app/DemoPage.tsx`, // In a real app this would be dynamic
                            content: data.fixedCode
                        })
                    });
                    addLog(screenshot ? "Visual repair complete. Auto-saved to disk." : "AI: Code optimization applied & Saved.");
                } catch (saveErr) {
                    console.error("Auto-save failed", saveErr);
                    addLog("Visual repair complete. Warning: Auto-save failed.");
                }

                setAgentStatus('SUCCESS');
                addLog("Neural Patch Complete.");
            } else {
                setAgentStatus('IDLE');
                addLog("AI: No critical issues found.");
            }

        } catch (e) {
            console.error("AI Analysis failed", e);
            setAgentStatus('ERROR');
            addLog("Error: Neural Link Interrupted.");
        } finally {
            setTimeout(() => setIsScanning(false), 800);
        }
    };

    return (
        <div className={cn(
            "flex h-screen w-full bg-[#0B0E14] overflow-hidden relative transition-all duration-700",
            isReviewMode && "scale-[0.98] brightness-50 pointer-events-none grayscale-[0.5]"
        )}>
            <AnimatePresence>
                {isScanning && <ScanningOverlay isVisible={isScanning} />}
            </AnimatePresence>

            <Sidebar />
            <CodeEditorPreview />

            {/* Mission Report Modal */}
            <MissionReport />

            {/* Vision Repair Interface (Float Bottom) */}
            <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-3">
                <AnimatePresence>
                    {screenshot && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="relative group p-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl"
                        >
                            <img src={screenshot} alt="Preview" className="w-32 h-20 object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity" />
                            <button
                                onClick={() => setScreenshot(null)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                ✕
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/50 rounded-full cursor-pointer backdrop-blur-md transition-all text-xs font-bold group">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <span className="text-base group-hover:animate-pulse">📷</span>
                        {screenshot ? "REPLACE SCAN" : "DROP SCREENSHOT"}
                    </label>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleFixUI}
                        className="bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan text-neon-cyan px-6 py-2 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center gap-2 text-sm font-bold tracking-wide transition-all cursor-pointer"
                    >
                        <span className="text-lg">👁️</span> FIX MY UI
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
