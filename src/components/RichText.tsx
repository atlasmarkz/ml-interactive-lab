import React, { useMemo } from 'react';
import katex from 'katex';

interface RichTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

interface Segment {
  kind: 'text' | 'inline-math' | 'display-math' | 'code';
  content: string;
}

/**
 * Parses prose containing $$...$$ (display math), $...$ (inline math),
 * and `...` (inline code) into typed segments while honoring escaped \$.
 */
function parseRichSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  let buf = '';
  let i = 0;
  const n = input.length;

  const flushText = () => {
    if (buf.length > 0) {
      segments.push({ kind: 'text', content: buf });
      buf = '';
    }
  };

  while (i < n) {
    const ch = input[i];

    // Escaped dollar sign \$
    if (ch === '\\' && i + 1 < n && input[i + 1] === '$') {
      buf += '$';
      i += 2;
      continue;
    }

    // Display math $$...$$
    if (ch === '$' && i + 1 < n && input[i + 1] === '$') {
      const end = input.indexOf('$$', i + 2);
      if (end !== -1) {
        flushText();
        segments.push({ kind: 'display-math', content: input.slice(i + 2, end).trim() });
        i = end + 2;
        continue;
      }
    }

    // Inline math $...$
    if (ch === '$') {
      let j = i + 1;
      let found = -1;
      while (j < n) {
        if (input[j] === '\\' && j + 1 < n) {
          j += 2;
          continue;
        }
        if (input[j] === '$') {
          found = j;
          break;
        }
        j++;
      }
      if (found > i + 1) {
        flushText();
        segments.push({ kind: 'inline-math', content: input.slice(i + 1, found) });
        i = found + 1;
        continue;
      }
    }

    // Inline code `...`
    if (ch === '`') {
      const end = input.indexOf('`', i + 1);
      if (end > i + 1) {
        flushText();
        segments.push({ kind: 'code', content: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    buf += ch;
    i++;
  }

  flushText();
  return segments;
}

function renderKatexSafe(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return expr;
  }
}

export const RichText: React.FC<RichTextProps> = ({ text, className, as = 'span' }) => {
  const rendered = useMemo(() => {
    if (!text.includes('$') && !text.includes('`')) {
      return null;
    }
    const segs = parseRichSegments(text);
    return segs.map((seg, idx) => {
      if (seg.kind === 'text') {
        return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
      }
      if (seg.kind === 'code') {
        return (
          <code
            key={idx}
            className="mx-0.5 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.88em] text-stone-800 dark:bg-zinc-800/90 dark:text-zinc-200"
          >
            {seg.content}
          </code>
        );
      }
      if (seg.kind === 'display-math') {
        const html = renderKatexSafe(seg.content, true);
        return (
          <span
            key={idx}
            className="math-block my-2 block overflow-x-auto text-center"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      const html = renderKatexSafe(seg.content, false);
      return (
        <span
          key={idx}
          className="math-inline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  }, [text]);

  const Tag = as;
  return <Tag className={className}>{rendered ?? text}</Tag>;
};

export const InlineMath: React.FC<{ latex: string; className?: string }> = ({
  latex,
  className = '',
}) => {
  const html = useMemo(() => renderKatexSafe(latex, false), [latex]);
  return (
    <span
      className={`math-inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
