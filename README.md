# ML Review Companion — 机器学习复习手册

> **Live Site:** https://ml-interactive-lab.vercel.app

一个面向期末复习的交互式机器学习学习站。内容按课程讲义 **L00–L16** 逐讲组织（模块编号与 Slides 文件编号一一对应），覆盖机器学习基础、深度学习、Transformer 与 LLM、图像生成模型和强化学习。纯静态构建，零后端；复习进度只保存在浏览器 localStorage 中，可导出 / 导入 JSON。

---

## 怎么用它复习

| 入口 | 作用 |
| --- | --- |
| **逐讲页面** `/lecture/:slug` | 考点速记 → 必记公式（可遮挡默写）→ **交互探索** → 推导链 → 图解 → 数值验算器 → 概念对比 → 公式↔代码 → 易错点 → Python 实测 → 本讲抽认卡与练习题。顶部可勾选「知识点自查表」并标记本讲掌握程度。 |
| **复习中心** `/review` | 今日到期卡片、练习正确率、错题数、连续复习天数；按 Part 列出每讲的自查 / 卡片 / 练习进度；根据错题与到期卡片推荐优先复习的讲次。 |
| **抽认卡** `/review/flashcards` | 间隔重复（SM-2 变体）：空格翻面，1–4 评分（忘了 / 模糊 / 记得 / 很熟）；可按讲次或整个 Part 过滤。 |
| **练习与错题** `/review/quiz` | 随机抽题、按讲全部、错题本三种模式；可按 WA 题型筛选（如 `?style=WA3 Q5`，作业对照页每题旁有「练这类题」入口）；选择题自动判分，计算 / 简答题对照参考答案自评，答错自动进入错题本。 |
| **公式速查** `/review/formulas` | 全部核心公式按讲次汇总，可搜索、遮挡默写、打印。 |
| **作业 ↔ 讲次** `/review/assignments` | WA1–WA4 每题考查的知识点、HA1–HA12 涉及的概念、Tutorial 对应的讲次。 |

> 练习题均为原创：计算题沿用 WA / 期末题型但换了数字，简答题对应常考概念。站点不复述作业原题与官方答案（课程材料受版权保护）。

---

## 课程覆盖（20 个模块）

| Part | 讲次 | 主题 |
| --- | --- | --- |
| 0 · Introduction | L00 | 课程地图、ML 四步法、熵 / 交叉熵 / KL、MLE ⇔ 最小化 KL |
| 1 · Foundations of ML | L01, L02.1, L02.2, L03 | 线性 / 多项式回归与正则化；Logistic / Softmax 与信息论；代理损失与 Naive Bayes；偏差-方差与集成学习 |
| 2 · Foundations of DL | L04, L05, L06, L07 | FNN 与反向传播；Dropout、优化器、BN / LN；CNN 与 ResNet；RNN、LSTM 与 Seq2Seq |
| 3 · Advanced DL | L08.1, L08.2, L08.3, L09 | Transformer 与 BERT；仅解码器 LLM（SFT、奖励模型、RLHF、RAG、LoRA、MoE）；Agentic AI（客座讲座）；ViT 与 CLIP |
| 4 · Generative Models | L10, L11, L12, L13 | VAE（ELBO、重参数化）；GAN（D*、JSD、两种生成器损失）；Diffusion（DDPM、DDIM、LDM、引导、EDM）；Flow Matching（CFM、ODE / SDE） |
| 5 · Reinforcement Learning | L14, L15, L16 | MDP、价值迭代、Q-Learning / SARSA；DQN、目标网络、经验回放、Double DQN；策略梯度、REINFORCE、Actor-Critic、PPO、SAC |

当前内容量：153 张抽认卡、196 道练习题（其中 30 道是按 WA1–WA4 原题题型编写的多小问计算题）、96 条核心公式、22 个交互组件，以及 29 组逐步推导。

### 交互组件一览

| 讲次 | 组件 |
| --- | --- |
| L00–L03 | 熵 / 交叉熵 / KL 拖动分布；多项式阶数与 λ 的过拟合实验；Logistic 决策边界与实时梯度下降；代理损失对比；25 个训练集的偏差-方差模拟 |
| L04–L07 | 激活函数与梯度消失；狭长山谷中的优化器赛跑；卷积逐格计算器（步长 / 填充 / 偏置 / ReLU）；RNN vs LSTM 梯度沿时间衰减 |
| L08.1–L09 | 可拖动 token 的自注意力游乐场（换 W^Q、缩放、因果掩码、打乱顺序）；温度与 Top-k 采样；Bradley–Terry 奖励模型；Agent 思考-行动-观察循环；ViT patch 切分；CLIP 对比矩阵 |
| L10–L13 | VAE 重参数化与 KL；一维 GAN 的最优判别器与 JSD；前向加噪（线性 / 余弦调度）；Flow Matching 粒子（条件直线路径 vs 精确边际速度 Euler 采样） |
| L14–L16 | 网格世界价值迭代；max 高估（DQN vs Double DQN）；老虎机上的 REINFORCE（有无基线） |

---

## 项目结构

```text
src/
├── data/
│   ├── lectures.ts                 # L00–L16 索引与 Part 分组
│   ├── lecturesPart0.ts … Part5.ts # 每讲：推导、概念、公式↔代码、易错点、沙盒
│   └── review/                     # 每讲：考点速记、公式、抽认卡、练习题（extraQuiz.ts 第二批；waDrills.ts 为脚本生成并独立复核的 WA 题型计算题）；作业 ↔ 讲次映射
├── types/                          # curriculum.ts（讲义模块）· review.ts（复习内容）
├── utils/progress.ts               # localStorage 进度、间隔重复调度、导入导出
├── components/
│   ├── explore/                    # 交互组件（kit.tsx：卡片、滑块、带悬停的折线图；Part01–Part5）
│   ├── review/                     # 抽认卡、练习题卡片、讲次过滤器、状态标记
│   ├── Figures/ · Verifiers/       # 2D / 3D 图解与可编辑数值验算器
│   └── DerivationChain · FormulaCodeSync · PythonSandbox · RichText …
├── pages/
│   ├── HomePage.tsx · ModulePage.tsx
│   └── review/                     # 复习中心、抽认卡、练习、公式速查、作业对照
scripts/check-content.ts            # 内容校验：KaTeX 全量渲染、ID 唯一、选择题答案、引用完整性
```

---

## 本地运行

```bash
pnpm install
pnpm dev             # 本地开发服务器
pnpm check:content   # 校验全部 LaTeX 能被 KaTeX 渲染，以及数据完整性
pnpm build           # TypeScript 严格检查 + 生产构建
```

技术栈：Vite 6 · React 19 · TypeScript · Tailwind CSS v4 · KaTeX · CodeMirror 6 · Pyodide（浏览器内 Python + NumPy）。部署在 Vercel（`main` 分支自动部署）。

### 添加或修改内容

- 讲义内容：编辑 `src/data/lecturesPartN.ts`。含 LaTeX 的字符串请用 `String.raw`，否则 `\mathbf` 之类的反斜杠会被 JavaScript 吞掉。
- 复习内容：编辑 `src/data/review/*.ts`（文件内用 `` r`...` `` 作为 `String.raw` 的简写）。卡片与题目的 `id` 必须唯一，修改 id 会丢失该条的复习记录。
- 修改后运行 `pnpm check:content` 与 `pnpm build`。
