import React, { useState } from 'react';
import { InlineMath } from '../RichText';

interface GenerativeRLVerifierProps {
  mode: 'l10-gen-models' | 'l11-rl-bellman-ppo';
  /** Which sub-verifier to open first (each lecture focuses on one model). */
  initialTab?: 'vae' | 'gan' | 'diff' | 'td' | 'ppo';
}

export const GenerativeRLVerifier: React.FC<GenerativeRLVerifierProps> = ({ mode, initialTab }) => {
  // --- L10 State ---
  const [genTab, setGenTab] = useState<'vae' | 'gan' | 'diff'>(
    initialTab === 'gan' || initialTab === 'diff' ? initialTab : 'vae'
  );
  // VAE
  const [mu, setMu] = useState(0.8);
  const [logVar, setLogVar] = useState(-0.6);
  const [reconMse, setReconMse] = useState(0.35);
  const [beta, setBeta] = useState(1.0);
  // GAN
  const [pData, setPData] = useState(0.6);
  const [pGen, setPGen] = useState(0.15);
  const [dFake, setDFake] = useState(0.05);
  // DDPM & Flow
  const [tFlow, setTFlow] = useState(0.4);
  const [x0, setX0] = useState(-1.2);
  const [x1, setX1] = useState(2.4);
  const [alphaBar, setAlphaBar] = useState(0.64);
  const [epsNoise, setEpsNoise] = useState(0.8);

  // --- L11 State ---
  const [rlTab, setRlTab] = useState<'td' | 'ppo'>(initialTab === 'ppo' ? 'ppo' : 'td');
  // TD
  const [qOld, setQOld] = useState(4.0);
  const [rew, setRew] = useState(2.0);
  const [qNextMax, setQNextMax] = useState(10.0);
  const [qNextActual, setQNextActual] = useState(6.0);
  const [gamma, setGamma] = useState(0.9);
  const [alpha, setAlpha] = useState(0.5);
  // PPO
  const [piNew, setPiNew] = useState(0.68);
  const [piOld, setPiOld] = useState(0.5);
  const [adv, setAdv] = useState(1.5);
  const [epsClip, setEpsClip] = useState(0.2);

  if (mode === 'l10-gen-models') {
    const sigma2 = Math.exp(logVar);
    const vaeKl = -0.5 * (1 + logVar - mu * mu - sigma2);
    const vaeTotal = reconMse + beta * vaeKl;

    const dOpt = pData / Math.max(1e-9, pData + pGen);
    const satLoss = Math.log(Math.max(1e-6, 1 - dFake));
    const satGrad = 1 / Math.max(1e-6, 1 - dFake);
    const nonSatLoss = -Math.log(Math.max(1e-6, dFake));
    const nonSatGrad = 1 / Math.max(1e-6, dFake);

    const ddpmXt = Math.sqrt(alphaBar) * x1 + Math.sqrt(1 - alphaBar) * epsNoise;
    const flowXt = (1 - tFlow) * x0 + tFlow * x1;
    const flowVel = x1 - x0;

    return (
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Generative Models Numerical Verifier · L10
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
              VAE ELBO · GAN 饱和/非饱和梯度 · DDPM 与 Flow Matching 数值验算器
            </h3>
          </div>
          <div className="flex rounded-md border border-stone-300 bg-white p-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
            {[
              { id: 'vae', label: 'VAE ELBO' },
              { id: 'gan', label: 'GAN D* & 梯度' },
              { id: 'diff', label: 'DDPM & Flow' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setGenTab(t.id as 'vae' | 'gan' | 'diff')}
                className={`rounded px-2.5 py-0.5 cursor-pointer ${
                  genTab === t.id ? 'bg-stone-900 text-white dark:bg-blue-600' : 'text-stone-600 dark:text-zinc-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 text-xs">
          {genTab === 'vae' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 grid grid-cols-2 gap-3 font-mono">
                {[
                  { label: '后验均值 μ', val: mu, set: setMu, step: 0.1 },
                  { label: '对数方差 log(σ²)', val: logVar, set: setLogVar, step: 0.2 },
                  { label: '重建误差 ‖x−x̂‖²', val: reconMse, set: setReconMse, step: 0.05 },
                  { label: 'KL 权重 β', val: beta, set: setBeta, step: 0.1 },
                ].map((f) => (
                  <label key={f.label} className="space-y-1">
                    <span className="block text-[10px] text-stone-500">{f.label}</span>
                    <input type="number" step={f.step} value={f.val} onChange={(e) => setValNum(e.target.value, f.set)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
                  </label>
                ))}
              </div>
              <div className="lg:col-span-6 rounded-md border border-stone-200 bg-stone-50/60 p-4 font-mono text-[11px] space-y-1.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div>方差 σ² = exp({logVar.toFixed(2)}) = {sigma2.toFixed(4)}</div>
                <div>解析 KL = −½(1 + {logVar.toFixed(2)} − {mu.toFixed(2)}² − {sigma2.toFixed(3)}) = <strong className="text-red-700 dark:text-red-400">{vaeKl.toFixed(4)}</strong></div>
                <div className="border-t border-stone-200 pt-1.5 dark:border-zinc-800 text-blue-700 dark:text-blue-400 font-semibold">
                  −ELBO = Recon + β·KL = {vaeTotal.toFixed(4)}
                </div>
              </div>
            </div>
          )}

          {genTab === 'gan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 grid grid-cols-1 gap-3 font-mono">
                {[
                  { label: 'p_data(x)', val: pData, set: setPData, step: 0.05 },
                  { label: 'p_g(x)', val: pGen, set: setPGen, step: 0.05 },
                  { label: '当前判别器对假样本打分 D(G(z)) ∈ (0,1)', val: dFake, set: setDFake, step: 0.02 },
                ].map((f) => (
                  <label key={f.label} className="space-y-1">
                    <span className="block text-[10px] text-stone-500">{f.label}</span>
                    <input type="number" step={f.step} value={f.val} onChange={(e) => setValNum(e.target.value, f.set)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
                  </label>
                ))}
              </div>
              <div className="lg:col-span-7 rounded-md border border-stone-200 bg-stone-50/60 p-4 text-xs space-y-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div>
                  理论最优判别器 <InlineMath latex={String.raw`D^*(x) = \frac{p_{\text{data}}}{p_{\text{data}} + p_g}`} /> = <strong className="font-mono">{dOpt.toFixed(4)}</strong>
                </div>
                <div className="border-t border-stone-200 pt-2 dark:border-zinc-800">
                  <InlineMath latex={String.raw`L_2 = \log(1 - D)`} /> = <span className="font-mono">{satLoss.toFixed(4)}</span> | 梯度幅值 <InlineMath latex={String.raw`\left|\frac{\partial L_2}{\partial D}\right|`} /> = <strong className="font-mono">{satGrad.toFixed(2)}</strong>（<InlineMath latex="D \to 0" /> 时梯度极弱！）
                </div>
                <div className="text-emerald-700 dark:text-emerald-400">
                  <InlineMath latex={String.raw`L_1 = -\log D`} /> = <span className="font-mono">{nonSatLoss.toFixed(4)}</span> | 梯度幅值 <InlineMath latex={String.raw`\left|\frac{\partial L_1}{\partial D}\right|`} /> = <strong className="font-mono">{nonSatGrad.toFixed(2)}</strong>（非饱和强信号）
                </div>
              </div>
            </div>
          )}

          {genTab === 'diff' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 grid grid-cols-2 gap-3 font-mono">
                {[
                  { label: '噪声起点 x₀ (Flow)', val: x0, set: setX0, step: 0.2 },
                  { label: '目标数据 x₁', val: x1, set: setX1, step: 0.2 },
                  { label: '时间 t ∈ [0,1] (Flow)', val: tFlow, set: setTFlow, step: 0.1 },
                  { label: 'DDPM 累积保留率 ᾱ_t', val: alphaBar, set: setAlphaBar, step: 0.05 },
                  { label: 'DDPM 注入噪声 ε', val: epsNoise, set: setEpsNoise, step: 0.2 },
                ].map((f) => (
                  <label key={f.label} className="space-y-1">
                    <span className="block text-[10px] text-stone-500">{f.label}</span>
                    <input type="number" step={f.step} value={f.val} onChange={(e) => setValNum(e.target.value, f.set)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
                  </label>
                ))}
              </div>
              <div className="lg:col-span-6 rounded-md border border-stone-200 bg-stone-50/60 p-4 text-xs space-y-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="font-semibold text-stone-700 dark:text-zinc-300">DDPM 前向一步闭式采样</div>
                <div>
                  <InlineMath latex={String.raw`\sqrt{\bar{\alpha}_t} = ${Math.sqrt(Math.max(0, alphaBar)).toFixed(4)},\quad \sqrt{1-\bar{\alpha}_t} = ${Math.sqrt(Math.max(0, 1 - alphaBar)).toFixed(4)}`} />
                </div>
                <div>
                  <InlineMath latex={String.raw`x_t = \sqrt{\bar{\alpha}_t}\,x_1 + \sqrt{1-\bar{\alpha}_t}\,\varepsilon`} /> = <strong className="font-mono">{ddpmXt.toFixed(4)}</strong>
                </div>
                <div className="border-t border-stone-200 pt-2 dark:border-zinc-800 font-semibold text-blue-700 dark:text-blue-400">
                  Flow Matching 线性插值路径
                </div>
                <div>
                  <InlineMath latex={String.raw`x_t = (1-t)x_0 + t x_1`} /> = <strong className="font-mono">{flowXt.toFixed(4)}</strong>
                </div>
                <div>
                  目标常速度场 <InlineMath latex={String.raw`u_t = x_1 - x_0`} /> = <strong className="font-mono">{flowVel.toFixed(4)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Mode: L11 Bellman / TD & PPO Clipped Surrogate ---
  const tdTargetQ = rew + gamma * qNextMax;
  const tdErrQ = tdTargetQ - qOld;
  const qNewQ = qOld + alpha * tdErrQ;

  const tdTargetS = rew + gamma * qNextActual;
  const tdErrS = tdTargetS - qOld;
  const qNewS = qOld + alpha * tdErrS;

  const ratio = piNew / Math.max(1e-6, piOld);
  const unclipped = ratio * adv;
  const clippedR = Math.max(1 - epsClip, Math.min(1 + epsClip, ratio));
  const clipped = clippedR * adv;
  const ppoObj = Math.min(unclipped, clipped);
  const gradZero = (adv > 0 && ratio > 1 + epsClip) || (adv < 0 && ratio < 1 - epsClip);

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
            RL Numerical Verifier · L11
          </div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
            Q-Learning vs SARSA 单步 TD 验算器 & PPO 裁剪梯度精确判定器
          </h3>
        </div>
        <div className="flex rounded-md border border-stone-300 bg-white p-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
          <button onClick={() => setRlTab('td')} className={`rounded px-2.5 py-0.5 cursor-pointer ${rlTab === 'td' ? 'bg-stone-900 text-white dark:bg-blue-600' : ''}`}>
            Q-Learning vs SARSA
          </button>
          <button onClick={() => setRlTab('ppo')} className={`rounded px-2.5 py-0.5 cursor-pointer ${rlTab === 'ppo' ? 'bg-stone-900 text-white dark:bg-blue-600' : ''}`}>
            PPO Clipped Objective
          </button>
        </div>
      </div>

      <div className="p-5 text-xs">
        {rlTab === 'td' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 grid grid-cols-3 gap-2.5 font-mono">
              {[
                { label: '旧 Q(s, a)', val: qOld, set: setQOld, step: 0.5 },
                { label: '即时奖励 r', val: rew, set: setRew, step: 0.5 },
                { label: '折扣 γ', val: gamma, set: setGamma, step: 0.05 },
                { label: '学习率 α', val: alpha, set: setAlpha, step: 0.1 },
                { label: 'max Q(s′,a′)', val: qNextMax, set: setQNextMax, step: 0.5 },
                { label: '实际 Q(s′,a′_act)', val: qNextActual, set: setQNextActual, step: 0.5 },
              ].map((f) => (
                <label key={f.label} className="space-y-1">
                  <span className="block text-[10px] text-stone-500">{f.label}</span>
                  <input type="number" step={f.step} value={f.val} onChange={(e) => setValNum(e.target.value, f.set)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
              ))}
            </div>

            <div className="lg:col-span-6 space-y-2.5 font-mono text-[11px]">
              <div className="rounded-md border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="font-semibold text-blue-700 dark:text-blue-400">Off-Policy Q-Learning (使用 max Q)</div>
                <div>TD Target = {rew} + {gamma}×{qNextMax} = {tdTargetQ.toFixed(3)} | TD Error δ = {tdErrQ.toFixed(3)}</div>
                <div>Q_new(s, a) = <strong>{qNewQ.toFixed(4)}</strong></div>
              </div>
              <div className="rounded-md border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="font-semibold text-emerald-700 dark:text-emerald-400">On-Policy SARSA (使用实际动作 a′_act)</div>
                <div>TD Target = {rew} + {gamma}×{qNextActual} = {tdTargetS.toFixed(3)} | TD Error δ = {tdErrS.toFixed(3)}</div>
                <div>Q_new(s, a) = <strong>{qNewS.toFixed(4)}</strong></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 grid grid-cols-2 gap-3 font-mono">
              {[
                { label: '新策略概率 π_θ(a|s)', val: piNew, set: setPiNew, step: 0.05 },
                { label: '旧策略概率 π_old(a|s)', val: piOld, set: setPiOld, step: 0.05 },
                { label: '优势估计 Â_t (正=好动作, 负=坏动作)', val: adv, set: setAdv, step: 0.25 },
                { label: '裁剪半径 ε', val: epsClip, set: setEpsClip, step: 0.05 },
              ].map((f) => (
                <label key={f.label} className="space-y-1">
                  <span className="block text-[10px] text-stone-500">{f.label}</span>
                  <input type="number" step={f.step} value={f.val} onChange={(e) => setValNum(e.target.value, f.set)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
              ))}
            </div>

            <div className="lg:col-span-6 rounded-md border border-stone-200 bg-stone-50/60 p-4 text-xs space-y-2 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div>
                重要性采样比 <InlineMath latex={String.raw`r_t = \frac{\pi_\theta}{\pi_{\text{old}}}`} /> = <strong className="font-mono">{ratio.toFixed(4)}</strong>（安全区间 <InlineMath latex={`[${(1 - epsClip).toFixed(2)},\\, ${(1 + epsClip).toFixed(2)}]`} />）
              </div>
              <div>
                未裁剪项 <InlineMath latex={String.raw`r_t \hat{A}_t`} /> = <span className="font-mono">{unclipped.toFixed(4)}</span> | 裁剪项 <InlineMath latex={String.raw`\operatorname{clip}(r_t)\hat{A}_t`} /> = <span className="font-mono">{clipped.toFixed(4)}</span>
              </div>
              <div>
                最终目标 <InlineMath latex={String.raw`\min(\text{surr}_1, \text{surr}_2)`} /> = <strong className="font-mono">{ppoObj.toFixed(4)}</strong>
              </div>
              <div className={`pt-1.5 border-t border-stone-200 dark:border-zinc-800 font-semibold ${gradZero ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                梯度状态：{gradZero ? <><InlineMath latex={String.raw`\nabla_\theta L^{\text{CLIP}} = 0`} />（已触发裁剪截断，停止过度更新）</> : <><InlineMath latex={String.raw`\nabla_\theta L^{\text{CLIP}} \neq 0`} />（正常策略梯度更新生效）</>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function setValNum(raw: string, setter: (v: number) => void) {
  const n = parseFloat(raw);
  if (!Number.isNaN(n)) setter(n);
}
