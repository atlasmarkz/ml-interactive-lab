import { QuizQuestion } from '../../types/review';

const r = String.raw;

/**
 * Generated WA-style multi-part calculation drills (original numbers).
 * Produced by scripts/wa/gen_wa.py and re-checked by scripts/wa/verify_wa.py; edit the generator, not the numbers.
 */
export const WA_DRILLS: Record<string, QuizQuestion[]> = {
  'l01': [
    {
      id: 'l01-wa1', kind: 'calc',
      prompt: r`对数据（格式 $(x_1, x_2;\ y)$）$(0, 0;\ 1)$，$(0, 1;\ 3)$，$(1, 0;\ 2)$，$(1, 1;\ 5)$，$(2, 1;\ 6)$ 做含截距的线性回归 $y = w_0 + w_1x_1 + w_2x_2$。(a) 写出 $\mathbf{X}^\top\mathbf{X}$ 与 $\mathbf{X}^\top\mathbf{y}$；(b) 手算 OLS 解；(c) 给出拟合值。`,
      answer: r`(a) $$\mathbf{X}^\top\mathbf{X} = \begin{pmatrix}5 & 4 & 3\\4 & 6 & 3\\3 & 3 & 3\end{pmatrix},\quad \mathbf{X}^\top\mathbf{y} = (17, 19, 14)^\top$$ (b) $\hat{\mathbf{w}} = (\tfrac{4}{5}, \tfrac{7}{5}, \tfrac{37}{15})$；(c) 拟合值 $(\tfrac{4}{5}, \tfrac{49}{15}, \tfrac{11}{5}, \tfrac{14}{3}, \tfrac{91}{15})$`,
      explanation: r`解正规方程 $\mathbf{X}^\top\mathbf{X}\mathbf{w} = \mathbf{X}^\top\mathbf{y}$（3 个未知数、3 个方程，用消元法）。检查：含截距时残差之和应为 0，这里残差 $(\tfrac{1}{5}, -\tfrac{4}{15}, -\tfrac{1}{5}, \tfrac{1}{3}, -\tfrac{1}{15})$ 之和为 0。`,
      style: 'WA1 Q1 题型',
    },
    {
      id: 'l01-wa2', kind: 'calc',
      prompt: r`对数据（格式 $(x_1, x_2;\ y)$）$(1, 0;\ 3)$，$(0, 1;\ 1)$，$(1, 1;\ 4)$，$(2, 0;\ 5)$，$(0, 2;\ 2)$ 做含截距的线性回归 $y = w_0 + w_1x_1 + w_2x_2$。(a) 写出 $\mathbf{X}^\top\mathbf{X}$ 与 $\mathbf{X}^\top\mathbf{y}$；(b) 手算 OLS 解；(c) 给出拟合值。`,
      answer: r`(a) $$\mathbf{X}^\top\mathbf{X} = \begin{pmatrix}5 & 4 & 4\\4 & 6 & 1\\4 & 1 & 6\end{pmatrix},\quad \mathbf{X}^\top\mathbf{y} = (15, 17, 9)^\top$$ (b) $\hat{\mathbf{w}} = (\tfrac{1}{3}, \tfrac{37}{15}, \tfrac{13}{15})$；(c) 拟合值 $(\tfrac{14}{5}, \tfrac{6}{5}, \tfrac{11}{3}, \tfrac{79}{15}, \tfrac{31}{15})$`,
      explanation: r`解正规方程 $\mathbf{X}^\top\mathbf{X}\mathbf{w} = \mathbf{X}^\top\mathbf{y}$（3 个未知数、3 个方程，用消元法）。检查：含截距时残差之和应为 0，这里残差 $(\tfrac{1}{5}, -\tfrac{1}{5}, \tfrac{1}{3}, -\tfrac{4}{15}, -\tfrac{1}{15})$ 之和为 0。`,
      style: 'WA1 Q1 题型',
    },
    {
      id: 'l01-wa3', kind: 'calc',
      prompt: r`对数据（格式 $(x_1, x_2;\ y)$）$(0, 0;\ 2)$，$(1, 0;\ 4)$，$(0, 1;\ 1)$，$(1, 1;\ 4)$ 做含截距的线性回归 $y = w_0 + w_1x_1 + w_2x_2$。(a) 写出 $\mathbf{X}^\top\mathbf{X}$ 与 $\mathbf{X}^\top\mathbf{y}$；(b) 手算 OLS 解；(c) 给出拟合值。`,
      answer: r`(a) $$\mathbf{X}^\top\mathbf{X} = \begin{pmatrix}4 & 2 & 2\\2 & 2 & 1\\2 & 1 & 2\end{pmatrix},\quad \mathbf{X}^\top\mathbf{y} = (11, 8, 5)^\top$$ (b) $\hat{\mathbf{w}} = (\tfrac{7}{4}, \tfrac{5}{2}, -\tfrac{1}{2})$；(c) 拟合值 $(\tfrac{7}{4}, \tfrac{17}{4}, \tfrac{5}{4}, \tfrac{15}{4})$`,
      explanation: r`解正规方程 $\mathbf{X}^\top\mathbf{X}\mathbf{w} = \mathbf{X}^\top\mathbf{y}$（3 个未知数、3 个方程，用消元法）。检查：含截距时残差之和应为 0，这里残差 $(\tfrac{1}{4}, -\tfrac{1}{4}, -\tfrac{1}{4}, \tfrac{1}{4})$ 之和为 0。`,
      style: 'WA1 Q1 题型',
    },
    {
      id: 'l01-wa-r1', kind: 'calc',
      prompt: r`三个点 $(0, 2)$，$(1, 1)$，$(2, 3)$。最小化 $\frac13\sum_i (y_i - w_0 - w_1x_i)^2 + \lambda\,R(\mathbf{w})$，分别求下列四种方案的 $(w_0, w_1)$：只惩罚 $w_1$（$R = w_1^2$），$\lambda = 1$ 与 $\lambda = 10$；同时惩罚两者（$R = w_0^2 + w_1^2$），$\lambda = 1$ 与 $\lambda = 10$。再与不加正则化的 OLS 比较。`,
      answer: r`只惩罚 $w_1$：$\lambda = 1$ 时 $(1.8000, 0.2000)$，$\lambda = 10$ 时 $(1.9688, 0.0313)$；惩罚两者：$\lambda = 1$ 时 $(0.6923, 0.6154)$，$\lambda = 10$ 时 $(0.1649, 0.1859)$；OLS 为 $(1.5000, 0.5000)$`,
      explanation: r`令梯度为 0 得 $\big(\tfrac13\mathbf{X}^\top\mathbf{X} + \lambda\mathbf{D}\big)\mathbf{w} = \tfrac13\mathbf{X}^\top\mathbf{y}$，只惩罚斜率时 $\mathbf{D} = \mathrm{diag}(0, 1)$，两者都惩罚时 $\mathbf{D} = \mathbf{I}$。这里 $\tfrac13\mathbf{X}^\top\mathbf{X} = \begin{pmatrix}1.0000 & 1.0000\\1.0000 & 1.6667\end{pmatrix}$，$\tfrac13\mathbf{X}^\top\mathbf{y} = (2.0000, 2.3333)^\top$。规律：只惩罚斜率时截距向 $\bar y$ 靠拢、直线变平；同时惩罚截距时整条线被拉向原点。`,
      style: 'WA1 Q2 题型',
    },
    {
      id: 'l01-wa-r2', kind: 'calc',
      prompt: r`三个点 $(0, 0)$，$(1, 2)$，$(2, 1)$。最小化 $\frac13\sum_i (y_i - w_0 - w_1x_i)^2 + \lambda\,R(\mathbf{w})$，分别求下列四种方案的 $(w_0, w_1)$：只惩罚 $w_1$（$R = w_1^2$），$\lambda = 1$ 与 $\lambda = 10$；同时惩罚两者（$R = w_0^2 + w_1^2$），$\lambda = 1$ 与 $\lambda = 10$。再与不加正则化的 OLS 比较。`,
      answer: r`只惩罚 $w_1$：$\lambda = 1$ 时 $(0.8000, 0.2000)$，$\lambda = 10$ 时 $(0.9688, 0.0312)$；惩罚两者：$\lambda = 1$ 时 $(0.3077, 0.3846)$，$\lambda = 10$ 时 $(0.0812, 0.1073)$；OLS 为 $(0.5000, 0.5000)$`,
      explanation: r`令梯度为 0 得 $\big(\tfrac13\mathbf{X}^\top\mathbf{X} + \lambda\mathbf{D}\big)\mathbf{w} = \tfrac13\mathbf{X}^\top\mathbf{y}$，只惩罚斜率时 $\mathbf{D} = \mathrm{diag}(0, 1)$，两者都惩罚时 $\mathbf{D} = \mathbf{I}$。这里 $\tfrac13\mathbf{X}^\top\mathbf{X} = \begin{pmatrix}1.0000 & 1.0000\\1.0000 & 1.6667\end{pmatrix}$，$\tfrac13\mathbf{X}^\top\mathbf{y} = (1.0000, 1.3333)^\top$。规律：只惩罚斜率时截距向 $\bar y$ 靠拢、直线变平；同时惩罚截距时整条线被拉向原点。`,
      style: 'WA1 Q2 题型',
    },
  ],
  'l02-1': [
    {
      id: 'l02-1-wa1', kind: 'calc',
      prompt: r`数据 $(x_1, x_2;\ y)$：$(0, 0;\ 0)$，$(0, 1;\ 1)$，$(1, 0;\ 1)$，$(1, 1;\ 1)$。模型 $p(y = 1|\mathbf{x}) = \sigma(w_0 + w_1x_1 + w_2x_2)$，初值 $\mathbf{w} = (-1, 1, 1)$，学习率 $\eta = 0.5$。按 $w_j \leftarrow w_j + \frac{\eta}{N}\sum_i\big(y_i - \sigma(z_i)\big)x_{i,j}$ 做一次 batch 梯度下降，求新权重以及更新前后的训练错误率（以 $z > 0$ 判为 1）。`,
      answer: r`新权重 $\mathbf{w} = (-0.8750, 1.0961, 1.0961)$；训练错误率：更新前 50% → 更新后 0%`,
      explanation: r`$x^{(1)}$: $z = -1.0000$, $\sigma = 0.2689$, $y - \sigma = -0.2689$；$x^{(2)}$: $z = 0.0000$, $\sigma = 0.5000$, $y - \sigma = 0.5000$；$x^{(3)}$: $z = 0.0000$, $\sigma = 0.5000$, $y - \sigma = 0.5000$；$x^{(4)}$: $z = 1.0000$, $\sigma = 0.7311$, $y - \sigma = 0.2689$。梯度项 $\sum_i (y_i - \sigma_i)\mathbf{x}_i = (1.0000, 0.7689, 0.7689)$，乘以 $\eta/N = 0.125$ 后加到 $\mathbf{w}$ 上。更新后的 logits 为 $(-0.8750, 0.2211, 0.2211, 1.3172)$，预测 $(0, 1, 1, 1)$。`,
      style: 'WA1 Q3 题型',
    },
    {
      id: 'l02-1-wa2', kind: 'calc',
      prompt: r`数据 $(x_1, x_2;\ y)$：$(0, 0;\ 0)$，$(0, 1;\ 0)$，$(1, 0;\ 1)$，$(1, 1;\ 1)$。模型 $p(y = 1|\mathbf{x}) = \sigma(w_0 + w_1x_1 + w_2x_2)$，初值 $\mathbf{w} = (0.5, -1, 0.5)$，学习率 $\eta = 1.0$。按 $w_j \leftarrow w_j + \frac{\eta}{N}\sum_i\big(y_i - \sigma(z_i)\big)x_{i,j}$ 做一次 batch 梯度下降，求新权重以及更新前后的训练错误率（以 $z > 0$ 判为 1）。`,
      answer: r`新权重 $\mathbf{w} = (0.4422, -0.7194, 0.4422)$；训练错误率：更新前 100% → 更新后 75%`,
      explanation: r`$x^{(1)}$: $z = 0.5000$, $\sigma = 0.6225$, $y - \sigma = -0.6225$；$x^{(2)}$: $z = 1.0000$, $\sigma = 0.7311$, $y - \sigma = -0.7311$；$x^{(3)}$: $z = -0.5000$, $\sigma = 0.3775$, $y - \sigma = 0.6225$；$x^{(4)}$: $z = 0.0000$, $\sigma = 0.5000$, $y - \sigma = 0.5000$。梯度项 $\sum_i (y_i - \sigma_i)\mathbf{x}_i = (-0.2311, 1.1225, -0.2311)$，乘以 $\eta/N = 0.25$ 后加到 $\mathbf{w}$ 上。更新后的 logits 为 $(0.4422, 0.8845, -0.2771, 0.1651)$，预测 $(1, 1, 0, 1)$。`,
      style: 'WA1 Q3 题型',
    },
    {
      id: 'l02-1-wa3', kind: 'calc',
      prompt: r`数据 $(x_1, x_2;\ y)$：$(1, 2;\ 1)$，$(2, 0;\ 1)$，$(0, 1;\ 0)$，$(2, 2;\ 1)$。模型 $p(y = 1|\mathbf{x}) = \sigma(w_0 + w_1x_1 + w_2x_2)$，初值 $\mathbf{w} = (0, 0.5, -0.5)$，学习率 $\eta = 0.4$。按 $w_j \leftarrow w_j + \frac{\eta}{N}\sum_i\big(y_i - \sigma(z_i)\big)x_{i,j}$ 做一次 batch 梯度下降，求新权重以及更新前后的训练错误率（以 $z > 0$ 判为 1）。`,
      answer: r`新权重 $\mathbf{w} = (0.1014, 0.7160, -0.3133)$；训练错误率：更新前 50% → 更新后 0%`,
      explanation: r`$x^{(1)}$: $z = -0.5000$, $\sigma = 0.3775$, $y - \sigma = 0.6225$；$x^{(2)}$: $z = 1.0000$, $\sigma = 0.7311$, $y - \sigma = 0.2689$；$x^{(3)}$: $z = -0.5000$, $\sigma = 0.3775$, $y - \sigma = -0.3775$；$x^{(4)}$: $z = 0.0000$, $\sigma = 0.5000$, $y - \sigma = 0.5000$。梯度项 $\sum_i (y_i - \sigma_i)\mathbf{x}_i = (1.0139, 2.1603, 1.8674)$，乘以 $\eta/N = 0.1$ 后加到 $\mathbf{w}$ 上。更新后的 logits 为 $(0.1909, 1.5335, -0.2119, 0.9069)$，预测 $(1, 1, 0, 1)$。`,
      style: 'WA1 Q3 题型',
    },
    {
      id: 'l02-1-wa-m1', kind: 'calc',
      prompt: r`四个点的标签为 $(0, 0)\to 1$，$(0, 1)\to 0$，$(1, 0)\to 0$，$(1, 1)\to 0$。(a) 只用 $x_1, x_2$ 的 Logistic 回归，最小训练错误率是多少？给出达到它的权重。(b) 加入特征 $x_1x_2$ 后呢？`,
      answer: r`只用 $x_1, x_2$ 即可达到 0 错误，例如 $\mathbf{w} = (0.5, -1, -1)$；加入 $x_1x_2$ 后仍为 0`,
      explanation: r`只有 (0,0) 为正：一条直线就能分开（NOR 模式）。代入四个点的 logits 为 $(0.5, -0.5, -0.5, -1.5)$，只有第一个为正，与标签一致。`,
      style: 'WA1 Q4 题型',
    },
    {
      id: 'l02-1-wa-m2', kind: 'calc',
      prompt: r`四个点的标签为 $(0, 0)\to 0$，$(0, 1)\to 1$，$(1, 0)\to 1$，$(1, 1)\to 0$。(a) 只用 $x_1, x_2$ 的 Logistic 回归，最小训练错误率是多少？给出达到它的权重。(b) 加入特征 $x_1x_2$ 后呢？`,
      answer: r`只用原始特征最少错 25%（例如 $\mathbf{w} = (-0.5, 1, 1)$，错 1 个点）；加入 $x_1x_2$ 后可降到 0%，例如 $\mathbf{w} = (-0.5, 1, 1, -2)$`,
      explanation: r`XOR 模式不可线性分开：若四个点都分对，需要 $w_0 < 0$、$w_0 + w_1 > 0$、$w_0 + w_2 > 0$、$w_0 + w_1 + w_2 < 0$；把中间两式相加得 $2w_0 + w_1 + w_2 > 0$，把首尾两式相加得 $2w_0 + w_1 + w_2 < 0$，矛盾。带交叉项的 logits 为 $(-0.5, 0.5, 0.5, -0.5)$，符号与标签完全一致。`,
      style: 'WA1 Q4 题型',
    },
    {
      id: 'l02-1-wa-g1', kind: 'calc',
      prompt: r`$p = \mathcal{N}(1, 1^2)$，$q = \mathcal{N}(3, 2^2)$。计算 $D_{\mathrm{KL}}(p\|q)$、$H(p, q)$ 与 $H(p)$（自然对数，4 位小数），并验证三者的关系。`,
      answer: r`$D_{\mathrm{KL}}(p\|q) = 0.8181$，$H(p,q) = 2.2371$，$H(p) = 1.4189$，且 $1.4189 + 0.8181 = 2.2371 = H(p,q)$`,
      explanation: r`$D_{\mathrm{KL}} = \ln\frac{\sigma_2}{\sigma_1} + \frac{\sigma_1^2 + (\mu_1-\mu_2)^2}{2\sigma_2^2} - \frac12$；$H(p,q) = \frac12\ln(2\pi\sigma_2^2) + \frac{\sigma_1^2 + (\mu_1-\mu_2)^2}{2\sigma_2^2}$；$H(p) = \frac12\ln(2\pi e\sigma_1^2)$。`,
      style: 'WA1 Q6 题型',
    },
    {
      id: 'l02-1-wa-g2', kind: 'calc',
      prompt: r`$p = \mathcal{N}(0, 2^2)$，$q = \mathcal{N}(0, 1^2)$。计算 $D_{\mathrm{KL}}(p\|q)$、$H(p, q)$ 与 $H(p)$（自然对数，4 位小数），并验证三者的关系。`,
      answer: r`$D_{\mathrm{KL}}(p\|q) = 0.8069$，$H(p,q) = 2.9189$，$H(p) = 2.1121$，且 $2.1121 + 0.8069 = 2.9189 = H(p,q)$`,
      explanation: r`$D_{\mathrm{KL}} = \ln\frac{\sigma_2}{\sigma_1} + \frac{\sigma_1^2 + (\mu_1-\mu_2)^2}{2\sigma_2^2} - \frac12$；$H(p,q) = \frac12\ln(2\pi\sigma_2^2) + \frac{\sigma_1^2 + (\mu_1-\mu_2)^2}{2\sigma_2^2}$；$H(p) = \frac12\ln(2\pi e\sigma_1^2)$。`,
      style: 'WA1 Q6 题型',
    },
  ],
  'l04': [
    {
      id: 'l04-wa1', kind: 'calc',
      prompt: r`网络：输入 $(x_1, x_2)$ → 两个 tanh 隐藏单元 $u_{11}, u_{12}$ → 两个 tanh 隐藏单元 $u_{21}, u_{22}$ → 一个 sigmoid 输出，均无偏置。权重矩阵行表示来源、列表示去向：$\mathbf{W}^{(1)} = \begin{pmatrix}1 & -1\\0.5 & 1\end{pmatrix}$，$\mathbf{W}^{(2)} = \begin{pmatrix}1 & -1\\1 & 1\end{pmatrix}$，$\mathbf{w}^{(3)} = (1, -1)$。训练样本 $(x_1, x_2, y) = (2, 1, 1)$，损失 $L = -\log p(y|\mathbf{x})$。(a) 求所有隐藏单元输出、logit $z$ 与 $p(y=1|\mathbf{x})$；(b) 求输出误差 $\partial L/\partial z$ 与所有隐藏单元的误差 $\partial L/\partial a$；(c) 求 $\partial L/\partial w^{(2)}_{21}$ 与 $\partial L/\partial w^{(1)}_{12}$，为减小损失应增大还是减小它们？`,
      answer: r`(a) 第一层 $\mathbf{u}_1 = (0.9866, -0.7616)$，第二层 $\mathbf{u}_2 = (0.2213, -0.9412)$，$z = 1.1625$，$p(y=1|\mathbf{x}) = 0.7618$，$L = 0.2721$；(b) $\partial L/\partial z = -0.2382$，第二层误差 $(-0.2266, 0.0272)$，第一层误差 $(-0.0067, -0.0837)$；(c) $\partial L/\partial w^{(2)}_{21} = 0.1725$（应减小），$\partial L/\partial w^{(1)}_{12} = -0.1674$（应增大）`,
      explanation: r`前向：$\mathbf{a}_1 = \mathbf{x}^\top\mathbf{W}^{(1)} = (2.5000, -1.0000)$，$\mathbf{a}_2 = \mathbf{u}_1^\top\mathbf{W}^{(2)} = (0.2250, -1.7482)$。反向：sigmoid + 交叉熵给出 $\partial L/\partial z = p - y$；第二层 $\delta_{2j} = \frac{\partial L}{\partial z}w^{(3)}_j(1 - u_{2j}^2)$；第一层 $\delta_{1i} = (1 - u_{1i}^2)\sum_j w^{(2)}_{ij}\delta_{2j}$。某权重的梯度 = 它的来源激活 × 去向单元的误差；梯度下降朝负梯度方向移动。`,
      style: 'WA2 Q3 题型',
    },
    {
      id: 'l04-wa2', kind: 'calc',
      prompt: r`网络：输入 $(x_1, x_2)$ → 两个 tanh 隐藏单元 $u_{11}, u_{12}$ → 两个 tanh 隐藏单元 $u_{21}, u_{22}$ → 一个 sigmoid 输出，均无偏置。权重矩阵行表示来源、列表示去向：$\mathbf{W}^{(1)} = \begin{pmatrix}0.5 & 1\\-1 & 0.5\end{pmatrix}$，$\mathbf{W}^{(2)} = \begin{pmatrix}1 & 1\\-1 & 1\end{pmatrix}$，$\mathbf{w}^{(3)} = (-1, 2)$。训练样本 $(x_1, x_2, y) = (1, -1, 0)$，损失 $L = -\log p(y|\mathbf{x})$。(a) 求所有隐藏单元输出、logit $z$ 与 $p(y=1|\mathbf{x})$；(b) 求输出误差 $\partial L/\partial z$ 与所有隐藏单元的误差 $\partial L/\partial a$；(c) 求 $\partial L/\partial w^{(2)}_{12}$ 与 $\partial L/\partial w^{(1)}_{21}$，为减小损失应增大还是减小它们？`,
      answer: r`(a) 第一层 $\mathbf{u}_1 = (0.9051, 0.4621)$，第二层 $\mathbf{u}_2 = (0.4162, 0.8781)$，$z = 1.3400$，$p(y=1|\mathbf{x}) = 0.7925$，$L = 1.5726$；(b) $\partial L/\partial z = 0.7925$，第二层误差 $(-0.6552, 0.3630)$，第一层误差 $(-0.0528, 0.8008)$；(c) $\partial L/\partial w^{(2)}_{12} = 0.3285$（应减小），$\partial L/\partial w^{(1)}_{21} = 0.0528$（应减小）`,
      explanation: r`前向：$\mathbf{a}_1 = \mathbf{x}^\top\mathbf{W}^{(1)} = (1.5000, 0.5000)$，$\mathbf{a}_2 = \mathbf{u}_1^\top\mathbf{W}^{(2)} = (0.4430, 1.3673)$。反向：sigmoid + 交叉熵给出 $\partial L/\partial z = p - y$；第二层 $\delta_{2j} = \frac{\partial L}{\partial z}w^{(3)}_j(1 - u_{2j}^2)$；第一层 $\delta_{1i} = (1 - u_{1i}^2)\sum_j w^{(2)}_{ij}\delta_{2j}$。某权重的梯度 = 它的来源激活 × 去向单元的误差；梯度下降朝负梯度方向移动。`,
      style: 'WA2 Q3 题型',
    },
    {
      id: 'l04-wa3', kind: 'calc',
      prompt: r`网络：输入 $(x_1, x_2)$ → 两个 tanh 隐藏单元 $u_{11}, u_{12}$ → 两个 tanh 隐藏单元 $u_{21}, u_{22}$ → 一个 sigmoid 输出，均无偏置。权重矩阵行表示来源、列表示去向：$\mathbf{W}^{(1)} = \begin{pmatrix}-1 & 1\\1 & 0.25\end{pmatrix}$，$\mathbf{W}^{(2)} = \begin{pmatrix}0.5 & -1\\1 & 1\end{pmatrix}$，$\mathbf{w}^{(3)} = (2, 1)$。训练样本 $(x_1, x_2, y) = (0.5, 2, 1)$，损失 $L = -\log p(y|\mathbf{x})$。(a) 求所有隐藏单元输出、logit $z$ 与 $p(y=1|\mathbf{x})$；(b) 求输出误差 $\partial L/\partial z$ 与所有隐藏单元的误差 $\partial L/\partial a$；(c) 求 $\partial L/\partial w^{(3)}_{2}$ 与 $\partial L/\partial w^{(1)}_{22}$，为减小损失应增大还是减小它们？`,
      answer: r`(a) 第一层 $\mathbf{u}_1 = (0.9051, 0.7616)$，第二层 $\mathbf{u}_2 = (0.8379, -0.1426)$，$z = 1.5333$，$p(y=1|\mathbf{x}) = 0.8225$，$L = 0.1954$；(b) $\partial L/\partial z = -0.1775$，第二层误差 $(-0.1058, -0.1739)$，第一层误差 $(0.0219, -0.1175)$；(c) $\partial L/\partial w^{(3)}_{2} = 0.0253$（应减小），$\partial L/\partial w^{(1)}_{22} = -0.2349$（应增大）`,
      explanation: r`前向：$\mathbf{a}_1 = \mathbf{x}^\top\mathbf{W}^{(1)} = (1.5000, 1.0000)$，$\mathbf{a}_2 = \mathbf{u}_1^\top\mathbf{W}^{(2)} = (1.2142, -0.1436)$。反向：sigmoid + 交叉熵给出 $\partial L/\partial z = p - y$；第二层 $\delta_{2j} = \frac{\partial L}{\partial z}w^{(3)}_j(1 - u_{2j}^2)$；第一层 $\delta_{1i} = (1 - u_{1i}^2)\sum_j w^{(2)}_{ij}\delta_{2j}$。某权重的梯度 = 它的来源激活 × 去向单元的误差；梯度下降朝负梯度方向移动。`,
      style: 'WA2 Q3 题型',
    },
  ],
  'l03': [
    {
      id: 'l03-wa1', kind: 'calc',
      prompt: r`5 个回归模型在相互独立、同分布的训练集上训练，每个模型的方差分量为 2。(a) 平均这 5 个模型后的方差分量？(b) 若模型两两相关系数为 0.25（每个方差仍为 2），平均后的方差分量？(c) 后一种情况下，平均无穷多个模型的极限是多少？`,
      answer: r`(a) $2/5 = 0.4$；(b) $0.25\times2 + \frac{0.75}{5}\times2 = 0.5 + 0.3 = 0.8$；(c) $\rho\sigma^2 = 0.5$`,
      explanation: r`$\mathrm{Var}\big(\frac1K\sum_k h_k\big) = \frac{1}{K^2}\big[K\sigma^2 + K(K-1)\rho\sigma^2\big] = \rho\sigma^2 + \frac{1-\rho}{K}\sigma^2$。相关部分无法靠平均消除，这就是 bagging / 随机森林要降低模型间相关性的原因。`,
      style: 'WA2 Question X 题型',
    },
  ],
  'l06': [
    {
      id: 'l06-wa1', kind: 'calc',
      prompt: r`图像 $X = \begin{pmatrix}2 & 0 & 1 & 3 & 1\\1 & 4 & 2 & 0 & 2\\3 & 1 & 5 & 2 & 0\\0 & 2 & 1 & 4 & 3\\1 & 3 & 0 & 1 & 2\end{pmatrix}$，滤波器 $F = \begin{pmatrix}-1 & -1 & -1\\-1 & 8 & -1\\-1 & -1 & -1\end{pmatrix}$，步长 1、无填充，偏置 $b = -3$，激活 ReLU。输出 $Y$ 是 3×3，按行记为 $\begin{pmatrix}a&b&c\\d&e&f\\g&h&i\end{pmatrix}$。求 $a, b, e, f$（再试着写出完整的 $Y$）。`,
      answer: r`$a = 14, b = 0, e = 21, f = 0$；完整输出 $$Y = \begin{pmatrix}14 & 0 & 0\\0 & 21 & 0\\0 & 0 & 15\end{pmatrix}$$`,
      explanation: r`对每个 3×3 窗口逐元素相乘再求和（互相关，不翻转核），加偏置后过 ReLU：$a = \max(0, 17 - 3) = 14;\ b = \max(0, 0 - 3) = 0;\ e = \max(0, 24 - 3) = 21;\ f = \max(0, -1 - 3) = 0$。负的净输入在 ReLU 后变为 0。`,
      style: 'WA3 Q1 题型',
    },
    {
      id: 'l06-wa2', kind: 'calc',
      prompt: r`图像 $X = \begin{pmatrix}1 & 2 & 0 & 1 & 3\\0 & 1 & 3 & 2 & 1\\2 & 0 & 1 & 4 & 2\\3 & 1 & 2 & 0 & 1\\1 & 4 & 0 & 2 & 2\end{pmatrix}$，滤波器 $F = \begin{pmatrix}1 & 0 & -1\\2 & 0 & -2\\1 & 0 & -1\end{pmatrix}$，步长 1、无填充，偏置 $b = 1$，激活 ReLU。输出 $Y$ 是 3×3，按行记为 $\begin{pmatrix}a&b&c\\d&e&f\\g&h&i\end{pmatrix}$。求 $a, b, e, f$（再试着写出完整的 $Y$）。`,
      answer: r`$a = 0, b = 0, e = 0, f = 2$；完整输出 $$Y = \begin{pmatrix}0 & 0 & 1\\1 & 0 & 2\\5 & 1 & 0\end{pmatrix}$$`,
      explanation: r`对每个 3×3 窗口逐元素相乘再求和（互相关，不翻转核），加偏置后过 ReLU：$a = \max(0, -4 + 1) = 0;\ b = \max(0, -5 + 1) = 0;\ e = \max(0, -8 + 1) = 0;\ f = \max(0, 1 + 1) = 2$。负的净输入在 ReLU 后变为 0。`,
      style: 'WA3 Q1 题型',
    },
    {
      id: 'l06-wa3', kind: 'calc',
      prompt: r`图像 $X = \begin{pmatrix}3 & 1 & 2 & 0 & 1\\2 & 0 & 1 & 3 & 2\\1 & 2 & 4 & 1 & 0\\0 & 3 & 1 & 2 & 1\\2 & 1 & 0 & 1 & 3\end{pmatrix}$，滤波器 $F = \begin{pmatrix}0 & 1 & 0\\1 & -4 & 1\\0 & 1 & 0\end{pmatrix}$，步长 1、无填充，偏置 $b = 2$，激活 ReLU。输出 $Y$ 是 3×3，按行记为 $\begin{pmatrix}a&b&c\\d&e&f\\g&h&i\end{pmatrix}$。求 $a, b, e, f$（再试着写出完整的 $Y$）。`,
      answer: r`$a = 8, b = 7, e = 0, f = 7$；完整输出 $$Y = \begin{pmatrix}8 & 7 & 0\\2 & 0 & 7\\0 & 7 & 0\end{pmatrix}$$`,
      explanation: r`对每个 3×3 窗口逐元素相乘再求和（互相关，不翻转核），加偏置后过 ReLU：$a = \max(0, 6 + 2) = 8;\ b = \max(0, 5 + 2) = 7;\ e = \max(0, -11 + 2) = 0;\ f = \max(0, 5 + 2) = 7$。负的净输入在 ReLU 后变为 0。`,
      style: 'WA3 Q1 题型',
    },
    {
      id: 'l06-wa-s1', kind: 'calc',
      prompt: r`卷积层输入为 $32\times32\times128$（宽 × 高 × 深），使用 256 个 $3\times3$ 滤波器，步长 1，零填充 1。求输出形状、参数量（含偏置）以及计算所有输出单元净输入所需的乘法次数。`,
      answer: r`输出 $32\times32\times256$；参数 $256\times(3\cdot3\cdot128 + 1) = 295,168$；乘法 $32\cdot32\cdot256\times1,152 = 301,989,888$`,
      explanation: r`空间尺寸 $(32 - 3 + 2\cdot1)/1 + 1 = 32$（先检查能整除）；每个滤波器覆盖全部 128 个输入通道；每个输出单元需要 $F^2D_1 = 1,152$ 次乘法，共 $262,144$ 个输出单元，偏置只需加法。`,
      style: 'WA3 Q2 题型',
    },
    {
      id: 'l06-wa-s2', kind: 'calc',
      prompt: r`卷积层输入为 $55\times55\times96$（宽 × 高 × 深），使用 256 个 $5\times5$ 滤波器，步长 1，零填充 2。求输出形状、参数量（含偏置）以及计算所有输出单元净输入所需的乘法次数。`,
      answer: r`输出 $55\times55\times256$；参数 $256\times(5\cdot5\cdot96 + 1) = 614,656$；乘法 $55\cdot55\cdot256\times2,400 = 1,858,560,000$`,
      explanation: r`空间尺寸 $(55 - 5 + 2\cdot2)/1 + 1 = 55$（先检查能整除）；每个滤波器覆盖全部 96 个输入通道；每个输出单元需要 $F^2D_1 = 2,400$ 次乘法，共 $774,400$ 个输出单元，偏置只需加法。`,
      style: 'WA3 Q2 题型',
    },
    {
      id: 'l06-wa-s3', kind: 'calc',
      prompt: r`卷积层输入为 $13\times13\times384$（宽 × 高 × 深），使用 384 个 $3\times3$ 滤波器，步长 1，零填充 1。求输出形状、参数量（含偏置）以及计算所有输出单元净输入所需的乘法次数。`,
      answer: r`输出 $13\times13\times384$；参数 $384\times(3\cdot3\cdot384 + 1) = 1,327,488$；乘法 $13\cdot13\cdot384\times3,456 = 224,280,576$`,
      explanation: r`空间尺寸 $(13 - 3 + 2\cdot1)/1 + 1 = 13$（先检查能整除）；每个滤波器覆盖全部 384 个输入通道；每个输出单元需要 $F^2D_1 = 3,456$ 次乘法，共 $64,896$ 个输出单元，偏置只需加法。`,
      style: 'WA3 Q2 题型',
    },
    {
      id: 'l06-wa-s4', kind: 'calc',
      prompt: r`卷积层输入为 $63\times63\times3$（宽 × 高 × 深），使用 64 个 $7\times7$ 滤波器，步长 2，零填充 3。求输出形状、参数量（含偏置）以及计算所有输出单元净输入所需的乘法次数。`,
      answer: r`输出 $32\times32\times64$；参数 $64\times(7\cdot7\cdot3 + 1) = 9,472$；乘法 $32\cdot32\cdot64\times147 = 9,633,792$`,
      explanation: r`空间尺寸 $(63 - 7 + 2\cdot3)/2 + 1 = 32$（先检查能整除）；每个滤波器覆盖全部 3 个输入通道；每个输出单元需要 $F^2D_1 = 147$ 次乘法，共 $65,536$ 个输出单元，偏置只需加法。`,
      style: 'WA3 Q2 题型',
    },
  ],
  'l08-1': [
    {
      id: 'l08-1-wa1', kind: 'calc',
      prompt: r`自注意力层输入 4 个 token：$x_1 = (1, 0)$，$x_2 = (0, 1)$，$x_3 = (1, 1)$，$x_4 = (0.5, 0)$（行向量）。$\mathbf{W}^K = \mathbf{W}^V = \mathbf{I}$，打分用缩放点积 $\mathbf{q}_i^\top\mathbf{k}_j/\sqrt{2}$，无掩码。(a) $\mathbf{W}^Q_1 = \begin{pmatrix}1 & 0\\0 & 1\end{pmatrix}$ 时的注意力权重矩阵与输出；(b) $\mathbf{W}^Q_2 = \begin{pmatrix}2 & 0\\0 & 0\end{pmatrix}$ 时呢？(c) 在 (a) 的设置下，若输入顺序变为 $(0.5, 0)$，$(1, 0)$，$(0, 1)$，$(1, 1)$，注意力权重如何变化？`,
      answer: r`(a) $$\mathbf{A} = \begin{pmatrix}0.3130 & 0.1543 & 0.3130 & 0.2198\\0.1651 & 0.3349 & 0.3349 & 0.1651\\0.2114 & 0.2114 & 0.4287 & 0.1484\\0.2825 & 0.1983 & 0.2825 & 0.2367\end{pmatrix}$$ $$\mathbf{Z} = \begin{pmatrix}0.7358 & 0.4673\\0.5826 & 0.6698\\0.7144 & 0.6402\\0.6833 & 0.4808\end{pmatrix}$$ (b) $$\mathbf{A} = \begin{pmatrix}0.3655 & 0.0889 & 0.3655 & 0.1802\\0.2500 & 0.2500 & 0.2500 & 0.2500\\0.3655 & 0.0889 & 0.3655 & 0.1802\\0.3130 & 0.1543 & 0.3130 & 0.2198\end{pmatrix}$$ $$\mathbf{Z} = \begin{pmatrix}0.8210 & 0.4543\\0.6250 & 0.5000\\0.8210 & 0.4543\\0.7358 & 0.4673\end{pmatrix}$$ (c) $$\mathbf{A} = \begin{pmatrix}0.2367 & 0.2825 & 0.1983 & 0.2825\\0.2198 & 0.3130 & 0.1543 & 0.3130\\0.1651 & 0.1651 & 0.3349 & 0.3349\\0.1484 & 0.2114 & 0.2114 & 0.4287\end{pmatrix}$$ 即 (a) 中矩阵的行和列按同一置换重排，输出也同样重排`,
      explanation: r`步骤：$\mathbf{Q} = \mathbf{X}\mathbf{W}^Q$，$\mathbf{E} = \mathbf{Q}\mathbf{X}^\top/\sqrt2$，每行 softmax 得 $\mathbf{A}$，$\mathbf{Z} = \mathbf{A}\mathbf{X}$。例如 (a) 中 $\mathbf{z}_1$ 的打分为 $(0.7071, 0.0000, 0.7071, 0.3536)$。改变 $\mathbf{W}^Q$ 改变「谁关注谁」；改变输入顺序只让结果同样重排（置换等变）。`,
      style: 'WA3 Q5 题型',
    },
    {
      id: 'l08-1-wa2', kind: 'calc',
      prompt: r`自注意力层输入 4 个 token：$x_1 = (0, 2)$，$x_2 = (1, 1)$，$x_3 = (2, 0)$，$x_4 = (1, 0)$（行向量）。$\mathbf{W}^K = \mathbf{W}^V = \mathbf{I}$，打分用缩放点积 $\mathbf{q}_i^\top\mathbf{k}_j/\sqrt{2}$，无掩码。(a) $\mathbf{W}^Q_1 = \begin{pmatrix}1 & 0\\0 & 1\end{pmatrix}$ 时的注意力权重矩阵与输出；(b) $\mathbf{W}^Q_2 = \begin{pmatrix}0 & 1\\1 & 0\end{pmatrix}$ 时呢？(c) 在 (a) 的设置下，若输入顺序变为 $(1, 1)$，$(2, 0)$，$(1, 0)$，$(0, 2)$，注意力权重如何变化？`,
      answer: r`(a) $$\mathbf{A} = \begin{pmatrix}0.7346 & 0.1786 & 0.0434 & 0.0434\\0.2863 & 0.2863 & 0.2863 & 0.1412\\0.0382 & 0.1573 & 0.6471 & 0.1573\\0.1091 & 0.2212 & 0.4486 & 0.2212\end{pmatrix}$$ $$\mathbf{Z} = \begin{pmatrix}0.3088 & 1.6477\\1.0000 & 0.8588\\1.6089 & 0.2338\\1.3395 & 0.4393\end{pmatrix}$$ (b) $$\mathbf{A} = \begin{pmatrix}0.0382 & 0.1573 & 0.6471 & 0.1573\\0.2863 & 0.2863 & 0.2863 & 0.1412\\0.7346 & 0.1786 & 0.0434 & 0.0434\\0.5052 & 0.2491 & 0.1228 & 0.1228\end{pmatrix}$$ $$\mathbf{Z} = \begin{pmatrix}1.6089 & 0.2338\\1.0000 & 0.8588\\0.3088 & 1.6477\\0.6176 & 1.2596\end{pmatrix}$$ (c) $$\mathbf{A} = \begin{pmatrix}0.2863 & 0.2863 & 0.1412 & 0.2863\\0.1573 & 0.6471 & 0.1573 & 0.0382\\0.2212 & 0.4486 & 0.2212 & 0.1091\\0.1786 & 0.0434 & 0.0434 & 0.7346\end{pmatrix}$$ 即 (a) 中矩阵的行和列按同一置换重排，输出也同样重排`,
      explanation: r`步骤：$\mathbf{Q} = \mathbf{X}\mathbf{W}^Q$，$\mathbf{E} = \mathbf{Q}\mathbf{X}^\top/\sqrt2$，每行 softmax 得 $\mathbf{A}$，$\mathbf{Z} = \mathbf{A}\mathbf{X}$。例如 (a) 中 $\mathbf{z}_1$ 的打分为 $(2.8284, 1.4142, 0.0000, 0.0000)$。改变 $\mathbf{W}^Q$ 改变「谁关注谁」；改变输入顺序只让结果同样重排（置换等变）。`,
      style: 'WA3 Q5 题型',
    },
    {
      id: 'l08-1-wa3', kind: 'calc',
      prompt: r`自注意力层输入 4 个 token：$x_1 = (1, 1)$，$x_2 = (-1, 0)$，$x_3 = (0, 1)$，$x_4 = (1, -1)$（行向量）。$\mathbf{W}^K = \mathbf{W}^V = \mathbf{I}$，打分用缩放点积 $\mathbf{q}_i^\top\mathbf{k}_j/\sqrt{2}$，无掩码。(a) $\mathbf{W}^Q_1 = \begin{pmatrix}1 & 0\\0 & 1\end{pmatrix}$ 时的注意力权重矩阵与输出；(b) $\mathbf{W}^Q_2 = \begin{pmatrix}1 & 1\\0 & 0\end{pmatrix}$ 时呢？(c) 在 (a) 的设置下，若输入顺序变为 $(0, 1)$，$(1, -1)$，$(1, 1)$，$(-1, 0)$，注意力权重如何变化？`,
      answer: r`(a) $$\mathbf{A} = \begin{pmatrix}0.5388 & 0.0646 & 0.2657 & 0.1310\\0.1228 & 0.5052 & 0.2491 & 0.1228\\0.3655 & 0.1802 & 0.3655 & 0.0889\\0.1640 & 0.0808 & 0.0808 & 0.6744\end{pmatrix}$$ $$\mathbf{Z} = \begin{pmatrix}0.6052 & 0.6734\\-0.2596 & 0.2491\\0.2741 & 0.6421\\0.7575 & -0.4296\end{pmatrix}$$ (b) $$\mathbf{A} = \begin{pmatrix}0.5388 & 0.0646 & 0.2657 & 0.1310\\0.0646 & 0.5388 & 0.1310 & 0.2657\\0.2500 & 0.2500 & 0.2500 & 0.2500\\0.5388 & 0.0646 & 0.2657 & 0.1310\end{pmatrix}$$ $$\mathbf{Z} = \begin{pmatrix}0.6052 & 0.6734\\-0.2085 & -0.0701\\0.2500 & 0.2500\\0.6052 & 0.6734\end{pmatrix}$$ (c) $$\mathbf{A} = \begin{pmatrix}0.3655 & 0.0889 & 0.3655 & 0.1802\\0.0808 & 0.6744 & 0.1640 & 0.0808\\0.2657 & 0.1310 & 0.5388 & 0.0646\\0.2491 & 0.1228 & 0.1228 & 0.5052\end{pmatrix}$$ 即 (a) 中矩阵的行和列按同一置换重排，输出也同样重排`,
      explanation: r`步骤：$\mathbf{Q} = \mathbf{X}\mathbf{W}^Q$，$\mathbf{E} = \mathbf{Q}\mathbf{X}^\top/\sqrt2$，每行 softmax 得 $\mathbf{A}$，$\mathbf{Z} = \mathbf{A}\mathbf{X}$。例如 (a) 中 $\mathbf{z}_1$ 的打分为 $(1.4142, -0.7071, 0.7071, 0.0000)$。改变 $\mathbf{W}^Q$ 改变「谁关注谁」；改变输入顺序只让结果同样重排（置换等变）。`,
      style: 'WA3 Q5 题型',
    },
  ],
  'l10': [
    {
      id: 'l10-wa1', kind: 'calc',
      prompt: r`VAE 编码器对某个输入输出 $\boldsymbol{\mu} = (0.5, -1)$，$\log\boldsymbol{\sigma}^2 = (0, \ln 0.25)$，采样得 $\boldsymbol{\epsilon} = (1, -2)$。(a) 求重参数化后的 $\mathbf{z}$；(b) 求 KL 项；(c) 解码器输出 3 个像素的 Bernoulli 均值 $(0.9, 0.2, 0.6)$，原图像素为 $(1, 0, 1)$，求重建项 $-\log p(\mathbf{x}|\mathbf{z})$ 与负 ELBO。`,
      answer: r`(a) $\mathbf{z} = (1.5000, -2.0000)$；(b) KL $= 0.9431$；(c) 重建项 $= 0.8393$，负 ELBO $= 1.7825$`,
      explanation: r`$\boldsymbol{\sigma} = (1, 0.5)$，$\mathbf{z} = \boldsymbol{\mu} + \boldsymbol{\sigma}\odot\boldsymbol{\epsilon}$；KL $= -\frac12\sum_j(1 + \log\sigma_j^2 - \mu_j^2 - \sigma_j^2)$，两维分别为 0.1250 与 0.8181；重建项 $= -[\ln0.9 + \ln0.8 + \ln0.6]$（第二个像素为 0，所以取 $\ln(1 - 0.2)$）。`,
      style: 'WA4 Q1 相关',
    },
  ],
  'l11': [
    {
      id: 'l11-wa1', kind: 'calc',
      prompt: r`数据只有三个取值 $\{a, b, c\}$。真实分布 $p_r = (0.5, 0.3, 0.2)$，生成分布 $p_g = (0.2, 0.3, 0.5)$。(a) 求最优判别器 $D^*$ 在三点的取值；(b) 求 $V(G, D^*) = \mathbb{E}_{p_r}[\log D^*] + \mathbb{E}_{p_g}[\log(1 - D^*)]$；(c) 求 $\mathrm{JS}(p_r\|p_g)$ 并验证 $V = -\log4 + 2\,\mathrm{JS}$。`,
      answer: r`(a) $D^* = (0.7143, 0.5000, 0.2857)$；(b) $V = -1.2535$；(c) $\mathrm{JS} = 0.0664$，$-\log4 + 2\times0.0664 = -1.2535$`,
      explanation: r`$D^*(x) = p_r(x)/(p_r(x) + p_g(x))$；在 $b$ 处两分布相等，$D^* = 0.5$。JS 用中点分布 $m = (p_r + p_g)/2 = (0.35, 0.3, 0.35)$ 计算。$V$ 比完美生成器时的 $-\log 4$ 大，差值就是 $2\,\mathrm{JS}$。`,
      style: 'WA4 Q2 相关',
    },
  ],
  'l12': [
    {
      id: 'l12-wa1', kind: 'calc',
      prompt: r`某个像素：$\mathbf{x}_t = 0.5$，$\bar\alpha_t = 0.36$，$\alpha_t = 0.98$，噪声预测 $\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t) = 0.4$，带噪分类器给出 $\nabla_{\mathbf{x}_t}\log p_\phi(y|\mathbf{x}_t) = 1.5$，引导强度 $w = 3$。(a) 求引导后的噪声预测 $\hat{\boldsymbol{\epsilon}}$；(b) 分别求不引导与引导时 $\mathbf{x}_{t-1}$ 的均值（即令 $\mathbf{z} = 0$）。`,
      answer: r`(a) $\hat{\boldsymbol{\epsilon}} = 0.4 - 3\times0.8\times1.5 = -3.2000$；(b) 不引导 $0.4950$，引导 $0.5859$`,
      explanation: r`$\hat{\boldsymbol{\epsilon}} = \boldsymbol{\epsilon}_\theta - w\sqrt{1-\bar\alpha_t}\,\nabla\log p_\phi(y|\mathbf{x}_t)$，$\sqrt{1-\bar\alpha_t} = 0.8$；均值 $= \frac{1}{\sqrt{\alpha_t}}\big(\mathbf{x}_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\hat{\boldsymbol{\epsilon}}\big)$。分类器梯度为正，引导把样本往增大 $p(y|\mathbf{x}_t)$ 的方向推，所以均值变大。`,
      style: 'WA4 Q3 题型',
    },
  ],
  'l13': [
    {
      id: 'l13-wa1', kind: 'calc',
      prompt: r`CFM 训练中采到 $t = 0.25$、噪声 $\mathbf{x}_0 = (1, -2)$、数据 $\mathbf{x}_1 = (3, 2)$，网络在 $(\mathbf{x}_t, t)$ 处输出 $\mathbf{v}_\theta = (1.5, 3)$。求 $\mathbf{x}_t$、训练目标与该样本的损失 $\|\mathbf{v}_\theta - (\mathbf{x}_1 - \mathbf{x}_0)\|^2$；若用这个目标速度从 $\mathbf{x}_t$ 匀速走到 $t = 1$，会到达哪里？`,
      answer: r`$\mathbf{x}_t = (1.5, -1)$，目标 $= (2, 4)$，损失 $= 1.25$；走 $0.75$ 个单位时间后到达 $(3, 2) = \mathbf{x}_1$`,
      explanation: r`$\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\mathbf{x}_1$；目标速度与 $t$ 无关，所以条件轨迹是匀速直线。损失 $= (1.5-2)^2 + (3-4)^2$。`,
      style: 'WA4 Q4 相关',
    },
  ],
};
