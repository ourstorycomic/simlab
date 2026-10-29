"use client";

/**
 * ─── Lab3DAITutorVoice ───
 * Trợ lý Sư phạm Cô Giáo Mai AI Đa Nền Tảng (Voice & Push-to-Talk Gesture):
 * 1. Push-To-Talk bằng Cử Chỉ Tay:
 *    - Dơ ngón trỏ lên cao (☝️ Pointing / Giơ tay phát biểu) hoặc giơ ngón cái (👍) trước webcam:
 *      Hệ thống tự động kích hoạt Micro thu âm câu hỏi của học sinh!
 *    - Hạ tay xuống: Tự động gửi câu hỏi đến AI Tutor kèm toàn bộ ngữ cảnh thí nghiệm hiện tại.
 * 2. Push-To-Talk bằng Nút Bấm / Cảm Ứng:
 *    - Chạm giữ hoặc bấm nút Micro trên màn hình nếu không dùng webcam.
 * 3. Text-to-Speech (TTS) Tiếng Việt Tự Nhiên Giống Người Thật:
 *    - Tự động chọn voice tiếng Việt tự nhiên (HoaiMy Natural / Google tiếng Việt vi-VN).
 *    - Đồng bộ cử chỉ khẩu hình (Lip-Sync) và chớp mắt của Cô Giáo 3D.
 * 4. Ngữ cảnh Thí Nghiệm Sâu Sắc:
 *    - Tự động đính kèm chất đang có trên bàn, chất trong cốc trộn, hiện tượng sủi bọt/kết tủa/khói.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  GraduationCap,
  X,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

const Mic = MicIcon;
const MicOff = MicOffIcon;
import { Chemical } from "@/lib/chemicals";
import { ReactionResult } from "@/lib/reactions";
import { HandState } from "@/lib/handTracking";

interface Lab3DAITutorVoiceProps {
  subject: "chemistry" | "physics" | "biology";
  activeChemical?: Chemical | null;
  reactionBeakerChemical?: Chemical | null;
  reactionBeakerSolid?: Chemical | null;
  activeReaction?: ReactionResult | null;
  handStateRef?: React.MutableRefObject<HandState>;
  onTeacherModeChange?: (mode: "idle" | "speaking" | "warning" | "success" | "listening") => void;
  onTeacherMessageChange?: (msg: string) => void;
  show3DTeacher: boolean;
  onToggle3DTeacher: () => void;
}

export default function Lab3DAITutorVoice({
  subject,
  activeChemical,
  reactionBeakerChemical,
  reactionBeakerSolid,
  activeReaction,
  handStateRef,
  onTeacherModeChange,
  onTeacherMessageChange,
  show3DTeacher,
  onToggle3DTeacher,
}: Lab3DAITutorVoiceProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [teacherResponse, setTeacherResponse] = useState<string>(
    "Chào em! Cô là cô giáo Mai. Em có thể giơ ngón tay ☝️ hoặc giữ nút Micro để đặt câu hỏi về thí nghiệm nhé!"
  );
  const [inputQuery, setInputQuery] = useState("");

  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isGestureListeningRef = useRef(false);
  const gestureHoldTimerRef = useRef<number>(0);
  const lastGestureCheckRef = useRef<number>(0);

  // ─── 1. Khởi tạo Web Speech Recognition (Giọng nói Tiếng Việt vi-VN) ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "vi-VN";

      recognition.onstart = () => {
        setIsListening(true);
        if (onTeacherModeChange) onTeacherModeChange("listening");
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setInputQuery(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Lỗi nhận diện giọng nói:", event.error);
        setIsListening(false);
        if (onTeacherModeChange) onTeacherModeChange("idle");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTeacherModeChange]);

  // ─── 2. Phát âm thanh Giọng Nói Cô Giáo (Text-to-Speech Tiếng Việt) ───
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !voiceEnabled || !window.speechSynthesis) return;

      // Hủy giọng đọc cũ nếu đang phát
      window.speechSynthesis.cancel();

      // Làm sạch text để đọc mượt mà (bỏ ký tự markdown như ** # ---)
      const cleanText = text
        .replace(/[*#_`~>\[\]\(\)]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "vi-VN";
      utterance.rate = 0.98; // Tốc độ đĩnh đạc, rõ ràng
      utterance.pitch = 1.06; // Tông giọng nữ tươi vui, ấm áp

      // Chọn voice tiếng Việt tự nhiên nhất có sẵn trong hệ thống
      const voices = window.speechSynthesis.getVoices();
      const viVoice =
        voices.find(
          (v) =>
            v.lang.includes("vi") &&
            (v.name.includes("HoaiMy") ||
              v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("An"))
        ) || voices.find((v) => v.lang.includes("vi"));

      if (viVoice) {
        utterance.voice = viVoice;
      }

      utterance.onstart = () => {
        if (onTeacherModeChange) onTeacherModeChange("speaking");
      };

      utterance.onend = () => {
        if (onTeacherModeChange) onTeacherModeChange("idle");
      };

      utterance.onerror = () => {
        if (onTeacherModeChange) onTeacherModeChange("idle");
      };

      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, onTeacherModeChange]
  );

  // ─── 3. Gửi câu hỏi đến AI Tutor kèm Toàn Bộ Ngữ Cảnh Thí Nghiệm ───
  const handleAskAITutor = useCallback(
    async (queryText: string) => {
      const q = queryText.trim();
      if (!q) return;

      setIsThinking(true);
      if (onTeacherModeChange) onTeacherModeChange("listening");

      // Xây dựng ngữ cảnh phòng thí nghiệm chi tiết
      const labContext: any = {
        subject,
      };

      if (subject === "chemistry") {
        labContext.chemical1 = activeChemical
          ? {
              name: activeChemical.name,
              formula: activeChemical.formula,
              state: activeChemical.state,
            }
          : null;
        labContext.chemical2 = reactionBeakerChemical
          ? {
              name: reactionBeakerChemical.name,
              formula: reactionBeakerChemical.formula,
              state: reactionBeakerChemical.state,
            }
          : reactionBeakerSolid
          ? {
              name: reactionBeakerSolid.name,
              formula: reactionBeakerSolid.formula,
              state: "solid",
            }
          : null;

        if (activeReaction) {
          labContext.reactionResult = {
            equation: activeReaction.equation,
            description: activeReaction.description,
            type: activeReaction.type,
          };
        }
      }

      try {
        const res = await fetch("/api/ai/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            labContext,
            isVoice: true,
          }),
        });

        const data = await res.json();
        const answerText = data.reply || data.answer;
        if (answerText) {
          setTeacherResponse(answerText);
          if (onTeacherMessageChange) onTeacherMessageChange(answerText);
          speakText(answerText);
        } else {
          const fallbackAns = "Cô đã nhận được câu hỏi. Em hãy thử rót hoặc trộn chất để quan sát hiện tượng nhé!";
          setTeacherResponse(fallbackAns);
          speakText(fallbackAns);
        }
      } catch (e) {
        console.error("Lỗi hỏi Cô giáo AI:", e);
        const errAns = "Đường truyền mạng hơi bận một chút, em hỏi lại cô nhé!";
        setTeacherResponse(errAns);
        speakText(errAns);
      } finally {
        setIsThinking(false);
        setInputQuery("");
        setTranscript("");
      }
    },
    [
      subject,
      activeChemical,
      reactionBeakerChemical,
      reactionBeakerSolid,
      activeReaction,
      onTeacherModeChange,
      onTeacherMessageChange,
      speakText,
    ]
  );

  // ─── 4. Cử chỉ Giơ Ngón Tay Push-To-Talk (☝️ Pointing Up hoặc 👍 Thumbs Up) ───
  useEffect(() => {
    let animId: number;

    const checkHandGesture = () => {
      const now = performance.now();
      if (now - lastGestureCheckRef.current > 100) {
        lastGestureCheckRef.current = now;

        if (handStateRef?.current) {
          const hs = handStateRef.current;
          const hand = hs.rightHand?.detected
            ? hs.rightHand
            : hs.leftHand?.detected
            ? hs.leftHand
            : hs.detected
            ? hs
            : null;

          if (hand && hand.detected && hand.landmarks && hand.landmarks.length >= 21) {
            const lm = hand.landmarks;
            const wrist = lm[0];
            const indexTip = lm[8];
            const thumbTip = lm[4];

            // Giơ ngón trỏ lên cao (y của đầu ngón trỏ cao hơn cổ tay đáng kể)
            const isPointingUp = indexTip.y < wrist.y - 0.22 && hand.isIndexExtended;
            // Hoặc giơ ngón cái lên (Thumbs Up)
            const isThumbUp = thumbTip.y < wrist.y - 0.18;

            const isAskingGesture = isPointingUp || isThumbUp;

            if (isAskingGesture) {
              if (!isGestureListeningRef.current) {
                // Giữ cử chỉ ít nhất 200ms để bắt đầu thu âm
                if (now - gestureHoldTimerRef.current > 200) {
                  isGestureListeningRef.current = true;
                  startVoiceRecognition();
                }
              }
            } else {
              gestureHoldTimerRef.current = now;
              if (isGestureListeningRef.current) {
                isGestureListeningRef.current = false;
                stopVoiceRecognition();
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(checkHandGesture);
    };

    animId = requestAnimationFrame(checkHandGesture);
    return () => cancelAnimationFrame(animId);
  }, [handStateRef]);

  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        recognitionRef.current.start();
      } catch (e) {
        // Có thể recognition đang chạy
      }
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    // Gửi nội dung đã nhận diện được
    setTimeout(() => {
      if (transcript && transcript.trim().length > 1) {
        handleAskAITutor(transcript);
      }
    }, 400);
  };

  // ─── 5. Gợi Ý Câu Hỏi Nhanh (Smart Context Prompt Chips) ───
  const promptSuggestions = React.useMemo(() => {
    if (subject === "chemistry") {
      const chem1 = activeChemical?.name || "chất này";
      const beakerChem = reactionBeakerChemical?.name || reactionBeakerSolid?.name;

      if (activeReaction) {
        return [
          `Cô giải thích hiện tượng phản ứng ${activeReaction.equation} với ạ!`,
          "Tại sao lại có hiện tượng sủi bọt/đổi màu vậy cô?",
          "Phản ứng này thuộc loại phản ứng gì trong SGK Hóa?",
        ];
      }

      if (beakerChem) {
        return [
          `Khi trộn ${chem1} vào ${beakerChem} thì có phản ứng không cô?`,
          `Chất ${beakerChem} ở dạng rắn hay lỏng có ảnh hưởng gì không cô?`,
          `Làm sao để nhận biết phản ứng giữa ${chem1} và ${beakerChem}?`,
        ];
      }

      return [
        `Cô ơi, ${chem1} có tính chất hóa học gì nổi bật?`,
        "Làm thế nào để chọn chất phản ứng với chất này ạ?",
        "Cô hướng dẫn em quy tắc an toàn khi làm thí nghiệm với ạ!",
      ];
    }

    if (subject === "physics") {
      return [
        "Cô giải thích định luật bảo toàn cơ năng trong con lắc ạ!",
        "Khi tăng chiều dài dây thì chu kỳ dao động thay đổi thế nào cô?",
        "Quy luật khúc xạ ánh sáng qua thấu kính hoạt động ra sao ạ?",
      ];
    }

    return [
      "Cô ơi, cấu trúc tế bào thực vật có điểm gì khác tế bào động vật?",
      "Chức năng chính của tim và các van tim là gì vậy cô?",
      "Giải thích giúp em cơ chế co bóp của hệ tuần hoàn ạ!",
    ];
  }, [subject, activeChemical, reactionBeakerChemical, reactionBeakerSolid, activeReaction]);

  return (
    <div className="absolute top-16 right-3 sm:right-4 z-40 pointer-events-auto select-none max-w-sm w-[92vw] sm:w-88 transition-all duration-300">
      {isOpen ? (
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-sky-400/50 rounded-3xl p-3.5 shadow-2xl text-white ring-1 ring-sky-400/20">
          {/* ── Header Cô Giáo Mai AI ── */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
                  <GraduationCap className="w-4 h-4" />
                </div>
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Cô Giáo Mai (AI)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    GDPT 2018
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {isThinking
                    ? "Đang suy nghĩ câu trả lời..."
                    : isListening
                    ? "Đang lắng nghe giọng em... 🎙️"
                    : "Hỏi đáp & Hướng dẫn thí nghiệm"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Nút bật/tắt giọng đọc */}
              <button
                onClick={() => {
                  if (voiceEnabled) window.speechSynthesis?.cancel();
                  setVoiceEnabled(!voiceEnabled);
                }}
                className={`p-1.5 rounded-xl border transition-colors ${
                  voiceEnabled
                    ? "bg-slate-800 text-sky-400 border-sky-500/40"
                    : "bg-slate-900 text-slate-500 border-slate-800"
                }`}
                title={voiceEnabled ? "Tắt giọng đọc của Cô" : "Bật giọng đọc tiếng Việt"}
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Nút thu nhỏ */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Thu nhỏ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Lời Cô Giáo Giảng Giải ── */}
          <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-1 text-xs text-slate-200 leading-relaxed mb-3 space-y-1.5">
            <p className="whitespace-pre-line">{teacherResponse}</p>
          </div>

          {/* ── Trạng Thái Sóng Âm Khi Đang Nói / Push to Talk ── */}
          {isListening && (
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between mb-2.5 animate-pulse">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="truncate">{transcript || "Cô đang nghe em nói..."}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full shrink-0">
                REC
              </span>
            </div>
          )}

          {/* ── Gợi Ý Câu Hỏi Nhanh (Smart Prompt Chips) ── */}
          <div className="mb-3 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Gợi ý câu hỏi về thí nghiệm:</span>
            </span>
            <div className="flex flex-col gap-1">
              {promptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskAITutor(prompt)}
                  disabled={isThinking}
                  className="text-left text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-800 hover:border-sky-400/50 transition-all truncate"
                >
                  👉 {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* ── Thanh Tương Tác: Nút Push-To-Talk Lớn & Ô Nhập Chữ ── */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
            {/* Nút Push-to-Talk bằng cảm ứng/chuột */}
            <button
              onMouseDown={startVoiceRecognition}
              onMouseUp={stopVoiceRecognition}
              onTouchStart={startVoiceRecognition}
              onTouchEnd={stopVoiceRecognition}
              className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse shadow-rose-500/30 ring-2 ring-rose-400"
                  : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-500/25"
              }`}
              title="Nhấn và giữ nút này (hoặc dơ ngón trỏ ☝️ trước webcam) để nói"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{isListening ? "Đang thu..." : "Giữ Nói"}</span>
            </button>

            {/* Ô gõ câu hỏi bằng phím */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAITutor(inputQuery);
              }}
              className="flex-1 flex items-center gap-1 bg-slate-900 border border-slate-800 focus-within:border-sky-500 rounded-2xl px-2.5 py-1 transition-all"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Hỏi cô giáo..."
                disabled={isThinking}
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isThinking}
                className="p-1 rounded-xl text-sky-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Gửi câu hỏi"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Footer nhắc nhở cử chỉ giơ tay */}
          <div className="mt-2 text-center flex items-center justify-between text-[10px] text-slate-500">
            <span>☝️ Dơ ngón trỏ để hỏi tự động</span>
            <button
              onClick={onToggle3DTeacher}
              className="text-sky-400 hover:underline cursor-pointer"
            >
              {show3DTeacher ? "Ẩn Cô 3D" : "Hiện Cô 3D"}
            </button>
          </div>
        </div>
      ) : (
        /* Nút Thu Nhỏ */
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setIsOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-sky-400/50 text-white shadow-2xl flex items-center gap-2 hover:border-sky-300 transition-all cursor-pointer ring-1 ring-sky-400/20"
          >
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              {isListening && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className="text-xs font-bold text-sky-200">Cô Giáo Mai (AI)</span>
          </button>
        </div>
      )}
    </div>
  );
}
