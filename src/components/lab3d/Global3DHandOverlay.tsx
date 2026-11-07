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
        // Góc nhìn Camera trực diện chuẩn xác bao quát toàn màn hình cho cả 3 môn (Chemistry / Physics / Biology):
        // Camera đặt tại Z = 2.40, nhìn thẳng trực diện vào tâm (0, 0, 0)
        return { position: [0, 0, 2.40] as [number, number, number], fov: 48 };
    }, []);

    const positionOffset = React.useMemo(() => {
        // Tâm bàn tay tại (0, 0, 0) - Trùng khớp 100% với tâm Camera và tâm màn hình
        return [0, 0, 0] as [number, number, number];
    }, []);

    const scaleFactor = React.useMemo(() => {
        // Tỷ lệ chuẩn công thái học: bàn tay rõ ràng, vừa vặn tự nhiên trên màn hình
        return 0.78;
    }, []);

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
