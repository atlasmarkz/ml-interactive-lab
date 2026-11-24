import { LectureModule } from '../types/curriculum';

export const LECTURES_PART_3: LectureModule[] = [
  {
    id: 'l08-1',
    code: 'L08.1',
    partGroup: 'Part 3 · Advanced Deep Learning',
    slug: 'l08-1-transformer-bert',
    slides: ['l08.1.pdf', 'l08.1-postclass.pdf'],
    examWeight: 'core',
    titleZh: 'Transformer (I)：自注意力、多头注意力、编码器-解码器与 BERT',
    titleEn: 'Self-Attention, Multi-Head Attention, Encoder–Decoder Transformer & BERT',
    abstract: String.raw`Transformer 用自注意力取代 RNN 的循环结构，使序列内任意两个位置一步可达且可完全并行。本讲覆盖：单头自注意力的计算流程（$\mathbf{Q}=\mathbf{X}\mathbf{W}^Q$ 等）、为何除以 $\sqrt{d_k}$ 与 QK-Norm、多头注意力、编码器块（残差 + LayerNorm + FFN）、位置编码、解码器的因果掩码与交叉注意力，以及 BERT 的输入表示与 MLM / NSP 预训练。`,
    readingChecklist: [
      String.raw`自注意力四步：$\mathbf{Q},\mathbf{K},\mathbf{V}$ 投影 → 点积打分 → 行 softmax → 加权求和 $\mathbf{z}_i = \sum_j \alpha_{ij}\mathbf{v}_j$（WA3 Q5 手算题型）`,
      String.raw`为何除以 $\sqrt{d_k}$；QK-Norm 用 $\ell_2$ 归一化 + 可学习尺度防止 softmax 饱和`,
      String.raw`多头注意力：$h$ 个头在不同子空间并行，拼接后乘 $\mathbf{W}^O$（原论文 $d_m=512, h=8, d_v=64$）`,
      '编码器块：Multi-Head Attention + FFN，各带残差连接与 LayerNorm；NLP 为何用 LN 而非 BN；Pre-Norm vs Post-Norm',
      '位置编码：自注意力对输入顺序置换等变，必须注入位置信息（WA3 Q6）',
      '解码器：因果（masked）自注意力 + 编码器-解码器交叉注意力（Q 来自解码器，K/V 来自编码器）',
      'BERT：[CLS]/[SEP]，token + segment + position 嵌入求和；MLM 的 15% 与 80/10/10 规则；NSP',
    ],
    verifierId: 'l08-self-attention',
    figureKey: 'L08',
    derivations: [
      {
        id: 'd-l081-attn-recipe',
        title: '自注意力的手算流程（矩阵形式）',
        goal: String.raw`给定 $T$ 个输入向量组成的 $\mathbf{X}\in\mathbb{R}^{T\times d_m}$ 和参数 $\mathbf{W}^Q, \mathbf{W}^K \in \mathbb{R}^{d_m\times d_k}$、$\mathbf{W}^V\in\mathbb{R}^{d_m\times d_v}$，写出输出 $\mathbf{Z}$ 的每一步。这是 WA3 自注意力手算题的标准做法。`,
        steps: [
          {
            rule: 'Linear Projections',
            latex: String.raw`\mathbf{Q} = \mathbf{X}\mathbf{W}^Q,\quad \mathbf{K} = \mathbf{X}\mathbf{W}^K,\quad \mathbf{V} = \mathbf{X}\mathbf{W}^V \qquad (\mathbf{q}_i = \mathbf{W}^{Q\top}\mathbf{x}_i \text{ 等})`,
            justification: String.raw`每个 token 都同时扮演查询者、被查询者和信息提供者三种角色。若题目给 $\mathbf{W}=\mathbf{I}$，则 $\mathbf{q}_i=\mathbf{k}_i=\mathbf{v}_i=\mathbf{x}_i$。`,
          },
          {
            rule: 'Scores (Dot Product, optionally Scaled)',
            latex: String.raw`e_{ij} = \frac{\mathbf{q}_i^\top \mathbf{k}_j}{\sqrt{d_k}} \quad\Longleftrightarrow\quad \mathbf{E} = \frac{\mathbf{Q}\mathbf{K}^\top}{\sqrt{d_k}} \in \mathbb{R}^{T\times T}`,
            justification: '第 $i$ 行是 token $i$ 对所有 token 的打分。讲义先用未缩放点积讲概念，再引入缩放；手算时按题目给的公式来。',
          },
          {
            rule: 'Row-wise Softmax',
            latex: String.raw`\alpha_{ij} = \frac{\exp(e_{ij})}{\sum_{j'} \exp(e_{ij'})}, \qquad \sum_j \alpha_{ij} = 1`,
            justification: '每一行单独归一化。手算技巧：同一行减去最大值不改变结果；行内打分全相等时权重均匀为 $1/T$。',
          },
          {
            rule: 'Weighted Sum of Values',
            latex: String.raw`\mathbf{z}_i = \sum_{j=1}^T \alpha_{ij}\,\mathbf{v}_j \quad\Longleftrightarrow\quad \mathbf{Z} = \mathbf{A}\mathbf{V}`,
            justification: String.raw`输出是 value 的凸组合，所以每个 $\mathbf{z}_i$ 一定落在 $\{\mathbf{v}_j\}$ 的凸包内——可用来快速检查答案是否合理。`,
          },
        ],
        conclusion: String.raw`改变 $\mathbf{W}^Q$ 会改变「谁关注谁」（注意力模式），而输入向量的排列只会让输出以同样方式排列（置换等变）——这正是需要位置编码的原因。`,
      },
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
        heading: '编码器块与解码器块的组成',
        body: '记住每个子层「做什么」和「为什么这样设计」，简答题经常考。',
        table: {
          headers: ['组件', '作用', '关键细节'],
          rows: [
            ['Multi-Head Self-Attention', '在 $h$ 个子空间并行建模 token 间关系', '每头 $d_k = d_m / h$，总计算量与单头相当'],
            ['Position-wise FFN', '对每个位置独立做非线性变换', '两层全连接，中间维度通常为 $4d_m$'],
            ['Residual Connection', '梯度高速公路，便于堆深', '$\\mathbf{x} + \\text{Sublayer}(\\mathbf{x})$'],
            ['LayerNorm', '稳定每个 token 的激活尺度', 'NLP 序列长度可变、batch 统计不稳定，所以用 LN 而非 BN'],
            ['Pre-Norm vs Post-Norm', 'LN 放在子层之前还是残差相加之后', 'Pre-Norm 训练更稳定，现代 LLM 普遍采用'],
            ['Positional Encoding', '注入位置信息', '自注意力本身对顺序置换等变'],
            ['Causal (Masked) Self-Attention', '解码器只能看见当前及之前的位置', '对 $j>i$ 令 $e_{ij}=-\\infty$，softmax 后 $\\alpha_{ij}=0$'],
            ['Cross-Attention', '解码器读取编码器信息', 'Q 来自解码器，K / V 来自编码器输出'],
          ],
        },
      },
      {
        heading: 'QK-Norm：另一种防止 softmax 饱和的办法',
        body: String.raw`当 $\mathbf{q}, \mathbf{k}$ 的范数变大时，点积打分会非常大，softmax 退化成接近 one-hot，梯度消失。QK-Norm 先对每个头的 $\mathbf{q}_i, \mathbf{k}_j$ 做 $\ell_2$ 归一化，再乘一个可学习的标量 $g$：`,
        latex: String.raw`e_{ij} = g\cdot \hat{\mathbf{q}}_i^\top \hat{\mathbf{k}}_j, \qquad \hat{\mathbf{q}}_i = \frac{\mathbf{q}_i}{\|\mathbf{q}_i\|_2},\ \hat{\mathbf{k}}_j = \frac{\mathbf{k}_j}{\|\mathbf{k}_j\|_2}`,
        points: [
          String.raw`归一化后 $\hat{\mathbf{q}}^\top\hat{\mathbf{k}} \in [-1, 1]$ 是余弦相似度，打分范围由 $g$ 控制，不再随训练无界增长。`,
          String.raw`与除以 $\sqrt{d_k}$ 的思路相同：都在控制送入 softmax 的 logits 尺度。`,
        ],
      },
      {
        heading: 'BERT 的输入与预训练任务',
        body: 'BERT 是只有编码器的双向 Transformer（BASE: 12 层, d=768, 12 头, 110M；LARGE: 24 层, d=1024, 16 头, 340M）。',
        points: [
          '输入是句对 (A, B)：以 [CLS] 开头、[SEP] 分隔；每个 token 的输入 = token 嵌入 + segment 嵌入（A/B）+ 位置嵌入。',
          'MLM：随机选 15% 的 token 预测原词；被选中的 token 80% 换成 [MASK]、10% 换成随机词、10% 不变，以缓解预训练与微调之间的不匹配（微调时没有 [MASK]）。',
          'NSP：用 [CLS] 的输出向量 C 判断 B 是否紧接 A（50% 正例 / 50% 随机句）。C 并不是好的句子语义摘要，要得到句向量还需微调。',
          '总损失 = MLM 损失 + NSP 损失；下游任务在 BERT 顶部加小分类头做微调（HA06）。',
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
    id: 'l08-2',
    code: 'L08.2',
    partGroup: 'Part 3 · Advanced Deep Learning',
    slug: 'l08-2-llm-decoder-only',
    slides: ['l08.2.pdf', 'l08.2-postclass.pdf'],
    examWeight: 'core',
    titleZh: 'Transformer (II)：仅解码器模型与大语言模型 (LLM)',
    titleEn: 'Decoder-Only Transformers: LLM Training Pipeline, Prompting, RAG, LoRA, Scaling & MoE',
    abstract: String.raw`生成式 LLM 基于仅解码器 Transformer，逐 token 自回归生成。本讲按「怎么训练 → 怎么使用 → 注意什么 → 如何扩展」组织：预训练（下一个 token 预测）→ 监督微调 SFT → 对齐（Bradley–Terry 奖励模型 + RLHF/PPO，或 DPO）；上下文学习、CoT、RAG、LoRA；幻觉与越狱；Scaling Laws 与 Mixture of Experts。`,
    readingChecklist: [
      '自回归生成：计算下一个 token 的分布 → 采样（贪心 / 温度）→ 追加 → 重复直到 EOS',
      String.raw`预训练损失 $-\sum_i \log P(x_i \mid x_{i-k},\dots,x_{i-1})$，$k$ 为上下文窗口`,
      String.raw`SFT：在示范数据 $(x, y)$ 上最小化 $-\log P(y\mid x)$；为什么需要 SFT 和对齐两个阶段`,
      String.raw`奖励模型：Bradley–Terry 偏好概率 $P(y_w \succ y_l\mid x) = \sigma(r(x,y_w) - r(x,y_l))$ 与其损失`,
      'RLHF：用 PPO 最大化奖励模型给出的奖励；DPO 不做强化学习直接用偏好数据优化',
      '上下文学习（zero-/few-shot）、Chain-of-Thought、RAG（检索 → 增强 → 生成）、LoRA 低秩微调',
      '使用风险：幻觉、越狱、偏见、隐私、安全、过度依赖',
      String.raw`Scaling Laws；MoE：门控 $G(\mathbf{x}) = \mathrm{softmax}(\mathbf{W}_g\mathbf{x} + \mathbf{b}_g)$ + Top-$k$ 稀疏激活与负载均衡`,
    ],
    derivations: [
      {
        id: 'd-l082-bt',
        title: 'Bradley–Terry 奖励模型损失的推导',
        goal: String.raw`给定偏好数据 $\mathcal{D}=\{(x, y_w, y_l)\}$（$y_w$ 比 $y_l$ 更受人类偏好），推导训练奖励函数 $r(x, y)$ 的损失。`,
        steps: [
          {
            rule: 'Bradley–Terry Preference Model',
            latex: String.raw`P(y_w \succ y_l \mid x) = \frac{\exp(r(x, y_w))}{\exp(r(x, y_w)) + \exp(r(x, y_l))}`,
            justification: '把两个回答的奖励看成「得分」，偏好概率是两类 softmax。奖励越高的回答越可能被偏好。',
          },
          {
            rule: 'Divide Numerator and Denominator',
            latex: String.raw`P(y_w \succ y_l \mid x) = \frac{1}{1 + \exp\!\big(-(r(x,y_w) - r(x,y_l))\big)} = \sigma\big(r(x, y_w) - r(x, y_l)\big)`,
            justification: String.raw`分子分母同除 $\exp(r(x,y_w))$。偏好概率只依赖奖励差，因此奖励只确定到一个常数平移。`,
          },
          {
            rule: 'Maximum Likelihood ⇒ Negative Log Loss',
            latex: String.raw`\mathcal{L}(r) = -\,\mathbb{E}_{(x, y_w, y_l)\sim\mathcal{D}}\Big[\log \sigma\big(r(x, y_w) - r(x, y_l)\big)\Big]`,
            justification: '对偏好数据做最大似然，就是一个以「哪个更好」为标签的二分类交叉熵。',
          },
        ],
        conclusion: String.raw`训练好的 $r(x,y)$ 随后作为 RLHF 的奖励信号：$\max_\pi \mathbb{E}_{x\sim\mathcal{D},\,y\sim\pi(\cdot|x)}[r(x,y)]$（实践中再加对 SFT 模型的 KL 惩罚）。`,
      },
      {
        id: 'd-l082-lora',
        title: 'LoRA：为什么低秩适配能省下 99% 的可训练参数',
        goal: String.raw`对一个冻结的预训练权重 $\mathbf{W}_0 \in \mathbb{R}^{d\times k}$，只学习一个低秩增量，计算参数量。`,
        steps: [
          {
            rule: 'Low-Rank Update',
            latex: String.raw`\mathbf{W} = \mathbf{W}_0 + \Delta\mathbf{W} = \mathbf{W}_0 + \mathbf{B}\mathbf{A}, \qquad \mathbf{B}\in\mathbb{R}^{d\times r},\ \mathbf{A}\in\mathbb{R}^{r\times k},\ r \ll \min(d,k)`,
            justification: String.raw`$\mathbf{W}_0$ 冻结不更新，只训练 $\mathbf{A}, \mathbf{B}$；$\mathbf{B}$ 初始化为 $0$，所以训练开始时模型与原模型完全一致。`,
          },
          {
            rule: 'Parameter Count',
            latex: String.raw`\#\text{full} = dk, \qquad \#\text{LoRA} = r(d + k); \qquad d=k=1000,\ r=10:\ \ 10^6 \ \text{vs}\ 2\times 10^4`,
            justification: '讲义中的例子：1000×1000 的矩阵用秩 10 的适配器，可训练参数从 100 万降到 2 万（2%）。',
          },
        ],
        conclusion: '推理时可把 $\\mathbf{B}\\mathbf{A}$ 合并回 $\\mathbf{W}_0$，不增加推理延迟；不同任务只需存储各自的小适配器。',
      },
    ],
    concepts: [
      {
        heading: 'LLM 三阶段训练管线',
        body: '预训练得到的模型只会「续写」，不一定有用、也不一定安全，所以还需要 SFT 和对齐。',
        table: {
          headers: ['阶段', '数据', '损失 / 方法', '得到什么'],
          rows: [
            ['1. Pretraining', '海量无标注文本（数十亿到数万亿 token）', String.raw`下一个 token 预测 $-\log P(x_i\mid x_{<i})$`, '通用语言表示与知识，但与任务无关'],
            ['2. SFT', '人工示范 (prompt, response)', String.raw`$-\log P(y\mid x)$`, '能按指令完成任务的 SFT 模型'],
            ['3a. Reward Model', '偏好对 $(x, y_w, y_l)$', String.raw`$-\log\sigma(r(x,y_w) - r(x,y_l))$`, '给回答打分的 $r(x, y)$'],
            ['3b. RLHF', 'prompt + 策略自己生成的回答', String.raw`PPO 最大化 $\mathbb{E}[r(x,y)]$（加 KL 约束）`, '更符合人类偏好、更安全的模型'],
            ['3b′. DPO', '偏好对', '直接用偏好数据优化策略，不训练显式奖励模型、不做 RL', '效果相近、实现更简单'],
          ],
        },
      },
      {
        heading: '监督学习 vs RLHF：训练信号的本质区别',
        body: '讲义的板书对比：',
        points: [
          String.raw`SFT 是最大化观测到的回答的概率：$\max_\theta \mathbb{E}[\log P_\theta(y\mid x)]$，只会模仿给定示范。`,
          String.raw`RLHF 是让策略自己生成回答，再用奖励加权：$\max_\theta \mathbb{E}[\log \pi_\theta(y\mid x)\, r(x,y)]$——提高高奖励轨迹的概率、降低低奖励轨迹的概率，本质是试错（L16 的策略梯度）。`,
          '因此 RLHF 涉及的输出远多于前两个阶段：需要不断采样新回答。',
        ],
      },
      {
        heading: '如何使用 LLM：Prompting、RAG 与微调',
        body: '按「是否更新参数」区分：',
        table: {
          headers: ['方法', '是否更新参数', '要点'],
          rows: [
            ['Zero-shot / Few-shot (ICL)', '否', '在 prompt 中给 0 个或几个示例，模型在上下文中完成任务'],
            ['Chain-of-Thought', '否', '示例中展示推理过程，模型也会逐步推理，复杂问题准确率更高'],
            ['RAG', '否', '先检索相关文档，把内容加入 prompt，再生成；缓解知识过时与幻觉'],
            ['LoRA / Adapter', '是（少量）', '冻结原模型，只训练低秩增量或小适配器'],
            ['Full Fine-tuning', '是（全部）', '效果最好但成本最高'],
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
      {
        heading: '使用 LLM 的注意事项',
        body: '讲义列出的六类风险：',
        points: [
          '幻觉（Hallucination）：生成看似可信但错误的内容，甚至编造不存在的参考文献——务必核实。',
          '越狱（Jailbreaking）：通过角色扮演等提示绕过安全机制；需要稳健的审核与过滤。',
          '偏见与公平、数据隐私、安全风险（钓鱼、恶意代码）、过度依赖：LLM 是工具，不是唯一决策者。',
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l082-rm',
        title: 'Bradley–Terry 奖励模型损失',
        subtitle: '偏好对上的二分类交叉熵（HA12 RLHF 的奖励模型部分）',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-loss}{\mathcal{L}(r)} = -\log \sigma\big(\htmlClass{formula-token formula-token-output token-rw}{r(x, y_w)} - \htmlClass{formula-token formula-token-data token-rl}{r(x, y_l)}\big)`,
        numpyCode: `import numpy as np

def reward_model_loss(r_chosen, r_rejected):
    # r_*: (B,) scalar rewards from the reward head
    margin = r_chosen - r_rejected
    # -log(sigmoid(m)) = log(1 + exp(-m)), computed stably
    return np.mean(np.logaddexp(0.0, -margin))`,
        pytorchCode: `import torch.nn.functional as F

def reward_model_loss(r_chosen, r_rejected):
    return -F.logsigmoid(r_chosen - r_rejected).mean()`,
        terms: [
          { id: 'rw', label: String.raw`被偏好回答的奖励 $r(x, y_w)$`, role: 'output', shape: '(B,)', explanation: '奖励头对 chosen 回答的标量输出。', numpyLines: [3, 5], pytorchLines: [3, 4] },
          { id: 'rl', label: String.raw`被拒绝回答的奖励 $r(x, y_l)$`, role: 'data', shape: '(B,)', explanation: '同一 prompt 下较差的回答。', numpyLines: [3, 5], pytorchLines: [3, 4] },
          { id: 'loss', label: '负对数似然', role: 'loss', shape: 'scalar', explanation: String.raw`用 $\log(1+e^{-m})$ 的稳定写法，避免 $\sigma(m)\to 0$ 时 $\log 0$。`, numpyLines: [6, 7], pytorchLines: [4] },
        ],
      },
      {
        id: 'fc-l082-sample',
        title: '自回归生成中的温度采样',
        subtitle: String.raw`温度 $\tau \to 0$ 退化为贪心解码，$\tau$ 越大分布越平坦`,
        latex: String.raw`P(x_{t} = w \mid x_{<t}) = \frac{\exp(\htmlClass{formula-token formula-token-output token-z}{z_w} / \htmlClass{formula-token formula-token-hyper token-tau}{\tau})}{\sum_{w'} \exp(z_{w'} / \tau)}`,
        numpyCode: `import numpy as np

def sample_next(logits, tau=1.0, rng=np.random.default_rng()):
    if tau == 0:
        return int(np.argmax(logits))          # greedy
    z = logits / tau
    p = np.exp(z - z.max())
    p /= p.sum()
    return int(rng.choice(len(p), p=p))`,
        terms: [
          { id: 'z', label: String.raw`logits $z_w$`, role: 'output', shape: '(V,)', explanation: '最后一层对词表的打分。', numpyLines: [3, 6] },
          { id: 'tau', label: String.raw`温度 $\tau$`, role: 'hyper', shape: 'scalar', explanation: '控制随机性：低温更确定、高温更多样。', numpyLines: [4, 5, 6] },
        ],
      },
    ],
    pitfalls: [
      {
        title: 'RLHF 只最大化奖励会导致 reward hacking',
        detail: String.raw`奖励模型只是人类偏好的近似。若无约束地最大化 $r(x,y)$，策略会钻奖励模型的空子（例如回答越来越长）。实践中在目标里加入 $-\beta\, D_{\mathrm{KL}}(\pi_\theta \,\|\, \pi_{\text{SFT}})$ 让策略不要偏离 SFT 模型太远（HA12）。`,
      },
      {
        title: 'MoE 的总参数量 ≠ 每个 token 的计算量',
        detail: String.raw`$E$ 个专家、Top-$k$ 激活时，每个 token 只经过 $k$ 个 FFN，计算量约为稠密模型的 $k/E$（FFN 部分）；但所有专家的参数都要放在显存里。还需要负载均衡损失，否则门控会把 token 集中到少数专家。`,
      },
      {
        title: 'ICL / CoT 不更新任何参数',
        detail: '简答题常问「in-context learning 是不是微调」：不是。它只改变输入 prompt，模型参数完全不变；LoRA 才是参数高效微调。',
      },
    ],
    sandbox: {
      id: 'sb-l082',
      title: 'Pyodide 实测：温度如何改变下一个 token 的分布',
      description: '对同一组 logits 用不同温度计算 softmax，观察分布从「几乎 one-hot」到「接近均匀」的变化。',
      starterCode: `import numpy as np

logits = np.array([3.0, 2.2, 1.5, 0.3, -0.5, -1.0])
idx = np.arange(len(logits))
curves = {}
for tau in [0.3, 0.7, 1.0, 2.0]:
    z = logits / tau
    p = np.exp(z - z.max()); p /= p.sum()
    curves[f"tau={tau}"] = (idx, p)
    print(f"tau={tau}: top-1 prob = {p.max():.3f}, entropy = {-(p*np.log(p)).sum():.3f}")
plot_series("Next-token distribution under different temperatures", curves, xlabel="token index", ylabel="probability")
`,
    },
  },
  {
    id: 'l08-3',
    code: 'L08.3',
    partGroup: 'Part 3 · Advanced Deep Learning',
    slug: 'l08-3-agentic-ai',
    slides: ['l08.3-AgentAI-Part1.pptx', 'l08.3-AgentAI-Part2.html'],
    examWeight: 'optional',
    titleZh: '客座讲座：Agentic AI 与智能体工程',
    titleEn: 'Guest Lecture: AI Agents, Agentic Loops, Harness Engineering & Multi-Agent Systems',
    abstract: String.raw`客座讲座，概念性内容为主（考试权重较低）。核心区分：LLM 根据上下文生成回答，而 AI Agent 用 LLM 来规划、调用工具、跟踪进度并根据结果行动。讲座梳理了智能体的能力构成（自主、记忆、推理、工具）、从 Prompt 工程到 Context 工程再到 Harness 工程的演进、智能体循环、多智能体协作，以及安全与局限。`,
    readingChecklist: [
      'LLM vs AI Agent：一次性生成 vs 规划—调用工具—观察—迭代的闭环',
      'Agent 的四个要素：Autonomy（自主）、Memory（记忆）、Reasoning（推理/规划）、Tool use（工具）',
      'Prompt Engineering → Context Engineering → Harness Engineering 三层',
      '演进阶段：LLM → Copilot → 工作流编排（n8n / Dify / LangChain）→ Agentic Loop → 多智能体团队',
      '工程挑战：长任务上下文管理、记忆、可靠执行、安全护栏与沙箱隔离',
    ],
    derivations: [],
    concepts: [
      {
        heading: 'LLM 与 AI Agent 的区别',
        body: 'LLM 是 Agent 的「大脑」，但 Agent 还包括循环、工具和状态。',
        table: {
          headers: ['维度', 'LLM', 'AI Agent'],
          rows: [
            ['交互方式', '输入上下文 → 输出一次回答', '目标驱动的多步循环：思考 → 选工具 → 执行 → 观察 → 再思考'],
            ['能力边界', '只能生成文本', '可调用搜索、代码执行、文件、浏览器、API 等外部工具'],
            ['状态', '无持久状态（只有当前上下文）', '有短期上下文与长期记忆（偏好、经验、知识）'],
            ['人类参与', '每次都需要提问', '自主推进，在关键节点设置人工检查点'],
          ],
        },
      },
      {
        heading: '智能体工程的三层',
        body: '讲座把智能体工程概括为由内到外的三层：',
        points: [
          'Prompt Engineering：通过清晰的指令、结构与示例改进单次回答。',
          'Context Engineering：管理检索到的知识、记忆、工具定义与对话历史——决定模型「看到什么」。',
          'Harness Engineering：组织工具、校验、执行控制、失败恢复与评估——决定 Agent 如何可靠地「做事」。',
          '多智能体系统还需要协调：动态组队、角色分工、共享经验、可暂停/恢复的工作流与人类参与。',
        ],
      },
      {
        heading: '局限与安全',
        body: '真实部署时需要关注：',
        points: [
          '长任务会撑爆上下文：需要归档低优先级内容、保留索引、按需检索。',
          '执行风险：生成的代码与外部工具可能产生副作用，需要沙箱隔离、凭证代理与技能扫描。',
          '可靠性：长会话中的状态、失败与恢复；用执行轨迹定位失败并持续改进。',
        ],
      },
    ],
    formulaSpecs: [],
    pitfalls: [
      {
        title: 'Agent 不等于「更大的 LLM」',
        detail: '能力提升主要来自循环、工具与上下文管理等系统设计，而不是模型参数本身；同一个 LLM 放进不同的 harness，表现可以差别很大。',
      },
    ],
  },
  {
    id: 'l09',
    code: 'L09',
    partGroup: 'Part 3 · Advanced Deep Learning',
    slug: 'l09-vit-clip',
    slides: ['l09.pdf'],
    examWeight: 'core',
    figureKey: 'L09',
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
];
