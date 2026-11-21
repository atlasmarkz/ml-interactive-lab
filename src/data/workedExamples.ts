import { WorkedExample } from '../types/curriculum';

export const WORKED_EXAMPLES: Record<number, WorkedExample[]> = {
  0: [
    {
      id: 'we-p0-gauss-kl',
      tag: '高频推导 · 双高斯 KL',
      title: '计算两个单位方差高斯分布的 KL 散度与交叉熵',
      problem:
        '设真实分布 p = N(μ₁=0, σ₁²=1)，模型分布 q = N(μ₂=2, σ₂²=1)。请推导并计算 D_KL(p ‖ q) 与交叉熵 H(p, q)（以自然对数 nats 计）。',
      problemLatex: String.raw`p = \mathcal{N}(0, 1), \quad q = \mathcal{N}(2, 1) \implies D_{\text{KL}}(p\,\|\,q) = \;?,\quad H(p,q) = \;?`,
      steps: [
        {
          title: '写出一般高斯 KL 闭式公式',
          explanation: '利用 log(p/q) 展开高斯指数项并对 p 求期望 E_p[(x−μ₁)²] = σ₁²，得到：',
          latex: String.raw`D_{\text{KL}}(p\,\|\,q) = \ln\frac{\sigma_2}{\sigma_1} + \frac{\sigma_1^2 + (\mu_1 - \mu_2)^2}{2\sigma_2^2} - \frac{1}{2}`,
        },
        {
          title: '代入 σ₁ = σ₂ = 1, μ₁ = 0, μ₂ = 2',
          explanation: '对数项 ln(1)=0，方差项 1/2 与 −1/2 恰好抵消，只剩均方差项：',
          latex: String.raw`D_{\text{KL}}(p\,\|\,q) = 0 + \frac{1 + (0 - 2)^2}{2} - \frac{1}{2} = \frac{4}{2} = 2.0\text{ nats}`,
        },
        {
          title: '利用 H(p, q) = H(p) + D_KL(p ‖ q) 求交叉熵',
          explanation: '标准正态分布的微分熵为 H(p) = ½ ln(2πe) ≈ 1.4189 nats，相加即得：',
          latex: String.raw`H(p, q) = \frac{1}{2}\ln(2\pi e) + 2.0 \approx 3.4189\text{ nats}`,
        },
      ],
      keyTakeaway:
        '当方差固定为 1 时，高斯分布的 KL 散度就是 ½(μ₁−μ₂)²——这再次印证了「固定方差高斯似然 = 最小二乘 MSE」！',
    },
  ],
  1: [
    {
      id: 'we-p1-logreg-gd',
      tag: '高频手算 · Logistic 一步 GD',
      title: '手动执行一次 Logistic Regression 批量梯度下降 (Batch GD)',
      problem:
        '给定 2 个样本：(x₁=[1, 0], y₁=0) 与 (x₂=[0, 2], y₂=1)。模型为 p(y=1|x) = σ(w₀ + w₁x₁ + w₂x₂)。初始参数 w₀=0, w₁=0, w₂=0，学习率 α=0.5。求一步 Batch GD 后的新权重与分类准确率。',
      problemLatex: String.raw`w^{(0)} = (0, 0, 0), \quad \alpha = 0.5, \quad \frac{\partial L}{\partial w_j} = \frac{1}{N}\sum_{i=1}^N (\hat{y}_i - y_i) x_{i,j}`,
      steps: [
        {
          title: '前向计算每个样本的预测概率 ŷ_i = σ(wᵀx_i)',
          explanation: '初始权重全为 0，因此所有线性得分 z_i = 0，而 σ(0) = 0.5：',
          latex: String.raw`\hat{y}_1 = \sigma(0) = 0.5, \qquad \hat{y}_2 = \sigma(0) = 0.5`,
        },
        {
          title: '计算残差 (ŷ_i − y_i) 与各参数平均梯度',
          explanation: '样本 1 残差为 0.5 − 0 = +0.5，样本 2 残差为 0.5 − 1 = −0.5（注意 x_{i,0} ≡ 1）：',
          latex: String.raw`\begin{aligned}
\frac{\partial L}{\partial w_0} &= \frac{1}{2}(0.5\cdot 1 + (-0.5)\cdot 1) = 0, \\
\frac{\partial L}{\partial w_1} &= \frac{1}{2}(0.5\cdot 1 + (-0.5)\cdot 0) = +0.25, \\
\frac{\partial L}{\partial w_2} &= \frac{1}{2}(0.5\cdot 0 + (-0.5)\cdot 2) = -0.50
\end{aligned}`,
        },
        {
          title: '沿负梯度方向更新一步并检查分类结果',
          explanation: '代入 w_j ← w_j − α·(∂L/∂w_j)：',
          latex: String.raw`w_0^{(1)} = 0, \quad w_1^{(1)} = -0.125, \quad w_2^{(1)} = +0.25`,
        },
      ],
      keyTakeaway:
        '更新后样本 1 得分 −0.125 < 0 → 预测 0（正确）；样本 2 得分 +0.50 > 0 → 预测 1（正确），仅一步 GD 训练误差即降为 0%！考试手算最易错的是忘记除以样本数 N 以及搞反 (ŷ−y) 的正负号。',
    },
  ],
  2: [
    {
      id: 'we-p2-cnn-flops',
      tag: '高频手算 · CNN 维度/参数/算力',
      title: '手算卷积层输出 Shape、参数总数与浮点乘法次数 (FLOPs)',
      problem:
        '某卷积层输入张量形状为 32 × 32 × 64（高 × 宽 × 通道），使用 128 个 3 × 3 卷积核，步长 S = 2，零填充 P = 1（含偏置项）。求：① 输出形状；② 参数量；③ 全部输出单元净输入所需的总浮点乘法次数。',
      problemLatex: String.raw`\text{Input}: (32, 32, 64), \quad K=3, \; C_{\text{out}}=128, \; S=2, \; P=1`,
      steps: [
        {
          title: '第 1 步：计算输出空间尺寸与张量 Shape',
          explanation: '套用通用尺寸公式 ⌊(H + 2P − K) / S⌋ + 1，输出通道数等于卷积核个数 128：',
          latex: String.raw`H_{\text{out}} = W_{\text{out}} = \left\lfloor\frac{32 + 2\times 1 - 3}{2}\right\rfloor + 1 = \lfloor 15.5 \rfloor + 1 = 16 \implies \text{Shape} = 16 \times 16 \times 128`,
        },
        {
          title: '第 2 步：计算总可学习参数量（别漏掉 +1 偏置！）',
          explanation: '每个 3×3 卷积核实际是三维块 3 × 3 × C_in = 3 × 3 × 64，再加 1 个偏置标量，共 128 个核：',
          latex: String.raw`\text{Params} = (3 \times 3 \times 64 + 1) \times 128 = 577 \times 128 = 73{,}856`,
        },
        {
          title: '第 3 步：计算总浮点乘法次数（每个输出单元做一次内积）',
          explanation: '输出共有 16 × 16 × 128 = 32,768 个神经元，每个神经元的净输入需要做 3 × 3 × 64 = 576 次乘法（加偏置不算乘法）：',
          latex: String.raw`\text{Mults} = (16 \times 16 \times 128) \times (3 \times 3 \times 64) = 32{,}768 \times 576 = 18{,}874{,}368 \approx 18.87\text{ M}`,
        },
      ],
      keyTakeaway:
        '牢记两句防坑口诀：① 算参数量时每个卷积核要乘 C_in 再 +1（Bias），且与 H×W 无关；② 算乘法次数时不含 +1 Bias，且要乘输出总像素数 H_out × W_out × C_out！',
    },
  ],
  3: [
    {
      id: 'we-p3-attn-hand',
      tag: '高频手算 · Self-Attention 矩阵',
      title: '当 W_Q 从单位阵改为置换阵时，Self-Attention 权重如何变化？',
      problem:
        '设输入为 2 个 2 维词向量 x₁ = [1, 0]、x₂ = [0, 1]，令 W_K = W_V = I（单位阵，且省略 √2 缩放便于口算）。分别计算：(a) W_Q = I 与 (b) W_Q = [[0,1],[1,0]] 时，词 1 的注意力权重与输出向量 z₁。',
      problemLatex: String.raw`X = \begin{bmatrix}1 & 0\\ 0 & 1\end{bmatrix}, \quad W_K = W_V = I, \quad W_Q^{(a)} = \begin{bmatrix}1 & 0\\ 0 & 1\end{bmatrix}, \quad W_Q^{(b)} = \begin{bmatrix}0 & 1\\ 1 & 0\end{bmatrix}`,
      steps: [
        {
          title: '情况 (a)：W_Q = I（同类自关注）',
          explanation: '此时 q₁ = x₁ = [1, 0]，与 k₁=[1,0] 内积为 1，与 k₂=[0,1] 内积为 0：',
          latex: String.raw`\text{scores}_1 = [1, 0] \xrightarrow{\text{softmax}} \alpha_1 = \left[\frac{e}{e+1}, \frac{1}{e+1}\right] \approx [0.731, 0.269] \implies z_1 = [0.731, 0.269]`,
        },
        {
          title: '情况 (b)：W_Q = [[0,1],[1,0]]（跨特征互补关注！）',
          explanation: '置换矩阵把 q₁ 旋转成 [0, 1]！它反而和 k₂=[0,1] 完美对齐（内积 1），和自身 k₁ 内积为 0：',
          latex: String.raw`\text{scores}_1 = [0, 1] \xrightarrow{\text{softmax}} \alpha_1 \approx [0.269, 0.731] \implies z_1 = [0.269, 0.731]`,
        },
      ],
      keyTakeaway:
        '这正是引入独立可学习投影 W_Q, W_K 的魔力：如果只算 x_i·x_j，每个词永远最关注自己；有了 W_Q ≠ W_K，不同的 Attention Head 就能自由学会“让代词去关注名词”“让动词去关注宾语”等非对称关系！',
    },
  ],
  4: [
    {
      id: 'we-p4-flow-check',
      tag: '高频推导 · Flow Matching 与 DDPM',
      title: '验证线性插值 Flow Matching 的条件速度场为何是常向量',
      problem:
        '设噪声起点 x₀ ~ N(0, I)，目标数据点 x₁ ~ p_data，定义线性插值路径 x_t = (1 − t)x₀ + t x₁（t ∈ [0, 1]）。求条件速度场 u_t(x_t | x₀, x₁) 并说明为何推理比 DDPM 步数少得多。',
      problemLatex: String.raw`\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\mathbf{x}_1, \quad t \in [0, 1]`,
      steps: [
        {
          title: '对时间 t 求导得到精确条件速度场',
          explanation: '对线性插值公式两边关于 t 直接求微分：',
          latex: String.raw`u_t(\mathbf{x}_t \mid \mathbf{x}_0, \mathbf{x}_1) = \frac{d\mathbf{x}_t}{dt} = -\mathbf{x}_0 + \mathbf{x}_1 = \mathbf{x}_1 - \mathbf{x}_0`,
        },
        {
          title: '构造边际速度场回归损失',
          explanation: '虽然单个样本对的速度 (x₁ − x₀) 已知，但推理时不知道 x₁；训练神经网络 v_θ(x_t, t) 最小化均方误差，数学上可证明其全局最优解恰好等于条件期望速度场 E[x₁ − x₀ | x_t]：',
          latex: String.raw`\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t,\mathbf{x}_0,\mathbf{x}_1}\!\big[\|v_\theta(\mathbf{x}_t, t) - (\mathbf{x}_1 - \mathbf{x}_0)\|^2\big]`,
        },
        {
          title: '从 t=0 到 t=1 执行少量 Euler 步即可采样',
          explanation: '因为路径近似直线（曲率极小），用 Δt = 1/N 做确定性 ODE 积分 x_{t+Δt} = x_t + Δt · v_θ(x_t, t) 时截断误差极低，10–25 步即可媲美 DDPM 几百步的质量！',
        },
      ],
      keyTakeaway:
        '考试遇到 Flow Matching 四要素题，按「随机采 t,x₀,x₁ → 线性插值 x_t → 网络输出速度 v_θ(x_t,t) → 回归直线真速度 (x₁−x₀)」四步作答滴水不漏！',
    },
  ],
  5: [
    {
      id: 'we-p5-td-ppo',
      tag: '高频手算 · TD 更新 & PPO 裁剪',
      title: '单步 Q-Learning TD 更新与 PPO 裁剪梯度判定',
      problem:
        '① 某状态 Q(s, a) = 4.0，执行动作 a 得到奖励 r = +2.0 并进入新状态 s′，已知 max_{a′} Q(s′, a′) = 10.0，折扣 γ = 0.9，学习率 α = 0.5。求更新后的 Q(s, a)。② 在 PPO 中设 ε = 0.2，若某好动作 Â_t = +1.5 且新旧策略比 r_t(θ) = 1.35，此时目标函数对 θ 的梯度是多少？',
      steps: [
        {
          title: '计算 Q-Learning 的 TD Target 与 TD Error',
          explanation: '先算一步前瞻目标 r + γ max Q(s′, a′)，再减去旧估计值 Q(s, a)：',
          latex: String.raw`\text{TD Target} = 2.0 + 0.9 \times 10.0 = 11.0, \qquad \delta = 11.0 - 4.0 = +7.0`,
        },
        {
          title: '按学习率 α = 0.5 更新 Q(s, a)',
          explanation: '把旧 Q 值向 TD Target 挪动 50%：',
          latex: String.raw`Q_{\text{new}}(s, a) = 4.0 + 0.5 \times 7.0 = 7.5`,
        },
        {
          title: '判定 PPO Clipped Objective 是否截断梯度',
          explanation: '因为 r_t = 1.35 > 1 + ε = 1.20 且 Â_t = +1.5 > 0：未裁剪项 1.35×1.5 = 2.025，裁剪项 1.20×1.5 = 1.80。取 min 得常数 1.80：',
          latex: String.raw`L^{\text{CLIP}}(\theta) = \min(2.025,\; 1.80) = 1.80 \implies \nabla_\theta L^{\text{CLIP}}(\theta) = \mathbf{0}`,
        },
      ],
      keyTakeaway:
        'PPO 的 min 裁剪只在「已经朝有利方向迈出超过 ε 步」时把梯度置零刹车；如果把好动作改差（r_t < 1 − ε），min 会选中未裁剪项 r_t Â_t，梯度依然生效并强力纠偏！',
    },
  ],
};
