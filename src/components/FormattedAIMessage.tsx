"use client";

import React from "react";

interface FormattedAIMessageProps {
  content: string;
  className?: string;
}

/**
 * Dọn dẹp và chuẩn hóa ký hiệu toán học / hóa học LaTeX thành ký tự Unicode trực quan
 */
export function cleanLatexSymbols(math: string): string {
  if (!math) return "";

  let res = math
    // Loại bỏ các thẻ bao ngoài nếu còn sót
    .replace(/^\\\[\s*/, "")
    .replace(/\s*\\\]$/, "")
    .replace(/^\\\(\s*/, "")
    .replace(/\s*\\\)$/, "")
    // Mũi tên & suy ra
    .replace(/\\Longrightarrow/g, " ⟹ ")
    .replace(/\\longrightarrow/g, " ⟶ ")
    .replace(/\\rightarrow/g, " → ")
    .replace(/\\leftarrow/g, " ← ")
    .replace(/\\Leftrightarrow/g, " ⟺ ")
    // Phép tính
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
    // Căn thức & Phân số
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt/g, "√")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    // Khối text & vector
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\vec\{([^}]+)\}/g, "$1⃗")
    // Khoảng trắng LaTeX
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\quad/g, "   ")
    .replace(/\\uparrow/g, "↑")
    .replace(/\\downarrow/g, "↓")
    .replace(/\\\\/g, "\n")
    // Số mũ Unicode: ^{0} -> ⁰, ^{2} -> ², v.v.
    .replace(/\^\{?0\}?/g, "⁰")
    .replace(/\^\{?1\}?/g, "¹")
    .replace(/\^\{?2\}?/g, "²")
    .replace(/\^\{?3\}?/g, "³")
    .replace(/\^\{?4\}?/g, "⁴")
    .replace(/\^\{?5\}?/g, "⁵")
    .replace(/\^\{?6\}?/g, "⁶")
    .replace(/\^\{?7\}?/g, "⁷")
    .replace(/\^\{?8\}?/g, "⁸")
    .replace(/\^\{?9\}?/g, "⁹")
    .replace(/\^\{?n\}?/g, "ⁿ")
    .replace(/\^\{?x\}?/g, "ˣ")
    .replace(/\^\{([^}]+)\}/g, "^($1)")
    // Chỉ số dưới Unicode: _{0} -> ₀, _{2} -> ₂, v.v.
    .replace(/_\{?0\}?/g, "₀")
    .replace(/_\{?1\}?/g, "₁")
    .replace(/_\{?2\}?/g, "₂")
    .replace(/_\{?3\}?/g, "₃")
    .replace(/_\{?4\}?/g, "₄")
    .replace(/_\{?5\}?/g, "₅")
    .replace(/_\{?6\}?/g, "₆")
    .replace(/_\{?7\}?/g, "₇")
    .replace(/_\{?8\}?/g, "₈")
    .replace(/_\{?9\}?/g, "₉")
    .replace(/_\{([a-zA-Z0-9]+)\}/g, "_$1");

  // Giãn cách đều cho các toán tử = + - nếu dính liền (VD: c²=a²+b² -> c² = a² + b²)
  res = res
    .replace(/([a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ₀₁₂₃₄₅₆₇₈₉\)])=([a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ₀₁₂₃₄₅₆₇₈₉\(])/g, "$1 = $2")
    .replace(/([a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ₀₁₂₃₄₅₆₇₈₉\)])\+([a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ₀₁₂₃₄₅₆₇₈₉\(])/g, "$1 + $2");

  return res.trim();
}

/**
 * Phân tích và render các phần tử nội tuyến:
 * - **chữ in đậm**: font-bold text-white (nổi bật, rõ nét)
 * - `mã/công thức`: phông monospace, viền nhẹ
 * - *chữ nghiêng*: text-slate-300 italic
 * - \(...\) hoặc $...$ hoặc \[...\]: công thức toán gọn gàng
 */
function renderInlineContent(text: string): React.ReactNode[] {
  // Regex bắt: **in đậm**, `mã`, $toán$, \(toán latex\), \[toán khối nội tuyến\], *in nghiêng*
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\*[^*]+\*)/g;
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

    // 3. Công thức toán học $...$, \(...\) hoặc \[...\]
    if (
      (part.startsWith("$") && part.endsWith("$") && part.length >= 2) ||
      (part.startsWith("\\(") && part.endsWith("\\)") && part.length >= 4) ||
      (part.startsWith("\\[") && part.endsWith("\\]") && part.length >= 4)
    ) {
      let mathRaw = part;
      if (part.startsWith("\\(")) mathRaw = part.slice(2, -2);
      else if (part.startsWith("\\[")) mathRaw = part.slice(2, -2);
      else if (part.startsWith("$")) mathRaw = part.slice(1, -1);

      const mathCleaned = cleanLatexSymbols(mathRaw);

      return (
        <span
          key={index}
          className="mx-0.5 px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30 text-indigo-200 font-mono text-[11px] font-medium inline-block shadow-sm"
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

  let inMathBlock = false;
  let mathBlockBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // ─── 1. XỬ LÝ KHỐI TOÁN MULTILINE (\[ ... \] hoặc $$ ... $$) ───
    if (!inCodeBlock) {
      // Mở khối toán nhiều dòng
      if (trimmed === "\\[" || trimmed === "$$") {
        inMathBlock = true;
        mathBlockBuffer = [];
        continue;
      }

      // Đang trong khối toán nhiều dòng
      if (inMathBlock) {
        if (trimmed === "\\]" || trimmed === "$$") {
          const formula = cleanLatexSymbols(mathBlockBuffer.join(" "));
          renderedElements.push(
            <div
              key={`math-multiline-${i}`}
              className="my-2 py-2 px-3 rounded-xl bg-slate-950/85 border border-indigo-500/30 text-sky-200 font-mono text-[12px] font-medium text-center overflow-x-auto tracking-wider shadow-inner"
            >
              {formula}
            </div>
          );
          inMathBlock = false;
          mathBlockBuffer = [];
        } else {
          mathBlockBuffer.push(trimmed);
        }
        continue;
      }

      // Khối toán 1 dòng hoàn chỉnh: \[ ... \] hoặc $$ ... $$
      if (
        (trimmed.startsWith("\\[") && trimmed.endsWith("\\]") && trimmed.length >= 4) ||
        (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length >= 4)
      ) {
        const raw = trimmed.replace(/^(\\\[|\$\$)/, "").replace(/(\\\]|\$\$)$/, "");
        const formula = cleanLatexSymbols(raw);
        renderedElements.push(
          <div
            key={`math-single-${i}`}
            className="my-2 py-2 px-3 rounded-xl bg-slate-950/85 border border-indigo-500/30 text-sky-200 font-mono text-[12px] font-medium text-center overflow-x-auto tracking-wider shadow-inner"
          >
            {formula}
          </div>
        );
        continue;
      }
    }

    // ─── 2. XỬ LÝ KHỐI MÃ (CODE BLOCK ```) ───
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

    // ─── 3. DÒNG TRỐNG & PHÂN CÁCH ───
    if (!trimmed) {
      renderedElements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      renderedElements.push(
        <hr key={`hr-${i}`} className="my-2 border-slate-700/60" />
      );
      continue;
    }

    // ─── 4. TIÊU ĐỀ (# / ## / ###) ───
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

    // ─── 5. TRÍCH DẪN (> ...) ───
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

    // ─── 6. DANH SÁCH (- hoặc * hoặc số) ───
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

    // ─── 7. DÒNG BẮT ĐẦU BẰNG $$ HOẶC CÔNG THỨC DỞ DANG ───
    if (trimmed.startsWith("$$")) {
      const cleaned = cleanLatexSymbols(trimmed.replace(/^\$\$/, "").replace(/\$\$$/, ""));
      if (cleaned) {
        renderedElements.push(
          <div
            key={`math-raw-${i}`}
            className="my-1.5 py-1.5 px-2.5 rounded-xl bg-slate-950/85 border border-indigo-500/30 text-sky-200 font-mono text-[12px] font-medium text-center overflow-x-auto tracking-wider shadow-inner"
          >
            {cleaned}
          </div>
        );
        continue;
      }
    }

    // ─── 8. ĐOẠN VĂN THÔNG THƯỜNG ───
    renderedElements.push(
      <p key={`p-${i}`} className="leading-relaxed text-slate-200/90 my-1 font-normal">
        {renderInlineContent(trimmed)}
      </p>
    );
  }

  // Khối toán chưa đóng
  if (inMathBlock && mathBlockBuffer.length > 0) {
    const formula = cleanLatexSymbols(mathBlockBuffer.join(" "));
    renderedElements.push(
      <div
        key="math-multiline-end"
        className="my-2 py-2 px-3 rounded-xl bg-slate-950/85 border border-indigo-500/30 text-sky-200 font-mono text-[12px] font-medium text-center overflow-x-auto tracking-wider shadow-inner"
      >
        {formula}
      </div>
    );
  }

  // Khối mã chưa đóng
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
