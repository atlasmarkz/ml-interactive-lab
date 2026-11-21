/// <reference lib="webworker" />

import type { PlotSeriesData } from '../types/curriculum';

interface PyodideInstance {
  loadPackage: (pkg: string | string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
}

declare function loadPyodide(options: { indexURL: string }): Promise<PyodideInstance>;

let pyodideReady: Promise<PyodideInstance> | null = null;

async function initPyodide(): Promise<PyodideInstance> {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      self.postMessage({ type: 'status', message: '正在加载 Python WebAssembly 运行时 (Pyodide)...' });
      const indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/';
      // Dynamic ES module import for Pyodide in module worker
      const pyodideModule = await import(
        /* @vite-ignore */ `${indexURL}pyodide.mjs`
      );
      const pyodide: PyodideInstance = await pyodideModule.loadPyodide({ indexURL });
      self.postMessage({ type: 'status', message: '正在加载 NumPy 科学计算包...' });
      await pyodide.loadPackage('numpy');
      self.postMessage({ type: 'status', message: 'Python + NumPy 已就绪' });
      return pyodide;
    })();
  }
  return pyodideReady;
}

self.onmessage = async (event: MessageEvent<{ id: number; code: string }>) => {
  const { id, code } = event.data;
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  try {
    const pyodide = await initPyodide();
    pyodide.setStdout({
      batched: (msg: string) => stdoutLines.push(msg),
    });
    pyodide.setStderr({
      batched: (msg: string) => stderrLines.push(msg),
    });

    // Inject lightweight chart helper so user Python code can emit SVG charts
    await pyodide.runPythonAsync(`
import json
import numpy as np

__ml_lab_plots__ = []

def plot_series(title, series_dict, xlabel="Step", ylabel="Value"):
    palette = ["#3b82f6", "#10b981", "#f43f5e", "#8b5cf6", "#f59e0b"]
    parsed = []
    for idx, (name, vals) in enumerate(series_dict.items()):
        if isinstance(vals, tuple) and len(vals) == 2:
            xs = [float(v) for v in np.asarray(vals[0]).ravel().tolist()]
            ys = [float(v) for v in np.asarray(vals[1]).ravel().tolist()]
        else:
            ys = [float(v) for v in np.asarray(vals).ravel().tolist()]
            xs = list(range(len(ys)))
        parsed.append({
            "name": str(name),
            "x": xs,
            "y": ys,
            "color": palette[idx % len(palette)],
        })
    __ml_lab_plots__.append({
        "title": str(title),
        "xlabel": str(xlabel),
        "ylabel": str(ylabel),
        "series": parsed,
    })
`);

    const t0 = performance.now();
    await pyodide.runPythonAsync(code);
    const elapsedMs = Math.round(performance.now() - t0);

    const plotsJson = (await pyodide.runPythonAsync('json.dumps(__ml_lab_plots__)')) as string;
    const plots: PlotSeriesData[] = JSON.parse(plotsJson || '[]');

    self.postMessage({
      type: 'result',
      id,
      stdout: stdoutLines.join('\n'),
      stderr: stderrLines.join('\n'),
      plots,
      elapsedMs,
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      id,
      stdout: stdoutLines.join('\n'),
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
