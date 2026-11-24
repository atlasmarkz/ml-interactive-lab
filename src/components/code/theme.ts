/**
 * One code style for the whole site (GitHub-dark inspired): used by the CodeMirror
 * sandbox editor and by the static, line-highlightable code in FormulaCodeSync.
 */
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const CODE = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  gutter: '#6e7681',
  keyword: '#ff7b72',
  string: '#a5d6ff',
  number: '#79c0ff',
  comment: '#8b949e',
  func: '#d2a8ff',
  builtin: '#ffa657',
  constant: '#79c0ff',
};

const chrome = EditorView.theme(
  {
    '&': { backgroundColor: CODE.bg, color: CODE.text, fontSize: '13.5px' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.75' },
    '.cm-content': { padding: '14px 0', caretColor: '#58a6ff' },
    '.cm-line': { padding: '0 18px 0 6px' },
    '.cm-gutters': { backgroundColor: CODE.bg, color: CODE.gutter, border: 'none', paddingLeft: '10px' },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '22px', padding: '0 8px 0 0' },
    '.cm-activeLine': { backgroundColor: 'rgba(110, 118, 129, 0.12)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: CODE.text },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#58a6ff', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(56, 139, 253, 0.35) !important',
    },
    '.cm-matchingBracket': { backgroundColor: 'rgba(63, 185, 80, 0.25)', outline: 'none' },
    '&.cm-focused': { outline: 'none' },
    '.cm-tooltip': { backgroundColor: CODE.panel, border: `1px solid ${CODE.border}`, color: CODE.text },
    '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: '#1f6feb', color: 'white' },
  },
  { dark: true }
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword], color: CODE.keyword },
  { tag: [t.string, t.special(t.string)], color: CODE.string },
  { tag: [t.number, t.bool, t.null], color: CODE.number },
  { tag: [t.comment, t.lineComment], color: CODE.comment, fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: CODE.func },
  { tag: [t.className, t.definition(t.className)], color: CODE.builtin },
  { tag: [t.standard(t.variableName), t.self], color: CODE.builtin },
  { tag: [t.propertyName], color: CODE.text },
  { tag: [t.operator, t.punctuation, t.bracket], color: '#c9d1d9' },
]);

export const codeTheme = [chrome, syntaxHighlighting(highlight)];

/* ------------------------------------------------------------------ */
/* Lightweight tokenizer for static Python snippets (no editor needed) */
/* ------------------------------------------------------------------ */

const KEYWORDS = new Set(
  'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' ')
);
const CONSTANTS = new Set(['True', 'False', 'None']);
const BUILTINS = new Set(
  'print range len sum min max abs float int list dict tuple set zip enumerate reversed sorted isinstance self np torch F nn math'.split(' ')
);

export interface Token {
  text: string;
  color?: string;
  italic?: boolean;
}

const TOKEN_RE = /(#.*$)|("""[^]*?"""|'''[^]*?'''|[rbfu]{0,2}"(?:\\.|[^"\\])*"|[rbfu]{0,2}'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d*)?(?:e[-+]?\d+)?\b|\.\d+\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_#'"]+)/gm;

export function tokenizePython(line: string): Token[] {
  const out: Token[] = [];
  let prevWord = '';
  for (const m of line.matchAll(TOKEN_RE)) {
    const [whole, comment, str, num, ident] = m;
    if (comment) out.push({ text: whole, color: CODE.comment, italic: true });
    else if (str) out.push({ text: whole, color: CODE.string });
    else if (num) out.push({ text: whole, color: CODE.number });
    else if (ident) {
      const next = line.slice((m.index ?? 0) + whole.length);
      if (KEYWORDS.has(ident)) out.push({ text: whole, color: CODE.keyword });
      else if (CONSTANTS.has(ident)) out.push({ text: whole, color: CODE.constant });
      else if (prevWord === 'def' || prevWord === 'class' || /^\s*\(/.test(next)) out.push({ text: whole, color: CODE.func });
      else if (BUILTINS.has(ident)) out.push({ text: whole, color: CODE.builtin });
      else out.push({ text: whole });
      prevWord = ident;
      continue;
    } else out.push({ text: whole, color: /^[=+\-*/<>@%&|^~!]+$/.test(whole) ? CODE.keyword : undefined });
    if (whole.trim()) prevWord = '';
  }
  return out;
}
