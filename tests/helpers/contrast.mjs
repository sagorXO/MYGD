function channel(v) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  const h = String(hex).replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Expected #RRGGBB, got ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}
