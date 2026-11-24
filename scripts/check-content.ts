/**
 * Content sanity checks (run with `pnpm check:content`):
 *  - every LaTeX field and every $…$ segment in prose renders with KaTeX (throwOnError)
 *  - ids are unique, MCQ answers are valid, all lecture references resolve
 *  - every lecture has a review pack and formula/code line references are in range
 */
import katex from 'katex';
import { LECTURES } from '../src/data/lectures';
import { HANDS_ON_ASSIGNMENTS, REVIEW_PACKS, TUTORIALS, WRITTEN_ASSIGNMENTS } from '../src/data/review';

const errors: string[] = [];
let rendered = 0;
const trust = (ctx: { command: string }) => ctx.command === '\\htmlClass' || ctx.command === '\\htmlId';

function renderLatex(latex: string, where: string, display: boolean) {
  try {
    katex.renderToString(latex, { throwOnError: true, displayMode: display, strict: false, trust });
    rendered++;
  } catch (e) {
    errors.push(`${where}: KaTeX error ${(e as Error).message.split('\n')[0]} :: ${latex.slice(0, 80)}`);
  }
}

/** Mirror of RichText's parser: $$…$$ display, $…$ inline, \$ escapes, `code` skipped. */
function renderProse(text: string, where: string) {
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && text[i + 1] === '$') { i += 2; continue; }
    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    if (ch === '$' && text[i + 1] === '$') {
      const end = text.indexOf('$$', i + 2);
      if (end !== -1) { renderLatex(text.slice(i + 2, end), where, true); i = end + 2; continue; }
    }
    if (ch === '$') {
      let j = i + 1;
      while (j < text.length && text[j] !== '$') j += text[j] === '\\' ? 2 : 1;
      if (j < text.length) { renderLatex(text.slice(i + 1, j), where, false); i = j + 1; continue; }
      errors.push(`${where}: unmatched $ in "${text.slice(i, i + 60)}"`);
    }
    i++;
  }
}

function walk(value: unknown, path: string) {
  if (typeof value === 'string') {
    const key = path.split('.').pop() ?? '';
    if (key === 'latex') renderLatex(value, path, true);
    else if (!/(Code|starterCode|id|slug|shape|role|kind)$/.test(key)) renderProse(value, path);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
  }
}

const lectureIds = new Set(LECTURES.map((l) => l.id));
const seen = new Set<string>();
const unique = (id: string, where: string) => {
  if (seen.has(id)) errors.push(`${where}: duplicate id ${id}`);
  seen.add(id);
};

for (const lec of LECTURES) {
  unique(lec.id, 'lecture');
  walk(lec, lec.id);
  for (const spec of lec.formulaSpecs) {
    const np = spec.numpyCode.split('\n').length;
    const pt = spec.pytorchCode?.split('\n').length ?? 0;
    for (const t of spec.terms) {
      if (!spec.latex.includes(`token-${t.id}`)) errors.push(`${spec.id}: term ${t.id} has no \\htmlClass token in latex`);
      if (t.numpyLines.some((n) => n < 1 || n > np)) errors.push(`${spec.id}.${t.id}: numpyLines out of range (1..${np})`);
      if (t.pytorchLines?.some((n) => n < 1 || n > pt)) errors.push(`${spec.id}.${t.id}: pytorchLines out of range (1..${pt})`);
    }
  }
}
if (new Set(LECTURES.map((l) => l.slug)).size !== LECTURES.length) errors.push('duplicate lecture slug');

for (const pack of REVIEW_PACKS) {
  if (!lectureIds.has(pack.lectureId)) errors.push(`review pack for unknown lecture ${pack.lectureId}`);
  walk(pack, `review:${pack.lectureId}`);
  for (const c of pack.flashcards) unique(c.id, pack.lectureId);
  for (const q of pack.quiz) {
    unique(q.id, pack.lectureId);
    if (q.kind === 'mcq') {
      if (!q.options || typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) {
        errors.push(`${q.id}: invalid mcq answer`);
      }
    } else if (typeof q.answer !== 'string') errors.push(`${q.id}: non-mcq answer must be text`);
  }
}
for (const lec of LECTURES) {
  if (!REVIEW_PACKS.some((p) => p.lectureId === lec.id)) errors.push(`lecture ${lec.id} has no review pack`);
}
for (const wa of WRITTEN_ASSIGNMENTS) for (const it of wa.items) for (const id of it.lectureIds) {
  if (!lectureIds.has(id)) errors.push(`${wa.id} ${it.label}: unknown lecture ${id}`);
}
for (const ha of HANDS_ON_ASSIGNMENTS) for (const id of ha.lectureIds) if (!lectureIds.has(id)) errors.push(`${ha.id}: unknown lecture ${id}`);
for (const t of TUTORIALS) for (const id of t.lectureIds) if (!lectureIds.has(id)) errors.push(`${t.title}: unknown lecture ${id}`);

const cards = REVIEW_PACKS.reduce((n, p) => n + p.flashcards.length, 0);
const qs = REVIEW_PACKS.reduce((n, p) => n + p.quiz.length, 0);
console.log(`lectures=${LECTURES.length} packs=${REVIEW_PACKS.length} cards=${cards} questions=${qs} katex-rendered=${rendered}`);
if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log('content check passed');
