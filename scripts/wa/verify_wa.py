"""Independent re-check of the WA drills using different methods than the generator."""
import json
import math
import sys

import numpy as np
from scipy.signal import correlate2d
from scipy.special import expit, softmax
from sklearn.linear_model import LinearRegression

spec = json.load(open(sys.argv[1], encoding='utf-8'))
bad = 0


def check(qid, name, got, exp, tol=1e-3):
    global bad
    ok = np.allclose(np.asarray(got, float), np.asarray(exp, float), atol=tol)
    bad += not ok
    print(f"{'OK ' if ok else 'BAD'} {qid} {name}: {np.round(got, 4).tolist()} vs {np.round(exp, 4).tolist()}")


for s in spec:
    t, q = s['type'], s['id']
    if t == 'ols':
        m = LinearRegression().fit(np.array(s['X'], float), np.array(s['y'], float))
        check(q, 'w', [m.intercept_, *m.coef_], s['w'])
    elif t == 'ridge':
        x, y = np.array(s['x'], float), np.array(s['y'], float)
        from scipy.optimize import minimize
        for key, val in s['res'].items():
            scheme, lam = key.rsplit('-', 1)
            lam = float(lam)
            f = lambda w: np.mean((y - w[0] - w[1] * x) ** 2) + lam * (w[1] ** 2 + (w[0] ** 2 if scheme == 'both' else 0))
            check(q, key, minimize(f, [0, 0], tol=1e-12).x, val)
    elif t == 'logi':
        X = np.c_[np.ones(len(s['y'])), s['X']]
        y = np.array(s['y'])
        w = np.array(s['w'], float)
        # numerical gradient of the mean NLL, then one descent step
        nll = lambda w: -np.mean(y * np.log(expit(X @ w)) + (1 - y) * np.log(1 - expit(X @ w)))
        g = np.array([(nll(w + h) - nll(w - h)) / 2e-6 for h in np.eye(3) * 1e-6])
        wn = w - s['eta'] * g
        check(q, 'w_new', wn, s['w_new'])
        check(q, 'err', [np.mean((X @ wn > 0) != y)], [s['err']])
    elif t == 'minerr':
        grid = np.array([(0, 0), (0, 1), (1, 0), (1, 1)])
        lab = np.array(s['lab'])
        # brute-force: best achievable raw error over a dense weight grid
        best = min(np.mean(((w0 + w1 * grid[:, 0] + w2 * grid[:, 1]) > 0) != lab)
                   for w0 in np.linspace(-3, 3, 25) for w1 in np.linspace(-3, 3, 25) for w2 in np.linspace(-3, 3, 25))
        check(q, 'min raw err', [best], [s['err_raw']])
        Xi = np.c_[np.ones(4), grid, grid[:, 0] * grid[:, 1]]
        check(q, 'interaction err', [np.mean((Xi @ s['wi'] > 0) != lab)], [s['err_int']])
    elif t == 'gauss':
        (m1, s1), (m2, s2) = s['p'], s['q']
        xs = np.linspace(m1 - 12 * s1, m1 + 12 * s1, 200001)
        dx = xs[1] - xs[0]
        p = np.exp(-0.5 * ((xs - m1) / s1) ** 2) / (s1 * math.sqrt(2 * math.pi))
        lq = -0.5 * ((xs - m2) / s2) ** 2 - math.log(s2 * math.sqrt(2 * math.pi))
        ce = -np.sum(p * lq) * dx
        h = -np.sum(p * np.log(p + 1e-300)) * dx
        check(q, 'kl/ce', [ce - h, ce], [s['kl'], s['ce']])
    elif t == 'net':
        x, yv = np.array(s['x']), s['y']
        W1, W2, w3 = np.array(s['W1']), np.array(s['W2']), np.array(s['w3'])

        def loss(W1, W2, w3):
            p = expit(np.tanh(np.tanh(x @ W1) @ W2) @ w3)
            return -math.log(p if yv == 1 else 1 - p)

        def fd(name, i, j):
            h = 1e-6
            A = {'W1': W1.copy(), 'W2': W2.copy(), 'w3': w3.copy()}
            B = {'W1': W1.copy(), 'W2': W2.copy(), 'w3': w3.copy()}
            if name == 'w3':
                A['w3'][i] += h; B['w3'][i] -= h
            else:
                A[name][i, j] += h; B[name][i, j] -= h
            return (loss(A['W1'], A['W2'], A['w3']) - loss(B['W1'], B['W2'], B['w3'])) / (2 * h)

        check(q, 'p', [expit(np.tanh(np.tanh(x @ W1) @ W2) @ w3)], [s['p']])
        for g in (s['ga'], s['gb']):
            check(q, f'grad {g[0]}[{g[1]},{g[2]}]', [fd(g[0], g[1], g[2])], [g[3]], 1e-5)
        # hidden errors via finite differences on pre-activations
        a1 = x @ W1
        def from_a1(a):
            p = expit(np.tanh(np.tanh(a) @ W2) @ w3); return -math.log(p if yv == 1 else 1 - p)
        d1 = [(from_a1(a1 + e * 1e-6) - from_a1(a1 - e * 1e-6)) / 2e-6 for e in np.eye(2)]
        check(q, 'delta1', d1, s['d1'], 1e-5)
    elif t == 'bag':
        K, s2 = 5, 2.0
        cov = np.full((K, K), 0.25 * s2); np.fill_diagonal(cov, s2)
        check(q, 'var', [s2 / K, np.ones(K) @ cov @ np.ones(K) / K ** 2, 0.25 * s2], s['vals'])
    elif t == 'conv':
        o = np.maximum(correlate2d(np.array(s['img']), np.array(s['ker']), mode='valid') + s['b'], 0)
        check(q, 'Y', o.ravel(), np.array(s['out']).ravel(), 0)
    elif t == 'shape':
        W, D, K, F, S, P = s['in']
        x = np.zeros((W + 2 * P,))
        Wo = len(range(0, W + 2 * P - F + 1, S))
        check(q, 'shape/params/mult', [Wo, K * F * F * D + K, Wo * Wo * K * F * F * D], s['out'], 0)
    elif t == 'att':
        X = np.array(s['X'], float)
        def att(X, W):
            out = []
            A = []
            for qi in X @ np.array(W, float):
                w = softmax([qi @ k / math.sqrt(2) for k in X])
                A.append(w); out.append(sum(wj * v for wj, v in zip(w, X)))
            return np.array(A), np.array(out)
        Aa, Za = att(X, s['Wa']); Ab, Zb = att(X, s['Wb']); Ac, _ = att(X[s['perm']], s['Wa'])
        check(q, 'A(a)', Aa.ravel(), np.array(s['Aa']).ravel(), 1e-6)
        check(q, 'Z(a)', Za.ravel(), np.array(s['Za']).ravel(), 1e-6)
        check(q, 'A(b)', Ab.ravel(), np.array(s['Ab']).ravel(), 1e-6)
        check(q, 'A(c)=perm', Ac.ravel(), Aa[np.ix_(s['perm'], s['perm'])].ravel(), 1e-9)
        check(q, 'A(c)', Ac.ravel(), np.array(s['Ac']).ravel(), 1e-6)
    elif t == 'vae':
        z = np.array([0.5 + 1 * 1, -1 + 0.5 * -2])
        kl = sum(math.log(1 / sd) + (sd ** 2 + m ** 2) / 2 - 0.5 for m, sd in ((0.5, 1), (-1, 0.5)))
        rec = -(math.log(0.9) + math.log(0.8) + math.log(0.6))
        check(q, 'z/kl/rec', [*z, kl, rec], [*s['z'], s['kl'], s['rec']])
    elif t == 'gan':
        pr, pg = np.array([0.5, 0.3, 0.2]), np.array([0.2, 0.3, 0.5])
        from scipy.spatial.distance import jensenshannon
        js = jensenshannon(pr, pg) ** 2  # natural log by default
        D = pr / (pr + pg)
        check(q, 'D', D, s['D'])
        check(q, 'js & identity', [js, -math.log(4) + 2 * js], [s['js'], s['V']])
    elif t == 'guide':
        eps = 0.4 - 3 * math.sqrt(1 - 0.36) * 1.5
        mean = lambda e: (0.5 - 0.02 / 0.8 * e) / math.sqrt(0.98)
        check(q, 'eps/means', [eps, mean(0.4), mean(eps)], [s['eps'], s['m0'], s['m1']])
    elif t == 'cfm':
        x0, x1 = np.array([1, -2.0]), np.array([3, 2.0])
        xt = 0.75 * x0 + 0.25 * x1
        check(q, 'xt/target/loss', [*xt, *(x1 - x0), np.sum((np.array([1.5, 3]) - (x1 - x0)) ** 2)], [*s['xt'], *s['tgt'], s['loss']])
print(bad, 'problem(s)')
sys.exit(1 if bad else 0)
