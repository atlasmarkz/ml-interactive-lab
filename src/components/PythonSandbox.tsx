import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play, RotateCcw, Terminal, Loader2, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { PlotSeriesData, SandboxSpec } from '../types/curriculum';

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

const MiniSvgChart: React.FC<{ plot: PlotSeriesData }> = ({ plot }) => {
  const width = 560;
  const height = 210;
  const padL = 48;
  const padR = 16;
  const padT = 18;
  const padB = 34;

  const allX = plot.series.flatMap((s) => s.x).filter((v) => Number.isFinite(v));
  const allY = plot.series.flatMap((s) => s.y).filter((v) => Number.isFinite(v));
  if (!allX.length || !allY.length) return null;

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX) === minX ? minX + 1 : Math.max(...allX);
  const rawMinY = Math.min(...allY);
  const rawMaxY = Math.max(...allY);
  const spanY = rawMaxY - rawMinY || 1;
  const minY = rawMinY - spanY * 0.08;
  const maxY = rawMaxY + spanY * 0.08;

  const toX = (x: number) => padL + ((x - minX) / (maxX - minX)) * (width - padL - padR);
  const toY = (y: number) => padT + (1 - (y - minY) / (maxY - minY)) * (height - padT - padB);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minY + t * (maxY - minY));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
          <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
          {plot.title}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300">
          {plot.series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color ?? '#3b82f6' }}
              />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {yTicks.map((yv, i) => {
          const py = toY(yv);
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={width - padR}
                y1={py}
                y2={py}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeDasharray="3 3"
              />
              <text
                x={padL - 8}
                y={py + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono"
              >
                {Math.abs(yv) >= 100 ? yv.toFixed(0) : yv.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padL}
          x2={width - padR}
          y1={height - padB}
          y2={height - padB}
          className="stroke-slate-300 dark:stroke-slate-700"
        />
        <line
          x1={padL}
          x2={padL}
          y1={padT}
          y2={height - padB}
          className="stroke-slate-300 dark:stroke-slate-700"
        />

        {/* Curves */}
        {plot.series.map((s) => {
          const d = s.x
            .map((x, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(x).toFixed(1)} ${toY(s.y[idx]).toFixed(1)}`)
            .join(' ');
          return (
            <path
              key={s.name}
              d={d}
              fill="none"
              stroke={s.color ?? '#3b82f6'}
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {/* Labels */}
        {plot.xlabel && (
          <text
            x={(padL + width - padR) / 2}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {plot.xlabel}
          </text>
        )}
        {plot.ylabel && (
          <text
            x={12}
            y={(padT + height - padB) / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${(padT + height - padB) / 2})`}
            className="fill-slate-500 text-[10px]"
          >
            {plot.ylabel}
          </text>
        )}
      </svg>
    </div>
  );
};

interface PythonSandboxProps {
  spec: SandboxSpec;
  isDark: boolean;
}

export const PythonSandbox: React.FC<PythonSandboxProps> = ({ spec, isDark }) => {
  const [code, setCode] = useState(spec.starterCode);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [stdout, setStdout] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [plots, setPlots] = useState<PlotSeriesData[]>([]);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const reqIdRef = useRef(0);

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
    setStatus('准备执行 Python...');

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {spec.title}
            </h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Pyodide · 浏览器内真实运行 NumPy
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{spec.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(spec.starterCode)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置代码
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60 transition cursor-pointer"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            {running ? '运行中...' : '运行 Python'}
          </button>
        </div>
      </div>

      {/* Tips */}
      {spec.tips && spec.tips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 bg-blue-50/40 px-5 py-2 text-xs text-blue-800 dark:border-slate-800 dark:bg-blue-950/20 dark:text-blue-300">
          <span className="font-semibold">动手试一试：</span>
          {spec.tips.map((tip, i) => (
            <span
              key={i}
              className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] border border-blue-200/70 dark:bg-slate-900 dark:border-blue-900/60"
            >
              {tip}
            </span>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="border-b border-slate-200 dark:border-slate-800 text-xs">
        <CodeMirror
          value={code}
          height="290px"
          extensions={[python()]}
          theme={isDark ? oneDark : 'light'}
          onChange={(val) => setCode(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: false,
            autocompletion: true,
          }}
        />
      </div>

      {/* Output & Dynamic Charts */}
      <div className="bg-slate-50 p-4 dark:bg-slate-950/70 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono font-medium">输出控制台 (stdout)</span>
          {status && (
            <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" /> {status}
            </span>
          )}
          {!running && elapsedMs !== null && !error && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> 完成 ({elapsedMs} ms)
            </span>
          )}
        </div>

        <pre className="max-h-52 overflow-auto rounded-xl bg-slate-900 p-3.5 font-mono text-xs leading-relaxed text-slate-100">
          {stdout || '点击右上角「运行 Python」在浏览器内本地执行 NumPy 代码（首次点击需约 2~5 秒加载 Pyodide WASM，之后毫秒级运行）。'}
        </pre>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono">{error}</pre>
          </div>
        )}

        {plots.length > 0 && (
          <div className="grid grid-cols-1 gap-3 pt-1">
            {plots.map((p, idx) => (
              <MiniSvgChart key={idx} plot={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
