import { LectureModule } from '../types/curriculum';

export const LECTURES_PART_3: LectureModule[] = [
  {
    id: 'l08',
    code: 'L08',
    partGroup: 'Part III · Transformers, Generative Models & RL',
    slug: 'l08-transformer-bert-llm',
    titleZh: 'Transformer 架构、BERT、GPT 与现代大语言模型',
    titleEn: 'Transformers, BERT, GPT, LLM Pipeline, Scaling Laws & MoE',
    abstract: String.raw`全面覆盖 L08.1 与 L08.2 两讲精华：严格证明 Self-Attention 除以 $\sqrt{d_k}$ 的方差稳定原理、Multi-Head 子空间并行、Pre-Norm vs Post-Norm 与位置编码；对比 Encoder-Only (BERT MLM 80/10/10) 与 Decoder-Only (GPT Causal LM)；并完整梳理现代 LLM 三阶段对齐、CoT / RAG、Scaling Laws 与 MoE 稀疏路由。`,
    readingChecklist: [
      String.raw`Self-Attention 矩阵公式、$\mathcal{O}(T^2 d)$ 复杂度与 $\mathcal{O}(1)$ 全局路径长度`,
      String.raw`方差严格证明：为何必须除以 $\sqrt{d_k}$ 防止 Softmax 饱和`,
      'Multi-Head Attention、Pre-Norm vs Post-Norm、Sinusoidal 位置编码（WA3 Q6）',
      String.raw`BERT 三合一输入、MLM ($80\%/10\%/10\%$) 动机、NSP 与下游微调范式（HA06）`,
      'GPT Causal Mask 自回归生成（HA07）与 LLM 三阶段管线 (Pretrain → SFT → RM / RLHF)',
      'ICL / CoT / RAG、Hallucination & Jailbreaking、Scaling Laws 与 MoE 稀疏专家',
    ],
    verifierId: 'l08-self-attention',
    derivations: [
      {
        id: 'd-l08-scale',
        title: String.raw`严格概率证明：为何 Scaled Dot-Product Attention 必须除以 $\sqrt{d_k}$？`,
        goal: String.raw`设查询向量 $\mathbf{q}$ 与键向量 $\mathbf{k}$ 的各维分量独立同分布，满足均值 $0$、方差 $1$。计算点积 $\mathbf{q}^\top \mathbf{k}$ 的方差，并说明不缩放为何摧毁反向传播梯度。`,
        steps: [
          {
            rule: 'Variance of Independent Products',
            latex: String.raw`\mathbb{E}[q_i k_i] = \mathbb{E}[q_i]\mathbb{E}[k_i] = 0, \qquad \text{Var}(q_i k_i) = \mathbb{E}[q_i^2]\mathbb{E}[k_i^2] - 0 = 1 \cdot 1 = 1`,
            justification: String.raw`利用独立随机变量乘积的期望与方差性质：单个乘积项 $q_i k_i$ 的方差为 $1$。`,
          },
          {
            rule: String.raw`Sum of $d_k$ Independent Terms`,
            latex: String.raw`\text{Var}(\mathbf{q}^\top \mathbf{k}) = \sum_{i=1}^{d_k} \text{Var}(q_i k_i) = d_k \implies \text{Std}(\mathbf{q}^\top \mathbf{k}) = \sqrt{d_k}`,
            justification: String.raw`独立变量之和的方差等于方差之和！因此当 $d_k = 64$ 或 $128$ 时，未缩放点积的标准差膨胀到 $8\sim 11$，极易出现高达 $+20 / -20$ 的极大 logits。`,
          },
          {
            rule: 'Variance Stabilization',
            latex: String.raw`\text{Var}\!\left(\frac{\mathbf{q}^\top \mathbf{k}}{\sqrt{d_k}}\right) = \frac{1}{d_k}\text{Var}(\mathbf{q}^\top \mathbf{k}) = 1`,
            justification: String.raw`除以 $\sqrt{d_k}$ 后，无论维度 $d_k$ 多大，送入 Softmax 的 logits 方差恒为 $1$，避免 Softmax 饱和成近似 one-hot（其雅可比矩阵 $p_i(\delta_{ij} - p_j)$ 在 $p \to \{0, 1\}$ 时全线归零导致梯度消失）！`,
          },
        ],
        conclusion: '这是 Transformer 能稳定扩展到千亿参数的最基础数值稳定设计之一。',
      },
    ],
    concepts: [
      {
        heading: 'Encoder-Only (BERT) vs Decoder-Only (GPT) 架构与预训练对比',
        body: '两者共享完全相同的 Transformer Block 积木，核心差异在于注意力可见掩码与预训练目标。',
        table: {
          headers: ['对比项', 'BERT (Encoder-Only)', 'GPT / LLaMA (Decoder-Only)'],
          rows: [
            ['注意力掩码', '无掩码（全双向同时看左右上下文）', '上三角 Causal Mask（仅看左侧已生成词）'],
            ['预训练任务', String.raw`MLM（$15\%$ 词按 $80\%$ ` + '`[MASK]`' + String.raw` / $10\%$ 随机 / $10\%$ 保留）+ NSP`, 'Next-Token Prediction（自回归极大似然）'],
            ['输入嵌入', 'Token + Segment (句 A/B) + Position Embedding', 'Token Embedding + Position / RoPE 旋转位置编码'],
            ['优势场景', '文本分类、情感分析 (HA06)、NER、检索编码器', '开放式生成 (HA07)、对话推理、通用基座大模型'],
          ],
        },
      },
      {
        heading: 'L08.2 现代 LLM 全景：三阶段管线、推理增强与 MoE',
        body: '从基座续写模型演进为可靠助手需要 Pretraining → SFT → Alignment (Reward Model + RLHF / DPO) 三步：',
        points: [
          'In-Context Learning / Chain-of-Thought (CoT)：不更新梯度，在上下文中给示范或引导分步思考，本质是为复杂推理分配更多中间 Token 算力。',
          'RAG (Retrieval-Augmented Generation)：外挂向量检索库实时注入最新事实，直接缓解静态参数知识过时与 Hallucination（幻觉）。',
          String.raw`Scaling Laws & MoE (Mixture of Experts)：损失随计算量呈幂律下降；MoE 用轻量 Router 对每个 Token 仅激活 Top-$K$（如 $2/8$）专家 FFN，大幅解耦“总参数知识量”与“单次前向 FLOPs”（需 Load Balancing Loss 防专家路由坍塌）。`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l08-attn',
        title: 'Multi-Head Scaled Dot-Product Self-Attention (含 Causal Mask)',
        subtitle: String.raw`完整标注四维张量 Shape $(B, H, T, d_k)$ 变换路径`,
        latex: String.raw`\text{Attention}(\htmlClass{formula-token formula-token-data token-q}{\mathbf{Q}}, \htmlClass{formula-token formula-token-data token-k}{\mathbf{K}}, \htmlClass{formula-token formula-token-data token-v}{\mathbf{V}}) = \text{softmax}\!\left(\frac{\htmlClass{formula-token formula-token-output token-qk}{\mathbf{Q}\mathbf{K}^\top}}{\htmlClass{formula-token formula-token-hyper token-sc}{\sqrt{d_k}}} + \htmlClass{formula-token formula-token-loss token-m}{\mathbf{M}}\right)\mathbf{V}`,
        numpyCode: `def scaled_dot_product_attention(Q, K, V, causal=False):
    # Q, K, V: (T, d_k)
    T, d_k = Q.shape
    scores = (Q @ K.T) / np.sqrt(d_k)               # (T, T)
    if causal:
        mask = np.triu(np.full((T, T), -1e9), k=1)  # 上三角遮蔽未来词
        scores = scores + mask
    scores -= scores.max(axis=-1, keepdims=True)
    weights = np.exp(scores) / np.exp(scores).sum(axis=-1, keepdims=True)
    return weights @ V, weights                     # (T, d_v), (T, T)`,
        pytorchCode: `import math, torch, torch.nn.functional as F

def mha_attention(Q, K, V, causal=False):
    # Q, K, V: (B, H, T, d_k)
    d_k = Q.size(-1)
    scores = (Q @ K.transpose(-2, -1)) / math.sqrt(d_k)
    if causal:
        T = Q.size(-2)
        mask = torch.triu(torch.ones(T, T, device=Q.device, dtype=torch.bool), 1)
        scores = scores.masked_fill(mask, float("-inf"))
    weights = F.softmax(scores, dim=-1)
    return weights @ V, weights`,
        terms: [
          { id: 'q', label: String.raw`Query $\mathbf{Q}$`, role: 'data', shape: '(B, H, T, d_k)', explanation: '每个头独立的查询子空间投影。', numpyLines: [4], pytorchLines: [6] },
          { id: 'k', label: String.raw`Key $\mathbf{K}$`, role: 'data', shape: '(B, H, T, d_k)', explanation: String.raw`转置最后两维后与 $\mathbf{Q}$ 批量矩阵乘。`, numpyLines: [4], pytorchLines: [6] },
          { id: 'qk', label: String.raw`相似度矩阵 $\mathbf{Q}\mathbf{K}^\top$`, role: 'output', shape: '(B, H, T, T)', explanation: String.raw`$\mathcal{O}(T^2)$ 显存与计算瓶颈，FlashAttention 正是优化这一步的 HBM 访存。`, numpyLines: [4], pytorchLines: [6] },
          { id: 'sc', label: String.raw`缩放 $\div \sqrt{d_k}$`, role: 'hyper', shape: 'scalar', explanation: String.raw`保持点积方差为 $1$，防 Softmax 饱和。`, numpyLines: [4], pytorchLines: [6] },
          { id: 'm', label: String.raw`Causal Mask $\mathbf{M}$`, role: 'loss', shape: '(T, T)', explanation: String.raw`在 Softmax 之前加上 $-\infty$（绝不能在 Softmax 之后乘 $0$，否则行和不再等于 $1$！）。`, numpyLines: [5, 6, 7], pytorchLines: [7, 8, 9, 10] },
          { id: 'v', label: String.raw`加权聚合 $\mathbf{V}$`, role: 'data', shape: '(B, H, T, d_v)', explanation: '按注意力概率融合所有可见位置的语义值。', numpyLines: [9, 10], pytorchLines: [11, 12] },
        ],
      },
    ],
    pitfalls: [
      {
        title: String.raw`为什么必须在 Softmax 之前加 $-\infty$ 掩码，而不是之后置 $0$？（HA07 经典坑）`,
        detail: String.raw`若在 Softmax 之后把未来位置乘 $0$，过去位置的概率之和会严格小于 $1$ 且未来词的分母 $e^{s_{\text{future}}}$ 已经污染了过去词的权重归一化！在 Softmax 之前加 $-\infty$ 才能保证 $\exp(-\infty) = 0$ 且剩余过去权重精确归一化为 $1$。`,
      },
      {
        title: String.raw`为什么 BERT MLM 不把选中的 $15\%$ 全部换成 ` + '`[MASK]`' + '？',
        detail: String.raw`下游微调与真实推理输入里根本不存在 ` + '`[MASK]`' + String.raw` 符号。若 $100\%$ 替换，模型只会针对 ` + '`[MASK]`' + String.raw` 位置输出精准上下文表征；保留 $10\%$ 原词 $+ 10\%$ 随机词迫使模型对序列中每一个普通词都维持高质量双向上下文建模。`,
      },
    ],
  },
  {
    id: 'l09',
    code: 'L09',
    partGroup: 'Part III · Transformers, Generative Models & RL',
    slug: 'l09-vit-clip',
    titleZh: '视觉 Transformer (ViT) 与图文对比预训练 (CLIP)',
    titleEn: 'Vision Transformers (ViT) & Contrastive Language-Image Pretraining',
    abstract:
      '剖析 ViT 如何将二维图像切分为 Patch 序列接入标准 Transformer Encoder，从归纳偏置（Inductive Bias）视角深度对比 ViT 与 CNN 的优劣边界；并推导 CLIP 对称 InfoNCE 对比损失如何赋予模型 Zero-Shot 泛化与抗分布偏移能力。',
    readingChecklist: [
      String.raw`ViT Patchify 切分：$(H \times W \times C) \to N = HW / P^2$ 个展平向量 → Linear 投影 + ` + '`[CLS]`' + ' + 位置嵌入',
      'ViT vs CNN 归纳偏置、数据效率、全局感受野与 Scaling 对比（WA3 Q7a）',
      String.raw`CLIP 双塔结构与对称 InfoNCE 对比损失（$B$ 个正对 vs $B^2 - B$ 个批内负对，WA3 Q7b）`,
      'CLIP Zero-Shot Prompt 分类流程与分布偏移鲁棒性',
      '何时必须使用 Linear Probing 替代 Zero-Shot 及具体冻结训练方法（HA08）',
    ],
    verifierId: 'l09-vit-clip',
    derivations: [
      {
        id: 'd-l09-clip',
        title: '从互信息下界理解 CLIP 对称 InfoNCE 对比损失',
        goal: String.raw`给定一个 Batch 的 $B$ 对匹配图文 $(I_i, T_i)$，写出经过 $L_2$ 归一化与温度 $\tau$ 缩放后的双向交叉熵损失。`,
        steps: [
          {
            rule: String.raw`$L_2$ Hypersphere Projection`,
            latex: String.raw`\hat{\mathbf{I}}_i = \frac{f_{\text{img}}(I_i)}{\|f_{\text{img}}(I_i)\|_2}, \quad \hat{\mathbf{T}}_j = \frac{f_{\text{txt}}(T_j)}{\|f_{\text{txt}}(T_j)\|_2}, \quad S_{ij} = \frac{\hat{\mathbf{I}}_i^\top \hat{\mathbf{T}}_j}{\tau}`,
            justification: String.raw`把图像与文本表征全部投影到单位超球面，内积严格等于余弦相似度 $\in [-1, 1]$；除以可学习温度 $\tau$（约 $0.07$）放大 logit 对比度。`,
          },
          {
            rule: 'Symmetric Image-to-Text & Text-to-Image CE',
            latex: String.raw`\mathcal{L}_{\text{img}} = -\frac{1}{B}\sum_{i=1}^B \log\frac{\exp(S_{ii})}{\sum_{j=1}^B \exp(S_{ij})}, \qquad \mathcal{L}_{\text{txt}} = -\frac{1}{B}\sum_{j=1}^B \log\frac{\exp(S_{jj})}{\sum_{i=1}^B \exp(S_{ij})}`,
            justification: String.raw`按行做 $B$ 类分类（给第 $i$ 张图从 $B$ 句文本中选出真配对 $i$），按列做 $B$ 类分类（给第 $j$ 句文本从 $B$ 张图中选出真配对 $j$）。`,
          },
          {
            rule: 'Total Contrastive Objective',
            latex: String.raw`\mathcal{L}_{\text{CLIP}} = \frac{1}{2}\big(\mathcal{L}_{\text{img}} + \mathcal{L}_{\text{txt}}\big)`,
            justification: String.raw`CLIP 需要极大 Batch Size（原论文 $B = 32{,}768$），因为负样本全部来自同一 Batch 内的错配对，Batch 越大对比界越紧、表征越均匀！`,
          },
        ],
        conclusion: '训练结束后，CLIP 将自然语言作为开放式监督接口，任何新类别只需写成 Prompt 文本即可完成 Zero-Shot 推理。',
      },
    ],
    concepts: [
      {
        heading: 'ViT vs CNN 深度对比（WA3 Q7a 标准答题框架）',
        body: '两种架构的核心分水岭在于「内置先验（Inductive Bias）」与「数据规模」的权衡：',
        table: {
          headers: ['比较维度', 'CNN (ResNet / ConvNeXt)', 'Vision Transformer (ViT)'],
          rows: [
            ['空间归纳偏置', '强：硬编码局部邻域连接与平移等变性', '极弱：除 Patch 切分外完全靠数据自发学习空间关系'],
            ['小/中数据集表现', '明显占优（强先验充当隐式正则防过拟合）', '容易过拟合，从零训练需千万级以上图像（如 JFT-300M）'],
            ['感受野与长程建模', '浅层只能看局部，依赖深层堆叠扩大感受野', String.raw`第 $1$ 层 Self-Attention 即具备全图全局交互能力`],
            ['计算扩展性', '随算力增大收益渐趋饱和', '高度契合 Scaling Laws，天然统一图文多模态架构'],
          ],
        },
      },
      {
        heading: 'CLIP 的 Zero-Shot 分类 vs Linear Probing（WA3 Q7b）',
        body: 'Zero-Shot 在通用自然图像（及素描/卡通等分布偏移测试集）上表现惊人，但在以下场景存在瓶颈：',
        points: [
          '何时需要 Linear Probing？① 细粒度或专业领域（医学影像、卫星遥感、工业零件缺陷、手写数字计数），自然语言 Prompt 难以准确描述视觉差异；② 已有少量带标注下游数据集且追求更高分类精度。',
          String.raw`Linear Probing 做法：冻结预训练 CLIP 图像编码器权重，提取所有训练图像的固定特征向量 $f_{\text{img}}(\mathbf{x}) \in \mathbb{R}^D$，在其上仅训练一层线性分类器（Logistic / Softmax Regression），训练极快且不易破坏预训练通用表征！`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l09-clip',
        title: 'CLIP 对称对比损失与 Zero-Shot 推理代码',
        subtitle: '对应 HA08 实战：归一化 → 余弦矩阵 → 对角线交叉熵',
        latex: String.raw`\htmlClass{formula-token formula-token-output token-s}{\mathbf{S}} = \exp(\htmlClass{formula-token formula-token-hyper token-ls}{\text{logit\_scale}})\,\htmlClass{formula-token formula-token-data token-it}{\hat{\mathbf{I}}\hat{\mathbf{T}}^\top}, \qquad \htmlClass{formula-token formula-token-loss token-l}{\mathcal{L}} = \frac{1}{2}\big[\text{CE}(\mathbf{S}, \mathbf{y}) + \text{CE}(\mathbf{S}^\top, \mathbf{y})\big]`,
        numpyCode: `def clip_symmetric_loss(I_emb, T_emb, logit_scale=np.log(1/0.07)):
    I_hat = I_emb / np.linalg.norm(I_emb, axis=-1, keepdims=True)
    T_hat = T_emb / np.linalg.norm(T_emb, axis=-1, keepdims=True)
    logits = np.exp(logit_scale) * (I_hat @ T_hat.T)       # (B, B)
    idx = np.arange(len(I_emb))
    def ce(M):
        M = M - M.max(axis=1, keepdims=True)
        lp = M - np.log(np.exp(M).sum(axis=1, keepdims=True))
        return -np.mean(lp[idx, idx])
    return 0.5 * (ce(logits) + ce(logits.T))`,
        pytorchCode: `import torch, torch.nn.functional as F

def clip_loss_torch(I_emb, T_emb, logit_scale):
    I_hat = F.normalize(I_emb, dim=-1)
    T_hat = F.normalize(T_emb, dim=-1)
    logits = logit_scale.exp().clamp(max=100.0) * (I_hat @ T_hat.T)
    labels = torch.arange(len(I_emb), device=I_emb.device)
    return 0.5 * (F.cross_entropy(logits, labels) + F.cross_entropy(logits.T, labels))`,
        terms: [
          { id: 'it', label: String.raw`单位球余弦矩阵 $\hat{\mathbf{I}}\hat{\mathbf{T}}^\top$`, role: 'data', shape: '(B, B)', explanation: String.raw`行/列 $L_2$ 归一化消除向量模长干扰。`, numpyLines: [2, 3, 4], pytorchLines: [4, 5, 6] },
          { id: 'ls', label: String.raw`$\exp(\text{logit\_scale}) = 1/\tau$`, role: 'hyper', shape: 'scalar (≤100)', explanation: String.raw`CLIP 把 $1/\tau$ 参数化为可学习对数标量，并 ` + '`clamp`' + String.raw` 上限 $100$ 防止训练不稳定。`, numpyLines: [4], pytorchLines: [6] },
          { id: 's', label: String.raw`缩放相似度矩阵 $\mathbf{S}$`, role: 'output', shape: '(B, B)', explanation: String.raw`对角线是真配对，非对角线是 $B^2 - B$ 个负样本。`, numpyLines: [4], pytorchLines: [6] },
          { id: 'l', label: '双向对称交叉熵', role: 'loss', shape: 'scalar', explanation: '同时优化以图搜文和以文搜图两个方向。', numpyLines: [5, 6, 7, 8, 9, 10], pytorchLines: [7, 8] },
        ],
      },
    ],
    pitfalls: [
      {
        title: String.raw`ViT 计算量对 Patch Size $P$ 的四次方敏感性`,
        detail: String.raw`若把 Patch Size 从 $16$ 减半为 $8$，Patch 数量 $N$ 变为 $4$ 倍，而 Self-Attention 矩阵 $N \times N$ 暴增为 $16$ 倍！这是高分辨率视觉模型必须采用窗口注意力或更大 Patch 的原因。`,
      },
    ],
  },
  {
    id: 'l10',
    code: 'L10',
    partGroup: 'Part III · Transformers, Generative Models & RL',
    slug: 'l10-generative-models',
    titleZh: '深度生成模型：VAE、GAN、Diffusion 与 Flow Matching',
    titleEn: 'VAE (ELBO), GAN (JSD), DDPM Diffusion & Flow Matching',
    abstract: String.raw`完整推导现代图像生成四大基石的底层数学：VAE 变分下界 ELBO 与重参数化；GAN 最优判别器 $D^*(x) \to \text{JSD}$ 证明及非饱和损失动机；DDPM 闭式前向加噪、反向采样公式与 CFG；以及新一代 Flow Matching 直线条件速度场推导（直击 WA4 全部 $4$ 道大题）。`,
    readingChecklist: [
      String.raw`VAE 精确恒等式 $\log p(\mathbf{x}) = \text{ELBO} + D_{\text{KL}}(q(\mathbf{z}|\mathbf{x}) \| p(\mathbf{z}|\mathbf{x}))$ 与第一项为何等于重建误差（WA4 Q1）`,
      String.raw`Reparameterization Trick $\mathbf{z} = \boldsymbol{\mu} + \boldsymbol{\sigma} \odot \boldsymbol{\varepsilon}$ 恢复随机节点梯度流`,
      String.raw`GAN 最优判别器 $D^*(x)$、JSD 等价证明与 $L_1 = -\log D$ vs $L_2 = \log(1-D)$ 梯度危机（WA4 Q2）`,
      'DDPM 一步闭式加噪、简化噪声回归损失与完整反向采样公式逐项含义（WA4 Q3）',
      String.raw`Flow Matching 期望参数、插值状态 $\mathbf{x}_t$、速度场 $\mathbf{v}_\theta(\mathbf{x}_t, t)$ 与常速度目标 $\mathbf{x}_1 - \mathbf{x}_0$（WA4 Q4）`,
    ],
    verifierId: 'l10-gen-models',
    derivations: [
      {
        id: 'd-l10-vae',
        title: '零跳步推导 VAE 的 Evidence Lower Bound (ELBO) 精确恒等式',
        goal: String.raw`证明为何直接最大化不可解的边际似然 $\log p_\theta(\mathbf{x})$ 可转化为最大化 $\text{ELBO} = \mathbb{E}_{q_\phi}[\log p_\theta(\mathbf{x}\mid \mathbf{z})] - D_{\text{KL}}\!\big(q_\phi(\mathbf{z}\mid \mathbf{x}) \,\|\, p(\mathbf{z})\big)$。`,
        steps: [
          {
            rule: String.raw`Multiply by $q_\phi(\mathbf{z}|\mathbf{x})$ & Apply Bayes Rule`,
            latex: String.raw`\log p_\theta(\mathbf{x}) = \mathbb{E}_{\mathbf{z}\sim q_\phi(\mathbf{z}|\mathbf{x})}\!\left[\log \frac{p_\theta(\mathbf{x}, \mathbf{z})}{p_\theta(\mathbf{z}\mid \mathbf{x})}\right] = \mathbb{E}_{q_\phi}\!\left[\log \frac{p_\theta(\mathbf{x}, \mathbf{z})}{q_\phi(\mathbf{z}|\mathbf{x})} \cdot \frac{q_\phi(\mathbf{z}|\mathbf{x})}{p_\theta(\mathbf{z}|\mathbf{x})}\right]`,
            justification: String.raw`因为 $\log p_\theta(\mathbf{x})$ 与 $\mathbf{z}$ 无关，可写成关于任意近似后验 $q_\phi(\mathbf{z}\mid \mathbf{x})$ 的期望；随后分子分母同乘 $q_\phi(\mathbf{z}\mid \mathbf{x})$。`,
          },
          {
            rule: 'Split into ELBO + Posterior KL Gap',
            latex: String.raw`\log p_\theta(\mathbf{x}) = \underbrace{\mathbb{E}_{q_\phi}\!\big[\log p_\theta(\mathbf{x}\mid\mathbf{z})\big] - D_{\text{KL}}\!\big(q_\phi(\mathbf{z}|\mathbf{x})\,\|\,p(\mathbf{z})\big)}_{\text{ELBO}(\theta, \phi)} + \underbrace{D_{\text{KL}}\!\big(q_\phi(\mathbf{z}|\mathbf{x})\,\|\,p_\theta(\mathbf{z}|\mathbf{x})\big)}_{\ge\, 0}`,
            justification: String.raw`把 $p_\theta(\mathbf{x}, \mathbf{z})$ 拆为 $p_\theta(\mathbf{x}\mid \mathbf{z})p(\mathbf{z})$。由于最后一项 KL 散度恒非负，ELBO 严格是 $\log p_\theta(\mathbf{x})$ 的下界！且最大化 ELBO 同时在拉高数据似然并逼迫近似后验 $q_\phi$ 贴近真实后验 $p_\theta(\mathbf{z}\mid \mathbf{x})$。`,
          },
          {
            rule: 'Gaussian Decoder ⇒ Reconstruction MSE',
            latex: String.raw`p_\theta(\mathbf{x}\mid\mathbf{z}) = \mathcal{N}\!\big(\mathbf{x};\, f_\theta(\mathbf{z}), \sigma^2 \mathbf{I}\big) \implies \log p_\theta(\mathbf{x}\mid\mathbf{z}) = -\frac{1}{2\sigma^2}\|\mathbf{x} - f_\theta(\mathbf{z})\|^2 + \text{const}`,
            justification: '这就是 WA4 Q1 的精确解答：第一项条件对数似然在高斯解码假设下等价于负均方重建误差（二值像素 Bernoulli 假设下等价于负二元交叉熵）。',
          },
        ],
        conclusion: 'ELBO 无需依赖 Jensen 不等式也能直接给出精确残差项：松弛间隙恰好等于变分后验与真实后验之间的 KL 散度。',
      },
      {
        id: 'd-l10-gan',
        title: String.raw`推导 GAN 最优判别器 $D^*(x)$ 与 Jensen-Shannon 散度等价性（WA4 Q2）`,
        goal: String.raw`固定生成器分布 $p_g$，求最大化 $V(D, G)$ 的最优判别器 $D^*(x)$，并代回化简为 $\text{JSD}$。`,
        steps: [
          {
            rule: 'Pointwise Calculus Optimization',
            latex: String.raw`V(D,G) = \int \Big[p_{\text{data}}(x)\log D(x) + p_g(x)\log\big(1-D(x)\big)\Big]dx \implies \frac{d}{dD}\big[a\log D + b\log(1-D)\big] = \frac{a}{D} - \frac{b}{1-D} = 0`,
            justification: String.raw`对每个 $x$ 逐点求导：令 $f(D) = a\log D + b\log(1-D)$ 导数为 $0$，立刻解得唯一极大值点 $D^* = \frac{a}{a + b}$。`,
          },
          {
            rule: String.raw`Optimal Discriminator $D^*(x)$`,
            latex: String.raw`D^*(x) = \frac{p_{\text{data}}(x)}{p_{\text{data}}(x) + p_g(x)}`,
            justification: String.raw`当生成分布完美匹配真实分布 $p_g = p_{\text{data}}$ 时，最优判别器处处恒为 $\frac{1}{2}$（彻底无法分辨真假）。`,
          },
          {
            rule: 'Substitute Back to Derive JSD',
            latex: String.raw`V(D^*, G) = \mathbb{E}_{p_{\text{data}}}\!\left[\log\frac{p_{\text{data}}}{2M}\right] + \mathbb{E}_{p_g}\!\left[\log\frac{p_g}{2M}\right] = -\log 4 + 2\,\text{JSD}(p_{\text{data}}\,\|\,p_g), \quad M = \frac{p_{\text{data}}+p_g}{2}`,
            justification: String.raw`把分母写成 $2M$ 并拆出 $-\log 2 - \log 2 = -\log 4$，剩余两项恰好是定义式 $D_{\text{KL}}(p_{\text{data}} \| M) + D_{\text{KL}}(p_g \| M) = 2\,\text{JSD}$！`,
          },
        ],
        conclusion: String.raw`因此原始饱和目标 $L_2 = \log(1 - D(G(\mathbf{z})))$ 严格对应最小化 JSD，但初期 $D \approx 0$ 时梯度饱和；工程改用非饱和损失 $L_1 = -\log D(G(\mathbf{z}))$ 换取初期强劲梯度。`,
      },
      {
        id: 'd-l10-ddpm',
        title: String.raw`推导 DDPM 一步闭式前向加噪公式（跳过中间 $t-1$ 步）`,
        goal: String.raw`已知单步转移 $\mathbf{x}_t = \sqrt{\alpha_t}\,\mathbf{x}_{t-1} + \sqrt{1-\alpha_t}\,\boldsymbol{\varepsilon}_{t-1}$（$\alpha_t = 1 - \beta_t$），推导直接由 $\mathbf{x}_0$ 采样 $\mathbf{x}_t$ 的闭式公式。`,
        steps: [
          {
            rule: String.raw`Substitute $\mathbf{x}_{t-1}$ Recursively`,
            latex: String.raw`\mathbf{x}_t = \sqrt{\alpha_t}\Big(\sqrt{\alpha_{t-1}}\mathbf{x}_{t-2} + \sqrt{1-\alpha_{t-1}}\boldsymbol{\epsilon}_{t-2}\Big) + \sqrt{1-\alpha_t}\boldsymbol{\epsilon}_{t-1}`,
            justification: '把上一步重参数化表达式直接代入。',
          },
          {
            rule: 'Sum of Independent Gaussians',
            latex: String.raw`\sqrt{\alpha_t(1-\alpha_{t-1})}\,\boldsymbol{\epsilon}_{t-2} + \sqrt{1-\alpha_t}\,\boldsymbol{\epsilon}_{t-1} \sim \mathcal{N}\!\Big(\mathbf{0},\; \big[\alpha_t(1-\alpha_{t-1}) + (1-\alpha_t)\big]\mathbf{I}\Big) = \mathcal{N}\!\big(\mathbf{0},\; (1-\alpha_t\alpha_{t-1})\mathbf{I}\big)`,
            justification: String.raw`两个独立高斯之和仍为高斯，方差直接相加：$\alpha_t - \alpha_t \alpha_{t-1} + 1 - \alpha_t = 1 - \alpha_t \alpha_{t-1}$，中间项 $\alpha_t$ 精确抵消！`,
          },
          {
            rule: String.raw`Induction to $t = 0$`,
            latex: String.raw`\mathbf{x}_t = \sqrt{\bar{\alpha}_t}\,\mathbf{x}_0 + \sqrt{1-\bar{\alpha}_t}\,\boldsymbol{\epsilon}, \qquad \bar{\alpha}_t \equiv \prod_{s=1}^t \alpha_s`,
            justification: String.raw`数学归纳展开至 $t=0$ 即得一步前向公式！因此训练每个 Batch 时只需随机采 $t$ 并一次加噪即可计算 $\|\boldsymbol{\varepsilon} - \boldsymbol{\varepsilon}_\theta(\mathbf{x}_t, t)\|^2$。`,
          },
        ],
        conclusion: String.raw`结合反向单步采样 $\mathbf{x}_{t-1} = \frac{1}{\sqrt{\alpha_t}}\!\left(\mathbf{x}_t - \frac{1-\alpha_t}{\sqrt{1-\bar{\alpha}_t}}\boldsymbol{\varepsilon}_\theta(\mathbf{x}_t, t)\right) + \sigma_t \mathbf{z}$ 与 Flow Matching 直线速度场 $\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\mathbf{x}_1$，便打通了整个现代图像生成谱系。`,
      },
    ],
    concepts: [
      {
        heading: 'VAE vs GAN vs DDPM vs Flow Matching 横向总览',
        body: '四类主流生成模型在训练稳定性、似然评估与采样速度上的核心权衡：',
        table: {
          headers: ['模型', '核心优化目标', '主要优势', '核心局限'],
          rows: [
            ['VAE', String.raw`最大化 $\text{ELBO} = \text{Recon} - \text{KL}$`, '训练极稳、显式平滑潜空间、推理单步', '高斯重建假设导致图像偏模糊'],
            ['GAN', 'Min-Max 博弈 (JSD / Wasserstein)', '单步生成极其锐利高清', '训练不稳定、易 Mode Collapse、无显式密度'],
            ['DDPM / LDM', String.raw`MSE 噪声预测 $\|\boldsymbol{\varepsilon} - \boldsymbol{\varepsilon}_\theta\|^2$`, '最高多样性与保真度、训练稳定不崩塌', '反向多步迭代采样慢（需 DDIM / 潜空间加速）'],
            ['Flow Matching', String.raw`MSE 直线速度场 $\|\mathbf{v}_\theta - (\mathbf{x}_1 - \mathbf{x}_0)\|^2$`, '路径笔直，极少 ODE 步数即可高精度生成', '需高质量速度场架构（如 DiT / SD3 / Flux）'],
          ],
        },
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l10-flow',
        title: 'DDPM 噪声预测 vs Flow Matching 速度场训练步骤',
        subtitle: '对比两种最前沿扩散/流模型的核心训练代码，几乎同样简洁！',
        latex: String.raw`\text{Flow Matching: } \htmlClass{formula-token formula-token-output token-xt}{\mathbf{x}_t} = (1-\htmlClass{formula-token formula-token-hyper token-t}{t})\htmlClass{formula-token formula-token-data token-x0}{\mathbf{x}_0} + t\htmlClass{formula-token formula-token-data token-x1}{\mathbf{x}_1}, \quad \htmlClass{formula-token formula-token-loss token-loss}{\mathcal{L}_{\text{FM}}} = \mathbb{E}\!\Big[\big\|\htmlClass{formula-token formula-token-param token-v}{\mathbf{v}_\theta(\mathbf{x}_t, t)} - (\mathbf{x}_1 - \mathbf{x}_0)\big\|^2\Big]`,
        numpyCode: `def flow_matching_step(x1, vel_net):
    B = x1.shape[0]
    t = np.random.uniform(0.0, 1.0, size=(B, 1))
    x0 = np.random.randn(*x1.shape)                # 纯高斯起点
    x_t = (1.0 - t) * x0 + t * x1                  # 线性插值态
    target_v = x1 - x0                             # 直线真速度 dx_t/dt
    pred_v = vel_net(x_t, t)
    return np.mean((pred_v - target_v) ** 2)`,
        pytorchCode: `import torch, torch.nn.functional as F

def flow_matching_loss(model, x1):
    t = torch.rand(x1.size(0), 1, 1, 1, device=x1.device)
    x0 = torch.randn_like(x1)
    x_t = (1.0 - t) * x0 + t * x1
    target_v = x1 - x0
    return F.mse_loss(model(x_t, t.squeeze()), target_v)`,
        terms: [
          { id: 't', label: String.raw`$t \sim \mathcal{U}(0, 1)$`, role: 'hyper', shape: '(B, 1)', explanation: '均匀采样的连续演进时刻。', numpyLines: [3], pytorchLines: [4] },
          { id: 'x0', label: String.raw`噪声起点 $\mathbf{x}_0 \sim p_0$`, role: 'data', shape: '(B, C, H, W)', explanation: '简单先验分布标准高斯采样。', numpyLines: [4], pytorchLines: [5] },
          { id: 'x1', label: String.raw`目标样本 $\mathbf{x}_1 \sim p_1$`, role: 'data', shape: '(B, C, H, W)', explanation: '真实数据分布样本。', numpyLines: [5, 6], pytorchLines: [6, 7] },
          { id: 'xt', label: String.raw`插值状态 $\mathbf{x}_t$`, role: 'output', shape: '(B, C, H, W)', explanation: '连接噪声与数据的直线上中间点。', numpyLines: [5], pytorchLines: [6] },
          { id: 'v', label: String.raw`速度场网络 $\mathbf{v}_\theta(\mathbf{x}_t, t)$`, role: 'param', shape: '(B, C, H, W)', explanation: '学习边际概率流的瞬时速度方向。', numpyLines: [7], pytorchLines: [8] },
          { id: 'loss', label: '条件速度 MSE 损失', role: 'loss', shape: 'scalar', explanation: String.raw`推理时从 $t=0$ 到 $t=1$ 做少量 Euler 步 $\mathbf{x} \leftarrow \mathbf{x} + \Delta t \cdot \mathbf{v}_\theta$ 即可生成样本。`, numpyLines: [6, 8], pytorchLines: [7, 8] },
        ],
      },
    ],
    pitfalls: [
      {
        title: String.raw`DDPM 反向采样最后一步 ($t = 1 \to 0$) 不加随机噪声 $\sigma_t \mathbf{z}$`,
        detail: String.raw`在 $t > 1$ 的中间去噪步加入 $\sigma_t \mathbf{z}$ 维持采样多样性；但最后一步输出最终图像 $\mathbf{x}_0$ 时令 $\mathbf{z} = \mathbf{0}$，避免把额外高斯噪点直接印在成图表面。`,
      },
    ],
  },
  {
    id: 'l11',
    code: 'L11',
    partGroup: 'Part III · Transformers, Generative Models & RL',
    slug: 'l11-reinforcement-learning',
    titleZh: '强化学习：MDP、Q-Learning / DQN、Policy Gradient 与 PPO',
    titleEn: 'MDP, Bellman Equations, DQN, Policy Gradient, A2C & PPO/RLHF',
    abstract:
      '系统打通值函数与策略梯度两大强化学习范式：从 Bellman 期望/最优方程到 Model-Free 时序差分（On-Policy SARSA vs Off-Policy Q-Learning）与 DQN 稳定性技巧；严格证明 Policy Gradient Theorem（Log-Derivative Trick 消去未知环境动力学）以及 Baseline 无偏降方差原理，直至驱动现代 RLHF 的 PPO 裁剪目标。',
    readingChecklist: [
      String.raw`MDP 五元组 $\langle \mathcal{S}, \mathcal{A}, P, R, \gamma \rangle$、折扣回报 $G_t$、$V^\pi(s)$ 与 $Q^\pi(s, a)$`,
      'Bellman 期望方程 vs Bellman 最优方程；Policy Iteration vs Value Iteration',
      'Model-Free TD 更新：SARSA (On-Policy) vs Q-Learning (Off-Policy)',
      'DQN 两大支柱（Experience Replay + Target Network）与 Double / Dueling DQN',
      'Policy Gradient Theorem 推导（Log-Derivative Trick）与 Baseline 无偏降方差证明',
      'Advantage Actor-Critic (A2C)、PPO Clipped Surrogate Objective 与 RLHF / DPO',
    ],
    verifierId: 'l11-rl-bellman-ppo',
    derivations: [
      {
        id: 'd-l11-pg',
        title: String.raw`零跳步证明 Policy Gradient Theorem（为何无需知道环境转移模型 $P$？）`,
        goal: String.raw`最大化轨迹期望回报 $J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[R(\tau)]$，利用 Log-Derivative Trick 导出完全 Model-Free 的梯度估计公式，并证明减去状态 Baseline $b(s)$ 严格保持无偏。`,
        steps: [
          {
            rule: 'Log-Derivative Trick',
            latex: String.raw`\nabla_\theta J(\theta) = \int R(\tau)\,\nabla_\theta p_\theta(\tau)\,d\tau = \int R(\tau)\,p_\theta(\tau)\,\nabla_\theta \log p_\theta(\tau)\,d\tau = \mathbb{E}_{\tau\sim\pi_\theta}\!\big[R(\tau)\,\nabla_\theta \log p_\theta(\tau)\big]`,
            justification: String.raw`利用恒等式 $\nabla p = p \cdot \nabla \log p$，把求导从概率密度里“搬到”对数内部，从而重新变成关于 $p_\theta(\tau)$ 的期望（可直接用采样轨迹的蒙特卡洛均值估计！）。`,
          },
          {
            rule: String.raw`Trajectory Factorization Eliminates Environment $P$`,
            latex: String.raw`\log p_\theta(\tau) = \underbrace{\log \mu_0(s_0) + \sum_{t=0}^{T-1} \log P(s_{t+1}\mid s_t, a_t)}_{\text{不含 }\theta \implies \nabla_\theta = 0} + \sum_{t=0}^{T-1} \log \pi_\theta(a_t \mid s_t)`,
            justification: String.raw`最惊艳的一步：初始分布 $\mu_0$ 和环境动力学 $P(s' \mid s, a)$ 全与策略参数 $\theta$ 无关！取梯度后全部归零，因此 Policy Gradient 彻底摆脱了对环境模型的依赖！`,
          },
          {
            rule: String.raw`Unbiasedness of State-Dependent Baseline $b(s)$`,
            latex: String.raw`\mathbb{E}_{a\sim \pi_\theta}\!\big[b(s)\,\nabla_\theta \log \pi_\theta(a|s)\big] = b(s)\sum_a \pi_\theta(a|s)\frac{\nabla_\theta \pi_\theta(a|s)}{\pi_\theta(a|s)} = b(s)\,\nabla_\theta \underbrace{\sum_a \pi_\theta(a|s)}_{=\,1} = 0`,
            justification: String.raw`只要 Baseline $b(s)$ 不依赖动作 $a$，它乘以策略得分函数的期望严格等于 $0$！因此用优势函数 $\hat{A}_t = Q(s, a) - V(s)$ 替换总回报 $R$ 绝不引入偏差，却能大幅削减采样方差！`,
          },
        ],
        conclusion: '这三步直接奠定了 REINFORCE、A2C、PPO 以及大模型 RLHF 对齐的完整理论基石。',
      },
    ],
    concepts: [
      {
        heading: 'RL 算法演进全景谱系（核心算法横向对照）',
        body: '理解每个算法究竟是在解决前一代算法的哪一个痛点：',
        table: {
          headers: ['算法', '类别', '核心机制', '解决的痛点'],
          rows: [
            ['Value Iteration', 'Model-Based DP', String.raw`已知 $P, R$，同步迭代 Bellman 最优方程`, '小规模已知环境的精确最优求解'],
            ['Q-Learning', 'Model-Free Off-Policy', String.raw`$\text{TD Target} = r + \gamma \max_{a'} Q(s', a')$`, '摆脱环境模型依赖，可离线复用探索数据'],
            ['DQN', 'Value-Based Deep RL', String.raw`神经网络 $Q_\theta$ + Replay Buffer + Target Net`, '突破表格维度灾难，打破样本自相关与目标漂移'],
            ['REINFORCE / A2C', 'Policy / Actor-Critic', String.raw`$\nabla \log \pi_\theta \cdot \hat{A}_t$（Critic 估值降方差）`, '支持连续动作空间与随机策略，显著降低 MC 方差'],
            ['PPO / RLHF', 'Trust-Region Policy', String.raw`$\min\!\big(r_t \hat{A}_t,\, \operatorname{clip}(r_t, 1\pm\epsilon)\hat{A}_t\big) + \text{KL}$ 惩罚`, '防止单步更新过大拉崩策略，实现稳定 LLM 对齐'],
          ],
        },
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l11-ppo',
        title: 'PPO Clipped Surrogate Objective + 价值函数损失',
        subtitle: '对应 HA12 核心：重要性采样比、悲观下界裁剪与优势函数',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-obj}{L^{\text{CLIP}}(\theta)} = \mathbb{E}_t\Big[\min\big(\htmlClass{formula-token formula-token-output token-r}{r_t(\theta)}\,\htmlClass{formula-token formula-token-data token-a}{\hat{A}_t},\; \htmlClass{formula-token formula-token-hyper token-c}{\text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)}\,\hat{A}_t\big)\Big]`,
        numpyCode: `def ppo_clip_loss(logp_new, logp_old, adv, eps=0.2):
    # 对数差取指数算概率比 r_t = pi_new / pi_old，数值最稳定
    ratio = np.exp(logp_new - logp_old)
    surr1 = ratio * adv
    surr2 = np.clip(ratio, 1.0 - eps, 1.0 + eps) * adv
    # 优化器做梯度下降，因此对需要最大化的目标取负号
    return -np.mean(np.minimum(surr1, surr2))`,
        pytorchCode: `import torch

def ppo_clip_loss_torch(logp_new, logp_old, adv, eps=0.2):
    ratio = (logp_new - logp_old).exp()
    surr1 = ratio * adv
    surr2 = torch.clamp(ratio, 1.0 - eps, 1.0 + eps) * adv
    return -torch.min(surr1, surr2).mean()`,
        terms: [
          { id: 'r', label: String.raw`概率比 $r_t(\theta)$`, role: 'output', shape: '(B,)', explanation: '衡量新策略相对旧采样策略在该动作上的概率变化倍数。', numpyLines: [3], pytorchLines: [4] },
          { id: 'a', label: String.raw`优势估计 $\hat{A}_t$`, role: 'data', shape: '(B,)', explanation: '常用 GAE 计算并做 batch 标准化，正值鼓励该动作，负值抑制该动作。', numpyLines: [4, 5], pytorchLines: [5, 6] },
          { id: 'c', label: String.raw`裁剪信赖域 $[1-\epsilon, 1+\epsilon]$`, role: 'hyper', shape: 'ε ≈ 0.2', explanation: String.raw`禁止新策略在单轮更新中偏离旧策略超过 $\pm 20\%$。`, numpyLines: [5], pytorchLines: [6] },
          { id: 'obj', label: '悲观下界目标', role: 'loss', shape: 'scalar', explanation: String.raw`取 $\min$ 保证仅截断过度激进的同向激励，而把好动作改差时仍保留纠偏梯度。`, numpyLines: [7], pytorchLines: [7] },
        ],
      },
    ],
    pitfalls: [
      {
        title: 'DQN 中忘记对 TD Target 使用 `torch.no_grad()`',
        detail: String.raw`在计算 $\text{loss} = \text{SmoothL1}\!\big(Q_{\text{online}}(s, a),\; r + \gamma \max_{a'} Q_{\text{target}}(s', a')\big)$ 时，TD Target 必须被视为固定回归标签（` + '`no_grad`' + ' / ' + '`detach`' + String.raw`），否则反向传播会同时把目标网往在线网方向拉，破坏 Bellman 迭代动力学！`,
      },
    ],
    sandbox: {
      id: 'sb-l11',
      title: 'Pyodide 实测：Cliff Walking 中 SARSA vs Q-Learning 训练回报定量对比',
      description: String.raw`运行真实 $4 \times 12$ 悬崖行走环境，定量比较 On-Policy SARSA 与 Off-Policy Q-Learning 在训练期的回报曲线。`,
      starterCode: `import numpy as np

rng = np.random.default_rng(7)
ROWS, COLS = 4, 12
DIRS = [(-1,0), (0,1), (1,0), (0,-1)]

def step(r, c, a):
    nr = max(0, min(ROWS-1, r + DIRS[a][0]))
    nc = max(0, min(COLS-1, c + DIRS[a][1]))
    if nr == 3 and 1 <= nc <= 10:
        return 3, 0, -100.0, False
    if nr == 3 and nc == 11:
        return nr, nc, -1.0, True
    return nr, nc, -1.0, False

def choose(q, eps):
    return int(rng.integers(4)) if rng.random() < eps else int(np.argmax(q))

def run(algo, episodes=300, eps=0.1, alpha=0.5, gamma=1.0):
    Q = np.zeros((ROWS, COLS, 4))
    rets = []
    for _ in range(episodes):
        r, c, total = 3, 0, 0.0
        a = choose(Q[r, c], eps)
        for _ in range(200):
            nr, nc, rew, done = step(r, c, a)
            total += rew
            na = choose(Q[nr, nc], eps)
            target = rew + (0.0 if done else gamma * (Q[nr, nc, na] if algo == "sarsa" else np.max(Q[nr, nc])))
            Q[r, c, a] += alpha * (target - Q[r, c, a])
            r, c, a = nr, nc, na
            if done:
                break
        rets.append(total)
    # 20-episode moving average
    return np.convolve(rets, np.ones(20)/20, mode="valid")

sarsa_avg = run("sarsa")
qlearn_avg = run("qlearn")
print(f"最后 50 轮平均训练回报 -> SARSA (安全路线): {sarsa_avg[-50:].mean():.1f} | Q-Learning (贴崖路线): {qlearn_avg[-50:].mean():.1f}")
plot_series(
    "Cliff Walking (ε=0.1) 训练期 20-Episode 滑动平均回报",
    {"SARSA (On-Policy · 更稳)": sarsa_avg, "Q-Learning (Off-Policy · 偶发掉崖)": qlearn_avg},
    xlabel="Episode",
    ylabel="Avg Return"
)
`,
    },
  },
];
