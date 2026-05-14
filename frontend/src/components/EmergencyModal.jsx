import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function EmergencyModal({ isOpen, onSafe, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(20);
      return;
    }

    if (timeLeft === 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, onTimeout]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border-2 border-red-500 rounded-3xl w-full max-w-[90%] md:max-w-md shadow-2xl shadow-red-500/30 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-500 p-4 md:p-6 flex flex-col items-center text-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-white mb-2" />
              </motion.div>
              <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">Possible Accident Detected</h2>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 text-center">
              <p className="text-slate-300 text-sm md:text-lg mb-6">Are you okay? Emergency protocol will trigger automatically in:</p>
              
              <div className="text-6xl md:text-8xl font-black text-red-500 mb-8 tabular-nums tracking-tighter">
                {timeLeft}
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                <button
                  onClick={onSafe}
                  className="w-full py-3.5 md:py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-base md:text-lg transition shadow-lg shadow-green-500/20 active:scale-95"
                >
                  I'm Safe (Cancel)
                </button>
                
                <button
                  onClick={onTimeout}
                  className="w-full py-3.5 md:py-4 bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 rounded-2xl font-bold text-sm md:text-base transition active:scale-95"
                >
                  Need Help Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
