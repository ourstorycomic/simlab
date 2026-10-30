"use client";

/**
 * ─── Lab3DAITutorVoice ───
 * Trợ lý Sư phạm Cô Giáo Mai AI Đa Nền Tảng:
 * 1. Giọng nói Thuần Việt Nữ 100% (Google Neural TTS vi-VN qua API /api/ai/tts):
 *    - Phát âm chuẩn tiếng Việt, truyền cảm, tự nhiên như người thật.
 *    - Đồng bộ khẩu hình nói chuyện và chớp mắt cử chỉ 3D của Cô Giáo Mai.
 * 2. Tương Tác Giọng Nói Tự Do (Không Rập Khuôn Gợi Ý):
 *    - Học sinh tự do hỏi bất kỳ thắc mắc nào về bài học/thí nghiệm.
 *    - Push-to-Talk bằng Cử chỉ bàn tay: Dơ ngón trỏ ☝️ (hoặc ngón cái 👍) trước webcam để nói.
 *    - Hoặc giữ nút "Giữ Nói" trên màn hình, hoặc gõ phím trực tiếp vào ô hỏi đáp.
 * 3. Ngữ cảnh Thí Nghiệm Sâu Sắc:
 *    - Phân tích trực tiếp các chất trên bàn, chất trong cốc trộn, hiện tượng hóa học/vật lý.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Send,
  GraduationCap,
  X,
  Play,
  HelpCircle,
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

const Mic = MicIcon;
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [teacherResponse, setTeacherResponse] = useState<string>(
    "Chào em! Cô là cô giáo Mai. Em có thể giơ 2 ngón tay ✌️ để hỏi cô và khi hạ tay cô sẽ tự động trả lời nhé!"
  );
  const [inputQuery, setInputQuery] = useState("");

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isGestureListeningRef = useRef(false);
  const gestureHoldTimerRef = useRef<number>(0);
  const lastGestureCheckRef = useRef<number>(0);
  const transcriptRef = useRef<string>("");
  const isSubmittingVoiceRef = useRef<boolean>(false);

  // ─── 0. Dừng toàn bộ âm thanh đang phát ───
  const stopAllSpeech = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    if (onTeacherModeChange) onTeacherModeChange("idle");
  }, [onTeacherModeChange]);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, [stopAllSpeech]);

  // ─── 1. Phát âm thanh Giọng Nói Cô Giáo (100% Giọng Nữ Thuần Việt qua API TTS) ───
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !voiceEnabled) return;

      stopAllSpeech();

      // Làm sạch text để đọc mượt mà (bỏ ký tự markdown)
      const cleanText = text
        .replace(/[*#_`~>\[\]\(\)]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) return;

      try {
        const audioUrl = `/api/ai/tts?text=${encodeURIComponent(cleanText)}`;
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;

        audio.onplay = () => {
          setIsPlayingAudio(true);
          if (onTeacherModeChange) onTeacherModeChange("speaking");
        };

        audio.onended = () => {
          setIsPlayingAudio(false);
          if (onTeacherModeChange) onTeacherModeChange("idle");
          audioPlayerRef.current = null;
        };

        audio.onerror = (e) => {
          console.warn("TTS Audio API error, falling back to Web Speech:", e);
          setIsPlayingAudio(false);
          // Dự phòng Web Speech API nếu offline
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = "vi-VN";
            const voices = window.speechSynthesis.getVoices();
            const viVoice =
              voices.find(
                (v) =>
                  v.lang.includes("vi") &&
                  (v.name.includes("HoaiMy") ||
                    v.name.includes("Natural") ||
                    v.name.includes("Google") ||
                    v.name.includes("Female") ||
                    v.name.includes("An"))
              ) || voices.find((v) => v.lang.includes("vi"));
            if (viVoice) utterance.voice = viVoice;
            utterance.onstart = () => {
              setIsPlayingAudio(true);
              onTeacherModeChange?.("speaking");
            };
            utterance.onend = () => {
              setIsPlayingAudio(false);
              onTeacherModeChange?.("idle");
            };
            utterance.onerror = () => {
              setIsPlayingAudio(false);
              onTeacherModeChange?.("idle");
            };
            window.speechSynthesis.speak(utterance);
          } else {
            if (onTeacherModeChange) onTeacherModeChange("idle");
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Trình duyệt chặn autoplay audio:", err);
            setIsPlayingAudio(false);
            if (onTeacherModeChange) onTeacherModeChange("idle");
          });
        }
      } catch (err) {
        console.error("Lỗi khi phát TTS:", err);
        setIsPlayingAudio(false);
        if (onTeacherModeChange) onTeacherModeChange("idle");
      }
    },
    [voiceEnabled, onTeacherModeChange, stopAllSpeech]
  );

  // ─── 2. Gửi câu hỏi đến AI Tutor kèm Toàn Bộ Ngữ Cảnh Thí Nghiệm ───
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
        transcriptRef.current = "";
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

  // ─── 3. Bắt đầu thu âm giọng nói ───
  const startVoiceRecognition = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        transcriptRef.current = "";
        setTranscript("");
        setInputQuery("");
        recognitionRef.current.start();
      } catch (e) {
        // Có thể recognition đang chạy
      }
    }
  }, [isListening]);

  // ─── 4. Dừng thu âm & TỰ ĐỘNG GỬI CÂU HỎI NGAY LẬP TỨC (Không cần bấm nút gửi) ───
  const stopVoiceRecognitionAndSend = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    // Chờ 250ms cho Web Speech API hoàn tất từ cuối cùng rồi tự động gửi ngay
    setTimeout(() => {
      const textToSend = transcriptRef.current.trim() || inputQuery.trim();
      if (textToSend.length >= 2 && !isSubmittingVoiceRef.current) {
        isSubmittingVoiceRef.current = true;
        handleAskAITutor(textToSend).finally(() => {
          isSubmittingVoiceRef.current = false;
        });
      }
    }, 250);
  }, [handleAskAITutor, inputQuery]);

  // ─── 5. Khởi tạo Web Speech Recognition (Giọng nói Tiếng Việt vi-VN) ───
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
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        transcriptRef.current = currentTranscript;
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
        // TỰ ĐỘNG GỬI khi người dùng nói xong (nhận diện kết thúc câu)
        const textToSend = transcriptRef.current.trim();
        if (textToSend.length >= 2 && !isSubmittingVoiceRef.current) {
          isSubmittingVoiceRef.current = true;
          handleAskAITutor(textToSend).finally(() => {
            isSubmittingVoiceRef.current = false;
          });
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onTeacherModeChange, handleAskAITutor]);

  // ─── 6. Cử chỉ Giơ 2 Ngón Tay Push-To-Talk (✌️ Victory / Peace Sign: Trỏ + Giữa) ───
  useEffect(() => {
    let animId: number;

    const checkHandGesture = () => {
      const now = performance.now();
      if (now - lastGestureCheckRef.current > 80) {
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
            // CỬ CHỈ GIƠ 2 NGÓN TAY (✌️ Ngón trỏ & Ngón giữa duỗi lên):
            // 1. Ngón trỏ (Index) VÀ Ngón giữa (Middle) cùng duỗi thẳng
            // 2. Các ngón khác (Ngón áp út, Ngón út) gập lại
            // 3. Hoặc số ngón duỗi là 2 và có ngón trỏ/ngón giữa
            const isIndexMiddleExt = Boolean(hand.isIndexExtended && hand.isMiddleExtended);
            const isRingPinkyFolded = Boolean(!hand.isRingExtended && !hand.isPinkyExtended);
            const isTwoFingersPeace = isIndexMiddleExt && isRingPinkyFolded;
            const isTwoFingersCount = hand.extendedFingersCount === 2 && (hand.isIndexExtended || hand.isMiddleExtended);

            const isTwoFingersGesture = isTwoFingersPeace || isTwoFingersCount;

            if (isTwoFingersGesture) {
              if (!isGestureListeningRef.current) {
                // Giữ cử chỉ 2 ngón tay khoảng 180ms để bắt đầu thu âm
                if (now - gestureHoldTimerRef.current > 180) {
                  isGestureListeningRef.current = true;
                  startVoiceRecognition();
                }
              }
            } else {
              gestureHoldTimerRef.current = now;
              if (isGestureListeningRef.current) {
                // Người dùng hạ 2 ngón tay xuống: TỰ ĐỘNG GỬI CÂU HỎI NGAY LẬP TỨC!
                isGestureListeningRef.current = false;
                stopVoiceRecognitionAndSend();
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(checkHandGesture);
    };

    animId = requestAnimationFrame(checkHandGesture);
    return () => cancelAnimationFrame(animId);
  }, [handStateRef, startVoiceRecognition, stopVoiceRecognitionAndSend]);

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
                {isPlayingAudio && (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Cô Giáo Mai (AI)</span>
                  <span className="px-1.5 py-0.2 bg-gradient-to-r from-sky-500 to-blue-600 text-[9px] font-semibold text-white rounded-md">
                    GDPT 2018
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {isPlayingAudio
                    ? "🔊 Đang giảng giải bằng giọng nữ..."
                    : isListening
                    ? "🎙️ Đang lắng nghe câu hỏi..."
                    : "Hỏi đáp & Hướng dẫn thí nghiệm"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Nút bật/tắt âm thanh đọc */}
              <button
                onClick={() => {
                  if (voiceEnabled) {
                    stopAllSpeech();
                  }
                  setVoiceEnabled(!voiceEnabled);
                }}
                className={`p-1.5 rounded-xl border transition-colors ${
                  voiceEnabled
                    ? "bg-slate-800 text-sky-400 border-sky-500/40"
                    : "bg-slate-900 text-slate-500 border-slate-800"
                }`}
                title={voiceEnabled ? "Tắt giọng đọc của Cô" : "Bật giọng đọc tiếng Việt nữ"}
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
            {teacherResponse && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => speakText(teacherResponse)}
                  disabled={isPlayingAudio}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-400 hover:text-sky-300 hover:underline px-2 py-0.5 rounded-lg bg-sky-950/40 border border-sky-800/50"
                  title="Nghe lại lời cô giảng bằng giọng nữ thuần Việt"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>{isPlayingAudio ? "Đang nói..." : "Nghe cô nói"}</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Trạng Thái Sóng Âm Khi Đang Nói / Push to Talk ── */}
          {isListening && (
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between mb-2.5 animate-pulse">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="truncate">{transcript || "Cô đang lắng nghe (Hạ 2 ngón tay để gửi)..."}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full shrink-0">
                REC ✌️
              </span>
            </div>
          )}

          {/* ── Thanh Tương Tác: Nút Push-To-Talk Lớn & Ô Nhập Chữ ── */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
            {/* Nút Push-to-Talk bằng cảm ứng/chuột */}
            <button
              onMouseDown={startVoiceRecognition}
              onMouseUp={stopVoiceRecognitionAndSend}
              onTouchStart={startVoiceRecognition}
              onTouchEnd={stopVoiceRecognitionAndSend}
              className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse shadow-rose-500/30 ring-2 ring-rose-400"
                  : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-500/25"
              }`}
              title="Nhấn giữ để nói (hoặc giơ 2 ngón tay ✌️ trước webcam), buông ra sẽ tự động gửi"
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
                className="p-1 rounded-xl text-sky-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Gửi câu hỏi"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* ── Gợi ý cử chỉ ngón tay & nút ẩn/hiện 3D Teacher ── */}
          <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-amber-300/90 font-medium">
              <span>✌️</span>
              <span>Giơ 2 ngón tay để hỏi • Hạ tay tự gửi</span>
            </span>

            <button
              onClick={onToggle3DTeacher}
              className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors underline decoration-dotted"
            >
              {show3DTeacher ? "Ẩn Cô 3D" : "Hiện Cô 3D"}
            </button>
          </div>
        </div>
      ) : (
        /* Widget khi thu nhỏ */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 border border-sky-500/50 hover:border-sky-400 shadow-xl text-white backdrop-blur-xl transition-all group hover:scale-105"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">Cô Giáo Mai AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}
    </div>
  );
}
