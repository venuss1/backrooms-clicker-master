const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  if (n < 1000) {
    return n % 1 === 0 ? n.toString() : n.toFixed(1);
  }
  let tier = 0;
  let v = n;
  while (v >= 1000 && tier < UNITS.length - 1) {
    v /= 1000;
    tier++;
  }
  return v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0) + UNITS[tier];
}

export function fmtRate(n: number): string {
  return fmt(n) + '/s';
}
