"use client";

import React from "react";

interface FormattedAIMessageProps {
  content: string;
  className?: string;
}

/**
 * Chuyển đổi các ký hiệu LaTeX thông dụng thành ký tự Unicode trực quan
 */
function cleanLatexSymbols(math: string): string {
  return math
    .replace(/\\Longrightarrow/g, " ⟹ ")
    .replace(/\\longrightarrow/g, " ⟶ ")
    .replace(/\\rightarrow/g, " → ")
    .replace(/\\leftarrow/g, " ← ")
    .replace(/\\Leftrightarrow/g, " ⟺ ")
    .replace(/\\cdot/g, " · ")
    .replace(/\\times/g, " × ")
    .replace(/\\div/g, " ÷ ")
    .replace(/\\pm/g, " ± ")
    .replace(/\\approx/g, " ≈ ")
    .replace(/\\neq/g, " ≠ ")
    .replace(/\\leq/g, " ≤ ")
    .replace(/\\geq/g, " ≥ ")
    .replace(/\\le/g, " ≤ ")
    .replace(/\\ge/g, " ≥ ")
    .replace(/\\infty/g, " ∞ ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\pi/g, "π")
    .replace(/\\degree|\^\\circ/g, "°")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt/g, "√")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\vec\{([^}]+)\}/g, "$1⃗")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\quad/g, "   ")
    .replace(/\\uparrow/g, "↑")
    .replace(/\\downarrow/g, "↓")
    .replace(/\\\\/g, "\n");
}

/**
 * Phân tích và render các phần tử nội tuyến:
 * - **chữ in đậm**: font-bold text-white (nổi bật, rõ nét)
 * - `mã/công thức`: phông monospace, viền nhẹ
 * - *chữ nghiêng*: text-slate-300 italic
 * - chữ thường: text-slate-200/90 font-normal (độ tương phản êm mắt)
 */
function renderInlineContent(text: string): React.ReactNode[] {
  // Regex bắt: **in đậm**, `mã`, $toán$, \(toán latex\), *in nghiêng*
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$|\\\([^\\]+\\\)|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Chữ in đậm **...**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-white tracking-wide">
          {boldText}
        </strong>
      );
    }

    // 2. Mã nội tuyến hoặc công thức `...`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="mx-0.5 px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-500/30 text-sky-300 font-mono text-[11px]"
        >
          {cleanLatexSymbols(codeText)}
        </code>
      );
    }

    // 3. Công thức toán học $...$ hoặc \(...\)
    if (
      (part.startsWith("$") && part.endsWith("$") && part.length >= 2) ||
      (part.startsWith("\\(") && part.endsWith("\\)") && part.length >= 4)
    ) {
      const mathRaw = part.startsWith("\\(")
        ? part.slice(2, -2)
        : part.slice(1, -1);
      const mathCleaned = cleanLatexSymbols(mathRaw);

      return (
        <span
          key={index}
          className="mx-0.5 px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30 text-indigo-200 font-mono text-[11px] font-medium"
        >
          {mathCleaned}
        </span>
      );
    }

    // 4. Chữ in nghiêng *...*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const italicText = part.slice(1, -1);
      return (
        <em key={index} className="italic text-slate-300">
          {italicText}
        </em>
      );
    }

    // 5. Chữ thường
    return <span key={index}>{part}</span>;
  });
}

export function FormattedAIMessage({ content, className = "" }: FormattedAIMessageProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Khối mã (Code block ```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre
            key={`code-${i}`}
            className="my-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 font-mono text-[11px] overflow-x-auto leading-normal"
          >
            <code>{codeBlockBuffer.join("\n")}</code>
          </pre>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine);
      continue;
    }

    // Dòng trống
    if (!trimmed) {
      renderedElements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    // Đường kẻ phân cách (---)
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      renderedElements.push(
        <hr key={`hr-${i}`} className="my-2 border-slate-700/60" />
      );
      continue;
    }

    // Tiêu đề cấp 1 hoặc 2 (# hoặc ##)
    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      const headingText = trimmed.replace(/^#+\s*/, "");
      renderedElements.push(
        <h3
          key={`h2-${i}`}
          className="text-xs font-bold text-sky-300 mt-2.5 mb-1 flex items-center gap-1.5 tracking-wide border-b border-slate-700/40 pb-1"
        >
          {renderInlineContent(headingText)}
        </h3>
      );
      continue;
    }

    // Tiêu đề cấp 3 hoặc 4 (### hoặc ####)
    if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
      const headingText = trimmed.replace(/^#+\s*/, "");
      renderedElements.push(
        <h4
          key={`h3-${i}`}
          className="text-xs font-bold text-indigo-300 mt-2 mb-1 flex items-center gap-1"
        >
          {renderInlineContent(headingText)}
        </h4>
      );
      continue;
    }

    // Khối trích dẫn / lưu ý (> ...)
    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.slice(2);
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-1.5 pl-2.5 py-1.5 border-l-2 border-amber-400 bg-amber-500/10 text-amber-200/90 rounded-r-lg text-[11px] leading-relaxed"
        >
          {renderInlineContent(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Gạch đầu dòng (- hoặc *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.slice(2);
      renderedElements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-1.5 my-1 text-slate-200/95 pl-1">
          <span className="text-blue-400 font-bold shrink-0 leading-tight">•</span>
          <div className="flex-1 leading-relaxed">{renderInlineContent(itemText)}</div>
        </div>
      );
      continue;
    }

    // Danh sách số (1. hoặc 2. hoặc [1] hoặc 1/)
    const numberMatch = trimmed.match(/^(\d+[\.\)])\s*(.*)$/);
    if (numberMatch) {
      const numLabel = numberMatch[1];
      const itemText = numberMatch[2];
      renderedElements.push(
        <div key={`num-${i}`} className="flex items-start gap-1.5 my-1 text-slate-200/95 pl-1">
          <span className="font-bold text-sky-400 shrink-0 text-[10px] leading-tight bg-sky-500/15 px-1 py-0.5 rounded border border-sky-500/30">
            {numLabel}
          </span>
          <div className="flex-1 leading-relaxed">{renderInlineContent(itemText)}</div>
        </div>
      );
      continue;
    }

    // Công thức toán học / hóa học dạng khối ($$ ... $$ hoặc \[ ... \])
    if (
      (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length >= 4) ||
      (trimmed.startsWith("\\[") && trimmed.endsWith("\\]") && trimmed.length >= 4)
    ) {
      const mathRaw = trimmed.startsWith("\\[")
        ? trimmed.slice(2, -2).trim()
        : trimmed.slice(2, -2).trim();
      const mathFormula = cleanLatexSymbols(mathRaw);

      return (
        <div
          key={`math-block-${i}`}
          className="my-2 py-1.5 px-2.5 rounded-xl bg-slate-950/80 border border-blue-500/25 text-sky-200 font-mono text-[11px] text-center overflow-x-auto tracking-wide shadow-inner whitespace-pre-wrap"
        >
          {mathFormula}
        </div>
      );
    }

    // Đoạn văn bản thông thường
    renderedElements.push(
      <p key={`p-${i}`} className="leading-relaxed text-slate-200/90 my-1 font-normal">
        {renderInlineContent(trimmed)}
      </p>
    );
  }

  // Xử lý nốt nếu còn code block chưa đóng
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    renderedElements.push(
      <pre
        key="code-remaining"
        className="my-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 font-mono text-[11px] overflow-x-auto leading-normal"
      >
        <code>{codeBlockBuffer.join("\n")}</code>
      </pre>
    );
  }

  return <div className={`space-y-0.5 text-xs ${className}`}>{renderedElements}</div>;
}
