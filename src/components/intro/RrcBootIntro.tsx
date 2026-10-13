"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import { DialogFocus } from "@/components/ui/DialogFocus";
import { PrivateCodeForm } from "@/components/private/PrivateCodeForm";
import { markPublicEntry } from "@/components/private/PrivateSessionProvider";
import { usePathname } from "next/navigation";
import { FabricCutScene } from "./FabricCutScene";
const word = "RICHRUSSIANCOMMUNITY",
  playedKey = "rrc_cut_played";
export function RrcBootIntro() {
  const { language } = useLanguage(),
    ru = language === "ru";
  const pathname = usePathname();
  const [policyReady, setPolicyReady] = useState(false);
  const [visible, setVisible] = useState(pathname === "/"),
    [mode, setMode] = useState<"entry" | "code">("entry"),
    [reduced, setReduced] = useState(true),
    [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode === "entry") root.current?.scrollTo(0, 0);
  }, [mode]);
  const back = useRef<HTMLButtonElement>(null),
    entry = useRef<HTMLButtonElement>(null),
    restore = useRef(false),
    focusAfterFinish = useRef(false),
    started = useRef(false);
  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(playedKey, "true");
    } catch {
      /* Animation state only. */
    }
    setReady(true);
    if (
      focusAfterFinish.current ||
      document.activeElement?.classList.contains("rrc-cut-skip")
    ) {
      focusAfterFinish.current = false;
      requestAnimationFrame(() =>
        entry.current?.focus({ preventScroll: true }),
      );
    }
  }, []);
  useEffect(() => {
    if (pathname !== "/") {
      setVisible(false);
      return;
    }
    try {
      if (sessionStorage.getItem("rrc_intro_seen") === "true") {
        setVisible(false);
        return;
      }
      if (!started.current) {
        started.current = true;
        if (sessionStorage.getItem(playedKey) === "true") {
          setFallback(true);
          setReady(true);
        } else sessionStorage.setItem(playedKey, "true");
      }
    } catch {
      /* Storage is optional. */
    }
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(media.matches);
      if (media.matches) {
        setFallback(true);
        finish();
      }
    };
    sync();
    media.addEventListener("change", sync);
    setPolicyReady(true);
    setVisible(true);
    return () => media.removeEventListener("change", sync);
  }, [finish, pathname]);
  const close = useCallback(() => {
    try {
      sessionStorage.setItem("rrc_intro_seen", "true");
      sessionStorage.setItem(playedKey, "true");
    } catch {
      /* Optional storage. */
    }
    window.dispatchEvent(new Event("rrc:enter"));
    setVisible(false);
  }, []);
  const enterPublic = useCallback(() => {
    markPublicEntry();
    void fetch("/api/private-access/logout", { method: "POST" }).catch(() => {
      /* Server guards remain in place. */
    });
    close();
  }, [close]);
  const skip = useCallback(() => {
    focusAfterFinish.current = true;
    setFallback(true);
    finish();
  }, [finish]);
  useEffect(() => {
    if (!visible) return;
    // Focus the scene container, keeping the resting menu visually quiet.
    // Tab still reaches Skip during playback and both entrances at the end.
    const frame = requestAnimationFrame(() =>
      root.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement,
      previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "code") {
          restore.current = true;
          setMode("entry");
        } else if (!ready) skip();
        else enterPublic();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [mode, visible, enterPublic, ready, skip]);
  const failure = useCallback(() => {
    setFallback(true);
    finish();
  }, [finish]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={root}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={word}
          data-rrc-boot-intro=""
          data-intro-ready={ready}
          data-intro-mode={mode}
          data-intro-fallback={fallback}
          className="rrc-cut-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
        >
          <DialogFocus />
          {fallback && <div className="rrc-cut-plate" aria-hidden="true" />}
          <div
            className="rrc-cut-title"
            style={fallback ? { clipPath: "none" } : undefined}
          >
            <h2 className="font-display font-light">{word}</h2>
          </div>
          {policyReady && !fallback && (
            <FabricCutScene
              final={ready}
              onComplete={finish}
              onFailure={failure}
            />
          )}
          <div
            className={`rrc-cut-controls ${mode === "code" ? "rrc-cut-controls-code" : ""}`}
            style={{
              opacity: ready ? 1 : "var(--intro-menu,0)",
              transitionDuration: "0ms",
              pointerEvents: ready ? "auto" : "none",
            }}
          >
            <AnimatePresence mode="wait">
              {mode === "entry" ? (
                <motion.div
                  key="entry"
                  className="rrc-cut-entries"
                  onAnimationComplete={() => {
                    if (restore.current) {
                      restore.current = false;
                      back.current?.focus();
                    }
                  }}
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.18 }}
                >
                  <button
                    ref={entry}
                    type="button"
                    disabled={!ready}
                    onClick={enterPublic}
                  >
                    {ru ? "ВОЙТИ" : "ENTER"}
                  </button>
                  <button
                    ref={back}
                    type="button"
                    disabled={!ready}
                    onClick={() => setMode("code")}
                  >
                    PRIVATE ACCESS
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.18 }}
                  className="rrc-cut-code"
                >
                  <PrivateCodeForm
                    variant="overlay"
                    ru={ru}
                    onSuccess={close}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      restore.current = true;
                      setMode("entry");
                    }}
                    className="mt-3 min-h-11 w-full text-center text-[10px] text-white/55 tracking-[.18em] hover:text-white"
                  >
                    {ru ? "НАЗАД" : "BACK"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!ready && (
            <button type="button" onClick={skip} className="rrc-cut-skip">
              {ru ? "Пропустить" : "Skip"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
