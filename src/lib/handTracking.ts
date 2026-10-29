/**
 * ─── Hand Tracking Engine ───
 * Sử dụng @mediapipe/tasks-vision (HandLandmarker) – thế hệ mới nhất của Google.
 * 
 * HỖ TRỢ ĐỒNG THỜI 2 BÀN TAY (Dual-Hand Tracking: Tay Trái & Tay Phải):
 * - Bàn tay trái và phải hoạt động độc lập (cầm 1 bên, rót 1 bên)
 * - Tọa độ Palm Socket (lòng bàn tay) và ngón tay khớp 100% với Mô hình 3D (Không bị lệch tay 1 nơi đồ 1 nơi)
 * - KHÔNG dùng useState cho tọa độ tay – mọi dữ liệu lưu vào MutableRefObject
 *   để useFrame() của R3F đọc trực tiếp ở 60 FPS mà không trigger React re-render.
 * 
 * 3 Gestures chuẩn:
 *   1. OPEN   – Xòe tay → di chuyển tự do
 *   2. GRAB   – Nắm/chụm tay → nắm chắc lọ hóa chất / dụng cụ
 *   3. POUR   – Nghiêng bàn tay khi đang cầm → rót hóa chất vào cốc
 */

// ─── Types ───

export type GestureType = "OPEN" | "GRAB" | "POUR" | "IDLE";

export interface HandLandmark {
    x: number; // 0..1  (normalized, từ trái sang phải theo camera)
    y: number; // 0..1  (normalized, từ trên xuống dưới)
    z: number; // depth (nhỏ = gần camera)
}

export interface SingleHandData {
    /** Có phát hiện bàn tay này không */
    detected: boolean;
    /** Bàn tay trái hay phải ("Left" | "Right") */
    handedness: "Left" | "Right";
    /** 21 landmarks của bàn tay (MediaPipe chuẩn) */
    landmarks: HandLandmark[];
    /** Gesture hiện tại */
    gesture: GestureType;
    /** Tọa độ đầu ngón trỏ (3D world space) */
    cursorX: number;
    cursorY: number;
    cursorZ: number;
    /** Tọa độ trung tâm lòng bàn tay (Palm Socket Grip Point) - chuẩn xác 100% để gắn đồ vật */
    palmPos: [number, number, number];
    /** Góc nghiêng cổ tay (radian) dùng cho POUR detection */
    wristAngle: number;
    /** Confidence score */
    confidence: number;
    /** Timestamp update cuối cùng */
    lastUpdateTime: number;
    /** Sticky grab: đang giữ vật hay không */
    isHolding: boolean;
    /** ID vật đang giữ (nếu có) */
    heldObjectId: string | null;
    /** Khoảng cách chụm ngón cái - ngón trỏ (0..1 normalized), dùng cho Precision Pinch */
    pinchDistance: number;
    /** Mức độ nắm tay (0.0 = xòe hoàn toàn, 1.0 = nắm chặt cả 4 ngón) */
    gripStrength: number;
    /** Tọa độ điểm chụm (Pinch Center) trong không gian 3D */
    pinchPos: [number, number, number];
    /** Góc Pitch của bàn tay (nghiêng chúc tới / ngửa sau theo trục 3D) */
    pitchAngle: number;
    /** Trạng thái duỗi từng ngón tay riêng biệt phục vụ điều khiển bằng ngón tay */
    isPinkyExtended: boolean;
    isIndexExtended: boolean;
    isMiddleExtended: boolean;
    isRingExtended: boolean;
    isThumbExtended: boolean;
    extendedFingersCount: number;
}

export function createDefaultSingleHand(handedness: "Left" | "Right" = "Right"): SingleHandData {
    return {
        detected: false,
        handedness,
        landmarks: [],
        gesture: "IDLE",
        cursorX: 0,
        cursorY: 0,
        cursorZ: 0,
        palmPos: [0, 0, 0],
        wristAngle: 0,
        confidence: 0,
        lastUpdateTime: 0,
        isHolding: false,
        heldObjectId: null,
        pinchDistance: 1.0,
        gripStrength: 0.0,
        pinchPos: [0, 0, 0],
        pitchAngle: 0,
        isPinkyExtended: false,
        isIndexExtended: false,
        isMiddleExtended: false,
        isRingExtended: false,
        isThumbExtended: false,
        extendedFingersCount: 0,
    };
}

export interface HandState extends SingleHandData {
    /** Dữ liệu bàn tay trái */
    leftHand: SingleHandData;
    /** Dữ liệu bàn tay phải */
    rightHand: SingleHandData;
    /** Số lượng bàn tay đang được theo dõi đồng thời (0, 1 hoặc 2) */
    activeHandsCount: number;
}

/** Trạng thái mặc định khi chưa detect tay */
export const DEFAULT_HAND_STATE: HandState = {
    ...createDefaultSingleHand("Right"),
    leftHand: createDefaultSingleHand("Left"),
    rightHand: createDefaultSingleHand("Right"),
    activeHandsCount: 0,
};

// ─── Constants ───

/** Landmark indices theo chuẩn MediaPipe Hands */
export const WRIST = 0;
export const THUMB_CMC = 1;
export const THUMB_MCP = 2;
export const THUMB_IP = 3;
export const THUMB_TIP = 4;
export const INDEX_MCP = 5;
export const INDEX_PIP = 6;
export const INDEX_DIP = 7;
export const INDEX_TIP = 8;
export const MIDDLE_MCP = 9;
export const MIDDLE_PIP = 10;
export const MIDDLE_DIP = 11;
export const MIDDLE_TIP = 12;
export const RING_MCP = 13;
export const RING_PIP = 14;
export const RING_DIP = 15;
export const RING_TIP = 16;
export const PINKY_MCP = 17;
export const PINKY_PIP = 18;
export const PINKY_DIP = 19;
export const PINKY_TIP = 20;

/** Pinch threshold: khoảng cách giữa ngón cái và ngón trỏ/giữa (chuẩn xác, tránh kích hoạt nhầm) */
const PINCH_THRESHOLD = 0.072;
/** Pour angle threshold (radian, khoảng 26 độ nghiêng) */
const POUR_ANGLE_THRESHOLD = 0.45;
/** Debounce cho grab (ms) - phản hồi nhanh */
const GRAB_DEBOUNCE_MS = 120;
/** Sticky grab: thời gian giữ trạng thái grab khi mất nhận diện tạm thời */
const STICKY_GRAB_TIMEOUT_MS = 400;
/** Lerp factor cho smoothing */
const LERP_FACTOR = 0.28;

// ─── Utility Functions ───

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Khoảng cách 2D (bỏ qua depth – webcam 2D chính xác nhất) */
export function dist2D(a: HandLandmark, b: HandLandmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Tính góc nghiêng cổ tay dựa trên vector từ Wrist(0) → Middle MCP(9).
 * Trả về góc có dấu (signed angle):
 * - Âm (< 0): Nghiêng sang trái (người dùng)
 * - Dương (> 0): Nghiêng sang phải (người dùng)
 */
export function calcWristAngle(landmarks: HandLandmark[]): number {
    if (landmarks.length < 21) return 0;
    const wrist = landmarks[WRIST];
    const middleMcp = landmarks[MIDDLE_MCP];
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    return Math.atan2(dx, -dy);
}

/**
 * Kiểm tra pinch (ngón cái chạm ngón trỏ hoặc ngón giữa thực sự)
 */
export function isPinching(landmarks: HandLandmark[]): boolean {
    if (landmarks.length < 21) return false;
    const thumb = landmarks[THUMB_TIP];
    return (
        dist2D(thumb, landmarks[INDEX_TIP]) < PINCH_THRESHOLD ||
        dist2D(thumb, landmarks[MIDDLE_TIP]) < PINCH_THRESHOLD
    );
}

/**
 * Kiểm tra nắm tay / gập các ngón tay để cầm đồ (chính xác 100%, không bị nhận nhầm khi xòe tay)
 */
export function isFistClosed(landmarks: HandLandmark[]): boolean {
    if (landmarks.length < 21) return false;
    const wrist = landmarks[WRIST];

    let closedFingers = 0;
    const fingerPairs: [number, number][] = [
        [INDEX_TIP, INDEX_PIP],
        [MIDDLE_TIP, MIDDLE_PIP],
        [RING_TIP, RING_PIP],
        [PINKY_TIP, PINKY_PIP],
    ];

    for (const [tip, pip] of fingerPairs) {
        // Đầu ngón tay phải thực sự gập sâu về gần cổ tay hơn so với khớp giữa PIP
        if (dist2D(landmarks[tip], wrist) < dist2D(landmarks[pip], wrist) - 0.015) {
            closedFingers++;
        }
    }

    if (dist2D(landmarks[THUMB_TIP], landmarks[INDEX_MCP]) < 0.10) {
        closedFingers++;
    }

    // Yêu cầu tối thiểu 3 ngón tay cuộn lại mới coi là Nắm tay
    return closedFingers >= 3;
}

/**
 * Phân tích gesture từ 21 landmarks với Hysteresis vững chắc chống rung & kích hoạt nhầm
 */
export function recognizeGesture(
    landmarks: HandLandmark[],
    prevState: SingleHandData,
    now: number,
    pinchDist: number,
    gripStrength: number
): GestureType {
    if (landmarks.length < 21) return "IDLE";

    const wrist = landmarks[WRIST];
    const middleMcp = landmarks[MIDDLE_MCP];
    const thumb = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    const middleTip = landmarks[MIDDLE_TIP];

    // Chuẩn hóa khoảng cách pinch theo tỷ lệ bàn tay (bất biến khoảng cách gần xa camera)
    const palmSpan = Math.max(0.08, dist2D(wrist, middleMcp));
    const normPinch = dist2D(thumb, indexTip) / palmSpan;
    const normMiddlePinch = dist2D(thumb, middleTip) / palmSpan;
    const isPinchGrab = normPinch < 0.42 || normMiddlePinch < 0.42 || pinchDist < 0.085;

    // Nắm tay (Fist) tự nhiên và nhạy
    const fistClosed = isFistClosed(landmarks);
    const isFistGrab = fistClosed || gripStrength > 0.50;

    const isGrabbingNow = isPinchGrab || isFistGrab;

    // ─── KHI ĐANG CẦM VẬT: KIỂM TRA MỞ TAY (OPEN) TRƯỚC TIÊN ĐỂ ĐẶT XUỐNG ───
    if (prevState.isHolding) {
        // Nhả vật dứt khoát ngay khi người dùng xòe các ngón tay ra tự nhiên:
        // Không nắm đấm (fistClosed = false) VÀ ngón tay mở rộng (gripStrength < 0.48 hoặc normPinch > 0.44)
        const isOpeningFingers = !fistClosed && (gripStrength < 0.48 || normPinch > 0.44 || pinchDist > 0.09);
        if (isOpeningFingers) {
            return "OPEN";
        }

        // Chỉ khi người dùng VẪN ĐANG NẮM VẬT (chưa mở tay) VÀ nghiêng cổ tay rõ rệt thì mới kích hoạt POUR
        const wristAngle = calcWristAngle(landmarks);
        const absAngle = Math.abs(wristAngle);
        if (absAngle > POUR_ANGLE_THRESHOLD) {
            return "POUR";
        }
        return "GRAB";
    }

    if (isGrabbingNow) {
        const timeSinceLastOpen = now - prevState.lastUpdateTime;
        if (timeSinceLastOpen < GRAB_DEBOUNCE_MS) {
            return prevState.gesture;
        }
        return "GRAB";
    }

    // ─── Sticky Grab: Tránh rơi đồ khi webcam lóa 1 frame ───
    if (prevState.isHolding) {
        const timeSinceLastGrab = now - prevState.lastUpdateTime;
        if (timeSinceLastGrab < STICKY_GRAB_TIMEOUT_MS) {
            return prevState.gesture === "POUR" ? "POUR" : "GRAB";
        }
    }

    return "OPEN";
}

/**
 * Cập nhật SingleHandData từ MediaPipe landmarks mới.
 * Đồng bộ công thức tọa độ 100% với Lab3DFullHandModel.
 */
export function updateSingleHand(
    state: SingleHandData,
    newLandmarks: HandLandmark[] | null,
    now: number
): void {
    if (!newLandmarks || newLandmarks.length < 21) {
        if (state.isHolding) {
            const elapsed = now - state.lastUpdateTime;
            if (elapsed > STICKY_GRAB_TIMEOUT_MS) {
                state.isHolding = false;
                state.heldObjectId = null;
                state.gesture = "IDLE";
                state.detected = false;
            }
        } else {
            state.detected = false;
            state.gesture = "IDLE";
            state.confidence = 0;
        }
        return;
    }

    state.detected = true;
    state.landmarks = newLandmarks;
    state.confidence = 1.0;

    const wrist = newLandmarks[WRIST];
    const middleMcp = newLandmarks[MIDDLE_MCP];
    const thumbTip = newLandmarks[THUMB_TIP];
    const thumbMcp = newLandmarks[THUMB_MCP];
    const indexPip = newLandmarks[INDEX_PIP];
    const indexTip = newLandmarks[INDEX_TIP];
    const middlePip = newLandmarks[MIDDLE_PIP];
    const middleTip = newLandmarks[MIDDLE_TIP];
    const ringTip = newLandmarks[RING_TIP];
    const pinkyTip = newLandmarks[PINKY_TIP];

    // ─── 1. Precision Pinch (Thumb Tip 4 -> Index Tip 8) ───
    const rawPinchDist = dist2D(thumbTip, indexTip);
    state.pinchDistance = lerp(state.pinchDistance, rawPinchDist, LERP_FACTOR);

    // ─── 2. Continuous Grip Strength (0.0 -> 1.0) ───
    const avgTipDist = (
        dist2D(indexTip, wrist) +
        dist2D(middleTip, wrist) +
        dist2D(ringTip, wrist) +
        dist2D(pinkyTip, wrist)
    ) * 0.25;
    const rawGrip = Math.max(0, Math.min(1, (0.35 - avgTipDist) / 0.17));
    state.gripStrength = lerp(state.gripStrength, rawGrip, LERP_FACTOR);

    // ─── 3. Pitch Angle ───
    const dPitchY = middleMcp.y - wrist.y;
    const dPitchZ = (middleMcp.z || 0) - (wrist.z || 0);
    state.pitchAngle = lerp(state.pitchAngle, Math.atan2(dPitchZ, -dPitchY), LERP_FACTOR);

    // ─── 3.5. Nhận diện duỗi từng ngón tay theo chuẩn giải phẫu (Finger Extensions) ───
    const isFingerExtended = (tip: HandLandmark, pip: HandLandmark, mcp: HandLandmark) => {
        const dWristTip = dist2D(tip, wrist);
        const dWristPip = dist2D(pip, wrist);
        const dMcpTip = dist2D(tip, mcp);
        const dMcpPip = dist2D(pip, mcp);
        // Ngón duỗi khi:
        // 1. Tip xa cổ tay hơn Pip VÀ Tip xa khớp gốc MCP hơn Pip
        // 2. Hoặc khi bàn tay dựng đứng, đầu ngón tay nhô cao hơn rõ rệt
        const isFarther = dWristTip > dWristPip * 1.04 && dMcpTip > dMcpPip * 1.12;
        const isPointingUp = middleMcp.y < wrist.y && tip.y < pip.y - 0.02 && dWristTip > dWristPip;
        return isFarther || isPointingUp;
    };

    // Ngón trỏ (Index: tip 8, pip 6, mcp 5)
    const isIndexExt = isFingerExtended(indexTip, indexPip, newLandmarks[INDEX_MCP]);
    // Ngón giữa (Middle: tip 12, pip 10, mcp 9)
    const isMiddleExt = isFingerExtended(middleTip, middlePip, middleMcp);
    // Ngón áp út (Ring: tip 16, pip 14, mcp 13)
    const isRingExt = isFingerExtended(ringTip, newLandmarks[RING_PIP], newLandmarks[RING_MCP]);
    // Ngón út (Pinky: tip 20, pip 18, mcp 17)
    const isPinkyExt = isFingerExtended(pinkyTip, newLandmarks[PINKY_PIP], newLandmarks[PINKY_MCP]);
    // Ngón cái (Thumb: tip 4, ip 3, mcp 2)
    const isThumbExt = dist2D(thumbTip, newLandmarks[THUMB_MCP]) > dist2D(newLandmarks[THUMB_IP], newLandmarks[THUMB_MCP]) * 1.08;

    state.isIndexExtended = isIndexExt;
    state.isMiddleExtended = isMiddleExt;
    state.isRingExtended = isRingExt;
    state.isPinkyExtended = isPinkyExt;
    state.isThumbExtended = isThumbExt;

    let extCount = 0;
    if (isIndexExt) extCount++;
    if (isMiddleExt) extCount++;
    if (isRingExt) extCount++;
    if (isPinkyExt) extCount++;
    if (isThumbExt) extCount++;
    state.extendedFingersCount = extCount;

    // ─── 4. Gesture Recognition ───
    const newGesture = recognizeGesture(newLandmarks, state, now, rawPinchDist, state.gripStrength);

    if (newGesture === "GRAB" && !state.isHolding && state.gesture !== "GRAB") {
        state.isHolding = true;
    }
    if (newGesture === "OPEN" && state.isHolding) {
        state.isHolding = false;
        state.heldObjectId = null;
    }

    state.gesture = newGesture;
    state.wristAngle = calcWristAngle(newLandmarks);

    // ─── Ánh xạ tọa độ 3D chuẩn xác đồng bộ với bàn thí nghiệm ───
    // 1. Palm Position: Trọng tâm cấu trúc xương bàn tay (Wrist 0 + các khớp gốc 5, 9, 13, 17)
    // Cố định ổn định tuyệt đối, không bị dịch chuyển giật cục khi các ngón tay gập/duỗi
    const palmLmX = (wrist.x + newLandmarks[5].x + newLandmarks[9].x + newLandmarks[13].x + newLandmarks[17].x) * 0.2;
    const palmLmY = (wrist.y + newLandmarks[5].y + newLandmarks[9].y + newLandmarks[13].y + newLandmarks[17].y) * 0.2;

    // X: Trục ngang bàn thí nghiệm (-0.9m đến +0.9m)
    const palmX = -(palmLmX - 0.5) * 1.8;
    // Y: Trục thẳng đứng bàn thí nghiệm
    const targetY = (1.0 - palmLmY) * 0.85 - 0.20;
    const palmY = Math.max(-0.04, Math.min(0.70, targetY));
    // Z: Khi vươn tay ra (lm.z âm) -> tiến sâu vào bàn; khi rụt tay về (lm.z dương) -> lùi về người chơi
    const palmZ = 0.35 + (wrist.z || 0) * 0.95;

    // Bộ lọc chống rung Deadband: Nếu rung giật vi sai cảm biến < 4mm thì triệt tiêu hoàn toàn
    const dPalm = Math.hypot(palmX - state.palmPos[0], palmY - state.palmPos[1]);
    const palmLerpFactor = dPalm < 0.004 ? 0 : Math.min(1, LERP_FACTOR * 1.6);
    if (palmLerpFactor > 0) {
        state.palmPos[0] = lerp(state.palmPos[0], palmX, palmLerpFactor);
        state.palmPos[1] = lerp(state.palmPos[1], palmY, palmLerpFactor);
        state.palmPos[2] = lerp(state.palmPos[2], palmZ, palmLerpFactor);
    }

    // 2. Pinch Center
    const pinchMidLmX = (thumbTip.x + indexTip.x) * 0.5;
    const pinchMidLmY = (thumbTip.y + indexTip.y) * 0.5;
    const pinchX = -(pinchMidLmX - 0.5) * 1.8;
    const pinchTargetY = (1.0 - pinchMidLmY) * 0.85 - 0.20;
    const pinchY = Math.max(-0.04, Math.min(0.70, pinchTargetY));
    const pinchZ = palmZ;

    state.pinchPos[0] = lerp(state.pinchPos[0], pinchX, LERP_FACTOR);
    state.pinchPos[1] = lerp(state.pinchPos[1], pinchY, LERP_FACTOR);
    state.pinchPos[2] = lerp(state.pinchPos[2], pinchZ, LERP_FACTOR);

    // 3. Cursor Position
    const curX = -(indexTip.x - 0.5) * 1.8;
    const curTargetY = (1.0 - indexTip.y) * 0.85 - 0.20;
    const curY = Math.max(-0.04, Math.min(0.70, curTargetY));
    const curZ = palmZ;

    state.cursorX = lerp(state.cursorX, curX, LERP_FACTOR);
    state.cursorY = lerp(state.cursorY, curY, LERP_FACTOR);
    state.cursorZ = lerp(state.cursorZ, curZ, LERP_FACTOR);

    state.lastUpdateTime = now;
}

/**
 * Cập nhật tổng thể cho 2 bàn tay (Dual-Hand Tracking) từ kết quả detectForVideo của MediaPipe
 */
export function updateMultiHandState(
    mainState: HandState,
    results: any,
    now: number
): void {
    if (!results || !results.landmarks || results.landmarks.length === 0) {
        updateSingleHand(mainState.leftHand, null, now);
        updateSingleHand(mainState.rightHand, null, now);
        updateSingleHand(mainState, null, now);
        mainState.activeHandsCount = 0;
        return;
    }

    const count = results.landmarks.length;
    mainState.activeHandsCount = count;

    let leftAssigned = false;
    let rightAssigned = false;

    for (let i = 0; i < count; i++) {
        const rawLm: HandLandmark[] = results.landmarks[i].map(
            (lm: { x: number; y: number; z: number }) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
            })
        );

        // Xác định tay trái hay tay phải:
        // MediaPipe handednesses: categoryName là "Left" hoặc "Right"
        // Trong webcam mirror (selfie camera), tay thực bên trái người dùng xuất hiện bên phải màn hình
        const handednessObj = results.handednesses?.[i]?.[0];
        const category = handednessObj?.categoryName;

        let isLeft = false;
        if (category === "Left") {
            isLeft = true;
        } else if (category === "Right") {
            isLeft = false;
        } else {
            // Fallback theo vị trí x màn hình
            isLeft = rawLm[WRIST].x > 0.5;
        }

        if (isLeft && !leftAssigned) {
            updateSingleHand(mainState.leftHand, rawLm, now);
            mainState.leftHand.handedness = "Left";
            leftAssigned = true;
        } else if (!rightAssigned) {
            updateSingleHand(mainState.rightHand, rawLm, now);
            mainState.rightHand.handedness = "Right";
            rightAssigned = true;
        } else if (!leftAssigned) {
            updateSingleHand(mainState.leftHand, rawLm, now);
            mainState.leftHand.handedness = "Left";
            leftAssigned = true;
        }
    }

    if (!leftAssigned) updateSingleHand(mainState.leftHand, null, now);
    if (!rightAssigned) updateSingleHand(mainState.rightHand, null, now);

    // Đồng bộ tay chính (Primary / Backward Compatibility):
    // Ưu tiên tay đang cầm (GRAB/POUR), hoặc tay phải, hoặc tay nào đang detected
    let primaryHand: SingleHandData = mainState.rightHand;
    if (mainState.leftHand.isHolding || mainState.leftHand.gesture === "GRAB") {
        primaryHand = mainState.leftHand;
    } else if (mainState.rightHand.detected) {
        primaryHand = mainState.rightHand;
    } else if (mainState.leftHand.detected) {
        primaryHand = mainState.leftHand;
    }

    mainState.detected = primaryHand.detected;
    mainState.handedness = primaryHand.handedness;
    mainState.landmarks = primaryHand.landmarks;
    mainState.gesture = primaryHand.gesture;
    mainState.cursorX = primaryHand.cursorX;
    mainState.cursorY = primaryHand.cursorY;
    mainState.cursorZ = primaryHand.cursorZ;
    mainState.palmPos = primaryHand.palmPos;
    mainState.wristAngle = primaryHand.wristAngle;
    mainState.confidence = primaryHand.confidence;
    mainState.lastUpdateTime = primaryHand.lastUpdateTime;
    mainState.isHolding = primaryHand.isHolding;
    mainState.heldObjectId = primaryHand.heldObjectId;
    mainState.pinchDistance = primaryHand.pinchDistance;
    mainState.gripStrength = primaryHand.gripStrength;
    mainState.pinchPos = primaryHand.pinchPos;
    mainState.pitchAngle = primaryHand.pitchAngle;
    mainState.isPinkyExtended = primaryHand.isPinkyExtended;
    mainState.isIndexExtended = primaryHand.isIndexExtended;
    mainState.isMiddleExtended = primaryHand.isMiddleExtended;
    mainState.isRingExtended = primaryHand.isRingExtended;
    mainState.isThumbExtended = primaryHand.isThumbExtended;
    mainState.extendedFingersCount = primaryHand.extendedFingersCount;
}

/**
 * Backward compatibility function for single-hand caller
 */
export function updateHandState(
    state: HandState,
    newLandmarks: HandLandmark[] | null,
    now: number
): void {
    if (newLandmarks) {
        updateMultiHandState(state, { landmarks: [newLandmarks] }, now);
    } else {
        updateMultiHandState(state, null, now);
    }
}

// ─── Magnetic Snap ───

export interface SnapTarget {
    id: string;
    x: number;
    y: number;
    z: number;
    radius: number;
}

export function applyMagneticSnap(
    cursorX: number,
    cursorY: number,
    cursorZ: number,
    targets: SnapTarget[],
    snapStrength: number = 0.3
): { x: number; y: number; z: number; snappedId: string | null } {
    let closestDist = Infinity;
    let closestTarget: SnapTarget | null = null;

    for (const target of targets) {
        const dx = cursorX - target.x;
        const dy = cursorY - target.y;
        const dz = cursorZ - target.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < target.radius && dist < closestDist) {
            closestDist = dist;
            closestTarget = target;
        }
    }

    if (closestTarget) {
        return {
            x: lerp(cursorX, closestTarget.x, snapStrength),
            y: lerp(cursorY, closestTarget.y, snapStrength),
            z: lerp(cursorZ, closestTarget.z, snapStrength),
            snappedId: closestTarget.id,
        };
    }

    return { x: cursorX, y: cursorY, z: cursorZ, snappedId: null };
}
