"use client";

import { useMemo } from "react";

interface WaveformTraceProps {
  /** Декодированные Broadlink-тайминги (в единицах ~32.8 μs). */
  timings: number[] | null;
  /** Дополнительный класс контейнера */
  className?: string;
}

/**
 * Signature-элемент: миниатюрная осциллограмма IR-импульсного поезда.
 * Первый тайминг — mark (ON), второй — space (OFF), чередование до конца.
 * Стандартная OpenIR/NEC-соглашение для Broadlink-фрейма.
 *
 * SVG растягивается preserveAspectRatio=none по всей ширине контейнера,
 * что даёт мгновенное узнавание формы сигнала независимо от длины.
 */
export default function WaveformTrace({ timings, className }: WaveformTraceProps) {
  const { path, edges, totalUnits } = useMemo(() => {
    if (!timings || timings.length === 0) {
      return { path: "", edges: 0, totalUnits: 0 };
    }
    // Виртуальные координаты: X — суммарное время в единицах, Y ∈ [0, 100].
    // Mark на y=15, space на y=85. Линия — 1px в SVG-пространстве, но за
    // счёт vector-effect не масштабируется по толщине.
    const HI = 15;
    const LO = 85;
    let x = 0;
    let level = HI; // фрейм всегда начинается с mark
    const segments: string[] = [`M 0 ${HI}`];
    for (let i = 0; i < timings.length; i++) {
      const t = timings[i];
      x += t;
      // Горизонтальный ход текущего уровня:
      segments.push(`L ${x} ${level}`);
      // Смена уровня на границе (кроме последнего сегмента):
      if (i < timings.length - 1) {
        const next = level === HI ? LO : HI;
        segments.push(`L ${x} ${next}`);
        level = next;
      }
    }
    return {
      path: segments.join(" "),
      edges: timings.length,
      totalUnits: x,
    };
  }, [timings]);

  if (!timings || timings.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-baseline gap-2">
          <span className="label">Trace</span>
          <span className="label text-[color:var(--color-text-dim)]">idle</span>
        </div>
        <div
          className="mt-1 h-14 border border-dashed"
          style={{ borderColor: "var(--color-rule)" }}
        />
      </div>
    );
  }

  // ≈ единица = 269/8192 ms → 32.8 μs. Полное время в мс — для читаемости.
  const totalMs = ((totalUnits * 269) / 8192 / 1000).toFixed(1);

  return (
    <div className={className}>
      <div className="flex items-baseline gap-3">
        <span className="label" style={{ color: "var(--color-amber)" }}>
          Trace
        </span>
        <span className="label">{edges} edges</span>
        <span className="label">{totalMs} ms</span>
      </div>
      <div
        className="mt-1 h-14 border relative overflow-hidden"
        style={{
          borderColor: "var(--color-rule)",
          background:
            "linear-gradient(0deg, transparent 49.5%, var(--color-rule) 49.5%, var(--color-rule) 50.5%, transparent 50.5%)",
        }}
      >
        <svg
          viewBox={`0 0 ${totalUnits} 100`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <path
            d={path}
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    </div>
  );
}
