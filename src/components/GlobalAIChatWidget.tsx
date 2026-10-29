"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/storage";
import { FormattedAIMessage } from "./FormattedAIMessage";
import { Sparkles, X, Send, FlaskConical, Compass, Zap, BookOpen, Dna, ShieldAlert, AlertTriangle } from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  sourceBook?: string;
  time: string;
}

export default function GlobalAIChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Xin chào! Mình là Trợ lý AI SimLab Edu. Bạn có thể hỏi mình mọi câu hỏi về **Toán học, Vật lý, Hóa học, Sinh học, Ngữ văn** (chuẩn GDPT 2018) hoặc hướng dẫn thực hành thí nghiệm nhé!",
      time: "Vừa xong",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadAlert, setUnreadAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Không hiển thị trên /lab vì /lab đã có widget chuyên sâu theo dõi nồng độ và ống nghiệm
  const isLabPage = pathname === "/lab";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (isLabPage) return null;

  const handleSendMessage = async (customText?: string) => {
    const q = customText || inputQuery.trim();
    if (!q || isLoading) return;

    const currentTime = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Luôn hiển thị bong bóng tin nhắn của học sinh (cả khi gõ và khi bấm câu gợi ý)
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: q, time: currentTime },
    ]);
    if (!customText) {
      setInputQuery("");
    }

    setIsLoading(true);

    try {
      const user = getCurrentUser();
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          labContext: {
            userRole: user?.role || "student",
            userName: user?.name || "Học sinh",
            currentPage: pathname,
          },
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      const aiReplyTime = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply,
            sourceBook: data.sgkReferences?.[0]?.sourceBook,
            time: aiReplyTime,
          },
        ]);
        if (!isOpen) {
          setUnreadAlert(true);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Xin lỗi, hiện tại hệ thống AI đang bận. Bạn vui lòng thử lại sau giây lát nhé!",
            time: aiReplyTime,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Hiện chưa thể kết nối tới trợ lý AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.",
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside aria-label="Hộp thoại hỏi đáp AI" className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
      {/* ─── HỘP THƯ NHỎ (CHAT BOX POPUP) ─── */}
      {isOpen && (
        <div className="w-[340px] sm:w-[410px] h-[520px] bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col mb-3 overflow-hidden animate-fade-in text-slate-100">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Trợ Lý AI SimLab</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                    Đa môn • GDPT 2018
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Toán • Lý • Hóa • Sinh • Văn • Phản hồi ngay</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
              title="Thu nhỏ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Vùng tin nhắn */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-2xl shadow-sm ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {m.sender === "user" ? (
                    <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                  ) : (
                    <FormattedAIMessage content={m.text} />
                  )}
                  {m.sourceBook && (
                    <div className="mt-2 pt-1.5 border-t border-slate-700/50 text-[10px] text-amber-300 font-semibold flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{m.sourceBook}</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-400">AI đang tra cứu SGK & suy luận...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh (Quick Prompts Đa môn) */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSendMessage("Hiện tượng Cu tác dụng HNO3 đặc theo SGK Hóa 11 là gì?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <FlaskConical className="w-3 h-3 text-blue-400" />
              <span>Cu + HNO₃</span>
            </button>
            <button
              onClick={() => handleSendMessage("Định lý Pythagoras là gì và cho ví dụ áp dụng?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>Định lý Pythagoras</span>
            </button>
            <button
              onClick={() => handleSendMessage("Nội dung và ý nghĩa của Định luật 2 Newton?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-violet-400" />
              <span>Định luật 2 Newton</span>
            </button>
            <button
              onClick={() => handleSendMessage("Phân tích hình tượng người lính trong bài thơ Tây Tiến của Quang Dũng?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <BookOpen className="w-3 h-3 text-rose-400" />
              <span>Thơ Tây Tiến</span>
            </button>
            <button
              onClick={() => handleSendMessage("Giải thích quá trình quang hợp pha sáng và pha tối ở thực vật?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <Dna className="w-3 h-3 text-teal-400" />
              <span>Quang hợp</span>
            </button>
            <button
              onClick={() => handleSendMessage("Quy tắc pha loãng axit H2SO4 an toàn?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>An toàn H₂SO₄</span>
            </button>
          </div>

          {/* Form nhập tin nhắn */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Hỏi AI về Toán, Lý, Hóa, Sinh, Văn..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center shrink-0 gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      )}

      {/* ─── NÚT TRÒN NỔI GÓC MÀN HÌNH (FLOATING ACTION BUTTON) ─── */}
      <button
        id="global-ai-chat-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadAlert(false);
        }}
        aria-label="Mở Trợ Lý AI SimLab"
        className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
      >
        <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
        </div>

        {/* Chấm thông báo có tin mới */}
        {unreadAlert && !isOpen && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-900" />
          </span>
        )}

        {/* Tooltip khi rê chuột */}
        {!isOpen && (
          <span className="absolute right-16 px-2.5 py-1 rounded-lg bg-slate-900/95 border border-slate-700 text-slate-200 text-xs whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Trợ lý AI SimLab (Toán • Lý • Hóa • Sinh • Văn)
          </span>
        )}
      </button>
    </aside>
  );
}
