import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
  activeTokenId?: string | null;
  onTokenHover?: (tokenId: string | null) => void;
  onTokenClick?: (tokenId: string) => void;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  latex,
  displayMode = true,
  className = '',
  activeTokenId = null,
  onTokenHover,
  onTokenClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    try {
      katex.render(latex, el, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: (context) => context.command === '\\htmlClass' || context.command === '\\htmlId',
      });
    } catch {
      el.textContent = latex;
    }
  }, [latex, displayMode]);

  // Sync active visual highlight class onto matching formula-token spans
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const tokens = el.querySelectorAll<HTMLElement>('.formula-token');
    tokens.forEach((tok) => {
      const match = Array.from(tok.classList).find((c) => c.startsWith('token-'));
      const id = match ? match.slice('token-'.length) : null;
      if (id && id === activeTokenId) {
        tok.classList.add('is-active');
      } else {
        tok.classList.remove('is-active');
      }
    });
  }, [activeTokenId, latex]);

  // Event delegation for hover & click
  const extractTokenId = (target: EventTarget | null): string | null => {
    let node = target as HTMLElement | null;
    while (node && node !== containerRef.current) {
      if (node.classList?.contains('formula-token')) {
        const cls = Array.from(node.classList).find((c) => c.startsWith('token-'));
        if (cls) return cls.slice('token-'.length);
      }
      node = node.parentElement;
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={(e) => {
        if (!onTokenHover) return;
        const id = extractTokenId(e.target);
        onTokenHover(id);
      }}
      onMouseLeave={() => onTokenHover?.(null)}
      onClick={(e) => {
        if (!onTokenClick) return;
        const id = extractTokenId(e.target);
        if (id) onTokenClick(id);
      }}
    />
  );
};
