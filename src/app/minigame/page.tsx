import { Metadata } from "next";
import EquationMinigame from "@/components/EquationMinigame";

export const metadata: Metadata = {
  title: "Đấu Trường Nối Phương Trình — Minigame Hóa Học SimLab",
  description:
    "Đấu trường nối phương trình hóa học chuẩn GDPT 2018. Đua tốc độ, bứt phá bảng xếp hạng toàn quốc và tích lũy XP trong phòng lab ảo SimLab Edu.",
};

export default function MinigamePage() {
  return (
    <div className="w-full min-h-screen bg-[#060911] text-slate-100 flex flex-col">
      <EquationMinigame />
    </div>
  );
}
