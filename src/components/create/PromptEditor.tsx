"use client";

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptTag } from "@/lib/prompt";

export interface PromptEditorRef {
  insertTag: (tag: PromptTag) => string | null;
}

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  tags?: PromptTag[];
  onRemoveTag?: (tagId: string) => void;
}

const TAG_PLACEHOLDER_REGEX = /\{\{(fragment|template|product):([^}]+)\}\}/g;
const TAG_ATTR_REGEX = /{{(fragment|template|product):([^}]+)}}/g;

export function encodeTag(tag: PromptTag): string {
  return `{{${tag.type}:${tag.id}|${tag.name}}}`;
}

export function encodeTagId(tag: PromptTag): string {
  return `{{${tag.type}:${tag.id}}}`;
}

function decodeTag(placeholder: string): { type: string; id: string; name: string } | null {
  const m = placeholder.match(/^\{\{(fragment|template|product):([^}|]+)\|([^}]+)\}\}$/);
  if (!m) {
    const m2 = placeholder.match(/^\{\{(fragment|template|product):([^}]+)\}\}$/);
    if (!m2) return null;
    return { type: m2[1], id: m2[2], name: m2[2] };
  }
  return { type: m[1], id: m[2], name: m[3] };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
}

function getRawContent(el: HTMLElement): string {
  let text = "";
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = (node as Text).parentElement;
      if (parent && parent.classList.contains("prompt-tag-hidden")) {
        continue;
      }
      text += node.textContent || "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset && el.dataset.tag) {
        text += el.dataset.tag;
      } else if (el.tagName === "BR") {
        text += "\n";
      } else if (el.tagName === "DIV" || el.tagName === "P") {
        if (text && !text.endsWith("\n")) text += "\n";
      }
    }
  }
  return text;
}

export function renderPromptContent(content: string): string {
  const regex = /\{\{(fragment|template|product):([^}|]+)\|([^}]+)\}\}|\{\{(fragment|template|product):([^}]+)\}\}/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(content.slice(lastIndex, match.index)));
    }

    const type = match[1] || match[4];
    const id = match[2] || match[5];
    const name = match[3] !== undefined ? match[3] : match[5];

    parts.push(
      `<span contenteditable="false" class="prompt-tag-hidden" data-tag="{{${type}:${escapeHtml(id)}|${escapeHtml(name)}}}">\u200B</span>`
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(escapeHtml(content.slice(lastIndex)));
  }

  return parts.join("");
}

export function extractTags(content: string): PromptTag[] {
  const tags: PromptTag[] = [];
  const seen = new Set<string>();
  content.replace(/\{\{(fragment|template|product):([^}|]+)\|([^}]+)\}\}/g, (_, type, id, name) => {
    const key = `${type}:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      tags.push({ id, type, name, prompt: "" });
    }
    return "";
  });
  content.replace(/\{\{(fragment|template|product):([^}]+)\}\}/g, (match, type, id) => {
    if (match.includes("|")) return "";
    const key = `${type}:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      tags.push({ id, type, name: id, prompt: "" });
    }
    return "";
  });
  return tags;
}

export function removeTag(content: string, tagId: string): string {
  return content.replace(
    new RegExp(`\\{\\{(fragment|template|product):${escapeRegExp(tagId)}\\|[^}]+\\}\\}`, "g"),
    ""
  ).replace(
    new RegExp(`\\{\\{(fragment|template|product):${escapeRegExp(tagId)}\\}\\}`, "g"),
    ""
  ).replace(/\s+/g, " ").trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PromptEditor = forwardRef<PromptEditorRef, PromptEditorProps>(function PromptEditor(
  { value, onChange, disabled, tags = [], onRemoveTag },
  ref
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalChange.current) return;
    const raw = getRawContent(el);
    if (raw !== value) {
      el.innerHTML = renderPromptContent(value) || "";
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    const raw = getRawContent(el);
    onChange(raw);
    requestAnimationFrame(() => {
      isInternalChange.current = false;
    });
  }, [onChange]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        document.execCommand("insertText", false, "\n");
      }
    },
    [disabled]
  );

  useImperativeHandle(ref, () => ({
    insertTag(tag: PromptTag) {
      const el = editorRef.current;
      if (!el) return null;
      const result = insertTagIntoEditor(el, tag);
      if (result !== null) {
        isInternalChange.current = true;
        onChange(result);
        requestAnimationFrame(() => {
          isInternalChange.current = false;
        });
      }
      return result;
    },
  }));

  return (
    <div className="relative">
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={`${tag.type}:${tag.id}`}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium border",
                tag.type === "product" && "bg-sky-50 text-sky-700 border-sky-200",
                tag.type === "template" && "bg-amber-50 text-amber-700 border-amber-200",
                tag.type === "fragment" && "bg-indigo-50 text-indigo-700 border-indigo-200"
              )}
            >
              {tag.name}
              {onRemoveTag && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onRemoveTag(tag.id);
                  }}
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm hover:bg-black/10 transition-colors cursor-pointer"
                  title="移除"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-[110px] text-[12px] bg-[#F5F6F8] border-0 rounded-xl resize-none p-3 outline-none",
          "placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.6,
        }}
        data-placeholder="自由输入背景描述，或从模板库中选择"
      />

      <style jsx>{`
        .prompt-tag-hidden {
          display: inline;
          font-size: 0;
          opacity: 0;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
        }
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
});

export default PromptEditor;

export function insertTagIntoEditor(
  el: HTMLElement,
  tag: PromptTag
): string | null {
  const sel = window.getSelection();
  let range: Range;

  if (!sel || sel.rangeCount === 0) {
    range = document.createRange();
    if (el.lastChild) {
      range.setStartAfter(el.lastChild);
    } else {
      range.setStart(el, 0);
    }
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
  } else {
    range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      if (el.lastChild) {
        range.setStartAfter(el.lastChild);
      } else {
        range.setStart(el, 0);
      }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  const tagHtml = `<span contenteditable="false" class="prompt-tag-hidden" data-tag="{{${tag.type}:${escapeHtml(tag.id)}|${escapeHtml(tag.name)}}}">\u200B</span>`;

  const frag = range.createContextualFragment(tagHtml);
  range.deleteContents();
  range.insertNode(frag);

  const lastNode = frag.lastChild;
  if (lastNode && sel) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const toRemove: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || "";
    if (text.includes("\u200B")) {
      const txt = node as Text;
      const parent = txt.parentElement;
      if (parent && parent.classList.contains("prompt-tag-hidden")) {
        if (txt.textContent!.length > 1) {
          txt.textContent = "\u200B";
        }
        continue;
      }
      if (txt.textContent!.replace(/\u200B/g, "").length === 0) {
        const prev = txt.previousSibling;
        const next = txt.nextSibling;
        if (
          (prev && (prev as HTMLElement).classList?.contains("prompt-tag-hidden")) ||
          (next && (next as HTMLElement).classList?.contains("prompt-tag-hidden"))
        ) {
          if (txt.textContent!.length > 1) {
            txt.textContent = "\u200B";
          }
        } else if (txt.textContent!.length > 0) {
          toRemove.push(txt);
        }
      }
    }
  }
  toRemove.forEach((n) => n.remove());

  return getRawContent(el);
}
