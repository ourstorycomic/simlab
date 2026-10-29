"use client";

/**
 * ─── Lab3DAITeacher ───
 * Mô hình Cô Giáo AI Hoạt Hình Anime/Pixar Cao Cấp (Charming Anime Science Teacher):
 * - Tạo hình Anime 3D sống động: Đôi mắt to tròn long lanh, má hồng đào, nụ cười thân thiện
 * - Tự động chớp mắt (Blinking Animation) và đung đưa nhịp thở tự nhiên như người thật
 * - Mái tóc nâu hạt dẻ bồng bềnh buộc đuôi ngựa kèm nơ xanh ngọc thanh lịch
 * - Trang phục chuẩn Cô giáo Hóa học: Áo Blouse trắng phòng thí nghiệm có ve áo và bảng tên SimLab
 * - Đeo kính cận gọng vàng trí thức, tay cầm máy tính bảng hiển thị công thức phân tử
 * - Cử chỉ tay hướng dẫn sinh động theo từng tình huống thí nghiệm
 */

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Lab3DAITeacherProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
    message?: string | null;
    mode?: "idle" | "speaking" | "warning" | "success";
}

export default function Lab3DAITeacher({
    position = [2.05, 0.15, 0.2],
    rotation = [0, -0.42, 0],
    scale = 1.0,
    message = null,
    mode = "idle",
}: Lab3DAITeacherProps) {
    const groupRef = useRef<THREE.Group>(null);
    const headGroupRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const ponytailRef = useRef<THREE.Group>(null);
    const leftEyeRef = useRef<THREE.Group>(null);
    const rightEyeRef = useRef<THREE.Group>(null);

    // ─── Cartoon & Anime Materials ───
    const mats = useMemo(() => {
        return {
            skin: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#ffe0d2"), // Da anime trắng hồng tự nhiên
                roughness: 0.45,
                metalness: 0.02,
            }),
            blush: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#fda4af"), // Má hồng đào dễ thương
                transparent: true,
                opacity: 0.6,
            }),
            hair: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#4a2818"), // Tóc nâu hạt dẻ óng ả
                roughness: 0.4,
                metalness: 0.08,
            }),
            hairRibbon: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#06b6d4"), // Nơ buộc tóc xanh ngọc
                roughness: 0.3,
            }),
            labCoat: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#ffffff"), // Áo blouse trắng tinh
                roughness: 0.35,
                metalness: 0.02,
            }),
            coatTrim: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#38bdf8"), // Viền áo blouse xanh ngọc
                roughness: 0.3,
            }),
            innerShirt: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#fce7f3"), // Áo sơ mi bên trong màu hồng pastel
                roughness: 0.4,
            }),
            skirt: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#1e293b"), // Chân váy bút chì xanh navy sẫm
                roughness: 0.45,
                metalness: 0.05,
            }),
            belt: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0f172a"),
                roughness: 0.3,
            }),
            buckle: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f59e0b"), // Mặt khóa mạ vàng
                metalness: 0.85,
                roughness: 0.2,
            }),
            glassesFrame: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#d97706"), // Gọng kính vàng hổ phách
                metalness: 0.8,
                roughness: 0.2,
            }),
            glassesLens: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#ffffff"),
                transparent: true,
                opacity: 0.25,
                roughness: 0.1,
            }),
            shoes: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0f172a"),
                roughness: 0.25,
            }),
            tablet: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0284c7"),
                roughness: 0.25,
                metalness: 0.4,
            }),
            tabletScreen: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#38bdf8"),
            }),
            lips: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#fb7185"), // Môi hồng đào rạng rỡ
                roughness: 0.25,
            }),
            sclera: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#ffffff"),
            }),
            iris: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#2563eb"), // Mắt xanh sapphire lấp lánh
                emissive: new THREE.Color("#1d4ed8"),
                emissiveIntensity: 0.35,
                roughness: 0.15,
            }),
            pupil: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#090d16"),
            }),
            highlight: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#ffffff"),
            }),
            eyebrow: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#3b1f11"),
            }),
            eyelash: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#1e110a"),
            }),
            badge: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0284c7"),
                metalness: 0.5,
                roughness: 0.2,
            }),
        };
    }, []);

    // ─── Subtle Human Breathing, Eye Blinking & Gestures ───
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        // 1. Nhịp thở cơ thể
        if (groupRef.current) {
            groupRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.007;
        }

        // 2. Đầu nghiêng nhẹ biểu cảm
        if (headGroupRef.current) {
            headGroupRef.current.rotation.y = -0.3 + Math.sin(t * 1.1) * 0.04;
            headGroupRef.current.rotation.x = 0.04 + Math.cos(t * 1.4) * 0.02;
            headGroupRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;
        }

        // 3. Đuôi tóc đung đưa theo cử chỉ
        if (ponytailRef.current) {
            ponytailRef.current.rotation.x = 0.28 + Math.sin(t * 1.8) * 0.06;
            ponytailRef.current.rotation.z = Math.cos(t * 1.1) * 0.04;
        }

        // 4. Cơ chế tự động chớp mắt (Blink every 3.8s)
        const blinkCycle = t % 3.8;
        const isBlinking = blinkCycle > 3.65 && blinkCycle < 3.78;
        const eyeScaleY = isBlinking ? 0.08 : 1.0;
        if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;

        // 5. Cánh tay phải cử chỉ giảng dạy
        if (rightArmRef.current) {
            if (mode === "speaking" || mode === "success") {
                rightArmRef.current.rotation.z = -0.55 + Math.sin(t * 2.8) * 0.14;
                rightArmRef.current.rotation.x = -0.32 + Math.cos(t * 2.0) * 0.1;
            } else {
                rightArmRef.current.rotation.z = -0.22 + Math.sin(t * 1.1) * 0.03;
                rightArmRef.current.rotation.x = -0.16;
            }
        }
    });

    return (
        <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
            {/* ─── 1. THÂN VÀ ÁO BLOUSE PHÒNG LAB (Lab Coat) ─── */}
            {/* Áo Blouse trắng dáng dài qua hông */}
            <mesh position={[0, 0.44, 0]}>
                <cylinderGeometry args={[0.17, 0.19, 0.54, 24]} />
                <primitive object={mats.labCoat} />
            </mesh>

            {/* Ve áo Blouse bẻ gập chữ V (Lapel) */}
            <mesh position={[-0.05, 0.62, 0.09]} rotation={[0.2, 0.25, -0.2]}>
                <boxGeometry args={[0.08, 0.16, 0.02]} />
                <primitive object={mats.labCoat} />
            </mesh>
            <mesh position={[0.05, 0.62, 0.09]} rotation={[0.2, -0.25, 0.2]}>
                <boxGeometry args={[0.08, 0.16, 0.02]} />
                <primitive object={mats.labCoat} />
            </mesh>

            {/* Áo sơ mi trong cổ đức hồng pastel */}
            <mesh position={[0, 0.64, 0.075]}>
                <boxGeometry args={[0.09, 0.14, 0.02]} />
                <primitive object={mats.innerShirt} />
            </mesh>
            {/* Nơ cà vạt cổ áo dễ thương */}
            <mesh position={[0, 0.67, 0.095]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.035, 0.035, 0.01]} />
                <primitive object={mats.hairRibbon} />
            </mesh>

            {/* Túi áo ngực có thẻ tên SimLab AI Teacher và 2 cây bút */}
            <group position={[0.09, 0.55, 0.14]} rotation={[0.05, -0.2, 0]}>
                {/* Miệng túi áo */}
                <mesh>
                    <boxGeometry args={[0.065, 0.045, 0.01]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Thẻ tên SimLab */}
                <mesh position={[0, -0.015, 0.006]}>
                    <planeGeometry args={[0.05, 0.025]} />
                    <primitive object={mats.badge} />
                </mesh>
                {/* 2 Nắp bút cài túi (Xanh & Đỏ) */}
                <mesh position={[-0.015, 0.026, 0]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
                    <meshStandardMaterial color="#0284c7" />
                </mesh>
                <mesh position={[0.012, 0.026, 0]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
                    <meshStandardMaterial color="#e11d48" />
                </mesh>
            </group>

            {/* ─── 2. THẮT LƯNG & CHÂN VÁY BÚT CHÌ (Skirt) ─── */}
            <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.155, 0.155, 0.04, 20]} />
                <primitive object={mats.belt} />
            </mesh>
            <mesh position={[0, 0.22, 0.156]}>
                <boxGeometry args={[0.045, 0.035, 0.01]} />
                <primitive object={mats.buckle} />
            </mesh>

            {/* Chân váy bút chì xanh navy thanh lịch */}
            <mesh position={[0, -0.06, 0]}>
                <cylinderGeometry args={[0.15, 0.13, 0.52, 20]} />
                <primitive object={mats.skirt} />
            </mesh>

            {/* Đôi chân thon thả & Giày cao gót */}
            <mesh position={[-0.06, -0.42, 0]}>
                <cylinderGeometry args={[0.035, 0.03, 0.35, 16]} />
                <primitive object={mats.skin} />
            </mesh>
            <mesh position={[0.06, -0.42, 0]}>
                <cylinderGeometry args={[0.035, 0.03, 0.35, 16]} />
                <primitive object={mats.skin} />
            </mesh>
            <mesh position={[-0.06, -0.62, 0.04]}>
                <boxGeometry args={[0.055, 0.05, 0.14]} />
                <primitive object={mats.shoes} />
            </mesh>
            <mesh position={[0.06, -0.62, 0.04]}>
                <boxGeometry args={[0.055, 0.05, 0.14]} />
                <primitive object={mats.shoes} />
            </mesh>

            {/* ─── 3. CỔ VÀ ĐẦU ANIME (Anime Cute Head & Hair) ─── */}
            {/* Cổ tròn nối liền vững chắc từ ngực áo lên đáy đầu */}
            <mesh position={[0, 0.73, 0]}>
                <cylinderGeometry args={[0.045, 0.054, 0.15, 20]} />
                <primitive object={mats.skin} />
            </mesh>

            {/* Cổ áo Blouse trắng thanh lịch ôm quanh chân cổ che mọi khe hở */}
            <mesh position={[0, 0.69, 0.015]} rotation={[-0.1, 0, 0]}>
                <torusGeometry args={[0.065, 0.018, 12, 28, Math.PI * 1.6]} />
                <primitive object={mats.labCoat} />
            </mesh>

            <group ref={headGroupRef} position={[0, 0.86, 0]}>
                {/* Khuôn mặt thanh tú chuẩn Anime tròn trịa, cân đối */}
                <mesh position={[0, 0, 0]} scale={[0.96, 1.04, 0.98]}>
                    <sphereGeometry args={[0.135, 32, 32]} />
                    <primitive object={mats.skin} />
                </mesh>

                {/* Cằm tròn mềm mại chuẩn Anime (không dùng hình nón sắc cạnh) */}
                <mesh position={[0, -0.065, 0.038]} scale={[0.82, 0.7, 0.8]}>
                    <sphereGeometry args={[0.07, 24, 24]} />
                    <primitive object={mats.skin} />
                </mesh>

                {/* 2 Vệt má hồng đào (Blush) ngọt ngào */}
                <mesh position={[-0.075, -0.015, 0.118]} rotation={[0, -0.38, 0]}>
                    <circleGeometry args={[0.024, 16]} />
                    <primitive object={mats.blush} />
                </mesh>
                <mesh position={[0.075, -0.015, 0.118]} rotation={[0, 0.38, 0]}>
                    <circleGeometry args={[0.024, 16]} />
                    <primitive object={mats.blush} />
                </mesh>

                {/* Nụ cười duyên dáng thanh lịch chuẩn Anime (Smooth smile arc) */}
                <group position={[0, -0.038, 0.134]} rotation={[0, 0, Math.PI]}>
                    <mesh>
                        <torusGeometry args={[0.015, 0.0022, 8, 20, Math.PI]} />
                        <primitive object={mats.lips} />
                    </mesh>
                </group>

                {/* Mũi anime nhỏ nhắn thanh tú */}
                <mesh position={[0, -0.008, 0.14]}>
                    <sphereGeometry args={[0.0045, 12, 12]} />
                    <primitive object={mats.skin} />
                </mesh>

                {/* ─── Đôi Mắt Anime To Tròn Lấp Lánh Có Cơ Chế Chớp Mắt ─── */}
                {/* Mắt Trái */}
                <group ref={leftEyeRef} position={[-0.048, 0.022, 0.132]} rotation={[0, -0.12, 0]}>
                    {/* Tròng trắng */}
                    <mesh>
                        <circleGeometry args={[0.023, 24]} />
                        <primitive object={mats.sclera} />
                    </mesh>
                    {/* Đồng tử xanh Sapphire */}
                    <mesh position={[0, 0, 0.002]}>
                        <circleGeometry args={[0.016, 20]} />
                        <primitive object={mats.iris} />
                    </mesh>
                    {/* Con ngươi đen */}
                    <mesh position={[0, 0, 0.003]}>
                        <circleGeometry args={[0.0085, 16]} />
                        <primitive object={mats.pupil} />
                    </mesh>
                    {/* Đốm sáng phản chiếu mắt (Eye Sparkle) */}
                    <mesh position={[-0.005, 0.005, 0.004]}>
                        <circleGeometry args={[0.004, 12]} />
                        <primitive object={mats.highlight} />
                    </mesh>
                    <mesh position={[0.004, -0.003, 0.004]}>
                        <circleGeometry args={[0.002, 12]} />
                        <primitive object={mats.highlight} />
                    </mesh>
                    {/* Hàng mi trên cong vút */}
                    <mesh position={[0, 0.023, 0.005]}>
                        <boxGeometry args={[0.042, 0.0045, 0.002]} />
                        <primitive object={mats.eyelash} />
                    </mesh>
                    {/* Lông mày thanh tú */}
                    <mesh position={[0, 0.038, 0.005]} rotation={[0, 0, 0.08]}>
                        <boxGeometry args={[0.036, 0.0032, 0.002]} />
                        <primitive object={mats.eyebrow} />
                    </mesh>
                </group>

                {/* Mắt Phải */}
                <group ref={rightEyeRef} position={[0.048, 0.022, 0.132]} rotation={[0, 0.12, 0]}>
                    {/* Tròng trắng */}
                    <mesh>
                        <circleGeometry args={[0.023, 24]} />
                        <primitive object={mats.sclera} />
                    </mesh>
                    {/* Đồng tử xanh Sapphire */}
                    <mesh position={[0, 0, 0.002]}>
                        <circleGeometry args={[0.016, 20]} />
                        <primitive object={mats.iris} />
                    </mesh>
                    {/* Con ngươi đen */}
                    <mesh position={[0, 0, 0.003]}>
                        <circleGeometry args={[0.0085, 16]} />
                        <primitive object={mats.pupil} />
                    </mesh>
                    {/* Đốm sáng phản chiếu mắt (Eye Sparkle) */}
                    <mesh position={[-0.005, 0.005, 0.004]}>
                        <circleGeometry args={[0.004, 12]} />
                        <primitive object={mats.highlight} />
                    </mesh>
                    <mesh position={[0.004, -0.003, 0.004]}>
                        <circleGeometry args={[0.002, 12]} />
                        <primitive object={mats.highlight} />
                    </mesh>
                    {/* Hàng mi trên cong vút */}
                    <mesh position={[0, 0.023, 0.005]}>
                        <boxGeometry args={[0.042, 0.0045, 0.002]} />
                        <primitive object={mats.eyelash} />
                    </mesh>
                    {/* Lông mày thanh tú */}
                    <mesh position={[0, 0.038, 0.005]} rotation={[0, 0, -0.08]}>
                        <boxGeometry args={[0.036, 0.0032, 0.002]} />
                        <primitive object={mats.eyebrow} />
                    </mesh>
                </group>

                {/* Đôi kính cận gọng mỏng màu vàng hổ phách trí thức */}
                <group position={[0, 0.02, 0.144]}>
                    <mesh position={[-0.05, 0, 0]}>
                        <torusGeometry args={[0.027, 0.0028, 8, 20]} />
                        <primitive object={mats.glassesFrame} />
                    </mesh>
                    <mesh position={[0.05, 0, 0]}>
                        <torusGeometry args={[0.027, 0.0028, 8, 20]} />
                        <primitive object={mats.glassesFrame} />
                    </mesh>
                    <mesh position={[0, 0.008, 0]}>
                        <boxGeometry args={[0.026, 0.0028, 0.0028]} />
                        <primitive object={mats.glassesFrame} />
                    </mesh>
                    {/* Tròng kính trong suốt phản chiếu nhẹ */}
                    <mesh position={[-0.05, 0, 0]}>
                        <circleGeometry args={[0.025, 16]} />
                        <primitive object={mats.glassesLens} />
                    </mesh>
                    <mesh position={[0.05, 0, 0]}>
                        <circleGeometry args={[0.025, 16]} />
                        <primitive object={mats.glassesLens} />
                    </mesh>
                </group>

                {/* ─── MÁI TÓC ANIME NHIỀU LỚP BỒNG BỀNH (Anime Hair) ─── */}
                {/* Vòm tóc sau đầu */}
                <mesh position={[0, 0.04, -0.03]}>
                    <sphereGeometry args={[0.145, 24, 24]} />
                    <primitive object={mats.hair} />
                </mesh>
                {/* Mái tóc búp bê cong mềm mại ôm trán */}
                <mesh position={[0, 0.078, 0.105]} rotation={[0.32, 0, 0]} scale={[1.1, 0.65, 0.4]}>
                    <sphereGeometry args={[0.068, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <primitive object={mats.hair} />
                </mesh>
                <mesh position={[-0.048, 0.072, 0.102]} rotation={[0.28, -0.2, -0.12]} scale={[0.85, 0.75, 0.35]}>
                    <sphereGeometry args={[0.062, 18, 18]} />
                    <primitive object={mats.hair} />
                </mesh>
                <mesh position={[0.048, 0.072, 0.102]} rotation={[0.28, 0.2, 0.12]} scale={[0.85, 0.75, 0.35]}>
                    <sphereGeometry args={[0.062, 18, 18]} />
                    <primitive object={mats.hair} />
                </mesh>

                {/* 2 Lọn tóc mai mềm mại ôm hai bên má */}
                <mesh position={[-0.12, -0.01, 0.04]} rotation={[0.1, -0.12, -0.15]} scale={[0.55, 1.3, 0.55]}>
                    <sphereGeometry args={[0.026, 14, 14]} />
                    <primitive object={mats.hair} />
                </mesh>
                <mesh position={[0.12, -0.01, 0.04]} rotation={[0.1, 0.12, 0.15]} scale={[0.55, 1.3, 0.55]}>
                    <sphereGeometry args={[0.026, 14, 14]} />
                    <primitive object={mats.hair} />
                </mesh>

                {/* Đuôi tóc buộc cao (Ponytail) với Nơ xanh ngọc */}
                <group ref={ponytailRef} position={[0, 0.08, -0.15]}>
                    {/* Nơ buộc tóc to đẹp */}
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.026, 14, 14]} />
                        <primitive object={mats.hairRibbon} />
                    </mesh>
                    <mesh position={[-0.035, 0.015, 0]} rotation={[0, 0, 0.3]}>
                        <coneGeometry args={[0.022, 0.05, 12]} />
                        <primitive object={mats.hairRibbon} />
                    </mesh>
                    <mesh position={[0.035, 0.015, 0]} rotation={[0, 0, -0.3]}>
                        <coneGeometry args={[0.022, 0.05, 12]} />
                        <primitive object={mats.hairRibbon} />
                    </mesh>
                    {/* Đuôi tóc uốn lượn mềm mại buông xuống */}
                    <mesh position={[0, -0.14, -0.04]} rotation={[0.38, 0, 0]}>
                        <cylinderGeometry args={[0.035, 0.012, 0.3, 16]} />
                        <primitive object={mats.hair} />
                    </mesh>
                </group>
            </group>

            {/* ─── 4. CÁNH TAY PHẢI: CỬ CHỈ GIẢNG BÀI (Seamless Connected Right Arm) ─── */}
            <group ref={rightArmRef} position={[0.17, 0.62, 0.02]}>
                {/* Khớp vai áo blouse tròn trịa nối liền vào thân */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.052, 16, 16]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Bắp tay áo blouse */}
                <mesh position={[0.02, -0.11, 0]}>
                    <cylinderGeometry args={[0.046, 0.042, 0.22, 16]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Khớp khuỷu tay */}
                <mesh position={[0.03, -0.22, 0.02]}>
                    <sphereGeometry args={[0.042, 14, 14]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Cẳng tay hướng về phía bàn thí nghiệm */}
                <mesh position={[0.05, -0.31, 0.08]} rotation={[0.45, 0.1, -0.15]}>
                    <cylinderGeometry args={[0.038, 0.034, 0.2, 16]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Cổ tay lộ da trắng hồng */}
                <mesh position={[0.065, -0.39, 0.14]}>
                    <cylinderGeometry args={[0.026, 0.028, 0.05, 14]} />
                    <primitive object={mats.skin} />
                </mesh>
                {/* Bàn tay anime thanh tú chỉ ngón về phía dụng cụ thí nghiệm */}
                <group position={[0.072, -0.42, 0.17]} rotation={[0.3, 0.2, 0]}>
                    <mesh>
                        <boxGeometry args={[0.045, 0.065, 0.02]} />
                        <primitive object={mats.skin} />
                    </mesh>
                    {/* Ngón tay thanh mảnh */}
                    <mesh position={[0.01, -0.045, 0.005]} rotation={[0.2, 0, 0]}>
                        <cylinderGeometry args={[0.007, 0.006, 0.04, 10]} />
                        <primitive object={mats.skin} />
                    </mesh>
                    <mesh position={[-0.01, -0.04, 0.005]} rotation={[0.1, 0, 0]}>
                        <cylinderGeometry args={[0.007, 0.006, 0.035, 10]} />
                        <primitive object={mats.skin} />
                    </mesh>
                </group>
            </group>

            {/* ─── 5. CÁNH TAY TRÁI: ÔM MÁY TÍNH BẢNG ĐIỆN TỬ (Seamless Connected Left Arm) ─── */}
            <group position={[-0.17, 0.62, 0.02]}>
                {/* Khớp vai áo blouse tròn trịa nối liền vào thân */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.052, 16, 16]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Bắp tay áo blouse đi xuống */}
                <mesh position={[-0.02, -0.12, 0.02]}>
                    <cylinderGeometry args={[0.046, 0.042, 0.24, 16]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Khớp khuỷu tay gập về trước */}
                <mesh position={[-0.02, -0.24, 0.06]}>
                    <sphereGeometry args={[0.042, 14, 14]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Cẳng tay đưa về trước đỡ máy tính bảng */}
                <mesh position={[0.01, -0.23, 0.16]} rotation={[Math.PI / 2 - 0.2, 0.1, -0.3]}>
                    <cylinderGeometry args={[0.038, 0.034, 0.22, 16]} />
                    <primitive object={mats.labCoat} />
                </mesh>
                {/* Bàn tay đỡ mép máy tính bảng */}
                <mesh position={[0.03, -0.22, 0.27]}>
                    <sphereGeometry args={[0.026, 14, 14]} />
                    <primitive object={mats.skin} />
                </mesh>
                {/* Máy tính bảng hiển thị giao diện phân tử hóa học */}
                <group position={[0.06, -0.19, 0.29]} rotation={[0.35, -0.25, 0.15]}>
                    <mesh>
                        <boxGeometry args={[0.2, 0.26, 0.014]} />
                        <primitive object={mats.tablet} />
                    </mesh>
                    <mesh position={[0, 0, 0.009]}>
                        <planeGeometry args={[0.18, 0.23]} />
                        <primitive object={mats.tabletScreen} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}
