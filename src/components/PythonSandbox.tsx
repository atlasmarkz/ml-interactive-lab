import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { AlertCircle, CheckCircle2, FileCode2, Loader2, Play, RotateCcw, TerminalSquare } from 'lucide-react';
import { PlotSeriesData, SandboxSpec } from '../types/curriculum';
import { RichText } from './RichText';
import { CODE, codeTheme } from './code/theme';
import { LineChart, SERIES } from './explore/kit';

// Singleton worker shared across all pages so Pyodide only downloads once per session
let sharedWorker: Worker | null = null;
function getWorker(): Worker {
  if (!sharedWorker) {
    sharedWorker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return sharedWorker;
}

/** Round a data range outward to tick-friendly bounds (1, 2, 2.5, 5 × 10^k steps). */
function niceDomain(lo: number, hi: number): [number, number] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi - lo < 1e-12) return [lo - 1, hi + 1];
  const raw = (hi - lo) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => (hi - lo) / s <= 5) ?? raw;
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}

const SandboxPlot: React.FC<{ plot: PlotSeriesData }> = ({ plot }) => {
  const xs = plot.series.flatMap((s) => s.x).filter(Number.isFinite);
  const ys = plot.series.flatMap((s) => s.y).filter(Number.isFinite);
  if (!xs.length || !ys.length) return null;
  const xDomain: [number, number] = [Math.min(...xs), Math.max(...xs) === Math.min(...xs) ? Math.min(...xs) + 1 : Math.max(...xs)];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="mb-2 text-[14px] font-semibold text-stone-800 dark:text-zinc-100">{plot.title}</div>
      <LineChart
        ariaLabel={plot.title}
        xDomain={xDomain}
        yDomain={niceDomain(Math.min(...ys), Math.max(...ys))}
        xLabel={plot.xlabel}
        yLabel={plot.ylabel}
        series={plot.series.map((s, i) => ({
          name: s.name,
          color: SERIES[i % SERIES.length],
          points: s.x.map((x, k) => [x, s.y[k]] as [number, number]),
        }))}
      />
    </div>
  );
};

interface PythonSandboxProps {
  spec: SandboxSpec;
  isDark: boolean;
}

export const PythonSandbox: React.FC<PythonSandboxProps> = ({ spec }) => {
  const [code, setCode] = useState(spec.starterCode);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [stdout, setStdout] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [plots, setPlots] = useState<PlotSeriesData[]>([]);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const reqIdRef = useRef(0);
  const edited = code !== spec.starterCode;

  useEffect(() => {
    setCode(spec.starterCode);
    setStdout('');
    setError('');
    setPlots([]);
    setElapsedMs(null);
  }, [spec.id, spec.starterCode]);

  const handleRun = () => {
    const worker = getWorker();
    const myId = ++reqIdRef.current;
    setRunning(true);
    setError('');
    setStatus('准备执行 Python…');

    const onMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'status') {
        setStatus(msg.message);
        return;
      }
      if (msg.id !== myId) return;
      worker.removeEventListener('message', onMessage);
      setRunning(false);
      setStatus('');
      if (msg.type === 'result') {
        setStdout(msg.stdout || '(运行完成，无标准输出)');
        setPlots(msg.plots || []);
        setElapsedMs(msg.elapsedMs ?? null);
        if (msg.stderr) setError(msg.stderr);
      } else if (msg.type === 'error') {
        setStdout(msg.stdout || '');
        setError(msg.error || 'Unknown Python error');
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage({ id: myId, code });
  };

  const ran = elapsedMs !== null || !!error;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h3 className="font-serif-display text-lg font-semibold text-stone-900 dark:text-zinc-100">
          <RichText text={spec.title} />
        </h3>
        <p className="prose-zh text-[15px] text-stone-600 dark:text-zinc-400">
          <RichText text={spec.description} />
        </p>
      </div>

      {/* Code window */}
      <div className="overflow-hidden rounded-xl shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]" style={{ background: CODE.bg, border: `1px solid ${CODE.border}` }}>
        <div className="flex items-center justify-between gap-3 px-3 py-2" style={{ background: CODE.panel, borderBottom: `1px solid ${CODE.border}` }}>
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5 pl-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[12.5px]" style={{ background: CODE.bg, color: CODE.text }}>
              <FileCode2 className="h-3.5 w-3.5" style={{ color: '#3fb950' }} />
              sandbox.py
              {edited && <span className="h-1.5 w-1.5 rounded-full bg-[#d29922]" title="已修改" />}
            </span>
            <span className="hidden font-mono text-[11.5px] sm:inline" style={{ color: CODE.muted }}>Python · NumPy（Pyodide，在浏览器内运行）</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCode(spec.starterCode)}
              disabled={!edited}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] transition hover:bg-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-default"
              style={{ color: CODE.muted }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重置
            </button>
            <button
              onClick={handleRun}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#238636] px-3 py-1 text-[12.5px] font-medium text-white transition hover:bg-[#2ea043] disabled:opacity-60 cursor-pointer"
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              {running ? '运行中…' : '运行'}
            </button>
          </div>
        </div>

        <CodeMirror
          value={code}
          minHeight="120px"
          maxHeight="480px"
          extensions={[python(), ...codeTheme]}
          theme="none"
          onChange={(val) => setCode(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: false,
            autocompletion: true,
          }}
        />

        {/* Console */}
        <div style={{ borderTop: `1px solid ${CODE.border}`, background: '#010409' }}>
          <div className="flex items-center justify-between px-4 py-2 font-mono text-[12px]" style={{ color: CODE.muted }}>
            <span className="inline-flex items-center gap-1.5">
              <TerminalSquare className="h-3.5 w-3.5" />
              控制台
            </span>
            {status && (
              <span className="inline-flex items-center gap-1.5 text-[#58a6ff]">
                <Loader2 className="h-3 w-3 animate-spin" /> {status}
              </span>
            )}
            {!running && elapsedMs !== null && !error && (
              <span className="inline-flex items-center gap-1 text-[#3fb950]">
                <CheckCircle2 className="h-3.5 w-3.5" /> 完成 · {elapsedMs} ms
              </span>
            )}
            {!running && error && (
              <span className="inline-flex items-center gap-1 text-[#f85149]">
                <AlertCircle className="h-3.5 w-3.5" /> 出错
              </span>
            )}
          </div>
          <pre className="code-scroll max-h-56 overflow-auto px-4 pb-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: CODE.text }}>
            {ran ? (
              <>
                <span style={{ color: CODE.muted }}>$ python sandbox.py{'\n'}</span>
                {stdout}
                {error && <span style={{ color: '#ff7b72' }}>{(stdout ? '\n' : '') + error}</span>}
              </>
            ) : (
              <span style={{ color: CODE.muted }}>点击「运行」在浏览器内执行这段代码。第一次运行需要 2–5 秒加载 Python 运行时，之后几乎立即完成；可以随意修改代码再运行。</span>
            )}
          </pre>
        </div>
      </div>

      {plots.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {plots.map((p, idx) => (
            <SandboxPlot key={idx} plot={p} />
          ))}
        </div>
      )}
    </div>
  );
};
