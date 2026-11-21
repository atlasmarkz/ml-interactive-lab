import { PartModule } from '../types/curriculum';

export const PARTS_3_TO_5: PartModule[] = [
  {
    id: 'part-3',
    partNumber: 3,
    slug: 'part-3-advanced-dl',
    titleZh: '高级深度学习：Transformer 与多模态',
    titleEn: 'Transformers, BERT, GPT, ViT & CLIP',
    tagline: '抛弃循环依赖，用全局并行自注意力统一语言、视觉与跨模态语义空间。',
    topics: [
      'Scaled Dot-Product Self-Attention',
      'Multi-Head & Positional Encoding',
      'BERT (Encoder) vs GPT (Decoder)',
      'Vision Transformer (ViT)',
      'CLIP Contrastive Learning',
    ],
    accentColor: 'indigo',
    keyTakeaways: [
      'Self-Attention 让任意距离的两个 Token 在 O(1) 路径长度内直接交互；除以 √d_k 是为了保持点积方差为 1，防止 Softmax 饱和梯度消失。',
      'BERT 是双向 Encoder（Masked LM 适合理解任务），GPT 是单向因果掩码 Decoder（Next-Token Prediction 适合自回归生成）。',
      'ViT 把图像切成 Patch 序列即可复用完全相同的 Transformer 架构；CLIP 用对称 InfoNCE 对比损失把图像与文本拉入同一个共享嵌入空间。',
    ],
    formulaSpecs: [
      {
        id: 'p3-attention',
        title: 'Scaled Dot-Product Self-Attention 与因果掩码',
        subtitle: 'Transformer、BERT、GPT、ViT 共同的唯一心脏公式',
        latex: String.raw`\text{Attention}(\htmlClass{formula-token formula-token-data token-q}{\mathbf{Q}}, \htmlClass{formula-token formula-token-data token-k}{\mathbf{K}}, \htmlClass{formula-token formula-token-data token-v}{\mathbf{V}}) = \text{softmax}\!\left(\frac{\htmlClass{formula-token formula-token-output token-qk}{\mathbf{Q}\mathbf{K}^\top}}{\htmlClass{formula-token formula-token-hyper token-scale}{\sqrt{d_k}}} + \htmlClass{formula-token formula-token-loss token-mask}{\mathbf{M}}\right)\mathbf{V}`,
        numpyCode: `def self_attention(X, Wq, Wk, Wv, causal=False):
    T, d_k = X.shape[0], Wq.shape[1]
    Q = X @ Wq                                   # (T, d_k)
    K = X @ Wk                                   # (T, d_k)
    V = X @ Wv                                   # (T, d_v)
    scores = (Q @ K.T) / np.sqrt(d_k)            # (T, T) 缩放点积
    if causal:
        mask = np.triu(np.full((T, T), -1e9), k=1)
        scores = scores + mask                   # GPT 遮蔽未来位置
    scores -= scores.max(axis=-1, keepdims=True)
    weights = np.exp(scores) / np.exp(scores).sum(axis=-1, keepdims=True)
    out = weights @ V                            # (T, d_v) 加权聚合
    return out, weights`,
        pytorchCode: `import math, torch
import torch.nn.functional as F

def self_attention_torch(Q, K, V, causal=False):
    d_k = Q.size(-1)
    scores = (Q @ K.transpose(-2, -1)) / math.sqrt(d_k)
    if causal:
        T = Q.size(-2)
        mask = torch.triu(torch.ones(T, T, device=Q.device, dtype=torch.bool), diagonal=1)
        scores = scores.masked_fill(mask, float("-inf"))
    weights = F.softmax(scores, dim=-1)
    return weights @ V, weights`,
        terms: [
          {
            id: 'q',
            label: 'Query 查询矩阵 Q',
            role: 'data',
            shape: '(T, d_k)',
            explanation: '每个词发出的“我在寻找什么语义信息”的查询向量，由输入 X 经可学习矩阵 W_Q 投影得到。',
            numpyLines: [3],
            pytorchLines: [6],
          },
          {
            id: 'k',
            label: 'Key 键矩阵 K',
            role: 'data',
            shape: '(T, d_k)',
            explanation: '每个词展示给别人的“索引标签”，用来与所有 Query 做内积打分。',
            numpyLines: [4],
            pytorchLines: [6],
          },
          {
            id: 'qk',
            label: '全局相关性矩阵 QKᵀ',
            role: 'output',
            shape: '(T, T)',
            explanation: '一次性并行算出序列中任意两词的相似度，计算复杂度 O(T²·d_k)——这也是长上下文显存瓶颈所在。',
            numpyLines: [6],
            pytorchLines: [6],
          },
          {
            id: 'scale',
            label: '缩放因子 √d_k',
            role: 'hyper',
            shape: 'scalar',
            explanation: '若 Q, K 元素均值为 0 方差为 1，点积方差为 d_k。除以 √d_k 把方差拉回 1，避免 Softmax 落入梯度为 0 的饱和区。',
            numpyLines: [6],
            pytorchLines: [6],
          },
          {
            id: 'mask',
            label: '因果掩码 M (GPT 专属)',
            role: 'loss',
            shape: '(T, T) 上三角 −∞',
            explanation: 'GPT 生成第 t 个词时绝不能偷看 t+1 之后的未来词。在上三角加上 −∞ 后，经过 exp(−∞)=0 权重严格归零。',
            numpyLines: [7, 8, 9],
            pytorchLines: [7, 8, 9, 10],
          },
          {
            id: 'v',
            label: 'Value 值矩阵与聚合输出',
            role: 'data',
            shape: '(T, d_v)',
            explanation: '按注意力概率 weights 对所有位置的 Value 做加权平均，生成融合上下文后的新表征。',
            numpyLines: [5, 11, 12],
            pytorchLines: [11, 12],
          },
        ],
      },
      {
        id: 'p3-clip',
        title: 'CLIP 对称图文对比损失 (Symmetric InfoNCE)',
        subtitle: '拉近对角线匹配的图文对，推远所有 N² − N 个错配负样本',
        latex: String.raw`\htmlClass{formula-token formula-token-output token-logits}{\mathbf{S}} = \frac{\htmlClass{formula-token formula-token-data token-ie}{\hat{\mathbf{I}}}\,\htmlClass{formula-token formula-token-data token-te}{\hat{\mathbf{T}}}^\top}{\htmlClass{formula-token formula-token-hyper token-tau}{\tau}}, \qquad \htmlClass{formula-token formula-token-loss token-closs}{\mathcal{L}_{\text{CLIP}}} = \frac{1}{2}\Big[\text{CE}(\mathbf{S}, \mathbf{y}_{\text{diag}}) + \text{CE}(\mathbf{S}^\top, \mathbf{y}_{\text{diag}})\Big]`,
        numpyCode: `def clip_loss(I_emb, T_emb, tau=0.07):
    I_norm = I_emb / np.linalg.norm(I_emb, axis=1, keepdims=True)
    T_norm = T_emb / np.linalg.norm(T_emb, axis=1, keepdims=True)
    logits = (I_norm @ T_norm.T) / tau           # (B, B) 余弦相似度 / τ
    labels = np.arange(len(I_emb))               # 正样本在对角线 0,1,...,B-1
    def ce(mat):
        m = mat - mat.max(axis=1, keepdims=True)
        lp = m - np.log(np.exp(m).sum(axis=1, keepdims=True))
        return -np.mean(lp[labels, labels])
    return 0.5 * (ce(logits) + ce(logits.T))`,
        pytorchCode: `import torch
import torch.nn.functional as F

def clip_loss_torch(I_emb, T_emb, logit_scale):
    I_norm = F.normalize(I_emb, dim=-1)
    T_norm = F.normalize(T_emb, dim=-1)
    logits = logit_scale.exp() * (I_norm @ T_norm.T)
    labels = torch.arange(len(I_emb), device=I_emb.device)
    loss_i = F.cross_entropy(logits, labels)
    loss_t = F.cross_entropy(logits.T, labels)
    return 0.5 * (loss_i + loss_t)`,
        terms: [
          {
            id: 'ie',
            label: 'L2 归一化图像特征 Î',
            role: 'data',
            shape: '(B, D)',
            explanation: 'ViT / ResNet 图像编码器输出后投影到单位超球面上，使点积等于余弦相似度。',
            numpyLines: [2],
            pytorchLines: [5],
          },
          {
            id: 'te',
            label: 'L2 归一化文本特征 T̂',
            role: 'data',
            shape: '(B, D)',
            explanation: '文本 Transformer 编码器输出的单位向量，与图像向量处于同一 D 维多模态空间。',
            numpyLines: [3],
            pytorchLines: [6],
          },
          {
            id: 'tau',
            label: '可学习温度参数 τ',
            role: 'hyper',
            shape: 'scalar (≈0.07)',
            explanation: '把 [-1, 1] 范围的余弦相似度放大约 14 倍，使 Softmax 能够对难负样本产生足够陡峭的梯度。',
            numpyLines: [4],
            pytorchLines: [7],
          },
          {
            id: 'logits',
            label: '图文相似度矩阵 S',
            role: 'output',
            shape: '(B, B)',
            explanation: 'B 张图与 B 句文本两两打分：对角线是 B 个真配对，其余 B²−B 格全是同批次内负样本。',
            numpyLines: [4],
            pytorchLines: [7],
          },
          {
            id: 'closs',
            label: '对称交叉熵总损失',
            role: 'loss',
            shape: 'scalar',
            explanation: '同时做“以图搜文”（按行 CE）和“以文搜图”（按列 CE），训练完毕即可实现 Zero-Shot 图像分类！',
            numpyLines: [5, 6, 7, 8, 9, 10],
            pytorchLines: [8, 9, 10, 11],
          },
        ],
      },
    ],
    sandbox: {
      id: 'sandbox-p3',
      title: '在线实验 · 实测 √d_k 缩放对 Attention 熵的影响 & CLIP Zero-Shot 推理',
      description: '运行纯 NumPy Multi-Head Attention，量化验证不除 √d_k 时随着维度增大 Attention 权重熵崩塌的现象。',
      tips: [
        '试着把 causal 改成 True 观察上三角注意力全部归零',
        '修改 CLIP 的 tau 从 0.07 到 0.5 观察对角线置信度变化',
      ],
      starterCode: `import numpy as np

rng = np.random.default_rng(123)

def softmax(x):
    x = x - np.max(x, axis=-1, keepdims=True)
    e = np.exp(x)
    return e / np.sum(e, axis=-1, keepdims=True)

def attn_entropy(weights):
    return float(-np.mean(np.sum(weights * np.log(weights + 1e-12), axis=-1)))

# 1) 测试 d_k 从 4 增到 256 时，缩放 vs 不缩放的 Attention 熵变化
T = 16
dks = [4, 8, 16, 32, 64, 128, 256]
ent_scaled, ent_unscaled = [], []

for dk in dks:
    Q = rng.normal(0, 1, (T, dk))
    K = rng.normal(0, 1, (T, dk))
    w_scaled = softmax((Q @ K.T) / np.sqrt(dk))
    w_unscaled = softmax(Q @ K.T)
    ent_scaled.append(attn_entropy(w_scaled))
    ent_unscaled.append(attn_entropy(w_unscaled))

print("d_k  | 启用 ÷√d_k 熵 | 关闭缩放熵 (趋近 0 = 梯度消失!)")
for d, es, eu in zip(dks, ent_scaled, ent_unscaled):
    print(f"{d:4d} |    {es:.4f}    |    {eu:.4f}")

# 2) CLIP 对称对比损失与温度 τ 效应
I = rng.normal(0, 1, (4, 64))
T_txt = I + rng.normal(0, 0.25, (4, 64))  # 模拟配对文本特征接近图像特征
I /= np.linalg.norm(I, axis=1, keepdims=True)
T_txt /= np.linalg.norm(T_txt, axis=1, keepdims=True)

for tau in [0.5, 0.15, 0.07]:
    probs = softmax((I @ T_txt.T) / tau)
    diag_conf = np.mean(np.diag(probs))
    print(f"CLIP τ={tau:4.2f} -> 正确图文匹配平均概率: {diag_conf*100:.1f}%")

plot_series(
    "Attention 权重平均熵随维度 d_k 的变化（证明 ÷√d_k 的必要性）",
    {"启用 ÷√d_k (健康稳定)": (dks, ent_scaled), "不缩放 (迅速饱和塌缩)": (dks, ent_unscaled)},
    xlabel="Head 维度 d_k",
    ylabel="Attention 熵 (nats)"
)
`,
    },
    thoughtQuestions: [
      {
        question: '为什么 Transformer 必须额外加入 Positional Encoding（位置编码）？',
        answer:
          'Self-Attention 本质上是一个对输入集合置换等变（Permutation Equivariant）的操作：把句子里的词打乱顺序，如果没有位置编码，输出向量只是跟着打乱，模型完全不知道“猫追狗”和“狗追猫”的词序差别。',
      },
      {
        question: 'CLIP 为什么能在从未见过某些类别标签的情况下完成 Zero-Shot 图像分类？',
        answer:
          '传统分类器把类别写死在固定维度的输出头里；CLIP 把类别名写成文本提示（如 "a photo of a {class}"）送入文本编码器，只需计算图像向量和所有候选文本向量的余弦相似度取最大值即可分类，天然支持开放词表！',
      },
    ],
  },
  {
    id: 'part-4',
    partNumber: 4,
    slug: 'part-4-generative-models',
    titleZh: '图像生成模型',
    titleEn: 'VAE, GAN, Diffusion & Flow Models',
    tagline: '从变分推断 ELBO、极小极大博弈到渐进式扩散去噪与直线流匹配，揭开 AI 绘画的数学引擎。',
    topics: [
      'VAE & Reparameterization Trick',
      'ELBO (Reconstruction − KL)',
      'GAN Min-Max Game & Mode Collapse',
      'DDPM Forward / Reverse Diffusion',
      'Flow Matching / Rectified Flow',
    ],
    accentColor: 'rose',
    keyTakeaways: [
      'VAE 通过最大化对数似然下界 ELBO，在“重建清晰度”与“潜空间服从标准高斯先验”之间做权衡；重参数化技巧使随机采样节点可微。',
      'GAN 不显式建模概率密度，而是让生成器 G 与判别器 D 做极小极大博弈；理论上等价于最小化真实分布与生成分布的 JS 散度。',
      'Diffusion 通过闭式前向加噪学习预测噪声 ε_θ(x_t, t)；新一代 Flow Matching 直接拟合直线速度场 v_θ(x_t, t) ≈ ε − x₀，显著减少采样步数。',
    ],
    formulaSpecs: [
      {
        id: 'p4-vae-elbo',
        title: 'VAE 的 ELBO 目标函数与重参数化技巧',
        subtitle: '把不可解的边际似然 log p(x) 转化为可端到端反向传播的变分下界',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-elbo}{\mathcal{L}_{\text{VAE}}} = \underbrace{\|\mathbf{x} - \htmlClass{formula-token formula-token-output token-dec}{\hat{\mathbf{x}}}\|^2}_{\text{重建损失}} + \htmlClass{formula-token formula-token-hyper token-beta}{\beta}\cdot\underbrace{\left(-\frac{1}{2}\sum_j \big(1 + \log\sigma_j^2 - \mu_j^2 - \sigma_j^2\big)\right)}_{\htmlClass{formula-token formula-token-loss token-kl}{D_{\text{KL}}(q_\phi(\mathbf{z}|\mathbf{x})\,\|\,\mathcal{N}(\mathbf{0},\mathbf{I}))}}, \quad \htmlClass{formula-token formula-token-param token-reparam}{\mathbf{z} = \boldsymbol{\mu} + \boldsymbol{\sigma} \odot \boldsymbol{\epsilon}}`,
        numpyCode: `def vae_loss(x, mu, logvar, decoder_fn, beta=1.0):
    std = np.exp(0.5 * logvar)
    eps = np.random.randn(*std.shape)            # 随机性剥离到外部 ε ~ N(0,I)
    z = mu + std * eps                           # Reparameterization Trick
    x_hat = decoder_fn(z)                        # 重建图像 (B, D)
    recon_loss = np.mean(np.sum((x - x_hat)**2, axis=-1))
    kl_loss = -0.5 * np.mean(np.sum(1 + logvar - mu**2 - np.exp(logvar), axis=-1))
    return recon_loss + beta * kl_loss, recon_loss, kl_loss`,
        pytorchCode: `import torch
import torch.nn.functional as F

def vae_loss_torch(x, x_hat, mu, logvar, beta=1.0):
    # Reparameterization 在 forward 里执行:
    # std = torch.exp(0.5 * logvar); z = mu + std * torch.randn_like(std)
    recon = F.mse_loss(x_hat, x, reduction="sum") / x.size(0)
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp()) / x.size(0)
    return recon + beta * kl, recon, kl`,
        terms: [
          {
            id: 'reparam',
            label: '重参数化 z = μ + σ ⊙ ε',
            role: 'param',
            shape: '(B, d_z)',
            explanation: '把不可导的随机采样节点变成确定性线性运算，让梯度 ∂z/∂μ = 1、∂z/∂σ = ε 畅通无阻回传到 Encoder。',
            numpyLines: [2, 3, 4],
            pytorchLines: [5, 6],
          },
          {
            id: 'dec',
            label: 'Decoder 重建项 x̂',
            role: 'output',
            shape: '(B, D)',
            explanation: '强迫隐变量 z 保留足够多的原图信息以还原输入 x（对应高斯似然假设下的 MSE）。',
            numpyLines: [5, 6],
            pytorchLines: [7],
          },
          {
            id: 'kl',
            label: '解析高斯 KL 正则项',
            role: 'loss',
            shape: 'scalar (≥ 0)',
            explanation: '两个高斯分布的 KL 散度存在闭式解析解，把后验分布拉向标准正态 N(0, I)，保证推理时随机采 z 也能生成合理样本。',
            numpyLines: [7],
            pytorchLines: [8],
          },
          {
            id: 'beta',
            label: 'β-VAE 权衡系数',
            role: 'hyper',
            shape: 'scalar',
            explanation: 'β=1 为标准 ELBO；增大 β 鼓励解耦表征但会让图像变模糊，β=0 退化为普通自编码器。',
            numpyLines: [8],
            pytorchLines: [9],
          },
          {
            id: 'elbo',
            label: '总变分损失 (−ELBO)',
            role: 'loss',
            shape: 'scalar',
            explanation: '最小化重建损失 + β·KL 等价于最大化数据对数似然的证据下界 (ELBO)。',
            numpyLines: [8],
            pytorchLines: [9],
          },
        ],
      },
      {
        id: 'p4-ddpm',
        title: 'DDPM 一步前向加噪与简化噪声预测损失',
        subtitle: '利用高斯可加性跳过中间 t−1 步，任意时刻 x_t 一步采出',
        latex: String.raw`\htmlClass{formula-token formula-token-output token-xt}{\mathbf{x}_t} = \htmlClass{formula-token formula-token-hyper token-sa}{\sqrt{\bar{\alpha}_t}}\,\htmlClass{formula-token formula-token-data token-x0}{\mathbf{x}_0} + \htmlClass{formula-token formula-token-hyper token-s1a}{\sqrt{1-\bar{\alpha}_t}}\,\htmlClass{formula-token formula-token-data token-eps}{\boldsymbol{\epsilon}}, \qquad \htmlClass{formula-token formula-token-loss token-dloss}{\mathcal{L}_{\text{simple}}} = \mathbb{E}_{t,\mathbf{x}_0,\boldsymbol{\epsilon}}\!\Big[\big\|\boldsymbol{\epsilon} - \htmlClass{formula-token formula-token-param token-pred}{\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)}\big\|^2\Big]`,
        numpyCode: `def ddpm_training_step(x0, eps_model, alpha_bars, T=1000):
    B = x0.shape[0]
    t = np.random.randint(0, T, size=(B,))       # 随机采样时间步 t
    eps = np.random.randn(*x0.shape)             # 标准高斯噪声 ε
    sa = np.sqrt(alpha_bars[t])[:, None]         # √ᾱ_t (信号保留比例)
    s1a = np.sqrt(1.0 - alpha_bars[t])[:, None]  # √(1-ᾱ_t) (噪声比例)
    x_t = sa * x0 + s1a * eps                    # 一步直接加噪到时刻 t
    eps_pred = eps_model(x_t, t)                 # U-Net / DiT 预测所加噪声
    loss = np.mean((eps - eps_pred) ** 2)        # 极简 MSE 噪声预测损失
    return loss`,
        pytorchCode: `import torch
import torch.nn.functional as F

def ddpm_loss_torch(model, x0, alpha_bars, T=1000):
    t = torch.randint(0, T, (x0.size(0),), device=x0.device)
    eps = torch.randn_like(x0)
    sa = alpha_bars[t].sqrt().view(-1, 1, 1, 1)
    s1a = (1.0 - alpha_bars[t]).sqrt().view(-1, 1, 1, 1)
    x_t = sa * x0 + s1a * eps
    eps_pred = model(x_t, t)
    return F.mse_loss(eps_pred, eps)`,
        terms: [
          {
            id: 'x0',
            label: '清晰真实图像 x₀',
            role: 'data',
            shape: '(B, C, H, W)',
            explanation: '训练集中的原始干净样本。',
            numpyLines: [7],
            pytorchLines: [9],
          },
          {
            id: 'eps',
            label: '真实注入噪声 ε',
            role: 'data',
            shape: '(B, C, H, W)',
            explanation: '独立采样的标准高斯白噪声，也是去噪神经网络的监督回归目标。',
            numpyLines: [4, 7, 9],
            pytorchLines: [6, 9, 11],
          },
          {
            id: 'sa',
            label: '信号系数 √ᾱ_t',
            role: 'hyper',
            shape: '(B, 1, …)',
            explanation: 'ᾱ_t = ∏(1−β_s) 为累积信噪保留率，从 t=0 时的 1 平滑衰减到 t=T 时接近 0。',
            numpyLines: [5, 7],
            pytorchLines: [7, 9],
          },
          {
            id: 's1a',
            label: '噪声系数 √(1−ᾱ_t)',
            role: 'hyper',
            shape: '(B, 1, …)',
            explanation: '随 t 增大而趋近 1，保证 x_t 的总方差始终维持在稳定尺度（Variance Preserving）。',
            numpyLines: [6, 7],
            pytorchLines: [8, 9],
          },
          {
            id: 'xt',
            label: '时刻 t 的加噪样本 x_t',
            role: 'output',
            shape: '(B, C, H, W)',
            explanation: '无需迭代加噪 t 次，闭式公式一次前向即可构造任意时刻训练对！',
            numpyLines: [7],
            pytorchLines: [9],
          },
          {
            id: 'pred',
            label: '噪声预测网络 ε_θ(x_t, t)',
            role: 'param',
            shape: '(B, C, H, W)',
            explanation: '通常是带时间步嵌入的 U-Net 或 Diffusion Transformer (DiT)，等价于学习数据分布的 Score Function ∇log p(x_t)。',
            numpyLines: [8],
            pytorchLines: [10],
          },
          {
            id: 'dloss',
            label: '简化扩散损失 L_simple',
            role: 'loss',
            shape: 'scalar',
            explanation: 'Ho et al. (2020) 证明把复杂变分下界化简为等权 MSE 噪声预测损失后，生成视觉质量反而更好、训练极度稳定！',
            numpyLines: [9],
            pytorchLines: [11],
          },
        ],
      },
    ],
    sandbox: {
      id: 'sandbox-p4',
      title: '在线实验 · 对比 Linear vs Cosine 扩散加噪调度 & 2D Rectified Flow 采样',
      description: '用 NumPy 对比 DDPM 经典线性 β 调度与改进版余弦调度（Cosine Schedule）的信噪比衰减曲线，并模拟 Flow Matching 直线去噪。',
      tips: [
        '修改 beta_end 从 0.02 到 0.05 看 Linear 调度过早毁掉信号',
        '调整 n_steps 观察 Flow Matching 仅需几步就能收敛到目标点',
      ],
      starterCode: `import numpy as np

T = 200
ts = np.arange(T)

# 1) 对比 DDPM Linear Schedule vs Improved DDPM Cosine Schedule
beta_lin = np.linspace(1e-4, 0.03, T)
alpha_bar_lin = np.cumprod(1.0 - beta_lin)

s = 0.008
f_t = np.cos(((ts / T + s) / (1 + s)) * (np.pi / 2)) ** 2
alpha_bar_cos = f_t / f_t[0]

print(f"Linear 调度在 t=T/2 残留信号比例 √ᾱ = {np.sqrt(alpha_bar_lin[T//2]):.3f}")
print(f"Cosine 调度在 t=T/2 残留信号比例 √ᾱ = {np.sqrt(alpha_bar_cos[T//2]):.3f}")

# 2) 用解析速度场演示 Flow Matching ODE 5 步直达目标分布均值
rng = np.random.default_rng(9)
x_target = np.array([2.0, -1.5])
x_noise = rng.normal(0, 1, size=(2,))
x = x_noise.copy()
n_steps = 5
dt = 1.0 / n_steps
for step in range(n_steps):
    # 理想直线速度场 v = x_target - x_noise (常向量!)
    v = x_target - x_noise
    x = x + dt * v
print(f"\\nFlow Matching {n_steps} 步 Euler 积分误差: {np.linalg.norm(x - x_target):.2e}")

plot_series(
    "DDPM 信号保留曲线 ᾱ_t：Linear Schedule vs Cosine Schedule",
    {"Linear Schedule ᾱ_t": (ts, alpha_bar_lin), "Cosine Schedule ᾱ_t": (ts, alpha_bar_cos)},
    xlabel="扩散步数 t",
    ylabel="累积保留率 ᾱ_t"
)
`,
    },
    thoughtQuestions: [
      {
        question: '为什么 Diffusion 模型比 GAN 训练稳定得多，且几乎不发生 Mode Collapse？',
        answer:
          'GAN 是双人极小极大博弈（非稳态目标），判别器太强或太弱都会让生成器梯度崩盘；而 Diffusion 是纯监督 MSE 回归（预测已知高斯噪声），目标函数稳定单峰且对应精确变分下界，天然覆盖全部数据模式。代价是推理需要多步迭代采样。',
      },
      {
        question: 'Classifier-Free Guidance (CFG) 是如何让文生图更贴合 Prompt 的？',
        answer:
          '训练时随机以 10%–20% 概率丢弃文本条件 c（同时学会条件与无条件去噪）；推理时沿“条件预测 − 无条件预测”方向外推：ε̃ = ε(x_t, ∅) + w·(ε(x_t, c) − ε(x_t, ∅))。增大引导系数 w（如 7.5）会牺牲少量多样性换取极高的图文对齐度与清晰度。',
      },
    ],
  },
  {
    id: 'part-5',
    partNumber: 5,
    slug: 'part-5-reinforcement-learning',
    titleZh: '强化学习导论',
    titleEn: 'Introduction to Reinforcement Learning',
    tagline: '从 MDP 与 Bellman 方程、Q-Learning / DQN 值函数方法，到 Policy Gradient、Actor-Critic 与驱动大模型对齐的 PPO/RLHF。',
    topics: [
      'MDP & Bellman Equations',
      'Value Iteration & Q-Learning',
      'Deep Q-Network (DQN)',
      'REINFORCE & Actor-Critic (A2C)',
      'PPO Clipped Objective & RLHF',
    ],
    accentColor: 'amber',
    keyTakeaways: [
      '强化学习通过与环境试错交互最大化累积折扣回报 G_t = ∑ γ^k r_{t+k+1}，面临信用分配（Credit Assignment）与探索-利用权衡。',
      'Q-Learning 是 Off-Policy 的时序差分（TD）算法，无需环境转移概率 P 即可直接逼近最优动作价值 Q*(s,a)；DQN 通过经验回放与目标网络稳定神经网络训练。',
      'PPO 用重要性采样比 r_t(θ) 配合 [1−ε, 1+ε] 裁剪信赖域防止策略更新崩塌，成为 ChatGPT / RLHF 对齐的工业界基石算法。',
    ],
    formulaSpecs: [
      {
        id: 'p5-qlearning',
        title: 'Q-Learning 时序差分 (TD) 更新规则',
        subtitle: '无需环境模型，用单步观测奖励 + 下一步最大估计值迭代逼近 Bellman 最优方程',
        latex: String.raw`\htmlClass{formula-token formula-token-param token-qsa}{Q(s, a)} \leftarrow Q(s, a) + \htmlClass{formula-token formula-token-hyper token-alpha}{\alpha}\Big[\underbrace{\htmlClass{formula-token formula-token-data token-rew}{r} + \htmlClass{formula-token formula-token-hyper token-gamma}{\gamma}\htmlClass{formula-token formula-token-output token-maxq}{\max_{a'} Q(s', a')}}_{\text{TD Target}} - \htmlClass{formula-token formula-token-loss token-tderr}{Q(s, a)}\Big]`,
        numpyCode: `def q_learning_update(Q, s, a, r, s_next, done, alpha=0.2, gamma=0.95):
    # 若到达终止状态，未来价值为 0
    best_next = 0.0 if done else np.max(Q[s_next])
    td_target = r + gamma * best_next
    td_error = td_target - Q[s, a]
    Q[s, a] += alpha * td_error
    return td_error`,
        pytorchCode: `import torch
import torch.nn.functional as F

def dqn_loss_step(q_net, target_net, s, a, r, s_next, done, gamma=0.99):
    q_pred = q_net(s).gather(1, a.unsqueeze(1)).squeeze(1)
    with torch.no_grad():
        # 目标网络固定参数，避免“追逐移动靶心”导致训练发散
        max_next_q = target_net(s_next).max(dim=1).values
        td_target = r + gamma * max_next_q * (1.0 - done)
    return F.smooth_l1_loss(q_pred, td_target)`,
        terms: [
          {
            id: 'qsa',
            label: '当前动作价值 Q(s, a)',
            role: 'param',
            shape: 'table (|S|, |A|)',
            explanation: '在状态 s 采取动作 a 后继续按最优策略行动所能获得的期望累积折扣回报。',
            numpyLines: [6],
            pytorchLines: [5],
          },
          {
            id: 'rew',
            label: '即时环境奖励 r',
            role: 'data',
            shape: 'scalar',
            explanation: '智能体执行动作 a 后环境返回的真实单步标量反馈。',
            numpyLines: [4],
            pytorchLines: [9],
          },
          {
            id: 'gamma',
            label: '折扣因子 γ ∈ [0, 1)',
            role: 'hyper',
            shape: 'scalar',
            explanation: '决定智能体的“远见程度”：γ=0 只顾眼前奖励，γ→1 重视长期未来收益并保证无限步回报收敛。',
            numpyLines: [4],
            pytorchLines: [9],
          },
          {
            id: 'maxq',
            label: '贪婪未来估计 max Q(s′, a′)',
            role: 'output',
            shape: 'scalar',
            explanation: '无论当前实际采用的是 ε-greedy 还是随机探索策略，更新目标永远取下一步最优动作，因此 Q-Learning 是 Off-Policy 算法。',
            numpyLines: [3],
            pytorchLines: [8],
          },
          {
            id: 'tderr',
            label: 'TD 误差 (Target − Q)',
            role: 'loss',
            shape: 'scalar',
            explanation: '现实新体验（TD Target）减去旧预期（Q）的“惊喜度”；DQN 直接对 TD 误差做 Huber/MSE 回归。',
            numpyLines: [5],
            pytorchLines: [10],
          },
          {
            id: 'alpha',
            label: 'TD 学习率 α',
            role: 'hyper',
            shape: 'scalar',
            explanation: '每次把旧 Q 值朝新 TD Target 挪动的步长比例。',
            numpyLines: [6],
            pytorchLines: [10],
          },
        ],
      },
      {
        id: 'p5-ppo',
        title: 'PPO 裁剪代理目标函数 (Clipped Surrogate Objective)',
        subtitle: '用极简的 clip 约束替代昂贵的二阶信赖域 TRPO，支撑现代 RLHF 对齐',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-lclip}{L^{\text{CLIP}}(\theta)} = \mathbb{E}_t\Big[\min\big(\htmlClass{formula-token formula-token-output token-ratio}{r_t(\theta)}\,\htmlClass{formula-token formula-token-data token-adv}{\hat{A}_t},\; \htmlClass{formula-token formula-token-hyper token-clip}{\text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)}\,\hat{A}_t\big)\Big], \quad r_t(\theta)=\frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{\text{old}}}(a_t|s_t)}`,
        numpyCode: `def ppo_clipped_objective(logp_new, logp_old, advantages, eps=0.2):
    ratio = np.exp(logp_new - logp_old)              # 重要性采样概率比 r_t(θ)
    surr1 = ratio * advantages                       # 未裁剪策略目标
    clipped_ratio = np.clip(ratio, 1.0 - eps, 1.0 + eps)
    surr2 = clipped_ratio * advantages               # 裁剪后安全目标
    # 取 min 作为悲观下界，梯度优化时最大化此目标（损失取负号）
    return np.mean(np.minimum(surr1, surr2))`,
        pytorchCode: `import torch

def ppo_loss_torch(logp_new, logp_old, advantages, eps=0.2):
    ratio = (logp_new - logp_old).exp()
    surr1 = ratio * advantages
    surr2 = torch.clamp(ratio, 1.0 - eps, 1.0 + eps) * advantages
    return -torch.min(surr1, surr2).mean()`,
        terms: [
          {
            id: 'ratio',
            label: '重要性采样比 r_t(θ)',
            role: 'output',
            shape: '(B,)',
            explanation: '新策略与采样本时旧策略的概率比值；用 exp(log π_new − log π_old) 计算数值最稳定。',
            numpyLines: [2],
            pytorchLines: [4],
          },
          {
            id: 'adv',
            label: '优势函数 Â_t = Q − V',
            role: 'data',
            shape: '(B,)',
            explanation: '该动作比当前状态平均水平好多少（GAE 估计）。减掉 Baseline V(s) 大幅降低策略梯度方差！',
            numpyLines: [3, 5],
            pytorchLines: [5, 6],
          },
          {
            id: 'clip',
            label: '信赖域裁剪 [1−ε, 1+ε]',
            role: 'hyper',
            shape: 'ε ≈ 0.1~0.2',
            explanation: '把单次更新允许的概率变化锁死在 ±20% 范围内，超界后目标变平、梯度自动为 0。',
            numpyLines: [4, 5],
            pytorchLines: [6],
          },
          {
            id: 'lclip',
            label: '悲观下界目标 min(surr1, surr2)',
            role: 'loss',
            shape: 'scalar',
            explanation: '取最小值保证了：仅当更新对策略过于激进时才截断激励；如果把好动作改差了，依然保留梯度把它拉回来！',
            numpyLines: [7],
            pytorchLines: [7],
          },
        ],
      },
    ],
    sandbox: {
      id: 'sandbox-p5',
      title: '在线实验 · 对比 REINFORCE 无 Baseline vs 有 Baseline 策略梯度方差',
      description: '在多臂老虎机 / 简易 MDP 环境下运行 Q-Learning 与 REINFORCE，亲眼观察引入 Baseline 如何大幅稳定训练曲线！',
      tips: [
        '修改 gamma 或 eps 观察 Q-Learning 探索与收敛速度权衡',
        '对比下方曲线：有 Baseline 的策略梯度收敛更稳、波动更小',
      ],
      starterCode: `import numpy as np

# 5 状态一维走廊环境: 起点 0 -> 终点 4 (+10), 每步 -0.2
rng = np.random.default_rng(42)

def run_qlearning(episodes=120, alpha=0.25, gamma=0.92, eps=0.2):
    Q = np.zeros((5, 2))  # 动作 0: 左移, 1: 右移
    ep_rewards = []
    for _ in range(episodes):
        s, total_r = 0, 0.0
        for _ in range(25):
            a = rng.integers(0, 2) if rng.random() < eps else int(np.argmax(Q[s]))
            s_next = max(0, min(4, s + (1 if a == 1 else -1)))
            done = (s_next == 4)
            r = 10.0 if done else -0.2
            td_target = r + (0.0 if done else gamma * np.max(Q[s_next]))
            Q[s, a] += alpha * (td_target - Q[s, a])
            total_r += r
            s = s_next
            if done:
                break
        ep_rewards.append(total_r)
    return Q, ep_rewards

Q_learned, rewards_q = run_qlearning()
print("Q-Learning 学到的最优 Q 表 (列: [左, 右]):")
print(np.round(Q_learned, 2))

# 对比 REINFORCE: 无 Baseline vs 移动平均 Baseline 在带噪声奖励下的稳定性
def run_reinforce(use_baseline=True, steps=120, lr=0.15):
    theta = np.zeros(3)  # 3 个动作，真实期望奖励 [1.0, 2.5, 4.0] + 高斯噪声
    true_means = np.array([1.0, 2.5, 4.0])
    baseline = 0.0
    avg_rewards = []
    r_rng = np.random.default_rng(7)
    for _ in range(steps):
        probs = np.exp(theta - theta.max())
        probs /= probs.sum()
        a = r_rng.choice(3, p=probs)
        reward = true_means[a] + r_rng.normal(0, 1.2)
        adv = (reward - baseline) if use_baseline else reward
        baseline = 0.9 * baseline + 0.1 * reward
        grad_logp = -probs
        grad_logp[a] += 1.0
        theta += lr * adv * grad_logp
        avg_rewards.append(float(np.dot(probs, true_means)))
    return avg_rewards

r_no_base = run_reinforce(use_baseline=False)
r_with_base = run_reinforce(use_baseline=True)
print(f"\\nREINFORCE 最终期望回报 -> 无 Baseline: {r_no_base[-1]:.3f} | 有 Baseline: {r_with_base[-1]:.3f}")

plot_series(
    "REINFORCE 策略梯度：有无 Baseline 的收敛稳定性对比",
    {"有 Baseline (更稳更准)": r_with_base, "无 Baseline (高方差抖动)": r_no_base},
    xlabel="Update Step",
    ylabel="期望回报 E[R]"
)
`,
    },
    thoughtQuestions: [
      {
        question: '为什么 DQN 必须同时引入 Experience Replay（经验回放）和 Target Network（目标网络）？',
        answer:
          '相邻时间步采集的样本高度自相关，直接在线更新会破坏 SGD 的独立同分布假设；Experience Replay 通过随机打乱历史转移打破相关性。而直接用当前网络既算预测又算 TD Target 会导致“目标跟着参数一起跑”（剧烈震荡），Target Network 定期延迟同步权重，让回归靶心保持短期稳定。',
      },
      {
        question: '在大模型 RLHF（如 InstructGPT / ChatGPT）中，PPO 里的 S、A、R 分别对应什么？',
        answer:
          '状态 S 是 Prompt + 已经生成的 Token 前缀；动作 A 是词表里选出的下一个 Token；奖励 R 由奖励模型（Reward Model）在完整回答末尾打分，并减去与参考 SFT 模型之间的 KL 惩罚项 −β·D_KL(π_θ ‖ π_ref) 以防止模型“刷分胡言乱语”（Reward Hacking）。',
      },
    ],
  },
];
