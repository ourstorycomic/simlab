"use client";

/**
 * ─── Global3DHandOverlay ───
 * Lớp phủ bàn tay 3D toàn cục hiển thị ở tầng z-[60] (PHÍA TRƯỚC THANH TAB & MỌI UI):
 * 1. Đảm bảo 100% bàn tay 3D hiển thị Ở PHÍA TRƯỚC thanh chuyển môn (Navigation Tabs),
 *    không bao giờ bị che khuất hay chìm ra sau các nút bấm hay bảng đen.
 * 2. Tự động điều chỉnh góc nhìn Camera và vị trí Offset theo từng môn học (Hóa học / Vật lý / Sinh học).
 * 3. Tương tác công thái học: tay với lên cao tự nhiên chạm tới thanh tab mà không cần giơ tay qua đầu.
 */

import React, { MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { HandState } from "@/lib/handTracking";
import Lab3DFullHandModel, { IndexTipInfo } from "./Lab3DFullHandModel";

interface Global3DHandOverlayProps {
    handStateRef: MutableRefObject<HandState>;
    subject: "chemistry" | "physics" | "biology";
    onIndexTipUpdate?: (info: IndexTipInfo | null) => void;
}

export default function Global3DHandOverlay({ handStateRef, subject, onIndexTipUpdate }: Global3DHandOverlayProps) {
    const cameraSettings = React.useMemo(() => {
        if (subject === "physics") {
            // Hạ thấp góc nhìn camera đồng bộ với PhysicsScene để bàn tay khớp chuẩn xác với mặt bàn và thiết bị mạch điện
            return { position: [0, 0.55, 1.85] as [number, number, number], fov: 48 };
        }
        if (subject === "biology") {
            // Camera Sinh Học: Góc nhìn hạ thấp vừa tầm để bàn tay 3D lơ lửng ngay trước mô hình tế bào & cơ quan
            return { position: [0, 0.20, 2.5] as [number, number, number], fov: 46 };
        }
        // Chemistry default
        return { position: [0, 0.45, 1.45] as [number, number, number], fov: 50 };
    }, [subject]);

    const positionOffset = React.useMemo(() => {
        if (subject === "physics") {
            // Hạ cao độ bàn tay Y từ +0.02 xuống -0.28m để tay lơ lửng vừa vặn ngay trên mặt bàn mạch điện (Y = -0.16)
            return [0, -0.28, -0.32] as [number, number, number];
        }
        if (subject === "biology") {
            // Hạ cao độ Y từ +0.16m xuống -0.26m và đưa Z về +0.25m để bàn tay xuất hiện tự nhiên ngay giữa mô hình tế bào/nội tạng (không bị dính trên mép đỉnh màn hình)
            return [0, -0.26, 0.25] as [number, number, number];
        }
        // Chemistry default - cân bằng chuẩn xác với mặt bàn và kích thước bình thủy tinh
        return [0, 0.04, 0.12] as [number, number, number];
    }, [subject]);

    const scaleFactor = React.useMemo(() => {
        // Tỷ lệ chuẩn giải phẫu thực tế: bàn tay vừa vặn cầm bình thủy tinh 150-250ml
        if (subject === "biology") return 0.82;
        if (subject === "physics") return 0.78;
        return 0.75;
    }, [subject]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden select-none">
            <Canvas
                key={`global-hand-${subject}`}
                camera={cameraSettings}
                onCreated={(state) => {
                    state.gl.domElement.style.pointerEvents = "none";
                }}
                gl={{
                    alpha: true,
                    antialias: true,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: false,
                }}
                style={{ pointerEvents: "none", width: "100%", height: "100%" }}
            >
                <ambientLight intensity={1.35} />
                <directionalLight position={[0, 4, 3]} intensity={1.8} />
                <directionalLight position={[-2, -2, -2]} intensity={0.5} />
                <Lab3DFullHandModel
                    handStateRef={handStateRef}
                    positionOffset={positionOffset}
                    scaleFactor={scaleFactor}
                    onIndexTipUpdate={onIndexTipUpdate}
                />
            </Canvas>
        </div>
    );
}
