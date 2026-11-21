# ML Study Monograph — 机器学习原理深度研学手册

> **Live Site:** https://ml-interactive-lab.vercel.app

一个采用 **Distill.pub / CS231n 学术专著风格** 构建的交互式机器学习深度研学平台，面向系统化攻克晦涩课程讲义（PPT）、书面数学推导与手算题（WA）以及编程作业工程实现（HA）。纯静态构建，零后端服务器成本，支持在浏览器内直接运行 Python / NumPy 验证脚本。

---

## 设计理念与核心能力

每讲独立组织为严谨的 7 段式研学工作流（**§1 推导链 → §2 几何与高维图解 → §3 数值矩阵验算器 → §4 概念对照 → §5 公式↔代码映射 → §6 作业排坑 → §7 Python 实测**）：

1. **零跳步交互数学推导链 (`DerivationChain`)**
   将讲义中跨度最大的 16 组核心数学证明拆解为逐行严谨等式，每步显式标注所用的微积分、矩阵求导或概率论法则，支持一键切换「逐行自测模式」与「全部展开模式」。
2. **学术级几何与可旋转 3D 高维图解 (`Figures`)**
   用克制的论文级科学配色与可拖拽 3D 透视投影引擎，直观展现高维结构：3D Ridge 平谷变凸碗、XOR 三维特征升维超平面 $(x_1, x_2, x_1x_2)$、3D 非凸鞍点/峡谷优化轨迹、3D BN/LN 激活张量切片、3D CLIP 单位超球面 $S^2$、3D 瑞士卷 DDPM vs Flow Matching 粒子流形以及 3D Bellman 最优价值山峰 $V^*(s)$。
3. **可自定义输入的矩阵与梯度数值验算器 (`Verifiers`)**
   覆盖全部 12 讲，支持直接修改输入矩阵、向量与超参数，精确展开所有中间矩阵、梯度向量与中心差分数值验证（相对误差 `< 1e-8`），直接辅助核对书面作业与手算推导。
4. **公式 $\leftrightarrow$ 代码双向映射 & 浏览器内 Pyodide 实测**
   基于 KaTeX `\htmlClass` 实现公式子表达式与 NumPy / PyTorch 代码行双向高亮联动并标注 Tensor Shape；内置 Web Worker 驱动的 Pyodide (WebAssembly Python + NumPy) 沙盒，可直接修改代码并自动渲染 SVG 曲线图。

---

## 全 12 讲课程覆盖矩阵 (`L01` – `L11`)

| 讲次 | 主题 | 零跳步数学推导 | 几何与高维图解 | 可编辑数值验算器 |
| --- | --- | --- | --- | --- |
| **L01** | 线性/多项式回归与正则化 | Ridge 矩阵微积分闭式解；高斯噪声 MLE = MSE | 3D Ridge 损失曲面 + 2D L1/L2 稀疏几何 | OLS / Ridge 逐步矩阵验算器（含 $w_0$ 惩罚对照） |
| **L02.1** | 信息论、Logistic 与 Softmax | Logistic 交叉熵梯度约分；双高斯闭式 KL 散度 | 双高斯 KL/交叉熵曲线 + Softmax 温度分布 | Logistic 单步 Batch GD 逐样本验算器 |
| **L02.2** | 凸代理损失与 Naive Bayes | Naive Bayes 条件独立分解与对数域线性边界 | 0/1 凸代理上界 + **3D XOR 特征升维超平面** | Naive Bayes + Laplace 平滑 & 代理损失梯度表 |
| **L03** | Bias-Variance 与集成学习 | 期望泛化误差三项分解（交叉项严格消零证明） | 经典 Bias²–Variance–Noise U 形权衡曲线 | 60 组重采样 Monte Carlo 精确分解表 |
| **L04** | FNN、激活函数与反向传播 | $L$ 层矩阵反向传播递归方程 $\delta^{(l)}$ | Sigmoid / Tanh / ReLU / GELU 函数与导数对比 | 2 层 ReLU+Softmax 全中间矩阵 + 数值梯度检查 |
| **L05** | Dropout、优化器与归一化 | Adam 一/二阶矩偏差修正 $(1-\beta^t)$ 等比推导 | **3D 鞍点/峡谷优化轨迹** + **3D BN/LN 张量切片** | BatchNorm vs LayerNorm 矩阵 & Adam vs AdamW |
| **L06** | CNN、1×1 卷积与 ResNet | ResNet 恒等跳连无损梯度高速公路证明 | 3×3 堆叠感受野扩张 + ResNet 对数梯度衰减曲线 | 2D Conv+Bias+ReLU 逐格算式 & 多通道 FLOPs 计算器 |
| **L07** | RNN、LSTM 与 Seq2Seq | Vanilla RNN BPTT 谱半径衰减 vs LSTM 记忆通路 | BPTT 梯度幅值随序列步长 $T$ 对数演化曲线 | LSTM 单步四门控精确演算 & $T$ 步梯度留存对比 |
| **L08** | Transformer、BERT 与 LLM | 严格证明 $\text{Var}(\mathbf{q}^\top\mathbf{k}) = d_k$ 与 $\div\sqrt{d_k}$ | Sinusoidal 位置编码频谱热力图 + 点积方差膨胀 | 可编辑 $X, W_Q, W_K$ 的 Self-Attention 全矩阵演算 |
| **L09** | ViT 与 CLIP 多模态对比 | CLIP 对称 InfoNCE 对比损失与单位球面投影 | **3D CLIP 单位超球面 $S^2$ 图文对齐几何** | CLIP 对比矩阵精确验算 & ViT 序列二次复杂度 |
| **L10** | VAE、GAN、Diffusion 与 Flow | VAE ELBO 精确恒等式；GAN $D^*\to\text{JSD}$；DDPM 一步前向 | **3D 瑞士卷 DDPM vs Flow ODE** + GAN 梯度曲线 | VAE ELBO / GAN 梯度 / DDPM & Flow 数值验算器 |
| **L11** | 强化学习：MDP、DQN 与 PPO | Policy Gradient Log-Derivative Trick 与 Baseline 无偏性 | **3D Bellman 价值山峰 $V^*(s)$** + PPO 裁剪曲线 | Q-Learning vs SARSA TD 更新 & PPO 裁剪梯度判定 |

---

## 项目结构

```text
ml-interactive-lab/
├── index.html
├── vercel.json                       # SPA 路由回退配置
├── vite.config.ts                    # 按模块分包（verifiers / figures / lectures-data / vendors）
└── src/
    ├── App.tsx & main.tsx
    ├── index.css                     # Distill.pub 风格排版与交互公式色标
    ├── types/curriculum.ts           # Lecture / Derivation / Verifier / FormulaCode 类型定义
    ├── utils/projection3d.ts         # 轻量 Retina DPR 3D 透视投影与学术配色引擎
    ├── workers/pyodide.worker.ts     # Web Worker 懒加载 Pyodide + NumPy 与 SVG 绘图桥接
    ├── data/
    │   ├── lectures.ts               # 全 12 讲索引与分组
    │   ├── lecturesPart1.ts          # L01 – L03
    │   ├── lecturesPart2.ts          # L04 – L07
    │   └── lecturesPart3.ts          # L08 – L11
    ├── components/
    │   ├── Layout.tsx                # 学术目录侧边栏与 Light/Dark 切换
    │   ├── MathFormula.tsx           # KaTeX 渲染器（支持 \htmlClass 交互绑定）
    │   ├── DerivationChain.tsx       # 零跳步推导链（支持逐行自测）
    │   ├── FormulaCodeSync.tsx       # 公式 <-> NumPy/PyTorch 双向联动与 Shape 追踪
    │   ├── PythonSandbox.tsx         # CodeMirror 6 + Pyodide 浏览器执行与自动绘图
    │   ├── Figures/                  # L01–L11 学术级 2D/3D 几何与高维交互图解
    │   └── Verifiers/                # L01–L11 可编辑矩阵与梯度数值验算器
    └── pages/
        ├── HomePage.tsx              # 研学手册总览与 12 讲目录索引
        └── ModulePage.tsx            # 统一 Lecture 7 段式研学页模板
```

---

## 技术栈与本地运行

- **核心框架**：Vite 6 · React 19 · TypeScript · Tailwind CSS v4
- **公式与代码**：KaTeX · CodeMirror 6 · Pyodide (WebAssembly Python + NumPy)
- **部署平台**：Vercel（已开启 `main` 分支自动 CI/CD，亦兼容 Cloudflare Pages）

```bash
# 安装依赖
pnpm install

# 启动本地开发服务器
pnpm dev

# TypeScript 严格类型检查与生产构建
pnpm build
```
