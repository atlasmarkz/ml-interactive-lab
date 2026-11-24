import { Flashcard, QuizQuestion, ReviewPack } from '../../types/review';
import { REVIEW_PART_01 } from './part01';
import { REVIEW_PART_2 } from './part2';
import { REVIEW_PART_3 } from './part3';
import { REVIEW_PART_45 } from './part45';
import { REVIEW_PART_5 } from './part5';
import { EXTRA_QUIZ } from './extraQuiz';
import { WA_DRILLS } from './waDrills';

export const REVIEW_PACKS: ReviewPack[] = [
  ...REVIEW_PART_01,
  ...REVIEW_PART_2,
  ...REVIEW_PART_3,
  ...REVIEW_PART_45,
  ...REVIEW_PART_5,
].map((p) => ({ ...p, quiz: [...p.quiz, ...(EXTRA_QUIZ[p.lectureId] ?? []), ...(WA_DRILLS[p.lectureId] ?? [])] }));

/** "WA3 Q5" style key of a question, if it mirrors a written-assignment question. */
export function waKey(style?: string): string | null {
  const m = style?.match(/WA(\d)\s*(Question X|Q\w+)/);
  return m ? `WA${m[1]} ${m[2] === 'Question X' ? 'QX' : m[2]}` : null;
}

const BY_LECTURE = new Map(REVIEW_PACKS.map((p) => [p.lectureId, p]));

export function getReviewPack(lectureId: string): ReviewPack | undefined {
  return BY_LECTURE.get(lectureId);
}

export interface TaggedCard extends Flashcard {
  lectureId: string;
}

export interface TaggedQuestion extends QuizQuestion {
  lectureId: string;
}

export const ALL_CARDS: TaggedCard[] = REVIEW_PACKS.flatMap((p) =>
  p.flashcards.map((c) => ({ ...c, lectureId: p.lectureId }))
);

export const ALL_QUESTIONS: TaggedQuestion[] = REVIEW_PACKS.flatMap((p) =>
  p.quiz.map((q) => ({ ...q, lectureId: p.lectureId }))
);

/* ------------------------------------------------------------------ */
/* Assignment ↔ lecture map. Topics are paraphrased; course materials   */
/* are copyrighted, so no question text or solutions are reproduced.    */
/* ------------------------------------------------------------------ */

export interface AssignmentItem {
  label: string;
  topic: string;
  lectureIds: string[];
  kind: 'calc' | 'concept' | 'derivation' | 'code';
}

export interface WrittenAssignment {
  id: string;
  title: string;
  scope: string;
  items: AssignmentItem[];
}

export const WRITTEN_ASSIGNMENTS: WrittenAssignment[] = [
  {
    id: 'wa1',
    title: 'WA1 · 回归、Logistic 回归与信息论',
    scope: 'Part 0–1 · L00–L02.2',
    items: [
      { label: 'Q1', topic: '小数据集上手算 OLS 解', lectureIds: ['l01'], kind: 'calc' },
      { label: 'Q2', topic: '把四种正则化方案与拟合直线对应（λ 大小、是否惩罚截距）', lectureIds: ['l01'], kind: 'concept' },
      { label: 'Q3', topic: 'Logistic 回归手算一步 batch 梯度下降并求训练误差', lectureIds: ['l02-1'], kind: 'calc' },
      { label: 'Q4', topic: 'XOR 型数据的最小训练误差；加入交叉特征后的可分性', lectureIds: ['l02-1', 'l02-2'], kind: 'concept' },
      { label: 'Q5', topic: '稀有二值特征下权重发散，以及 L2 正则化的作用', lectureIds: ['l02-1'], kind: 'concept' },
      { label: 'Q6', topic: '两个高斯之间的 KL 与交叉熵表达式及随均值差的变化', lectureIds: ['l02-1', 'l00', 'l10'], kind: 'derivation' },
      { label: 'Q7', topic: 'KL、交叉熵、对数似然三者的关系', lectureIds: ['l00', 'l02-1'], kind: 'derivation' },
    ],
  },
  {
    id: 'wa2',
    title: 'WA2 · 泛化、前馈网络与优化',
    scope: 'Part 1–2 · L02.1–L05',
    items: [
      { label: 'Q1', topic: '期望泛化误差的意义；偏差项与方差项的直观解释', lectureIds: ['l03'], kind: 'concept' },
      { label: 'Q2', topic: '从交叉熵定义推出二元交叉熵；交叉熵最小化与最大似然的关系', lectureIds: ['l02-1', 'l00', 'l04'], kind: 'derivation' },
      { label: 'Q3', topic: 'tanh 隐藏层 + sigmoid 输出的小网络：前向传播与反向传播手算', lectureIds: ['l04'], kind: 'calc' },
      { label: 'Q4', topic: '为什么 sigmoid 不适合隐藏层却适合输出层', lectureIds: ['l04'], kind: 'concept' },
      { label: 'Q5', topic: 'Dropout 的用途与原理', lectureIds: ['l05'], kind: 'concept' },
      { label: 'Q6', topic: 'Adam 的关键思想', lectureIds: ['l05'], kind: 'concept' },
      { label: 'QX', topic: '（自练）平均 K 个模型使方差变为 σ²/K；Bagging', lectureIds: ['l03'], kind: 'derivation' },
    ],
  },
  {
    id: 'wa3',
    title: 'WA3 · CNN、归一化、注意力、BERT 与视觉-语言模型',
    scope: 'Part 2–3 · L05–L09',
    items: [
      { label: 'Q1', topic: '带偏置与 ReLU 的卷积手算', lectureIds: ['l06'], kind: 'calc' },
      { label: 'Q2', topic: '卷积层输出形状、参数量与乘法次数', lectureIds: ['l06'], kind: 'calc' },
      { label: 'Q3', topic: 'BatchNorm 与 LayerNorm 的定义及优缺点', lectureIds: ['l05', 'l08-1'], kind: 'concept' },
      { label: 'Q4', topic: '（跳过）LSTM 遗忘门 / 输入门作用，sigmoid 与 tanh 的分工', lectureIds: ['l07'], kind: 'concept' },
      { label: 'Q5', topic: '自注意力手算：不同查询矩阵、不同输入顺序下的注意力权重与输出', lectureIds: ['l08-1'], kind: 'calc' },
      { label: 'Q6', topic: 'BERT 为什么需要位置嵌入', lectureIds: ['l08-1'], kind: 'concept' },
      { label: 'Q7', topic: 'ViT vs CNN 的优缺点；CLIP 的损失、零样本分类与 linear probing', lectureIds: ['l09'], kind: 'concept' },
    ],
  },
  {
    id: 'wa4',
    title: 'WA4 · 图像生成模型',
    scope: 'Part 4 · L10–L13',
    items: [
      { label: 'Q1', topic: 'VAE 目标第一项为什么叫重建误差', lectureIds: ['l10'], kind: 'concept' },
      { label: 'Q2', topic: 'GAN 两种生成器损失：共同目标、优缺点与缓解、哪一个近似 JSD', lectureIds: ['l11'], kind: 'concept' },
      { label: 'Q3', topic: '从 DDPM 采样公式出发解释 classifier guidance', lectureIds: ['l12'], kind: 'derivation' },
      { label: 'Q4', topic: '条件流匹配损失中各项的含义与几何作用', lectureIds: ['l13'], kind: 'concept' },
    ],
  },
];

export interface HandsOnAssignment {
  id: string;
  title: string;
  group: number;
  lectureIds: string[];
  tutorial?: string;
  focus: string[];
}

export const HANDS_ON_ASSIGNMENTS: HandsOnAssignment[] = [
  { id: 'ha01', title: 'HA1 · Softmax 回归', group: 1, lectureIds: ['l02-1'], tutorial: 'Tutorial 1–3', focus: ['数值稳定的 softmax', 'P − Y 形式的梯度', '学习率与收敛'] },
  { id: 'ha02', title: 'HA2 · 反向传播', group: 1, lectureIds: ['l04'], tutorial: 'Tutorial 4', focus: ['逐层 δ 回传', 'ReLU / tanh 导数', '数值梯度检查'] },
  { id: 'ha03', title: 'HA3 · 训练 CNN', group: 2, lectureIds: ['l06', 'l05'], tutorial: 'Tutorial 5', focus: ['卷积 / 池化形状计算', '优化器与学习率调度对比', 'BN 与 Dropout 的影响'] },
  { id: 'ha04', title: 'HA4 · 使用预训练 CNN', group: 2, lectureIds: ['l06'], tutorial: 'Tutorial 5', focus: ['迁移学习：冻结 vs 微调', 'ResNet 残差结构', '输入预处理与类别映射'] },
  { id: 'ha05', title: 'HA5 · 训练 RNN', group: 3, lectureIds: ['l07'], tutorial: 'Tutorial 6', focus: ['BPTT 与梯度裁剪', 'LSTM 门控', 'Teacher forcing'] },
  { id: 'ha06', title: 'HA6 · 使用预训练 BERT', group: 3, lectureIds: ['l08-1'], tutorial: 'Tutorial 7', focus: ['[CLS] 分类头微调', 'tokenizer 与 attention mask', '输入嵌入三部分'] },
  { id: 'ha07', title: 'HA7 · 训练仅解码器语言模型', group: 4, lectureIds: ['l08-1', 'l08-2'], focus: ['因果掩码', '下一个 token 预测损失', '温度采样（HA12 依赖此作业）'] },
  { id: 'ha08', title: 'HA8 · 使用预训练 CLIP', group: 5, lectureIds: ['l09'], tutorial: 'Tutorial 8', focus: ['零样本 prompt 分类', 'Linear probing', '图文相似度矩阵'] },
  { id: 'ha09', title: 'HA9 · 训练 GAN', group: 6, lectureIds: ['l11'], tutorial: 'Tutorial 9', focus: ['判别器 / 生成器交替更新', '非饱和生成器损失', 'detach 假样本'] },
  { id: 'ha10', title: 'HA10 · 训练扩散模型', group: 6, lectureIds: ['l12', 'l13'], tutorial: 'Tutorial 10–11', focus: ['闭式加噪与噪声预测损失', '采样循环最后一步不加噪', 'CFG'] },
  { id: 'ha11', title: 'HA11 · Q-Learning', group: 7, lectureIds: ['l14'], tutorial: 'Tutorial 12', focus: ['TD 更新', 'ε-greedy 探索', 'Q-Learning vs SARSA'] },
  { id: 'ha12', title: 'HA12 · PPO + RLHF', group: 7, lectureIds: ['l16', 'l08-2'], tutorial: 'Tutorial 13', focus: ['奖励模型（Bradley–Terry）', 'PPO 裁剪目标', 'KL 约束防止 reward hacking'] },
];

export const TUTORIALS: { title: string; lectureIds: string[] }[] = [
  { title: 'Tutorial 1 · Colab、Python 与 NumPy', lectureIds: ['l00', 'l01'] },
  { title: 'Tutorial 2 · PyTorch 基础与线性回归', lectureIds: ['l01'] },
  { title: 'Tutorial 3 · Logistic 回归', lectureIds: ['l02-1'] },
  { title: 'Tutorial 4 · PyTorch 中的 FNN', lectureIds: ['l04'] },
  { title: 'Tutorial 5 · CNN', lectureIds: ['l06'] },
  { title: 'Tutorial 6 · RNN', lectureIds: ['l07'] },
  { title: 'Tutorial 7 · PyTorch 中的 BERT', lectureIds: ['l08-1'] },
  { title: 'Tutorial 8 · 与 CLIP 交互', lectureIds: ['l09'] },
  { title: 'Tutorial 9 · GAN 与 VAE', lectureIds: ['l10', 'l11'] },
  { title: 'Tutorial 10 · Diffusion', lectureIds: ['l12'] },
  { title: 'Tutorial 11 · Flow Models', lectureIds: ['l13'] },
  { title: 'Tutorial 12 · Q-Learning', lectureIds: ['l14'] },
  { title: 'Tutorial 13 · DQN', lectureIds: ['l15'] },
];
