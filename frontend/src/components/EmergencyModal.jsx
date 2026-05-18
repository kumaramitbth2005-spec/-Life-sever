import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Volume2, VolumeX } from 'lucide-react';

export default function EmergencyModal({ isOpen, onSafe, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isMuted, setIsMuted] = useState(false);
  const audioContext = useRef(null);
  const oscillator = useRef(null);

  const [isTriggered, setIsTriggered] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(60);
      setIsTriggered(false);
      stopSiren();
      return;
    }

    startSiren();

    if (timeLeft === 0 && !isTriggered) {
      setIsTriggered(true);
      onTimeout();
    }

    let timer;
    if (timeLeft > 0 && !isTriggered) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (!isOpen) stopSiren();
    };
  }, [isOpen, timeLeft, onTimeout, isTriggered]);

  const handleImmediateHelp = () => {
    setIsTriggered(true);
    setTimeLeft(0);
    onTimeout();
  };

  const handleSafeClick = () => {
    setIsTriggered(false);
    stopSiren();
    onSafe();
  };

  const startSiren = () => {
    if (isMuted || audioContext.current) return;

    try {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Dual oscillators for a thick, cool, modern sci-fi sound
      const osc1 = audioContext.current.createOscillator();
      const osc2 = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      // Mock oscillator reference so stopSiren works seamlessly
      oscillator.current = {
        stop: () => {
          try { osc1.stop(); } catch(e) {}
          try { osc2.stop(); } catch(e) {}
        },
        disconnect: () => {
          try { osc1.disconnect(); } catch(e) {}
          try { osc2.disconnect(); } catch(e) {}
        }
      };

      osc1.type = 'square';
      osc2.type = 'sawtooth';
      
      const now = audioContext.current.currentTime;
      osc1.frequency.setValueAtTime(900, now);
      osc2.frequency.setValueAtTime(1800, now); // One octave higher for a richer, louder sound
      gainNode.gain.setValueAtTime(0, now);
      
      const sirenInterval = setInterval(() => {
        if (!audioContext.current) {
          clearInterval(sirenInterval);
          return;
        }
        const t = audioContext.current.currentTime;
        
        // The most universal "Good" Emergency Siren (Classic Hi-Lo / Nee-Naw)
        gainNode.gain.setValueAtTime(0.4, t);
        
        // High Tone (350ms)
        osc1.frequency.setValueAtTime(900, t);
        osc2.frequency.setValueAtTime(1800, t);
        
        // Low Tone (350ms)
        osc1.frequency.setValueAtTime(700, t + 0.35);
        osc2.frequency.setValueAtTime(1400, t + 0.35);
        
      }, 700);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      osc1.start();
      osc2.start();
    } catch (e) {
      console.error("Audio context failed", e);
    }
  };

  const stopSiren = () => {
    if (oscillator.current) {
      try { oscillator.current.stop(); } catch(e) {}
      oscillator.current.disconnect();
      oscillator.current = null;
    }
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stopSiren();
    } else {
      startSiren();
    }
    setIsMuted(!isMuted);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md p-4 ${isTriggered ? 'animate-siren bg-red-950/90' : 'bg-black/90'}`}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="bg-slate-900 border-4 border-red-600 rounded-[2.5rem] w-full max-w-[95%] md:max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.5)] overflow-hidden relative"
          >
            {/* Siren Animation Background */}
            <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />

            {/* Header */}
            <div className="bg-red-600 p-6 md:p-8 flex flex-col items-center text-center relative">
              <button 
                onClick={toggleMute}
                className="absolute top-4 right-4 p-2 bg-black/20 rounded-full hover:bg-black/40 transition"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
              
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="bg-white/20 p-4 rounded-full mb-4"
              >
                <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Emergency Alert</h2>
              <p className="text-red-100 font-bold text-sm md:text-base mt-1">Possible heavy impact detected</p>
            </div>

            {/* Body */}
            <div className="p-8 md:p-10 text-center relative">
              <p className="text-slate-400 text-base md:text-lg mb-8 font-medium">Are you safe? We will notify emergency services and your family in:</p>
              
              <div className="relative inline-block mb-10">
                <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                  <circle
                    cx="50%" cy="50%" r="45%"
                    className="stroke-slate-800 stroke-[8] fill-none"
                  />
                  <motion.circle
                    cx="50%" cy="50%" r="45%"
                    className="stroke-red-600 stroke-[8] fill-none"
                    initial={{ strokeDasharray: "283 283", strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 283 - (timeLeft / 60) * 283 }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl md:text-6xl font-black text-white tabular-nums">{timeLeft}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handleSafeClick}
                  className="w-full py-4 md:py-5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg md:text-xl transition-all shadow-xl shadow-green-500/30 active:scale-95 uppercase tracking-widest"
                >
                  {isTriggered ? "I'm Safe Now (Stop Alarm)" : "I'm Safe"}
                </button>
                
                {!isTriggered && (
                  <button
                    onClick={handleImmediateHelp}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-red-500 border border-slate-700 rounded-2xl font-bold text-sm md:text-base transition active:scale-95"
                  >
                    Need Help Now
                  </button>
                )}
                
                {isTriggered && (
                  <div className="text-red-500 font-black animate-pulse text-sm uppercase tracking-widest mt-2">
                    Emergency Protocol Initiated
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
