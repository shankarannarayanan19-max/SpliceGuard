/**
 * CopilotMarkdown — Safe markdown renderer for SpliceGuard AI Copilot responses.
 *
 * Renders: headings (h1–h4), bold, italic, inline code, bullet lists,
 * numbered lists, horizontal rules, and plain paragraphs.
 *
 * Does NOT use dangerouslySetInnerHTML.
 * Strips any raw HTML/SVG/JSX artifacts before processing.
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Sanitisation — strip raw HTML / SVG / JSX artifacts from AI output
// ---------------------------------------------------------------------------
function sanitiseText(raw: string): string {
  return (
    raw
      // Remove full SVG elements
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      // Remove any remaining HTML tags (but keep content between them)
      .replace(/<[^>]+>/g, '')
      // Remove JSX-like component syntax  e.g. {someVar} or <Component />
      .replace(/\{[^}]*\}/g, '')
      // Collapse runs of 3+ blank lines to 2
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

// ---------------------------------------------------------------------------
// Inline renderer — bold, italic, inline code within a single text segment
// ---------------------------------------------------------------------------
function renderInline(text: string, baseKey: string): React.ReactNode[] {
  // Pattern: **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  // Split on bold (**…**), italic (*…*), or inline code (`…`)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > last) {
      parts.push(
        <React.Fragment key={`${baseKey}-t${idx}`}>
          {text.slice(last, match.index)}
        </React.Fragment>
      );
      idx++;
    }

    const full = match[1];
    if (full.startsWith('**')) {
      parts.push(
        <strong key={`${baseKey}-b${idx}`} className="font-semibold text-white">
          {match[2]}
        </strong>
      );
    } else if (full.startsWith('*')) {
      parts.push(
        <em key={`${baseKey}-i${idx}`} className="italic text-slate-300">
          {match[3]}
        </em>
      );
    } else if (full.startsWith('`')) {
      parts.push(
        <code
          key={`${baseKey}-c${idx}`}
          className="px-1 py-0.5 bg-slate-700/80 text-cyan-300 rounded text-[10px] font-mono-tech"
        >
          {match[4]}
        </code>
      );
    }
    last = match.index + full.length;
    idx++;
  }

  // Remaining text
  if (last < text.length) {
    parts.push(
      <React.Fragment key={`${baseKey}-t${idx}`}>{text.slice(last)}</React.Fragment>
    );
  }

  return parts.length > 0 ? parts : [text];
}

// ---------------------------------------------------------------------------
// Block-level renderer — parses lines into React elements
// ---------------------------------------------------------------------------
interface BlockGroup {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'bullet' | 'numbered' | 'hr' | 'p' | 'empty';
  content: string;
  number?: number; // for numbered list
}

function parseBlocks(text: string): BlockGroup[] {
  const lines = text.split('\n');
  const blocks: BlockGroup[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed === '') {
      blocks.push({ type: 'empty', content: '' });
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'hr', content: '' });
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', content: trimmed.slice(2) });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', content: trimmed.slice(3) });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', content: trimmed.slice(4) });
    } else if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: trimmed.slice(5) });
    } else if (/^[-*•]\s+/.test(trimmed)) {
      blocks.push({ type: 'bullet', content: trimmed.replace(/^[-*•]\s+/, '') });
    } else if (/^\d+\.\s+/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      blocks.push({
        type: 'numbered',
        content: numMatch ? numMatch[2] : trimmed,
        number: numMatch ? parseInt(numMatch[1], 10) : undefined,
      });
    } else {
      blocks.push({ type: 'p', content: trimmed });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface CopilotMarkdownProps {
  text: string;
  /** compact mode: tighter spacing, used inside message bubbles */
  compact?: boolean;
}

export const CopilotMarkdown: React.FC<CopilotMarkdownProps> = ({ text, compact = true }) => {
  const clean = sanitiseText(text);
  const blocks = parseBlocks(clean);

  const elements: React.ReactNode[] = [];
  let bulletBuffer: BlockGroup[] = [];
  let numberedBuffer: BlockGroup[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key} className={`space-y-0.5 ${compact ? 'my-1' : 'my-2'}`}>
        {bulletBuffer.map((b, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-cyan-400 mt-[3px] shrink-0 text-[10px]">▸</span>
            <span className="text-slate-200 leading-relaxed">
              {renderInline(b.content, `bl-${key}-${i}`)}
            </span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  const flushNumbered = (key: string) => {
    if (numberedBuffer.length === 0) return;
    elements.push(
      <ol key={key} className={`space-y-0.5 ${compact ? 'my-1' : 'my-2'}`}>
        {numberedBuffer.map((b, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-cyan-500 font-mono-tech text-[10px] mt-[3px] shrink-0 w-4">
              {b.number ?? i + 1}.
            </span>
            <span className="text-slate-200 leading-relaxed">
              {renderInline(b.content, `nl-${key}-${i}`)}
            </span>
          </li>
        ))}
      </ol>
    );
    numberedBuffer = [];
  };

  blocks.forEach((block, idx) => {
    const key = `blk-${idx}`;

    // Flush pending lists when we hit a non-list block
    if (block.type !== 'bullet') flushBullets(`fb-${idx}`);
    if (block.type !== 'numbered') flushNumbered(`fn-${idx}`);

    switch (block.type) {
      case 'h1':
        elements.push(
          <h2
            key={key}
            className={`font-display-tech font-bold text-sm text-white tracking-wide border-b border-slate-600/60 ${
              compact ? 'pb-1 mt-2 mb-1' : 'pb-1.5 mt-3 mb-2'
            }`}
          >
            {renderInline(block.content, key)}
          </h2>
        );
        break;

      case 'h2':
        elements.push(
          <h3
            key={key}
            className={`font-display-tech font-semibold text-xs text-cyan-300 uppercase tracking-wider border-b border-slate-700/40 ${
              compact ? 'pb-0.5 mt-2 mb-1' : 'pb-1 mt-2.5 mb-1.5'
            }`}
          >
            {renderInline(block.content, key)}
          </h3>
        );
        break;

      case 'h3':
        elements.push(
          <h4
            key={key}
            className={`font-semibold text-xs text-cyan-200 ${
              compact ? 'mt-2 mb-0.5' : 'mt-2.5 mb-1'
            }`}
          >
            {renderInline(block.content, key)}
          </h4>
        );
        break;

      case 'h4':
        elements.push(
          <h5
            key={key}
            className={`font-medium text-[11px] text-slate-300 ${
              compact ? 'mt-1.5 mb-0.5' : 'mt-2 mb-1'
            }`}
          >
            {renderInline(block.content, key)}
          </h5>
        );
        break;

      case 'bullet':
        bulletBuffer.push(block);
        break;

      case 'numbered':
        numberedBuffer.push(block);
        break;

      case 'hr':
        elements.push(
          <hr key={key} className="border-slate-700/60 my-2" />
        );
        break;

      case 'empty':
        // Collapse consecutive empties — only add spacing once
        if (elements.length > 0) {
          const last = elements[elements.length - 1];
          // Don't push multiple spacers in a row
          if (
            React.isValidElement(last) &&
            (last as React.ReactElement<{ className?: string }>).props?.className?.includes('md-spacer')
          ) {
            break;
          }
          elements.push(<div key={key} className="md-spacer h-1" />);
        }
        break;

      case 'p':
      default:
        elements.push(
          <p key={key} className="text-slate-200 leading-relaxed">
            {renderInline(block.content, key)}
          </p>
        );
        break;
    }
  });

  // Flush any trailing list buffers
  flushBullets('trail-b');
  flushNumbered('trail-n');

  return (
    <div className={`copilot-markdown space-y-0.5 text-[11px] ${compact ? '' : 'text-xs'}`}>
      {elements}
    </div>
  );
};
