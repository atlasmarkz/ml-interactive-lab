"""Generate WA-style multi-part calculation questions (original numbers) as TypeScript.

Writes:
  <repo>/src/data/review/waDrills.ts   – the questions
  <tools>/wa_spec.json                 – inputs + stated results, for independent verification
"""
import json
import math
import sys
from fractions import Fraction as Fr
from pathlib import Path

import numpy as np

repo, tools = Path(sys.argv[1]), Path(sys.argv[2])
BS = chr(92)
spec = []          # for the verifier
out = {}           # lectureId -> list of TS object literals


def f4(x):
    s = f'{x:.4f}'
    return '0.0000' if s == '-0.0000' else s


def frac(x: Fr):
    if x.denominator == 1:
        return str(x.numerator)
    sign = '-' if x < 0 else ''
    return f'{sign}{BS}tfrac{{{abs(x.numerator)}}}{{{x.denominator}}}'


def pmat(M, fmt=f4):
    rows = [' & '.join(fmt(v) for v in row) for row in M]
    return BS + 'begin{pmatrix}' + (BS * 2).join(rows) + BS + 'end{pmatrix}'


def vec(v, fmt=f4):
    return '(' + ', '.join(fmt(x) for x in v) + ')'


def add(lec, qid, prompt, answer, explanation, style):
    for s in (prompt, answer, explanation):
        assert '`' not in s and '${' not in s, qid
    out.setdefault(lec, []).append(
        '    {\n'
        f"      id: '{qid}', kind: 'calc',\n"
        f'      prompt: r`{prompt}`,\n'
        f'      answer: r`{answer}`,\n'
        f'      explanation: r`{explanation}`,\n'
        f"      style: '{style}',\n"
        '    }'
    )


sig = lambda z: 1 / (1 + math.exp(-z))

# ---------------------------------------------------------------- WA1 Q1: OLS with two features
OLS = [
    ([(0, 0), (0, 1), (1, 0), (1, 1), (2, 1)], [1, 3, 2, 5, 6]),
    ([(1, 0), (0, 1), (1, 1), (2, 0), (0, 2)], [3, 1, 4, 5, 2]),
    ([(0, 0), (1, 0), (0, 1), (1, 1)], [2, 4, 1, 4]),
]
for k, (X2, y) in enumerate(OLS, 1):
    X = [[Fr(1), Fr(a), Fr(b)] for a, b in X2]
    Y = [Fr(v) for v in y]
    XtX = [[sum(r[i] * r[j] for r in X) for j in range(3)] for i in range(3)]
    Xty = [sum(r[i] * yy for r, yy in zip(X, Y)) for i in range(3)]
    w = [Fr(v).limit_denominator(1000) for v in np.linalg.solve(np.array(XtX, float), np.array(Xty, float))]
    fitted = [sum(wi * xi for wi, xi in zip(w, r)) for r in X]
    pts = '，'.join(f'$({a}, {b};\\ {yy})$' for (a, b), yy in zip(X2, y))
    add('l01', f'l01-wa{k}',
        f'对数据（格式 $(x_1, x_2;\\ y)$）{pts} 做含截距的线性回归 $y = w_0 + w_1x_1 + w_2x_2$。(a) 写出 $\\mathbf{{X}}^\\top\\mathbf{{X}}$ 与 $\\mathbf{{X}}^\\top\\mathbf{{y}}$；(b) 手算 OLS 解；(c) 给出拟合值。',
        f'(a) $$\\mathbf{{X}}^\\top\\mathbf{{X}} = {pmat(XtX, lambda v: frac(v))},\\quad \\mathbf{{X}}^\\top\\mathbf{{y}} = {vec(Xty, frac)}^\\top$$ (b) $\\hat{{\\mathbf{{w}}}} = {vec(w, frac)}$；(c) 拟合值 ${vec(fitted, frac)}$',
        f'解正规方程 $\\mathbf{{X}}^\\top\\mathbf{{X}}\\mathbf{{w}} = \\mathbf{{X}}^\\top\\mathbf{{y}}$（3 个未知数、3 个方程，用消元法）。检查：含截距时残差之和应为 0，这里残差 ${vec([yy - fv for yy, fv in zip(Y, fitted)], frac)}$ 之和为 {frac(sum(yy - fv for yy, fv in zip(Y, fitted)))}。',
        'WA1 Q1 题型')
    spec.append({'type': 'ols', 'id': f'l01-wa{k}', 'X': X2, 'y': y, 'w': [float(v) for v in w]})

# ---------------------------------------------------------------- WA1 Q2: ridge schemes on 3 points
RIDGE = [([0, 1, 2], [2, 1, 3]), ([0, 1, 2], [0, 2, 1])]
for k, (xs, ys) in enumerate(RIDGE, 1):
    n = len(xs)
    X = np.c_[np.ones(n), xs]
    y = np.array(ys, float)
    res = {}
    for name, D in (('only_w1', np.diag([0, 1])), ('both', np.eye(2))):
        for lam in (1, 10):
            res[(name, lam)] = np.linalg.solve(X.T @ X / n + lam * D, X.T @ y / n)
    ols = np.linalg.solve(X.T @ X, X.T @ y)
    pts = '，'.join(f'$({a}, {b})$' for a, b in zip(xs, ys))
    add('l01', f'l01-wa-r{k}',
        f'三个点 {pts}。最小化 $\\frac13\\sum_i (y_i - w_0 - w_1x_i)^2 + \\lambda\\,R(\\mathbf{{w}})$，分别求下列四种方案的 $(w_0, w_1)$：只惩罚 $w_1$（$R = w_1^2$），$\\lambda = 1$ 与 $\\lambda = 10$；同时惩罚两者（$R = w_0^2 + w_1^2$），$\\lambda = 1$ 与 $\\lambda = 10$。再与不加正则化的 OLS 比较。',
        f'只惩罚 $w_1$：$\\lambda = 1$ 时 ${vec(res[("only_w1", 1)])}$，$\\lambda = 10$ 时 ${vec(res[("only_w1", 10)])}$；惩罚两者：$\\lambda = 1$ 时 ${vec(res[("both", 1)])}$，$\\lambda = 10$ 时 ${vec(res[("both", 10)])}$；OLS 为 ${vec(ols)}$',
        f'令梯度为 0 得 $\\big(\\tfrac13\\mathbf{{X}}^\\top\\mathbf{{X}} + \\lambda\\mathbf{{D}}\\big)\\mathbf{{w}} = \\tfrac13\\mathbf{{X}}^\\top\\mathbf{{y}}$，只惩罚斜率时 $\\mathbf{{D}} = \\mathrm{{diag}}(0, 1)$，两者都惩罚时 $\\mathbf{{D}} = \\mathbf{{I}}$。这里 $\\tfrac13\\mathbf{{X}}^\\top\\mathbf{{X}} = {pmat(X.T @ X / n)}$，$\\tfrac13\\mathbf{{X}}^\\top\\mathbf{{y}} = {vec(X.T @ y / n)}^\\top$。规律：只惩罚斜率时截距向 $\\bar y$ 靠拢、直线变平；同时惩罚截距时整条线被拉向原点。',
        'WA1 Q2 题型')
    spec.append({'type': 'ridge', 'id': f'l01-wa-r{k}', 'x': xs, 'y': ys, 'res': {f'{a}-{b}': list(v) for (a, b), v in res.items()}})

# ---------------------------------------------------------------- WA1 Q3: one batch GD step (mean gradient)
LOGI = [
    ([(0, 0), (0, 1), (1, 0), (1, 1)], [0, 1, 1, 1], [-1, 1, 1], 0.5),
    ([(0, 0), (0, 1), (1, 0), (1, 1)], [0, 0, 1, 1], [0.5, -1, 0.5], 1.0),
    ([(1, 2), (2, 0), (0, 1), (2, 2)], [1, 1, 0, 1], [0, 0.5, -0.5], 0.4),
]
for k, (X2, y, w0, eta) in enumerate(LOGI, 1):
    N = len(y)
    X = np.c_[np.ones(N), X2]
    w = np.array(w0, float)
    z = X @ w
    p = np.array([sig(v) for v in z])
    r = np.array(y) - p
    w_new = w + eta / N * (r @ X)
    z_new = X @ w_new
    pred = (z_new > 0).astype(int)
    err = (pred != np.array(y)).mean()
    pred_old = (z > 0).astype(int)
    err_old = (pred_old != np.array(y)).mean()
    table = '；'.join(f'$x^{{({i + 1})}}$: $z = {f4(z[i])}$, $\\sigma = {f4(p[i])}$, $y - \\sigma = {f4(r[i])}$' for i in range(N))
    pts = '，'.join(f'$({a}, {b};\\ {yy})$' for (a, b), yy in zip(X2, y))
    add('l02-1', f'l02-1-wa{k}',
        f'数据 $(x_1, x_2;\\ y)$：{pts}。模型 $p(y = 1|\\mathbf{{x}}) = \\sigma(w_0 + w_1x_1 + w_2x_2)$，初值 $\\mathbf{{w}} = {vec(w0, lambda v: str(v))}$，学习率 $\\eta = {eta}$。按 $w_j \\leftarrow w_j + \\frac{{\\eta}}{{N}}\\sum_i\\big(y_i - \\sigma(z_i)\\big)x_{{i,j}}$ 做一次 batch 梯度下降，求新权重以及更新前后的训练错误率（以 $z > 0$ 判为 1）。',
        f'新权重 $\\mathbf{{w}} = {vec(w_new)}$；训练错误率：更新前 {err_old:.0%} → 更新后 {err:.0%}',
        f'{table}。梯度项 $\\sum_i (y_i - \\sigma_i)\\mathbf{{x}}_i = {vec(r @ X)}$，乘以 $\\eta/N = {eta / N:g}$ 后加到 $\\mathbf{{w}}$ 上。更新后的 logits 为 ${vec(z_new)}$，预测 ${vec(pred, str)}$。',
        'WA1 Q3 题型')
    spec.append({'type': 'logi', 'id': f'l02-1-wa{k}', 'X': X2, 'y': y, 'w': w0, 'eta': eta, 'w_new': list(w_new), 'err': err})

# ---------------------------------------------------------------- WA1 Q4: minimum training error
MINERR = [
    ([1, 0, 0, 0], [0.5, -1, -1], None, '只有 (0,0) 为正：一条直线就能分开（NOR 模式）'),
    ([0, 1, 1, 0], [-0.5, 1, 1], [-0.5, 1, 1, -2], 'XOR 模式'),
]
grid = [(0, 0), (0, 1), (1, 0), (1, 1)]
for k, (lab, wr, wi, note) in enumerate(MINERR, 1):
    X = np.c_[np.ones(4), grid]
    err_raw = ((X @ wr > 0).astype(int) != np.array(lab)).mean()
    labs = '，'.join(f'$({a}, {b})\\to {l}$' for (a, b), l in zip(grid, lab))
    if wi is None:
        ans = f'只用 $x_1, x_2$ 即可达到 0 错误，例如 $\\mathbf{{w}} = {vec(wr, lambda v: f"{v:g}")}$；加入 $x_1x_2$ 后仍为 0'
        exp = f'{note}。代入四个点的 logits 为 ${vec(X @ wr, lambda v: f"{v:g}")}$，只有第一个为正，与标签一致。'
    else:
        Xi = np.c_[X, [a * b for a, b in grid]]
        err_int = ((Xi @ wi > 0).astype(int) != np.array(lab)).mean()
        ans = f'只用原始特征最少错 {err_raw:.0%}（例如 $\\mathbf{{w}} = {vec(wr, lambda v: f"{v:g}")}$，错 1 个点）；加入 $x_1x_2$ 后可降到 {err_int:.0%}，例如 $\\mathbf{{w}} = {vec(wi, lambda v: f"{v:g}")}$'
        exp = (f'{note}不可线性分开：若四个点都分对，需要 $w_0 < 0$、$w_0 + w_1 > 0$、$w_0 + w_2 > 0$、$w_0 + w_1 + w_2 < 0$；把中间两式相加得 $2w_0 + w_1 + w_2 > 0$，把首尾两式相加得 $2w_0 + w_1 + w_2 < 0$，矛盾。'
               f'带交叉项的 logits 为 ${vec(Xi @ wi, lambda v: f"{v:g}")}$，符号与标签完全一致。')
        spec.append({'type': 'minerr', 'id': f'l02-1-wa-m{k}', 'lab': lab, 'wr': wr, 'wi': wi, 'err_raw': err_raw, 'err_int': err_int})
    add('l02-1', f'l02-1-wa-m{k}',
        f'四个点的标签为 {labs}。(a) 只用 $x_1, x_2$ 的 Logistic 回归，最小训练错误率是多少？给出达到它的权重。(b) 加入特征 $x_1x_2$ 后呢？',
        ans, exp, 'WA1 Q4 题型')

# ---------------------------------------------------------------- WA1 Q6: Gaussian KL / CE
GAUSS = [((1, 1), (3, 2)), ((0, 2), (0, 1))]
for k, ((m1, s1), (m2, s2)) in enumerate(GAUSS, 1):
    kl = math.log(s2 / s1) + (s1 ** 2 + (m1 - m2) ** 2) / (2 * s2 ** 2) - 0.5
    ce = 0.5 * math.log(2 * math.pi * s2 ** 2) + (s1 ** 2 + (m1 - m2) ** 2) / (2 * s2 ** 2)
    h = 0.5 * math.log(2 * math.pi * math.e * s1 ** 2)
    add('l02-1', f'l02-1-wa-g{k}',
        f'$p = \\mathcal{{N}}({m1}, {s1}^2)$，$q = \\mathcal{{N}}({m2}, {s2}^2)$。计算 $D_{{\\mathrm{{KL}}}}(p\\|q)$、$H(p, q)$ 与 $H(p)$（自然对数，4 位小数），并验证三者的关系。',
        f'$D_{{\\mathrm{{KL}}}}(p\\|q) = {f4(kl)}$，$H(p,q) = {f4(ce)}$，$H(p) = {f4(h)}$，且 ${f4(h)} + {f4(kl)} = {f4(h + kl)} = H(p,q)$',
        f'$D_{{\\mathrm{{KL}}}} = \\ln\\frac{{\\sigma_2}}{{\\sigma_1}} + \\frac{{\\sigma_1^2 + (\\mu_1-\\mu_2)^2}}{{2\\sigma_2^2}} - \\frac12$；$H(p,q) = \\frac12\\ln(2\\pi\\sigma_2^2) + \\frac{{\\sigma_1^2 + (\\mu_1-\\mu_2)^2}}{{2\\sigma_2^2}}$；$H(p) = \\frac12\\ln(2\\pi e\\sigma_1^2)$。',
        'WA1 Q6 题型')
    spec.append({'type': 'gauss', 'id': f'l02-1-wa-g{k}', 'p': [m1, s1], 'q': [m2, s2], 'kl': kl, 'ce': ce})

# ---------------------------------------------------------------- WA2 Q3: 2-2-2-1 tanh network, backprop
NETS = [
    ((2, 1), 1, [[1, -1], [0.5, 1]], [[1, -1], [1, 1]], [1, -1], ('W2', 1, 0), ('W1', 0, 1)),
    ((1, -1), 0, [[0.5, 1], [-1, 0.5]], [[1, 1], [-1, 1]], [-1, 2], ('W2', 0, 1), ('W1', 1, 0)),
    ((0.5, 2), 1, [[-1, 1], [1, 0.25]], [[0.5, -1], [1, 1]], [2, 1], ('w3', 1, None), ('W1', 1, 1)),
]
for k, (x, yv, W1, W2, w3, ga, gb) in enumerate(NETS, 1):
    x = np.array(x, float); W1 = np.array(W1, float); W2 = np.array(W2, float); w3 = np.array(w3, float)
    a1 = x @ W1; h1 = np.tanh(a1)
    a2 = h1 @ W2; h2 = np.tanh(a2)
    z = h2 @ w3; p1 = sig(z)
    loss = -math.log(p1 if yv == 1 else 1 - p1)
    dz = p1 - yv
    d2 = dz * w3 * (1 - h2 ** 2)
    d1 = (W2 @ d2) * (1 - h1 ** 2)
    gW2 = np.outer(h1, d2); gW1 = np.outer(x, d1); gw3 = dz * h2

    def gname(g):
        name, i, j = g
        if name == 'w3':
            return f'w^{{(3)}}_{{{i + 1}}}', gw3[i]
        M, lay, src = (gW2, 2, 'u_{1') if name == 'W2' else (gW1, 1, 'x_{')
        return f'w^{{({lay})}}_{{{i + 1}{j + 1}}}', M[i, j]

    na, va = gname(ga); nb, vb = gname(gb)
    assert abs(va) > 1e-4 and abs(vb) > 1e-4, (k, va, vb)
    sgn = lambda v: '减小' if v > 0 else '增大'
    add('l04', f'l04-wa{k}',
        f'网络：输入 $(x_1, x_2)$ → 两个 tanh 隐藏单元 $u_{{11}}, u_{{12}}$ → 两个 tanh 隐藏单元 $u_{{21}}, u_{{22}}$ → 一个 sigmoid 输出，均无偏置。权重矩阵行表示来源、列表示去向：$\\mathbf{{W}}^{{(1)}} = {pmat(W1, lambda v: f"{v:g}")}$，$\\mathbf{{W}}^{{(2)}} = {pmat(W2, lambda v: f"{v:g}")}$，$\\mathbf{{w}}^{{(3)}} = {vec(w3, lambda v: f"{v:g}")}$。训练样本 $(x_1, x_2, y) = ({x[0]:g}, {x[1]:g}, {yv})$，损失 $L = -\\log p(y|\\mathbf{{x}})$。(a) 求所有隐藏单元输出、logit $z$ 与 $p(y=1|\\mathbf{{x}})$；(b) 求输出误差 $\\partial L/\\partial z$ 与所有隐藏单元的误差 $\\partial L/\\partial a$；(c) 求 $\\partial L/\\partial {na}$ 与 $\\partial L/\\partial {nb}$，为减小损失应增大还是减小它们？',
        f'(a) 第一层 $\\mathbf{{u}}_1 = {vec(h1)}$，第二层 $\\mathbf{{u}}_2 = {vec(h2)}$，$z = {f4(z)}$，$p(y=1|\\mathbf{{x}}) = {f4(p1)}$，$L = {f4(loss)}$；(b) $\\partial L/\\partial z = {f4(dz)}$，第二层误差 ${vec(d2)}$，第一层误差 ${vec(d1)}$；(c) $\\partial L/\\partial {na} = {f4(va)}$（应{sgn(va)}），$\\partial L/\\partial {nb} = {f4(vb)}$（应{sgn(vb)}）',
        f'前向：$\\mathbf{{a}}_1 = \\mathbf{{x}}^\\top\\mathbf{{W}}^{{(1)}} = {vec(a1)}$，$\\mathbf{{a}}_2 = \\mathbf{{u}}_1^\\top\\mathbf{{W}}^{{(2)}} = {vec(a2)}$。反向：sigmoid + 交叉熵给出 $\\partial L/\\partial z = p - y$；第二层 $\\delta_{{2j}} = \\frac{{\\partial L}}{{\\partial z}}w^{{(3)}}_j(1 - u_{{2j}}^2)$；第一层 $\\delta_{{1i}} = (1 - u_{{1i}}^2)\\sum_j w^{{(2)}}_{{ij}}\\delta_{{2j}}$。某权重的梯度 = 它的来源激活 × 去向单元的误差；梯度下降朝负梯度方向移动。',
        'WA2 Q3 题型')
    spec.append({'type': 'net', 'id': f'l04-wa{k}', 'x': list(x), 'y': yv, 'W1': W1.tolist(), 'W2': W2.tolist(), 'w3': list(w3),
                 'p': p1, 'd1': list(d1), 'd2': list(d2), 'ga': [ga[0], ga[1], ga[2], va], 'gb': [gb[0], gb[1], gb[2], vb]})

# ---------------------------------------------------------------- WA2 QX: bagging
add('l03', 'l03-wa1',
    '5 个回归模型在相互独立、同分布的训练集上训练，每个模型的方差分量为 2。(a) 平均这 5 个模型后的方差分量？(b) 若模型两两相关系数为 0.25（每个方差仍为 2），平均后的方差分量？(c) 后一种情况下，平均无穷多个模型的极限是多少？',
    r'(a) $2/5 = 0.4$；(b) $0.25\times2 + \frac{0.75}{5}\times2 = 0.5 + 0.3 = 0.8$；(c) $\rho\sigma^2 = 0.5$',
    r'$\mathrm{Var}\big(\frac1K\sum_k h_k\big) = \frac{1}{K^2}\big[K\sigma^2 + K(K-1)\rho\sigma^2\big] = \rho\sigma^2 + \frac{1-\rho}{K}\sigma^2$。相关部分无法靠平均消除，这就是 bagging / 随机森林要降低模型间相关性的原因。',
    'WA2 Question X 题型')
spec.append({'type': 'bag', 'id': 'l03-wa1', 'vals': [0.4, 0.8, 0.5]})

# ---------------------------------------------------------------- WA3 Q1: convolution with bias + ReLU
CONV = [
    ([[2, 0, 1, 3, 1], [1, 4, 2, 0, 2], [3, 1, 5, 2, 0], [0, 2, 1, 4, 3], [1, 3, 0, 1, 2]], [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], -3),
    ([[1, 2, 0, 1, 3], [0, 1, 3, 2, 1], [2, 0, 1, 4, 2], [3, 1, 2, 0, 1], [1, 4, 0, 2, 2]], [[1, 0, -1], [2, 0, -2], [1, 0, -1]], 1),
    ([[3, 1, 2, 0, 1], [2, 0, 1, 3, 2], [1, 2, 4, 1, 0], [0, 3, 1, 2, 1], [2, 1, 0, 1, 3]], [[0, 1, 0], [1, -4, 1], [0, 1, 0]], 2),
]
LBL = 'abcdefghi'
for k, (img, ker, b) in enumerate(CONV, 1):
    I = np.array(img); K = np.array(ker)
    pre = np.array([[(I[i:i + 3, j:j + 3] * K).sum() + b for j in range(3)] for i in range(3)])
    outm = np.maximum(pre, 0)
    asked = [(0, 0), (0, 1), (1, 1), (1, 2)]
    parts = [f'{LBL[i * 3 + j]} = \\max(0, {pre[i, j] - b} {"+" if b >= 0 else "-"} {abs(b)}) = {outm[i, j]}' for i, j in asked]
    add('l06', f'l06-wa{k}',
        f'图像 $X = {pmat(img, str)}$，滤波器 $F = {pmat(ker, str)}$，步长 1、无填充，偏置 $b = {b}$，激活 ReLU。输出 $Y$ 是 3×3，按行记为 $\\begin{{pmatrix}}a&b&c\\\\d&e&f\\\\g&h&i\\end{{pmatrix}}$。求 $a, b, e, f$（再试着写出完整的 $Y$）。',
        f'${", ".join(LBL[i * 3 + j] + " = " + str(outm[i, j]) for i, j in asked)}$；完整输出 $$Y = {pmat(outm, str)}$$',
        f'对每个 3×3 窗口逐元素相乘再求和（互相关，不翻转核），加偏置后过 ReLU：$' + r';\ '.join(parts) + '$。负的净输入在 ReLU 后变为 0。',
        'WA3 Q1 题型')
    spec.append({'type': 'conv', 'id': f'l06-wa{k}', 'img': img, 'ker': ker, 'b': b, 'out': outm.tolist()})

# ---------------------------------------------------------------- WA3 Q2: shapes / params / mults
SHAPES = [(32, 128, 256, 3, 1, 1), (55, 96, 256, 5, 1, 2), (13, 384, 384, 3, 1, 1), (63, 3, 64, 7, 2, 3)]
for k, (W, D, Kf, F, S, P) in enumerate(SHAPES, 1):
    num = W - F + 2 * P
    if num % S:
        W += 1
        num = W - F + 2 * P
    Wo = num // S + 1
    params = Kf * (F * F * D + 1)
    mult = Wo * Wo * Kf * F * F * D
    add('l06', f'l06-wa-s{k}',
        f'卷积层输入为 ${W}\\times{W}\\times{D}$（宽 × 高 × 深），使用 {Kf} 个 ${F}\\times{F}$ 滤波器，步长 {S}，零填充 {P}。求输出形状、参数量（含偏置）以及计算所有输出单元净输入所需的乘法次数。',
        f'输出 ${Wo}\\times{Wo}\\times{Kf}$；参数 ${Kf}\\times({F}\\cdot{F}\\cdot{D} + 1) = {params:,}$；乘法 ${Wo}\\cdot{Wo}\\cdot{Kf}\\times{F * F * D:,} = {mult:,}$',
        f'空间尺寸 $({W} - {F} + 2\\cdot{P})/{S} + 1 = {Wo}$（先检查能整除）；每个滤波器覆盖全部 {D} 个输入通道；每个输出单元需要 $F^2D_1 = {F * F * D:,}$ 次乘法，共 ${Wo * Wo * Kf:,}$ 个输出单元，偏置只需加法。',
        'WA3 Q2 题型')
    spec.append({'type': 'shape', 'id': f'l06-wa-s{k}', 'in': [W, D, Kf, F, S, P], 'out': [Wo, params, mult]})

# ---------------------------------------------------------------- WA3 Q5: self-attention
ATT = [
    ([[1, 0], [0, 1], [1, 1], [0.5, 0]], [[1, 0], [0, 1]], [[2, 0], [0, 0]], [3, 0, 1, 2]),
    ([[0, 2], [1, 1], [2, 0], [1, 0]], [[1, 0], [0, 1]], [[0, 1], [1, 0]], [1, 2, 3, 0]),
    ([[1, 1], [-1, 0], [0, 1], [1, -1]], [[1, 0], [0, 1]], [[1, 1], [0, 0]], [2, 3, 0, 1]),
]
names = ['x_1', 'x_2', 'x_3', 'x_4']


def attention(X, WQ):
    Q = X @ WQ
    S = Q @ X.T / math.sqrt(2)
    A = np.exp(S - S.max(1, keepdims=True))
    A /= A.sum(1, keepdims=True)
    return A, A @ X


for k, (Xl, Wa, Wb, perm) in enumerate(ATT, 1):
    X = np.array(Xl, float)
    Aa, Za = attention(X, np.array(Wa, float))
    Ab, Zb = attention(X, np.array(Wb, float))
    Xp = X[perm]
    Ac, Zc = attention(Xp, np.array(Wa, float))
    toks = '，'.join(f'${n} = ({v[0]:g}, {v[1]:g})$' for n, v in zip(names, Xl))
    ptoks = '，'.join(f'$({v[0]:g}, {v[1]:g})$' for v in Xp)
    add('l08-1', f'l08-1-wa{k}',
        f'自注意力层输入 4 个 token：{toks}（行向量）。$\\mathbf{{W}}^K = \\mathbf{{W}}^V = \\mathbf{{I}}$，打分用缩放点积 $\\mathbf{{q}}_i^\\top\\mathbf{{k}}_j/\\sqrt{{2}}$，无掩码。(a) $\\mathbf{{W}}^Q_1 = {pmat(Wa, lambda v: f"{v:g}")}$ 时的注意力权重矩阵与输出；(b) $\\mathbf{{W}}^Q_2 = {pmat(Wb, lambda v: f"{v:g}")}$ 时呢？(c) 在 (a) 的设置下，若输入顺序变为 {ptoks}，注意力权重如何变化？',
        f'(a) $$\\mathbf{{A}} = {pmat(Aa)}$$ $$\\mathbf{{Z}} = {pmat(Za)}$$ (b) $$\\mathbf{{A}} = {pmat(Ab)}$$ $$\\mathbf{{Z}} = {pmat(Zb)}$$ (c) $$\\mathbf{{A}} = {pmat(Ac)}$$ 即 (a) 中矩阵的行和列按同一置换重排，输出也同样重排',
        f'步骤：$\\mathbf{{Q}} = \\mathbf{{X}}\\mathbf{{W}}^Q$，$\\mathbf{{E}} = \\mathbf{{Q}}\\mathbf{{X}}^\\top/\\sqrt2$，每行 softmax 得 $\\mathbf{{A}}$，$\\mathbf{{Z}} = \\mathbf{{A}}\\mathbf{{X}}$。例如 (a) 中 $\\mathbf{{z}}_1$ 的打分为 ${vec((X @ np.array(Wa, float))[0] @ X.T / math.sqrt(2))}$。改变 $\\mathbf{{W}}^Q$ 改变「谁关注谁」；改变输入顺序只让结果同样重排（置换等变）。',
        'WA3 Q5 题型')
    spec.append({'type': 'att', 'id': f'l08-1-wa{k}', 'X': Xl, 'Wa': Wa, 'Wb': Wb, 'perm': perm, 'Aa': Aa.tolist(), 'Ab': Ab.tolist(), 'Ac': Ac.tolist(), 'Za': Za.tolist(), 'Zb': Zb.tolist()})

# ---------------------------------------------------------------- WA4-style numeric drills
# VAE
mu = np.array([0.5, -1.0]); logv = np.array([0.0, math.log(0.25)]); eps = np.array([1.0, -2.0])
zv = mu + np.exp(0.5 * logv) * eps
kl = -0.5 * np.sum(1 + logv - mu ** 2 - np.exp(logv))
xh = np.array([0.9, 0.2, 0.6]); xt = np.array([1, 0, 1])
rec = -np.sum(xt * np.log(xh) + (1 - xt) * np.log(1 - xh))
add('l10', 'l10-wa1',
    r'VAE 编码器对某个输入输出 $\boldsymbol{\mu} = (0.5, -1)$，$\log\boldsymbol{\sigma}^2 = (0, \ln 0.25)$，采样得 $\boldsymbol{\epsilon} = (1, -2)$。(a) 求重参数化后的 $\mathbf{z}$；(b) 求 KL 项；(c) 解码器输出 3 个像素的 Bernoulli 均值 $(0.9, 0.2, 0.6)$，原图像素为 $(1, 0, 1)$，求重建项 $-\log p(\mathbf{x}|\mathbf{z})$ 与负 ELBO。',
    f'(a) $\\mathbf{{z}} = {vec(zv)}$；(b) KL $= {f4(kl)}$；(c) 重建项 $= {f4(rec)}$，负 ELBO $= {f4(rec + kl)}$',
    f'$\\boldsymbol{{\\sigma}} = (1, 0.5)$，$\\mathbf{{z}} = \\boldsymbol{{\\mu}} + \\boldsymbol{{\\sigma}}\\odot\\boldsymbol{{\\epsilon}}$；KL $= -\\frac12\\sum_j(1 + \\log\\sigma_j^2 - \\mu_j^2 - \\sigma_j^2)$，两维分别为 {f4(-0.5 * (1 + logv[0] - mu[0] ** 2 - math.exp(logv[0])))} 与 {f4(-0.5 * (1 + logv[1] - mu[1] ** 2 - math.exp(logv[1])))}；重建项 $= -[\\ln0.9 + \\ln0.8 + \\ln0.6]$（第二个像素为 0，所以取 $\\ln(1 - 0.2)$）。',
    'WA4 Q1 相关')
spec.append({'type': 'vae', 'id': 'l10-wa1', 'z': list(zv), 'kl': kl, 'rec': rec})

# GAN on a 3-point space
pr = np.array([0.5, 0.3, 0.2]); pg = np.array([0.2, 0.3, 0.5])
Ds = pr / (pr + pg)
V = np.sum(pr * np.log(Ds)) + np.sum(pg * np.log(1 - Ds))
m = (pr + pg) / 2
js = 0.5 * np.sum(pr * np.log(pr / m)) + 0.5 * np.sum(pg * np.log(pg / m))
add('l11', 'l11-wa1',
    r'数据只有三个取值 $\{a, b, c\}$。真实分布 $p_r = (0.5, 0.3, 0.2)$，生成分布 $p_g = (0.2, 0.3, 0.5)$。(a) 求最优判别器 $D^*$ 在三点的取值；(b) 求 $V(G, D^*) = \mathbb{E}_{p_r}[\log D^*] + \mathbb{E}_{p_g}[\log(1 - D^*)]$；(c) 求 $\mathrm{JS}(p_r\|p_g)$ 并验证 $V = -\log4 + 2\,\mathrm{JS}$。',
    f'(a) $D^* = {vec(Ds)}$；(b) $V = {f4(V)}$；(c) $\\mathrm{{JS}} = {f4(js)}$，$-\\log4 + 2\\times{f4(js)} = {f4(-math.log(4) + 2 * js)}$',
    r'$D^*(x) = p_r(x)/(p_r(x) + p_g(x))$；在 $b$ 处两分布相等，$D^* = 0.5$。JS 用中点分布 $m = (p_r + p_g)/2 = (0.35, 0.3, 0.35)$ 计算。$V$ 比完美生成器时的 $-\log 4$ 大，差值就是 $2\,\mathrm{JS}$。',
    'WA4 Q2 相关')
spec.append({'type': 'gan', 'id': 'l11-wa1', 'D': list(Ds), 'V': V, 'js': js})

# Classifier guidance numeric
eps_h, grad, w_g, abar, alpha, xt_ = 0.4, 1.5, 3.0, 0.36, 0.98, 0.5
eps_g = eps_h - w_g * math.sqrt(1 - abar) * grad
mean0 = (xt_ - (1 - alpha) / math.sqrt(1 - abar) * eps_h) / math.sqrt(alpha)
mean1 = (xt_ - (1 - alpha) / math.sqrt(1 - abar) * eps_g) / math.sqrt(alpha)
add('l12', 'l12-wa1',
    r'某个像素：$\mathbf{x}_t = 0.5$，$\bar\alpha_t = 0.36$，$\alpha_t = 0.98$，噪声预测 $\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t) = 0.4$，带噪分类器给出 $\nabla_{\mathbf{x}_t}\log p_\phi(y|\mathbf{x}_t) = 1.5$，引导强度 $w = 3$。(a) 求引导后的噪声预测 $\hat{\boldsymbol{\epsilon}}$；(b) 分别求不引导与引导时 $\mathbf{x}_{t-1}$ 的均值（即令 $\mathbf{z} = 0$）。',
    f'(a) $\\hat{{\\boldsymbol{{\\epsilon}}}} = 0.4 - 3\\times0.8\\times1.5 = {f4(eps_g)}$；(b) 不引导 ${f4(mean0)}$，引导 ${f4(mean1)}$',
    r'$\hat{\boldsymbol{\epsilon}} = \boldsymbol{\epsilon}_\theta - w\sqrt{1-\bar\alpha_t}\,\nabla\log p_\phi(y|\mathbf{x}_t)$，$\sqrt{1-\bar\alpha_t} = 0.8$；均值 $= \frac{1}{\sqrt{\alpha_t}}\big(\mathbf{x}_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\hat{\boldsymbol{\epsilon}}\big)$。分类器梯度为正，引导把样本往增大 $p(y|\mathbf{x}_t)$ 的方向推，所以均值变大。',
    'WA4 Q3 题型')
spec.append({'type': 'guide', 'id': 'l12-wa1', 'eps': eps_g, 'm0': mean0, 'm1': mean1})

# CFM numeric
x0 = np.array([1.0, -2.0]); x1 = np.array([3.0, 2.0]); t = 0.25; v = np.array([1.5, 3.0])
xt = (1 - t) * x0 + t * x1; tgt = x1 - x0; lossv = np.sum((v - tgt) ** 2)
add('l13', 'l13-wa1',
    r'CFM 训练中采到 $t = 0.25$、噪声 $\mathbf{x}_0 = (1, -2)$、数据 $\mathbf{x}_1 = (3, 2)$，网络在 $(\mathbf{x}_t, t)$ 处输出 $\mathbf{v}_\theta = (1.5, 3)$。求 $\mathbf{x}_t$、训练目标与该样本的损失 $\|\mathbf{v}_\theta - (\mathbf{x}_1 - \mathbf{x}_0)\|^2$；若用这个目标速度从 $\mathbf{x}_t$ 匀速走到 $t = 1$，会到达哪里？',
    f'$\\mathbf{{x}}_t = {vec(xt, lambda v: f"{v:g}")}$，目标 $= {vec(tgt, lambda v: f"{v:g}")}$，损失 $= {lossv:g}$；走 $0.75$ 个单位时间后到达 ${vec(xt + 0.75 * tgt, lambda v: f"{v:g}")} = \\mathbf{{x}}_1$',
    r'$\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\mathbf{x}_1$；目标速度与 $t$ 无关，所以条件轨迹是匀速直线。损失 $= (1.5-2)^2 + (3-4)^2$。',
    'WA4 Q4 相关')
spec.append({'type': 'cfm', 'id': 'l13-wa1', 'xt': list(xt), 'tgt': list(tgt), 'loss': lossv})

# ---------------------------------------------------------------- emit
body = []
for lec, items in out.items():
    body.append(f"  '{lec}': [\n" + ',\n'.join(items) + ',\n  ],')
ts = ("import { QuizQuestion } from '../../types/review';\n\nconst r = String.raw;\n\n"
      "/**\n * Generated WA-style multi-part calculation drills (original numbers).\n"
      " * Produced by scripts/wa/gen_wa.py and re-checked by scripts/wa/verify_wa.py; edit the generator, not the numbers.\n */\n"
      "export const WA_DRILLS: Record<string, QuizQuestion[]> = {\n" + '\n'.join(body) + '\n};\n')
(repo / 'src' / 'data' / 'review' / 'waDrills.ts').write_text(ts, encoding='utf-8', newline='\n')
(tools / 'wa_spec.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1), encoding='utf-8')
print({k: len(v) for k, v in out.items()}, 'total', sum(len(v) for v in out.values()))
