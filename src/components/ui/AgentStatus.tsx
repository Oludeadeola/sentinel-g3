import { motion } from 'framer-motion';

export const AgentStatus = () => {
    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-glass-border bg-glass-surface backdrop-blur-md">
            <div className="relative flex h-3 w-3">
                <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"
                />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            </div>
            <span className="text-sm font-medium tracking-wide text-cyan-100 uppercase text-[10px]">
                Agent Active
            </span>
        </div>
    );
};
