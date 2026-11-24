import { LectureModule } from '../types/curriculum';

export const LECTURES_PART_0: LectureModule[] = [
  {
    id: 'l00',
    code: 'L00',
    partGroup: 'Part 0 · Introduction',
    slug: 'l00-course-intro-probability',
    slides: ['l00.pdf'],
    examWeight: 'support',
    titleZh: '课程导论、机器学习四步法与概率 / 信息论预备',
    titleEn: 'Course Overview, the 4-Step ML Recipe & Probability / Information Theory Toolkit',
    abstract: String.raw`L00 给出整门课的地图：所有模型都按「收集数据 → 选择模型 → 设计目标/损失 → 优化求解」四步组织，并分为 Part 1–5 共 16 讲。本模块同时补齐 Part 0 的概率与信息论工具（熵、交叉熵、KL 散度、最大似然），因为它们会在 Logistic 回归、VAE、GAN、Diffusion 与 RLHF 中反复出现。`,
    readingChecklist: [
      'ML 四步法：Data → Model → Objective / Loss → Optimization（每讲都按这条主线回顾）',
      'Part 1–5 课程地图与各讲之间的依赖关系（见下方课程地图表）',
      String.raw`熵 $H(p)$、交叉熵 $H(p, q)$、KL 散度 $D_{\mathrm{KL}}(p\|q)$ 的定义与关系 $H(p,q) = H(p) + D_{\mathrm{KL}}(p\|q)$`,
      String.raw`最大似然 $\Leftrightarrow$ 最小化交叉熵 $\Leftrightarrow$ 最小化 $D_{\mathrm{KL}}(p_{\text{data}}\|q_\theta)$（WA1 Q7 / WA2 Q2 主题）`,
      String.raw`Gibbs 不等式 $D_{\mathrm{KL}} \ge 0$ 及其在 ELBO、GAN 最优判别器证明中的作用`,
      '期末占比 63%，题型与 Written Assignments 接近：WA 就是最好的期末复习材料',
    ],
    derivations: [
      {
        id: 'd-l00-mle-ce-kl',
        title: String.raw`最大似然、最小交叉熵与最小 KL 散度三者等价`,
        goal: String.raw`给定从未知分布 $p(x)$ 采样的数据 $\mathcal{D}=\{x_i\}_{i=1}^N$ 与参数化模型 $q_\theta(x)$，证明最大化对数似然等价于最小化 $H(p, q_\theta)$ 与 $D_{\mathrm{KL}}(p\|q_\theta)$。`,
        steps: [
          {
            rule: 'Definition of Cross Entropy & KL',
            latex: String.raw`H(p, q_\theta) = -\mathbb{E}_{x\sim p}[\log q_\theta(x)], \qquad D_{\mathrm{KL}}(p\|q_\theta) = \mathbb{E}_{x\sim p}\!\left[\log \frac{p(x)}{q_\theta(x)}\right]`,
            justification: '两者都是对真实分布 $p$ 求期望；KL 衡量用 $q_\theta$ 代替 $p$ 编码时多付出的平均码长。',
          },
          {
            rule: 'Decomposition',
            latex: String.raw`D_{\mathrm{KL}}(p\|q_\theta) = \underbrace{-\mathbb{E}_{p}[\log q_\theta(x)]}_{H(p,\,q_\theta)} - \underbrace{\big(-\mathbb{E}_{p}[\log p(x)]\big)}_{H(p)}`,
            justification: String.raw`把对数商拆开即可。$H(p)$ 与 $\theta$ 无关，所以 $\arg\min_\theta D_{\mathrm{KL}} = \arg\min_\theta H(p, q_\theta)$。`,
          },
          {
            rule: 'Monte Carlo with the Empirical Distribution',
            latex: String.raw`H(p, q_\theta) \approx -\frac{1}{N}\sum_{i=1}^N \log q_\theta(x_i) = -\frac{1}{N}\,\ell(\theta \mid \mathcal{D})`,
            justification: String.raw`真实分布未知，用样本均值近似期望（大数定律）。右侧正是负的平均对数似然。`,
          },
          {
            rule: 'Conclusion',
            latex: String.raw`\arg\max_\theta \ell(\theta\mid\mathcal{D}) \;=\; \arg\min_\theta H(\hat p_{\text{data}}, q_\theta) \;=\; \arg\min_\theta D_{\mathrm{KL}}(\hat p_{\text{data}}\,\|\,q_\theta)`,
            justification: '这就是为什么分类用交叉熵损失、回归用 MSE（高斯似然）、VAE 最大化似然下界：它们都在逼近同一个目标。',
          },
        ],
        conclusion: String.raw`记住这条链：MLE = 最小化经验交叉熵 = 最小化 $D_{\mathrm{KL}}(p_{\text{data}}\|q_\theta)$。后面 VAE（最小化 KL）与 GAN（最小化 JSD）的对比也建立在这里。`,
      },
      {
        id: 'd-l00-gibbs',
        title: String.raw`Gibbs 不等式：$D_{\mathrm{KL}}(p\|q) \ge 0$，等号当且仅当 $p = q$`,
        goal: '用 Jensen 不等式证明 KL 散度非负。这个结论在 ELBO、GAN 最优判别器、EM 等证明中反复使用。',
        steps: [
          {
            rule: 'Rewrite with a Minus Sign',
            latex: String.raw`-D_{\mathrm{KL}}(p\|q) = \sum_x p(x)\log\frac{q(x)}{p(x)}`,
            justification: '只对 $p(x) > 0$ 的点求和。',
          },
          {
            rule: String.raw`Jensen ($\log$ is concave)`,
            latex: String.raw`\sum_x p(x)\log\frac{q(x)}{p(x)} \le \log \sum_x p(x)\frac{q(x)}{p(x)} = \log \sum_x q(x) \le \log 1 = 0`,
            justification: String.raw`凹函数满足 $\mathbb{E}[\log Y] \le \log \mathbb{E}[Y]$；等号当且仅当 $q(x)/p(x)$ 为常数，即 $p = q$。`,
          },
        ],
        conclusion: String.raw`因此 $D_{\mathrm{KL}} \ge 0$，且交叉熵 $H(p, q) \ge H(p)$。注意 KL 不对称：$D_{\mathrm{KL}}(p\|q) \ne D_{\mathrm{KL}}(q\|p)$，它不是距离。`,
      },
    ],
    concepts: [
      {
        heading: '课程地图：16 讲如何串成一条线',
        body: '每个 Part 都在回答「模型是什么、目标是什么、怎么优化」，后面的讲次会反复复用前面的工具。',
        table: {
          headers: ['Part', '讲次', '核心问题', '贯穿工具'],
          rows: [
            ['Part 1 机器学习基础', 'L01–L03', '回归 / 分类的基本模型与泛化', '矩阵求导、MLE、交叉熵、偏差-方差'],
            ['Part 2 深度学习基础', 'L04–L07', 'FNN / CNN / RNN 的结构与训练', '反向传播、优化器、归一化、残差'],
            ['Part 3 进阶深度学习', 'L08.1–L09', 'Transformer、LLM、Agent、ViT、CLIP', '自注意力、预训练 + 微调、对比学习'],
            ['Part 4 图像生成模型', 'L10–L13', 'VAE、GAN、Diffusion、Flow Matching', 'ELBO、JSD、噪声预测、速度场'],
            ['Part 5 强化学习', 'L14–L16', 'MDP、DQN、策略梯度、Actor-Critic', 'Bellman 方程、TD 目标、log-derivative trick'],
          ],
        },
      },
      {
        heading: '概率与信息论工具在课程中的出场位置',
        body: '复习时把公式和它出现的位置绑定，比孤立背公式有效得多。',
        table: {
          headers: ['工具', '定义', '在哪里用'],
          rows: [
            ['贝叶斯公式', String.raw`$p(y|x) = \frac{p(x|y)p(y)}{p(x)}$`, 'L02.2 生成式分类 / Naive Bayes；L12 classifier guidance'],
            ['熵', String.raw`$H(p) = -\sum p\log p$`, 'L02.1 信息论；L16 SAC 熵正则'],
            ['交叉熵', String.raw`$H(p,q) = -\sum p\log q$`, 'L02.1 Logistic / Softmax；L04 输出层损失'],
            ['KL 散度', String.raw`$\sum p\log\frac{p}{q}$`, 'L10 VAE 正则项；L08.2 RLHF 的 KL 约束'],
            ['JS 散度', String.raw`$\tfrac12 \mathrm{KL}(p\|m) + \tfrac12\mathrm{KL}(q\|m)$`, 'L11 GAN 的理论目标'],
            ['高斯分布', String.raw`$\mathcal{N}(\mu, \sigma^2)$`, 'L01 噪声模型；L10 VAE；L12 扩散加噪'],
          ],
        },
      },
      {
        heading: '考核结构与复习策略',
        body: '期末占 63%，老师明确说期末题会与作业题相近。复习优先级建议如下：',
        points: [
          'WA1–WA4 每道题都要能独立重做：手算题（OLS、Logistic GD、反向传播、卷积、自注意力）必须练到不看答案也能算对。',
          '概念简答题（为什么用 ReLU 而非 sigmoid、Dropout 为何有效、BN vs LN、ViT vs CNN、GAN 两种生成器损失）要能用 3–5 句话讲清「是什么 → 为什么 → 代价」。',
          '推导题重点：Ridge 闭式解、Logistic 梯度、偏差-方差分解、反向传播、ELBO、GAN 最优判别器、DDPM 一步加噪、策略梯度。',
          '用「复习中心」的抽认卡做间隔重复，用「随机测验」查漏，用「公式速查」的遮挡模式做主动回忆。',
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l00-info',
        title: '熵、交叉熵与 KL 散度的数值计算',
        subtitle: '离散分布上的三个量，以及它们之间的恒等式',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-kl}{D_{\mathrm{KL}}(p\|q)} = \htmlClass{formula-token formula-token-output token-ce}{H(p, q)} - \htmlClass{formula-token formula-token-data token-h}{H(p)}`,
        numpyCode: `import numpy as np

def entropy(p):
    p = p[p > 0]
    return -np.sum(p * np.log(p))

def cross_entropy(p, q, eps=1e-12):
    return -np.sum(p * np.log(q + eps))

def kl(p, q):
    return cross_entropy(p, q) - entropy(p)`,
        pytorchCode: `import torch
import torch.nn.functional as F

# F.kl_div expects log-probabilities for the input (q) and probabilities for the target (p)
def kl_torch(p, q):
    return F.kl_div(q.log(), p, reduction="sum")`,
        terms: [
          { id: 'h', label: String.raw`熵 $H(p)$`, role: 'data', shape: 'scalar', explanation: '真实分布自身的不确定性，与模型参数无关。', numpyLines: [3, 4, 5] },
          { id: 'ce', label: String.raw`交叉熵 $H(p,q)$`, role: 'output', shape: 'scalar', explanation: '分类损失的来源；加 eps 防止 log(0)。', numpyLines: [7, 8] },
          { id: 'kl', label: String.raw`KL 散度`, role: 'loss', shape: 'scalar ≥ 0', explanation: 'PyTorch 的 F.kl_div 参数顺序容易写反：第一个参数是 log q，第二个是 p。', numpyLines: [10, 11], pytorchLines: [4, 5, 6] },
        ],
      },
    ],
    pitfalls: [
      {
        title: String.raw`KL 散度不对称：$D_{\mathrm{KL}}(p\|q) \neq D_{\mathrm{KL}}(q\|p)$`,
        detail: String.raw`前向 KL（$p$ 在前）惩罚 $q$ 在 $p$ 有质量处取值太小，倾向于「覆盖所有模式」；反向 KL 倾向于「锁定单一模式」。VAE 的正则项是 $D_{\mathrm{KL}}(q(z|x)\|p(z))$，方向别写反。`,
      },
      {
        title: '交叉熵与 KL 只差一个常数，但这个常数是真实分布的熵',
        detail: String.raw`优化时二者梯度相同；但如果题目问「最小值是多少」，交叉熵的最小值是 $H(p)$ 而不是 $0$（只有 one-hot 标签时 $H(p)=0$）。`,
      },
      {
        title: '对数底数要一致',
        detail: String.raw`课程默认自然对数（nats）。手算熵时若用 $\log_2$（bits），所有结果都会差一个因子 $\ln 2$。`,
      },
    ],
    sandbox: {
      id: 'sb-l00',
      title: 'Pyodide 实测：两个高斯之间的 KL 与交叉熵随均值差的变化',
      description: String.raw`固定 $p = \mathcal{N}(0, 1)$，让 $q = \mathcal{N}(\mu_2, 1)$ 的均值移动，观察 KL 与交叉熵都随 $|\mu_2|$ 二次增长，且二者恰好相差常数 $H(p) = \tfrac12\log(2\pi e)$。`,
      starterCode: `import numpy as np

mu2 = np.linspace(-3, 3, 121)
s1, s2 = 1.0, 1.0
# closed form for two univariate Gaussians (natural log)
kl = np.log(s2 / s1) + (s1**2 + (0 - mu2)**2) / (2 * s2**2) - 0.5
ce = 0.5 * np.log(2 * np.pi * s2**2) + (s1**2 + (0 - mu2)**2) / (2 * s2**2)
print("H(p) =", 0.5 * np.log(2 * np.pi * np.e), " | CE - KL (should be constant):", np.unique(np.round(ce - kl, 6)))
plot_series(
    "KL(p||q) and H(p,q) as mu2 moves away from mu1 = 0",
    {"KL(p||q)": (mu2, kl), "H(p,q)": (mu2, ce)},
    xlabel="mu2",
    ylabel="nats"
)
`,
    },
  },
];
