import { LectureModule } from '../types/curriculum';

export const LECTURES_PART_4: LectureModule[] = [
  {
    id: 'l10',
    code: 'L10',
    partGroup: 'Part 4 · Generative Models for Images',
    slug: 'l10-vae',
    slides: ['l10.pdf', 'l10-vae-postclass.pdf'],
    examWeight: 'core',
    titleZh: '变分自编码器 (VAE)：生成模型、ELBO 与重参数化',
    titleEn: 'Variational Autoencoders: Latent-Variable Model, ELBO & the Reparameterization Trick',
    abstract: String.raw`VAE 假设每张图像 $\mathbf{x}$ 由低维隐变量 $\mathbf{z}\sim\mathcal{N}(\mathbf{0},\mathbf{I})$ 经解码器 $p_\theta(\mathbf{x}|\mathbf{z})$ 生成。直接最大化 $\log p_\theta(\mathbf{x}) = \log\int p_\theta(\mathbf{x}|\mathbf{z})p(\mathbf{z})d\mathbf{z}$ 不可行，于是引入编码器 $q_\phi(\mathbf{z}|\mathbf{x})$ 并最大化变分下界 ELBO = 重建项 − KL 正则项；用重参数化 $\mathbf{z} = \boldsymbol{\mu} + \boldsymbol{\sigma}\odot\boldsymbol{\epsilon}$ 让采样可反向传播。`,
    readingChecklist: [
      String.raw`生成模型：$\mathbf{z}\sim\mathcal{N}(\mathbf{0},\mathbf{I})$，$p_\theta(\mathbf{x}|\mathbf{z}) = \mathcal{N}(\boldsymbol{\mu}_x(\mathbf{z}), \mathrm{diag}(\boldsymbol{\sigma}_x^2(\mathbf{z})))$，均值与方差由神经网络给出`,
      String.raw`编码器 / 识别模型 $q_\phi(\mathbf{z}|\mathbf{x}) = \mathcal{N}(\boldsymbol{\mu}_z(\mathbf{x}), \mathrm{diag}(\boldsymbol{\sigma}_z^2(\mathbf{x})))$`,
      String.raw`目标 $\mathcal{L} = \mathbb{E}_{q_\phi(\mathbf{z}|\mathbf{x})}[\log p_\theta(\mathbf{x}|\mathbf{z})] - D_{\mathrm{KL}}(q_\phi(\mathbf{z}|\mathbf{x})\|p(\mathbf{z}))$：第一项为何叫重建误差（WA4 Q1）`,
      '重参数化技巧：为什么直接采样会切断梯度，改写后随机性只来自输入 $\\boldsymbol{\\epsilon}$',
      String.raw`KL 项闭式解 $-D_{\mathrm{KL}} = \tfrac12\sum_j(1 + \log\sigma_j^2 - \mu_j^2 - \sigma_j^2)$（与 WA1 Q6 的高斯 KL 同源）`,
      '为何朴素蒙特卡洛估计 $p(\\mathbf{x}) \\approx \\frac1K\\sum p(\\mathbf{x}|\\mathbf{z}_k)$ 行不通；ELBO 推导与等号成立条件',
      'AE / 去噪 AE / VAE 的区别；VAE 在现代生成中的角色（Latent Diffusion 的压缩器）',
    ],
    verifierId: 'l10-gen-models',
    verifierTab: 'vae',
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
        id: 'd-l10-kl-closed',
        title: String.raw`KL 正则项的闭式解：$D_{\mathrm{KL}}\big(\mathcal{N}(\mu,\sigma^2)\,\|\,\mathcal{N}(0,1)\big)$`,
        goal: '编码器输出对角高斯，先验为标准高斯，各维独立，所以只需算一维情形再求和。',
        steps: [
          {
            rule: 'Write Out the Log Densities',
            latex: String.raw`\log q(z) = -\tfrac12\log(2\pi\sigma^2) - \frac{(z-\mu)^2}{2\sigma^2}, \qquad \log p(z) = -\tfrac12\log(2\pi) - \frac{z^2}{2}`,
            justification: '一维高斯密度取对数。',
          },
          {
            rule: String.raw`Take $\mathbb{E}_{z\sim q}$`,
            latex: String.raw`D_{\mathrm{KL}} = \mathbb{E}_q[\log q - \log p] = -\tfrac12\log\sigma^2 - \tfrac12 + \tfrac12\,\mathbb{E}_q[z^2] = -\tfrac12\log\sigma^2 - \tfrac12 + \tfrac12(\mu^2 + \sigma^2)`,
            justification: String.raw`$\mathbb{E}_q[(z-\mu)^2] = \sigma^2$，$\mathbb{E}_q[z^2] = \mu^2 + \sigma^2$，$\log 2\pi$ 项相互抵消。`,
          },
          {
            rule: String.raw`Sum Over $J$ Latent Dimensions`,
            latex: String.raw`-D_{\mathrm{KL}}\big(q_\phi(\mathbf{z}|\mathbf{x})\,\|\,\mathcal{N}(\mathbf{0},\mathbf{I})\big) = \frac12\sum_{j=1}^{J}\Big(1 + \log\sigma_j^2 - \mu_j^2 - \sigma_j^2\Big)`,
            justification: String.raw`这就是讲义中 $\mathcal{L}_2$ 的表达式。它在 $\mu_j=0, \sigma_j=1$ 时取最大值 0。`,
          },
        ],
        conclusion: String.raw`最终目标（$K=1$）：$\mathcal{L}(\mathbf{x}_i) \approx \log p_\theta(\mathbf{x}_i|\mathbf{z}_i) + \frac12\sum_j(1 + \log\sigma_{ij}^2 - \mu_{ij}^2 - \sigma_{ij}^2)$，$\mathbf{z}_i = \boldsymbol{\mu}_z(\mathbf{x}_i) + \boldsymbol{\sigma}_z(\mathbf{x}_i)\odot\boldsymbol{\epsilon}$。`,
      },
    ],
    concepts: [
      {
        heading: '为什么需要编码器与重参数化',
        body: '两个难点，两个工具：',
        points: [
          String.raw`似然不可算：$\log p_\theta(\mathbf{x}) = \log\int p_\theta(\mathbf{x}|\mathbf{z})p(\mathbf{z})d\mathbf{z}$ 中的积分没有闭式解。朴素地从先验采 $\mathbf{z}_k$ 求平均也不行：$\mathbf{x}$ 维度很高，$p_\theta(\mathbf{x}|\mathbf{z})$ 只在极小区域内不可忽略，需要天文数字的样本。`,
          String.raw`编码器 $q_\phi(\mathbf{z}|\mathbf{x})$ 近似真实后验 $p(\mathbf{z}|\mathbf{x})$（变分推断），它采到的 $\mathbf{z}$ 依赖于 $\mathbf{x}$，通常能给 $\mathbf{x}$ 较高概率，所以 ELBO 是 $\log p(\mathbf{x})$ 的好近似。`,
          String.raw`采样切断梯度：$\mathbf{z}\sim q_\phi$ 是随机节点。重参数化把它写成 $\mathbf{z} = \boldsymbol{\mu}_z + \boldsymbol{\sigma}_z\odot\boldsymbol{\epsilon},\ \boldsymbol{\epsilon}\sim\mathcal{N}(\mathbf{0},\mathbf{I})$，网络对给定 $\boldsymbol{\epsilon}$ 是确定性的，可对 $\phi$ 求梯度。`,
          '生成时只用解码器：$\\mathbf{z}\\sim p(\\mathbf{z})$，再从 $p_\\theta(\\mathbf{x}|\\mathbf{z})$ 采样；也可手动挑选 $\\mathbf{z}$ 观察每个维度的含义（如 Frey Face 中的头部姿态与笑容）。',
        ],
      },
      {
        heading: 'AE vs 去噪 AE vs VAE',
        body: '三者都有编码器和解码器，但目标和能力不同：',
        table: {
          headers: ['模型', '目标', '能否生成新样本', '隐空间特点'],
          rows: [
            ['Autoencoder', String.raw`最小化重建误差 $\|\mathbf{x} - \hat{\mathbf{x}}\|^2$`, '不能（不定义 $p(\\mathbf{x})$）', '用于表示学习（如 MAE）'],
            ['Denoising AE', '从被破坏的输入 $\\tilde{\\mathbf{x}}$ 重建原始 $\\mathbf{x}$', '不能', '更鲁棒，类别分离保持得更好'],
            ['VAE', '最大化 ELBO', '能：$\\mathbf{z}\\sim\\mathcal{N}(\\mathbf{0},\\mathbf{I})$ 再解码', 'KL 项把数据推向标准正态，隐空间连续平滑'],
          ],
        },
      },
      {
        heading: 'VAE 在现代图像生成中的位置',
        body: '单独使用时 VAE 的样本常偏模糊，保真度不如扩散 / 流模型；但它是极好的隐空间压缩器：',
        points: [
          'Latent Diffusion（如 Stable Diffusion）：先用预训练 VAE 把图像编码到紧凑隐空间（如 3×512×512 → 小得多的隐张量），在隐空间中做扩散，最后解码回像素。',
          'Flow Matching 同样可以在 VAE 隐空间中学习速度场，大幅降低训练与采样成本。',
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l10-vae',
        title: 'VAE 损失：重建 + KL（重参数化采样）',
        subtitle: '负 ELBO 作为最小化目标；Bernoulli 解码器对应 BCE，高斯解码器对应 MSE',
        latex: String.raw`-\mathcal{L} = \underbrace{-\log p_\theta(\mathbf{x}\mid \htmlClass{formula-token formula-token-output token-z}{\mathbf{z}})}_{\text{重建}} \; \htmlClass{formula-token formula-token-loss token-kl}{-\tfrac12\sum_j\big(1 + \log\sigma_j^2 - \mu_j^2 - \sigma_j^2\big)}, \quad \mathbf{z} = \htmlClass{formula-token formula-token-param token-mu}{\boldsymbol{\mu}} + \boldsymbol{\sigma}\odot\htmlClass{formula-token formula-token-data token-eps}{\boldsymbol{\epsilon}}`,
        numpyCode: `import numpy as np

def vae_loss(x, encoder, decoder, rng=np.random.default_rng()):
    mu, logvar = encoder(x)                      # (B, J), (B, J)
    eps = rng.standard_normal(mu.shape)          # noise is an *input*
    z = mu + np.exp(0.5 * logvar) * eps          # reparameterization
    x_hat = decoder(z)                           # Bernoulli means in (0, 1)
    recon = -np.sum(x * np.log(x_hat + 1e-9) + (1 - x) * np.log(1 - x_hat + 1e-9), axis=1)
    kl = -0.5 * np.sum(1 + logvar - mu**2 - np.exp(logvar), axis=1)
    return np.mean(recon + kl)`,
        pytorchCode: `import torch
import torch.nn.functional as F

def vae_loss(x, model):
    mu, logvar = model.encode(x)
    z = mu + torch.exp(0.5 * logvar) * torch.randn_like(mu)
    x_hat = model.decode(z)
    recon = F.binary_cross_entropy(x_hat, x, reduction="sum")
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return (recon + kl) / x.size(0)`,
        terms: [
          { id: 'mu', label: String.raw`编码器均值 $\boldsymbol{\mu}$ 与对数方差`, role: 'param', shape: '(B, J)', explanation: '网络通常输出 log σ²，保证方差为正且数值稳定。', numpyLines: [4], pytorchLines: [5] },
          { id: 'eps', label: String.raw`噪声 $\boldsymbol{\epsilon}\sim\mathcal{N}(\mathbf{0},\mathbf{I})$`, role: 'data', shape: '(B, J)', explanation: '随机性被移到输入端，梯度可以流过 μ 和 σ。', numpyLines: [5], pytorchLines: [6] },
          { id: 'z', label: String.raw`隐变量 $\mathbf{z}$`, role: 'output', shape: '(B, J)', explanation: '训练时通常每个样本只采 1 个（K = 1）。', numpyLines: [6, 7, 8], pytorchLines: [6, 7, 8] },
          { id: 'kl', label: 'KL 正则项', role: 'loss', shape: '(B,)', explanation: '闭式计算，不需要采样。', numpyLines: [9], pytorchLines: [9] },
        ],
      },
    ],
    pitfalls: [
      {
        title: 'ELBO 是要最大化的；代码里最小化的是负 ELBO',
        detail: String.raw`讲义写的是对 $\mathcal{L}$ 做梯度上升。实现时 loss = 重建误差 + KL，两项都取正号再最小化。KL 闭式解前面的负号最容易漏。`,
      },
      {
        title: '为什么第一项叫「重建误差」（WA4 Q1）',
        detail: String.raw`流程是：取训练样本 $\mathbf{x}_i$ → 编码成分布 $q(\mathbf{z}|\mathbf{x}_i)$ → 采样 $\mathbf{z}$ → 解码成分布 $p_\theta(\mathbf{x}|\mathbf{z})$ → 看这个分布给原样本 $\mathbf{x}_i$ 多大概率。高斯解码器下 $\log p_\theta(\mathbf{x}_i|\mathbf{z}) = -\frac{1}{2\sigma^2}\|\mathbf{x}_i - \boldsymbol{\mu}_x(\mathbf{z})\|^2 + C$，就是负的平方重建误差。`,
      },
      {
        title: 'ELBO 的等号条件',
        detail: String.raw`$\log p(\mathbf{x}) - \text{ELBO} = D_{\mathrm{KL}}(q(\mathbf{z}|\mathbf{x})\|p(\mathbf{z}|\mathbf{x}))$，当且仅当 $q(\mathbf{z}|\mathbf{x}) = p(\mathbf{z}|\mathbf{x})$ 时取等号。注意这里是对真实后验的 KL，而目标中出现的是对先验 $p(\mathbf{z})$ 的 KL，不要混淆。`,
      },
    ],
  },
  {
    id: 'l11',
    code: 'L11',
    partGroup: 'Part 4 · Generative Models for Images',
    slug: 'l11-gan',
    slides: ['l11.pdf', 'l11-gan-postclass.pdf'],
    examWeight: 'core',
    titleZh: '生成对抗网络 (GAN)：极小极大博弈、JS 散度与两种生成器损失',
    titleEn: 'Generative Adversarial Networks: Minimax Game, Optimal Discriminator, JSD & Generator Losses',
    abstract: String.raw`GAN 用生成器 $\mathbf{x} = g_\theta(\mathbf{z})$ 隐式定义分布（无法计算密度，也不给出隐表示），并训练判别器 $D(\mathbf{x})\in[0,1]$ 区分真假。固定生成器时最优判别器为 $D^* = p_r/(p_r + p_g)$，代回得 $V = -\log 4 + 2\,\mathrm{JS}(p_r\|p_g)$。原始生成器损失 $\log(1-D)$ 在早期梯度消失，替代损失 $-\log D$ 梯度强但可能不稳定；实践中不把 D 训练到最优来折中。`,
    readingChecklist: [
      'VAE 显式定义 $p(\\mathbf{x})$ 并有编码器；GAN 隐式定义分布，不能算密度、没有隐表示',
      '交替训练：每轮先更新判别器 $k$ 次（区分真/假），再更新生成器 1 次（骗过判别器）',
      String.raw`判别器目标：最大化 $\frac1m\sum\log D(\mathbf{x}_i) + \frac1m\sum\log(1 - D(g(\mathbf{z}_i)))$（即二分类交叉熵）`,
      String.raw`最优判别器 $D^*(\mathbf{x}) = \frac{p_r(\mathbf{x})}{p_r(\mathbf{x}) + p_g(\mathbf{x})}$ 与 $V(G, D^*) = -\log 4 + 2\,\mathrm{JS}(p_r\|p_g)$`,
      String.raw`两种生成器损失 $\log(1 - D(G(\mathbf{z})))$ vs $-\log D(G(\mathbf{z}))$：共同目标、各自优缺点、哪一个近似 JSD（WA4 Q2）`,
      String.raw`FID $= \|\boldsymbol{\mu}_r - \boldsymbol{\mu}_g\|^2 + \mathrm{Tr}(\Sigma_r + \Sigma_g - 2(\Sigma_r\Sigma_g)^{1/2})$，越低越好`,
      'GAN vs VAE：清晰度、模式覆盖（mode dropping / collapse）、训练稳定性',
    ],
    verifierId: 'l10-gen-models',
    verifierTab: 'gan',
    figureKey: 'L10',
    derivations: [
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
        id: 'd-l11-gen-grad',
        title: '两种生成器损失的梯度行为分析（WA4 Q2 核心）',
        goal: String.raw`比较 $\nabla_\theta\,\mathbb{E}_{p_g}[\log(1-D(\mathbf{x}))]$ 与 $\nabla_\theta\,\mathbb{E}_{p_g}[-\log D(\mathbf{x})]$ 在训练早期（$D(\mathbf{x})\approx 0$ 对假样本）的大小。`,
        steps: [
          {
            rule: 'Original Cost: Gradient Through the Density',
            latex: String.raw`\nabla_\theta\,\mathbb{E}_{\mathbf{x}\sim p_g}\big[\log(1 - D(\mathbf{x}))\big] = \int \log(1 - D(\mathbf{x}))\,\nabla_\theta\, p_g(\mathbf{x})\,d\mathbf{x}`,
            justification: '讲义的写法：生成器参数只影响 $p_g$。',
          },
          {
            rule: String.raw`Early Training: $D(\mathbf{x})\approx 0$ on Fakes`,
            latex: String.raw`\log(1 - D(\mathbf{x})) \approx \log 1 = 0 \;\Longrightarrow\; \nabla_\theta \approx 0`,
            justification: '生成器很差时判别器轻易识破假样本，被积函数接近 0，梯度消失——生成器在最需要信号的时候拿不到信号。Arjovsky 等的实验显示梯度范数随判别器训练衰减数个数量级。',
          },
          {
            rule: 'Alternative (Non-Saturating) Cost',
            latex: String.raw`\nabla_\theta\,\mathbb{E}_{\mathbf{x}\sim p_g}\big[-\log D(\mathbf{x})\big] = \int \big(-\log D(\mathbf{x})\big)\,\nabla_\theta\, p_g(\mathbf{x})\,d\mathbf{x}, \qquad -\log D \to +\infty \text{ as } D\to 0`,
            justification: '早期梯度不再为零；但判别器很强时 $-\\log D$ 非常大，梯度可能爆炸，训练不稳定。',
          },
        ],
        conclusion: String.raw`两者共同目标都是让 $D(G(\mathbf{z}))$ 变大（骗过判别器）。只有原始损失 $\log(1 - D)$ 在 $D = D^*$ 时对应 $2\,\mathrm{JS}(p_r\|p_g) - \log 4$；实践中两种困难都靠「不把判别器训练到最优」来缓解。`,
      },
    ],
    concepts: [
      {
        heading: 'GAN 训练算法（Goodfellow et al. 2014）',
        body: '每次迭代：',
        points: [
          String.raw`判别器步（重复 $k$ 次）：采 $m$ 个真实样本和 $m$ 个假样本 $g(\mathbf{z}_i)$，对 $\frac1m\sum\log D(\mathbf{x}_i) + \frac1m\sum\log(1 - D(g(\mathbf{z}_i)))$ 做梯度上升。`,
          String.raw`生成器步（1 次）：采 $m$ 个新噪声，对生成器损失做梯度下降（实践中用 $\frac1m\sum[-\log D(g(\mathbf{z}_i))]$）。`,
          '判别器和生成器每轮都只更新一小步，而不是训练到最优——原因见下方梯度分析。',
        ],
      },
      {
        heading: 'GAN vs VAE',
        body: '讲义的对比结论：',
        table: {
          headers: ['方面', 'VAE', 'GAN'],
          rows: [
            ['理论目标', String.raw`最大化似然下界 ≈ 最小化 $\mathrm{KL}(p_r\|p_\theta)$`, String.raw`最小化 $\mathrm{JS}(p_r\|p_g)$（判别器近似它）`],
            ['密度 / 隐表示', '可近似计算 $p(\\mathbf{x})$；有编码器', '不能计算密度；没有编码器'],
            ['样本质量', '偏模糊（重建损失对输出取平均）', '更锐利、细节更真实'],
            ['模式覆盖', '好（最大化似然要覆盖所有数据）', '易 mode dropping / collapse'],
            ['训练', '稳定', '不稳定，可能不收敛'],
          ],
        },
      },
      {
        heading: 'Fréchet Inception Distance (FID)',
        body: String.raw`用 Inception v3 最深层特征的均值和协方差比较真实图与生成图，越低表示质量与多样性越好（是 Inception Score 的改进）：`,
        latex: String.raw`\mathrm{FID} = \|\boldsymbol{\mu}_r - \boldsymbol{\mu}_g\|_2^2 + \mathrm{Tr}\!\left(\Sigma_r + \Sigma_g - 2\,(\Sigma_r\Sigma_g)^{1/2}\right)`,
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l11-gan',
        title: '判别器与生成器损失（BCE 实现）',
        subtitle: '判别器：真样本标 1、假样本标 0；生成器：非饱和损失，让假样本被判为 1',
        latex: String.raw`\htmlClass{formula-token formula-token-loss token-ld}{\mathcal{L}_D} = -\log D(\mathbf{x}) - \log\big(1 - D(\htmlClass{formula-token formula-token-output token-gz}{G(\mathbf{z})})\big), \qquad \htmlClass{formula-token formula-token-loss token-lg}{\mathcal{L}_G} = -\log D(G(\mathbf{z}))`,
        numpyCode: `import numpy as np

def bce(p, y, eps=1e-9):
    return -np.mean(y * np.log(p + eps) + (1 - y) * np.log(1 - p + eps))

def gan_losses(D, G, x_real, z):
    x_fake = G(z)
    d_real, d_fake = D(x_real), D(x_fake)
    loss_D = bce(d_real, 1.0) + bce(d_fake, 0.0)
    loss_G = bce(D(x_fake), 1.0)        # = mean(-log D(G(z)))
    return loss_D, loss_G`,
        pytorchCode: `import torch
import torch.nn.functional as F

def train_step(D, G, opt_D, opt_G, x_real, z):
    x_fake = G(z)
    d_real, d_fake = D(x_real), D(x_fake.detach())     # detach: D-step must not update G
    loss_D = F.binary_cross_entropy(d_real, torch.ones_like(d_real)) \\
           + F.binary_cross_entropy(d_fake, torch.zeros_like(d_fake))
    opt_D.zero_grad(); loss_D.backward(); opt_D.step()
    d_fake = D(x_fake)
    loss_G = F.binary_cross_entropy(d_fake, torch.ones_like(d_fake))
    opt_G.zero_grad(); loss_G.backward(); opt_G.step()`,
        terms: [
          { id: 'gz', label: String.raw`假样本 $G(\mathbf{z})$`, role: 'output', shape: '(B, C, H, W)', explanation: '判别器步中要 detach，否则会把梯度传进生成器。', numpyLines: [7, 8], pytorchLines: [5, 6] },
          { id: 'ld', label: String.raw`判别器损失 $\mathcal{L}_D$`, role: 'loss', shape: 'scalar', explanation: '最小化它等价于最大化 V。', numpyLines: [9], pytorchLines: [7, 8, 9] },
          { id: 'lg', label: String.raw`生成器损失 $\mathcal{L}_G$`, role: 'loss', shape: 'scalar', explanation: '把假样本的标签设为 1，就得到非饱和损失 −log D(G(z))。', numpyLines: [10], pytorchLines: [10, 11, 12] },
        ],
      },
    ],
    pitfalls: [
      {
        title: '原始损失「梯度消失」，替代损失「梯度过大」',
        detail: String.raw`口诀：$\log(1-D)$ 在 $D\to 0$ 时趋于 $0$，梯度小（训练慢）；$-\log D$ 在 $D\to 0$ 时趋于 $\infty$，梯度大（训练不稳）。二者都要求判别器不要太强。`,
      },
      {
        title: '哪一个对应 JS 散度？',
        detail: String.raw`在判别器最优时，原始的 $\mathbb{E}_{p_g}[\log(1 - D^*(\mathbf{x}))]$ 与 $\mathbb{E}_{p_r}[\log D^*]$ 合起来是 $2\,\mathrm{JS} - \log 4$，所以最小化原始损失近似最小化 JSD；替代损失没有这个对应关系。`,
      },
      {
        title: 'FID 越低越好，Inception Score 越高越好',
        detail: '两者方向相反，判断题容易混淆。FID 同时考虑均值和协方差，因此对多样性不足（mode collapse）更敏感。',
      },
    ],
  },
  {
    id: 'l12',
    code: 'L12',
    partGroup: 'Part 4 · Generative Models for Images',
    slug: 'l12-diffusion-models',
    slides: ['l12-1-dm.pdf', 'l12-2.pdf', 'l12-dm-postclass.pdf'],
    examWeight: 'core',
    titleZh: '扩散模型：DDPM、DDIM、Latent Diffusion、引导生成与 EDM',
    titleEn: 'Diffusion Models: DDPM, Noise/Data/Score Prediction, DDIM, LDM, Classifier(-Free) Guidance & EDM',
    abstract: String.raw`前向过程在 $T$ 步内逐渐加高斯噪声，闭式为 $\mathbf{x}_t = \sqrt{\bar\alpha_t}\mathbf{x}_0 + \sqrt{1-\bar\alpha_t}\boldsymbol{\epsilon}$；反向过程训练噪声预测器 $\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)$（U-Net），采样时逐步去噪。理论上训练损失来自变分下界；噪声预测等价于数据预测和分数预测。DDIM 跳步加速、LDM 在 VAE 隐空间扩散；Classifier / Classifier-free guidance 实现条件生成。L12-2 介绍 EDM 的连续时间视角：$\sigma(t) = t$、Euler 采样与预条件化。`,
    readingChecklist: [
      String.raw`前向一步：$\mathbf{x}_t = \sqrt{1-\beta_t}\,\mathbf{x}_{t-1} + \sqrt{\beta_t}\,\boldsymbol{\epsilon}_t$；闭式 $q(\mathbf{x}_t|\mathbf{x}_0) = \mathcal{N}(\sqrt{\bar\alpha_t}\mathbf{x}_0, (1-\bar\alpha_t)\mathbf{I})$，$\alpha_t = 1-\beta_t$，$\bar\alpha_t = \prod_{s\le t}\alpha_s$`,
      String.raw`训练：$\min\ \mathbb{E}_{t, \mathbf{x}_0, \boldsymbol{\epsilon}}\|\boldsymbol{\epsilon} - \boldsymbol{\epsilon}_\theta(\sqrt{\bar\alpha_t}\mathbf{x}_0 + \sqrt{1-\bar\alpha_t}\boldsymbol{\epsilon}, t)\|^2$`,
      String.raw`采样：$\mathbf{x}_{t-1} = \frac{1}{\sqrt{\alpha_t}}\big(\mathbf{x}_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)\big) + \sigma_t\mathbf{z}$（需要 $T$ 次网络调用，慢）`,
      '理论：反向过程最大化 $\\log p_\\theta(\\mathbf{x}_0)$ 的变分下界，每项是 $q(\\mathbf{x}_{t-1}|\\mathbf{x}_t,\\mathbf{x}_0)$ 与 $p_\\theta(\\mathbf{x}_{t-1}|\\mathbf{x}_t)$ 的 KL',
      String.raw`三种参数化：噪声 $\boldsymbol{\epsilon}_\theta$、数据 $D_\theta \approx \mathbf{x}_0$、分数 $s_\theta \approx \nabla\log q(\mathbf{x}_t)$，关系 $\nabla_{\mathbf{x}_t}\log q(\mathbf{x}_t) \approx -\boldsymbol{\epsilon}_\theta/\sqrt{1-\bar\alpha_t}$`,
      'DDIM：同一个噪声预测器，非马尔可夫前向过程，在时间步子集上采样；$\\sigma_t = 0$ 时确定性',
      'LDM：先训练 VAE 把图像压到隐空间，再在隐空间做扩散；文本通过交叉注意力注入',
      String.raw`Classifier guidance（WA4 Q3）与 classifier-free guidance：$\hat{\boldsymbol{\epsilon}} = \boldsymbol{\epsilon}(\varnothing) + w(\boldsymbol{\epsilon}(y) - \boldsymbol{\epsilon}(\varnothing))$，常用 $w\in[5, 15]$`,
      String.raw`EDM：$\mathbf{x} = \mathbf{x}_0 + \sigma\boldsymbol{\epsilon}$、$\sigma(t)=t\in[0.002, 80]$；分数 $\approx (D(\mathbf{x},\sigma) - \mathbf{x})/\sigma^2$；Euler 采样、噪声级离散化与预条件化 $c_{\text{skip}}, c_{\text{out}}, c_{\text{in}}$`,
    ],
    verifierId: 'l10-gen-models',
    verifierTab: 'diff',
    figureKey: 'L10',
    derivations: [
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
      {
        id: 'd-l12-score',
        title: '噪声预测 ⇔ 分数预测，以及 DDPM 采样的直观含义',
        goal: String.raw`说明 $\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)$ 实际上在估计（负、缩放后的）分数 $\nabla_{\mathbf{x}_t}\log q(\mathbf{x}_t)$，从而把采样公式解释为「沿着数据密度上升的方向走一步」。`,
        steps: [
          {
            rule: 'Conditional Score of the Diffusion Kernel',
            latex: String.raw`\log q(\mathbf{x}_t|\mathbf{x}_0) = -\frac{\|\mathbf{x}_t - \sqrt{\bar\alpha_t}\mathbf{x}_0\|^2}{2(1-\bar\alpha_t)} + C \;\Longrightarrow\; \nabla_{\mathbf{x}_t}\log q(\mathbf{x}_t|\mathbf{x}_0) = -\frac{\mathbf{x}_t - \sqrt{\bar\alpha_t}\mathbf{x}_0}{1-\bar\alpha_t} = -\frac{\boldsymbol{\epsilon}}{\sqrt{1-\bar\alpha_t}}`,
            justification: String.raw`代入 $\mathbf{x}_t - \sqrt{\bar\alpha_t}\mathbf{x}_0 = \sqrt{1-\bar\alpha_t}\,\boldsymbol{\epsilon}$。`,
          },
          {
            rule: 'Marginal Score (average over x0)',
            latex: String.raw`\nabla_{\mathbf{x}_t}\log q(\mathbf{x}_t) = \mathbb{E}_{q(\mathbf{x}_0|\mathbf{x}_t)}\!\big[\nabla_{\mathbf{x}_t}\log q(\mathbf{x}_t|\mathbf{x}_0)\big] \approx -\frac{\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)}{\sqrt{1-\bar\alpha_t}}`,
            justification: '用 $\\nabla q = q\\nabla\\log q$ 交换积分与求导；若 $\\boldsymbol{\\epsilon}_\\theta$ 几乎处处匹配真实噪声的条件期望，就得到右式。',
          },
          {
            rule: 'Rewrite the DDPM Sampler',
            latex: String.raw`\mathbf{x}_{t-1} = \frac{1}{\sqrt{\alpha_t}}\Big(\mathbf{x}_t + (1-\alpha_t)\,\nabla_{\mathbf{x}_t}\log q(\mathbf{x}_t)\Big) + \sigma_t\mathbf{z}`,
            justification: '每一步都朝「更像训练图像」的方向移动一小步，再加一点噪声。',
          },
          {
            rule: 'Classifier Guidance via Bayes',
            latex: String.raw`\nabla\log q(\mathbf{x}_t|y) = \nabla\log q(\mathbf{x}_t) + \nabla\log q(y|\mathbf{x}_t) \;\Longrightarrow\; \hat{\boldsymbol{\epsilon}}(\mathbf{x}_t, t, y) = \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t) - w\sqrt{1-\bar\alpha_t}\,\nabla_{\mathbf{x}_t}\log p_\phi(y|\mathbf{x}_t)`,
            justification: String.raw`$q(y)$ 与 $\mathbf{x}_t$ 无关，梯度为 0。用一个在带噪图像上训练的分类器 $p_\phi(y|\mathbf{x}_t)$ 估计第二项，$w$ 控制引导强度。这正是 WA4 Q3 要求解释的思路。`,
          },
        ],
        conclusion: String.raw`Classifier-free guidance 则训练条件预测器 $\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t, y)$，训练时随机把标签换成 $\varnothing$ 得到无条件版本；由 $\nabla\log q(y|\mathbf{x}_t) = \nabla\log q(\mathbf{x}_t|y) - \nabla\log q(\mathbf{x}_t)$ 得 $\hat{\boldsymbol{\epsilon}} = \boldsymbol{\epsilon}(\varnothing) + w\,(\boldsymbol{\epsilon}(y) - \boldsymbol{\epsilon}(\varnothing))$，不需要单独的分类器。`,
      },
    ],
    concepts: [
      {
        heading: '生成模型三难困境',
        body: '讲义引用 Xiao et al. (ICLR 2022)：',
        table: {
          headers: ['模型', '样本质量', '模式覆盖 / 多样性', '采样速度'],
          rows: [
            ['GAN', '高', '差', '快（一次前向）'],
            ['VAE', '较低（模糊）', '好', '快（一次前向）'],
            ['Diffusion', '最高（超过 GAN）', '好', '慢（T 次前向）→ DDIM / LDM / 蒸馏加速'],
          ],
        },
      },
      {
        heading: '反向过程的三种参数化',
        body: String.raw`由 $\mathbf{x}_t = \sqrt{\bar\alpha_t}\mathbf{x}_0 + \sqrt{1-\bar\alpha_t}\boldsymbol{\epsilon}$，知道其中任意一个就能算出其余两个：`,
        table: {
          headers: ['预测目标', '网络', '训练损失', '换算关系'],
          rows: [
            ['噪声', String.raw`$\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)$`, String.raw`$\|\boldsymbol{\epsilon} - \boldsymbol{\epsilon}_\theta\|^2$`, 'DDPM 默认'],
            ['数据', String.raw`$D_\theta(\mathbf{x}_t, t)\approx\mathbf{x}_0$`, String.raw`$\|\mathbf{x}_0 - D_\theta\|^2$`, String.raw`$\boldsymbol{\epsilon} = \frac{\mathbf{x}_t - \sqrt{\bar\alpha_t}\mathbf{x}_0}{\sqrt{1-\bar\alpha_t}}$；EDM、AlphaFold3 使用`],
            ['分数', String.raw`$s_\theta(\mathbf{x}_t, t)$`, String.raw`$(1-\bar\alpha_t)\|s_\theta - \nabla\log q(\mathbf{x}_t|\mathbf{x}_0)\|^2$`, String.raw`$s = -\boldsymbol{\epsilon}/\sqrt{1-\bar\alpha_t}$；SDE 视角`],
          ],
        },
      },
      {
        heading: '让扩散模型更快：DDIM 与 Latent Diffusion',
        body: '两种互补的加速思路：',
        points: [
          String.raw`DDIM：定义一个非马尔可夫前向过程，它与 DDPM 有相同的 $q(\mathbf{x}_t|\mathbf{x}_0)$、相同的噪声预测器和训练目标，但采样路线不同：先由 $\mathbf{x}_t$ 和 $\boldsymbol{\epsilon}_\theta$ 估计 $\hat{\mathbf{x}}_0 = (\mathbf{x}_t - \sqrt{1-\bar\alpha_t}\boldsymbol{\epsilon}_\theta)/\sqrt{\bar\alpha_t}$，再「前向」到更早的 $s < t$：$\mathbf{x}_s = \sqrt{\bar\alpha_s}\hat{\mathbf{x}}_0 + \sqrt{1-\bar\alpha_s}\,\boldsymbol{\epsilon}_\theta$（$\sigma_t = 0$ 时确定性）。可在时间步子集上采样。`,
          'LDM：第一阶段预训练 VAE，把图像从像素空间映射到维度低得多的隐空间；第二阶段在隐空间中训练扩散模型，损失 $\\mathbb{E}\\|\\boldsymbol{\\epsilon} - \\boldsymbol{\\epsilon}_\\theta(\\mathbf{z}_t, t)\\|^2$。Stable Diffusion 还用文本编码器 $\\tau(y)$ 并通过交叉注意力注入噪声预测器。',
        ],
      },
      {
        heading: 'EDM（L12-2）：连续时间视角下的设计选择',
        body: 'EDM 把扩散流程拆成训练、预条件化、采样等独立模块，并为每个模块选出经验最优的设计：',
        points: [
          String.raw`加噪：$\mathbf{x} = \mathbf{x}_0 + \sigma\boldsymbol{\epsilon}$，噪声标准差 $\sigma(t) = t$，范围 $[0.002, 80]$；$\sigma = 80$ 时几乎是纯高斯噪声。`,
          String.raw`去噪器 $D(\mathbf{x},\sigma)$ 预测干净图像，分数为 $\nabla_{\mathbf{x}}\log p(\mathbf{x};\sigma) \approx (D(\mathbf{x},\sigma) - \mathbf{x})/\sigma^2$；概率流 ODE 为 $d\mathbf{x}/dt = (\mathbf{x} - D(\mathbf{x}, \sigma))/\sigma$。`,
          String.raw`时间离散化：$\sigma_i = \big(\sigma_{\max}^{1/\rho} + \frac{i}{N-1}(\sigma_{\min}^{1/\rho} - \sigma_{\max}^{1/\rho})\big)^\rho$（$\rho = 7$），高噪声处步长大、低噪声处步长小，因为细节在低噪声时才快速出现。`,
          '采样：Euler 一阶方法 $\\mathbf{x}_{i+1} = \\mathbf{x}_i + (t_{i+1} - t_i)\\,\\mathbf{d}_i$（再加 Heun 二阶校正）；随机采样在每步注入少量噪声，纠正累积误差并增加多样性。',
          String.raw`预条件化：$D_\theta(\mathbf{x},\sigma) = c_{\text{skip}}(\sigma)\mathbf{x} + c_{\text{out}}(\sigma)F_\theta(c_{\text{in}}(\sigma)\mathbf{x}, c_{\text{noise}}(\sigma))$，其中 $c_{\text{in}} = 1/\sqrt{\sigma^2 + \sigma_{\text{data}}^2}$ 让网络输入单位方差；小 $\sigma$ 时主要依赖 $\mathbf{x}$，大 $\sigma$ 时主要依赖网络，避免网络误差被放大 $\sigma$ 倍。`,
          String.raw`训练时 $\ln\sigma\sim\mathcal{N}(-1.2, 1.2^2)$：中等噪声级最有学习价值。`,
        ],
      },
    ],
    formulaSpecs: [
      {
        id: 'fc-l12-ddpm',
        title: 'DDPM 训练步与单步采样',
        subtitle: '训练时随机采 t 一次性加噪；采样时从纯噪声逐步去噪',
        latex: String.raw`\mathcal{L} = \big\|\htmlClass{formula-token formula-token-data token-eps}{\boldsymbol{\epsilon}} - \htmlClass{formula-token formula-token-param token-net}{\boldsymbol{\epsilon}_\theta}(\htmlClass{formula-token formula-token-output token-xt}{\sqrt{\bar\alpha_t}\mathbf{x}_0 + \sqrt{1-\bar\alpha_t}\boldsymbol{\epsilon}}, t)\big\|^2, \qquad \mathbf{x}_{t-1} = \frac{1}{\sqrt{\alpha_t}}\Big(\mathbf{x}_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\boldsymbol{\epsilon}_\theta\Big) + \htmlClass{formula-token formula-token-hyper token-sig}{\sigma_t\mathbf{z}}`,
        numpyCode: `import numpy as np

T = 1000
betas = np.linspace(1e-4, 0.02, T)
alphas = 1.0 - betas
alpha_bar = np.cumprod(alphas)

def train_loss(x0, eps_net, rng):
    t = rng.integers(0, T, size=x0.shape[0])
    eps = rng.standard_normal(x0.shape)
    ab = alpha_bar[t][:, None]
    x_t = np.sqrt(ab) * x0 + np.sqrt(1 - ab) * eps
    return np.mean((eps - eps_net(x_t, t)) ** 2)

def sample_step(x_t, t, eps_net, rng):
    eps_hat = eps_net(x_t, np.full(len(x_t), t))
    mean = (x_t - (1 - alphas[t]) / np.sqrt(1 - alpha_bar[t]) * eps_hat) / np.sqrt(alphas[t])
    if t == 0:
        return mean                           # no noise on the final step
    return mean + np.sqrt(betas[t]) * rng.standard_normal(x_t.shape)`,
        terms: [
          { id: 'eps', label: String.raw`真实噪声 $\boldsymbol{\epsilon}$`, role: 'data', shape: '(B, D)', explanation: '回归目标。', numpyLines: [10] },
          { id: 'xt', label: String.raw`一步加噪 $\mathbf{x}_t$`, role: 'output', shape: '(B, D)', explanation: '利用闭式公式，无需逐步加噪。', numpyLines: [11, 12] },
          { id: 'net', label: String.raw`噪声预测器 $\boldsymbol{\epsilon}_\theta$`, role: 'param', shape: '(B, D)', explanation: '通常是带时间嵌入的 U-Net。', numpyLines: [13, 16] },
          { id: 'sig', label: String.raw`采样噪声 $\sigma_t\mathbf{z}$`, role: 'hyper', shape: '(B, D)', explanation: String.raw`常取 $\sigma_t^2 = \beta_t$；最后一步不加。`, numpyLines: [18, 19, 20] },
        ],
      },
    ],
    pitfalls: [
      ...[
      {
        title: String.raw`DDPM 反向采样最后一步 ($t = 1 \to 0$) 不加随机噪声 $\sigma_t \mathbf{z}$`,
        detail: String.raw`在 $t > 1$ 的中间去噪步加入 $\sigma_t \mathbf{z}$ 维持采样多样性；但最后一步输出最终图像 $\mathbf{x}_0$ 时令 $\mathbf{z} = \mathbf{0}$，避免把额外高斯噪点直接印在成图表面。`,
      },
    ],
      {
        title: String.raw`分清 $\alpha_t$、$\bar\alpha_t$ 与 $\beta_t$`,
        detail: String.raw`$\beta_t$ 是第 $t$ 步加的噪声方差，$\alpha_t = 1-\beta_t$，$\bar\alpha_t = \prod_{s=1}^t\alpha_s$。$1-\bar\alpha_t$ 是从 $\mathbf{x}_0$ 到 $\mathbf{x}_t$ 累积的总噪声方差，$\beta_t$ 只是单步的。采样公式里分母是 $\sqrt{1-\bar\alpha_t}$，外面除的是 $\sqrt{\alpha_t}$。`,
      },
      {
        title: 'CFG 中 w = 1 不是「无引导」',
        detail: String.raw`$\hat{\boldsymbol{\epsilon}} = \boldsymbol{\epsilon}(\varnothing) + w(\boldsymbol{\epsilon}(y) - \boldsymbol{\epsilon}(\varnothing))$：$w = 0$ 是无条件生成，$w = 1$ 只用条件预测器，$w > 1$ 才是加强引导（常用 7.5 或 10）。`,
      },
    ],
  },
  {
    id: 'l13',
    code: 'L13',
    partGroup: 'Part 4 · Generative Models for Images',
    slug: 'l13-flow-matching',
    slides: ['l13-flow matching models.pdf'],
    examWeight: 'core',
    titleZh: 'Flow Matching：向量场、ODE、条件流匹配与 SDE 视角',
    titleEn: 'Flow Matching Models: Vector Fields, ODEs, Conditional Flow Matching, Guidance & the SDE View of Diffusion',
    abstract: String.raw`流模型把初始分布 $p_{\text{init}}$（高斯）的样本沿向量场 $u_t^\theta$ 推到数据分布：$\mathbf{X}_{t+h} = \mathbf{X}_t + h\,u_t^\theta(\mathbf{X}_t)$，$h\to 0$ 得到 ODE $d\mathbf{X}_t/dt = u_t^\theta(\mathbf{X}_t)$。训练用条件流匹配（CFM）：对高斯条件路径 $\mathbf{x} = \alpha_t\mathbf{z} + \beta_t\boldsymbol{\epsilon}$ 回归条件速度 $\dot\alpha_t\mathbf{z} + \dot\beta_t\boldsymbol{\epsilon}$；取 $\alpha_t = t, \beta_t = 1-t$ 时目标就是 $\mathbf{z} - \boldsymbol{\epsilon}$。最小化 CFM 等价于最小化边际 FM 损失，从而得到把 $p_{\text{init}}$ 变成 $p_{\text{data}}$ 的向量场。`,
    readingChecklist: [
      '向量场、ODE 与流是同一对象的三种描述：向量场定义 ODE，ODE 的解是流 $\\psi_t(\\mathbf{x}_0)$',
      String.raw`采样（Euler）：$\mathbf{X}_0\sim p_{\text{init}}$，$\mathbf{X}_{t+h} = \mathbf{X}_t + h\,u_t^\theta(\mathbf{X}_t)$，$h = 1/n$`,
      String.raw`高斯条件路径 $p_t(\cdot|\mathbf{z}) = \mathcal{N}(\alpha_t\mathbf{z}, \beta_t^2\mathbf{I})$，$\alpha_0 = \beta_1 = 0$，$\alpha_1 = \beta_0 = 1$；边际路径 $p_t(\mathbf{x}) = \int p_t(\mathbf{x}|\mathbf{z})p_{\text{data}}(\mathbf{z})d\mathbf{z}$`,
      String.raw`条件向量场 $u_t^{\text{target}}(\mathbf{x}|\mathbf{z}) = (\dot\alpha_t - \frac{\dot\beta_t}{\beta_t}\alpha_t)\mathbf{z} + \frac{\dot\beta_t}{\beta_t}\mathbf{x}$；CFM 损失`,
      String.raw`CondOT 路径：$\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\mathbf{x}_1$，目标 $\mathbf{x}_1 - \mathbf{x}_0$（WA4 Q4 四个组成部分的含义）`,
      '三步论证：CFM 损失 → 与 FM 损失梯度相同 → 边际向量场把 $p_{\\text{init}}$ 变成 $p_{\\text{data}}$（连续性方程）',
      String.raw`引导：条件向量场 $u_t^\theta(\mathbf{x}|y)$ 与 CFG $\tilde u = (1-w)u(\mathbf{x}|\varnothing) + w\,u(\mathbf{x}|y)$`,
      String.raw`SDE：$d\mathbf{X}_t = u_t(\mathbf{X}_t)dt + \sigma_t d\mathbf{W}_t$；分数匹配、DDPM 是其特例；流模型路径更直，5–20 步即可`,
    ],
    verifierId: 'l10-gen-models',
    verifierTab: 'diff',
    figureKey: 'L10',
    derivations: [
      {
        id: 'd-l13-cfm',
        title: '从高斯条件路径推出 CFM 训练目标',
        goal: String.raw`对 $\mathbf{z}\sim p_{\text{data}}$、$\boldsymbol{\epsilon}\sim\mathcal{N}(\mathbf{0},\mathbf{I})$，令 $\mathbf{x}_t = \alpha_t\mathbf{z} + \beta_t\boldsymbol{\epsilon}$，求沿这条路径运动的速度，并写出 CFM 损失。`,
        steps: [
          {
            rule: 'Sampling the Conditional Path',
            latex: String.raw`\mathbf{x}_t = \alpha_t\mathbf{z} + \beta_t\boldsymbol{\epsilon} \sim p_t(\cdot|\mathbf{z}) = \mathcal{N}(\alpha_t\mathbf{z}, \beta_t^2\mathbf{I}), \qquad p_0(\cdot|\mathbf{z}) = \mathcal{N}(\mathbf{0},\mathbf{I}),\ p_1(\cdot|\mathbf{z}) = \delta_{\mathbf{z}}`,
            justification: '条件路径在噪声与单个数据点之间逐渐插值。',
          },
          {
            rule: 'Differentiate with Respect to Time',
            latex: String.raw`\frac{d\mathbf{x}_t}{dt} = \dot\alpha_t\mathbf{z} + \dot\beta_t\boldsymbol{\epsilon} = u_t^{\text{target}}(\mathbf{x}_t|\mathbf{z})`,
            justification: String.raw`把 $\boldsymbol{\epsilon} = (\mathbf{x}_t - \alpha_t\mathbf{z})/\beta_t$ 代回即得讲义中 $u_t^{\text{target}}(\mathbf{x}|\mathbf{z})$ 的形式。`,
          },
          {
            rule: 'Conditional Flow Matching Loss',
            latex: String.raw`\mathcal{L}_{\text{CFM}}(\theta) = \mathbb{E}_{t\sim\mathcal{U}[0,1],\,\mathbf{z}\sim p_{\text{data}},\,\boldsymbol{\epsilon}\sim\mathcal{N}(\mathbf{0},\mathbf{I})}\big\|u_t^\theta(\alpha_t\mathbf{z} + \beta_t\boldsymbol{\epsilon}) - (\dot\alpha_t\mathbf{z} + \dot\beta_t\boldsymbol{\epsilon})\big\|^2`,
            justification: '每个训练样本只需采一个时刻和一个噪声，就是一个普通的回归问题。',
          },
          {
            rule: String.raw`CondOT Schedule $\alpha_t = t,\ \beta_t = 1-t$`,
            latex: String.raw`\mathbf{x}_t = t\mathbf{z} + (1-t)\boldsymbol{\epsilon}, \qquad u_t^{\text{target}} = \mathbf{z} - \boldsymbol{\epsilon} \quad\Big(\text{WA4 记号：} \mathbf{x}_t = (1-t)\mathbf{x}_0 + t\mathbf{x}_1,\ \text{目标 } \mathbf{x}_1 - \mathbf{x}_0\Big)`,
            justification: '速度与 $t$ 无关：每条条件轨迹都是从噪声到数据的匀速直线。',
          },
        ],
        conclusion: String.raw`关键定理：$\mathcal{L}_{\text{FM}}(\theta) = \mathcal{L}_{\text{CFM}}(\theta) + C$（$C$ 与 $\theta$ 无关），所以两者梯度相同；而 FM 的最优解是边际向量场 $u_t^{\text{target}}(\mathbf{x}) = \int u_t^{\text{target}}(\mathbf{x}|\mathbf{z})\frac{p_t(\mathbf{x}|\mathbf{z})p_{\text{data}}(\mathbf{z})}{p_t(\mathbf{x})}d\mathbf{z}$，由连续性方程可知它把 $p_{\text{init}}$ 推成 $p_{\text{data}}$。`,
      },
    ],
    concepts: [
      {
        heading: 'CFM 损失中每一项的含义（WA4 Q4）',
        body: String.raw`以 $\mathcal{L}_{\text{CFM}} = \mathbb{E}_{t, \mathbf{x}_0, \mathbf{x}_1}\|\mathbf{v}_\theta(\mathbf{x}_t, t) - (\mathbf{x}_1 - \mathbf{x}_0)\|^2$、$\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\mathbf{x}_1$ 为例：`,
        table: {
          headers: ['项', '含义', '几何 / 物理角色'],
          rows: [
            [String.raw`$t\sim\mathcal{U}(0,1)$`, '随机时刻', '让网络学会整段 $[0,1]$ 上任意时刻的速度'],
            [String.raw`$\mathbf{x}_0\sim p_0$`, '噪声起点（标准高斯）', '运输的出发分布'],
            [String.raw`$\mathbf{x}_1\sim p_1$`, '真实数据样本', '运输的目的地；条件化在单个样本上使目标可计算'],
            [String.raw`$\mathbf{x}_t$`, '起点与终点连线上的插值点', '粒子在时刻 $t$ 的位置'],
            [String.raw`$\mathbf{v}_\theta(\mathbf{x}_t, t)$`, '神经网络向量场', String.raw`在位置 $\mathbf{x}_t$、时刻 $t$ 预测的瞬时速度`],
            [String.raw`$\mathbf{x}_1 - \mathbf{x}_0$`, '条件目标速度', String.raw`$d\mathbf{x}_t/dt$，匀速直线运动的方向和大小`],
          ],
        },
      },
      {
        heading: '流模型 vs 扩散模型',
        body: '扩散模型出现更早，但现在流模型更常用：',
        points: [
          String.raw`统一视角：流模型是 ODE $d\mathbf{X}_t = u_t(\mathbf{X}_t)dt$；扩散模型是 SDE $d\mathbf{X}_t = u_t(\mathbf{X}_t)dt + \sigma_t d\mathbf{W}_t$（漂移项 + 布朗运动扩散项）。`,
          String.raw`分数网络与噪声预测器只差一个缩放：$\boldsymbol{\epsilon}_t^\theta(\mathbf{x}) = -\beta_t\, s_t^\theta(\mathbf{x})$，代入分数匹配损失即得 DDPM 损失。`,
          '离散时间扩散需要在训练前固定时间离散化，并用 ELBO 近似损失；连续时间的流 / SDE 视角训练与采样解耦。',
          String.raw`路径直度：Flow Matching 的条件路径是直线（最优传输），5–20 步就能高质量采样；扩散轨迹因各向同性加噪而弯曲——高噪声时 $D(\mathbf{x},\sigma)$ 指向很多图像的平均，随噪声降低才逐渐指向具体图像，目标在移动。`,
        ],
      },
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
      {
        id: 'fc-l13-euler',
        title: 'Flow Matching 的 Euler 采样器',
        subtitle: '从高斯噪声出发，沿学到的速度场积分到 t = 1',
        latex: String.raw`\mathbf{X}_{t+h} = \mathbf{X}_t + \htmlClass{formula-token formula-token-hyper token-h}{h}\,\htmlClass{formula-token formula-token-param token-u}{u_t^\theta(\mathbf{X}_t)}, \qquad \htmlClass{formula-token formula-token-data token-x0}{\mathbf{X}_0\sim\mathcal{N}(\mathbf{0},\mathbf{I})}`,
        numpyCode: `import numpy as np

def euler_sample(u_net, shape, n_steps=20, rng=np.random.default_rng()):
    x = rng.standard_normal(shape)            # X_0 ~ p_init
    h = 1.0 / n_steps
    for k in range(n_steps):
        t = k * h
        x = x + h * u_net(x, t)               # follow the vector field
    return x                                  # approx. sample from p_data`,
        terms: [
          { id: 'x0', label: String.raw`初始噪声 $\mathbf{X}_0$`, role: 'data', shape: '(B, D)', explanation: '流模型的 t = 0 端是噪声（与 DDPM 的 x_0 = 数据相反）。', numpyLines: [4] },
          { id: 'h', label: String.raw`步长 $h = 1/n$`, role: 'hyper', shape: 'scalar', explanation: '路径越直，可用的步数越少。', numpyLines: [5, 7] },
          { id: 'u', label: String.raw`向量场 $u_t^\theta$`, role: 'param', shape: '(B, D)', explanation: 'CFM 训练得到的速度网络。', numpyLines: [8] },
        ],
      },
    ],
    pitfalls: [
      {
        title: '时间方向约定与 DDPM 相反',
        detail: String.raw`Flow Matching（本讲与 WA4）中 $t = 0$ 是噪声、$t = 1$ 是数据；DDPM 中 $\mathbf{x}_0$ 是数据、$\mathbf{x}_T$ 是噪声。混用记号时最容易把插值写反，答题前先写清约定。`,
      },
      {
        title: '条件目标不是边际向量场',
        detail: String.raw`网络回归的是条件目标 $\mathbf{x}_1 - \mathbf{x}_0$，但由于同一个 $\mathbf{x}_t$ 可能来自很多对 $(\mathbf{x}_0,\mathbf{x}_1)$，最优网络学到的是它们的条件期望，即边际向量场。所以边际轨迹不一定是直线，只是比扩散轨迹直得多。`,
      },
    ],
  },
];
