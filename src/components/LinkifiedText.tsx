'use client';

import type { MouseEvent, ReactNode } from 'react';

type LinkifiedTextProps = {
  text: string;
  className?: string;
};

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+/gi;
const TRAILING_PUNCT = /[.,!?)]+$/;

function parseLinks(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_PATTERN.lastIndex = 0;
  while ((match = URL_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    let url = match[0];
    let trailingPunct = '';
    const punctMatch = TRAILING_PUNCT.exec(url);
    if (punctMatch) {
      trailingPunct = punctMatch[0];
      url = url.slice(0, -trailingPunct.length);
    }

    const href = url.startsWith('www.') ? `https://${url}` : url;

    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="linkified-link"
        style={{ color: '#2563eb', textDecoration: 'underline' }}
        onClick={handleLinkClick}
      >
        {url}
      </a>,
    );

    if (trailingPunct) {
      parts.push(trailingPunct);
    }

    lastIndex = URL_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function handleLinkClick(e: MouseEvent<HTMLAnchorElement>) {
  e.stopPropagation();
}

export default function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const parts = parseLinks(text);

  return (
    <>
      <style>{`
        a.linkified-link:hover,
        a.linkified-link:visited:hover {
          color: #1d4ed8;
        }
        a.linkified-link:visited {
          color: #2563eb;
        }
        a.linkified-link:focus {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      `}</style>
      <span className={className}>{parts}</span>
    </>
  );
}
