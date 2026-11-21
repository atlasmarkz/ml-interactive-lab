import { LectureModule } from '../types/curriculum';

export const LECTURES_PART_2: LectureModule[] = [
  {
    id: 'l04',
    code: 'L04',
    partGroup: 'Part II · Deep Learning Foundations',
    slug: 'l04-fnn-backprop',
    titleZh: '前馈神经网络、激活函数与反向传播 (FNN & Backprop)',
    titleEn: 'Feedforward Neural Networks, Activations & Backpropagation',
    abstract: String.raw`从万能逼近定理与现代激活函数演进（Sigmoid → ReLU → GELU / SwiGLU）出发，以矩阵微积分严密推导多层网络的反向传播递归公式 $\boldsymbol{\delta}^{(l)}$，并掌握概率输出头设计与数值梯度检查（Gradient Checking）。`,
    readingChecklist: [
      '为何没有非线性激活的多层线性网络等价于单层线性变换',
      '激活函数全景与导数饱和：Sigmoid / Tanh / ReLU / Leaky ReLU / ELU / Softplus / GLU / SwiGLU',
      '输出层概率建模统一：Linear-Gaussian (MSE)、Sigmoid-Bernoulli (BCE)、Softmax-Categorical (CE)',
      String.raw`反向传播误差项 $\boldsymbol{\delta}^{(l)} = \frac{\partial L}{\partial \mathbf{z}^{(l)}}$ 的矩阵递归链式法则（对应 HA02）`,
      'Xavier / He 权重初始化与数值中心差分梯度检查',
    ],
    verifierId: 'l04-mlp-backprop',
    derivations: [
      {
        id: 'd-l04-backprop',
        title: String.raw`零跳步推导 $L$ 层前馈神经网络反向传播四条核心矩阵方程`,
        goal: String.raw`设第 $l$ 层满足 $\mathbf{z}^{(l)} = \mathbf{W}^{(l)} \mathbf{a}^{(l-1)} + \mathbf{b}^{(l)}$，$\mathbf{a}^{(l)} = \sigma(\mathbf{z}^{(l)})$。定义第 $l$ 层误差向量 $\boldsymbol{\delta}^{(l)} \equiv \frac{\partial L}{\partial \mathbf{z}^{(l)}}$，推导如何由第 $l+1$ 层递推第 $l$ 层及所有参数梯度。`,
        steps: [
          {
            rule: String.raw`Output Layer Error $\boldsymbol{\delta}^{(L)}$`,
            latex: String.raw`\boldsymbol{\delta}^{(L)} \equiv \frac{\partial L}{\partial \mathbf{z}^{(L)}} = \frac{1}{N}(\mathbf{P} - \mathbf{Y}) \quad (\text{Softmax + Cross-Entropy})`,
            justification: String.raw`输出层误差是反向传播的边界起点，直接复用 L02.1 推导出的简洁结论 $\mathbf{P} - \mathbf{Y}$。`,
          },
          {
            rule: 'Multivariate Chain Rule Across Layers',
            latex: String.raw`\delta^{(l)}_j = \frac{\partial L}{\partial z^{(l)}_j} = \sum_k \frac{\partial L}{\partial z^{(l+1)}_k}\frac{\partial z^{(l+1)}_k}{\partial a^{(l)}_j}\frac{\partial a^{(l)}_j}{\partial z^{(l)}_j} = \left(\sum_k W^{(l+1)}_{kj}\,\delta^{(l+1)}_k\right)\sigma'\!\big(z^{(l)}_j\big)`,
            justification: String.raw`神经元 $a_j^{(l)}$ 通过权重 $W_{kj}^{(l+1)}$ 影响下一层所有神经元 $k$，因此必须对全部下游路径 $k$ 求和！`,
          },
          {
            rule: 'Vectorized Error Recursion',
            latex: String.raw`\boldsymbol{\delta}^{(l)} = \Big(\big(\mathbf{W}^{(l+1)}\big)^\top \boldsymbol{\delta}^{(l+1)}\Big) \odot \sigma'\!\big(\mathbf{z}^{(l)}\big)`,
            justification: String.raw`把求和写成转置矩阵乘法：前向乘 $\mathbf{W}$，反向乘 $\mathbf{W}^\top$，再逐元素乘激活导数（对 ReLU 就是二进制掩码 $\mathbb{1}[\mathbf{z} > 0]$）。`,
          },
          {
            rule: 'Parameter Gradients',
            latex: String.raw`\frac{\partial L}{\partial \mathbf{W}^{(l)}} = \boldsymbol{\delta}^{(l)}\big(\mathbf{a}^{(l-1)}\big)^\top, \qquad \frac{\partial L}{\partial \mathbf{b}^{(l)}} = \boldsymbol{\delta}^{(l)}`,
            justification: String.raw`因为 $z_j^{(l)} = \sum_i W_{ji}^{(l)} a_i^{(l-1)} + b_j^{(l)}$，对 $W_{ji}^{(l)}$ 求偏导恰好乘上输入激活 $a_i^{(l-1)}$，写为外积形式即一行矩阵乘法！`,
          },
        ],
        conclusion: String.raw`反向传播的本质不是新算法，而是计算图上复用中间节点 $\boldsymbol{\delta}^{(l)}$ 的动态规划——仅需 $\mathcal{O}(1)$ 次反向扫描即可同时算出百万参数的全部梯度。`,
      },
    ],
    concepts: [
      {
        heading: '现代激活函数演进与关键性质对照',
        body: '激活函数的导数形态直接决定了深层网络能否顺利传播梯度。',
        table: {
          headers: ['激活函数', '表达式', '导数特性与适用场景'],
          rows: [
            ['Sigmoid', String.raw`$\frac{1}{1 + e^{-z}}$`, String.raw`导数最大仅 $0.25$，深层连乘指数级梯度消失，仅用于二分类输出头或门控`],
            ['Tanh', String.raw`$\frac{e^z - e^{-z}}{e^z + e^{-z}}$`, String.raw`零中心输出 $(-1, 1)$，导数最大 $1.0$，常用于 RNN / LSTM 候选状态`],
            ['ReLU', String.raw`$\max(0, z)$`, String.raw`正半轴导数恒为 $1$ 缓解梯度消失；负半轴导数为 $0$（Dead ReLU）`],
            ['Leaky ReLU / ELU', String.raw`$\max(\alpha z, z)$ / $\alpha(e^z - 1)$`, '负半轴保留非零斜率，消除 Dead ReLU 神经元永久死亡'],
            ['SwiGLU (现代 LLM)', String.raw`$\text{Swish}(\mathbf{x}\mathbf{W}) \odot (\mathbf{x}\mathbf{V})$`, '结合平滑非单调激活与元素级门控，已成为 LLaMA / Qwen / Gemma FFN 标配'],
          ],
        },
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l04-mlp',
        title: '两层 ReLU + Softmax 网络完整前向/反向实现（对应 HA02）',
        subtitle: String.raw`行批量矩阵约定 $(N, D)$：前向 $\mathbf{X}\mathbf{W}_1$，反向 $\mathbf{X}^\top \boldsymbol{\delta}_1$`,
        latex: String.raw`\htmlClass{formula-token formula-token-output token-h}{\mathbf{H}} = \text{ReLU}(\mathbf{X}\mathbf{W}_1 + \mathbf{b}_1), \quad \htmlClass{formula-token formula-token-loss token-d2}{\boldsymbol{\delta}_2} = \frac{\mathbf{P}-\mathbf{Y}}{N}, \quad \htmlClass{formula-token formula-token-loss token-d1}{\boldsymbol{\delta}_1} = (\boldsymbol{\delta}_2 \mathbf{W}_2^\top)\odot \htmlClass{formula-token formula-token-hyper token-mask}{\mathbb{1}[\mathbf{Z}_1>0]}`,
        numpyCode: `def mlp_loss_and_grads(W1, b1, W2, b2, X, y, reg=1e-3):
    N = X.shape[0]
    Z1 = X @ W1 + b1                            # (N, H)
    H = np.maximum(0.0, Z1)                     # (N, H)
    Z2 = H @ W2 + b2                            # (N, K)
    Z2 -= Z2.max(axis=1, keepdims=True)
    P = np.exp(Z2) / np.exp(Z2).sum(axis=1, keepdims=True)
    loss = -np.mean(np.log(P[np.arange(N), y] + 1e-12))
    loss += 0.5 * reg * (np.sum(W1*W1) + np.sum(W2*W2))
    d2 = P.copy()
    d2[np.arange(N), y] -= 1.0
    d2 /= N                                     # δ2: (N, K)
    dW2 = H.T @ d2 + reg * W2                   # (H, K)
    db2 = d2.sum(axis=0)                        # (K,)
    d1 = (d2 @ W2.T) * (Z1 > 0)                 # δ1: (N, H)
    dW1 = X.T @ d1 + reg * W1                   # (D, H)
    db1 = d1.sum(axis=0)                        # (H,)
    return loss, dW1, db1, dW2, db2`,
        pytorchCode: `import torch.nn as nn, torch.nn.functional as F

class TwoLayerMLP(nn.Module):
    def __init__(self, D, H, K):
        super().__init__()
        self.fc1 = nn.Linear(D, H)
        self.fc2 = nn.Linear(H, K)

    def forward(self, x):
        return self.fc2(F.relu(self.fc1(x)))`,
        terms: [
          { id: 'h', label: String.raw`隐藏激活 $\mathbf{H}$`, role: 'output', shape: '(N, H)', explanation: String.raw`前向必须保留 $\mathbf{Z}_1$ 和 $\mathbf{H}$ 供反向传播使用。`, numpyLines: [3, 4], pytorchLines: [10] },
          { id: 'd2', label: String.raw`输出误差 $\boldsymbol{\delta}_2$`, role: 'loss', shape: '(N, K)', explanation: String.raw`所有反向梯度的源头，注意除以批量大小 $N$。`, numpyLines: [10, 11, 12], pytorchLines: [10] },
          { id: 'mask', label: String.raw`ReLU 导数掩码 $\mathbb{1}[\mathbf{Z}_1>0]$`, role: 'hyper', shape: '(N, H) bool', explanation: String.raw`逐元素截断 $Z_1 \le 0$ 的神经元回传梯度。`, numpyLines: [15], pytorchLines: [10] },
          { id: 'd1', label: String.raw`隐藏层误差 $\boldsymbol{\delta}_1$`, role: 'loss', shape: '(N, H)', explanation: String.raw`先由 $\boldsymbol{\delta}_2 \mathbf{W}_2^\top$ 投影回隐藏维度，再乘 ReLU 掩码。`, numpyLines: [15, 16, 17], pytorchLines: [10] },
        ],
      },
    ],
    pitfalls: [
      {
        title: '全零初始化权重导致“对称性破缺失败”',
        detail: String.raw`线性/逻辑回归可以初始化 $\mathbf{W} = \mathbf{0}$，但深层神经网络若 $\mathbf{W}_1 = \mathbf{0}$，同层所有隐藏单元前向输出和反向梯度永远完全相同，$100$ 个神经元退化为 $1$ 个神经元！必须随机初始化（ReLU 配 He / Kaiming 初始化 $\mathcal{N}(0, 2/n_{\text{in}})$）。`,
      },
    ],
    sandbox: {
      id: 'sb-l04',
      title: 'Pyodide 实测：全参数解析反向传播 vs 中心差分数值梯度检查',
      description: String.raw`验证你对 $\mathbf{W}_1, \mathbf{b}_1, \mathbf{W}_2, \mathbf{b}_2$ 的解析梯度与数值差分相对误差 $< 10^{-8}$。`,
      starterCode: `import numpy as np

rng = np.random.default_rng(42)
X = rng.normal(0, 1, (8, 4))
y = rng.integers(0, 3, size=8)
params = {
    "W1": rng.normal(0, 0.5, (4, 6)), "b1": rng.normal(0, 0.1, (6,)),
    "W2": rng.normal(0, 0.5, (6, 3)), "b2": rng.normal(0, 0.1, (3,)),
}

def loss_and_grads(p, reg=1e-2):
    N = X.shape[0]
    Z1 = X @ p["W1"] + p["b1"]
    H = np.maximum(0.0, Z1)
    Z2 = H @ p["W2"] + p["b2"]
    Z2 -= Z2.max(axis=1, keepdims=True)
    P = np.exp(Z2) / np.exp(Z2).sum(axis=1, keepdims=True)
    loss = -np.mean(np.log(P[np.arange(N), y])) + 0.5 * reg * (np.sum(p["W1"]**2) + np.sum(p["W2"]**2))
    d2 = P.copy(); d2[np.arange(N), y] -= 1.0; d2 /= N
    d1 = (d2 @ p["W2"].T) * (Z1 > 0)
    grads = {
        "W2": H.T @ d2 + reg * p["W2"], "b2": d2.sum(axis=0),
        "W1": X.T @ d1 + reg * p["W1"], "b1": d1.sum(axis=0),
    }
    return loss, grads

_, grads = loss_and_grads(params)
eps = 1e-5
for name in ["W1", "b1", "W2", "b2"]:
    arr = params[name]
    num = np.zeros_like(arr)
    it = np.nditer(arr, flags=["multi_index"])
    while not it.finished:
        idx = it.multi_index
        old = arr[idx]
        arr[idx] = old + eps; lp, _ = loss_and_grads(params)
        arr[idx] = old - eps; lm, _ = loss_and_grads(params)
        arr[idx] = old
        num[idx] = (lp - lm) / (2 * eps)
        it.iternext()
    rel = np.max(np.abs(num - grads[name]) / (np.abs(num) + np.abs(grads[name]) + 1e-12))
    print(f"Param {name:2s} | max relative gradient error = {rel:.2e}  ({'PASS' if rel < 1e-7 else 'FAIL'})")
`,
    },
  },
  {
    id: 'l05',
    code: 'L05',
    partGroup: 'Part II · Deep Learning Foundations',
    slug: 'l05-optimization-norm-dropout',
    titleZh: '深度学习核心机制：Dropout、自适应优化器与归一化',
    titleEn: 'Dropout, Adaptive Optimizers (Adam/AdamW) & Normalization',
    abstract:
      '系统掌握训练深层网络的三大工程与数学支柱：Inverted Dropout 作为隐式指数级 Bagging 集成的期望守恒原理；从 Momentum、AdaGrad、RMSProp 到 Adam 偏差修正与 AdamW 解耦衰减的演进逻辑；以及 BatchNorm vs LayerNorm 的严格区别与推理切换。',
    readingChecklist: [
      String.raw`Dropout 训练时随机失活掩码与 Inverted Dropout 除以 $(1 - p)$ 缩放细节`,
      'Momentum 指数滑动动量与病态峡谷震荡抑制',
      'AdaGrad 学习率枯竭痛点 → RMSProp 指数遗忘修复 → Adam 偏差修正推导',
      String.raw`Adam + $L_2$ 正则与 AdamW 解耦 Weight Decay 的数学差异`,
      'BatchNorm 训练 (Mini-batch 统计) vs 推理 (Running Stats) 与 LayerNorm 在 NLP 中的不可替代性',
    ],
    verifierId: 'l05-norm-opt',
    derivations: [
      {
        id: 'd-l05-adam-bias',
        title: String.raw`推导 Adam 一阶矩/二阶矩偏差修正分母 $(1 - \beta^t)$ 的精确来源`,
        goal: String.raw`设初始 $m_0 = 0$，更新规则 $m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t$。证明若不做修正，初期 $\mathbb{E}[m_t]$ 会严重偏向 $0$，并导出精确修正因子。`,
        steps: [
          {
            rule: 'Unroll Recurrence',
            latex: String.raw`m_t = (1 - \beta_1)\sum_{i=1}^t \beta_1^{t-i}\, g_i`,
            justification: String.raw`反复把 $m_{t-1}$ 展开代入直至 $m_0 = 0$，得到历史梯度的几何加权和。`,
          },
          {
            rule: 'Take Expectation & Geometric Series',
            latex: String.raw`\mathbb{E}[m_t] = \mathbb{E}[g]\cdot (1-\beta_1)\sum_{i=1}^t \beta_1^{t-i} = \mathbb{E}[g]\cdot (1-\beta_1)\frac{1-\beta_1^t}{1-\beta_1} = \mathbb{E}[g]\,(1 - \beta_1^t)`,
            justification: String.raw`近似假设短期内 $\mathbb{E}[g_i] \approx \mathbb{E}[g]$，利用等比数列求和公式 $\sum_{k=0}^{t-1} \beta_1^k = \frac{1-\beta_1^t}{1-\beta_1}$。`,
          },
          {
            rule: 'Unbiased Estimator',
            latex: String.raw`\hat{m}_t = \frac{m_t}{1-\beta_1^t}, \qquad \hat{v}_t = \frac{v_t}{1-\beta_2^t}`,
            justification: String.raw`两边除以 $(1 - \beta_1^t)$ 即恢复无偏估计！尤其对 $\beta_2 = 0.999$，第 $1$ 步 $1 - \beta_2^1 = 0.001$，若不修正 $v_1$ 会比真实梯度平方小 $1000$ 倍导致首步步长爆炸！`,
          },
        ],
        conclusion: String.raw`当 $t$ 变大后 $\beta^t \to 0$，修正因子自动平滑退化为 $1$，只在训练初期起关键稳定作用。`,
      },
    ],
    concepts: [
      {
        heading: 'BatchNorm vs LayerNorm 全方位对比（WA3 Q3 高频考题）',
        body: String.raw`两者公式完全一致 $y = \gamma \frac{x - \mu}{\sqrt{\sigma^2 + \varepsilon}} + \beta$，唯一区别是计算均值 $\mu$ 与方差 $\sigma^2$ 所跨越的张量维度。`,
        table: {
          headers: ['维度', 'Batch Normalization (BN)', 'Layer Normalization (LN)'],
          rows: [
            ['归一化轴', String.raw`跨 Batch 维 $N$（及空间 $H, W$），每个通道 $C$ 独立统计`, String.raw`跨特征维 $C$，每个样本 / 每个 Token 独立统计`],
            ['Batch Size 依赖', String.raw`强依赖大 Batch；Batch 太小（如 $2\sim 4$）方差估计崩溃`, String.raw`完全独立于 Batch Size，$N=1$ 依然精确`],
            ['变长序列 (NLP)', '不同句子长度与 Padding 污染同时间步统计量', '逐 Token 独立计算，天然支持任意变长序列'],
            ['训练 vs 推理', '推理必须切换为训练期累积的 Running Mean / Var', '训练与推理计算公式完全一致，无状态负担'],
          ],
        },
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l05-adamw',
        title: 'AdamW 解耦权重衰减与 Inverted Dropout',
        subtitle: '现代深度学习与大语言模型默认优化器公式与代码对应',
        latex: String.raw`\htmlClass{formula-token formula-token-output token-m}{m_t = \beta_1 m_{t-1} + (1-\beta_1)g_t}, \quad \htmlClass{formula-token formula-token-hyper token-v}{v_t = \beta_2 v_{t-1} + (1-\beta_2)g_t^2}, \quad \htmlClass{formula-token formula-token-param token-w}{\theta_t = (1-\eta\lambda)\theta_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t}+\epsilon}}`,
        numpyCode: `def adamw_step(theta, g, m, v, t, lr=1e-3, b1=0.9, b2=0.999, wd=1e-2, eps=1e-8):
    m = b1 * m + (1.0 - b1) * g
    v = b2 * v + (1.0 - b2) * (g * g)
    m_hat = m / (1.0 - b1 ** t)
    v_hat = v / (1.0 - b2 ** t)
    # 解耦权重衰减直接乘在参数上，不被 sqrt(v_hat) 扭曲
    theta = theta * (1.0 - lr * wd) - lr * m_hat / (np.sqrt(v_hat) + eps)
    return theta, m, v`,
        pytorchCode: `import torch.optim as optim

optimizer = optim.AdamW(model.parameters(), lr=1e-3, betas=(0.9, 0.999), weight_decay=1e-2)
optimizer.zero_grad()
loss.backward()
optimizer.step()`,
        terms: [
          { id: 'm', label: String.raw`一阶矩 $m_t$`, role: 'output', shape: 'same as θ', explanation: '梯度指数滑动平均（动量），平滑随机小批量噪声。', numpyLines: [2, 4], pytorchLines: [3, 6] },
          { id: 'v', label: String.raw`二阶矩 $v_t$`, role: 'hyper', shape: 'same as θ', explanation: '逐参数梯度平方均值，为陡峭/平缓方向提供自适应步长缩放。', numpyLines: [3, 5], pytorchLines: [3, 6] },
          { id: 'w', label: String.raw`解耦衰减更新 $\theta_t$`, role: 'param', shape: 'same as θ', explanation: String.raw`所有权重按固定比例 $(1 - \eta\lambda)$ 衰减，不受各自历史梯度幅值影响。`, numpyLines: [7], pytorchLines: [3, 6] },
        ],
      },
    ],
    pitfalls: [
      {
        title: 'PyTorch 评估时忘记调用 `model.eval()`（HA03–HA06 经典工程坑）',
        detail: '若测试阶段不调用 `model.eval()`，Dropout 会继续随机丢弃神经元导致结果抖动且准确率偏低，BatchNorm 也会用当前测试小批次的瞬时统计量替代 Running Stats 造成严重性能下降！',
      },
    ],
  },
  {
    id: 'l06',
    code: 'L06',
    partGroup: 'Part II · Deep Learning Foundations',
    slug: 'l06-cnn-resnet',
    titleZh: '卷积神经网络、感受野与残差架构演进 (CNN & ResNet)',
    titleEn: 'Convolutional Neural Networks, Inception, ResNet & DenseNet',
    abstract: String.raw`从视觉皮层的局部感受野与平移等变性出发，精确掌握多通道卷积的张量尺寸、参数量与 FLOPs 手算规律、$1 \times 1$ 卷积瓶颈降维的算力经济学，以及 ResNet 恒等跳连如何从梯度恒等项彻底击破深层网络退化问题。`,
    readingChecklist: [
      'Cross-correlation vs 严格数学卷积，权值共享如何相对全连接压缩几个数量级参数',
      String.raw`输出尺寸 $\lfloor(H+2P-K)/S\rfloor + 1$、参数量 $(K^2 C_{\text{in}} + 1)C_{\text{out}}$ 与乘法次数精确手算（WA3 Q1/Q2）`,
      'Pooling (Max / Avg) 的作用与无参数特性',
      String.raw`$1 \times 1$ 卷积实现跨通道线性融合与 Bottleneck 降维（GoogLeNet / ResNet-50）`,
      String.raw`经典演进：AlexNet → VGG ($3 \times 3$ 堆叠) → GoogLeNet → ResNet ($\mathbf{y} = \mathcal{F}(\mathbf{x}) + \mathbf{x}$) → DenseNet`,
    ],
    verifierId: 'l06-conv-flops',
    derivations: [
      {
        id: 'd-l06-resnet',
        title: '证明 ResNet 恒等跳连如何构造“无损梯度高速公路”',
        goal: String.raw`对比深层普通网络 $\mathbf{x}_{l+1} = \mathcal{F}_l(\mathbf{x}_l)$ 与残差网络 $\mathbf{x}_{l+1} = \mathbf{x}_l + \mathcal{F}_l(\mathbf{x}_l)$ 从第 $L$ 层回传至第 $l$ 层的梯度表达式。`,
        steps: [
          {
            rule: 'Unroll Residual Recursion',
            latex: String.raw`\mathbf{x}_L = \mathbf{x}_l + \sum_{i=l}^{L-1} \mathcal{F}_i(\mathbf{x}_i, \mathbf{W}_i)`,
            justification: String.raw`把相邻层的加法关系从 $l$ 一直累加到深层 $L$：深层特征直接等于浅层特征加上所有中间残差修正量之和。`,
          },
          {
            rule: 'Chain Rule Backpropagation',
            latex: String.raw`\frac{\partial \mathcal{L}}{\partial \mathbf{x}_l} = \frac{\partial \mathcal{L}}{\partial \mathbf{x}_L}\cdot \frac{\partial \mathbf{x}_L}{\partial \mathbf{x}_l} = \frac{\partial \mathcal{L}}{\partial \mathbf{x}_L}\!\left(\mathbf{I} + \frac{\partial}{\partial \mathbf{x}_l}\sum_{i=l}^{L-1} \mathcal{F}_i(\mathbf{x}_i)\right)`,
            justification: String.raw`对 $\mathbf{x}_l$ 求偏导立刻分解出两项：第一项是恒等单位阵 $\mathbf{I}$（梯度不经任何权重矩阵连乘，直接 $100\%$ 无损传回浅层！），第二项经过残差支路权重。`,
          },
        ],
        conclusion: String.raw`在普通深层网络中梯度是连乘 $\prod \mathbf{J}_i$（极易指数消失）；ResNet 中只要括号内残差导数不恰好恒等于 $-\mathbf{I}$，梯度就永远不会消失，从而轻松训练 $100+$ 层甚至上千层网络！`,
      },
    ],
    concepts: [
      {
        heading: String.raw`VGG 为何用两层 $3 \times 3$ 卷积替代一层 $5 \times 5$？（感受野与参数算账）`,
        body: String.raw`设输入输出通道数均为 $C$，对比两种方案的有效感受野、参数量与非线性层数：`,
        table: {
          headers: ['方案', '有效感受野', '参数量 (不含 Bias)', '非线性激活次数'],
          rows: [
            [String.raw`$1$ 层 $5 \times 5$ 卷积`, String.raw`$5 \times 5$`, String.raw`$25 C^2$`, String.raw`$1$ 次 ReLU`],
            [String.raw`$2$ 层 $3 \times 3$ 堆叠`, String.raw`$5 \times 5$（完全相同！）`, String.raw`$2 \times 9 C^2 = 18 C^2$（节省 $28\%$）`, String.raw`$2$ 次 ReLU（表达力更强）`],
            [String.raw`$3$ 层 $3 \times 3$ 堆叠 vs $1$ 层 $7 \times 7$`, String.raw`$7 \times 7$`, String.raw`$27 C^2$ vs $49 C^2$（节省 $45\%$）`, String.raw`$3$ 次 ReLU vs $1$ 次`],
          ],
        },
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l06-resblock',
        title: 'ResNet Basic Residual Block (Conv-BN-ReLU + Skip)',
        subtitle: String.raw`当步长 $S = 2$ 或通道变化时，shortcut 用 $1 \times 1$ 卷积对齐维度`,
        latex: String.raw`\htmlClass{formula-token formula-token-output token-y}{\mathbf{y}} = \text{ReLU}\!\Big(\htmlClass{formula-token formula-token-param token-f}{\mathcal{F}(\mathbf{x}, \{\mathbf{W}_1, \mathbf{W}_2\})} + \htmlClass{formula-token formula-token-data token-skip}{\mathbf{W}_s \mathbf{x}}\Big)`,
        numpyCode: `# 张量维度追踪 (NCHW):
# x:   (B, 64, 56, 56)
# f1:  Conv3x3(64->64, s=1, p=1) + BN + ReLU -> (B, 64, 56, 56)
# f2:  Conv3x3(64->64, s=1, p=1) + BN        -> (B, 64, 56, 56)
# out: ReLU(f2 + x)                          -> (B, 64, 56, 56)`,
        pytorchCode: `import torch.nn as nn, torch.nn.functional as F

class ResidualBlock(nn.Module):
    def __init__(self, c_in, c_out, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(c_in, c_out, 3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(c_out)
        self.conv2 = nn.Conv2d(c_out, c_out, 3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(c_out)
        self.shortcut = (
            nn.Conv2d(c_in, c_out, 1, stride=stride, bias=False)
            if stride != 1 or c_in != c_out else nn.Identity()
        )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return F.relu(out + self.shortcut(x))`,
        terms: [
          { id: 'f', label: String.raw`残差主分支 $\mathcal{F}(\mathbf{x})$`, role: 'param', shape: '(B, C_out, H′, W′)', explanation: '注意 Conv 后接 BN 时 `bias=False`，因为 BN 会减均值，卷积偏置完全冗余。', numpyLines: [3, 4], pytorchLines: [6, 7, 8, 9, 16, 17] },
          { id: 'skip', label: String.raw`跳连投影 $\mathbf{W}_s \mathbf{x}$`, role: 'data', shape: '(B, C_out, H′, W′)', explanation: String.raw`同维度时为无参数 Identity；降采样时用 $1 \times 1$ Conv 对齐空间与通道数。`, numpyLines: [2, 5], pytorchLines: [10, 11, 12, 13, 18] },
          { id: 'y', label: String.raw`残差相加输出 $\mathbf{y}$`, role: 'output', shape: '(B, C_out, H′, W′)', explanation: '相加后再过 ReLU，为反向传播留出恒等梯度通路。', numpyLines: [5], pytorchLines: [18] },
        ],
      },
    ],
    pitfalls: [
      {
        title: '手算 CNN 乘法次数 (FLOPs) 与参数量时混用公式（WA3 Q2）',
        detail: String.raw`参数量 $= (K^2 C_{\text{in}} + 1) \times C_{\text{out}}$（与图像高宽 $H, W$ 无关，含 Bias）；而净输入总乘法次数 $= H_{\text{out}} W_{\text{out}} C_{\text{out}} (K^2 C_{\text{in}})$（不含 $+1$ Bias，因为加偏置不是乘法！）。`,
      },
    ],
  },
  {
    id: 'l07',
    code: 'L07',
    partGroup: 'Part II · Deep Learning Foundations',
    slug: 'l07-rnn-lstm-attention',
    titleZh: '循环神经网络、LSTM/GRU、Seq2Seq 与注意力起源',
    titleEn: 'RNN, LSTM/GRU, Encoder-Decoder Seq2Seq & Attention',
    abstract:
      '理解变长序列参数共享与随时间反向传播 (BPTT) 导致梯度消失/爆炸的数学本质，掌握 LSTM 记忆通道与四门控如何解耦短期输出与长期记忆，以及 Seq2Seq 固定上下文向量瓶颈如何直接催生 Bahdanau / Luong 注意力机制。',
    readingChecklist: [
      String.raw`基础 RNN 递推 $\mathbf{h}_t = \tanh(\mathbf{W}_{hh}\mathbf{h}_{t-1} + \mathbf{W}_{xh}\mathbf{x}_t + \mathbf{b})$ 与时间步权值共享`,
      String.raw`BPTT 梯度连乘 $\mathbf{W}_{hh}^\top$ 的谱半径分析：梯度消失 vs 梯度爆炸 (Gradient Clipping)`,
      'LSTM 四个组件（Forget / Input / Output Gate + Cell State）及简化版 GRU',
      'Encoder-Decoder Seq2Seq、Teacher Forcing 训练 vs 自回归推理 (Exposure Bias & Beam Search)',
      'Bahdanau (Additive) vs Luong (Dot-Product) Attention 消除定长 Context Vector 瓶颈',
    ],
    verifierId: 'l07-lstm-rnn',
    derivations: [
      {
        id: 'd-l07-bptt',
        title: '证明基础 RNN 随时间反向传播 (BPTT) 梯度指数级消失/爆炸的根源',
        goal: String.raw`计算第 $T$ 步损失 $L_T$ 对遥远过去第 $k$ 步隐藏状态 $\mathbf{h}_k$ 的梯度 $\frac{\partial L_T}{\partial \mathbf{h}_k}$。`,
        steps: [
          {
            rule: 'Chain Rule Through Time',
            latex: String.raw`\frac{\partial L_T}{\partial \mathbf{h}_k} = \frac{\partial L_T}{\partial \mathbf{h}_T}\prod_{t=k+1}^T \frac{\partial \mathbf{h}_t}{\partial \mathbf{h}_{t-1}}`,
            justification: String.raw`隐藏状态按时间链式传递，梯度必须跨越 $T - k$ 个相邻雅可比矩阵的连乘。`,
          },
          {
            rule: 'Jacobian of Vanilla RNN vs LSTM',
            latex: String.raw`\text{RNN: } \frac{\partial \mathbf{h}_t}{\partial \mathbf{h}_{t-1}} = \text{diag}\big(1-\mathbf{h}_t^2\big)\mathbf{W}_{hh}, \qquad \text{LSTM: } \frac{\partial \mathbf{c}_t}{\partial \mathbf{c}_{t-1}} = \text{diag}(\mathbf{f}_t) + \dots`,
            justification: String.raw`基础 RNN 的每一步都强行乘以同一个权重矩阵 $\mathbf{W}_{hh}$ 和有界导数 $\le 1$ 的 $\tanh'$：若最大奇异值 $\sigma_{\max}(\mathbf{W}_{hh}) < 1$，连乘 $T$ 步后指数级趋近 $0$（梯度消失）；若 $> 1$ 则指数级爆炸！而 LSTM 的 Cell State 采用加法更新 $\mathbf{c}_t = \mathbf{f}_t \odot \mathbf{c}_{t-1} + \mathbf{i}_t \odot \tilde{\mathbf{c}}_t$，只要遗忘门 $\mathbf{f}_t \approx \mathbf{1}$，梯度即可近乎无损穿透长序列！`,
          },
        ],
        conclusion: '梯度爆炸可用工程技巧 Gradient Clipping（裁剪范数）轻松压住，但梯度消失必须靠架构级加法通路（LSTM 门控 / ResNet 跳连 / Transformer 直连自注意力）根治。',
      },
    ],
    concepts: [
      {
        heading: 'Seq2Seq 固定瓶颈与 Attention 机制对比',
        body: String.raw`传统 Encoder-Decoder 强行把 $50$ 个词的源句子压缩成最后一个固定维度向量 $\mathbf{c} = \mathbf{h}_T$，导致长句翻译质量断崖式下跌。`,
        points: [
          String.raw`Teacher Forcing：训练 Decoder 时喂入真实目标词 $y^*_{t-1}$ 而不是模型自己猜错的 $\hat{y}_{t-1}$，防止早期误差滚雪球；但造成训练与推理分布差异（Exposure Bias）。`,
          String.raw`Seq2Seq + Attention：Decoder 第 $t$ 步用当前状态 $\mathbf{s}_t$ 作为 Query 去和 Encoder 全部隐状态 $\mathbf{h}_1, \dots, \mathbf{h}_S$ 做打分对齐（Bahdanau 加性分数 $\mathbf{v}^\top \tanh(\mathbf{W}_1 \mathbf{s}_t + \mathbf{W}_2 \mathbf{h}_i)$ 或 Luong 点积分数 $\mathbf{s}_t^\top \mathbf{W} \mathbf{h}_i$），经 Softmax 得到动态加权上下文向量 $\mathbf{c}_t = \sum_i \alpha_{ti} \mathbf{h}_i$。`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l07-lstm',
        title: 'LSTM 单时间步四门控矩阵融合实现',
        subtitle: String.raw`工程中把 $4$ 个门拼成一次矩阵乘法以最大化 GPU 并行度`,
        latex: String.raw`\htmlClass{formula-token formula-token-output token-gates}{[\mathbf{f}_t, \mathbf{i}_t, \mathbf{o}_t, \mathbf{g}_t]} = \mathbf{W}[\mathbf{h}_{t-1}, \mathbf{x}_t] + \mathbf{b}, \quad \htmlClass{formula-token formula-token-param token-ct}{\mathbf{c}_t} = \sigma(\mathbf{f}_t)\odot \mathbf{c}_{t-1} + \sigma(\mathbf{i}_t)\odot \tanh(\mathbf{g}_t), \quad \htmlClass{formula-token formula-token-output token-ht}{\mathbf{h}_t} = \sigma(\mathbf{o}_t)\odot \tanh(\mathbf{c}_t)`,
        numpyCode: `def lstm_step(x_t, h_prev, c_prev, W_all, b_all):
    # concat: (B, H + D), W_all: (H + D, 4H)
    H = h_prev.shape[1]
    concat = np.concatenate([h_prev, x_t], axis=1)
    gates = concat @ W_all + b_all                # 一次矩阵乘算完 4 门 (B, 4H)
    sig = lambda z: 1.0 / (1.0 + np.exp(-z))
    f = sig(gates[:, 0:H])                        # Forget Gate
    i = sig(gates[:, H:2*H])                      # Input Gate
    o = sig(gates[:, 2*H:3*H])                    # Output Gate
    g = np.tanh(gates[:, 3*H:4*H])                # Candidate Memory
    c_t = f * c_prev + i * g                      # 加法记忆高速公路
    h_t = o * np.tanh(c_t)                        # 过滤暴露到外部隐状态
    return h_t, c_t`,
        pytorchCode: `import torch.nn as nn

# PyTorch nn.LSTM 底层正是把四个门合并为 weight_ih (4H, D) 和 weight_hh (4H, H)
lstm = nn.LSTM(input_size=D, hidden_size=H, num_layers=2, batch_first=True, bidirectional=True)
out, (h_n, c_n) = lstm(x)  # out: (B, T, 2*H)`,
        terms: [
          { id: 'gates', label: String.raw`融合四门投影 $(B, 4H)$`, role: 'output', shape: '(B, 4H)', explanation: String.raw`将 $4$ 次小矩阵乘合并为 $1$ 次大 GEMM，是 cuDNN 加速 LSTM 的核心技巧。`, numpyLines: [4, 5, 7, 8, 9, 10], pytorchLines: [4] },
          { id: 'ct', label: String.raw`长期细胞状态 $\mathbf{c}_t$`, role: 'param', shape: '(B, H)', explanation: String.raw`受遗忘门 $\mathbf{f}_t$ 控制的线性加法走廊，承担跨长距离传播信息与梯度的职责。`, numpyLines: [11], pytorchLines: [5] },
          { id: 'ht', label: String.raw`短期输出状态 $\mathbf{h}_t$`, role: 'output', shape: '(B, H)', explanation: String.raw`经输出门 $\mathbf{o}_t$ 筛选当前步需要的记忆片段向外输出。`, numpyLines: [12], pytorchLines: [5] },
        ],
      },
    ],
    pitfalls: [
      {
        title: 'Bidirectional RNN 不能用于自回归语言模型生成',
        detail: '双向 RNN 的后向链需要提前看到整个句子的未来词，因此非常适合句子分类、NER、情感分析（如 HA05），但绝不能用于自回归逐词生成（未来词尚未产生，会造成信息泄露）。',
      },
    ],
  },
];
