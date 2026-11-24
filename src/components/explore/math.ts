/** Small numeric helpers shared by the explorable widgets (no dependencies). */

/** Solve A x = b with partial pivoting (A is n×n, copied). */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / (M[r][r] || 1e-12);
  }
  return x;
}

/** Ridge-regularised polynomial fit on x mapped to [-1, 1] (keeps the normal equations well conditioned). Intercept not penalised. */
export function polyFit(xs: number[], ys: number[], degree: number, lambda: number) {
  const map = (x: number) => 2 * x - 1;
  const feats = (x: number) => Array.from({ length: degree + 1 }, (_, j) => Math.pow(map(x), j));
  const D = degree + 1;
  const A = Array.from({ length: D }, () => new Array(D).fill(0));
  const b = new Array(D).fill(0);
  xs.forEach((x, i) => {
    const f = feats(x);
    for (let r = 0; r < D; r++) {
      b[r] += f[r] * ys[i];
      for (let c = 0; c < D; c++) A[r][c] += f[r] * f[c];
    }
  });
  for (let j = 1; j < D; j++) A[j][j] += lambda;
  const w = solve(A, b);
  return (x: number) => feats(x).reduce((s, f, j) => s + f * w[j], 0);
}

export const mse = (f: (x: number) => number, xs: number[], ys: number[]) =>
  xs.reduce((s, x, i) => s + (f(x) - ys[i]) ** 2, 0) / xs.length;

export function softmax(z: number[]): number[] {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export const normalPdf = (x: number, mu: number, sd: number) =>
  Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
