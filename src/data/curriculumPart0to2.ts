import { PartModule } from '../types/curriculum';

export const PARTS_0_TO_2: PartModule[] = [
  {
    id: 'part-0',
    partNumber: 0,
    slug: 'part-0-probability-information',
    titleZh: '概率论基础与信息论',
    titleEn: 'Probability & Information Theory',
    tagline: '所有机器学习损失函数、最大似然估计与生成模型的共同数学地基。',
    topics: [
      'Bayes Theorem & MLE / MAP',
      'Entropy H(P)',
      'Cross-Entropy H(P, Q)',
      'KL Divergence (非对称性)',
    ],
    accentColor: 'blue',
    keyTakeaways: [
      '信息量 −log p(x) 衡量“意外程度”，熵 H(P) 是平均信息量，也是分布不确定性的度量。',
      '交叉熵满足 H(P, Q) = H(P) + D_KL(P ‖ Q)：当真实分布 P 固定时，最小化交叉熵完全等价于最小化 KL 散度。',
      'MLE（最大似然）对应“只相信数据”，MAP（最大后验）引入参数先验 P(θ)——高斯先验直接导出 L2 Ridge 正则化！',
    ],
    formulaSpecs: [
      {
        id: 'p0-kl-ce',
        title: '交叉熵与 KL 散度的等价分解',
        subtitle: '为什么几乎所有分类器都用 Cross-Entropy 作为损失函数？',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-ce}{H(P, Q)} = -\sum_{x} \htmlClass{formula-token formula-token-data token-px}{P(x)} \log \htmlClass{formula-token formula-token-output token-qx}{Q(x)} = \htmlClass{formula-token formula-token-data token-ent}{H(P)} + \htmlClass{formula-token formula-token-loss token-kl}{D_{\text{KL}}(P \,\|\, Q)}`,
        numpyCode: `import numpy as np

def info_metrics(p, q, eps=1e-12):
    p = np.asarray(p, dtype=float)
    q = np.clip(np.asarray(q, dtype=float), eps, 1.0)
    entropy_p = -np.sum(p * np.log2(np.clip(p, eps, 1.0)))
    cross_ent = -np.sum(p * np.log2(q))
    kl_div = np.sum(p * np.log2(np.clip(p, eps, 1.0) / q))
    return entropy_p, cross_ent, kl_div`,
        pytorchCode: `import torch
import torch.nn.functional as F

def info_metrics_torch(p: torch.Tensor, q: torch.Tensor):
    p = p.clamp(min=1e-12)
    q = q.clamp(min=1e-12)
    entropy_p = -(p * p.log2()).sum()
    cross_ent = -(p * q.log2()).sum()
    kl_div = F.kl_div(q.log(), p, reduction="sum") / torch.log(torch.tensor(2.0))
    return entropy_p, cross_ent, kl_div`,
        terms: [
          {
            id: 'ce',
            label: '交叉熵 H(P, Q)',
            role: 'loss',
            shape: 'scalar (≥ H(P))',
            explanation: '用模型预测分布 Q 去编码真实分布 P 所需的平均比特数。在监督分类里，P 是 one-hot 标签，H(P, Q) 退化为真实类别的负对数似然 −log Q(y)。',
            numpyLines: [7],
            pytorchLines: [8],
          },
          {
            id: 'px',
            label: '真实分布 P(x)',
            role: 'data',
            shape: '(K,), ΣP = 1',
            explanation: '来自数据集的真实标签或目标概率分布。训练时 P 固定不变，因此它的信息熵 H(P) 对模型参数梯度为 0。',
            numpyLines: [4],
            pytorchLines: [5],
          },
          {
            id: 'qx',
            label: '模型预测分布 Q(x)',
            role: 'output',
            shape: '(K,), ΣQ = 1',
            explanation: '模型经 Softmax 输出的预测概率。代码中用 clip(eps, 1.0) 防止 log(0) 触发 -inf / NaN 数值溢出。',
            numpyLines: [5],
            pytorchLines: [6],
          },
          {
            id: 'ent',
            label: '信息熵 H(P)',
            role: 'data',
            shape: 'scalar (≥ 0)',
            explanation: '真实分布自身固有的不确定性下界。均匀分布熵最大，确定性 one-hot 分布熵为 0。',
            numpyLines: [6],
            pytorchLines: [7],
          },
          {
            id: 'kl',
            label: 'KL 散度 D_KL(P ‖ Q)',
            role: 'loss',
            shape: 'scalar (≥ 0)',
            explanation: '衡量 Q 偏离 P 的额外编码代价，永远非负（Gibbs 不等式），但 D_KL(P ‖ Q) ≠ D_KL(Q ‖ P) 不满足对称性。',
            numpyLines: [8],
            pytorchLines: [9],
          },
        ],
      },
    ],
    sandbox: {
      id: 'sandbox-p0',
      title: '在线实验 · 对比 Forward KL vs Reverse KL 与 Beta 后验收敛',
      description: '修改真实分布 P、预测分布 Q 或样本规模 N，观察信息论指标变化与 MAP 向 MLE 收敛曲线。',
      tips: [
        '把 q 中的 0.02 改成 0.0001 看 Forward KL 爆炸',
        '修改 prior_a / prior_b 观察小样本下 MAP 的正则拉回效应',
      ],
      starterCode: `import numpy as np

# 1) 验证 H(P, Q) = H(P) + KL(P || Q) 及 KL 非对称性
p = np.array([0.50, 0.45, 0.03, 0.02])
q = np.array([0.90, 0.02, 0.04, 0.04])

eps = 1e-12
H_p = -np.sum(p * np.log2(p + eps))
H_pq = -np.sum(p * np.log2(q + eps))
KL_pq = np.sum(p * np.log2((p + eps) / (q + eps)))
KL_qp = np.sum(q * np.log2((q + eps) / (p + eps)))

print(f"H(P)        = {H_p:.4f} bits")
print(f"H(P, Q)     = {H_pq:.4f} bits")
print(f"H(P)+KL(P|Q)= {H_p + KL_pq:.4f} bits (精确相等!)")
print(f"Forward KL(P||Q) = {KL_pq:.4f}  vs  Reverse KL(Q||P) = {KL_qp:.4f}")

# 2) 模拟抛硬币真概率 p_true = 0.72，观察随样本量 N 增大 MLE 与 MAP 收敛曲线
rng = np.random.default_rng(2026)
p_true = 0.72
prior_a, prior_b = 6.0, 6.0  # 公平硬币先验 Beta(6, 6)

flips = rng.binomial(1, p_true, size=120)
ns = np.arange(1, len(flips) + 1)
cum_heads = np.cumsum(flips)

mle_curve = cum_heads / ns
map_curve = (cum_heads + prior_a - 1) / (ns + prior_a + prior_b - 2)

print(f"\\nN=5   时: MLE={mle_curve[4]:.3f}, MAP={map_curve[4]:.3f} (真值={p_true})")
print(f"N=120 时: MLE={mle_curve[-1]:.3f}, MAP={map_curve[-1]:.3f} (两者趋同)")

plot_series(
    "MLE vs MAP 随观测样本数 N 的收敛对比",
    {"MLE 估计": (ns, mle_curve), "MAP 估计 (Beta 先验)": (ns, map_curve), "真值 0.72": (ns, np.full_like(mle_curve, p_true))},
    xlabel="观测次数 N",
    ylabel="参数估计值 θ̂"
)
`,
    },
    thoughtQuestions: [
      {
        question: '为什么分类任务最小化 Cross-Entropy 等价于最大似然估计 (MLE)？',
        answer:
          '对独立同分布样本最大化对数似然 ∑ log P_θ(y_i | x_i)，取负号并除以 N 就是经验分布 P_data 与模型分布 P_θ 之间的交叉熵。而 H(P_data) 是常数，所以最小化交叉熵 = 最大化似然 = 最小化 D_KL(P_data ‖ P_θ)。',
      },
      {
        question: 'Forward KL (P ‖ Q) 和 Reverse KL (Q ‖ P) 在生成模型里有什么区别？',
        answer:
          'Forward KL 要求只要真实 P(x) > 0 处 Q(x) 就不能接近 0，否则惩罚无穷大（倾向覆盖所有模式，Mean-Seeking，可能产生模糊均值）；Reverse KL 要求 Q(x) > 0 处 P(x) 不能为 0，倾向精准锁定单个高概率峰（Mode-Seeking，可能丢掉其他模式）。',
      },
    ],
  },
  {
    id: 'part-1',
    partNumber: 1,
    slug: 'part-1-foundation-ml',
    titleZh: '机器学习基础',
    titleEn: 'Foundation of Machine Learning',
    tagline: '从线性/多项式回归、Softmax 判别分类、GDA 生成分类到 Bias-Variance 泛化权衡。',
    topics: [
      'Linear & Polynomial Regression',
      'Ridge Normal Equation',
      'Logistic & Softmax Regression',
      'GDA (LDA / QDA)',
      'Bias-Variance Decomposition',
    ],
    accentColor: 'emerald',
    keyTakeaways: [
      '多项式回归把标量 x 映射为特征向量 [1, x, x², …, xᵈ] 后，对参数 w 依然是线性模型，可直接用 Ridge 闭式解或梯度下降求解。',
      'Softmax 分类实现必须做「减去每行最大值」的 Log-Sum-Exp 技巧防止 exp 溢出，其对 logits 的梯度异常优雅：∂L/∂z = (P − Y)/N。',
      '模型复杂度上升会让 Bias² 单调下降、Variance 单调上升，二者叠加形成测试误差的经典 U 形曲线；正则化 λ 是控制 Variance 的关键阀门。',
    ],
    formulaSpecs: [
      {
        id: 'p1-ridge',
        title: 'Ridge 线性回归闭式解 (Normal Equation)',
        subtitle: '加 λI 既等价于高斯先验 MAP，又把奇异矩阵 XᵀX 变为严格正定可逆',
        latex: String.raw`\htmlClass{formula-token formula-token-param token-w}{\mathbf{w}^*} = \Big(\htmlClass{formula-token formula-token-data token-xtx}{\mathbf{X}^\top \mathbf{X}} + \htmlClass{formula-token formula-token-hyper token-lam}{\lambda \mathbf{I}}\Big)^{-1} \htmlClass{formula-token formula-token-output token-xty}{\mathbf{X}^\top \mathbf{y}}`,
        numpyCode: `import numpy as np

def fit_ridge(X, y, lam=1e-2):
    N, D = X.shape
    XtX = X.T @ X
    reg_eye = lam * np.eye(D)
    Xty = X.T @ y
    # 用线性方程求解器 solve 替代显式求逆 inv，数值更稳定
    w_star = np.linalg.solve(XtX + reg_eye, Xty)
    return w_star`,
        pytorchCode: `import torch

def fit_ridge_torch(X: torch.Tensor, y: torch.Tensor, lam: float = 1e-2):
    D = X.shape[1]
    XtX = X.T @ X
    reg_eye = lam * torch.eye(D, dtype=X.dtype, device=X.device)
    Xty = X.T @ y
    w_star = torch.linalg.solve(XtX + reg_eye, Xty)
    return w_star`,
        terms: [
          {
            id: 'w',
            label: '最优权重 w*',
            role: 'param',
            shape: '(D,)',
            explanation: '令 Ridge 损失梯度 2Xᵀ(Xw−y) + 2λw = 0 直接解出的全局唯一最优解。工程上用 solve() 比显式 inv() 更快且精度更高。',
            numpyLines: [9],
            pytorchLines: [8],
          },
          {
            id: 'xtx',
            label: '协方差矩阵 XᵀX',
            role: 'data',
            shape: '(D, D)',
            explanation: '特征间的内积矩阵。当特征共线或 D > N 时 XᵀX 不可逆（病态），求逆会导致权重爆炸。',
            numpyLines: [5],
            pytorchLines: [5],
          },
          {
            id: 'lam',
            label: 'L2 正则项 λI',
            role: 'hyper',
            shape: '(D, D)',
            explanation: '在主对角线上加正数 λ，把所有特征值抬高 λ，保证矩阵严格正定可逆，同时压缩权重 L2 范数防止过拟合。',
            numpyLines: [6],
            pytorchLines: [6],
          },
          {
            id: 'xty',
            label: '特征-目标相关性 Xᵀy',
            role: 'output',
            shape: '(D,)',
            explanation: '各维特征与回归目标 y 的内积投影向量。',
            numpyLines: [7],
            pytorchLines: [7],
          },
        ],
      },
      {
        id: 'p1-softmax',
        title: '数值稳定 Softmax 交叉熵损失与梯度（对应课程 HA01）',
        subtitle: '行最大值平移防溢出 + 一行矩阵乘法完成全批量梯度计算',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-loss}{L(\mathbf{W})} = -\frac{1}{N}\sum_{i=1}^N \log \htmlClass{formula-token formula-token-output token-prob}{\frac{e^{z_{i,y_i}-m_i}}{\sum_k e^{z_{i,k}-m_i}}} + \htmlClass{formula-token formula-token-hyper token-reg}{\frac{\lambda}{2}\|\mathbf{W}\|_F^2}, \qquad \htmlClass{formula-token formula-token-loss token-grad}{\nabla_{\mathbf{W}} L} = \frac{1}{N}\htmlClass{formula-token formula-token-data token-xt}{\mathbf{X}^\top}(\mathbf{P}-\mathbf{Y}) + \lambda\mathbf{W}`,
        numpyCode: `def softmax_loss_and_grad(W, X, y, reg=1e-2):
    N = X.shape[0]
    scores = X @ W                                    # (N, K)
    scores -= np.max(scores, axis=1, keepdims=True)   # 减每行最大值防 exp 溢出
    exp_s = np.exp(scores)
    sum_exp = np.sum(exp_s, axis=1, keepdims=True)
    probs = exp_s / sum_exp                           # P: (N, K)
    log_probs = scores - np.log(sum_exp)              # log-softmax 防 log(0)
    data_loss = -np.mean(log_probs[np.arange(N), y])
    loss = data_loss + 0.5 * reg * np.sum(W * W)
    dscores = probs.copy()
    dscores[np.arange(N), y] -= 1.0                   # P - Y
    dW = (X.T @ dscores) / N + reg * W                # 梯度 (D, K)
    return loss, dW`,
        pytorchCode: `import torch
import torch.nn.functional as F

def softmax_loss_torch(W, X, y, reg=1e-2):
    scores = X @ W                                    # (N, K)
    # PyTorch 内置 log_softmax + nll_loss 自动完成最大值平移
    data_loss = F.cross_entropy(scores, y)
    loss = data_loss + 0.5 * reg * torch.sum(W * W)
    loss.backward()                                   # 自动计算 W.grad
    return loss.item(), W.grad`,
        terms: [
          {
            id: 'prob',
            label: '数值稳定 Softmax 概率 P',
            role: 'output',
            shape: '(N, K)',
            explanation: '分子分母同乘 exp(-m_i) 数学值不变，但最大指数恒为 exp(0)=1，彻底杜绝 exp(1000)=inf 溢出。',
            numpyLines: [4, 5, 6, 7],
            pytorchLines: [6, 7],
          },
          {
            id: 'loss',
            label: '平均交叉熵 + 正则总损失',
            role: 'loss',
            shape: 'scalar',
            explanation: '直接用 scores - log(sum_exp) 计算对数概率，避免先算极小概率再取 log 导致下溢 NaN。',
            numpyLines: [8, 9, 10],
            pytorchLines: [7, 8],
          },
          {
            id: 'reg',
            label: 'L2 Weight Decay',
            role: 'hyper',
            shape: 'scalar',
            explanation: '系数 1/2 是为了求导时和平方项的 2 抵消，使正则梯度恰好是简洁的 λW。',
            numpyLines: [10],
            pytorchLines: [8],
          },
          {
            id: 'xt',
            label: '输入转置 Xᵀ',
            role: 'data',
            shape: '(D, N)',
            explanation: '通过矩阵乘法 Xᵀ(P − Y) 把 N 个样本的特征与类别误差同时聚合为 (D, K) 的权重梯度。',
            numpyLines: [13],
            pytorchLines: [9],
          },
          {
            id: 'grad',
            label: '权重梯度 ∇_W L',
            role: 'loss',
            shape: '(D, K)',
            explanation: '对 logits 的梯度竟只是「预测概率 − 真实 one-hot 标签」(P − Y)！预测越准，梯度越小。',
            numpyLines: [11, 12, 13],
            pytorchLines: [9],
          },
        ],
      },
    ],
    sandbox: {
      id: 'sandbox-p1',
      title: '在线实验 · 手写 NumPy Softmax 分类器训练（复现课程 HA01 核心）',
      description: '直接在浏览器运行完整的梯度下降 Softmax 分类器，对比不同 L2 正则化 λ 与学习率对收敛和准确率的影响。',
      tips: [
        '把 reg 改成 0.0 或 1.0 对比权重范数与测试准确率',
        '把 lr 改成 2.0 观察梯度震荡',
      ],
      starterCode: `import numpy as np

# 生成 3 类模拟 Iris 特征分布（4 维特征，120 训练 + 30 测试）
rng = np.random.default_rng(42)
centers = np.array([
    [5.0, 3.4, 1.5, 0.2],   # Setosa
    [5.9, 2.8, 4.3, 1.3],   # Versicolor
    [6.6, 3.0, 5.5, 2.0],   # Virginica
])
X_list, y_list = [], []
for c in range(3):
    X_list.append(centers[c] + rng.normal(0, 0.55, size=(50, 4)))
    y_list.append(np.full(50, c))
X_all = np.vstack(X_list)
y_all = np.concatenate(y_list)
# 标准化 + 拼偏置项 1
X_all = (X_all - X_all.mean(0)) / X_all.std(0)
X_all = np.hstack([X_all, np.ones((len(X_all), 1))])

perm = rng.permutation(len(X_all))
X_tr, y_tr = X_all[perm[:120]], y_all[perm[:120]]
X_te, y_te = X_all[perm[120:]], y_all[perm[120:]]

def softmax_loss_and_grad(W, X, y, reg):
    N = X.shape[0]
    scores = X @ W
    scores -= np.max(scores, axis=1, keepdims=True)
    exp_s = np.exp(scores)
    sum_exp = np.sum(exp_s, axis=1, keepdims=True)
    probs = exp_s / sum_exp
    log_p = scores - np.log(sum_exp)
    loss = -np.mean(log_p[np.arange(N), y]) + 0.5 * reg * np.sum(W * W)
    dscores = probs.copy()
    dscores[np.arange(N), y] -= 1.0
    dW = (X.T @ dscores) / N + reg * W
    return loss, dW

# 超参数（试着修改！）
lr = 0.25
reg = 0.02
steps = 120

W = np.zeros((X_tr.shape[1], 3))
losses, accs = [], []

for step in range(steps):
    loss, dW = softmax_loss_and_grad(W, X_tr, y_tr, reg)
    W -= lr * dW
    losses.append(loss)
    preds = np.argmax(X_te @ W, axis=1)
    accs.append(np.mean(preds == y_te))

print(f"最终 Train Loss: {losses[-1]:.4f}")
print(f"最终 Test  Acc : {accs[-1]*100:.1f}%")
print(f"权重 L2 范数   : {np.linalg.norm(W):.3f}")

plot_series(
    "Softmax 回归训练过程（Loss 下降 & 测试准确率上升）",
    {"Train Loss": losses, "Test Accuracy": accs},
    xlabel="Iteration",
    ylabel="Metric"
)
`,
    },
    thoughtQuestions: [
      {
        question: 'Normal Equation 闭式解 vs 梯度下降：实际工程里何时用哪个？',
        answer:
          '闭式解求逆复杂度为 O(D³)，当特征维度 D 较小（如 D < 5,000）时一步精确到位、无需调学习率；当 D 很大（如图像像素、词袋或神经网络参数动辄百万级）或样本流式到达时，必须使用 O(ND) 的（随机）梯度下降。',
      },
      {
        question: '判别式模型（Softmax）和生成式模型（GDA/Naive Bayes）各有什么优势？',
        answer:
          '生成式模型对数据分布假设更强（如特征服从高斯分布），因此样本很少时更不易过拟合，且能生成新样本或检测异常点；判别式模型直接建模条件边界 P(y|x)，不对 X 的分布做强假设，数据充足时分类准确率通常更高且更鲁棒。',
      },
    ],
  },
  {
    id: 'part-2',
    partNumber: 2,
    slug: 'part-2-foundation-dl',
    titleZh: '深度学习基础',
    titleEn: 'Foundation of Deep Learning',
    tagline: '多层前馈网络与反向传播、现代优化器、卷积残差网络 (CNN/ResNet) 与循环序列建模 (RNN/LSTM)。',
    topics: [
      'FNN & Backpropagation',
      'SGD / Momentum / Adam',
      'CNN Kernel & Receptive Field',
      'ResNet Skip Connection',
      'RNN / LSTM & Attention',
    ],
    accentColor: 'violet',
    keyTakeaways: [
      '没有非线性激活函数（ReLU / GELU），再多层线性变换叠在一起也等价于单层矩阵乘法 W₂(W₁x) = (W₂W₁)x。',
      '反向传播本质是计算图上的链式法则动态规划：每层只需缓存前向激活，把上游传来的梯度乘以局部雅可比即可回传。',
      'ResNet 的恒等跳连 y = F(x) + x 与 LSTM 的门控 Cell State 都是为了在深层/长序列中建立无损的「加法梯度高速公路」。',
    ],
    formulaSpecs: [
      {
        id: 'p2-backprop',
        title: '两层 MLP 前向与反向传播链式法则（对应课程 HA02）',
        subtitle: '从 Softmax 误差 δ₂ 一路穿过 ReLU 掩码回传至第一层权重 W₁',
        latex: String.raw`\begin{aligned}
\htmlClass{formula-token formula-token-output token-h}{\mathbf{h}} &= \text{ReLU}(\mathbf{X}\mathbf{W}_1 + \mathbf{b}_1), \quad \htmlClass{formula-token formula-token-loss token-d2}{\boldsymbol{\delta}_2} = \frac{\mathbf{P}-\mathbf{Y}}{N}, \\
\htmlClass{formula-token formula-token-loss token-dw2}{\nabla_{\mathbf{W}_2} L} &= \mathbf{h}^\top \boldsymbol{\delta}_2 + \lambda \mathbf{W}_2, \quad \htmlClass{formula-token formula-token-loss token-d1}{\boldsymbol{\delta}_1} = (\boldsymbol{\delta}_2 \mathbf{W}_2^\top) \odot \htmlClass{formula-token formula-token-hyper token-relu}{\mathbb{1}[\mathbf{z}_1 > 0]}, \quad \htmlClass{formula-token formula-token-loss token-dw1}{\nabla_{\mathbf{W}_1} L} = \mathbf{X}^\top \boldsymbol{\delta}_1 + \lambda \mathbf{W}_1
\end{aligned}`,
        numpyCode: `def two_layer_net_loss(W1, b1, W2, b2, X, y, reg=1e-3):
    N = X.shape[0]
    z1 = X @ W1 + b1                            # (N, H)
    h = np.maximum(0, z1)                       # ReLU 激活 (N, H)
    scores = h @ W2 + b2                        # (N, K)
    scores -= scores.max(axis=1, keepdims=True)
    probs = np.exp(scores) / np.exp(scores).sum(axis=1, keepdims=True)
    loss = -np.mean(np.log(probs[np.arange(N), y] + 1e-12))
    loss += 0.5 * reg * (np.sum(W1*W1) + np.sum(W2*W2))

    # --- Backward Pass (链式法则) ---
    d2 = probs.copy()
    d2[np.arange(N), y] -= 1.0
    d2 /= N                                     # δ2: (N, K)
    dW2 = h.T @ d2 + reg * W2                   # (H, K)
    dh = d2 @ W2.T                              # (N, H)
    d1 = dh * (z1 > 0)                          # 乘以 ReLU 导数掩码
    dW1 = X.T @ d1 + reg * W1                   # (D, H)
    return loss, dW1, dW2`,
        pytorchCode: `import torch.nn as nn
import torch.nn.functional as F

class TwoLayerMLP(nn.Module):
    def __init__(self, D, H, K):
        super().__init__()
        self.fc1 = nn.Linear(D, H)
        self.fc2 = nn.Linear(H, K)

    def forward(self, x):
        h = F.relu(self.fc1(x))                 # 对应 z1 -> ReLU -> h
        return self.fc2(h)                      # 对应 scores = h @ W2 + b2

# loss = F.cross_entropy(model(X), y)
# loss.backward()  # Autograd 自动完成 δ2 -> dW2 -> dh -> d1 -> dW1`,
        terms: [
          {
            id: 'h',
            label: '隐藏层激活 h = ReLU(z₁)',
            role: 'output',
            shape: '(N, H)',
            explanation: '前向传播必须缓存 z₁ 和 h，因为反向传播算 dW₂ 需要 h，算 ReLU 导数需要 z₁ > 0。',
            numpyLines: [3, 4],
            pytorchLines: [11],
          },
          {
            id: 'd2',
            label: '输出层误差 δ₂',
            role: 'loss',
            shape: '(N, K)',
            explanation: '损失对最终 logits 的梯度，是反向传播的起点（上游梯度）。',
            numpyLines: [12, 13, 14],
            pytorchLines: [14, 15],
          },
          {
            id: 'dw2',
            label: '第二层权重梯度 ∇W₂',
            role: 'loss',
            shape: '(H, K)',
            explanation: '输入激活的转置 hᵀ 乘以上游误差 δ₂，再加上 L2 正则项梯度 λW₂。',
            numpyLines: [15],
            pytorchLines: [15],
          },
          {
            id: 'relu',
            label: 'ReLU 导数掩码 1[z₁>0]',
            role: 'hyper',
            shape: '(N, H) bool',
            explanation: 'ReLU 在正半轴导数为 1（梯度原样通过），负半轴导数为 0（彻底截断梯度——这就是 Dead ReLU 的根源）。',
            numpyLines: [17],
            pytorchLines: [15],
          },
          {
            id: 'd1',
            label: '隐藏层误差 δ₁',
            role: 'loss',
            shape: '(N, H)',
            explanation: '先经 W₂ᵀ 把误差从 K 维投影回 H 维，再逐元素乘以 ReLU 导数掩码。',
            numpyLines: [16, 17],
            pytorchLines: [15],
          },
          {
            id: 'dw1',
            label: '第一层权重梯度 ∇W₁',
            role: 'loss',
            shape: '(D, H)',
            explanation: '输入矩阵 Xᵀ 与隐藏层误差 δ₁ 相乘，完成整条反向传播链路。',
            numpyLines: [18],
            pytorchLines: [15],
          },
        ],
      },
      {
        id: 'p2-adam',
        title: 'Adam 自适应一/二阶矩优化器 + ResNet 残差块',
        subtitle: '融合 Momentum 动量惯性与 RMSProp 逐参数自适应步长',
        latex: String.raw`\htmlClass{formula-token formula-token-output token-mt}{m_t = \beta_1 m_{t-1} + (1-\beta_1)g_t}, \quad \htmlClass{formula-token formula-token-hyper token-vt}{v_t = \beta_2 v_{t-1} + (1-\beta_2)g_t^2}, \quad \htmlClass{formula-token formula-token-param token-upd}{\theta_t = \theta_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}}`,
        numpyCode: `def adam_step(theta, grad, m, v, t, lr=1e-3, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1.0 - b1) * grad          # 一阶矩（动量均值）
    v = b2 * v + (1.0 - b2) * (grad ** 2)   # 二阶矩（梯度平方方差）
    m_hat = m / (1.0 - b1 ** t)             # 偏差修正（消除初期偏 0）
    v_hat = v / (1.0 - b2 ** t)
    theta = theta - lr * m_hat / (np.sqrt(v_hat) + eps)
    return theta, m, v`,
        pytorchCode: `import torch.optim as optim

# PyTorch 工业界标配：AdamW（解耦权重衰减）
optimizer = optim.AdamW(model.parameters(), lr=1e-3, betas=(0.9, 0.999), weight_decay=1e-2)
optimizer.zero_grad()
loss.backward()
optimizer.step()`,
        terms: [
          {
            id: 'mt',
            label: '一阶矩 m_t (Momentum)',
            role: 'output',
            shape: 'same as θ',
            explanation: '梯度的指数移动平均，像滚球惯性一样冲过平坦区与小局部震荡。',
            numpyLines: [2, 4],
            pytorchLines: [4, 7],
          },
          {
            id: 'vt',
            label: '二阶矩 v_t (Adaptive Scale)',
            role: 'hyper',
            shape: 'same as θ',
            explanation: '梯度平方的指数移动平均：陡峭方向梯度大则自动缩小步长，平缓方向梯度小则放大步长。',
            numpyLines: [3, 5],
            pytorchLines: [4, 7],
          },
          {
            id: 'upd',
            label: '参数更新 θ_t',
            role: 'param',
            shape: 'same as θ',
            explanation: '利用偏差修正后的 m̂_t / (√v̂_t + ε) 做近似信噪比归一化更新，对不同量级特征极其友好。',
            numpyLines: [6],
            pytorchLines: [7],
          },
        ],
      },
    ],
    sandbox: {
      id: 'sandbox-p2',
      title: '在线实验 · 手写两层 MLP 反向传播 + 数值梯度检查 (Gradient Checking)',
      description: '验证你手写的解析反向传播梯度与中心差分数值梯度误差 < 1e-7，并训练非线性 XOR/同心圆分类！',
      tips: [
        '试着故意把 d1 = dh * (z1 > 0) 改错一行，立刻看到梯度检查报错！',
        '调整隐藏层宽度 H=16 和学习率 lr 观察收敛速度',
      ],
      starterCode: `import numpy as np

# 构造非线性不可分的同心圆二分类数据集
rng = np.random.default_rng(7)
N = 160
angles = rng.uniform(0, 2 * np.pi, N)
r_inner = rng.normal(0.6, 0.12, N // 2)
r_outer = rng.normal(1.5, 0.15, N // 2)
X = np.vstack([
    np.column_stack([r_inner * np.cos(angles[:N//2]), r_inner * np.sin(angles[:N//2])]),
    np.column_stack([r_outer * np.cos(angles[N//2:]), r_outer * np.sin(angles[N//2:])]),
])
y = np.array([0]*(N//2) + [1]*(N//2))

def mlp_loss_and_grads(params, X, y, reg=1e-3):
    W1, b1, W2, b2 = params["W1"], params["b1"], params["W2"], params["b2"]
    z1 = X @ W1 + b1
    h = np.maximum(0, z1)
    scores = h @ W2 + b2
    scores -= scores.max(axis=1, keepdims=True)
    probs = np.exp(scores) / np.exp(scores).sum(axis=1, keepdims=True)
    loss = -np.mean(np.log(probs[np.arange(len(y)), y] + 1e-12))
    loss += 0.5 * reg * (np.sum(W1**2) + np.sum(W2**2))

    d2 = probs.copy()
    d2[np.arange(len(y)), y] -= 1.0
    d2 /= len(y)
    grads = {}
    grads["W2"] = h.T @ d2 + reg * W2
    grads["b2"] = d2.sum(axis=0)
    dh = d2 @ W2.T
    d1 = dh * (z1 > 0)
    grads["W1"] = X.T @ d1 + reg * W1
    grads["b1"] = d1.sum(axis=0)
    return loss, grads

# 初始化 2 -> H -> 2 网络 (He Initialization)
H = 16
params = {
    "W1": rng.normal(0, np.sqrt(2.0 / 2), (2, H)),
    "b1": np.zeros(H),
    "W2": rng.normal(0, np.sqrt(2.0 / H), (H, 2)),
    "b2": np.zeros(2),
}

# 1) 数值梯度检查 (验证 W1[0, 0])
_, grads = mlp_loss_and_grads(params, X, y)
eps = 1e-5
params["W1"][0, 0] += eps
l_plus, _ = mlp_loss_and_grads(params, X, y)
params["W1"][0, 0] -= 2 * eps
l_minus, _ = mlp_loss_and_grads(params, X, y)
params["W1"][0, 0] += eps
num_grad = (l_plus - l_minus) / (2 * eps)
rel_err = abs(num_grad - grads["W1"][0, 0]) / (abs(num_grad) + abs(grads["W1"][0, 0]) + 1e-12)
print(f"梯度检查 -> 解析梯度: {grads['W1'][0,0]:.6f}, 数值梯度: {num_grad:.6f}, 相对误差: {rel_err:.2e}")

# 2) 训练 200 步观察非线性分类收敛
losses, accs = [], []
lr = 0.5
for step in range(200):
    loss, grads = mlp_loss_and_grads(params, X, y)
    for k in params:
        params[k] -= lr * grads[k]
    losses.append(loss)
    preds = np.argmax(np.maximum(0, X @ params["W1"] + params["b1"]) @ params["W2"] + params["b2"], axis=1)
    accs.append(np.mean(preds == y))

print(f"训练结束 -> Loss: {losses[-1]:.4f}, 准确率: {accs[-1]*100:.1f}%")
plot_series("两层 ReLU MLP 拟合非线性同心圆", {"Loss": losses, "Accuracy": accs}, xlabel="Step", ylabel="Value")
`,
    },
    thoughtQuestions: [
      {
        question: '为什么深层普通 CNN 堆得越深，连训练集误差反而变高（退化问题 Degradation）？',
        answer:
          '这并非过拟合，而是优化困难：普通深层网络很难把多层非线性拟合出一个简单的恒等映射 H(x) = x。ResNet 改写为 H(x) = F(x) + x，只要把残差权重推向 0 就能轻松实现恒等映射，同时反向传播多出一条 "+1" 无损梯度通道。',
      },
      {
        question: '为什么需要用数值梯度检查（Gradient Checking），但正式训练却不能用数值梯度？',
        answer:
          '中心差分每算一个参数的偏导都要跑 2 次完整前向传播，百万参数模型需要跑两百万次前向，慢到不可接受；而反向传播只需 1 次前向 + 1 次反向就能同时拿到全部参数梯度。因此数值梯度只用来在单元测试里验证反向传播写得对不对。',
      },
    ],
  },
];
