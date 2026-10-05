import type { ReactNode } from "react";
import type { LayerKind } from "@/lib/burgerLayers";

/**
 * Illustrated burger layers.
 *
 * Every layer is drawn in a shared 240-unit-wide coordinate space, seen from
 * slightly above. Local y = 0 is the centre line of the layer's top face;
 * `t` is how far down the next layer rests. `top`/`bottom` are the visual
 * extents above/below that line (used for layout and label placement).
 */

export const VB_W = 240;
const CX = 120;

export interface LayerSpec {
  t: number;
  top: number;
  bottom: number;
  /** Vertical offset of the label from the layer's centre line. */
  labelDy: number;
  render: (id: (name: string) => string) => ReactNode;
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Side band of a short cylinder (drawn under its top ellipse). */
const cylSide = (rx: number, ry: number, h: number, cx = CX) =>
  `M ${cx - rx} 0 L ${cx - rx} ${h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${h} L ${cx + rx} 0 Z`;

/** Closed ellipse outline with a sinusoidal ruffle (lettuce, sauce...). */
function wavyEllipse(
  rx: number,
  ry: number,
  waves: number,
  amp: number,
  phase = 0,
  cx = CX,
  cy = 0,
): string {
  const steps = waves * 4;
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const f = 1 + amp * Math.sin(waves * a + phase);
    pts.push([cx + rx * f * Math.cos(a), cy + ry * f * Math.sin(a)]);
  }
  // Smooth closed curve through midpoints.
  const mid = (p: [number, number], q: [number, number]) =>
    [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
  const start = mid(pts[pts.length - 1], pts[0]);
  let d = `M ${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % pts.length]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + " Z";
}

/** Contact shadow cast on the layer below. */
const Shadow = ({
  id,
  y,
  rx = 104,
  ry = 16,
}: {
  id: (n: string) => string;
  y: number;
  rx?: number;
  ry?: number;
}) => (
  <ellipse cx={CX} cy={y} rx={rx} ry={ry} fill={`url(#${id("shadow")})`} />
);

/** Liquid sauce sheet with drips over the front edge. */
function sauceLayer(base: string, light: string, edge: string): LayerSpec {
  const drips = [
    [52, 10, 9],
    [88, 13, 13],
    [140, 14, 10],
    [178, 11, 14],
  ];
  return {
    t: 3,
    top: 14,
    bottom: 26,
    labelDy: 2,
    render: (id) => (
      <g>
        <Shadow id={id} y={6} rx={98} ry={13} />
        <path d={wavyEllipse(100, 14, 9, 0.05, 0.6, CX, 2)} fill={edge} />
        <path d={wavyEllipse(100, 14, 9, 0.05, 0.6)} fill={base} />
        {drips.map(([x, y, len]) => (
          <path
            key={x}
            d={`M ${x - 6} ${y - 2} Q ${x - 5} ${y + len} ${x} ${y + len} Q ${x + 5} ${y + len} ${x + 6} ${y - 2} Z`}
            fill={base}
          />
        ))}
        <ellipse cx={96} cy={-4} rx={34} ry={4} fill={light} opacity={0.7} />
        <ellipse cx={152} cy={2} rx={18} ry={2.5} fill={light} opacity={0.6} />
      </g>
    ),
  };
}

/** Cheese slice seen corner-on, with drips. */
function cheeseSheet(base: string, edge: string, light: string): LayerSpec {
  return {
    t: 3,
    top: 20,
    bottom: 30,
    labelDy: 2,
    render: (id) => (
      <g>
        <Shadow id={id} y={8} rx={100} ry={14} />
        {/* thickness */}
        <path
          d="M 6 5 Q 60 -12 120 -15 Q 180 -12 234 5 Q 180 20 120 26 Q 60 20 6 5 Z"
          fill={edge}
        />
        <path
          d="M 6 2 Q 60 -15 120 -18 Q 180 -15 234 2 Q 180 17 120 23 Q 60 17 6 2 Z"
          fill={base}
        />
        {[
          [120, 22, 12],
          [64, 16, 9],
          [178, 15, 11],
          [20, 6, 7],
        ].map(([x, y, len]) => (
          <path
            key={x}
            d={`M ${x - 7} ${y - 3} Q ${x - 6} ${y + len} ${x} ${y + len} Q ${x + 6} ${y + len} ${x + 7} ${y - 3} Z`}
            fill={base}
          />
        ))}
        <path
          d="M 40 -2 Q 90 -14 150 -12"
          stroke={light}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
      </g>
    ),
  };
}

/** Scattered small round slices (pickles, jalapeño, cucumber). */
function slices(
  positions: [number, number][],
  rx: number,
  ry: number,
  rind: string,
  flesh: string,
  seed: string,
  edge: string,
): LayerSpec {
  return {
    t: 4,
    top: 12,
    bottom: 18,
    labelDy: 2,
    render: (id) => (
      <g>
        <Shadow id={id} y={6} rx={92} ry={12} />
        {positions.map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y + 2.5} rx={rx} ry={ry} fill={edge} />
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={rind} />
            <ellipse
              cx={x}
              cy={y}
              rx={rx * 0.72}
              ry={ry * 0.68}
              fill={flesh}
            />
            <ellipse
              cx={x}
              cy={y}
              rx={rx * 0.32}
              ry={ry * 0.3}
              fill={seed}
              opacity={0.85}
            />
          </g>
        ))}
      </g>
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Layer catalogue                                                     */
/* ------------------------------------------------------------------ */

const SESAME: [number, number, number][] = [
  [70, -36, -20],
  [100, -45, 10],
  [134, -47, -5],
  [164, -39, 25],
  [84, -22, 30],
  [118, -29, -15],
  [150, -23, 10],
  [188, -24, -30],
  [54, -17, 15],
  [104, -12, 5],
  [138, -10, -20],
  [176, -8, 15],
];

const bunTop: LayerSpec = {
  t: 4,
  top: 58,
  bottom: 18,
  labelDy: -26,
  render: (id) => (
    <g>
      <Shadow id={id} y={10} rx={104} ry={16} />
      <path
        d="M 16 2 C 16 -40 58 -56 120 -56 C 182 -56 224 -40 224 2 A 104 15 0 0 1 16 2 Z"
        fill={`url(#${id("bun")})`}
      />
      <path
        d="M 16 2 A 104 15 0 0 0 224 2"
        stroke="#9E5418"
        strokeWidth={2.5}
        fill="none"
        opacity={0.55}
      />
      <ellipse
        cx={90}
        cy={-36}
        rx={40}
        ry={11}
        fill="#FFF3D6"
        opacity={0.28}
        transform="rotate(-10 90 -36)"
      />
      {SESAME.map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx={4.2}
          ry={2.2}
          fill="#FFF1CF"
          stroke="#E0B064"
          strokeWidth={0.6}
          transform={`rotate(${r} ${x} ${y})`}
        />
      ))}
    </g>
  ),
};

const bunBottom: LayerSpec = {
  t: 24,
  top: 15,
  bottom: 42,
  labelDy: 12,
  render: (id) => (
    <g>
      <ellipse cx={CX} cy={44} rx={110} ry={14} fill={`url(#${id("shadow")})`} />
      <path d={cylSide(100, 15, 24)} fill={`url(#${id("bunSide")})`} />
      <ellipse cx={CX} cy={0} rx={100} ry={15} fill="#F6D7A0" />
      <ellipse cx={CX} cy={1} rx={86} ry={11} fill="#EFC27C" />
      <ellipse cx={CX} cy={1} rx={60} ry={7} fill="#F3CD8E" opacity={0.6} />
    </g>
  ),
};

const ciabattaTop: LayerSpec = {
  t: 4,
  top: 42,
  bottom: 16,
  labelDy: -18,
  render: (id) => (
    <g>
      <Shadow id={id} y={9} rx={108} ry={15} />
      <path
        d="M 10 2 C 8 -26 40 -40 120 -40 C 200 -40 232 -26 230 2 A 110 14 0 0 1 10 2 Z"
        fill={`url(#${id("ciabatta")})`}
      />
      <path
        d="M 10 2 A 110 14 0 0 0 230 2"
        stroke="#9C6A35"
        strokeWidth={2.5}
        fill="none"
        opacity={0.5}
      />
      {[
        "M 58 -24 Q 80 -32 104 -28",
        "M 120 -32 Q 146 -36 170 -28",
        "M 86 -12 Q 112 -18 140 -14",
      ].map((d) => (
        <path
          key={d}
          d={d}
          stroke="#B88145"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
        />
      ))}
      {[
        [66, -30],
        [92, -36],
        [150, -34],
        [182, -24],
        [124, -22],
        [48, -14],
        [200, -12],
        [104, -8],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.2} fill="#FFF8EA" opacity={0.75} />
      ))}
    </g>
  ),
};

const ciabattaBottom: LayerSpec = {
  t: 18,
  top: 14,
  bottom: 36,
  labelDy: 9,
  render: (id) => (
    <g>
      <ellipse cx={CX} cy={36} rx={114} ry={13} fill={`url(#${id("shadow")})`} />
      <path d={cylSide(106, 14, 18)} fill="#C98F50" />
      <ellipse cx={CX} cy={0} rx={106} ry={14} fill="#F3DDB4" />
      {[
        [80, -2],
        [112, 3],
        [150, -3],
        [176, 2],
        [60, 3],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={6} ry={2.4} fill="#E2C38F" />
      ))}
    </g>
  ),
};

const patty: LayerSpec = {
  t: 22,
  top: 16,
  bottom: 40,
  labelDy: 11,
  render: (id) => (
    <g>
      <Shadow id={id} y={30} rx={106} ry={16} />
      <path d={cylSide(102, 16, 22)} fill={`url(#${id("patty")})`} />
      <path
        d={wavyEllipse(102, 16, 14, 0.015, 0, CX, 22)}
        fill="none"
        stroke="#2E150B"
        strokeWidth={1.5}
        opacity={0.5}
      />
      <ellipse cx={CX} cy={0} rx={102} ry={16} fill="#713A21" />
      {[-56, -18, 22, 60].map((dx) => (
        <path
          key={dx}
          d={`M ${CX + dx - 14} -8 L ${CX + dx + 14} 8`}
          stroke="#3A1B0E"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
      {[
        [62, 2],
        [96, -6],
        [146, 4],
        [182, -3],
        [120, 9],
        [80, 8],
        [160, -9],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill="#9A5530" />
      ))}
      <ellipse cx={92} cy={-6} rx={26} ry={3} fill="#C47A4F" opacity={0.35} />
    </g>
  ),
};

const chicken: LayerSpec = {
  t: 16,
  top: 15,
  bottom: 32,
  labelDy: 8,
  render: (id) => (
    <g>
      <Shadow id={id} y={24} rx={104} ry={15} />
      <path
        d={wavyEllipse(100, 15, 7, 0.04, 1, CX, 16)}
        fill="#B5702C"
      />
      <path d={cylSide(98, 15, 16)} fill="#C98538" />
      <path d={wavyEllipse(100, 15, 7, 0.04, 1)} fill="#E3A552" />
      {[-60, -20, 20, 60].map((dx) => (
        <path
          key={dx}
          d={`M ${CX + dx - 12} -8 L ${CX + dx + 12} 8`}
          stroke="#8C5226"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.7}
        />
      ))}
      <ellipse cx={96} cy={-5} rx={28} ry={3} fill="#F6C982" opacity={0.6} />
    </g>
  ),
};

const lettuce: LayerSpec = {
  t: 6,
  top: 20,
  bottom: 24,
  labelDy: 3,
  render: (id) => (
    <g>
      <Shadow id={id} y={9} rx={104} ry={14} />
      <path d={wavyEllipse(112, 17, 13, 0.07, 0, CX, 5)} fill="#4A8E28" />
      <path d={wavyEllipse(112, 17, 13, 0.07)} fill="#78BE42" />
      <path d={wavyEllipse(92, 12, 11, 0.08, 1.2, CX, -2)} fill="#9AD35E" />
      {[
        "M 120 -10 Q 90 -2 60 2",
        "M 120 -10 Q 150 -2 184 2",
        "M 120 -10 L 120 8",
      ].map((d) => (
        <path
          key={d}
          d={d}
          stroke="#C9EE95"
          strokeWidth={1.6}
          fill="none"
          opacity={0.8}
        />
      ))}
    </g>
  ),
};

const tomato: LayerSpec = {
  t: 7,
  top: 14,
  bottom: 20,
  labelDy: 3,
  render: (id) => (
    <g>
      <Shadow id={id} y={8} rx={96} ry={13} />
      {[
        [72, -3],
        [168, -3],
        [120, 4],
      ].map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y + 5} rx={40} ry={10} fill="#A51E16" />
          <rect x={x - 40} y={y} width={80} height={5} fill="#A51E16" />
          <ellipse cx={x} cy={y} rx={40} ry={10} fill="#E3372A" />
          <ellipse cx={x} cy={y} rx={31} ry={7.4} fill="#F2655A" />
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k / 6) * Math.PI * 2;
            return (
              <ellipse
                key={k}
                cx={x + Math.cos(a) * 18}
                cy={y + Math.sin(a) * 4.2}
                rx={3.4}
                ry={1.6}
                fill="#FFD9A8"
              />
            );
          })}
          <ellipse cx={x} cy={y} rx={7} ry={2} fill="#F79A8E" />
        </g>
      ))}
    </g>
  ),
};

const onion: LayerSpec = {
  t: 4,
  top: 12,
  bottom: 16,
  labelDy: 2,
  render: (id) => (
    <g>
      <Shadow id={id} y={6} rx={90} ry={12} />
      {(
        [
          [80, -3, 28, 7.5],
          [150, -4, 32, 8],
          [176, 4, 18, 5],
          [116, 4, 26, 6.5],
          [58, 5, 16, 4.5],
        ] as const
      ).map(([x, y, rx, ry], i) => (
        <g key={i} fill="none">
          <ellipse cx={x} cy={y} rx={rx} ry={ry} stroke="#B57AC4" strokeWidth={4.5} />
          <ellipse cx={x} cy={y} rx={rx} ry={ry} stroke="#F7EEF9" strokeWidth={2} />
          <ellipse
            cx={x}
            cy={y}
            rx={rx * 0.62}
            ry={ry * 0.6}
            stroke="#E2C6EA"
            strokeWidth={2}
          />
        </g>
      ))}
    </g>
  ),
};

const scallion: LayerSpec = {
  t: 3,
  top: 10,
  bottom: 14,
  labelDy: 1,
  render: (id) => (
    <g>
      <Shadow id={id} y={5} rx={88} ry={11} />
      {[
        [50, 0],
        [70, -6],
        [92, 3],
        [104, -8],
        [126, 1],
        [146, -6],
        [160, 5],
        [180, -2],
        [196, 3],
        [84, -1],
        [138, 7],
        [116, -3],
        [64, 6],
        [172, -8],
      ].map(([x, y], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx={5.5}
          ry={3}
          fill="#E3F4C9"
          stroke="#5DA33E"
          strokeWidth={2.2}
        />
      ))}
    </g>
  ),
};

const pickles = slices(
  [
    [62, -3],
    [98, -6],
    [140, -5],
    [178, -2],
    [82, 5],
    [124, 5],
    [162, 6],
  ],
  17,
  7,
  "#8DAF38",
  "#B9D26A",
  "#E2EDB0",
  "#5F7A22",
);

const cucumber = slices(
  [
    [66, -2],
    [108, -5],
    [152, -4],
    [184, 3],
    [88, 6],
    [130, 6],
  ],
  20,
  8,
  "#4C8A2C",
  "#DDF2B8",
  "#BFE08A",
  "#356A1D",
);

const jalapeno = slices(
  [
    [58, 0],
    [84, -6],
    [112, 2],
    [140, -6],
    [166, 1],
    [190, -3],
    [98, 8],
    [154, 8],
  ],
  13,
  6,
  "#3A8A2A",
  "#D7E8A4",
  "#F6F2D2",
  "#24601A",
);

const paprika: LayerSpec = {
  t: 5,
  top: 14,
  bottom: 18,
  labelDy: 2,
  render: (id) => (
    <g>
      <Shadow id={id} y={7} rx={94} ry={12} />
      {[
        "M 30 2 Q 50 -14 92 -8 Q 104 0 90 8 Q 56 14 30 2 Z",
        "M 96 -6 Q 128 -16 160 -8 Q 170 2 154 9 Q 118 14 98 6 Z",
        "M 150 -2 Q 186 -12 212 0 Q 214 10 192 12 Q 162 12 150 -2 Z",
      ].map((d) => (
        <g key={d}>
          <path d={d} fill="#8E1E12" transform="translate(0 3)" />
          <path d={d} fill="#CC3420" />
        </g>
      ))}
      {[
        [60, -4],
        [72, 3],
        [130, -6],
        [142, 4],
        [186, -2],
        [198, 6],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={6} ry={2.4} fill="#4A140B" opacity={0.55} />
      ))}
    </g>
  ),
};

const bacon: LayerSpec = {
  t: 6,
  top: 14,
  bottom: 20,
  labelDy: 2,
  render: (id) => (
    <g>
      <Shadow id={id} y={8} rx={98} ry={13} />
      {[
        "M 24 -6 C 60 -16 88 2 120 -6 S 184 -14 216 -4",
        "M 20 4 C 56 -6 90 12 122 2 S 186 -4 222 6",
        "M 40 12 C 72 4 100 18 130 10 S 180 6 204 14",
      ].map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={d} stroke="#7A2616" strokeWidth={10} transform="translate(0 2.5)" />
          <path d={d} stroke="#B9452F" strokeWidth={10} />
          <path d={d} stroke="#F2B49B" strokeWidth={2.6} opacity={0.9} />
        </g>
      ))}
    </g>
  ),
};

const basil: LayerSpec = {
  t: 5,
  top: 14,
  bottom: 16,
  labelDy: 2,
  render: (id) => (
    <g>
      <Shadow id={id} y={6} rx={92} ry={12} />
      {[
        [62, 0, -20],
        [96, -6, 15],
        [132, 2, -10],
        [166, -5, 25],
        [190, 4, -30],
        [112, 8, 40],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path
            d={`M ${x - 18} ${y} Q ${x} ${y - 11} ${x + 18} ${y} Q ${x} ${y + 11} ${x - 18} ${y} Z`}
            fill="#2F7A2E"
            transform="translate(0 2)"
          />
          <path
            d={`M ${x - 18} ${y} Q ${x} ${y - 11} ${x + 18} ${y} Q ${x} ${y + 11} ${x - 18} ${y} Z`}
            fill="#4FA246"
          />
          <path
            d={`M ${x - 14} ${y} L ${x + 14} ${y}`}
            stroke="#2C6A28"
            strokeWidth={1.2}
          />
        </g>
      ))}
    </g>
  ),
};

const caramelOnion: LayerSpec = {
  t: 6,
  top: 14,
  bottom: 18,
  labelDy: 2,
  render: (id) => (
    <g>
      <Shadow id={id} y={8} rx={94} ry={13} />
      <path d={wavyEllipse(92, 13, 10, 0.06, 0.4, CX, 3)} fill="#7A3F12" />
      <path d={wavyEllipse(92, 13, 10, 0.06, 0.4)} fill="#A9611F" />
      {[
        "M 40 0 q 10 -10 20 0 t 20 0 t 20 0",
        "M 100 -6 q 10 -10 20 0 t 20 0 t 20 0",
        "M 70 6 q 10 -8 20 0 t 20 0 t 20 0 t 20 0",
        "M 140 4 q 10 -9 20 0 t 20 0",
        "M 60 -8 q 8 -6 16 0 t 16 0",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={i % 2 ? "#D48C3D" : "#E6A65A"}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </g>
  ),
};

const mushroom: LayerSpec = {
  t: 8,
  top: 16,
  bottom: 22,
  labelDy: 3,
  render: (id) => (
    <g>
      <Shadow id={id} y={10} rx={98} ry={14} />
      <path d={wavyEllipse(98, 14, 9, 0.05, 0.2, CX, 3)} fill="#4E2A16" />
      <path d={wavyEllipse(98, 14, 9, 0.05, 0.2)} fill="#7A4A2A" />
      {[
        [66, -2, -10],
        [104, -7, 8],
        [142, -3, -6],
        [178, 2, 12],
        [88, 7, 4],
        [128, 8, -8],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path
            d={`M ${x - 16} ${y + 2} Q ${x - 16} ${y - 12} ${x} ${y - 12} Q ${x + 16} ${y - 12} ${x + 16} ${y + 2} L ${x + 5} ${y + 2} L ${x + 5} ${y + 7} L ${x - 5} ${y + 7} L ${x - 5} ${y + 2} Z`}
            fill="#DDBA94"
            stroke="#9C7350"
            strokeWidth={1.4}
          />
          <path
            d={`M ${x - 11} ${y} Q ${x} ${y - 7} ${x + 11} ${y}`}
            stroke="#B48D68"
            strokeWidth={1.2}
            fill="none"
          />
        </g>
      ))}
      <ellipse cx={100} cy={-6} rx={24} ry={2.5} fill="#A87150" opacity={0.6} />
    </g>
  ),
};

const whiteCheese: LayerSpec = {
  t: 5,
  top: 14,
  bottom: 18,
  labelDy: 2,
  render: (id) => (
    <g>
      <Shadow id={id} y={7} rx={94} ry={12} />
      {[
        "M 34 0 Q 40 -12 62 -10 Q 76 -4 70 6 Q 52 12 34 0 Z",
        "M 76 -6 Q 90 -16 112 -12 Q 122 -4 112 4 Q 90 8 76 -6 Z",
        "M 118 -10 Q 140 -18 162 -10 Q 166 0 150 4 Q 126 4 118 -10 Z",
        "M 164 -4 Q 186 -12 204 -2 Q 206 8 188 10 Q 168 8 164 -4 Z",
        "M 72 6 Q 92 0 112 6 Q 114 14 94 16 Q 74 14 72 6 Z",
        "M 120 6 Q 142 -1 164 6 Q 162 14 142 16 Q 122 14 120 6 Z",
      ].map((d) => (
        <g key={d}>
          <path d={d} fill="#DCD2B8" transform="translate(0 3)" />
          <path d={d} fill="#FBF7EC" />
        </g>
      ))}
      {[
        [56, -3],
        [98, -6],
        [142, -8],
        [186, 0],
        [92, 9],
        [144, 9],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={3} ry={1.4} fill="#E8DEC4" />
      ))}
    </g>
  ),
};

export const LAYER_SPECS: Record<LayerKind, LayerSpec> = {
  bunTop,
  bunBottom,
  ciabattaTop,
  ciabattaBottom,
  patty,
  chicken,
  cheddar: cheeseSheet("#FFC531", "#E09A12", "#FFE38A"),
  smokedCheese: cheeseSheet("#E59E45", "#A9611F", "#F7C886"),
  whiteCheese,
  lettuce,
  tomato,
  onion,
  caramelOnion,
  scallion,
  pickles,
  cucumber,
  jalapeno,
  paprika,
  bacon,
  basil,
  mushroom,
  sauceBurger: sauceLayer("#EE8448", "#F8B78A", "#C9612C"),
  sauceGarlic: sauceLayer("#F3EAD3", "#FFFFFF", "#D5C7A4"),
  sauceMango: sauceLayer("#F39A22", "#FCCB72", "#C8700E"),
  sauce: sauceLayer("#DE5A35", "#F4977A", "#A93C1E"),
};

/** Shared gradients. `id` namespaces them per SVG instance. */
export const LayerDefs = ({ id }: { id: (n: string) => string }) => (
  <defs>
    <linearGradient id={id("bun")} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F7C46A" />
      <stop offset="0.55" stopColor="#E0913A" />
      <stop offset="1" stopColor="#B4621E" />
    </linearGradient>
    <linearGradient id={id("bunSide")} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#E6A048" />
      <stop offset="1" stopColor="#A9581A" />
    </linearGradient>
    <linearGradient id={id("ciabatta")} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#EECB92" />
      <stop offset="1" stopColor="#C28A4C" />
    </linearGradient>
    <linearGradient id={id("patty")} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#5E2E1A" />
      <stop offset="1" stopColor="#341A0F" />
    </linearGradient>
    <radialGradient id={id("shadow")}>
      <stop offset="0" stopColor="#000" stopOpacity="0.45" />
      <stop offset="0.7" stopColor="#000" stopOpacity="0.12" />
      <stop offset="1" stopColor="#000" stopOpacity="0" />
    </radialGradient>
  </defs>
);
