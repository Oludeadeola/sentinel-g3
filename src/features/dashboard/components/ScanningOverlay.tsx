'use client';

import { motion } from 'framer-motion';

interface ScanningOverlayProps {
    isVisible: boolean;
}

export const ScanningOverlay = ({ isVisible }: ScanningOverlayProps) => {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-center items-center bg-black/10 backdrop-blur-[1px]"
        >
            <div className="absolute inset-x-0 h-[2px] bg-neon-cyan/80 shadow-[0_0_20px_rgba(0,240,255,0.8)] animate-pulse" style={{ top: '50%' }} />

            <div className="bg-black/80 border border-neon-cyan/50 text-neon-cyan px-6 py-3 rounded-lg font-mono text-sm tracking-widest shadow-2xl flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan"></span>
                </span>
                SENTINEL VISION: ANALYZING PIXELS...
            </div>
        </motion.div>
    );
};
