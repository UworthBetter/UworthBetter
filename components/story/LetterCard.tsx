"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Icon } from "@/components/ui/Icon";

export function LetterCard({
  markdown,
  from,
  kicker = "她给你写了第一封信",
  defaultOpen = false,
}: {
  markdown: string;
  from?: string;
  kicker?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const alreadySigned = Boolean(from && markdown.includes(from)) || /——/.test(markdown);
  const body = from && markdown && !alreadySigned ? `${markdown}\n\n—— ${from}` : markdown;
  return (
    <div className={`fold-card${open ? " open" : ""}`}>
      <button type="button" className="fold-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="label"><Icon name="mail" />{kicker}</span>
        <Icon name="chevron-down" className="chev" />
      </button>
      {open ? (
        <div className="fold-body">
          <div className="letter-card">
            {body ? <ReactMarkdown>{body}</ReactMarkdown> : <p className="faint">信还在路上。</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
