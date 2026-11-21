import React, { useMemo, useState } from 'react';
import { Calculator, Cpu } from 'lucide-react';

export const Part2CNNCalcLSTMLab: React.FC = () => {
  const [tab, setTab] = useState<'cnn' | 'lstm'>('cnn');

  // --- CNN Output Shape / Params / FLOPs Calculator ---
  const [inH, setInH] = useState(28);
  const [inC, setInC] = useState(128);
  const [outC, setOutC] = useState(256);
  const [kSize, setKSize] = useState(3);
  const [stride, setStride] = useState(1);
  const [pad, setPad] = useState(1);

  const cnnStats = useMemo(() => {
    const outH = Math.floor((inH + 2 * pad - kSize) / stride) + 1;
    const paramsPerFilter = kSize * kSize * inC + 1; // +1 bias
    const totalParams = paramsPerFilter * outC;
    const multsPerUnit = kSize * kSize * inC;
    const totalMults = outH * outH * outC * multsPerUnit;
    // Compare 5x5 direct vs 1x1 bottleneck (squeeze to C_mid = inC/4) + 5x5
    const bottleneckC = Math.max(8, Math.floor(inC / 4));
    const bottleneckMults =
      outH * outH * (bottleneckC * inC + outC * kSize * kSize * bottleneckC);
    const savingPct = Math.max(0, (1 - bottleneckMults / Math.max(1, totalMults)) * 100);
    return { outH, paramsPerFilter, totalParams, totalMults, bottleneckC, bottleneckMults, savingPct };
  }, [inH, inC, outC, kSize, stride, pad]);

  // --- LSTM 4-Gate Interactive Flow ---
  const [cPrev, setCPrev] = useState(1.2);
  const [fGate, setFGate] = useState(0.9);
  const [iGate, setIGate] = useState(0.6);
  const [cTilde, setCTilde] = useState(0.8);
  const [oGate, setOGate] = useState(0.75);

  const cCurr = fGate * cPrev + iGate * cTilde;
  const hCurr = oGate * Math.tanh(cCurr);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 2D · CNN 维度/参数/FLOPs 计算器（含 1×1 瓶颈）& LSTM 四门控水流图
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('cnn')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'cnn' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            CNN 参数 / FLOPs & 1×1 卷积
          </button>
          <button
            onClick={() => setTab('lstm')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'lstm' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            LSTM 4 门控记忆单元
          </button>
        </div>
      </div>

      {tab === 'cnn' ? (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">经典层预设：</span>
            <button
              onClick={() => { setInH(27); setInC(256); setOutC(384); setKSize(3); setStride(1); setPad(0); }}
              className="rounded-lg border border-slate-200 px-2.5 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              AlexNet Conv3 风格 (27×27×256)
            </button>
            <button
              onClick={() => { setInH(28); setInC(192); setOutC(32); setKSize(5); setStride(1); setPad(2); }}
              className="rounded-lg border border-slate-200 px-2.5 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              GoogLeNet 5×5 分支 (看 1×1 省算力!)
            </button>
            <button
              onClick={() => { setInH(56); setInC(64); setOutC(64); setKSize(3); setStride(2); setPad(1); }}
              className="rounded-lg border border-slate-200 px-2.5 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              ResNet 下采样步长 Stride=2
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 text-xs">
              {[
                { label: '输入高宽 H=W', val: inH, set: setInH, min: 7, max: 64, step: 1 },
                { label: '输入通道 C_in', val: inC, set: setInC, min: 3, max: 512, step: 1 },
                { label: '卷积核数 C_out', val: outC, set: setOutC, min: 8, max: 512, step: 8 },
                { label: '卷积核 K×K', val: kSize, set: setKSize, min: 1, max: 7, step: 2 },
                { label: '步幅 Stride S', val: stride, set: setStride, min: 1, max: 4, step: 1 },
                { label: '零填充 Padding P', val: pad, set: setPad, min: 0, max: 3, step: 1 },
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">{s.label}</span>
                    <span className="font-mono font-bold text-blue-600">{s.val}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.val}
                    onChange={(e) => s.set(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[10px] text-slate-500">输出张量 Shape</div>
                  <div className="mt-1 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {cnnStats.outH}×{cnnStats.outH}×{outC}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[10px] text-slate-500">参数量 (含 Bias)</div>
                  <div className="mt-1 font-mono text-sm font-bold text-violet-600 dark:text-violet-400">
                    {cnnStats.totalParams.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[10px] text-slate-500">浮点乘法次数</div>
                  <div className="mt-1 font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                    {(cnnStats.totalMults / 1e6).toFixed(2)} M
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3.5 font-mono text-[11px] leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300 space-y-1">
                <div>• 输出高宽：⌊({inH} + 2×{pad} − {kSize}) / {stride}⌋ + 1 = <strong>{cnnStats.outH}</strong></div>
                <div>• 参数公式：(K²·C_in + 1) × C_out = ({kSize}²×{inC} + 1) × {outC} = <strong>{cnnStats.totalParams.toLocaleString()}</strong></div>
                <div>• 乘法公式：H_out × W_out × C_out × (K²·C_in) = <strong>{cnnStats.totalMults.toLocaleString()}</strong></div>
              </div>

              {kSize >= 3 && (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
                  <strong>1×1 卷积降维威力（GoogLeNet Inception 核心）：</strong>先用 1×1 卷积把通道从 {inC} 压到 {cnnStats.bottleneckC} 再做 {kSize}×{kSize} 卷积，乘法算力从 {(cnnStats.totalMults / 1e6).toFixed(2)}M 骤降至 <strong>{(cnnStats.bottleneckMults / 1e6).toFixed(2)}M（节省 {cnnStats.savingPct.toFixed(0)}%）</strong>！
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 text-xs">
            {[
              { label: '上一时刻长期记忆 c_{t-1}', val: cPrev, set: setCPrev, min: -2, max: 2, color: 'text-blue-600' },
              { label: '遗忘门 f_t ∈ [0,1]（保留多少旧记忆）', val: fGate, set: setFGate, min: 0, max: 1, color: 'text-rose-600' },
              { label: '输入门 i_t ∈ [0,1]（写入多少新信息）', val: iGate, set: setIGate, min: 0, max: 1, color: 'text-emerald-600' },
              { label: '候选新记忆 c̃_t = tanh(...)', val: cTilde, set: setCTilde, min: -1, max: 1, color: 'text-violet-600' },
              { label: '输出门 o_t ∈ [0,1]（暴露多少到 h_t）', val: oGate, set: setOGate, min: 0, max: 1, color: 'text-amber-600' },
            ].map((ctl) => (
              <div key={ctl.label} className="space-y-1">
                <div className="flex justify-between">
                  <span>{ctl.label}</span>
                  <span className={`font-mono font-bold ${ctl.color}`}>{ctl.val.toFixed(2)}</span>
                </div>
                <input type="range" min={ctl.min} max={ctl.max} step={0.05} value={ctl.val} onChange={(e) => ctl.set(parseFloat(e.target.value))} className="w-full" />
              </div>
            ))}
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Cpu className="h-3.5 w-3.5 text-blue-500" />
                LSTM Cell State 加法高速公路实时演算
              </div>
              <svg viewBox="0 0 500 180" className="w-full h-auto">
                {/* Cell state conveyor belt */}
                <line x1={30} y1={48} x2={470} y2={48} stroke="#3b82f6" strokeWidth={4} />
                <text x={36} y={34} className="fill-blue-600 text-[11px] font-mono font-bold">c_{'{t-1}'}={cPrev.toFixed(2)}</text>

                {/* Forget Gate Multiply */}
                <circle cx={155} cy={48} r={18} fill="#fff" stroke="#f43f5e" strokeWidth={2.5} className="dark:fill-slate-900" />
                <text x={155} y={52} textAnchor="middle" className="fill-rose-600 text-[12px] font-bold">× f</text>
                <text x={155} y={84} textAnchor="middle" className="fill-rose-500 text-[10px] font-mono">保留 {(fGate * cPrev).toFixed(2)}</text>

                {/* Input Gate Add */}
                <circle cx={290} cy={48} r={18} fill="#fff" stroke="#10b981" strokeWidth={2.5} className="dark:fill-slate-900" />
                <text x={290} y={52} textAnchor="middle" className="fill-emerald-600 text-[14px] font-bold">+</text>
                <line x1={290} y1={125} x2={290} y2={66} stroke="#10b981" strokeWidth={2.5} />
                <rect x={235} y={125} width={110} height={36} rx={8} fill="#ecfdf5" stroke="#10b981" className="dark:fill-emerald-950/60" />
                <text x={290} y={147} textAnchor="middle" className="fill-emerald-700 dark:fill-emerald-300 text-[10px] font-mono font-bold">
                  i·c̃ = {(iGate * cTilde).toFixed(2)}
                </text>

                {/* New Cell State c_t */}
                <text x={450} y={34} textAnchor="end" className="fill-blue-600 text-[11px] font-mono font-bold">c_t = {cCurr.toFixed(2)}</text>

                {/* Output branch to h_t */}
                <line x1={390} y1={48} x2={390} y2={115} stroke="#f59e0b" strokeWidth={2.5} />
                <rect x={342} y={115} width={132} height={44} rx={10} fill="#fffbeb" stroke="#f59e0b" strokeWidth={2} className="dark:fill-amber-950/50" />
                <text x={408} y={134} textAnchor="middle" className="fill-amber-700 dark:text-amber-300 text-[10px] font-mono">
                  o_t · tanh(c_t)
                </text>
                <text x={408} y={150} textAnchor="middle" className="fill-amber-800 dark:fill-amber-200 text-[12px] font-mono font-bold">
                  h_t = {hCurr.toFixed(2)}
                </text>
              </svg>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              把遗忘门 <strong>f_t 拉到 1.00、输入门 i_t 拉到 0.00</strong>：长期记忆 c_t 就能一字不差地穿过上百个时间步，反向传播导数 ∂c_t / ∂c_{'{t-1}'} = f_t ≈ 1，这与 ResNet 的恒等跳连异曲同工！
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
