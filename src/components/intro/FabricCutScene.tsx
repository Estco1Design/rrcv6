"use client";
import { useEffect, useRef } from "react";
import { cutFrame, INTRO_DURATION } from "./cut-timeline";
import type { CutAudio } from "./cut-audio";
import type { CutScene } from "./create-cut-scene";
export function FabricCutScene({
  final,
  onComplete,
  onFailure,
  audio,
}: {
  audio?: CutAudio;
  final: boolean;
  onComplete: () => void;
  onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    finish = useRef(final),
    callbacks = useRef({ onComplete, onFailure }),
    controller = useRef<(() => void) | null>(null);
  callbacks.current = { onComplete, onFailure };
  finish.current = final;
  useEffect(() => {
    if (final) controller.current?.();
  }, [final]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const abort = new AbortController();
    let scene: CutScene | undefined,
      frame = 0,
      elapsed = 0,
      last = 0,
      stamp = 0,
      done = false,
      pendingResize = false,
      observer: ResizeObserver | undefined;
    const dialog = element.closest<HTMLElement>("[data-rrc-boot-intro]");
    const apply = (seconds: number) => {
      const shot = cutFrame(seconds);
      scene?.render(seconds);
      audio?.update(seconds);
      dialog?.style.setProperty("--intro-menu", String(shot.menu));
      dialog?.style.setProperty(
        "--intro-reveal",
        `${(1 - Math.max(0, Math.min(1, shot.cut - 0.006))) * 100}%`,
      );
      element.dataset.state = shot.done ? "complete" : "playing";
    };
    const complete = () => {
      if (abort.signal.aborted || done) return;
      cancelAnimationFrame(frame);
      frame = 0;
      apply(INTRO_DURATION);
      if (!done) {
        done = true;
        callbacks.current.onComplete();
      }
    };
    controller.current = complete;
    const fail = () => {
      if (abort.signal.aborted) return;
      done = true;
      cancelAnimationFrame(frame);
      frame = 0;
      abort.abort();
      callbacks.current.onFailure();
    };
    const loadTimeout = window.setTimeout(fail, 8000);
    const tick = (now: number) => {
      if (abort.signal.aborted) return;
      if (document.hidden) {
        frame = 0;
        last = 0;
        return;
      }
      if (!done && last) elapsed += (now - last) / 1000;
      last = now;
      const fps = element.clientWidth < 768 ? 24 : 30;
      if (now - stamp >= 1000 / fps) {
        apply(elapsed);
        stamp = now - ((now - stamp) % (1000 / fps));
      }
      if (!done && elapsed >= INTRO_DURATION) {
        complete();
        return;
      }
      frame = !done || scene?.active() ? requestAnimationFrame(tick) : 0;
    };
    const visibility = () => {
      if (document.hidden) audio?.suspend();
      else audio?.resume();
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!document.hidden && scene) {
        if (pendingResize) {
          scene.resize();
          pendingResize = false;
        }
        if (!done || scene.active()) frame = requestAnimationFrame(tick);
      }
    };
    const pointer = (event: PointerEvent) => {
      if (document.hidden || !scene) return;
      const bounds = element.getBoundingClientRect();
      const y = (event.clientY - bounds.top) / bounds.height;
      const menu = (event.target as HTMLElement).closest(".rrc-cut-entries");
      scene.pointer(
        (event.clientX - bounds.left) / bounds.width,
        done && menu ? (y < 0.55 ? 0.3 : 0.75) : y,
        (menu ? 10 : 20) / bounds.height,
      );
      if (!frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    dialog?.addEventListener("pointermove", pointer, { passive: true });
    dialog?.addEventListener("pointerdown", pointer, { passive: true });
    const contextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    document.addEventListener("visibilitychange", visibility);
    element.addEventListener("webglcontextlost", contextLost, true);
    void import("./create-cut-scene")
      .then((module) => module.createCutScene(element, abort.signal))
      .then((value) => {
        window.clearTimeout(loadTimeout);
        if (abort.signal.aborted) {
          value.dispose();
          return;
        }
        scene = value;
        observer = new ResizeObserver(() => {
          if (document.hidden) pendingResize = true;
          else scene?.resize();
        });
        observer.observe(element);
        if (finish.current) {
          complete();
          return;
        }
        apply(0);
        if (!document.hidden) frame = requestAnimationFrame(tick);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") fail();
      });
    return () => {
      window.clearTimeout(loadTimeout);
      abort.abort();
      audio?.reset();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      dialog?.removeEventListener("pointermove", pointer);
      dialog?.removeEventListener("pointerdown", pointer);
      scene?.dispose();
      controller.current = null;
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("webglcontextlost", contextLost, true);
    };
  }, [audio]);
  return (
    <div
      ref={host}
      data-fabric-scene=""
      data-state="loading"
      className="rrc-cut-canvas"
      aria-hidden="true"
    />
  );
}
