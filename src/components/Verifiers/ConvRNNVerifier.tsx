import React, { useMemo, useState } from 'react';

interface ConvRNNVerifierProps {
  mode: 'l06-conv-flops' | 'l07-lstm-rnn';
}

export const ConvRNNVerifier: React.FC<ConvRNNVerifierProps> = ({ mode }) => {
  // --- L06: Editable 4x4 X convolved with 2x2 F + Bias + ReLU + Multi-Channel Shape/FLOPs ---
  const [X, setX] = useState<number[][]>([
    [1, 0, 2, 1],
    [0, 3, 1, 2],
    [2, 1, 0, 1],
    [1, 2, 3, 0],
  ]);
  const [F, setF] = useState<number[][]>([
    [1, -1],
    [0, 2],
  ]);
  const [bias, setBias] = useState(1);
  const [useRelu, setUseRelu] = useState(true);
  const [selOut, setSelOut] = useState<[number, number]>([0, 0]);

  // Multi-channel layer calculator
  const [H, setH] = useState(27);
  const [Cin, setCin] = useState(256);
  const [Cout, setCout] = useState(384);
  const [K, setK] = useState(3);
  const [S, setS] = useState(1);
  const [P, setP] = useState(0);

  const convRes = useMemo(() => {
    const out: { raw: number; act: number; expr: string }[][] = [];
    for (let r = 0; r < 3; r++) {
      const row: { raw: number; act: number; expr: string }[] = [];
      for (let c = 0; c < 3; c++) {
        const terms: string[] = [];
        let sum = 0;
        for (let kr = 0; kr < 2; kr++) {
          for (let kc = 0; kc < 2; kc++) {
            const xv = X[r + kr][c + kc];
            const fv = F[kr][kc];
            sum += xv * fv;
            terms.push(`(${xv}×${fv})`);
          }
        }
        const raw = sum + bias;
        const act = useRelu ? Math.max(0, raw) : raw;
        row.push({ raw, act, expr: `${terms.join(' + ')} + ${bias} = ${raw}` });
      }
      out.push(row);
    }
    const outH = Math.floor((H + 2 * P - K) / S) + 1;
    const params = (K * K * Cin + 1) * Cout;
    const mults = outH * outH * Cout * (K * K * Cin);
    return { out, outH, params, mults };
  }, [X, F, bias, useRelu, H, Cin, Cout, K, S, P]);

  // --- L07: Exact LSTM Gate & Gradient Decay Verifier ---
  const [cPrev, setCPrev] = useState(1.5);
  const [zf, setZf] = useState(2.0); // pre-sigmoid forget logit
  const [zi, setZi] = useState(0.5);
  const [zc, setZc] = useState(0.8);
  const [zo, setZo] = useState(1.0);
  const [stepsT, setStepsT] = useState(20);
  const [rnnW, setRnnW] = useState(0.75);

  const lstmRes = useMemo(() => {
    const sig = (z: number) => 1 / (1 + Math.exp(-z));
    const f = sig(zf);
    const i = sig(zi);
    const cTilde = Math.tanh(zc);
    const o = sig(zo);
    const cCurr = f * cPrev + i * cTilde;
    const hCurr = o * Math.tanh(cCurr);
    const lstmGradAfterT = Math.pow(f, stepsT);
    const rnnGradAfterT = Math.pow(rnnW * 0.7, stepsT); // tanh' <= 1, typically ~0.7
    return { f, i, cTilde, o, cCurr, hCurr, lstmGradAfterT, rnnGradAfterT };
  }, [cPrev, zf, zi, zc, zo, stepsT, rnnW]);

  if (mode === 'l06-conv-flops') {
    const picked = convRes.out[selOut[0]][selOut[1]];
    return (
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Convolution & FLOPs Verifier · L06
          </div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
            2D 卷积 + Bias + ReLU 逐格手算验算器 & 多通道参数/FLOPs 计算表
          </h3>
        </div>

        <div className="p-5 space-y-6 text-xs">
          {/* Part A: 2D Matrix Conv */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 space-y-2">
              <div className="font-semibold text-stone-700 dark:text-zinc-300">可编辑输入图像 X (4×4)</div>
              <div className="grid grid-cols-4 gap-1.5 font-mono">
                {X.map((row, r) =>
                  row.map((val, c) => {
                    const inPatch = r >= selOut[0] && r < selOut[0] + 2 && c >= selOut[1] && c < selOut[1] + 2;
                    return (
                      <input
                        key={`${r}-${c}`}
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          if (Number.isNaN(n)) return;
                          setX((prev) => prev.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv))));
                        }}
                        className={`rounded border px-2 py-1 text-center dark:bg-zinc-950 ${
                          inPatch
                            ? 'border-blue-600 bg-blue-50/60 font-semibold dark:bg-blue-950/40'
                            : 'border-stone-300 bg-white dark:border-zinc-700'
                        }`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div className="font-semibold text-stone-700 dark:text-zinc-300">卷积核 F (2×2) 与偏置</div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {F.map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        if (Number.isNaN(n)) return;
                        setF((prev) => prev.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv))));
                      }}
                      className="rounded border border-stone-300 bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  ))
                )}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 font-mono">
                <label className="flex items-center gap-1.5">
                  <span>b =</span>
                  <input
                    type="number"
                    value={bias}
                    onChange={(e) => setBias(parseFloat(e.target.value) || 0)}
                    className="w-14 rounded border border-stone-300 px-1.5 py-0.5 text-center dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-sans">
                  <input type="checkbox" checked={useRelu} onChange={(e) => setUseRelu(e.target.checked)} />
                  <span>ReLU</span>
                </label>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-2">
              <div className="font-semibold text-stone-700 dark:text-zinc-300">输出特征图 Y (3×3，点击定位展开算式)</div>
              <div className="grid grid-cols-3 gap-1.5 font-mono">
                {convRes.out.map((row, r) =>
                  row.map((cell, c) => {
                    const active = r === selOut[0] && c === selOut[1];
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => setSelOut([r, c])}
                        className={`rounded border py-1.5 text-center font-semibold cursor-pointer ${
                          active
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                        }`}
                      >
                        {cell.act}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="rounded border border-stone-200 bg-stone-50/70 p-2 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-950">
                Y[{selOut[0]},{selOut[1]}]: {picked.expr}
                {useRelu ? ` → ReLU = ${picked.act}` : ''}
              </div>
            </div>
          </div>

          {/* Part B: Multi-Channel Layer Shape / Params / FLOPs */}
          <div className="border-t border-stone-200 pt-4 dark:border-zinc-800 space-y-3">
            <div className="font-semibold text-stone-800 dark:text-zinc-200">
              多通道卷积层 Shape · 参数量 · 浮点乘法次数精确计算器（对照 WA3 Q2 题型）
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono">
              {[
                { label: 'H=W', val: H, set: setH },
                { label: 'C_in', val: Cin, set: setCin },
                { label: 'C_out', val: Cout, set: setCout },
                { label: 'Kernel K', val: K, set: setK },
                { label: 'Stride S', val: S, set: setS },
                { label: 'Pad P', val: P, set: setP },
              ].map((f) => (
                <label key={f.label} className="space-y-1">
                  <span className="block text-[10px] text-stone-500">{f.label}</span>
                  <input
                    type="number"
                    min={f.label === 'Pad P' ? 0 : 1}
                    value={f.val}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n) && n >= 0) f.set(n);
                    }}
                    className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="rounded border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="text-stone-400">输出张量 Shape</div>
                <div className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {convRes.outH} × {convRes.outH} × {Cout}
                </div>
              </div>
              <div className="rounded border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="text-stone-400">参数量 (K²·C_in + 1)·C_out</div>
                <div className="mt-1 text-sm font-semibold">{convRes.params.toLocaleString()}</div>
              </div>
              <div className="rounded border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="text-stone-400">净输入乘法次数 (FLOPs)</div>
                <div className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {convRes.mults.toLocaleString()} ({(convRes.mults / 1e6).toFixed(2)} M)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Mode: L07 LSTM Single-Step & T-Step Gradient Preservation Verifier ---
  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
          Recurrent Gate & Gradient Verifier · L07
        </div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
          LSTM 单步门控精确演算 & 长序列 T 步反向梯度衰减定量对比
        </h3>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        <div className="lg:col-span-6 space-y-2.5 font-mono">
          {[
            { label: '上一步记忆 c_{t-1}', val: cPrev, set: setCPrev, min: -2, max: 2, step: 0.1 },
            { label: '遗忘门 Pre-activation z_f (大则 f_t → 1)', val: zf, set: setZf, min: -4, max: 4, step: 0.2 },
            { label: '输入门 Pre-activation z_i', val: zi, set: setZi, min: -4, max: 4, step: 0.2 },
            { label: '候选状态 Pre-activation z_c', val: zc, set: setZc, min: -3, max: 3, step: 0.2 },
            { label: '输出门 Pre-activation z_o', val: zo, set: setZo, min: -4, max: 4, step: 0.2 },
            { label: '序列长度 T (评估 T 步后梯度留存)', val: stepsT, set: setStepsT, min: 5, max: 60, step: 5 },
          ].map((ctl) => (
            <div key={ctl.label} className="space-y-0.5">
              <div className="flex justify-between font-sans">
                <span className="text-stone-600 dark:text-zinc-400">{ctl.label}</span>
                <span className="font-mono font-semibold">{ctl.val}</span>
              </div>
              <input
                type="range"
                min={ctl.min}
                max={ctl.max}
                step={ctl.step}
                value={ctl.val}
                onChange={(e) => ctl.set(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="lg:col-span-6 rounded-md border border-stone-200 bg-stone-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/60 font-mono text-[11px] space-y-2">
          <div className="font-semibold text-stone-800 dark:text-zinc-200">单步门控计算明细</div>
          <div>f_t = σ({zf.toFixed(1)}) = <strong>{lstmRes.f.toFixed(4)}</strong></div>
          <div>i_t = σ({zi.toFixed(1)}) = <strong>{lstmRes.i.toFixed(4)}</strong></div>
          <div>c̃_t = tanh({zc.toFixed(1)}) = <strong>{lstmRes.cTilde.toFixed(4)}</strong></div>
          <div>o_t = σ({zo.toFixed(1)}) = <strong>{lstmRes.o.toFixed(4)}</strong></div>
          <div className="border-t border-stone-200 pt-2 dark:border-zinc-800 text-blue-700 dark:text-blue-400 font-semibold">
            c_t = f_t·c_{'{t-1}'} + i_t·c̃_t = {lstmRes.cCurr.toFixed(4)}
          </div>
          <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
            h_t = o_t·tanh(c_t) = {lstmRes.hCurr.toFixed(4)}
          </div>
          <div className="border-t border-stone-200 pt-2 dark:border-zinc-800 space-y-1">
            <div className="font-sans font-semibold text-stone-700 dark:text-zinc-300">
              经过 T = {stepsT} 个时间步反向传播后的梯度留存比例：
            </div>
            <div>LSTM 记忆通道 ∂c_T/∂c_0 ≈ f_t^T = <strong className="text-emerald-700 dark:text-emerald-400">{lstmRes.lstmGradAfterT.toExponential(2)}</strong></div>
            <div>Vanilla RNN (设 |W_hh|={rnnW}) ≈ (W·tanh′)^T = <strong className="text-red-700 dark:text-red-400">{lstmRes.rnnGradAfterT.toExponential(2)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
