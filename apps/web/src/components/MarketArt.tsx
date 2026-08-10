// Artwork for the market picker cards.
//
// ⚠️ These are FLAGS, not maps — deliberately.
//
// Maps of China are regulated: 地图管理条例 requires maps published in or into China to
// follow the official depiction of national boundaries. A hand-drawn or third-party
// outline that omits Taiwan, or draws a border differently, is a real risk for a site
// whose customers are in the mainland — up to the site being blocked.
//
// To swap in real maps later, replace the two components below with approved SVG assets
// (a licensed provider, or a map reviewed against the official depiction). Nothing else
// in the picker needs to change — MarketGate only renders <MarketArt market=… />.

/** People's Republic of China — red field, one large star and four small ones. */
function ChinaFlag() {
  const smallStars = [
    { cx: 50, cy: 10, r: 5, rot: -23 },
    { cx: 62, cy: 20, r: 5, rot: -13 },
    { cx: 62, cy: 36, r: 5, rot: 4 },
    { cx: 50, cy: 46, r: 5, rot: 16 },
  ];
  return (
    <svg viewBox="0 0 180 120" role="img" aria-label="中国大陆" className="h-full w-full">
      <rect width="180" height="120" fill="#DE2910" />
      <Star cx={30} cy={30} r={18} fill="#FFDE00" />
      {smallStars.map((s) => (
        <Star key={`${s.cx}-${s.cy}`} cx={s.cx} cy={s.cy} r={s.r} fill="#FFDE00" rotate={s.rot} />
      ))}
    </svg>
  );
}

/** Hong Kong SAR — red field with a stylised five-petal bauhinia. */
function HongKongFlag() {
  const petals = [0, 72, 144, 216, 288];
  return (
    <svg viewBox="0 0 180 120" role="img" aria-label="中国香港" className="h-full w-full">
      <rect width="180" height="120" fill="#DE2910" />
      <g transform="translate(90 60)">
        {petals.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            {/* petal */}
            <path
              d="M0 -6 C 9 -14, 16 -26, 8 -34 C 2 -40, -6 -36, -5 -27 C -4 -18, -3 -11, 0 -6 Z"
              fill="#fff"
            />
            {/* stamen line with its tip */}
            <path d="M0 -7 L 1.5 -24" stroke="#DE2910" strokeWidth="1.4" fill="none" />
            <circle cx="1.5" cy="-25" r="1.8" fill="#DE2910" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Five-pointed star, point-up before rotation. */
function Star({
  cx,
  cy,
  r,
  fill,
  rotate = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  rotate?: number;
}) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return (
    <polygon
      points={points.join(" ")}
      fill={fill}
      transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined}
    />
  );
}

export function MarketArt({ market }: { market: "CN" | "HK" }) {
  return market === "CN" ? <ChinaFlag /> : <HongKongFlag />;
}
