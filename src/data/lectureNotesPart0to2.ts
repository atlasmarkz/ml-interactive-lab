import { LectureSection } from '../types/curriculum';

export const LECTURE_NOTES_0_TO_2: Record<number, LectureSection[]> = {
  0: [
    {
      id: 'l00-prob',
      lectureTag: 'L00 · 概率公理与分布',
      title: '概率论核心语言：联合/边缘/条件分布与贝叶斯决策',
      concepts: [
        {
          heading: '三大基础分布与机器学习落点',
          badge: 'Cheatsheet §1',
          summary: '课程几乎所有监督与生成模型都建立在 Bernoulli、Categorical、Gaussian 三大指数族分布之上。',
          latex: String.raw`P(A \mid B) = \frac{P(B \mid A)P(A)}{P(B)}, \qquad P(x) = \sum_y P(x, y)`,
          bullets: [
            'Bernoulli(p)：二分类输出头（Logistic Regression / 判别器 D(x)）的概率假设。',
            'Categorical(p₁,…,p_K)：多分类 Softmax 输出头与语言模型词表预测分布。',
            'Gaussian N(μ, σ²)：线性回归 MSE 的噪声假设、GDA 类条件密度、VAE 潜空间与 Diffusion 噪声核心。',
          ],
        },
        {
          heading: '双高斯分布的闭式 KL 散度与交叉熵',
          badge: '高频推导考点',
          summary: '两个一维高斯 p = N(μ₁, σ₁²) 与 q = N(μ₂, σ₂²) 之间的 KL 散度有精确闭式解（也是 VAE 解析 KL 的特例）：',
          latex: String.raw`D_{\text{KL}}(p \,\|\, q) = \log\frac{\sigma_2}{\sigma_1} + \frac{\sigma_1^2 + (\mu_1 - \mu_2)^2}{2\sigma_2^2} - \frac{1}{2}`,
          bullets: [
            '当 σ₁ = σ₂ = 1 时，KL 散度化简为 ½(μ₁ − μ₂)²，随均值偏离呈二次抛物线增长！',
            '因为 H(p) = ½ log(2πeσ₁²) 是常数，交叉熵 H(p, q) = H(p) + D_KL(p ‖ q) 具有完全相同的抛物线曲率。',
            '把 q 设为 N(0, 1) 即得到 VAE 损失中的解析正则项 −½(1 + log σ² − μ² − σ²)。',
          ],
        },
      ],
    },
    {
      id: 'l02-info',
      lectureTag: 'L02.1 · 信息论与最大似然',
      title: '自信息、条件交叉熵与 i.i.d. 最大似然统一框架',
      concepts: [
        {
          heading: '条件交叉熵 = 监督学习负对数似然 (NLL)',
          badge: '理论统一',
          summary: '在独立同分布 (i.i.d.) 假设下，最大化样本对数似然 log ∏ P_θ(y_i | x_i) 等价于最小化经验分布与模型分布的条件交叉熵。',
          latex: String.raw`\hat{\theta}_{\text{MLE}} = \arg\max_\theta \frac{1}{N}\sum_{i=1}^N \log P_\theta(y_i \mid x_i) = \arg\min_\theta H(\hat{P}_{\text{data}}, P_\theta)`,
          bullets: [
            '为什么取 log？① 把连乘变连加防止浮点下溢；② 单调递增不改变极值点位置；③ 求导极其简洁。',
            '在线性回归中假设 y | x ~ N(wᵀx, σ²)，最大化对数似然直接导出最小化均方误差 MSE！',
            '在分类中假设 y | x ~ Categorical(Softmax(Wx))，最大化对数似然直接导出最小化交叉熵！',
          ],
        },
      ],
    },
  ],
  1: [
    {
      id: 'l01-reg',
      lectureTag: 'L01 · 线性回归、正则化与验证',
      title: '模型容量、交叉验证、LASSO vs Ridge 与 R² 评估',
      concepts: [
        {
          heading: '假设空间容量 (Capacity)、验证集与 K-Fold 交叉验证',
          badge: 'L01 p17–30',
          summary: '不能用测试集调超参数（会造成信息泄露）；数据稀缺时采用 K-Fold Cross-Validation 充分复用数据。',
          bullets: [
            '模型容量过小 → 欠拟合（训练误差与测试误差双高）；容量过大 → 过拟合（训练误差极低但测试误差飙升）。',
            'K-Fold CV：把训练集均分 K 份，轮流以 1 份做验证集、K−1 份做训练集，取 K 次验证误差均值选最优超参（如多项式阶数 d 或正则 λ）。',
            '选定超参后，用全部训练+验证数据重新训练最终模型，最后仅在测试集评估一次泛化误差。',
          ],
        },
        {
          heading: 'LASSO (L1) vs Ridge (L2) & 偏置项 w₀ 陷阱',
          badge: 'L01 p31–41 · 高频考点',
          summary: '正则化通过约束权重范数缩小有效假设空间，但 L1 与 L2 几何形态截然不同，且通常绝不惩罚偏置项 w₀。',
          latex: String.raw`L_{\text{Ridge}} = \text{MSE} + \lambda \sum_{j=1}^D w_j^2, \qquad L_{\text{LASSO}} = \text{MSE} + \lambda \sum_{j=1}^D |w_j|`,
          bullets: [
            'Ridge (L2)：有闭式解 (XᵀX + λI)⁻¹Xᵀy，平滑缩小所有权重，适合多重共线特征。',
            'LASSO (L1)：菱形约束顶点落在坐标轴上，迫使不重要特征权重精确为 0（自动特征选择 / 稀疏模型），无闭式解需用坐标下降或次梯度。',
            '绝不惩罚 w₀：若把 w₀ 纳入惩罚，大 λ 会把拟合直线强行拽过原点 (0,0)，破坏数据平移不变性。',
          ],
        },
        {
          heading: '回归性能指标：MSE 与 R² (决定系数)',
          badge: 'L01 p42–44',
          summary: 'R² 衡量模型比“永远猜平均值 ȳ”的傻瓜基准减少了多少比例的平方误差。',
          latex: String.raw`R^2 = 1 - \frac{\sum_{i=1}^N (y_i - \hat{y}_i)^2}{\sum_{i=1}^N (y_i - \bar{y})^2}`,
          bullets: [
            'R² = 1 表示完美拟合；R² = 0 表示和直接输出均值 ȳ 一样差；测试集上甚至可能出现 R² < 0（过拟合严重到不如猜均值）。',
          ],
        },
      ],
    },
    {
      id: 'l02-cls',
      lectureTag: 'L02.1–2.2 · 分类三大范式与评估',
      title: 'Logistic/Softmax、0/1 凸代理损失与 Naive Bayes 生成式分类',
      concepts: [
        {
          heading: '分类问题的三大建模视角对比',
          badge: 'L02.2 核心框架',
          summary: '同一分类任务可从概率判别、直接优化、概率生成三条路线切入：',
          bullets: [
            '判别概率视角（Logistic / Softmax）：直接建模条件分布 P(y | x) = σ(wᵀx)，通过最大化条件似然学习线性决策面。',
            '直接优化视角（Surrogate Loss）：0/1 误差函数阶跃不可微、梯度几乎处处为 0 → 替换为凸上界代理损失（Logistic / Hinge / Exponential Loss）。',
            '生成式视角（Naive Bayes / GDA）：先估计联合分布 P(x, y) = P(y)P(x | y)，再用贝叶斯公式反推后验 P(y | x)。',
          ],
          table: {
            headers: ['模型类别', '建模对象', '核心假设', '典型特点'],
            rows: [
              ['Logistic / Softmax', '条件分布 P(y|x)', '对数几率关于 x 线性', '不对 P(x) 做强假设，数据大时判别精度高'],
              ['Naive Bayes', '联合分布 P(y)∏P(x_j|y)', '给定类别 y 后各特征条件独立', '参数极少、极快、小样本与文本分类强健（需 Laplace 平滑防零概率）'],
              ['LDA / QDA (GDA)', '联合分布 P(y)N(μ_k, Σ_k)', '类条件特征服从多元高斯', '共享 Σ 得线性边界 (LDA)，独立 Σ_k 得二次曲面 (QDA)'],
            ],
          },
        },
        {
          heading: 'Naive Bayes 参数估计与 Laplace 平滑',
          badge: 'L02.2 p20–23',
          summary: '对离散特征（如垃圾邮件词袋），利用条件独立假设把指数级联合概率拆为各维连乘：',
          latex: String.raw`P(y \mid \mathbf{x}) \propto P(y)\prod_{j=1}^D P(x_j \mid y), \qquad \hat{P}(x_j = v \mid y=k) = \frac{N_{k,j,v} + \alpha}{N_k + \alpha |V_j|}`,
          bullets: [
            '如果不做条件独立假设，D 个二元特征需要估计 2^D − 1 个参数；条件独立将其骤降至 O(D)！',
            '若某词在训练集的某类别中从未出现，MLE 概率为 0 会让整个连乘归零 → 分子加 α、分母加 α|V|（Laplace/Add-α 平滑）解决零概率灾难。',
          ],
        },
      ],
    },
    {
      id: 'l03-bv',
      lectureTag: 'L03 · Bias-Variance 与集成学习',
      title: '泛化误差严格分解与 Bagging vs Boosting',
      concepts: [
        {
          heading: '期望泛化误差的严格三项分解',
          badge: 'L03 p10–13 · WA2 考点',
          summary: '对随机采样的训练集 S 训练得到的假设 h_S，其在未知测试分布上的期望均方误差可严格拆为：',
          latex: String.raw`\mathbb{E}_{S,x,y}\!\big[(y - h_S(x))^2\big] = \underbrace{\mathbb{E}_x\!\big[(f(x) - \bar{h}(x))^2\big]}_{\text{Bias}^2 \text{（欠拟合偏差）}} + \underbrace{\mathbb{E}_{x,S}\!\big[(h_S(x) - \bar{h}(x))^2\big]}_{\text{Variance（对训练集波动的敏感度）}} + \underbrace{\sigma^2}_{\text{不可约噪声}}`,
          bullets: [
            'h̄(x) = E_S[h_S(x)] 表示在无数个同分布训练集上重复训练得到的平均预测函数。',
            '高 Bias 说明模型太简单，即使给无限数据也逼近不了真实函数 f(x)；高 Variance 说明模型太灵活，换一批样本拟合曲线就剧烈甩动。',
          ],
        },
        {
          heading: '集成学习如何分别击破 Variance 与 Bias',
          badge: 'L03 p22–25',
          summary: '集成学习（Ensemble）通过组合多个弱/基学习器打破单一模型的 Bias-Variance 困境：',
          bullets: [
            'Bagging（Bootstrap Aggregating，代表：Random Forest）：并行自助采样训练多个高方差强模型（如深决策树）取平均 → 偏差几乎不变，方差大幅缩小（约 1/M）！',
            'Boosting（代表：AdaBoost / GBDT / XGBoost）：串行迭代，每轮重点拟合上一轮的错分样本或残差 → 专门用来大幅降低高偏差弱模型（如浅树桩）的 Bias！',
          ],
        },
      ],
    },
  ],
  2: [
    {
      id: 'l04-fnn',
      lectureTag: 'L04 · 激活函数、概率输出头与反向传播',
      title: 'FNN 万能逼近、SwiGLU 激活演进与概率输出层设计',
      concepts: [
        {
          heading: '激活函数演进史与门控单元 (GLU / SwiGLU)',
          badge: 'L04 p8–17',
          summary: '现代大模型（LLaMA / Gemma / Qwen）已普遍把 FFN 中的 ReLU 替换为平滑门控激活 SwiGLU：',
          latex: String.raw`\text{SwiGLU}(\mathbf{x}) = \text{Swish}(\mathbf{x}\mathbf{W} + \mathbf{b}) \odot (\mathbf{x}\mathbf{V} + \mathbf{c}), \quad \text{Swish}(z) = z \cdot \sigma(z)`,
          bullets: [
            'Sigmoid / Tanh 在饱和区导数趋近 0，导致深层网络梯度消失；ReLU 解决正半轴饱和但有 Dead ReLU。',
            'Universal Approximation Theorem：仅需单隐藏层配非线性激活，只要宽度足够即可在紧集上以任意精度逼近任意连续函数（但深度网络指数级节省参数！）。',
          ],
        },
        {
          heading: 'FNN 作为概率模型的三大输出单元',
          badge: 'L04 p21–27',
          summary: '隐藏层提取高维特征 h 后，输出层的激活与损失函数由目标分布唯一决定：',
          table: {
            headers: ['任务类型', '假设输出分布', '输出层激活', '最大似然导出损失'],
            rows: [
              ['连续回归', 'Gaussian N(μ=wᵀh+b, σ²)', 'Linear（恒等）', 'Mean Squared Error (MSE)'],
              ['二分类', 'Bernoulli(p=σ(z))', 'Sigmoid σ(z)', 'Binary Cross-Entropy'],
              ['K 类多分类', 'Categorical(Softmax(z))', 'Softmax(z)', 'Cross-Entropy (Log-Softmax + NLL)'],
            ],
          },
          bullets: [
            '为什么 PyTorch 的 CrossEntropyLoss 接收原始 Logits 而不是概率？因为在 log-sum-exp 里直接做对数化简可避免 σ/exp 下溢并保证梯度不饱和！',
          ],
        },
      ],
    },
    {
      id: 'l05-opt',
      lectureTag: 'L05 · Dropout、优化器谱系与 BatchNorm',
      title: '深度学习训练三大支柱：正则、自适应优化与归一化',
      concepts: [
        {
          heading: '优化器完整演进：AdaGrad → RMSProp → Adam → AdamW',
          badge: 'L05 p10–25',
          summary: '从统一学习率到逐参数自适应二阶矩，再到正确解耦 Weight Decay：',
          bullets: [
            'AdaGrad：累加全部历史梯度平方 r ← r + g⊙g，稀疏特征表现好，但分母单调递增导致训练后期学习率过早衰减至 0。',
            'RMSProp：把累加改为指数衰减移动平均 r ← ρr + (1−ρ)g⊙g，彻底修复学习率枯竭问题。',
            'Adam = Momentum(一阶矩 m) + RMSProp(二阶矩 v) + 初期偏差修正（除以 1−βᵗ）。',
            'AdamW 为什么优于 Adam + L2？在 Adam 中把 λw 混入梯度 g 后会被自适应分母 √v 缩放，导致大梯度参数的正则变弱；AdamW 把权重衰减直接施加在参数更新步 θ ← (1−ηλ)θ − η m̂/(√v̂+ε)！',
            'Learning Rate Scheduling：Warmup（初期从小学习率线性升温防 Adam 方差震荡）+ Cosine Decay（后期平滑退火收敛到宽阔极小值）。',
          ],
        },
        {
          heading: 'BatchNorm 训练 vs 推理差异与缓解梯度消失',
          badge: 'L05 p26–34 · WA3 考点',
          summary: 'BatchNorm 强制把每层输入拉回零均值单位方差，再用可学习缩放平移 γ, β 恢复表达力：',
          latex: String.raw`\hat{x}_i = \frac{x_i - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}}, \qquad y_i = \gamma \hat{x}_i + \beta`,
          bullets: [
            '训练时使用当前 Mini-batch 的均值 μ_B 和方差 σ_B²；推理单张图片时没有 Batch，必须改用训练期指数滑动平均保存的 Running Mean / Running Variance！',
            '平滑损失地形、允许更大学习率、减轻对参数初始化的敏感度，并自带轻微正则化噪声。',
          ],
        },
      ],
    },
    {
      id: 'l06-cnn',
      lectureTag: 'L06 · CNN 架构演进与感受野',
      title: '从 Cross-Correlation、1×1 卷积到 AlexNet → ResNet → DenseNet',
      concepts: [
        {
          heading: 'CNN 核心技术细节：Cross-Correlation、Pooling 与 1×1 卷积',
          badge: 'L06 p16–28',
          summary: '深度学习框架里的 Conv2d 严格来说是互相关（不翻转卷积核），核心优势是「局部连接 + 权值共享 + 平移等变性」。',
          bullets: [
            '输出高宽公式：H_out = ⌊(H + 2P − K) / S⌋ + 1；参数量仅取决于 K²·C_in·C_out（与图像分辨率 H×W 无关！）。',
            'Pooling（Max / Average）：降维减算力、扩大感受野、赋予局部平移不变性，且不含可学习参数。',
            '1×1 卷积：不改变空间高宽，专门在通道维度做跨通道线性融合与降维/升维（Bottleneck 省算力神器）。',
          ],
        },
        {
          heading: 'ImageNet 经典 CNN 架构演进路线图',
          badge: 'L06 p29–54',
          summary: '每一代里程碑架构都精准解决了一个核心瓶颈：',
          table: {
            headers: ['架构', '核心创新', '解决的关键问题'],
            rows: [
              ['AlexNet (2012)', 'ReLU + Dropout + GPU 双卡 + 数据增强', '打响深度学习视觉革命，缓解过拟合与梯度饱和'],
              ['VGGNet (2014)', '全线改用小卷积核 3×3 堆叠', '2 层 3×3 与 1 层 5×5 感受野相同，但参数更少且多一层非线性'],
              ['GoogLeNet (2014)', 'Inception 多尺度并行分支 + 1×1 降维瓶颈', '大幅压缩参数与 FLOPs，同时捕获多尺度特征'],
              ['ResNet (2015)', '恒等残差跳连 y = F(x) + x', '突破深层网络退化问题，成功训练 152 层+ 极深网络'],
              ['DenseNet (2017)', '每层把前面所有层的特征图沿通道拼接 (Concat)', '最大化特征复用与梯度直达，比 ResNet 更省参数'],
            ],
          },
          bullets: [
            'L06 p58–59 重要反思：CNN 提取局部纹理极强，但对对抗样本和纹理替换敏感（Texture Bias），并不像人类一样依赖全局物体形状。',
          ],
        },
      ],
    },
    {
      id: 'l07-rnn',
      lectureTag: 'L07 · RNN、LSTM/GRU、Seq2Seq 与 Attention',
      title: '循环序列建模、Teacher Forcing 与编码器-解码器注意力',
      concepts: [
        {
          heading: 'LSTM vs GRU 与双向/多层 RNN',
          badge: 'L07 p16–27',
          summary: 'LSTM 用独立的 Cell State c_t 和 3 个门（Forget / Input / Output）保护长程梯度；GRU 合并为 2 个门（Reset / Update）更轻量。',
          latex: String.raw`\begin{aligned}
f_t &= \sigma(W_f [h_{t-1}, x_t] + b_f), & i_t &= \sigma(W_i [h_{t-1}, x_t] + b_i), \\
\tilde{c}_t &= \tanh(W_c [h_{t-1}, x_t] + b_c), & c_t &= f_t \odot c_{t-1} + i_t \odot \tilde{c}_t, \quad h_t = o_t \odot \tanh(c_t)
\end{aligned}`,
          bullets: [
            'Bidirectional RNN：同时维护前向和后向两套隐藏状态并拼接，让每个位置同时看到过去与未来上下文（适用于分类/NER，不能用于自回归生成）。',
            'BPTT（随时间反向传播）：长序列易触发梯度爆炸（用 Gradient Clipping 截断）与梯度消失（靠 LSTM/GRU 门控缓解）。',
          ],
        },
        {
          heading: 'Seq2Seq 瓶颈、Teacher Forcing 与 Bahdanau/Luong Attention',
          badge: 'L07 p28–46',
          summary: '传统 Seq2Seq 把整句源文本强行压缩进最后一个固定向量 c，长句必然信息丢失——Attention 打破了这个瓶颈！',
          bullets: [
            'Teacher Forcing：训练 Decoder 时喂入真实上一步标签 y*_{t-1}（收敛快且稳）；推理时没有真值只能喂自己生成的 ŷ_{t-1}（存在 Exposure Bias），常用 Greedy 或 Beam Search 解码。',
            'Bahdanau (Additive) vs Luong (Dot-Product) Attention：Decoder 每生成一步都动态给 Encoder 所有时间步打分并加权求和生成专属 Context Vector——直接孕育了 Part 3 的 Transformer！',
          ],
        },
      ],
    },
  ],
};
