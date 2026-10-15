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
  onPrepared,
}: {
  onPrepared: () => void;
  audio?: CutAudio;
  final: boolean;
  onComplete: () => void;
  onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    finish = useRef(final),
    callbacks = useRef({ onComplete, onFailure, onPrepared }),
    controller = useRef<(() => void) | null>(null);
  callbacks.current = { onComplete, onFailure, onPrepared };
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
      element.dataset.interactive = String(seconds >= INTRO_DURATION);
      audio?.update(seconds);
      dialog?.style.setProperty("--intro-menu", String(shot.menu));
      dialog?.style.setProperty(
        "--intro-reveal",
        `${(1 - Math.max(0, Math.min(1, shot.cut - 0.006))) * 100}%`,
      );
      element.dataset.state = shot.done ? "complete" : "playing";
    };
    const complete = () => {
      // A session-repeat request can arrive before async preparation. Retain it
      // in finish.current; never mark an unprepared scene done.
      if (abort.signal.aborted || done || !scene) return;
      cancelAnimationFrame(frame);
      frame = 0;
      elapsed = INTRO_DURATION;
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
    const loadTimeout = window.setTimeout(fail, 12000);
    const tick = (now: number) => {
      if (abort.signal.aborted) return;
      if (document.hidden) {
        frame = 0;
        last = 0;
        return;
      }
      if (!done && last) elapsed += (now - last) / 1000;
      last = now;
      // A stable 30 fps cadence divides common 60/120 Hz phone refresh rates.
      const fps = 30;
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
      if (document.hidden) {
        release();
        audio?.suspend();
      } else audio?.resume();
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
    let pointerId: number | null = null,
      capture: HTMLElement | null = null;
    let previousX = 0,
      previousY = 0,
      previousTime = 0;
    const wake = () => {
      if (
        scene &&
        (!done || scene.active()) &&
        !abort.signal.aborted &&
        !frame &&
        !document.hidden
      ) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const coordinates = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect();
      return {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height,
      };
    };
    const release = () => {
      const id = pointerId,
        node = capture;
      pointerId = null;
      capture = null;
      element.dataset.dragging = "";
      scene?.release();
      if (id !== null && node?.hasPointerCapture(id))
        node.releasePointerCapture(id);
      wake();
    };
    const pointerMove = (event: PointerEvent) => {
      if (!done || document.hidden || !scene) return;
      const point = coordinates(event);
      if (pointerId !== null) {
        if (event.pointerId !== pointerId) return;
        if (
          !capture?.hasPointerCapture(pointerId) ||
          (event.pointerType === "mouse" && event.buttons === 0)
        ) {
          release();
          return;
        }
        scene.pull(point.x, point.y);
        wake();
        return;
      }
      if (event.pointerType !== "mouse") return;
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-cloth-hit]",
      );
      if (!target) return;
      const dt = Math.max(10, event.timeStamp - previousTime);
      const speed = Math.min(
        1,
        Math.hypot(event.clientX - previousX, event.clientY - previousY) / dt,
      );
      previousX = event.clientX;
      previousY = event.clientY;
      previousTime = event.timeStamp;
      const sheet = scene.hover(point.x, point.y, speed);
      target.style.cursor = sheet ? "grab" : "default";
      if (sheet) wake();
    };
    const pointerDown = (event: PointerEvent) => {
      if (
        !done ||
        document.hidden ||
        !scene ||
        pointerId !== null ||
        !event.isPrimary ||
        event.button !== 0
      )
        return;
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-cloth-hit]",
      );
      if (!target) return;
      const point = coordinates(event),
        sheet = scene.grab(point.x, point.y);
      if (!sheet) return;
      pointerId = event.pointerId;
      capture = target;
      element.dataset.dragging = sheet;
      target.setPointerCapture(event.pointerId);
      wake();
    };
    const pointerEnd = (event: PointerEvent) => {
      if (event.pointerId === pointerId) release();
    };
    element.addEventListener("pointermove", pointerMove);
    element.addEventListener("pointerdown", pointerDown);
    element.addEventListener("pointerup", pointerEnd);
    element.addEventListener("pointercancel", pointerEnd);
    element.addEventListener("lostpointercapture", pointerEnd);
    window.addEventListener("blur", release);
    const contextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    document.addEventListener("visibilitychange", visibility);
    element.addEventListener("webglcontextlost", contextLost, true);
    const importStart = performance.now();
    void import("./create-reference-cloth")
      .then((module) => {
        element.dataset.importMs = String(performance.now() - importStart);
        return module.createCutScene(element, abort.signal);
      })
      .then((value) => {
        window.clearTimeout(loadTimeout);
        if (abort.signal.aborted) {
          value.dispose();
          return;
        }
        scene = value;
        callbacks.current.onPrepared();
        requestAnimationFrame(() => {
          if (!abort.signal.aborted) {
            element.dataset.firstShownNavigationMs = String(performance.now());
            element.dataset.firstShownMs = String(
              performance.now() - importStart,
            );
          }
        });
        observer = new ResizeObserver(() => {
          release();
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
      release();
      element.removeEventListener("pointermove", pointerMove);
      element.removeEventListener("pointerdown", pointerDown);
      element.removeEventListener("pointerup", pointerEnd);
      element.removeEventListener("pointercancel", pointerEnd);
      element.removeEventListener("lostpointercapture", pointerEnd);
      window.removeEventListener("blur", release);
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
    >
      <svg
        className="rrc-cloth-pointers"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path data-cloth-hit="top" className="rrc-cloth-hit" />
        <path data-cloth-hit="bottom" className="rrc-cloth-hit" />
      </svg>
    </div>
  );
}
