import { LectureSection } from '../types/curriculum';

export const LECTURE_NOTES_3_TO_5: Record<number, LectureSection[]> = {
  3: [
    {
      id: 'l081-trans',
      lectureTag: 'L08.1 · Transformer 与 BERT 细节',
      title: 'Pre-Norm vs Post-Norm、Cross-Attention 与 BERT 预训练微调',
      concepts: [
        {
          heading: 'Transformer 块架构：Pre-Norm vs Post-Norm 与 Cross-Attention',
          badge: 'L08.1 p16–28',
          summary: '一个完整的 Transformer Encoder/Decoder Block = Multi-Head Attention + Residual + LayerNorm + Position-wise FFN。',
          bullets: [
            'Post-Norm（原论文）：x → Attn → Add → LN，深层梯度需穿过 LN，训练极度依赖精密 Warmup；Pre-Norm（GPT/LLaMA 现代标配）：LN → Attn → Add，保留干净主干残差通路，训练极稳！',
            'Decoder 三子层：Masked Self-Attention（看已生成词）→ Cross-Attention（Query 来自 Decoder，Key & Value 来自 Encoder 输出，实现跨语言对齐）→ FFN。',
            '位置编码（Positional Encoding）：Self-Attention 本身对词序置换不变，必须把 Sinusoidal 或可学习/RoPE 位置编码注入输入表征。',
          ],
        },
        {
          heading: 'BERT 完整输入与预训练任务（MLM + NSP）',
          badge: 'L08.1 p32–44 · WA3 考点',
          summary: 'BERT 是纯 Encoder 双向架构，输入为三类嵌入之和：Token Embedding + Segment Embedding (句 A/B) + Position Embedding。',
          bullets: [
            'MLM（Masked Language Model）：随机挑 15% Token，其中 80% 换 [MASK]、10% 换随机词、10% 不变，消除预训练与下游微调（无 [MASK]）的分布失配。',
            'NSP（Next Sentence Prediction）：用 [CLS] 向量判断两段文本是否连续，服务于问答与句子关系任务（后续 RoBERTa 发现去掉 NSP 反而更强）。',
            '下游微调极高效：在 [CLS] 接分类头做情感分类，在每个 Token 输出接分类头做 NER，在起止位置接两个指针做抽取式问答 (SQuAD)！',
          ],
        },
      ],
    },
    {
      id: 'l082-llm',
      lectureTag: 'L08.2 · 大语言模型全景 (LLM & MoE)',
      title: 'LLM 三阶段训练管线、涌现用法、安全风险与 Scaling/MoE',
      concepts: [
        {
          heading: '现代 LLM 三阶段训练管线（从基座到对话助手）',
          badge: 'L08.2 p5–12',
          summary: 'Decoder-Only 自回归模型之所以能听懂人类指令并安全对齐，依靠标准三阶段流水线：',
          table: {
            headers: ['阶段', '核心数据与目标', '解决的问题'],
            rows: [
              ['Stage 1: Pretraining', '万亿级互联网文本 · Next-Token Prediction', '注入世界知识、语言规律与推理能力（耗费 99% 算力）'],
              ['Stage 2: SFT (指令微调)', '高质量 (指令, 示范回答) 对 · 监督交叉熵', '把“续写机器”变成遵循对话格式的助手'],
              ['Stage 3: Alignment (RM + RLHF)', '人类偏好排序 (y_w ≻ y_l) → 奖励模型 RM → PPO/DPO', '对齐人类价值观（Helpful, Honest, Harmless），超越纯模仿上限'],
            ],
          },
          bullets: [
            'Reward Model (Bradley-Terry 损失)：训练模型给人类偏好的回答 y_w 打分高于劣质回答 y_l：−log σ(r(x, y_w) − r(x, y_l))。',
          ],
        },
        {
          heading: 'LLM 高阶应用、风险与规模化扩展 (Scaling Laws & MoE)',
          badge: 'L08.2 p13–28',
          summary: '不改权重也能通过 Prompt 激发推理，突破静态知识限制，并以 MoE 突破算力墙：',
          bullets: [
            'In-Context Learning (Zero/Few-Shot) & Chain-of-Thought (CoT)：在 Prompt 里引导“一步步思考”，给复杂数学/逻辑题提供额外的中间推理算力（Test-Time Compute）。',
            'RAG（检索增强生成）：先从外部知识库检索相关文档片段塞入上下文再生成，大幅降低过时知识与幻觉（Hallucination）。',
            '安全风险：Hallucination（一本正经胡说八道，源于概率采样而非事实检索）与 Jailbreaking（对抗提示词绕过安全对齐护栏）。',
            'Scaling Laws & MoE：测试损失随参数量 N、数据量 D、算力 C 呈幂律平滑下降；MoE（Mixture of Experts）用稀疏路由让每个 Token 只激活 Top-K 个专家，实现万亿总参、百亿激活算力！',
          ],
        },
      ],
    },
    {
      id: 'l09-vlm',
      lectureTag: 'L09 · ViT vs CNN 与 CLIP 多模态',
      title: '视觉 Transformer 归纳偏置对比与 CLIP Zero-Shot / Linear Probing',
      concepts: [
        {
          heading: 'ViT 与 CNN 的深层对比（WA3 Q7 必考！）',
          badge: 'L09 p2–14',
          summary: 'ViT 把图像切成 P×P Patch 经线性投影变成序列送入 Transformer Encoder，彻底抛弃了卷积归纳偏置。',
          table: {
            headers: ['对比维度', 'CNN (如 ResNet)', 'Vision Transformer (ViT)'],
            rows: [
              ['归纳偏置 (Inductive Bias)', '强：局部性 + 平移等变性', '极弱：仅 Patch 切分与 2D 位置嵌入'],
              ['感受野范围', '随层数由局部逐步扩大', '第 1 层即具备全局任意 Patch 交互能力'],
              ['小数据集表现', '数据效率高，小数据集显著领先', '容易过拟合，需要超大规模预训练（JFT-300M / ImageNet-21k）'],
              ['大数据可扩展性', '后期性能趋于饱和', 'Scaling 能力极强，天然与语言 Transformer 多模态融合'],
            ],
          },
          bullets: [
            '工业界实战：数据量小选预训练 CNN 或微调预训练 ViT；超大规模预训练与多模态场景全面转向 ViT！',
          ],
        },
        {
          heading: 'CLIP 的两种下游用法：Zero-Shot vs Linear Probing',
          badge: 'L09 p18–23 · WA3 Q7',
          summary: 'CLIP 在 4 亿图文对上用对称 InfoNCE 对比学习预训练，不仅能零样本分类，还对自然分布偏移（素描/卡通/风格迁移）极度鲁棒。',
          bullets: [
            'Zero-Shot Classification：把每个类别名填入模板 "a photo of a {class}" 算文本向量，直接和图像向量算余弦相似度取最大值——零训练样本！',
            '何时需要 Linear Probing？当下游任务领域极其专业（如医学 CT、卫星遥感、细粒度工业缺陷，文本描述难区分）且手头有标注数据时，冻结 CLIP 图像编码器，仅在其输出特征上训练一个轻量线性分类头（Linear Probe），快速低成本提点！',
          ],
        },
      ],
    },
  ],
  4: [
    {
      id: 'p4-vae-detail',
      lectureTag: '4.1 · VAE 变分推断与重建本质',
      title: '生成模型三大家族谱系与 ELBO 第一项为何是重建误差',
      concepts: [
        {
          heading: '深度生成模型三大范式全景',
          badge: 'Part 4 总纲',
          summary: '所有图像生成模型本质都在学习高维数据分布 p_data(x) 并高效采样：',
          bullets: [
            'Likelihood-Based（显式似然）：VAE（最大化变分下界 ELBO）、Normalizing Flows（可逆变换 + Jacobian 行列式算精确似然）、Autoregressive（逐像素/Token 链式预测）。',
            'Implicit（隐式博弈）：GAN（不写显式密度函数，靠判别器逼迫生成分布贴近真实分布）。',
            'Iterative Refinement（迭代演化）：Diffusion Models（SDE 去噪 / Score Matching）与 Flow Matching（ODE 直线速度场）。',
          ],
        },
        {
          heading: '为什么 ELBO 第一项 E[log p_θ(x|z)] 被称为“重建误差”？（WA4 Q1）',
          badge: 'WA4 高频原理',
          summary: '假设 Decoder 输出均值 x̂ = f_θ(z) 且像素噪声服从各向同性高斯分布 p_θ(x|z) = N(x̂, σ²I)：',
          latex: String.raw`\log p_\theta(\mathbf{x}\mid\mathbf{z}) = -\frac{1}{2\sigma^2}\|\mathbf{x} - f_\theta(\mathbf{z})\|^2 + \text{const}`,
          bullets: [
            '最大化条件对数似然 log p_θ(x|z) 数学上严格等价于最小化原图 x 与解码图 x̂ 之间的均方误差 MSE（若为二值像素 Bernoulli 分布则等价于二元交叉熵 BCE）！',
            '因此 ELBO 的两项构成天然博弈：重建项希望 z 记住原图每个细节，KL 项则把不同样本的后验 q(z|x) 拉拢到标准正态 N(0,I) 防止潜空间碎片化。',
          ],
        },
      ],
    },
    {
      id: 'p4-gan-detail',
      lectureTag: '4.2 · GAN 博弈理论与改进家族',
      title: '最优判别器、JSD 证明、非饱和损失与 WGAN / FID',
      concepts: [
        {
          heading: 'GAN 原始目标 vs 非饱和目标 & 改进演进',
          badge: 'WA4 Q2 核心',
          summary: '固定生成器 G 时，最优判别器为 D*(x) = p_data(x) / (p_data(x) + p_g(x))，代回原始目标得到 2·JSD(p_data ‖ p_g) − log 4。',
          bullets: [
            'L₂ = log(1 − D(G(z)))（原始饱和损失）：理论等价于最小化 JSD，但训练初期 D(G(z))≈0 时梯度几乎为 0，生成器停滞！',
            'L₁ = −log D(G(z))（非饱和启发式损失）：初期梯度极大、训练快，但可能方差较大且不再严格对应 JSD。',
            'WGAN / WGAN-GP：把 JS 散度换为 Wasserstein (Earth-Mover) 距离，即使两个分布完全不重叠也有平滑非零梯度，大幅缓解训练崩溃与 Mode Collapse！',
            '图像生成评估指标：IS（Inception Score，看清晰度+多样性）与 FID（Fréchet Inception Distance，算真实图与生成图在 Inception 特征空间的高斯均值协方差距离，越低越好）。',
          ],
        },
      ],
    },
    {
      id: 'p4-diff-flow',
      lectureTag: '4.3 · Diffusion、Latent Diffusion 与 Flow Matching',
      title: '从 DDPM/DDIM、Stable Diffusion 到现代 Flow Matching',
      concepts: [
        {
          heading: 'Flow Matching 四要素精准拆解（WA4 Q4 核心！）',
          badge: 'SD3 / Flux 核心',
          summary: 'Flow Matching 把噪声 x₀ ~ p₀ = N(0, I) 与真实数据 x₁ ~ p₁ 用直线连接，直接回归恒定速度场：',
          latex: String.raw`\mathbf{x}_t = (1 - t)\mathbf{x}_0 + t\mathbf{x}_1, \qquad \mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t \sim U(0,1),\, \mathbf{x}_0,\, \mathbf{x}_1}\!\Big[\big\|\mathbf{v}_\theta(\mathbf{x}_t, t) - (\mathbf{x}_1 - \mathbf{x}_0)\big\|^2\Big]`,
          bullets: [
            '① 期望参数：时间 t ~ Uniform(0,1)，起点纯噪声 x₀ ~ p₀，终点真实图 x₁ ~ p₁。',
            '② 插值状态 x_t = (1−t)x₀ + t x₁：沿直线从噪声走向图像的中间状态。',
            '③ 神经网络速度场 v_θ(x_t, t)：预测当前时空位置应朝哪个方向移动。',
            '④ 目标速度 (x₁ − x₀)：直线轨迹对时间 t 的导数 dx_t/dt = x₁ − x₀（与 t 无关的常向量！），轨迹极直，几步 ODE 即可高质量出图。',
            'Latent Diffusion (Stable Diffusion)：先用预训练 VAE 把 512×512 像素图压缩到 64×64×4 潜空间再做扩散，算力直降 64 倍！',
          ],
        },
      ],
    },
  ],
  5: [
    {
      id: 'p5-mdp',
      lectureTag: '5.1 · MDP、Bellman 方程与动态规划',
      title: 'Bellman 期望方程 vs 最优方程、Policy vs Value Iteration',
      concepts: [
        {
          heading: '两大 Bellman 方程对照（Cheatsheet §4 核心）',
          badge: '必背核心方程',
          summary: '价值函数满足递归自洽性：当前价值 = 即时奖励 + 折扣后的未来价值。',
          latex: String.raw`\begin{aligned}
V^\pi(s) &= \sum_a \pi(a|s)\sum_{s',r} P(s',r|s,a)\big[r + \gamma V^\pi(s')\big] \quad\text{(Bellman 期望方程)} \\
V^*(s) &= \max_a \sum_{s',r} P(s',r|s,a)\big[r + \gamma V^*(s')\big] \quad\text{(Bellman 最优方程)}
\end{aligned}`,
          bullets: [
            'Policy Iteration：交替执行「策略评估（求当前 π 的 V^π）」与「策略改进（对 V^π 贪婪取 argmax）」，通常几轮即精确收敛。',
            'Value Iteration：直接把 Bellman 最优方程当迭代更新公式反复刷 V(s)（省去内层完全评估），收敛后一次性导出最优策略 π*。',
          ],
        },
      ],
    },
    {
      id: 'p5-val-rl',
      lectureTag: '5.2 · Model-Free TD、SARSA vs Q-Learning 与 DQN',
      title: '从表格 Q-Learning 到 Deep Q-Network 稳定性家族',
      concepts: [
        {
          heading: 'On-Policy (SARSA) vs Off-Policy (Q-Learning) & DQN 演进',
          badge: 'Tutorial 12 & 13',
          summary: '真实环境转移概率 P 未知且状态空间连续（如像素/物理关节），需要 Model-Free 采样 + 神经网络近似 Q(s, a; θ)。',
          table: {
            headers: ['算法 / 机制', '核心做法', '解决的痛点'],
            rows: [
              ['SARSA (On-Policy)', 'TD 目标用实际采样的下一动作 Q(s′, a′)', '评估并优化当前探索策略本身，遇险更保守安全'],
              ['Q-Learning (Off-Policy)', 'TD 目标用贪婪最大动作 max Q(s′, a′)', '行为策略与目标策略分离，可复用历史数据直接逼近 Q*'],
              ['DQN Experience Replay', '把 (s,a,r,s′) 存缓冲区随机抽 Mini-batch', '打破时序样本强相关性，大幅提高数据利用率'],
              ['DQN Target Network', '冻结旧参数 θ⁻ 计算 TD Target，定期同步', '防止目标随更新剧烈漂移（追逐移动靶心）'],
              ['Double / Dueling DQN', '在线网选动作 + 目标网估值；拆分为 V(s)+A(s,a)', '消除 max 操作导致的 Q 值过高估计，加速状态价值泛化'],
            ],
          },
          bullets: [
            '值函数方法局限：因为每步要算 argmax_a Q(s,a)，很难直接处理高维连续动作空间（如机器人连续力矩），也不能学出随机策略 → 引出 Policy-Based 方法！',
          ],
        },
      ],
    },
    {
      id: 'p5-pol-rl',
      lectureTag: '5.3 · Policy Gradient、A2C、PPO 与 RLHF/DPO',
      title: '策略梯度定理、Actor-Critic 降方差与大模型对齐演进',
      concepts: [
        {
          heading: '从 REINFORCE 到 Advantage Actor-Critic (A2C) 与 PPO / DPO',
          badge: '现代 RL 与 LLM 对齐',
          summary: '直接对参数化策略 π_θ(a|s) 做梯度上升最大化期望总回报 J(θ)：',
          latex: String.raw`\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\!\left[\sum_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)\,\hat{A}_t\right], \qquad \hat{A}_t = r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t)`,
          bullets: [
            'REINFORCE（蒙特卡洛）：必须跑完整回合拿总回报 G_t，无偏但方差极大；减掉状态无关动作的 Baseline b(s) 可在严格保持无偏的同时大幅降方差！',
            'A2C（Advantage Actor-Critic）：Actor 更新策略 π_θ，Critic 学价值函数 V_φ 并提供单步 TD 优势估计 Â_t（在线更新、低方差）。',
            'PPO vs DPO（大模型对齐）：PPO 需同时维护 Policy、Reference、Reward、Critic 四个大模型，显存重且调参难；DPO（Direct Preference Optimization）通过闭式推导消去显式 Reward Model 与 RL 采样，直接用偏好对做二元交叉熵分类即可实现近似 KL 约束对齐！',
          ],
        },
      ],
    },
  ],
};
