# ML Interactive Lab — 交互式机器学习原理实验室

一个纯静态、零后端成本、可直接部署到 Vercel / Cloudflare Pages 的交互式机器学习原理可视化与实验平台，覆盖现代机器学习全脉络（Part 0 – Part 5）：

- **Part 0 · 概率论基础与信息论**：Entropy / Cross-Entropy / KL Divergence 非对称性、Beta-Binomial MLE vs MAP
- **Part 1 · 机器学习基础**：多项式回归与 Ridge 正则化、Bias²–Variance 22 次重采样分解、判别式 Softmax 回归 vs 生成式分类 (LDA / QDA)
- **Part 2 · 深度学习基础**：可交互计算图前向/反向传播 (Dead ReLU 演示)、SGD / Momentum / RMSProp / Adam 损失地形竞速、CNN 卷积核扫描器、ResNet / LSTM 梯度高速公路
- **Part 3 · 高级深度学习**：Self-Attention 矩阵热力图与 BERT 双向 vs GPT 因果掩码、√d_k 缩放饱和实测、ViT Patch 切分与 CLIP 对称图文对比学习
- **Part 4 · 图像生成模型**：VAE 2D 潜空间连续漫游与 β-ELBO 权衡、GAN 1D 博弈与 Mode Collapse、DDPM 扩散模型 vs Flow Matching 直线粒子流场对比
- **Part 5 · 强化学习导论**：可编辑 GridWorld 迷宫（Value Iteration & Q-Learning）、PPO Clipped Surrogate 裁剪目标函数

## 核心特性

1. **60fps 实时交互实验室**：原生 TypeScript + Canvas/SVG 实时数值演算，拖动滑块或点击画布零延迟反馈。
2. **公式 ↔ 代码双向联动**：基于 KaTeX `\htmlClass` 精确绑定数学公式子表达式与 NumPy / PyTorch 实现代码，附张量维度（Shape Trace）与步进拆解。
3. **浏览器内真实运行 Python / NumPy**：基于 Pyodide (WebAssembly) + Web Worker，零后端服务器，支持在线修改代码并自动渲染曲线图表。

## 本地开发与构建

```bash
pnpm install
pnpm dev      # 本地开发预览
pnpm build    # TypeScript 严格检查 + 生产构建
```

## 技术栈

Vite 6 · React 19 · TypeScript · Tailwind CSS v4 · KaTeX · CodeMirror 6 · Pyodide (WebAssembly)
