"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {markPrivateEntry} from "./PrivateSessionProvider";
import { useLanguage } from "@/i18n";
export function PrivateCodeForm({
  onSuccess,
  path = "/private",
  ru: ruOverride,
  variant = "standalone",
}: {
  variant?: "standalone" | "overlay";
  onSuccess?: () => void;
  path?: string;
  ru?: boolean;
}) {
  const { language } = useLanguage();
  const ru = ruOverride ?? language === "ru";
  const router = useRouter();
  const [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      {variant === "standalone" && (
        <>
          <p className="text-[10px] tracking-[.3em] text-rrc-off mb-4">
            PRIVATE ACCESS
          </p>
          <h1 className="font-display text-2xl sm:text-3xl mb-5">
            PRIVATE ACCESS
          </h1>
          <p className="text-sm leading-relaxed text-rrc-off mb-8">
            {ru
              ? "Отдельный вход по коду доступа. Регистрация в личном кабинете не требуется."
              : "A separate entrance with an access code. A personal account is not required."}
          </p>
        </>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/private-access/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });
            if (!response.ok) {
              setError(
                response.status === 401
                  ? ru
                    ? "Код не подошёл. Проверьте и повторите."
                    : "The code did not match. Please try again."
                  : response.status === 429
                    ? ru
                      ? "Слишком много попыток. Подождите минуту."
                      : "Too many attempts. Wait a minute."
                    : ru
                      ? "Вход временно недоступен. Повторите позже."
                      : "Access is temporarily unavailable.",
              );
              return;
            }
            setCode("");
            markPrivateEntry();
                onSuccess?.();
            router.push(path==='/private'||path.startsWith("/private/") ? path : "/private");
            router.refresh();
          } catch {
            setError(
              ru
                ? "Не удалось соединиться. Повторите."
                : "Connection failed. Try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-4"
      >
        <label className="block text-xs text-rrc-off">
          {ru ? "Код доступа" : "Access code"}
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            required
            maxLength={100}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="block w-full bg-black border border-white/20 px-4 py-4 mt-2 text-white focus:border-white"
          />
        </label>
        <button
          disabled={busy}
          className="min-h-12 w-full border border-white/30 text-xs tracking-widest uppercase hover:bg-white/10 disabled:opacity-50"
        >
          {busy
            ? ru
              ? "Проверяем…"
              : "Checking…"
            : ru
              ? "Войти"
              : "Enter"}
        </button>
        {error && (
          <p role="alert" className="text-xs text-rrc-off">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
