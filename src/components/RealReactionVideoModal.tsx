"use client";

import React, { useState, useRef, useEffect } from "react";
import { RealVideoDemo, ReactionResult } from "@/lib/reactions";

interface RealReactionVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: RealVideoDemo;
  reaction: ReactionResult;
}

export default function RealReactionVideoModal({
  isOpen,
  onClose,
  video,
  reaction,
}: RealReactionVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [currentSrcIndex, setCurrentSrcIndex] = useState<number>(0);

  // Danh sách các URL thử tải (từ API route tới static file)
  const allUrls = React.useMemo(() => {
    const list = [video.url];
    if (video.fallbackUrls) {
      list.push(...video.fallbackUrls);
    }
    return list;
  }, [video.url, video.fallbackUrls]);

  // Phím tắt Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto play khi mở modal
  useEffect(() => {
    if (isOpen) {
      setVideoError(false);
      setCurrentSrcIndex(0);
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {
            // Trình duyệt chặn autoplay có âm thanh -> thử mute rồi play
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(() => setIsPlaying(false));
            }
          });
        }
      }, 300);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSpeedChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleVideoError = () => {
    if (currentSrcIndex < allUrls.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
    } else {
      setVideoError(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-in my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Video Thực Nghiệm Ngoài Đời Thật
                </span>
                <span className="hidden sm:inline-block text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                  Chuẩn GDPT 2018
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-1">
                {video.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            title="Đóng (Esc)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          {/* Video Player Card */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-gray-800 shadow-inner group">
            {videoError ? (
              <div className="text-center p-6 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm font-medium text-white">Không thể phát tệp video</p>
                <p className="text-xs text-gray-500 mt-1">Đường dẫn: {allUrls[currentSrcIndex]}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={allUrls[currentSrcIndex]}
                onError={handleVideoError}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain max-h-[52vh]"
                playsInline
                controls
              />
            )}
          </div>

          {/* Quick Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-800/70 p-2.5 rounded-xl border border-gray-700/60 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Phát tiếp</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReplay}
                className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors flex items-center gap-1.5"
                title="Phát lại từ đầu"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Xem lại</span>
              </button>

              <button
                onClick={toggleMute}
                className="px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                title={isMuted ? "Bật âm thanh" : "Tắt âm"}
              >
                {isMuted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px]">Tốc độ:</span>
              {[0.5, 1, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${playbackRate === rate
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700/80 hover:bg-gray-600 text-gray-300"
                    }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Equation & Description */}
          <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Phương trình hóa học
              </span>
              <span className="text-[10px] text-blue-400 font-medium">
                Phản ứng oxi hóa - khử mạnh
              </span>
            </div>
            <div
              className="text-xs sm:text-sm font-medium text-center py-2 px-3 bg-gray-900/80 rounded-lg border border-gray-700 text-white"
              dangerouslySetInnerHTML={{ __html: reaction.equationHtml }}
            />
            {video.description && (
              <p className="text-xs text-gray-300 leading-relaxed pt-1">
                {video.description}
              </p>
            )}
          </div>

          {/* Real Phenomena vs Simulation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Real phenomena */}
            <div className="bg-gray-800/60 rounded-xl p-3.5 border border-gray-700/50">
              <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Hiện tượng thực tế quan sát được
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {(video.realPhenomena || reaction.observations).map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SimLab 3D Match */}
            <div className="bg-gray-800/60 rounded-xl p-3.5 border border-gray-700/50">
              <h4 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Đối chiếu với Mô phỏng SimLab 3D
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Bọt khí & khói:</strong> Hiệu ứng sủi bọt khí cuồn cuộn mô phỏng chính xác khí NO₂ màu nâu đỏ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Đổi màu dung dịch:</strong> Chuyển từ trong suốt sang màu xanh lam ngọc đặc trưng của ion Cu²⁺.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Hòa tan chất rắn:</strong> Mảnh đồng Cu màu đỏ cam tan dần vào dung dịch axit.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Safety Warning */}
          {video.safetyWarning && (
            <div className="bg-amber-950/40 border border-amber-800/70 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="leading-relaxed">
                {video.safetyWarning}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between text-xs text-gray-400">
          <span>{video.sourceName || "Tư liệu thực nghiệm SimLab"}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
