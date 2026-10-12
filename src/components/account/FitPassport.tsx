"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  measurements,
  measurementKeys,
  type MeasurementKey,
} from "@/lib/measurements";
import type { AccountProfile } from "@/lib/account-schema";
const BodyModel = dynamic(() => import("./BodyModel"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[420px] sm:h-[520px] border border-rrc-line"
      aria-busy="true"
    />
  ),
});
export function FitPassport({
  values,
  onChange,
  ru,
}: {
  values: AccountProfile["measurements"];
  onChange: (values: AccountProfile["measurements"]) => void;
  ru: boolean;
}) {
  const [selected, setSelected] = useState<MeasurementKey>("chest");
  const selectedIndex = measurementKeys.indexOf(selected);
  const current = measurements[selected];
  const unit = current.unit === "kg" ? (ru ? "кг" : "kg") : ru ? "см" : "cm";
  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
      <div className="min-w-0">
        <BodyModel selected={selected} value={values[selected]} ru={ru} />
        <div
          className="mt-5 border-l-2 border-[#efb7a0] pl-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex flex-wrap justify-between gap-3">
            <h3 className="font-display text-sm">
              {ru ? current.ru : current.en}
            </h3>
            <span className="text-sm tabular-nums text-[#efb7a0]">
              {values[selected] ?? "—"} {unit}
            </span>
          </div>
          <p
            className="mt-3 text-xs leading-relaxed text-rrc-silver"
            id="measurement-instruction"
          >
            {ru ? current.ruHelp : current.enHelp}
          </p>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-rrc-off">
          {ru
            ? "Схематичный манекен показывает место измерения. Его форма не рассчитывается по вашим данным. Лента должна прилегать к телу без натяжения."
            : "This schematic mannequin shows where to measure. Its shape is not calculated from your data. Keep the tape against your body without pulling it tight."}
        </p>
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-4 sm:hidden">
          <button
            type="button"
            onClick={() =>
              setSelected(
                measurementKeys[
                  (selectedIndex - 1 + measurementKeys.length) %
                    measurementKeys.length
                ],
              )
            }
            className="min-h-11 min-w-11 border border-white/10"
            aria-label={ru ? "Предыдущая мерка" : "Previous measurement"}
          >
            ←
          </button>
          <span className="text-[11px] text-rrc-off tabular-nums">
            {selectedIndex + 1} / {measurementKeys.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setSelected(
                measurementKeys[(selectedIndex + 1) % measurementKeys.length],
              )
            }
            className="min-h-11 border border-white/10 px-4 text-xs"
          >
            {ru ? "Следующая мерка" : "Next measurement"} →
          </button>
        </div>
        <p className="text-xs text-rrc-off mb-4">
          {ru
            ? "Выберите мерку, чтобы увидеть её на модели. Поля необязательны."
            : "Select a measurement to locate it on the model. All fields are optional."}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {measurementKeys.map((key) => {
            const m = measurements[key];
            return (
              <div
                key={key}
                className={`border p-3 transition-colors rounded-[2px] ${selected === key ? "border-[#925164] bg-[#21181b]" : "border-rrc-line"}`}
              >
                <div className="flex gap-2 justify-between items-start">
                  <button
                    type="button"
                    onClick={() => setSelected(key)}
                    aria-pressed={selected === key}
                    className="text-left text-xs min-h-11 hover:text-[#efb7a0]"
                    aria-controls="measurement-instruction"
                  >
                    {ru ? m.ru : m.en}
                  </button>
                  <span className="text-[10px] text-rrc-off pt-3">
                    {m.unit === "kg" ? (ru ? "кг" : "kg") : ru ? "см" : "cm"}
                  </span>
                </div>
                <label className="sr-only" htmlFor={`measure-${key}`}>
                  {ru ? m.ru : m.en}
                </label>
                <input
                  id={`measure-${key}`}
                  name={key}
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={m.min}
                  max={m.max}
                  value={values[key] ?? ""}
                  onFocus={() => setSelected(key)}
                  onChange={(e) =>
                    onChange({
                      ...values,
                      [key]:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="w-full bg-transparent border-b border-rrc-line py-2 text-base tabular-nums focus:outline-none focus:border-[#efb7a0]"
                  placeholder="—"
                  aria-describedby={
                    selected === key ? "measurement-instruction" : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
