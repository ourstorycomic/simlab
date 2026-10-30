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
            return { position: [0, 0.55, 1.75] as [number, number, number], fov: 48 };
        }
        if (subject === "biology") {
            // Camera Sinh Học: Đồng bộ phối cảnh camera với PlantCellViewer (Y = 1.35, Z = 2.75) để bàn tay ôm trọn mô hình
            return { position: [0.08, 1.35, 2.75] as [number, number, number], fov: 38 };
        }
        // Chemistry default: Đồng bộ với Lab3DScene camera (Y = 0.65, Z = 2.65)
        return { position: [0, 0.65, 2.65] as [number, number, number], fov: 48 };
    }, [subject]);

    const positionOffset = React.useMemo(() => {
        if (subject === "physics") {
            // Bàn tay lơ lửng vừa vặn ngay trên mặt bàn mạch điện, chạm chuẩn xác công tắc
            return [0, -0.22, 0.0] as [number, number, number];
        }
        if (subject === "biology") {
            // Hạ bàn tay xuất hiện tự nhiên ngay giữa mô hình tế bào/nội tạng (không bao giờ dính mép đỉnh menu)
            return [0, -0.42, 0.10] as [number, number, number];
        }
        // Chemistry: Hạ thấp vừa tầm mặt bàn và bình hóa chất
        return [0, -0.06, 0.18] as [number, number, number];
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
