"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/storage";

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
      text: "Xin chào! Mình là Trợ lý AI SimLab Edu. Bạn có thể hỏi mình về bài học, hiện tượng thí nghiệm, định luật SGK GDPT 2018 hoặc hướng dẫn sử dụng phòng lab nhé!",
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
      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply,
            sourceBook: data.sgkReferences?.[0]?.sourceBook,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        if (!isOpen) setUnreadAlert(true);
      } else {
        throw new Error(data.error || "Lỗi phản hồi");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Hiện chưa thể kết nối tới mô hình Groq. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.",
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
        <div className="w-[330px] sm:w-[370px] h-[480px] bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col mb-3 overflow-hidden animate-fade-in text-slate-100">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <span className="text-sm">🤖</span>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Trợ Lý AI SimLab</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                    SGK 2018
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Trực tuyến • Phản hồi ngay lập tức</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
              title="Thu nhỏ"
            >
              ✕
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
                  className={`max-w-[88%] p-3 rounded-2xl shadow-sm ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.sourceBook && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 text-[10px] text-amber-300 font-medium flex items-center gap-1">
                      <span>📖</span>
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
                <span className="text-[11px] text-slate-400">AI đang tra cứu SGK...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh (Quick Prompts) */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSendMessage("Hiện tượng Cu tác dụng HNO3 đặc theo SGK Hóa 11 là gì?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] transition-colors"
            >
              🧪 Phản ứng Cu + HNO₃
            </button>
            <button
              onClick={() => handleSendMessage("Quy tắc pha loãng axit H2SO4 an toàn?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] transition-colors"
            >
              ⚠️ An toàn pha axit H₂SO₄
            </button>
            <button
              onClick={() => handleSendMessage("Dấu hiệu nhận biết kết tủa BaSO4?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] transition-colors"
            >
              📘 Nhận biết kết tủa BaSO₄
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
              placeholder="Nhập câu hỏi cho AI..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center shrink-0"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      {/* ─── NÚT TRÒN HỎI ĐÁP NỔI Ở GÓC MÀN HÌNH ─── */}
      <button
        type="button"
        id="global-ai-chat-btn"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setUnreadAlert(false);
        }}
        aria-label="Mở Trợ lý ảo AI SimLab"
        className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white/25 focus:outline-none cursor-pointer"
      >
        {/* Biểu tượng bong bóng chat hoặc robot */}
        <span className="text-2xl transition-transform group-hover:scale-110 pointer-events-none">
          {isOpen ? "✕" : "💬"}
        </span>

        {/* Chấm tròn thông báo nhấp nháy */}
        {unreadAlert && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-900 animate-ping" />
        )}
        {unreadAlert && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-900" />
        )}

        {/* Tooltip khi rê chuột */}
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          Hỏi đáp AI SimLab • SGK 2018 ✨
        </span>
      </button>
    </aside>
  );
}
