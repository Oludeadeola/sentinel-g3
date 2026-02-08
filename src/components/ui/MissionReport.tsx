
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

export const MissionReport = () => {
    const { missionReport, setMissionReport } = useAppStore();

    if (!missionReport) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-[#0B0E14] border border-green-500/30 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.15)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500/10 to-transparent p-6 border-b border-green-500/20 flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                        <h2 className="text-lg font-bold text-green-400 tracking-wide uppercase">Mission Report</h2>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-8 grid grid-cols-2 gap-6">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                            <div className="text-2xl font-mono font-bold text-white mb-1">{missionReport.scanned}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Files Scanned</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                            <div className="text-2xl font-mono font-bold text-slate-400 mb-1">{missionReport.ignored}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Files Ignored</div>
                        </div>
                        <div className="col-span-2 bg-slate-900/50 rounded-lg p-4 border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-mono font-bold text-yellow-400 mb-1">{missionReport.issues}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Potential Issues</div>
                            </div>
                            <div className="text-xs text-slate-600 italic">
                                *Auto-fixable via Sentinel Vision
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-0 flex justify-end">
                        <button
                            onClick={() => setMissionReport(null)}
                            className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-green-500/20"
                        >
                            ACKNOWLEDGE
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
