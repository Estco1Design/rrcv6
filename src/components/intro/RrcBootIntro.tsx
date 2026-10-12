"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import { DialogFocus } from "@/components/ui/DialogFocus";
import { PrivateCodeForm } from "@/components/private/PrivateCodeForm";
const SculptureIntro = dynamic(() => import("./SculptureIntro"), {
  ssr: false,
});
const ease = [0.22, 1, 0.36, 1] as const;
export function RrcBootIntro() {
  const { language } = useLanguage();
  const ru = language === "ru";
  const [visible, setVisible] = useState(false),
    [mode, setMode] = useState<"entry" | "code">("entry"),
    [reduced, setReduced] = useState(true),
    [playing, setPlaying] = useState(true);
  const returnFocus = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (window.location.pathname !== "/") return;
    try {
      if (sessionStorage.getItem("rrc_intro_seen") === "true") return;
    } catch {
      /* Optional storage. */
    }
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    setVisible(true);
    return () => media.removeEventListener("change", sync);
  }, []);
  const close = useCallback(() => {
    try {
      sessionStorage.setItem("rrc_intro_seen", "true");
    } catch {
      /* Optional storage. */
    }
    window.dispatchEvent(new Event("rrc:enter"));
    setVisible(false);
  }, []);
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mode === "code") {
          restoreFocus.current=true;
          setMode("entry");
        } else close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, mode, close]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-rrc-boot-intro=""
          role="dialog"
          aria-modal="true"
          aria-label="RICHRUSSIANCOMMUNITY"
          className="fixed inset-0 z-[200] bg-[#070709] overflow-y-auto"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.5, ease }}
        >
          <DialogFocus />
          <div className="relative flex min-h-[100svh] flex-col items-center justify-between px-5 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:px-10 sm:pt-8">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#251923_0%,#070709_70%)]"
            />
            <SculptureIntro
              playing={playing && mode === "entry"}
              reduced={reduced}
            />
            <div className="relative z-10 flex w-full items-center justify-between gap-4">
              <span className="font-mono text-[10px] tracking-[.18em] text-rrc-silver">
                RICHRUSSIANCOMMUNITY
              </span>
              <button
                type="button"
                onClick={close}
                className="min-h-11 px-3 text-xs text-rrc-off hover:text-white"
              >
                {ru ? "Пропустить" : "Skip"}
              </button>
            </div>
            <div className="relative z-10 pointer-events-none flex flex-1 items-start pt-[12vh] sm:pt-[10vh] text-center">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease }}
              >
                <h1 className="font-display text-[clamp(18px,3vw,32px)] font-light text-rrc-white tracking-[.12em]">
                  {ru ? "Форма вне правил." : "Form beyond rules."}
                </h1>
                <p className="mt-3 font-mono text-[10px] text-rrc-off">
                  RRC / EST. 2026
                </p>
              </motion.div>
            </div>
            <div className="relative z-10 w-full max-w-[440px] pb-3 sm:pb-6">
              <AnimatePresence mode="wait">
                {mode === "entry" ? (
                  <motion.div
                    key="entry"
                    onAnimationComplete={()=>{if(restoreFocus.current){restoreFocus.current=false;returnFocus.current?.focus();}}}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: reduced ? 0 : 0.45,
                      delay: reduced ? 0 : 0.25,
                      ease,
                    }}
                  >
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={close}
                        className="rrc-intro-entry min-h-14 bg-rrc-white text-rrc-black px-5 text-[11px] tracking-[.12em] hover:bg-rrc-silver"
                      >
                        {ru ? "ВОЙТИ НА САЙТ" : "ENTER THE SITE"}
                      </button>
                      <button
                        ref={returnFocus}
                        type="button"
                        onClick={() => setMode("code")}
                        className="rrc-intro-entry min-h-14 border border-white/30 bg-black/30 backdrop-blur-sm px-5 text-[11px] tracking-[.1em] hover:border-white/70"
                      >
                        {ru ? "ВНУТРЕННИЙ КРУГ" : "INNER CIRCLE"}
                      </button>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 text-[10px] text-rrc-off">
                      <span>
                        {ru
                          ? "Одежда. Люди. Свой круг."
                          : "Garments. People. Your circle."}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlaying((p) => !p)}
                        className="min-h-11 px-2 hover:text-white"
                        aria-pressed={!playing}
                      >
                        {playing
                          ? ru
                            ? "Остановить движение"
                            : "Pause motion"
                          : ru
                            ? "Продолжить движение"
                            : "Resume motion"}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.25 }}
                    className="border border-white/15 bg-black/85 p-6 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <h2 className="font-display text-lg">
                        {ru ? "Внутренний круг" : "Inner Circle"}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          restoreFocus.current=true;
                          setMode("entry");
                        }}
                        className="min-h-11 text-xs text-rrc-off hover:text-white"
                      >
                        {ru ? "Назад" : "Back"}
                      </button>
                    </div>
                    <PrivateCodeForm
                      variant="overlay"
                      ru={ru}
                      onSuccess={close}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
