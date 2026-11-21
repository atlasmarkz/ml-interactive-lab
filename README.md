# ML Study Monograph — 机器学习原理深度研学手册

面向深度学习与机器学习课程的系统化交互式研学手册（L01–L11），以 Distill.pub / CS231n 学术排版风格组织，聚焦攻克讲义晦涩推导、书面作业数学演算与工程代码实现。

## 核心模块

1. **零跳步交互数学推导链 (`DerivationChain`)**：覆盖 OLS/Ridge 矩阵微积分、高斯 MLE = MSE、Logistic/Softmax 交叉熵梯度、双高斯闭式 KL、Naive Bayes、Bias-Variance 三项分解、多层矩阵反向传播、Adam 偏差修正、ResNet 梯度高速公路、RNN/LSTM BPTT、Self-Attention √d_k 方差证明、CLIP InfoNCE、VAE ELBO、GAN 最优判别器与 JSD、DDPM 一步前向加噪、Policy Gradient Theorem 与 Baseline 无偏证明。
2. **可编辑矩阵与梯度数值验算器 (`Verifiers`)**：支持直接修改输入矩阵与超参数，实时展开全部中间矩阵与精确数值（OLS/Ridge、Logistic 单步 Batch GD、Naive Bayes Laplace 平滑、Monte Carlo Bias-Variance 分解、MLP 前向/反向 + 数值梯度检查、BatchNorm/LayerNorm & AdamW、2D Conv + ReLU & FLOPs、LSTM 门控衰减、Self-Attention 全矩阵、CLIP 对比矩阵、VAE/GAN/DDPM/Flow、TD Q-Learning/SARSA & PPO 裁剪）。
3. **公式 ↔ 代码精确映射 + Pyodide 浏览器验证**：逐行绑定数学符号与 NumPy/PyTorch 实现并标注张量维度，内置浏览器端 Pyodide NumPy 实测验证脚本与高频作业踩坑警示。

## 开发与构建

```bash
pnpm install
pnpm dev
pnpm build
```
