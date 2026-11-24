import { LectureModule } from '../types/curriculum';

export const LECTURES_PART_5: LectureModule[] = [
  {
    id: 'l14',
    code: 'L14',
    partGroup: 'Part 5 · Reinforcement Learning',
    slug: 'l14-rl-fundamentals',
    slides: ['l14.pdf', 'l14-postclass.pdf'],
    examWeight: 'core',
    titleZh: '强化学习基础：MDP、价值迭代、Q-Learning 与 SARSA',
    titleEn: 'Fundamentals of RL: MDPs, Value Iteration, Bellman Optimality, Q-Learning & SARSA',
    abstract: String.raw`强化学习从智能体自己收集的经验 $\{(s, a, r, s')\}$ 中学习如何行动，是一种主动学习。若已知 MDP 模型 $P(s'|s,a), r(s,a)$，可用价值迭代（Bellman 算子的不动点迭代）规划出最优策略；没有模型时，Q-Learning 用单个样本构造的 TD 目标 $r + \gamma\max_{a'}Q(s',a')$ 对 $Q$ 做小步更新，并用 $\epsilon$-greedy 平衡探索与利用。Q-Learning 是 off-policy，SARSA 是 on-policy。`,
    readingChecklist: [
      String.raw`MDP 组成：状态空间 $S$、动作空间 $A$、转移 $P(s'|s,a)$、奖励 $r(s,a,s')$；期望即时奖励 $r(s,a) = \sum_{s'} r(s,a,s')P(s'|s,a)$`,
      String.raw`折扣回报 $R(s_0) = r_0 + \gamma r_1 + \gamma^2 r_2 + \cdots$；策略价值 $V^\pi(s) = \mathbb{E}_\pi[R(s)]$；最优策略 $\pi^*$ 与 $V^*$`,
      '规划（已知模型）vs 强化学习（只有经验）vs 监督 / 无监督学习（数据预先收集）',
      String.raw`价值迭代 $V_{k+1}(s) = \max_a\{r(s,a) + \gamma\sum_{s'}P(s'|s,a)V_k(s')\}$，收缩性保证收敛到 $V^*$`,
      String.raw`Bellman 最优方程；$Q^*(s,a)$ 与 $\pi^*(s) = \arg\max_a Q^*(s,a)$；终止状态 $Q = 0$`,
      String.raw`Q-Learning：$Q(s,a)\leftarrow Q(s,a) + \alpha[r + \gamma\max_{a'}Q(s',a') - Q(s,a)]$ 为何有效（TD 目标是 Bellman 更新的无偏估计但方差大）`,
      String.raw`$\epsilon$-greedy、episode 与终止状态；SARSA 更新 $r + \gamma Q(s', a')$；on-policy vs off-policy（HA11）`,
    ],
    verifierId: 'l11-rl-bellman-ppo',
    verifierTab: 'td',
    figureKey: 'L11',
    derivations: [
      {
        id: 'd-l14-vi-to-q',
        title: '从价值迭代到 Q-Learning：用一个样本近似 Bellman 更新',
        goal: '在不知道 $P(s\'|s,a)$ 的情况下，如何只用经验元组 $(s, a, r, s\')$ 近似 Q 值迭代？',
        steps: [
          {
            rule: 'Q Value Iteration (needs the model)',
            latex: String.raw`Q_{k+1}(s,a) = r(s,a) + \gamma\sum_{s'}P(s'|s,a)\max_{a'}Q_k(s',a')`,
            justification: String.raw`这是 Bellman 算子作用在 $Q_k$ 上，序列收敛到 $Q^*$，与初值无关。`,
          },
          {
            rule: 'Monte Carlo with m Samples',
            latex: String.raw`Q_{k+1}(s,a) \approx r(s,a) + \gamma\,\frac1m\sum_{j=1}^m \max_{a'}Q_k(s_j',a'), \qquad s_j'\sim P(\cdot|s,a)`,
            justification: '用从环境采到的后继状态替代对转移概率的求和。',
          },
          {
            rule: 'One Sample ⇒ TD Target',
            latex: String.raw`y = r(s,a) + \gamma\max_{a'}Q_k(s',a')`,
            justification: '只有一个样本时，这个 TD 目标是 Bellman 更新的无偏估计，但方差很大，所以不能直接把 $Q(s,a)$ 赋值为 $y$。',
          },
          {
            rule: 'Small Step Toward the Target',
            latex: String.raw`Q(s,a) \leftarrow (1-\alpha)Q(s,a) + \alpha\,y = Q(s,a) + \alpha\big[\underbrace{r + \gamma\max_{a'}Q(s',a') - Q(s,a)}_{\text{TD error } \delta}\big]`,
            justification: '学习率 $\\alpha$ 起到对多个样本做滑动平均的作用。只要每个 $(s,a)$ 被无限次更新（并满足步长条件），Q-Learning 收敛到 $Q^*$。',
          },
        ],
        conclusion: String.raw`把表格 $Q$ 换成神经网络 $Q(s,a;\theta)$、把赋值换成对 $(y - Q(s,a;\theta))^2$ 的梯度步，就得到 L15 的 DQN。`,
      },
    ],
    concepts: [
      {
        heading: '三类学习问题的数据从哪里来',
        body: '讲义用猫-老鼠-奶酪迷宫引出 RL：',
        table: {
          headers: ['问题', '输入', '输出', '数据'],
          rows: [
            ['监督学习', String.raw`$\{(\mathbf{x}_i, y_i)\}$`, '预测器', '预先收集'],
            ['无监督学习', String.raw`$\{\mathbf{x}_i\}$`, '分布 / 表示 / 生成器', '预先收集'],
            ['规划 (Planning)', String.raw`$P(s'|s,a),\ r(s,a)$`, String.raw`$\pi^*$`, '不需要数据，已知模型'],
            ['强化学习', String.raw`$\{(s, a, r, s')\}$`, String.raw`$\pi^*$`, '智能体与环境交互自己收集（主动学习）'],
          ],
        },
      },
      {
        heading: 'Q-Learning vs SARSA',
        body: '两者都是时序差分（TD）学习，区别只在 TD 目标用哪个下一步动作：',
        table: {
          headers: ['', 'Q-Learning', 'SARSA'],
          rows: [
            ['TD 目标', String.raw`$r + \gamma\max_{a'}Q(s',a')$`, String.raw`$r + \gamma Q(s',a')$，$a'$ 由当前 $\epsilon$-greedy 策略选出`],
            ['类型', 'Off-policy：评估贪心策略，与实际执行的策略不同', 'On-policy：评估正在执行的策略本身'],
            ['悬崖行走表现', '学到贴着悬崖的最短路，训练时偶尔因探索掉下去', '学到远离悬崖的安全路线，训练回报更稳定'],
            ['更新时机', '执行 a、观察 r, s′ 后更新，下一步再选动作', '先为 s′ 选好 a′ 再更新，然后执行 a′'],
          ],
        },
      },
      {
        heading: '探索与利用',
        body: '智能体必须自己收集数据，所以存在权衡：',
        points: [
          '探索：去状态空间的新区域积累经验，但当前奖励可能不是最大。',
          '利用：用已有经验最大化奖励，但可能得不到新经验。',
          String.raw`$\epsilon$-greedy：以小概率 $\epsilon$ 随机选动作，以 $1-\epsilon$ 选当前估计下 $Q$ 最大的动作。`,
          '终止（吸收）状态：进入后无法离开（如 Game Over），从初始状态到终止状态为一个 episode；终止状态的 $Q$ 恒设为 0。',
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l14-td',
        title: 'Q-Learning 与 SARSA 的表格更新',
        subtitle: '唯一区别：TD 目标里的下一步价值用 max 还是用实际选中的动作',
        latex: String.raw`Q(s,a) \leftarrow Q(s,a) + \htmlClass{formula-token formula-token-hyper token-alpha}{\alpha}\Big[\htmlClass{formula-token formula-token-output token-target}{r + \gamma\max_{a'}Q(s',a')} - Q(s,a)\Big]`,
        numpyCode: `import numpy as np

def q_learning_update(Q, s, a, r, s_next, done, alpha=0.5, gamma=0.9):
    target = r if done else r + gamma * np.max(Q[s_next])
    Q[s, a] += alpha * (target - Q[s, a])

def sarsa_update(Q, s, a, r, s_next, a_next, done, alpha=0.5, gamma=0.9):
    target = r if done else r + gamma * Q[s_next, a_next]
    Q[s, a] += alpha * (target - Q[s, a])

def epsilon_greedy(Q, s, eps, rng=np.random.default_rng()):
    return int(rng.integers(Q.shape[1])) if rng.random() < eps else int(np.argmax(Q[s]))`,
        terms: [
          { id: 'target', label: 'TD 目标', role: 'output', shape: 'scalar', explanation: '终止状态没有未来价值，目标就是 r。', numpyLines: [4, 8] },
          { id: 'alpha', label: String.raw`学习率 $\alpha$`, role: 'hyper', shape: 'scalar', explanation: '向目标移动的比例；α = 1 等于直接用单样本替换（方差大）。', numpyLines: [5, 9] },
        ],
      },
    ],
    pitfalls: [
      {
        title: 'Q-Learning 即使没有经验回放也是 off-policy',
        detail: String.raw`更新时用的是 $\max_{a'}Q(s',a')$，而智能体下一步实际执行的动作是由（更新后的）$Q$ 经 $\epsilon$-greedy 选出的，不一定是那个 argmax。`,
      },
      {
        title: '价值迭代收敛后策略往往早已稳定',
        detail: '讲义的网格例子中，V10 → V20 值变化很大但策略只改了一个格子，V30 策略不再变化。判断「何时停止」时，策略收敛通常比值函数收敛早。',
      },
      {
        title: '手算 TD 更新时注意终止状态',
        detail: String.raw`若 $s'$ 是终止状态，TD 目标就是 $r$；不要再加 $\gamma\max_{a'}Q(s',a')$。`,
      },
    ],
    sandbox:       {
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
  {
    id: 'l15',
    code: 'L15',
    partGroup: 'Part 5 · Reinforcement Learning',
    slug: 'l15-value-based-deep-rl',
    slides: ['l15.pdf', 'l15-postclass.pdf'],
    examWeight: 'core',
    titleZh: '基于价值的深度强化学习：DQN、目标网络、经验回放与 Double DQN',
    titleEn: 'Value-Based Deep RL: DQN, Target Network, Experience Replay, Double DQN, PER & DDPG',
    abstract: String.raw`状态空间巨大时（Atari 一帧 210×160 像素）无法用表格表示 $Q$，也无法给没见过的状态选动作。DQN 用神经网络 $Q(s,a;\theta)$ 近似 $Q^*$，把 TD 目标当作回归标签。为解决「追逐移动目标」引入目标网络 $\theta^-$（每 C 步同步），为提高数据效率与收敛速度引入经验回放；Double DQN 用在线网络选动作、目标网络评估来缓解 max 带来的高估；优先经验回放按 TD 误差采样；DDPG 把思路扩展到连续动作。`,
    readingChecklist: [
      String.raw`DQN 损失 $L(\theta) = \big(r + \gamma\max_{a'}Q(s',a';\theta^-) - Q(s,a;\theta)\big)^2$ 与更新规则`,
      '移动目标问题：TD 目标依赖正在更新的参数 → 目标网络，每 C 步令 $\\theta^- \\leftarrow \\theta$',
      '经验回放：把 $(s,a,s\',r)$ 存入缓冲区，随机抽小批量更新；每条经验可重复使用、去除样本相关性',
      'Atari DQN：输入最近 4 帧像素，输出 18 个动作的 Q 值，奖励为分数变化，所有游戏共用同一架构和超参数',
      String.raw`高估：$\mathbb{E}[\max(X_1, X_2)] \ge \max(\mathbb{E}[X_1], \mathbb{E}[X_2])$ → Double DQN：$a^* = \arg\max_{a'}Q(s',a';\theta)$，用 $Q(s',a^*;\theta^-)$ 评估`,
      String.raw`优先经验回放：$P(i) = p_i^\alpha/\sum_k p_k^\alpha$，$p_i = |\delta_i| + \epsilon$ 或 $1/\mathrm{rank}(i)$`,
      'Rainbow = Double + PER + Dueling + Multi-step + Distributional；DDPG 用 Actor-Critic 处理连续动作（TD3 是改进版）',
    ],
    verifierId: 'l11-rl-bellman-ppo',
    verifierTab: 'td',
    figureKey: 'L11',
    derivations: [
      {
        id: 'd-l15-dqn',
        title: 'DQN 的损失、半梯度更新与目标网络',
        goal: '把 Q-Learning 的表格更新改写成对参数 $\\theta$ 的梯度步。',
        steps: [
          {
            rule: 'Regression Toward the TD Target',
            latex: String.raw`L(\theta) = \big(y - Q(s,a;\theta)\big)^2, \qquad y = r(s,a) + \gamma\max_{a'}Q(s',a';\theta^-)`,
            justification: '真实目标 $Q^*$ 未知，用 TD 目标代替：对当前 $Q$ 做一次价值迭代得到的东西更接近 $Q^*$。',
          },
          {
            rule: 'Treat y as a Constant (Semi-Gradient)',
            latex: String.raw`\theta \leftarrow \theta + \alpha\big(y - Q(s,a;\theta)\big)\nabla_\theta Q(s,a;\theta)`,
            justification: String.raw`对 $L$ 求导时不对 $y$ 求导（常数因子 2 并入 $\alpha$）。若 $y$ 用的是同一组参数 $\theta$，每次更新都会改变目标，像在追逐移动目标，训练不稳定。`,
          },
          {
            rule: 'Target Network',
            latex: String.raw`\theta^- \leftarrow \theta \quad \text{every } C \text{ steps}`,
            justification: '在 C 步之内目标固定，回归问题是良定的。',
          },
        ],
        conclusion: '再加上经验回放：每步把经验存入缓冲区 $\\mathcal{D}$，从中随机抽小批量 $B$，对 $\\sum_{j\\in B}(y_j - Q(s_j,a_j;\\theta))^2$ 做梯度步。',
      },
      {
        id: 'd-l15-overest',
        title: '为什么 DQN 会高估 Q 值，Double DQN 如何缓解',
        goal: String.raw`把估计中的随机误差记作 $\epsilon^-$，比较 TD 目标的期望与「先平均再取 max」的理想值。`,
        steps: [
          {
            rule: 'Noisy Estimates',
            latex: String.raw`y^{Q} = r + \gamma\max_{a'}Q(s',a';\theta^-, \epsilon^-)`,
            justification: '$Q$ 的估计受随机因素影响。',
          },
          {
            rule: 'Jensen for the Convex max',
            latex: String.raw`\mathbb{E}_{\epsilon^-}[y^{Q}] = r + \gamma\,\mathbb{E}_{\epsilon^-}\big[\max_{a'}Q(s',a';\theta^-,\epsilon^-)\big] \;\ge\; r + \gamma\max_{a'}\mathbb{E}_{\epsilon^-}\big[Q(s',a';\theta^-,\epsilon^-)\big] = \bar y`,
            justification: String.raw`对任意随机变量 $\mathbb{E}[\max(X_1,X_2)] \ge \max(\mathbb{E}X_1, \mathbb{E}X_2)$。同一组带噪估计既用来「选」又用来「评」，被噪声抬高的动作更容易被选中。`,
          },
          {
            rule: 'Decouple Selection and Evaluation',
            latex: String.raw`a^* = \arg\max_{a'}Q(s',a';\theta), \qquad y^{\text{DoubleQ}} = r + \gamma\,Q(s',a^*;\theta^-)`,
            justification: '用在线网络 $\\theta$ 选动作，用目标网络 $\\theta^-$ 评估；两者误差不完全相关，期望更接近 $\\bar y$。',
          },
        ],
        conclusion: '讲义的类比：一位老师既挑出「最好的学生」又给他打分，会高估全班最高分；让一位老师挑人、另一位老师打分就好得多。',
      },
    ],
    concepts: [
      {
        heading: 'DQN 的两大稳定技巧',
        body: '记住每个技巧解决什么问题：',
        table: {
          headers: ['技巧', '解决的问题', '做法', '附带好处'],
          rows: [
            ['目标网络', 'TD 目标随参数变化（移动目标）', String.raw`用 $\theta^-$ 计算 $y$，每 C 步同步`, '训练更稳定'],
            ['经验回放', '只用最新一条经验；连续样本高度相关', '存入缓冲区，随机抽小批量', '数据效率更高（重复使用）；每次更新汇集多条经验，收敛更快'],
            ['Double DQN', 'max 导致系统性高估', '在线网络选、目标网络评', '更准确的价值与更好的策略'],
            ['优先经验回放', '均匀抽样忽略了经验的重要性', String.raw`按 $|\delta|$ 或排名的 $\alpha$ 次幂抽样（$\alpha = 0$ 为均匀）`, '在大多数游戏上进一步提升 Double DQN'],
          ],
        },
      },
      {
        heading: '连续动作：DDPG',
        body: String.raw`DQN 需要 $\arg\max_a Q(s,a)$，动作连续时无法枚举。DDPG 用两个网络：Critic $Q(s,a|\theta^Q)$ 按 TD 目标训练；Actor $\mu(s|\theta^\mu)$ 直接输出动作，通过最大化 $Q(s,\mu(s|\theta^\mu))$ 来更新。TD3（Twin Delayed DDPG）是显著改进的版本。`,
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l15-dqn',
        title: 'DQN 与 Double DQN 的 TD 目标',
        subtitle: '目标必须在 no_grad 下计算；两种目标只差「谁来选动作」',
        latex: String.raw`y^{\text{DQN}} = r + \gamma\max_{a'}\htmlClass{formula-token formula-token-param token-tgt}{Q(s',a';\theta^-)}, \qquad y^{\text{Double}} = r + \gamma\,Q\big(s', \htmlClass{formula-token formula-token-output token-astar}{\arg\max_{a'}Q(s',a';\theta)};\theta^-\big)`,
        numpyCode: `import numpy as np

def td_targets(q_online_next, q_target_next, r, done, gamma=0.99, double=True):
    # q_*_next: (B, |A|) Q-values of s' from the online / target network
    if double:
        a_star = np.argmax(q_online_next, axis=1)                  # select with online net
        q_next = q_target_next[np.arange(len(r)), a_star]          # evaluate with target net
    else:
        q_next = np.max(q_target_next, axis=1)
    return r + gamma * (1.0 - done) * q_next                       # treated as constants`,
        pytorchCode: `import torch
import torch.nn.functional as F

def dqn_loss(q_net, target_net, batch, gamma=0.99, double=True):
    s, a, r, s_next, done = batch
    q_sa = q_net(s).gather(1, a.unsqueeze(1)).squeeze(1)
    with torch.no_grad():
        if double:
            a_star = q_net(s_next).argmax(dim=1, keepdim=True)         # select with online net
            q_next = target_net(s_next).gather(1, a_star).squeeze(1)   # evaluate with target net
        else:
            q_next = target_net(s_next).max(dim=1).values
        y = r + gamma * (1.0 - done) * q_next
    return F.smooth_l1_loss(q_sa, y)`,
        terms: [
          { id: 'tgt', label: String.raw`目标网络 $Q(\cdot;\theta^-)$`, role: 'param', shape: '(B, |A|)', explanation: '每 C 步从在线网络复制一次参数。', numpyLines: [7, 9], pytorchLines: [10, 12] },
          { id: 'astar', label: String.raw`$a^*$ 由在线网络选出`, role: 'output', shape: '(B, 1)', explanation: 'Double DQN 的关键改动。', numpyLines: [6], pytorchLines: [9] },
        ],
      },
    ],
    pitfalls: [
      ...[
      {
        title: 'DQN 中忘记对 TD Target 使用 `torch.no_grad()`',
        detail: String.raw`在计算 $\text{loss} = \text{SmoothL1}\!\big(Q_{\text{online}}(s, a),\; r + \gamma \max_{a'} Q_{\text{target}}(s', a')\big)$ 时，TD Target 必须被视为固定回归标签（` + '`no_grad`' + ' / ' + '`detach`' + String.raw`），否则反向传播会同时把目标网往在线网方向拉，破坏 Bellman 迭代动力学！`,
      },
    ],
      {
        title: 'Double DQN 中两个网络的角色不要写反',
        detail: String.raw`选动作（argmax）用在线网络 $\theta$，评估用目标网络 $\theta^-$。若都用 $\theta^-$ 就退回普通 DQN。`,
      },
      {
        title: 'DQN 是 off-policy，所以才能用经验回放',
        detail: '回放缓冲区里的经验来自旧策略。Q-Learning 型的目标不依赖产生数据的策略，所以可以复用；REINFORCE 之类的 on-policy 方法则不能直接复用旧数据。',
      },
    ],
  },
  {
    id: 'l16',
    code: 'L16',
    partGroup: 'Part 5 · Reinforcement Learning',
    slug: 'l16-policy-based-deep-rl',
    slides: ['l16.pdf', 'l16-rl-pre-class 5.pdf'],
    examWeight: 'core',
    titleZh: '基于策略的深度强化学习：策略梯度、REINFORCE、Actor-Critic 与 PPO',
    titleEn: 'Policy-Based Deep RL: Policy Gradients, REINFORCE, Variance Reduction, Actor-Critic (A2C/A3C), PPO & SAC',
    abstract: String.raw`策略梯度直接用神经网络表示随机策略 $\pi_\theta(a|s)$，最大化期望总回报 $J(\theta) = \mathbb{E}_{\tau\sim\pi_\theta}[r(\tau)]$。log-derivative trick 给出 $\nabla J = \mathbb{E}[\sum_t\nabla\log\pi_\theta(a_t|s_t)\,r(\tau)]$，环境转移概率在求导中消失（model-free）。REINFORCE 是「试错」的形式化：好轨迹的动作概率上调、坏轨迹的下调。用因果性（reward-to-go）和基线降低方差且不引入偏差；Actor-Critic 用学到的 $\hat V$ 估计优势 $\hat A = r + \gamma\hat V(s') - \hat V(s)$；PPO 用裁剪的概率比稳定更新；SAC 加熵正则鼓励探索。`,
    readingChecklist: [
      String.raw`价值方法 $Q(s,a;\theta) \to \pi(s) = \arg\max_a Q$（确定性策略）vs 策略方法直接学习随机策略 $\pi_\theta(a|s)$`,
      String.raw`轨迹概率 $p_\theta(\tau) = p(s_0)\prod_t\pi_\theta(a_t|s_t)p(s_{t+1}|s_t,a_t)$；目标 $J(\theta) = \mathbb{E}_{p_\theta(\tau)}[\sum_t\gamma^t r_t]$`,
      String.raw`log-derivative trick 推导 $\nabla J = \mathbb{E}[\nabla\log p_\theta(\tau)\,r(\tau)]$，以及为何 $p(s_{t+1}|s_t,a_t)$ 消失`,
      'REINFORCE 算法与「试错」解释；与监督学习、模仿学习的对比（加权的最大似然）',
      'On-policy（REINFORCE）vs off-policy（DQN、Q-Learning）',
      String.raw`降方差：因果性 reward-to-go $\sum_{t'\ge t}$；基线 $b = \frac1N\sum_i r(\tau_i)$ 且 $\mathbb{E}[\nabla\log p_\theta(\tau)\,b] = 0$（无偏）`,
      String.raw`$V^\pi, Q^\pi$ 与 $V^*, Q^*$ 的区别；优势函数 $A^\pi(s,a) = Q^\pi(s,a) - V^\pi(s)$ 及其单步估计`,
      '在线 / 批量 Actor-Critic、A3C；TRPO / PPO 的动机；SAC 的最大熵目标；价值方法 vs 策略方法的优缺点',
    ],
    verifierId: 'l11-rl-bellman-ppo',
    verifierTab: 'ppo',
    figureKey: 'L11',
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
      {
        id: 'd-l16-ac',
        title: 'Actor-Critic：用价值网络估计优势函数',
        goal: String.raw`把策略梯度中的 $r(\tau_i)$ 换成优势 $\hat A(s_t, a_t)$，并说明如何只用一步经验估计它。`,
        steps: [
          {
            rule: 'Advantage Form of the Policy Gradient',
            latex: String.raw`\nabla_\theta J(\theta) \approx \frac1N\sum_{i}\sum_t \nabla_\theta\log\pi_\theta(a_t^i|s_t^i)\,A^\pi(s_t^i, a_t^i), \qquad A^\pi(s,a) = Q^\pi(s,a) - V^\pi(s)`,
            justification: '优势衡量动作 $a$ 比该状态下的平均水平好多少：好于平均就提高概率，差于平均就降低。$V^\\pi(s)$ 正是一个合法基线。',
          },
          {
            rule: 'One-Step Estimate of Q',
            latex: String.raw`Q^\pi(s_t,a_t) = r(s_t,a_t) + \gamma\sum_{s'}P(s'|s_t,a_t)V^\pi(s') \approx r(s_t,a_t) + \gamma V^\pi(s_{t+1})`,
            justification: '让智能体再走一步，用采到的 $s_{t+1}$ 代替对转移概率的求和。',
          },
          {
            rule: 'Critic Provides V',
            latex: String.raw`\hat A(s_t,a_t) = r_t + \gamma\hat V_\phi(s_{t+1}) - \hat V_\phi(s_t), \qquad \phi \leftarrow \arg\min_\phi \sum_i\big(\hat V_\phi(s_i) - (r_i + \gamma\hat V_\phi(s_i'))\big)^2`,
            justification: 'Critic 做策略评估：用 L2 损失回归 TD 目标。Actor 再按 $\\theta \\leftarrow \\theta + \\alpha\\nabla_\\theta\\log\\pi_\\theta(a|s)\\hat A(s,a)$ 更新。',
          },
        ],
        conclusion: 'A3C 让多个学习者并行与环境交互、轮流更新共享参数，起到与经验回放类似的去相关作用，且不同学习者探索环境的不同部分。',
      },
    ],
    concepts: [
      {
        heading: '价值方法 vs 策略方法',
        body: '讲义最后的总结：',
        table: {
          headers: ['', '基于价值（DQN）', '基于策略（PG / Actor-Critic）'],
          rows: [
            ['学什么', String.raw`$Q(s,a;\theta)$，再 $\arg\max$ 得确定性策略`, String.raw`直接学随机策略 $\pi_\theta(a|s)$`],
            ['优点', '可以 off-policy、可用经验回放，样本效率更高', '直接优化策略，更稳定；天然支持连续动作'],
            ['缺点', '间接；Q 难以估准，可能导致策略不稳定', 'On-policy，样本效率低；梯度方差高'],
            ['训练信号', 'TD 目标', '延迟奖励（试错）'],
          ],
        },
      },
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
      {
        heading: '降低策略梯度方差的三种手段',
        body: '每条轨迹都很贵，样本量 $N$ 小，所以方差是策略梯度的核心问题：',
        points: [
          String.raw`因果性（reward-to-go）：时刻 $t$ 的动作不影响之前的奖励，把 $r(\tau)$ 换成 $\sum_{t'=t}^T\gamma^{t'}r_{t'}$，受更少随机性影响，方差更小。`,
          String.raw`基线：用 $r(\tau) - b$ 代替 $r(\tau)$，$b$ 取平均回报。类比：若 $b$ 与 $x_i$ 正相关，$\mathrm{Var}(x - b)$ 可以远小于 $\mathrm{Var}(x)$；且因 $\int\nabla p_\theta(\tau)d\tau = \nabla 1 = 0$，基线不引入偏差。`,
          String.raw`Critic：用学到的 $\hat V(s)$ 作状态相关基线，得到优势形式（A2C）。`,
        ],
      },
      {
        heading: '更高级的策略优化：TRPO / PPO 与 SAC',
        body: '普通策略梯度每次只能小步更新：学习率大会导致性能崩溃，学习率小又学得慢，而且采到的轨迹只用一次。',
        points: [
          String.raw`PPO：用概率比 $r_t(\theta) = \pi_\theta(a_t|s_t)/\pi_{\text{old}}(a_t|s_t)$ 构造替代目标 $L^{\text{CLIP}} = \mathbb{E}_t[\min(r_t\hat A_t,\ \mathrm{clip}(r_t, 1-\epsilon, 1+\epsilon)\hat A_t)]$，允许在同一批数据上做多轮更新而不过度偏离旧策略。`,
          String.raw`$\hat A > 0$ 时 $r$ 超过 $1+\epsilon$ 后梯度为 0；$\hat A < 0$ 时 $r$ 低于 $1-\epsilon$ 后梯度为 0。`,
          String.raw`SAC：目标改为 $\mathbb{E}[\sum_t\gamma^t(r_t + \alpha H(\pi(\cdot|s_t)))]$，偏好高熵策略，探索更好、更稳定、样本效率更高（off-policy）。`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l16-reinforce',
        title: 'REINFORCE（带 reward-to-go 与基线）的损失',
        subtitle: '对 −log π · (G − b) 做梯度下降，就是对 J(θ) 做梯度上升',
        latex: String.raw`\hat\nabla_\theta J = \frac1N\sum_i\sum_t \nabla_\theta\log\pi_\theta(a_t^i|s_t^i)\,\big(\htmlClass{formula-token formula-token-output token-g}{G_t^i} - \htmlClass{formula-token formula-token-hyper token-b}{b}\big), \qquad G_t = \sum_{t'\ge t}\gamma^{t'-t}r_{t'}`,
        numpyCode: `import numpy as np

def reward_to_go(rewards, gamma=0.99):
    G, out = 0.0, []
    for r in reversed(rewards):
        G = r + gamma * G
        out.append(G)
    return np.array(out[::-1])

def reinforce_objective(log_probs, rewards, gamma=0.99):
    G = reward_to_go(rewards, gamma)
    b = G.mean()                                   # simple baseline
    return -np.sum(np.asarray(log_probs) * (G - b))  # minimize = ascend J`,
        pytorchCode: `import torch

def reward_to_go(rewards, gamma=0.99):
    G, out = 0.0, []
    for r in reversed(rewards):
        G = r + gamma * G
        out.append(G)
    return torch.tensor(out[::-1])

def reinforce_loss(log_probs, rewards, gamma=0.99):
    G = reward_to_go(rewards, gamma)
    b = G.mean()                                   # simple baseline
    return -(torch.stack(log_probs) * (G - b)).sum()`,
        terms: [
          { id: 'g', label: String.raw`reward-to-go $G_t$`, role: 'output', shape: '(T,)', explanation: '从后往前累加，只包含 t 之后的奖励（因果性）。', numpyLines: [3, 4, 5, 6, 7, 8], pytorchLines: [3, 4, 5, 6, 7, 8] },
          { id: 'b', label: String.raw`基线 $b$`, role: 'hyper', shape: 'scalar', explanation: '不依赖动作，所以不改变梯度期望，只降低方差。', numpyLines: [12], pytorchLines: [12] },
        ],
      },
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
        title: '基线不能依赖动作',
        detail: String.raw`无偏性的证明用到 $\mathbb{E}_{a\sim\pi}[\nabla\log\pi(a|s)]\cdot b = 0$，前提是 $b$ 可以提到期望外面。$b(s)$ 可以依赖状态，但不能依赖当前动作 $a_t$。`,
      },
      {
        title: '策略梯度是梯度上升',
        detail: String.raw`$J(\theta)$ 要最大化。用深度学习框架实现时 loss 取 $-\log\pi\cdot\hat A$ 再做梯度下降；忘记负号会让好动作的概率越来越小。`,
      },
      {
        title: 'REINFORCE 与监督学习 / 模仿学习的关系',
        detail: String.raw`监督学习最大化 $\sum\log P_\theta(y_i|x_i)$；模仿学习对人类示范动作做同样的事；REINFORCE 对自己采样的动作做「按回报加权」的最大似然：$r(\tau) > 0$ 的轨迹被当作正例强化，$r(\tau) < 0$ 的被抑制。`,
      },
    ],
  },
];
