"use client";

import React, { useEffect, useState } from "react";
import { BadgeDef, User, getLevel, getLevelTitle, updateUser } from "@/lib/storage";
import { useToast } from "@/components/toast";

// ─── Avatar ───
// Hiển thị avatar: ký tự (avatarIcon) trên nền màu (avatarColor).
// Kích thước: sm (w-8), md (w-10, mặc định), lg (w-16).
interface AvatarProps {
    user: Pick<User, "name" | "avatarColor" | "avatarIcon">;
    size?: "sm" | "md" | "lg";
    className?: string;
    title?: string;
}

const AVATAR_SIZES = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-2xl",
} as const;

export function Avatar({ user, size = "md", className = "", title }: AvatarProps) {
    const fallback = (user.name || "?").trim().slice(0, 1).toUpperCase();
    return (
        <div
            title={title ?? user.name}
            aria-label={`Avatar của ${user.name}`}
            className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none shadow-sm border-2 border-white/60 dark:border-gray-700/60 ${AVATAR_SIZES[size]} ${className}`}
            style={{ backgroundColor: user.avatarColor || "#2563eb" }}
        >
            {user.avatarIcon ? user.avatarIcon.slice(0, 2) : fallback}
        </div>
    );
}

// ─── ProgressBar ───
// Thanh tiến trình đơn giản theo phần trăm.
interface ProgressBarProps {
    /** Phần trăm 0..100 */
    value: number;
    className?: string;
    barClassName?: string;
    /** Hiển thị phần trăm bên phải */
    showLabel?: boolean;
    label?: string;
    ariaLabel?: string;
}

export function ProgressBar({
    value,
    className = "",
    barClassName = "bg-blue-600 dark:bg-blue-500",
    showLabel = false,
    label,
    ariaLabel,
}: ProgressBarProps) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={ariaLabel}
                className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"
            >
                <div
                    className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
                    {label ?? `${Math.round(pct)}%`}
                </span>
            )}
        </div>
    );
}

// ─── BadgeChip ───
// Huy hiệu: sáng màu khi đã đạt, mờ khi chưa đạt.
interface BadgeChipProps {
    badge: BadgeDef;
    earned: boolean;
    size?: "sm" | "md";
}

export function BadgeChip({ badge, earned, size = "sm" }: BadgeChipProps) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            <span
                title={earned ? `${badge.label}: ${badge.desc}` : `Chưa đạt — ${badge.desc}`}
                aria-label={badge.label}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all ${earned
                        ? "border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-70"
                    } ${size === "md" ? "px-2.5 py-1 text-[11px]" : ""}`}
            >
                {badge.label}
            </span>
            {open && (
                <span
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-gray-900 dark:bg-gray-950 text-white text-[10px] px-2 py-1 shadow-lg z-30 pointer-events-none"
                >
                    {badge.desc}
                </span>
            )}
        </div>
    );
}

// ─── XPBar ───
// Thẻ hiển thị cấp độ + thanh XP + tên cấp.
interface XPBarProps {
    xp: number;
    streak?: number;
    compact?: boolean;
}

export function XPBar({ xp, streak = 0, compact = false }: XPBarProps) {
    const level = getLevel(xp);
    const title = getLevelTitle(level.level);
    return (
        <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 ${compact ? "p-3" : "p-4"}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {level.level}
                    </span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100">Cấp {level.level}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">· {title}</span>
                </span>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                    {level.current}/{level.needed} XP
                </span>
            </div>
            <ProgressBar
                value={level.progress * 100}
                barClassName="bg-gradient-to-r from-blue-600 to-cyan-500"
                ariaLabel={`Tiến trình cấp ${level.level}`}
            />
            {!compact && (
                <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Tổng {xp} XP</span>
                    {streak > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                            <span aria-hidden="true">🔥</span> Streak {streak} ngày
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Màu avatar cho hồ sơ ───
export const AVATAR_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#0891b2", "#7c3aed", "#db2777", "#65a30d"];

// ─── ProfileModal ───
// Hồ sơ cá nhân: sửa tên, trường, màu + ký tự avatar.
interface ProfileModalProps {
    open: boolean;
    user: User;
    onClose: () => void;
    onSaved: (updated: User) => void;
}

export function ProfileModal({ open, user, onClose, onSaved }: ProfileModalProps) {
    const { showToast } = useToast();
    const [name, setName] = useState(user.name);
    const [school, setSchool] = useState(user.school ?? "");
    const [avatarColor, setAvatarColor] = useState(user.avatarColor ?? "#2563eb");
    const [avatarIcon, setAvatarIcon] = useState(user.avatarIcon ?? user.name.slice(0, 1).toUpperCase());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setName(user.name);
            setSchool(user.school ?? "");
            setAvatarColor(user.avatarColor ?? "#2563eb");
            setAvatarIcon(user.avatarIcon ?? user.name.slice(0, 1).toUpperCase());
        }
    }, [open, user]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            showToast("Tên không được để trống", "error");
            return;
        }
        setSaving(true);
        try {
            const updated = updateUser(user.id, {
                name: trimmed,
                school: school.trim() || undefined,
                avatarColor,
                avatarIcon: avatarIcon.trim().slice(0, 2).toUpperCase() || trimmed.slice(0, 1).toUpperCase(),
            });
            showToast("Đã cập nhật hồ sơ", "success");
            onSaved(updated);
            onClose();
        } catch {
            showToast("Không thể cập nhật hồ sơ", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Hồ sơ cá nhân"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-scale-in overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Hồ sơ cá nhân</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                        aria-label="Đóng"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSave} noValidate className="p-5 space-y-4">
                    {/* Preview */}
                    <div className="flex items-center gap-4">
                        <Avatar user={{ name, avatarColor, avatarIcon }} size="lg" />
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{name || "Tên của bạn"}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{school || "Chưa có trường"}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                {user.email} · {user.role === "teacher" ? "Giáo viên" : "Học sinh"}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="profile-name" className="lab-label">Họ và tên</label>
                        <input
                            id="profile-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="lab-input"
                            placeholder="VD: Nguyễn Văn An"
                        />
                    </div>

                    <div>
                        <label htmlFor="profile-school" className="lab-label">Trường học (không bắt buộc)</label>
                        <input
                            id="profile-school"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            className="lab-input"
                            placeholder="VD: THPT Chuyên KHTN"
                        />
                    </div>

                    <div>
                        <label className="lab-label">Màu avatar</label>
                        <div className="flex flex-wrap gap-2">
                            {AVATAR_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setAvatarColor(c)}
                                    aria-label={`Chọn màu ${c}`}
                                    aria-pressed={avatarColor === c}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${avatarColor === c ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800" : ""}`}
                                    style={{ backgroundColor: c }}
                                >
                                    {avatarColor === c && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="profile-icon" className="lab-label">Ký tự hiển thị (1-2 ký tự)</label>
                        <input
                            id="profile-icon"
                            value={avatarIcon}
                            maxLength={2}
                            onChange={(e) => setAvatarIcon(e.target.value.toUpperCase())}
                            className="lab-input font-mono uppercase tracking-widest"
                            placeholder="VD: AN"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="lab-btn px-4 py-2 text-sm rounded-lg">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="lab-btn-primary px-4 py-2 text-sm rounded-lg inline-flex items-center gap-1.5">
                            {saving && (
                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                                </svg>
                            )}
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
