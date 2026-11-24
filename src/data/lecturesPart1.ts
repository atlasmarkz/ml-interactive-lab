import { LectureModule } from '../types/curriculum';

export const LECTURES_PART_1: LectureModule[] = [
  {
    id: 'l01',
    code: 'L01',
    partGroup: 'Part 1 · Foundations of Machine Learning',
    slug: 'l01-linear-regression',
    slides: ['l01.pdf', 'l01-postclass.pdf'],
    examWeight: 'core',
    titleZh: '线性与多项式回归、正则化与泛化基础',
    titleEn: 'Linear & Polynomial Regression, Regularization & Capacity',
    abstract: String.raw`建立监督学习最核心的四步框架（模型假设空间 → 损失函数 → 优化求解 → 泛化评估）。从矩阵微积分推导 OLS 与 Ridge 正规方程，深入辨析 $L_1$ LASSO 与 $L_2$ Ridge 的几何稀疏差异、为何不惩罚偏置项 $w_0$，以及高斯噪声最大似然如何自然导出均方误差。`,
    readingChecklist: [
      String.raw`矩阵表示 $\hat{\mathbf{y}} = \mathbf{X}\mathbf{w}$ 与均方误差 $\text{MSE}$ 的向量二次型展开`,
      String.raw`Normal Equation 正规方程闭式解及 $\mathbf{X}^\top \mathbf{X}$ 病态/不可逆的根源`,
      String.raw`多项式特征映射 $\boldsymbol{\phi}(x)$ 仍是关于参数 $\mathbf{w}$ 的线性模型`,
      String.raw`模型容量、欠拟合/过拟合、Validation 与 $K$-Fold Cross-Validation`,
      String.raw`Ridge ($L_2$) vs LASSO ($L_1$) 稀疏性与偏置项 $w_0$ 惩罚陷阱`,
      String.raw`$R^2$ 决定系数与线性回归的概率论解释（高斯似然 $\equiv$ MSE）`,
    ],
    verifierId: 'l01-ols-ridge',
    derivations: [
      {
        id: 'd-l01-ridge',
        title: '从矩阵微积分零跳步推导 Ridge 回归闭式解 (Normal Equation)',
        goal: String.raw`给定设计矩阵 $\mathbf{X} \in \mathbb{R}^{N \times D}$、目标向量 $\mathbf{y} \in \mathbb{R}^N$ 与 $L_2$ 正则矩阵 $\lambda \mathbf{D}$（通常 $D_{00} = 0$ 不惩罚截距 $w_0$），求使目标函数最小的全局最优权重 $\mathbf{w}^*$。`,
        steps: [
          {
            rule: 'Quadratic Expansion',
            latex: String.raw`J(\mathbf{w}) = \frac{1}{N}(\mathbf{X}\mathbf{w} - \mathbf{y})^\top(\mathbf{X}\mathbf{w} - \mathbf{y}) + \lambda \mathbf{w}^\top \mathbf{D} \mathbf{w}`,
            justification: String.raw`把逐样本求和 $\sum_{i=1}^N (y_i - \mathbf{w}^\top \mathbf{x}_i)^2$ 写成向量内积形式，注意对称对角阵 $\mathbf{D}$ 的第 $0$ 个对角元设为 $0$ 以避免惩罚偏置项 $w_0$。`,
          },
          {
            rule: 'Distributive Transpose',
            latex: String.raw`(\mathbf{X}\mathbf{w} - \mathbf{y})^\top(\mathbf{X}\mathbf{w} - \mathbf{y}) = \mathbf{w}^\top \mathbf{X}^\top \mathbf{X}\mathbf{w} - 2\mathbf{y}^\top \mathbf{X}\mathbf{w} + \mathbf{y}^\top \mathbf{y}`,
            justification: String.raw`因为 $\mathbf{w}^\top \mathbf{X}^\top \mathbf{y}$ 是 $1 \times 1$ 标量，其转置等于自身 $(\mathbf{w}^\top \mathbf{X}^\top \mathbf{y})^\top = \mathbf{y}^\top \mathbf{X}\mathbf{w}$，因此两个交叉项合并为 $-2\mathbf{y}^\top \mathbf{X}\mathbf{w}$。`,
          },
          {
            rule: 'Matrix Calculus Identities',
            latex: String.raw`\nabla_{\mathbf{w}} J(\mathbf{w}) = \frac{2}{N}(\mathbf{X}^\top\mathbf{X}\mathbf{w} - \mathbf{X}^\top\mathbf{y}) + 2\lambda \mathbf{D}\mathbf{w} = \mathbf{0}`,
            justification: String.raw`套用两条核心矩阵求导恒等式：$\nabla_{\mathbf{w}}(\mathbf{w}^\top \mathbf{A} \mathbf{w}) = (\mathbf{A} + \mathbf{A}^\top)\mathbf{w} = 2\mathbf{A}\mathbf{w}$（当 $\mathbf{A}$ 对称时）与 $\nabla_{\mathbf{w}}(\mathbf{c}^\top \mathbf{w}) = \mathbf{c}$。`,
          },
          {
            rule: 'Linear System & Positive Definiteness',
            latex: String.raw`(\mathbf{X}^\top\mathbf{X} + N\lambda \mathbf{D})\mathbf{w}^* = \mathbf{X}^\top\mathbf{y} \implies \mathbf{w}^* = (\mathbf{X}^\top\mathbf{X} + \lambda' \mathbf{D})^{-1}\mathbf{X}^\top\mathbf{y}`,
            justification: String.raw`若特征共线或 $D > N$，$\mathbf{X}^\top \mathbf{X}$ 为半正定奇异矩阵不可逆；加上正对角阵 $\lambda'\mathbf{D}\;(\lambda' > 0)$ 后所有特征值严格大于 $0$，保证全局唯一闭式解且数值条件数大幅改善。`,
          },
        ],
        conclusion: String.raw`工程求解时永远用 ` + '`np.linalg.solve(A, b)`' + String.raw`（LU / Cholesky 分解）而非显式求逆 ` + '`np.linalg.inv(A) @ b`' + String.raw`；且当特征维度 $D$ 极大（如 $D > 10^4$）时 $\mathcal{O}(D^3)$ 求逆太慢，需转用 $\mathcal{O}(ND)$ 梯度下降。`,
      },
      {
        id: 'd-l01-mle',
        title: '概率视角推导：为何高斯噪声假设下 MLE 严格等价于最小化 MSE？',
        goal: String.raw`假设观测值服从 $y_i = \mathbf{w}^\top \mathbf{x}_i + \varepsilon_i$，其中独立噪声 $\varepsilon_i \sim \mathcal{N}(0, \sigma^2)$，证明最大化对数似然等价于最小二乘。`,
        steps: [
          {
            rule: 'i.i.d. Log-Likelihood',
            latex: String.raw`\ell(\mathbf{w}) = \sum_{i=1}^N \log \mathcal{N}(y_i \mid \mathbf{w}^\top\mathbf{x}_i, \sigma^2) = \sum_{i=1}^N \left[-\frac{1}{2}\log(2\pi\sigma^2) - \frac{(y_i - \mathbf{w}^\top\mathbf{x}_i)^2}{2\sigma^2}\right]`,
            justification: String.raw`i.i.d. 联合概率为各样本概率连乘，取对数转为连加并展开一维高斯密度函数。`,
          },
          {
            rule: String.raw`Drop Constants w.r.t. $\mathbf{w}$`,
            latex: String.raw`\arg\max_{\mathbf{w}} \ell(\mathbf{w}) = \arg\min_{\mathbf{w}} \frac{1}{N}\sum_{i=1}^N (y_i - \mathbf{w}^\top\mathbf{x}_i)^2`,
            justification: String.raw`第一项 $-\frac{1}{2}\log(2\pi\sigma^2)$ 与分母 $2\sigma^2 > 0$ 均与参数 $\mathbf{w}$ 无关，去掉负号即把最大化似然转化为最小化均方误差 MSE。若进一步给 $\mathbf{w}$ 施加零均值高斯先验 $\mathcal{N}(\mathbf{0}, \tau^2 \mathbf{I})$，MAP 对数后验自然多出 $+\lambda\|\mathbf{w}\|_2^2$ 即 Ridge 回归！`,
          },
        ],
        conclusion: String.raw`MSE 并非凭空发明的启发式公式，而是高斯观测噪声下的最大似然估计；$L_2$ 正则则是零均值高斯先验下的 MAP 估计（$L_1$ LASSO 对应 Laplace 先验）。`,
      },
    ],
    concepts: [
      {
        heading: String.raw`Ridge ($L_2$) vs LASSO ($L_1$) 核心对比`,
        body: String.raw`两者均可写成带约束的最优化问题 $\min \text{MSE}\;\text{s.t.}\;\|\mathbf{w}\|_p \le t$，但范数球的几何边界决定了参数解的稀疏性。`,
        table: {
          headers: ['对比维度', String.raw`Ridge Regression ($L_2$)`, String.raw`LASSO Regression ($L_1$)`],
          rows: [
            ['惩罚项', String.raw`$\lambda \sum_{j=1}^D w_j^2$`, String.raw`$\lambda \sum_{j=1}^D |w_j|$`],
            ['等价贝叶斯先验', String.raw`Gaussian 先验 $\mathcal{N}(\mathbf{0}, \tau^2 \mathbf{I})$`, 'Laplace 双指数先验'],
            ['约束域几何形状', '光滑超球面（无尖角）', '菱形 / 交叉多面体（顶点在坐标轴上）'],
            ['稀疏性与特征选择', String.raw`权重平滑缩小但不为 $0$`, String.raw`产生精确 $0$ 权重，自动剔除冗余特征`],
            ['求解方式', String.raw`有解析闭式解 $(\mathbf{X}^\top\mathbf{X} + \lambda \mathbf{D})^{-1}\mathbf{X}^\top\mathbf{y}$`, String.raw`在 $0$ 点不可微，需坐标下降 / 次梯度`],
          ],
        },
      },
      {
        heading: String.raw`验证集、$K$-Fold 交叉验证与 $R^2$ 决定系数`,
        body: String.raw`超参数（如多项式阶数 $d$、正则系数 $\lambda$）必须通过验证集选择，测试集仅在最终评估一次。`,
        latex: String.raw`R^2 = 1 - \frac{\sum_{i=1}^N (y_i - \hat{y}_i)^2}{\sum_{i=1}^N (y_i - \bar{y})^2}`,
        points: [
          String.raw`$K$-Fold CV：训练集均分 $K$ 份，轮流 $1$ 份验证、$K-1$ 份训练，取平均验证误差选最优超参，充分利用有限样本。`,
          String.raw`$R^2$ 衡量模型相对“恒预测均值 $\bar{y}$”基准的误差缩减比例；在测试集严重过拟合时 $R^2$ 可以为负数。`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l01-ridge',
        title: String.raw`Ridge 正规方程（精确跳过偏置项 $w_0$ 惩罚）`,
        subtitle: String.raw`工程实现中通过构造 $D_{00} = 0$ 确保截距不受 $L_2$ 压扁`,
        latex: String.raw`\htmlClass{formula-token formula-token-param token-w}{\mathbf{w}^*} = \Big(\htmlClass{formula-token formula-token-data token-xtx}{\mathbf{X}^\top \mathbf{X}} + \htmlClass{formula-token formula-token-hyper token-reg}{\lambda \mathbf{D}}\Big)^{-1} \htmlClass{formula-token formula-token-output token-xty}{\mathbf{X}^\top \mathbf{y}}`,
        numpyCode: `import numpy as np

def fit_ridge_no_bias_pen(X, y, lam=1.0):
    # X[:, 0] 为全 1 偏置列，shape: (N, D)
    D = X.shape[1]
    reg_mat = lam * np.eye(D)
    reg_mat[0, 0] = 0.0                  # 关键：不惩罚截距 w0
    XtX = X.T @ X                        # (D, D)
    Xty = X.T @ y                        # (D,)
    w_star = np.linalg.solve(XtX + reg_mat, Xty)
    return w_star`,
        pytorchCode: `import torch

def fit_ridge_torch(X: torch.Tensor, y: torch.Tensor, lam: float = 1.0):
    D = X.shape[1]
    reg_mat = lam * torch.eye(D, dtype=X.dtype, device=X.device)
    reg_mat[0, 0] = 0.0
    XtX = X.T @ X
    Xty = X.T @ y
    return torch.linalg.solve(XtX + reg_mat, Xty)`,
        terms: [
          { id: 'xtx', label: String.raw`$\mathbf{X}^\top \mathbf{X}$`, role: 'data', shape: '(D, D)', explanation: '特征格拉姆矩阵，若特征共线则秩亏不可逆。', numpyLines: [8], pytorchLines: [7] },
          { id: 'reg', label: String.raw`$\lambda \mathbf{D}\;(D_{00}=0)$`, role: 'hyper', shape: '(D, D)', explanation: String.raw`仅对斜率权重加 $\lambda$，保持截距 $w_0$ 自由对齐数据均值。`, numpyLines: [6, 7], pytorchLines: [5, 6] },
          { id: 'xty', label: String.raw`$\mathbf{X}^\top \mathbf{y}$`, role: 'output', shape: '(D,)', explanation: '特征与目标向量的内积投影。', numpyLines: [9], pytorchLines: [8] },
          { id: 'w', label: String.raw`$\mathbf{w}^*$`, role: 'param', shape: '(D,)', explanation: String.raw`通过线性求解器 ` + '`solve`' + String.raw` 直接解出，数值精度远高于显式求逆。`, numpyLines: [10], pytorchLines: [9] },
        ],
      },
    ],
    pitfalls: [
      {
        title: String.raw`误将截距项 $w_0$ 放入 $L_2$ 惩罚（WA1 Q2 经典考题）`,
        detail: String.raw`若目标函数写成 $\text{MSE} + \lambda(w_0^2 + w_1^2)$，大 $\lambda$ 会把截距强行拽向 $0$，导致拟合直线被迫贴近原点而非样本均值水平线 $\bar{y}$。`,
      },
      {
        title: '误以为多项式回归是“非线性模型”',
        detail: String.raw`多项式回归对原始输入 $x$ 是非线性曲线，但对扩展特征向量 $\boldsymbol{\phi}(x) = [1, x, x^2, \dots, x^d]^\top$ 的参数 $\mathbf{w}$ 依然是严格线性模型，因此损失函数对 $\mathbf{w}$ 依然是凸二次函数，存在全局唯一闭式解。`,
      },
    ],
    sandbox: {
      id: 'sb-l01',
      title: String.raw`Pyodide 实测：对比“惩罚 $w_0$” vs “不惩罚 $w_0$”在高 $\lambda$ 下的拟合偏差`,
      description: String.raw`在均值为 $y \approx 10$ 的数据上测试 Ridge 回归，直观验证惩罚截距 $w_0$ 导致的系统性偏移。`,
      starterCode: `import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([9.2, 10.1, 10.8, 12.2, 13.0])
X = np.column_stack([np.ones_like(x), x])

lams = [0.0, 1.0, 5.0, 20.0, 100.0]
mse_no_bias_pen, mse_with_bias_pen = [], []

for lam in lams:
    D_no = np.diag([0.0, lam])
    D_yes = np.diag([lam, lam])
    w_no = np.linalg.solve(X.T @ X + D_no, X.T @ y)
    w_yes = np.linalg.solve(X.T @ X + D_yes, X.T @ y)
    mse_no = float(np.mean((X @ w_no - y) ** 2))
    mse_yes = float(np.mean((X @ w_yes - y) ** 2))
    mse_no_bias_pen.append(mse_no)
    mse_with_bias_pen.append(mse_yes)
    print(f"λ={lam:5.1f} | 不罚w0: w={np.round(w_no,2)} MSE={mse_no:.3f} | 罚w0: w={np.round(w_yes,2)} MSE={mse_yes:.3f}")

plot_series(
    "Ridge 正则强度 λ 增大时：惩罚 w0 导致 MSE 急剧恶化",
    {"不惩罚 w0 (正确)": (lams, mse_no_bias_pen), "惩罚 w0 (被拉向原点)": (lams, mse_with_bias_pen)},
    xlabel="λ",
    ylabel="Train MSE"
)
`,
    },
  },
  {
    id: 'l02-1',
    code: 'L02.1',
    partGroup: 'Part 1 · Foundations of Machine Learning',
    slug: 'l02-1-logistic-softmax',
    slides: ['l02.1.pdf', 'l02.1-postclass.pdf'],
    examWeight: 'core',
    titleZh: '信息论基础、Logistic 回归与 Softmax 回归',
    titleEn: 'Information Theory, Logistic & Softmax Regression',
    abstract:
      '系统打通「信息熵 → KL 散度 → 交叉熵 → 最大似然估计 (MLE)」的等价链条，完整手推 Sigmoid 与 Softmax 交叉熵损失的极简梯度公式，并剖析数值稳定 Log-Sum-Exp 实现与不平衡分类的 Precision / Recall / F1 评估体系。',
    readingChecklist: [
      String.raw`信息熵 $H(P)$、KL 散度 $D_{\text{KL}}(P \| Q)$ 非对称性与交叉熵 $H(P, Q) = H(P) + D_{\text{KL}}(P \| Q)$`,
      String.raw`双高斯分布闭式 KL 散度（WA1 Q6 推导）`,
      String.raw`Logistic Regression 对数几率 $\log\frac{p}{1-p} = \mathbf{w}^\top \mathbf{x}$ 与线性决策边界`,
      String.raw`链式法则推导 $\frac{\partial L}{\partial \mathbf{w}} = \frac{1}{N}\sum_{i=1}^N (\hat{y}_i - y_i)\mathbf{x}_i$ 与 Softmax 矩阵梯度 $\frac{1}{N}\mathbf{X}^\top(\mathbf{P}-\mathbf{Y})$`,
      String.raw`非线性特征升维（如 XOR 引入交互项 $x_1 x_2$）解决线性不可分`,
      String.raw`Confusion Matrix、Precision、Recall 与 $F_1$ Score（不平衡数据陷阱）`,
    ],
    verifierId: 'l02-1-logistic-gd',
    derivations: [
      {
        id: 'd-l021-logreg-grad',
        title: String.raw`零跳步推导 Logistic Regression 交叉熵损失对权重 $\mathbf{w}$ 的梯度`,
        goal: String.raw`证明对单样本负对数似然 $L_i = -\big[y_i \log \hat{y}_i + (1-y_i)\log(1-\hat{y}_i)\big]$（其中 $\hat{y}_i = \sigma(z_i),\; z_i = \mathbf{w}^\top \mathbf{x}_i$），求导后所有分母奇迹般消掉，只剩 $(\hat{y}_i - y_i)\mathbf{x}_i$。`,
        steps: [
          {
            rule: 'Sigmoid Derivative Identity',
            latex: String.raw`\sigma(z) = \frac{1}{1+e^{-z}} \implies \sigma'(z) = \frac{e^{-z}}{(1+e^{-z})^2} = \sigma(z)\big(1 - \sigma(z)\big)`,
            justification: '先证最关键的辅助恒等式：Sigmoid 的导数可直接用其自身输出表示，这也是交叉熵分母得以约去的核心原因。',
          },
          {
            rule: String.raw`Differentiate Loss w.r.t. $\hat{y}_i$`,
            latex: String.raw`\frac{\partial L_i}{\partial \hat{y}_i} = -\left(\frac{y_i}{\hat{y}_i} - \frac{1-y_i}{1-\hat{y}_i}\right) = \frac{\hat{y}_i - y_i}{\hat{y}_i(1-\hat{y}_i)}`,
            justification: String.raw`通分合并两个对数求导项，分子化简为 $-\big[y_i(1-\hat{y}_i) - (1-y_i)\hat{y}_i\big] = \hat{y}_i - y_i$。`,
          },
          {
            rule: 'Chain Rule Cancellation',
            latex: String.raw`\frac{\partial L_i}{\partial z_i} = \frac{\partial L_i}{\partial \hat{y}_i}\cdot \frac{\partial \hat{y}_i}{\partial z_i} = \frac{\hat{y}_i - y_i}{\hat{y}_i(1-\hat{y}_i)} \cdot \hat{y}_i(1-\hat{y}_i) = \hat{y}_i - y_i`,
            justification: String.raw`交叉熵的分母 $\hat{y}_i(1-\hat{y}_i)$ 与 Sigmoid 导数 $\hat{y}_i(1-\hat{y}_i)$ 精确约分！若错用 MSE 配 Sigmoid，该项约不掉会导致梯度饱和缓慢。`,
          },
          {
            rule: String.raw`Batch Gradient + $L_2$ Regularization`,
            latex: String.raw`\nabla_{\mathbf{w}} L(\mathbf{w}) = \frac{1}{N}\sum_{i=1}^N (\hat{y}_i - y_i)\mathbf{x}_i + \lambda \mathbf{w}_{\text{no-bias}}`,
            justification: String.raw`再乘以 $\frac{\partial z_i}{\partial \mathbf{w}} = \mathbf{x}_i$ 并对 $N$ 个样本取平均即得批量梯度。推广到 $K$ 类 Softmax 回归时，完全对称地得到 $\nabla_{\mathbf{W}} L = \frac{1}{N}\mathbf{X}^\top(\mathbf{P} - \mathbf{Y}) + \lambda \mathbf{W}$。`,
          },
        ],
        conclusion: String.raw`Logistic 回归与线性回归的梯度形式在代数上完全同构：$(\text{预测} - \text{真值}) \times \text{输入特征}$！区别仅在于预测值 $\hat{y}$ 经由 Sigmoid / Softmax 映射到了概率空间。`,
      },
      {
        id: 'd-l021-gauss-kl',
        title: '推导两一维高斯分布的闭式 KL 散度与交叉熵（WA1 Q6 核心）',
        goal: String.raw`设 $p = \mathcal{N}(\mu_1, \sigma_1^2),\; q = \mathcal{N}(\mu_2, \sigma_2^2)$，推导 $D_{\text{KL}}(p \| q)$ 并分析固定方差时随 $\mu_2$ 偏移的形态。`,
        steps: [
          {
            rule: 'Definition of KL Divergence',
            latex: String.raw`D_{\text{KL}}(p\,\|\,q) = \mathbb{E}_{x\sim p}\!\left[\ln p(x) - \ln q(x)\right] = \mathbb{E}_p\!\left[\ln\frac{\sigma_2}{\sigma_1} - \frac{(x-\mu_1)^2}{2\sigma_1^2} + \frac{(x-\mu_2)^2}{2\sigma_2^2}\right]`,
            justification: String.raw`展开两个高斯对数密度，常数项 $-\frac{1}{2}\ln(2\pi)$ 相减消去。`,
          },
          {
            rule: 'Second Moment Expansion',
            latex: String.raw`\mathbb{E}_p[(x-\mu_1)^2] = \sigma_1^2, \qquad \mathbb{E}_p[(x-\mu_2)^2] = \mathbb{E}_p[(x-\mu_1 + \mu_1-\mu_2)^2] = \sigma_1^2 + (\mu_1-\mu_2)^2`,
            justification: String.raw`把 $(x - \mu_2)$ 拆成 $(x - \mu_1) + (\mu_1 - \mu_2)$ 后展开，交叉项 $2(\mu_1 - \mu_2)\mathbb{E}_p[x - \mu_1] = 0$ 严格消失。`,
          },
          {
            rule: 'Closed-Form Result',
            latex: String.raw`D_{\text{KL}}(p\,\|\,q) = \ln\frac{\sigma_2}{\sigma_1} + \frac{\sigma_1^2 + (\mu_1-\mu_2)^2}{2\sigma_2^2} - \frac{1}{2}`,
            justification: String.raw`当 $\mu_1 = 0,\; \sigma_1 = \sigma_2 = 1$ 时化简为 $\frac{1}{2}\mu_2^2$（开口向上的抛物线）；交叉熵 $H(p, q) = \frac{1}{2}\ln(2\pi e) + \frac{1}{2}\mu_2^2$ 仅相差一个常数平移 $H(p)$。`,
          },
        ],
        conclusion: String.raw`证明了 $D_{\text{KL}}(p \| q) \ge 0$（仅当 $\mu_1 = \mu_2$ 且 $\sigma_1 = \sigma_2$ 时取 $0$），且当方差不同时明显非对称：$D_{\text{KL}}(p \| q) \neq D_{\text{KL}}(q \| p)$。`,
      },
    ],
    concepts: [
      {
        heading: String.raw`不平衡分类评估体系：Confusion Matrix / Precision / Recall / $F_1$`,
        body: String.raw`当正负样本极度不平衡（如 $1\%$ 欺诈或疾病样本）时，永远猜负类的愚蠢分类器也能拿 $99\%$ Accuracy，必须改看 Precision、Recall 与 $F_1$。`,
        latex: String.raw`\text{Precision} = \frac{\text{TP}}{\text{TP}+\text{FP}}, \qquad \text{Recall} = \frac{\text{TP}}{\text{TP}+\text{FN}}, \qquad F_1 = \frac{2\cdot P \cdot R}{P + R}`,
        points: [
          'Precision（查准率）：所有预测为正例的样本中，真正是正例的比例（高 Precision 减少误报）。',
          'Recall（查全率 / TPR）：所有真实正例中，被成功检出的比例（医疗筛查重点保 Recall）。',
          String.raw`$F_1$ Score 是 Precision 与 Recall 的调和均值：只要任意一项很低，$F_1$ 就会被严重拉低。`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l021-softmax',
        title: '数值稳定 Softmax 交叉熵与全批量梯度（对应 HA01）',
        subtitle: String.raw`行最大值平移避免 $\exp$ 上溢 + 直接 log-softmax 避免 $\log 0$`,
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-loss}{L(\mathbf{W})} = -\frac{1}{N}\sum_{i=1}^N \log \htmlClass{formula-token formula-token-output token-prob}{\frac{e^{z_{i,y_i}-m_i}}{\sum_k e^{z_{i,k}-m_i}}} + \htmlClass{formula-token formula-token-hyper token-reg}{\frac{\lambda}{2}\|\mathbf{W}\|_F^2}, \qquad \htmlClass{formula-token formula-token-loss token-grad}{\nabla_{\mathbf{W}} L} = \frac{1}{N}\htmlClass{formula-token formula-token-data token-xt}{\mathbf{X}^\top}(\mathbf{P}-\mathbf{Y}) + \lambda\mathbf{W}`,
        numpyCode: `def softmax_loss_and_grad(W, X, y, reg=1e-2):
    N = X.shape[0]
    scores = X @ W                                    # (N, K)
    scores -= np.max(scores, axis=1, keepdims=True)   # Log-Sum-Exp 平移防溢出
    exp_s = np.exp(scores)
    sum_exp = np.sum(exp_s, axis=1, keepdims=True)
    probs = exp_s / sum_exp                           # P: (N, K)
    log_probs = scores - np.log(sum_exp)
    loss = -np.mean(log_probs[np.arange(N), y]) + 0.5 * reg * np.sum(W * W)
    dscores = probs.copy()
    dscores[np.arange(N), y] -= 1.0                   # P - Y
    dW = (X.T @ dscores) / N + reg * W                # (D, K)
    return loss, dW`,
        pytorchCode: `import torch, torch.nn.functional as F

def softmax_loss_torch(W, X, y, reg=1e-2):
    scores = X @ W
    loss = F.cross_entropy(scores, y) + 0.5 * reg * torch.sum(W * W)
    loss.backward()
    return loss.item(), W.grad`,
        terms: [
          { id: 'prob', label: '数值稳定 Softmax', role: 'output', shape: '(N, K)', explanation: String.raw`每行减去 $\max(\text{scores})$ 后最大指数为 $e^0 = 1$，数学概率完全不变但彻底避免 ` + '`inf`' + '/' + '`NaN`' + '。', numpyLines: [4, 5, 6, 7], pytorchLines: [5] },
          { id: 'loss', label: '平均 NLL + 正则总损失', role: 'loss', shape: 'scalar', explanation: String.raw`利用 $\log\!\big(e^s / \sum e^s\big) = s - \log(\sum e^s)$ 避免下溢。`, numpyLines: [8, 9], pytorchLines: [5] },
          { id: 'reg', label: String.raw`$L_2$ 权重衰减`, role: 'hyper', shape: 'scalar', explanation: String.raw`$\frac{1}{2}$ 系数与求导时的 $2$ 抵消，得干净梯度 $\lambda \mathbf{W}$。`, numpyLines: [9], pytorchLines: [5] },
          { id: 'xt', label: String.raw`$\mathbf{X}^\top$`, role: 'data', shape: '(D, N)', explanation: String.raw`矩阵乘法一次性汇总 $N$ 个样本的梯度贡献。`, numpyLines: [12], pytorchLines: [6] },
          { id: 'grad', label: String.raw`$\nabla_{\mathbf{W}} L$`, role: 'loss', shape: '(D, K)', explanation: String.raw`对 logits 的梯度就是预测分布减真实 one-hot 分布 $\frac{1}{N}(\mathbf{P} - \mathbf{Y})$。`, numpyLines: [10, 11, 12], pytorchLines: [6] },
        ],
      },
    ],
    pitfalls: [
      {
        title: 'Logistic 回归本身是线性分类器，无法直接解决 XOR（WA1 Q4）',
        detail: String.raw`原特征 $(x_1, x_2)$ 下的决策面 $w_0 + w_1 x_1 + w_2 x_2 = 0$ 是一条直线，对 XOR 四个点最少错分 $1$ 个（误差 $25\%$）；引入非线性交互特征 $x_1 x_2$ 后，在三维空间中线性可分，误差降至 $0\%$。`,
      },
      {
        title: 'Softmax 参数冗余性（Shift Invariance）',
        detail: String.raw`若把所有类别的权重向量同时加上同一向量 $\mathbf{c}$，Softmax 概率完全不变。因此二分类 Softmax 实际上等价于把其中一类权重固定为 $\mathbf{0}$ 的 Logistic 回归；加上 $L_2$ 正则会自动消除冗余并锁定唯一解。`,
      },
    ],
  },
  {
    id: 'l02-2',
    code: 'L02.2',
    partGroup: 'Part 1 · Foundations of Machine Learning',
    slug: 'l02-2-surrogate-generative',
    slides: ['l02.2.pdf', 'l02.2-postclass.pdf'],
    examWeight: 'core',
    titleZh: '分类的优化视角（凸代理损失）与生成式分类 (Naive Bayes)',
    titleEn: 'Convex Surrogate Losses & Generative Classification (Naive Bayes)',
    abstract: String.raw`跳出“只用概率建模”的单一视角：剖析为何直接最小化 $0/1$ 分类错误率在优化上不可行（梯度几乎处处为 $0$ 且非凸），从而引出 Logistic / Hinge / Exponential 凸代理上界；并深入推导生成式分类代表 Naive Bayes 的条件独立假设与参数估计。`,
    readingChecklist: [
      String.raw`$0/1$ 经验错误率函数为何不可微且梯度处处为 $0$`,
      '凸函数定义、全局最优性及凸代理上界（Logistic / Hinge / Exponential Loss）',
      String.raw`判别式 $P(y \mid \mathbf{x})$ vs 生成式 $P(\mathbf{x}, y) = P(y)P(\mathbf{x} \mid y)$ 建模范式对比`,
      String.raw`Naive Bayes 条件独立假设将参数量从 $\mathcal{O}(2^D)$ 降至 $\mathcal{O}(D)$`,
      String.raw`离散特征最大似然估计与 Laplace (Add-$\alpha$) 平滑解决零概率问题`,
    ],
    verifierId: 'l02-2-nb-surrogate',
    derivations: [
      {
        id: 'd-l022-nb',
        title: 'Naive Bayes 后验概率分解与对数空间线性决策面',
        goal: '从贝叶斯定理出发，利用条件独立假设推导离散特征 Naive Bayes 的分类决策规则。',
        steps: [
          {
            rule: 'Bayes Theorem',
            latex: String.raw`P(y = k \mid \mathbf{x}) = \frac{P(y=k)\,P(\mathbf{x} \mid y=k)}{P(\mathbf{x})} \propto P(y=k)\,P(x_1, x_2, \dots, x_D \mid y=k)`,
            justification: String.raw`分母证据 $P(\mathbf{x})$ 对所有候选类别 $k$ 相同，寻找 $\arg\max_k$ 时可直接略去。`,
          },
          {
            rule: 'Conditional Independence (Naive Assumption)',
            latex: String.raw`P(x_1, \dots, x_D \mid y=k) = \prod_{j=1}^D P(x_j \mid y=k)`,
            justification: String.raw`假设给定类别 $y=k$ 后各特征条件独立。虽然现实中词与词往往相关，但该假设把每类参数从指数级 $2^D - 1$ 降为线性 $D$，极大降低小样本方差。`,
          },
          {
            rule: 'Log-Space Decision Rule',
            latex: String.raw`\hat{y} = \arg\max_k \left[\log P(y=k) + \sum_{j=1}^D \log P(x_j \mid y=k)\right]`,
            justification: String.raw`连乘上百个小数会迅速浮点下溢为 $0$；取对数转为加法后数值完全稳定，且对 Bernoulli / Multinomial 词袋特征可证明其决策边界关于词频 $\mathbf{x}$ 是线性的！`,
          },
        ],
        conclusion: '即使“条件独立”假设在现实中并不严格成立，只要最大后验类别的排序不变，Naive Bayes 的分类准确率依然很高。',
      },
    ],
    concepts: [
      {
        heading: String.raw`为什么 $0/1$ 损失的梯度几乎处处为 $0$？`,
        body: String.raw`设符号预测 $\hat{y} = \operatorname{sign}(\mathbf{w}^\top \mathbf{x})$，样本间隔 $m_i = y_i(\mathbf{w}^\top \mathbf{x}_i)$（$y_i \in \{-1, +1\}$）。$0/1$ 损失 $L_{01}(m) = \mathbb{1}[m \le 0]$ 是阶跃函数：在 $m \neq 0$ 处完全水平（导数 $\equiv 0$），在 $m = 0$ 处不连续不可导，且整体是非凸 NP-hard 组合优化问题。`,
        points: [
          String.raw`代理损失（Surrogate Loss）满足两个核心条件：① 处处大于等于 $0/1$ 损失（上界保证）；② 是关于参数 $\mathbf{w}$ 的凸函数（任意局部最优即全局最优，梯度下降可稳定求解）。`,
          String.raw`Hinge Loss $\max(0, 1-m)$ 导出支持向量机 (SVM)；Logistic Loss $\log(1 + e^{-m})$ 导出逻辑回归；Exponential Loss $e^{-m}$ 导出 AdaBoost。`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l022-nb',
        title: '带 Laplace 平滑的对数空间 Naive Bayes 推理',
        subtitle: String.raw`用对数加法防止连乘下溢，用 $\alpha$ 平滑消除未见词零概率`,
        latex: String.raw`\log \hat{P}(y=k\mid \mathbf{x}) \propto \htmlClass{formula-token formula-token-param token-prior}{\log \hat{\pi}_k} + \sum_{j=1}^D \htmlClass{formula-token formula-token-data token-xj}{x_j}\log \htmlClass{formula-token formula-token-output token-cond}{\frac{N_{k,j} + \alpha}{N_k + \alpha |V|}}`,
        numpyCode: `def nb_predict_log_proba(X_counts, class_counts, word_counts, alpha=1.0):
    # class_counts: (K,), word_counts: (K, V), X_counts: (N, V)
    V = word_counts.shape[1]
    log_prior = np.log(class_counts / class_counts.sum())            # (K,)
    denom = word_counts.sum(axis=1, keepdims=True) + alpha * V       # (K, 1)
    log_lik = np.log((word_counts + alpha) / denom)                  # (K, V)
    return X_counts @ log_lik.T + log_prior                          # (N, K)`,
        terms: [
          { id: 'prior', label: String.raw`对数类先验 $\log \hat{\pi}_k$`, role: 'param', shape: '(K,)', explanation: '各类在训练集中的频率对数。', numpyLines: [4] },
          { id: 'cond', label: 'Laplace 平滑条件概率', role: 'output', shape: '(K, V)', explanation: String.raw`分子加 $\alpha$、分母加 $\alpha|V|$，保证任何未出现词的概率严格 $> 0$ 且总和仍为 $1$。`, numpyLines: [5, 6] },
          { id: 'xj', label: '特征计数矩阵乘法', role: 'data', shape: '(N, V) @ (V, K)', explanation: String.raw`对数域连加天然化简为一次高速矩阵乘法 ` + '`X @ log_lik.T + log_prior`' + '！', numpyLines: [7] },
        ],
      },
    ],
    pitfalls: [
      {
        title: '混淆生成式模型与判别式模型的适用场景',
        detail: String.raw`当样本量极少时，生成式模型（Naive Bayes / GDA）因引入强分布假设而方差更低、收敛更快（收敛速率 $\mathcal{O}(\log D)$ vs 判别式 $\mathcal{O}(D)$）；但当分布假设与真实数据不符且数据量充足时，判别式模型（Logistic / NN）渐近误差更低。`,
      },
    ],
  },
  {
    id: 'l03',
    code: 'L03',
    partGroup: 'Part 1 · Foundations of Machine Learning',
    slug: 'l03-bias-variance',
    slides: ['l03.pdf', 'l03-post class.pdf'],
    examWeight: 'core',
    titleZh: '偏差-方差分解与集成学习 (Bias-Variance & Ensembles)',
    titleEn: 'Bias-Variance Decomposition, Bagging & Boosting',
    abstract: String.raw`从统计学习理论视角严格证明期望泛化误差为何必然拆分为 $\text{Bias}^2 + \text{Variance} + \sigma^2$（不可约噪声），彻底搞懂“交叉项为何严格归零”，并建立 Bagging 降方差与 Boosting 降偏差的理论桥梁。`,
    readingChecklist: [
      String.raw`随机训练集 $S$ 导致的假设波动 $h_S(x)$ 与平均预测函数 $\bar{h}(x) = \mathbb{E}_S[h_S(x)]$`,
      '期望泛化误差严格三项分解证明（含交叉项消零的关键步骤）',
      String.raw`模型容量增大时 $\text{Bias}^2$ 单调下降、$\text{Variance}$ 单调上升的 U 形权衡曲线`,
      String.raw`Bagging (Bootstrap Aggregation) 如何通过平均 $M$ 个低相关模型压缩方差`,
      'Boosting (AdaBoost / GBDT) 如何串行拟合残差降低偏差',
    ],
    verifierId: 'l03-bias-variance',
    derivations: [
      {
        id: 'd-l03-bv',
        title: String.raw`零跳步证明回归期望泛化误差的 $\text{Bias}^2 + \text{Variance} + \sigma^2$ 三项分解`,
        goal: String.raw`设真实数据生成过程为 $y = f(x) + \varepsilon$（其中 $\mathbb{E}[\varepsilon]=0,\; \operatorname{Var}(\varepsilon)=\sigma^2$ 且 $\varepsilon$ 独立于训练集 $S$），记平均学习器 $\bar{h}(x) = \mathbb{E}_S[h_S(x)]$，证明在任意固定点 $x$ 上 $\mathbb{E}_{S,y}\big[(y - h_S(x))^2\big] = \text{Bias}^2 + \text{Variance} + \sigma^2$。`,
        steps: [
          {
            rule: String.raw`Add & Subtract True Mean $f(x)$`,
            latex: String.raw`\mathbb{E}_{S,y}\!\big[(y - h_S)^2\big] = \mathbb{E}_{S,\varepsilon}\!\big[(f + \varepsilon - h_S)^2\big] = \mathbb{E}_S\!\big[(f - h_S)^2\big] + \mathbb{E}_\varepsilon[\varepsilon^2] + 2\mathbb{E}_{S,\varepsilon}[\varepsilon(f - h_S)]`,
            justification: String.raw`把 $y$ 替换为 $f(x) + \varepsilon$ 后展开平方。因为新测试噪声 $\varepsilon$ 与训练集 $S$ 统计独立且 $\mathbb{E}[\varepsilon]=0$，交叉项 $2\mathbb{E}[\varepsilon]\mathbb{E}_S[f - h_S] = 0$，而 $\mathbb{E}[\varepsilon^2] = \sigma^2$ 即不可约误差！`,
          },
          {
            rule: String.raw`Add & Subtract Mean Predictor $\bar{h}(x)$`,
            latex: String.raw`\mathbb{E}_S\!\big[(f - h_S)^2\big] = \mathbb{E}_S\!\Big[\big((f - \bar{h}) + (\bar{h} - h_S)\big)^2\Big]`,
            justification: String.raw`最核心的技巧：在括号内部同时减去并加上平均预测函数 $\bar{h}(x) = \mathbb{E}_S[h_S(x)]$。`,
          },
          {
            rule: 'Expand & Eliminate Cross-Term',
            latex: String.raw`= (f - \bar{h})^2 + \mathbb{E}_S\!\big[(\bar{h} - h_S)^2\big] + 2(f - \bar{h})\underbrace{\mathbb{E}_S[\bar{h} - h_S]}_{=\,\bar{h} - \bar{h} \,=\, 0}`,
            justification: String.raw`因为 $f(x)$ 和 $\bar{h}(x)$ 在对 $S$ 求期望时均为确定性常数，可以直接提到期望符号外面！而 $\mathbb{E}_S[\bar{h} - h_S] = \bar{h} - \mathbb{E}_S[h_S] = 0$，交叉项严格消去！`,
          },
          {
            rule: 'Final Three-Term Identity',
            latex: String.raw`\mathbb{E}_{S,y}\!\big[(y - h_S(x))^2\big] = \underbrace{\big(f(x) - \bar{h}(x)\big)^2}_{\text{Bias}^2(x)} + \underbrace{\mathbb{E}_S\!\big[(h_S(x) - \bar{h}(x))^2\big]}_{\text{Variance}(x)} + \underbrace{\sigma^2}_{\text{Noise}}`,
            justification: String.raw`最后再对特征分布 $p(x)$ 取外层期望，即得整门课最核心的期望泛化误差分解定理。`,
          },
        ],
        conclusion: String.raw`任何模型都无法把测试误差压到 $\sigma^2$ 以下；选模型、加正则、增数据、用 Bagging / Boosting 的全部本质都是在 $\text{Bias}^2$ 和 $\text{Variance}$ 之间做定向调控。`,
      },
    ],
    concepts: [
      {
        heading: 'Bagging vs Boosting：集成学习的两种正交武器',
        body: '为什么随机森林（Bagging）偏爱深决策树，而 AdaBoost / GBDT（Boosting）偏爱浅树桩？答案直接写在 Bias-Variance 分解里。',
        table: {
          headers: ['对比项', 'Bagging (如 Random Forest)', 'Boosting (如 AdaBoost / GBDT)'],
          rows: [
            ['训练方式', '各基学习器并行独立（Bootstrap 有放回抽样）', '各基学习器串行迭代（关注前序错分/残差）'],
            ['典型基学习器', '低偏差、高方差的复杂模型（深决策树）', '高偏差、低方差的弱模型（浅层树桩）'],
            ['主要降低项', String.raw`大幅降低 Variance（$M$ 个独立变量均值方差为 $\sigma^2 / M$）`, '大幅降低 Bias（逐步逼近复杂真实函数）'],
            ['过拟合风险', String.raw`增加树数量 $M$ 几乎不会过拟合`, '迭代轮数过多可能过拟合噪声，需配合缩减率/早停'],
          ],
        },
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l03-bagging',
        title: String.raw`Bagging 集成方差缩减公式（含树间相关性 $\rho$）`,
        subtitle: '为什么 Random Forest 除了采样样本，还要随机采样特征子集？',
        latex: String.raw`\text{Var}\!\left(\frac{1}{M}\sum_{m=1}^M h_m(x)\right) = \htmlClass{formula-token formula-token-loss token-rho}{\rho\,\sigma_h^2} + \htmlClass{formula-token formula-token-output token-red}{\frac{1-\rho}{M}\sigma_h^2}`,
        numpyCode: `def bagging_variance(sigma_h_sq, rho, M):
    # 若 M 个基模型完全独立 (rho=0)，方差缩小为 1/M
    # 若基模型高度相关 (rho -> 1)，增加 M 无法消除第一项 rho * sigma^2
    irreducible_corr_term = rho * sigma_h_sq
    averaging_term = ((1.0 - rho) / M) * sigma_h_sq
    return irreducible_corr_term + averaging_term`,
        terms: [
          { id: 'rho', label: String.raw`模型间相关性 $\rho\sigma_h^2$`, role: 'loss', shape: 'scalar', explanation: String.raw`这是 $M \to \infty$ 时依然消不掉的方差地板！Random Forest 在每次分裂随机只看 $\sqrt{D}$ 个特征，正是为了强行压低树间相关性 $\rho$！`, numpyLines: [4] },
          { id: 'red', label: String.raw`可平均消除项 $\frac{1-\rho}{M}\sigma_h^2$`, role: 'output', shape: 'scalar', explanation: String.raw`随基学习器数量 $M$ 增大按 $1/M$ 迅速衰减。`, numpyLines: [5] },
        ],
      },
    ],
    pitfalls: [
      {
        title: '混淆训练误差（Training Error）与期望泛化误差（WA2 Q1）',
        detail: String.raw`训练误差是在同一份训练集 $S$ 上评估的乐观估计；期望泛化误差是先对未知测试分布 $(x, y)$ 求期望、再对不同随机训练集 $S$ 求期望的结果，高容量模型训练误差趋近 $0$ 但方差项会撑爆泛化误差。`,
      },
    ],
  },
];
