import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Brief branded splash on first paint.
 * Stays up until auth session restore finishes (or a short minimum), so protected
 * routes never flash /login and the document title never briefly becomes "Not Found".
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const authSetupComplete = useAuthStore((s) => s.authSetupComplete);

  useEffect(() => {
    const minMs = 600;
    const maxMs = 4000;
    const started = Date.now();

    let minTimer: ReturnType<typeof setTimeout> | undefined;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;
    let done = false;

    const hide = () => {
      if (done) return;
      done = true;
      setVisible(false);
    };

    maxTimer = setTimeout(hide, maxMs);

    const tryHide = () => {
      const elapsed = Date.now() - started;
      if (elapsed >= minMs) hide();
      else minTimer = setTimeout(hide, minMs - elapsed);
    };

    if (authSetupComplete) tryHide();

    return () => {
      if (minTimer) clearTimeout(minTimer);
      if (maxTimer) clearTimeout(maxTimer);
    };
  }, [authSetupComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#6FE8D6]/20 blur-xl" />
              <img
                src="/favicon.png"
                alt="BadePay"
                className="relative h-16 w-16 rounded-2xl object-cover shadow-2xl shadow-[#6FE8D6]/20"
              />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Bade<span className="text-[#6FE8D6]">Pay</span>
              </h1>
              <p className="mt-1 text-xs tracking-widest text-white/30 uppercase">
                Super App
              </p>
            </div>

            <motion.div
              className="mt-4 h-0.5 w-12 overflow-hidden rounded-full bg-white/10"
            >
              <motion.div
                className="h-full rounded-full bg-[#6FE8D6]"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
                style={{ width: "60%" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
