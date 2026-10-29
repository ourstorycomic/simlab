"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chemical } from "@/lib/chemicals";
import { ActiveReaction } from "./LabBench";
import { FormattedAIMessage } from "./FormattedAIMessage";
import { Sparkles, X, Send, BookOpen, FlaskConical, ShieldAlert, FileText, Bot } from "lucide-react";

interface LabAITutorWidgetProps {
  chemical1: Chemical | null;
  chemical2: Chemical | null;
  activeReaction: ActiveReaction | null;
  recentMistake?: string | null;
}

interface Message {
  sender: "user" | "ai";
  text: string;
  sourceBook?: string;
  isWarning?: boolean;
}

export default function LabAITutorWidget({
  chemical1,
  chemical2,
  activeReaction,
  recentMistake,
}: LabAITutorWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Xin chào! Mình là Trợ lý ảo AI Tutor SimLab Edu. Mình đang theo dõi các thông số thí nghiệm của bạn theo chuẩn SGK GDPT 2018. Hãy hỏi bất cứ điều gì hoặc làm thí nghiệm nhé!",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Tự động phát hiện cảnh báo nguy hiểm hoặc phản ứng mới
  useEffect(() => {
    if (recentMistake) {
      setHasAlert(true);
      handleAskAI(
        `Cảnh báo an toàn: Học sinh vừa thao tác sai: ${recentMistake}. Hãy giải thích nguyên nhân và quy tắc an toàn SGK.`
      );
    }
  }, [recentMistake]);

  // Tự động gợi ý khi phản ứng xảy ra
  useEffect(() => {
    if (activeReaction && !isOpen) {
      setHasAlert(true);
    }
  }, [activeReaction, isOpen]);

  const handleAskAI = async (customQuery?: string) => {
    const q = customQuery || inputQuery.trim();
    if (!q || isLoading) return;

    // Luôn hiển thị câu hỏi của học sinh trên giao diện chat
    setMessages((prev) => [...prev, { sender: "user", text: q }]);
    if (!customQuery) {
      setInputQuery("");
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          labContext: {
            chemical1: chemical1 ? { name: chemical1.name, formula: chemical1.formula } : null,
            chemical2: chemical2 ? { name: chemical2.name, formula: chemical2.formula } : null,
            reactionResult: activeReaction ? activeReaction.result : null,
            recentMistake: recentMistake || null,
          },
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply,
            sourceBook: data.sgkReferences?.[0]?.sourceBook,
            isWarning: data.reply.includes("⚠️") || data.reply.includes("CẢNH BÁO"),
          },
        ]);
      } else {
        throw new Error(data.error || "Không nhận được phản hồi");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Hiện chưa thể kết nối tới trợ lý AI. Vui lòng kiểm tra kết nối mạng hoặc biến môi trường GROQ_API_KEY.",
          isWarning: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside aria-label="Trợ lý ảo AI Tutor" className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* ─── HỘP THOẠI AI TUTOR (KHI MỞ) ─── */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[500px] bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col mb-3 overflow-hidden animate-fade-in text-slate-100">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4 text-blue-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>AI Tutor SimLab</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                    RAG SGK 2018
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Đọc ngữ cảnh thí nghiệm thời gian thực</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dải trạng thái ngữ cảnh hiện tại (Context-Aware Banner) */}
          <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-500">Ống nghiệm:</span>
              <span className="font-semibold text-blue-400 truncate">
                {chemical1 ? chemical1.formula : "Trống"} + {chemical2 ? chemical2.formula : "Trống"}
              </span>
            </div>
            {activeReaction && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Đang phản ứng
              </span>
            )}
          </div>

          {/* Vùng tin nhắn */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl shadow-sm ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : m.isWarning
                      ? "bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-bl-none"
                      : "bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {m.sender === "user" ? (
                    <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                  ) : (
                    <FormattedAIMessage content={m.text} />
                  )}
                  {m.sourceBook && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 text-[10px] text-amber-300/90 font-medium flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{m.sourceBook}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-400">AI đang tra cứu định luật SGK...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh (Quick Question Pills) */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleAskAI("Hiện tượng hóa học của phản ứng này là gì theo SGK?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <FlaskConical className="w-3 h-3 text-blue-400" />
              <span>Hiện tượng là gì?</span>
            </button>
            <button
              onClick={() => handleAskAI("Thao tác này có an toàn không, có nguy cơ bỏng hay trào hóa chất không?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>An toàn thí nghiệm?</span>
            </button>
            <button
              onClick={() => handleAskAI("Viết phương trình ion rút gọn và giải thích bản chất phản ứng.")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Phương trình & bản chất</span>
            </button>
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAI();
            }}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Hỏi AI về hiện tượng, phương trình..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center justify-center shrink-0 gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      )}

      {/* ─── NÚT TRÒN NỔI (FLOATING LAUNCHER BUTTON) ─── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasAlert(false);
        }}
        aria-label="Mở Trợ lý ảo AI Tutor"
        className="relative group w-13 h-13 p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/20"
      >
        <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          {isOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
        </div>
        {hasAlert && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-950 animate-bounce" />
        )}
        <span className="absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Trợ lý AI Tutor SGK 2018
        </span>
      </button>
    </aside>
  );
}
