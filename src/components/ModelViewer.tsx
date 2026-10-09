"use client";

import React, { Suspense, useState } from "react";
import * as THREE from "three";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from "@react-three/drei";

export interface HotspotData {
    id: string;
    position: [number, number, number];
    label: string;
    description?: string;
}

function Model({ 
    url, 
    hotspots = [], 
    activeHotspot, 
    setActiveHotspot, 
    onHotspotClick, 
    onModelClick,
    showWireframe = false,
    showCrossSection = false
}: { 
    url: string; 
    hotspots: HotspotData[];
    activeHotspot: string | null;
    setActiveHotspot: (id: string | null) => void;
    onHotspotClick?: (h: HotspotData) => void;
    onModelClick: (e: ThreeEvent<MouseEvent>) => void;
    showWireframe?: boolean;
    showCrossSection?: boolean;
}) {
    const { scene } = useGLTF(url);
    const [modelTransform, setModelTransform] = React.useState<{
        scale: [number, number, number];
        position: [number, number, number];
    }>({ scale: [1, 1, 1], position: [0, 0, 0] });
    
    // State lưu tọa độ đã được "snap" vào bề mặt
    const [snappedHotspots, setSnappedHotspots] = React.useState<(HotspotData & { snappedPos?: [number, number, number] })[]>([]);

    React.useLayoutEffect(() => {
        if (!scene) return;

        const tempScene = scene.clone();
        tempScene.scale.set(1, 1, 1);
        tempScene.position.set(0, 0, 0);
        tempScene.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(tempScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        const s = 3.8 / (maxDim || 0.001);
        const pos: [number, number, number] = [-center.x * s, -center.y * s, -center.z * s];

        setModelTransform({
            scale: [s, s, s],
            position: pos,
        });

        // --- BƯỚC QUAN TRỌNG: Snap (hút) tọa độ vào bề mặt mesh ---
        // Giả lập lại cây 3D để tính toán tọa độ thế giới của mesh
        const tempModelGroup = new THREE.Group();
        tempModelGroup.scale.set(s, s, s);
        tempModelGroup.position.set(...pos);
        tempModelGroup.add(tempScene);
        tempModelGroup.updateMatrixWorld(true);

        const TOLERANCES = [0.8, 0.5, 0.2, -0.1];

        const newHotspots = hotspots.map(hotspot => {
            const target = new THREE.Vector3(...hotspot.position);
            const targetDir = target.clone().normalize();

            // Mảng lưu kết quả tốt nhất cho từng mức độ khắt khe (giống hệt logic Anatomy-Studio)
            const bestPerTolerance = TOLERANCES.map(() => ({
                vertex: new THREE.Vector3(),
                normal: new THREE.Vector3(),
                minDist: Infinity,
                found: false
            }));

            const worldMatrix = new THREE.Matrix4();
            const normalMatrix = new THREE.Matrix3();
            const v = new THREE.Vector3();
            const n = new THREE.Vector3();

            tempScene.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const posAttr = mesh.geometry.getAttribute('position');
                    const normAttr = mesh.geometry.getAttribute('normal');
                    
                    if (posAttr) {
                        worldMatrix.copy(mesh.matrixWorld);
                        normalMatrix.getNormalMatrix(worldMatrix);

                        for (let i = 0; i < posAttr.count; i++) {
                            v.fromBufferAttribute(posAttr, i).applyMatrix4(worldMatrix);
                            
                            const vLen = v.length();
                            const dot = vLen > 1e-5 ? v.dot(targetDir) / vLen : 1;
                            const dist = v.distanceToSquared(target);

                            // Kiểm tra từng mức độ khắt khe
                            for (let t = 0; t < TOLERANCES.length; t++) {
                                if (dot >= TOLERANCES[t]) {
                                    if (dist < bestPerTolerance[t].minDist) {
                                        bestPerTolerance[t].minDist = dist;
                                        bestPerTolerance[t].vertex.copy(v);
                                        bestPerTolerance[t].found = true;
                                        if (normAttr) {
                                            n.fromBufferAttribute(normAttr, i).applyMatrix3(normalMatrix).normalize();
                                            bestPerTolerance[t].normal.copy(n);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Lấy điểm gần nhất thuộc mức độ khắt khe cao nhất có tồn tại đỉnh
            const bestMatch = bestPerTolerance.find(t => t.found);

            if (bestMatch) {
                // Tránh trường hợp normal hướng vào trong
                if (bestMatch.normal.dot(bestMatch.vertex) < 0) {
                    bestMatch.normal.negate();
                }
                // Dịch điểm ra ngoài bề mặt một khoảng 0.03 để không bị lấp
                const finalPos = bestMatch.vertex.addScaledVector(bestMatch.normal, 0.03).toArray();
                return { ...hotspot, snappedPos: finalPos };
            }
            
            return { ...hotspot, snappedPos: hotspot.position };
        });

        setSnappedHotspots(newHotspots);
    }, [scene, url, hotspots]);

    // Effect áp dụng Wireframe và Cross-section
    React.useLayoutEffect(() => {
        if (!scene) return;

        // Tạo mặt cắt dọc (trục X) theo World Space
        const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = false;
                mesh.receiveShadow = false;
                
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach(mat => {
                    (mat as any).wireframe = showWireframe;
                    mat.clippingPlanes = showCrossSection ? [clipPlane] : null;
                    // Trả về FrontSide như bản gốc Anatomy Studio để tránh lỗi shadow acne
                    mat.side = THREE.FrontSide;
                    mat.needsUpdate = true;
                });
            }
        });
    }, [scene, showWireframe, showCrossSection]);

    // Hàm kiểm tra điểm hotspot có bị mặt cắt xén mất không
    const isHotspotClipped = (pos: [number, number, number] | undefined) => {
        if (!showCrossSection || !pos) return false;
        const v = new THREE.Vector3(...pos);
        // Chuyển tọa độ từ Pivot (đang xoay) ra World Space để so với clipPlane (1,0,0)
        v.applyEuler(new THREE.Euler(0.05, -0.28, 0));
        return v.x < 0; // clipPlane giữ lại phần x > 0
    };

    return (
        <group rotation={[0.05, -0.28, 0]}>
            {/* Pivot group với rotation mặc định giống hệt project gốc */}
            
            {/* Model được scale và center độc lập */}
            <group
                scale={modelTransform.scale}
                position={modelTransform.position}
            >
                <primitive object={scene} onClick={onModelClick} />
            </group>

            {/* Hotspots là thẻ con của Pivot, không bị scale bởi model */}
            {snappedHotspots.map((hotspot) => (
                <Html
                    key={hotspot.id}
                    position={hotspot.snappedPos || hotspot.position}
                    center
                    zIndexRange={[100, 0]}
                    style={{
                        display: isHotspotClipped(hotspot.snappedPos) ? 'none' : 'block'
                    }}
                >
                    <div className="relative group cursor-pointer">
                        <div 
                            className={`w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 ${activeHotspot === hotspot.id ? 'bg-emerald-500 scale-125' : 'bg-blue-500 hover:bg-emerald-400 hover:scale-110'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id);
                                if (onHotspotClick) onHotspotClick(hotspot);
                            }}
                        >
                            <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-40"></div>
                        </div>
                        {/* Tooltip chỉ hiển thị Tên (Label), phần chi tiết để bên Sidebar */}
                        <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg py-1.5 px-3 transition-all duration-200 pointer-events-none origin-bottom ${activeHotspot === hotspot.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">{hotspot.label}</h4>
                            {/* Mũi tên trỏ xuống */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700 rotate-45 -mt-1"></div>
                        </div>
                    </div>
                </Html>
            ))}
        </group>
    );
}

export default function ModelViewer({ modelUrl, hotspots = [], onHotspotClick }: { modelUrl: string, hotspots?: HotspotData[], onHotspotClick?: (h: HotspotData) => void }) {
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
    const [isAutoRotate, setIsAutoRotate] = useState(true);
    const [showWireframe, setShowWireframe] = useState(false);
    const [showCrossSection, setShowCrossSection] = useState(false);

    const handleModelClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        console.log(`[DEV] Click coord (world): [${e.point.x.toFixed(3)}, ${e.point.y.toFixed(3)}, ${e.point.z.toFixed(3)}]`);
        setActiveHotspot(null);
    };

    return (
        <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#f8fafc] dark:bg-[#0f1522] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col">
            <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ localClippingEnabled: true }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                
                <Suspense fallback={null}>
                    <Model 
                        url={modelUrl} 
                        hotspots={hotspots}
                        activeHotspot={activeHotspot}
                        setActiveHotspot={setActiveHotspot}
                        onHotspotClick={onHotspotClick}
                        onModelClick={handleModelClick} 
                        showWireframe={showWireframe}
                        showCrossSection={showCrossSection}
                    />
                    <Environment preset="city" />
                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                </Suspense>

                <OrbitControls 
                    makeDefault 
                    autoRotate={isAutoRotate} 
                    autoRotateSpeed={0.5} 
                    enableDamping 
                    dampingFactor={0.05} 
                    minDistance={1} 
                    maxDistance={10} 
                />
            </Canvas>
            
            {/* Hướng dẫn góc trên */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                    </svg>
                    Kéo để xoay 360° • Cuộn để thu phóng
                </span>
            </div>

            {/* Thanh công cụ 3D Tools (Toolbar) */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2.5">
                <button 
                    onClick={() => setIsAutoRotate(!isAutoRotate)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-sm transition-all duration-200 ${isAutoRotate ? 'bg-blue-500 border-blue-600 text-white shadow-blue-500/25' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    title="Tự động xoay"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-semibold whitespace-nowrap">Tự xoay</span>
                </button>
                <button 
                    onClick={() => setShowCrossSection(!showCrossSection)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-sm transition-all duration-200 ${showCrossSection ? 'bg-indigo-500 border-indigo-600 text-white shadow-indigo-500/25' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    title="Cắt lớp (Cross-section)"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l-7-7m7 7l-2.121 2.121M15.536 8.464a2 2 0 11-2.828-2.828 2 2 0 012.828 2.828zM8.464 15.536a2 2 0 11-2.828-2.828 2 2 0 012.828 2.828z" />
                    </svg>
                    <span className="text-sm font-semibold whitespace-nowrap">Cắt lớp</span>
                </button>
                <button 
                    onClick={() => setShowWireframe(!showWireframe)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-sm transition-all duration-200 ${showWireframe ? 'bg-violet-500 border-violet-600 text-white shadow-violet-500/25' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    title="Chế độ khung dây (Layers)"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-sm font-semibold whitespace-nowrap">Khung dây</span>
                </button>
            </div>
        </div>
    );
}

// Preload models for faster switching
useGLTF.preload("/models/brain.glb");
useGLTF.preload("/models/heart.glb");
useGLTF.preload("/models/lungs.glb");
useGLTF.preload("/models/kidneys.glb");
useGLTF.preload("/models/liver.glb");
useGLTF.preload("/models/intestine.glb");
useGLTF.preload("/models/pancreas.glb");
useGLTF.preload("/models/skin.glb");
useGLTF.preload("/models/eyeball.glb");
