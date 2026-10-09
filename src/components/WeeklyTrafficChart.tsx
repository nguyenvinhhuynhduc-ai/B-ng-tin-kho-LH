import { useState } from 'react';
import type { DayTraffic } from '../types';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Hình học của biểu đồ (viewBox cố định, co giãn theo bề ngang màn hình).
const W = 340;
const H = 200;
const PAD = { l: 30, r: 12, t: 14, b: 40 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;
const COLOR_VAO = '#F97316';
const COLOR_RA = '#16A34A';

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayLabel(iso: string) {
  const d = parseDate(iso);
  return {
    weekday: WEEKDAYS[d.getDay()],
    short: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
  };
}

/** Trục Y luôn là số nguyên: 4 khoảng bằng nhau, tối thiểu 0–4. */
function yAxis(maxValue: number): { step: number; max: number } {
  const step = Math.max(1, Math.ceil(maxValue / 4));
  return { step, max: step * 4 };
}

interface Props {
  data: DayTraffic[];
}

/** Biểu đồ đường: lượng xe vào (cam) và xe ra (xanh lá) theo ngày. Chạm vào một ngày để xem số liệu. */
export function WeeklyTrafficChart({ data }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const n = data.length;
  if (n === 0) return null;

  const selected = picked ?? n - 1;
  const { step, max } = yAxis(Math.max(0, ...data.flatMap((d) => [d.vao, d.ra])));

  const x = (i: number) => (n === 1 ? PAD.l + PLOT_W / 2 : PAD.l + (PLOT_W * i) / (n - 1));
  const y = (v: number) => PAD.t + PLOT_H - (v / max) * PLOT_H;
  const points = (key: 'vao' | 'ra') => data.map((d, i) => `${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');

  const totalVao = data.reduce((s, d) => s + d.vao, 0);
  const totalRa = data.reduce((s, d) => s + d.ra, 0);
  const sel = data[selected];
  const selLabel = dayLabel(sel.date);
  const colW = n === 1 ? PLOT_W : PLOT_W / (n - 1);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_VAO }} />
          Xe vào ({totalVao})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_RA }} />
          Xe ra ({totalRa})
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-manipulation select-none"
        role="img"
        aria-label={`Biểu đồ lượng xe vào và ra trong ${n} ngày gần nhất. Tổng xe vào ${totalVao}, tổng xe ra ${totalRa}.`}
      >
        {/* lưới ngang + nhãn trục Y */}
        {[0, 1, 2, 3, 4].map((k) => {
          const v = step * k;
          return (
            <g key={k}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-gray-200" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(v) + 3.5} textAnchor="end" className="fill-gray-400" fontSize={10}>
                {v}
              </text>
            </g>
          );
        })}

        {/* đường chỉ ngày đang chọn */}
        <line
          x1={x(selected)}
          x2={x(selected)}
          y1={PAD.t}
          y2={PAD.t + PLOT_H}
          className="stroke-gray-300"
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        <polyline points={points('vao')} fill="none" stroke={COLOR_VAO} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={points('ra')} fill="none" stroke={COLOR_RA} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.vao)} r={i === selected ? 5 : 3.5} fill="#fff" stroke={COLOR_VAO} strokeWidth={2} />
            <circle cx={x(i)} cy={y(d.ra)} r={i === selected ? 5 : 3.5} fill="#fff" stroke={COLOR_RA} strokeWidth={2} />
            <text
              x={x(i)}
              y={H - 22}
              textAnchor="middle"
              fontSize={11}
              className={i === selected ? 'fill-green-700' : 'fill-gray-500'}
              fontWeight={i === selected ? 700 : 500}
            >
              {dayLabel(d.date).weekday}
            </text>
            <text x={x(i)} y={H - 9} textAnchor="middle" fontSize={9} className="fill-gray-400">
              {dayLabel(d.date).short}
            </text>
            {/* vùng chạm rộng cho ngón tay */}
            <rect
              x={x(i) - colW / 2}
              y={PAD.t}
              width={colW}
              height={H - PAD.t}
              fill="transparent"
              onClick={() => setPicked(i)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}
      </svg>

      <div className="mt-2 rounded-2xl bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
        <span className="font-bold text-gray-800">
          {selected === n - 1 ? 'Hôm nay' : selLabel.weekday} · {selLabel.short}
        </span>
        <span className="mx-2 text-gray-300">|</span>
        Xe vào <b className="text-orange-500">{sel.vao}</b>
        <span className="mx-2 text-gray-300">·</span>
        Xe ra <b className="text-green-600">{sel.ra}</b>
      </div>
    </div>
  );
}
