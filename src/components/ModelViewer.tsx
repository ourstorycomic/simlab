"use client";

import React, { Suspense, useState, useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from "@react-three/drei";
import { createAnatomicalAtlasTexture, getInternalHotspotsForOrgan } from "@/lib/anatomicalAtlas";
import { HandState } from "@/lib/handTracking";
import { deviceSensors } from "@/lib/deviceSensors";
import Lab3DFullHandModel from "./lab3d/Lab3DFullHandModel";
import { Layers, MousePointer, Hand } from "lucide-react";

export interface HotspotData {
    id: string;
    position: [number, number, number];
    label: string;
    description?: string;
}

export type SlicePlaneType = "coronal" | "sagittal" | "axial";

export interface OrganTissueConfig {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    borderColor: string;
    specularColor: string;
    roughness: number;
    metalness: number;
    description: string;
}

export function getOrganTissueConfig(url: string): OrganTissueConfig {
    const lower = url.toLowerCase();
    if (lower.includes("heart")) {
        return {
            name: "Cơ tim (Myocardium)",
            primaryColor: "#7d141e",
            secondaryColor: "#9c2431",
            borderColor: "#3d080e",
            specularColor: "#e63946",
            roughness: 0.6,
            metalness: 0.05,
            description: "Mặt cắt mô cơ tim đặc dày, có các thớ sợi co bóp và thành cơ buồng tim."
        };
    }
    if (lower.includes("brain")) {
        return {
            name: "Nhu mô não (Cortex & White Matter)",
            primaryColor: "#cdbeb2",
            secondaryColor: "#dfd5cb",
            borderColor: "#8a7567",
            specularColor: "#f1ece6",
            roughness: 0.75,
            metalness: 0.02,
            description: "Phân tầng chất xám vỏ não ở ngoài và chất trắng giàu sợi dẫn truyền ở trong."
        };
    }
    if (lower.includes("kidney")) {
        return {
            name: "Vỏ & Tủy thận (Renal Cortex & Medulla)",
            primaryColor: "#7a2020",
            secondaryColor: "#9e3434",
            borderColor: "#420d0d",
            specularColor: "#e05353",
            roughness: 0.65,
            metalness: 0.05,
            description: "Vỏ thận chứa cuộn mao mạch lọc máu và tháp tủy thận hình nón gom nước tiểu."
        };
    }
    if (lower.includes("liver")) {
        return {
            name: "Nhu mô gan (Hepatic Parenchyma)",
            primaryColor: "#5c1f19",
            secondaryColor: "#742c23",
            borderColor: "#330e0a",
            specularColor: "#a84539",
            roughness: 0.7,
            metalness: 0.04,
            description: "Khối nhu mô gan đặc chứa mạng lưới tiểu thùy và xoang mao mạch dày đặc."
        };
    }
    if (lower.includes("lung")) {
        return {
            name: "Nhu mô phổi (Pulmonary Tissue)",
            primaryColor: "#8f3f3f",
            secondaryColor: "#ab5a5a",
            borderColor: "#4a1c1c",
            specularColor: "#d97979",
            roughness: 0.85,
            metalness: 0.02,
            description: "Mô xốp giàu phế nang đàn hồi và hệ mao mạch phế nang trao đổi dưỡng khí."
        };
    }
    if (lower.includes("pancreas")) {
        return {
            name: "Nhu mô tụy (Pancreatic Glandular)",
            primaryColor: "#a87850",
            secondaryColor: "#c2936a",
            borderColor: "#613f24",
            specularColor: "#e6b98e",
            roughness: 0.7,
            metalness: 0.03,
            description: "Mô tuyến ngoại tiết tiết enzyme tiêu hóa và tiểu đảo nội tiết tiết insulin."
        };
    }
    if (lower.includes("intestine")) {
        return {
            name: "Thành niêm mạc ruột (Intestinal Wall)",
            primaryColor: "#994747",
            secondaryColor: "#b86363",
            borderColor: "#572121",
            specularColor: "#e88080",
            roughness: 0.55,
            metalness: 0.05,
            description: "Lớp cơ trơn nhu động dày dặn và lớp niêm mạc nếp gấp giàu nhung mao hấp thụ."
        };
    }
    if (lower.includes("skin")) {
        return {
            name: "Cấu trúc vi thể da (Skin Layers)",
            primaryColor: "#cf8e69",
            secondaryColor: "#e8af8e",
            borderColor: "#875133",
            specularColor: "#ffd6be",
            roughness: 0.7,
            metalness: 0.02,
            description: "Lớp biểu bì sừng hóa bên ngoài, trung bì liên kết và mô mỡ giàu mạch máu."
        };
    }
    if (lower.includes("stomach")) {
        return {
            name: "Thành niêm mạc dạ dày (Gastric Mucosa)",
            primaryColor: "#a34e44",
            secondaryColor: "#c26d63",
            borderColor: "#57211b",
            specularColor: "#e68a80",
            roughness: 0.55,
            metalness: 0.05,
            description: "Thành dạ dày dày dặn gồm 3 lớp cơ trơn và lớp niêm mạc nếp gấp giàu tuyến tiết axit HCl và men tiêu hóa."
        };
    }
    if (lower.includes("eyeball")) {
        return {
            name: "Cấu trúc mắt (Eye Interior)",
            primaryColor: "#334155",
            secondaryColor: "#475569",
            borderColor: "#1e293b",
            specularColor: "#94a3b8",
            roughness: 0.35,
            metalness: 0.1,
            description: "Khoang dịch thủy tinh thể trong suốt bao bọc bởi màng mạch võng mạc cảm thụ."
        };
    }
    return {
        name: "Tiết diện mô học",
        primaryColor: "#7d141e",
        secondaryColor: "#9c2431",
        borderColor: "#3d080e",
        specularColor: "#e63946",
        roughness: 0.65,
        metalness: 0.05,
        description: "Mặt cắt mô đặc giải phẫu sinh học."
    };
}



function Model({ 
    url, 
    hotspots = [], 
    activeHotspot, 
    setActiveHotspot, 
    onHotspotClick, 
    onModelClick,
    showWireframe = false,
    showCrossSection = false,
    slicePlaneType = "coronal",
    sliceOffset = 0,
    sliceInverted = false
}: { 
    url: string; 
    hotspots: HotspotData[];
    activeHotspot: string | null;
    setActiveHotspot: (id: string | null) => void;
    onHotspotClick?: (h: HotspotData) => void;
    onModelClick: (e: ThreeEvent<MouseEvent>) => void;
    showWireframe?: boolean;
    showCrossSection?: boolean;
    slicePlaneType?: SlicePlaneType;
    sliceOffset?: number;
    sliceInverted?: boolean;
}) {
    const { scene } = useGLTF(url);
    const organConfig = useMemo(() => getOrganTissueConfig(url), [url]);
    const [modelTransform, setModelTransform] = useState<{
        scale: [number, number, number];
        position: [number, number, number];
    }>({ scale: [1, 1, 1], position: [0, 0, 0] });
    
    // State lưu tọa độ đã được "snap" vào bề mặt
    const [snappedHotspots, setSnappedHotspots] = useState<(HotspotData & { snappedPos?: [number, number, number] })[]>([]);

    useLayoutEffect(() => {
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

        // Snap hotspots to mesh surface
        const tempModelGroup = new THREE.Group();
        tempModelGroup.scale.set(s, s, s);
        tempModelGroup.position.set(...pos);
        tempModelGroup.add(tempScene);
        tempModelGroup.updateMatrixWorld(true);

        const TOLERANCES = [0.8, 0.5, 0.2, -0.1];

        const newHotspots = hotspots.map(hotspot => {
            const target = new THREE.Vector3(...hotspot.position);
            const targetDir = target.clone().normalize();

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

            const bestMatch = bestPerTolerance.find(t => t.found);

            if (bestMatch) {
                if (bestMatch.normal.dot(bestMatch.vertex) < 0) {
                    bestMatch.normal.negate();
                }
                const finalPos = bestMatch.vertex.addScaledVector(bestMatch.normal, 0.03).toArray();
                return { ...hotspot, snappedPos: finalPos };
            }
            
            return { ...hotspot, snappedPos: hotspot.position };
        });

        setSnappedHotspots(newHotspots);
    }, [scene, url, hotspots]);

    // Tính vector pháp tuyến theo chuẩn 3 mặt phẳng giải phẫu y khoa
    const normal = useMemo(() => {
        let v: THREE.Vector3;
        switch (slicePlaneType) {
            case "coronal":
                // Đứng ngang (Trước - Sau / Anterior-Posterior)
                v = new THREE.Vector3(0, 0, 1);
                break;
            case "sagittal":
                // Đứng dọc (Trái - Phải / Lateral)
                v = new THREE.Vector3(1, 0, 0);
                break;
            case "axial":
                // Cắt ngang (Trên - Dưới / Superior-Inferior như ảnh CT)
                v = new THREE.Vector3(0, 1, 0);
                break;
            default:
                v = new THREE.Vector3(0, 0, 1);
        }
        if (sliceInverted) {
            v.negate();
        }
        return v;
    }, [slicePlaneType, sliceInverted]);

    // Mặt phẳng cắt trong không gian cục bộ của Pivot
    const localClipPlane = useMemo(() => {
        return new THREE.Plane(normal, -sliceOffset);
    }, [normal, sliceOffset]);

    // Chuyển mặt phẳng sang World Space phù hợp góc xoay pivot [0.05, -0.28, 0]
    const worldClipPlane = useMemo(() => {
        const pivotEuler = new THREE.Euler(0.05, -0.28, 0);
        const pivotMatrix = new THREE.Matrix4().makeRotationFromEuler(pivotEuler);
        return localClipPlane.clone().applyMatrix4(pivotMatrix);
    }, [localClipPlane]);

    // Vật liệu mặt cắt giải phẫu y khoa chân thực (Medical Atlas Material) với Stencil Mask
    const capMaterial = useMemo(() => {
        if (typeof window === "undefined") return new THREE.MeshBasicMaterial();
        const texture = createAnatomicalAtlasTexture(url, slicePlaneType);

        return new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color("#ffffff"), // Giữ nguyên màu sắc rực rỡ chân thực của bản đồ giải phẫu
            roughness: 0.45,
            metalness: 0.05,
            stencilWrite: true,
            stencilRef: 0,
            stencilFunc: THREE.NotEqualStencilFunc,
            stencilFail: THREE.ReplaceStencilOp,
            stencilZFail: THREE.ReplaceStencilOp,
            stencilZPass: THREE.ReplaceStencilOp,
            side: THREE.DoubleSide,
        });
    }, [url, slicePlaneType]);

    // Geometry mặt phẳng cắt - Kích thước 4.8 x 4.8 bao trọn mọi góc xoay mô hình
    const planeGeometry = useMemo(() => new THREE.PlaneGeometry(4.8, 4.8), []);

    // Quaternion hướng mặt phẳng cắt trùng với normal
    const capQuaternion = useMemo(() => {
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        return q;
    }, [normal]);

    // Danh sách điểm giải phẫu nội quan xuất hiện ngay trên mặt cắt khi mở Cắt lớp
    const internalHotspots = useMemo(() => {
        if (!showCrossSection) return [];
        return getInternalHotspotsForOrgan(url, slicePlaneType).map(h => {
            const pos: [number, number, number] = [
                h.position[0],
                h.position[1],
                h.position[2] + normal.z * sliceOffset * 0.35
            ];
            return {
                ...h,
                snappedPos: pos,
                isInternal: true
            };
        });
    }, [showCrossSection, url, normal, sliceOffset, slicePlaneType]);

    const allDisplayHotspots = useMemo(() => {
        return [...snappedHotspots, ...internalHotspots];
    }, [snappedHotspots, internalHotspots]);

    // Effect thiết lập WebGL Stencil Capping trên các Mesh con của Model
    useLayoutEffect(() => {
        if (!scene) return;

        const STENCIL_GROUP_NAME = "__stencil_capping_group__";

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && child.name !== "__stencil_mesh__") {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = false;
                mesh.receiveShadow = false;

                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat: any) => {
                    mat.wireframe = showWireframe;
                    mat.clippingPlanes = showCrossSection ? [worldClipPlane] : null;
                    mat.clipShadows = true;
                    // DoubleSide đảm bảo không bao giờ bị hốc đen rỗng
                    mat.side = showCrossSection ? THREE.DoubleSide : THREE.FrontSide;
                    // Bảo toàn màu sắc rực rỡ chuẩn sRGB, không bị phai màu hay trắng bệch
                    if (mat.map) {
                        mat.map.colorSpace = THREE.SRGBColorSpace;
                        mat.color.set("#ffffff");
                        mat.map.needsUpdate = true;
                    } else if (organConfig?.primaryColor) {
                        mat.color.set(organConfig.primaryColor);
                    }
                    mat.needsUpdate = true;
                });

                let stencilGroup = mesh.getObjectByName(STENCIL_GROUP_NAME) as THREE.Group | undefined;
                if (showCrossSection) {
                    if (!stencilGroup) {
                        stencilGroup = new THREE.Group();
                        stencilGroup.name = STENCIL_GROUP_NAME;

                        const baseMat = new THREE.MeshBasicMaterial({
                            depthWrite: false,
                            depthTest: false,
                            colorWrite: false,
                            stencilWrite: true,
                            stencilFunc: THREE.AlwaysStencilFunc,
                        });

                        // 1. Back faces increment stencil
                        const mat0 = baseMat.clone();
                        mat0.side = THREE.BackSide;
                        mat0.stencilFail = THREE.IncrementWrapStencilOp;
                        mat0.stencilZFail = THREE.IncrementWrapStencilOp;
                        mat0.stencilZPass = THREE.IncrementWrapStencilOp;

                        // 2. Front faces decrement stencil
                        const mat1 = baseMat.clone();
                        mat1.side = THREE.FrontSide;
                        mat1.stencilFail = THREE.DecrementWrapStencilOp;
                        mat1.stencilZFail = THREE.DecrementWrapStencilOp;
                        mat1.stencilZPass = THREE.DecrementWrapStencilOp;

                        const mesh0 = new THREE.Mesh(mesh.geometry, mat0);
                        mesh0.name = "__stencil_mesh__";
                        mesh0.renderOrder = 1;
                        stencilGroup.add(mesh0);

                        const mesh1 = new THREE.Mesh(mesh.geometry, mat1);
                        mesh1.name = "__stencil_mesh__";
                        mesh1.renderOrder = 1;
                        stencilGroup.add(mesh1);

                        mesh.add(stencilGroup);
                    }

                    stencilGroup.visible = true;
                    if (stencilGroup.children[0]) {
                        ((stencilGroup.children[0] as THREE.Mesh).material as THREE.Material).clippingPlanes = [worldClipPlane];
                    }
                    if (stencilGroup.children[1]) {
                        ((stencilGroup.children[1] as THREE.Mesh).material as THREE.Material).clippingPlanes = [worldClipPlane];
                    }
                } else {
                    if (stencilGroup) {
                        stencilGroup.visible = false;
                    }
                }
            }
        });
    }, [scene, showWireframe, showCrossSection, worldClipPlane]);

    // Kiểm tra điểm hotspot có bị mặt phẳng cắt loại bỏ không (hotspots nội quan không bị clip)
    const isHotspotClipped = (h: HotspotData & { snappedPos?: [number, number, number]; isInternal?: boolean }) => {
        if (h.isInternal) return false;
        if (!showCrossSection || !h.snappedPos) return false;
        const v = new THREE.Vector3(...h.snappedPos);
        v.applyEuler(new THREE.Euler(0.05, -0.28, 0));
        return worldClipPlane.distanceToPoint(v) < 0;
    };

    return (
        <group rotation={[0.05, -0.28, 0]}>
            {/* Pivot group với rotation mặc định */}
            
            {/* Model được scale và center độc lập */}
            <group
                scale={modelTransform.scale}
                position={modelTransform.position}
            >
                <primitive object={scene} onClick={onModelClick} />
            </group>

            {/* Mặt phẳng tiết diện giải phẫu mô đặc y khoa chuẩn Atlas */}
            {showCrossSection && (
                <mesh
                    ref={(m) => {
                        if (m) {
                            (m as any).onAfterRender = (renderer: any) => {
                                if (renderer && typeof renderer.clearStencil === "function") {
                                    renderer.clearStencil();
                                }
                            };
                        }
                    }}
                    position={[normal.x * sliceOffset, normal.y * sliceOffset, normal.z * sliceOffset]}
                    quaternion={capQuaternion}
                    geometry={planeGeometry}
                    material={capMaterial}
                    renderOrder={2}
                />
            )}

            {/* Hiển thị cả điểm giải phẫu bề mặt và điểm cấu trúc nội tạng khi cắt lớp */}
            {allDisplayHotspots.map((hotspot: any) => (
                <Html
                    key={hotspot.id}
                    position={hotspot.snappedPos || hotspot.position}
                    center
                    zIndexRange={[100, 0]}
                    style={{
                        display: isHotspotClipped(hotspot) ? 'none' : 'block'
                    }}
                >
                    <div className="relative group">
                        <button
                            type="button"
                            className="p-3 -m-3 flex items-center justify-center cursor-pointer focus:outline-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id);
                                if (onHotspotClick) onHotspotClick(hotspot);
                                if (typeof window !== "undefined" && navigator.vibrate) {
                                    navigator.vibrate(25);
                                }
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id);
                                if (onHotspotClick) onHotspotClick(hotspot);
                                if (typeof window !== "undefined" && navigator.vibrate) {
                                    navigator.vibrate(25);
                                }
                            }}
                        >
                            <div 
                                className={`w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 ${
                                    activeHotspot === hotspot.id 
                                        ? 'bg-emerald-500 scale-125' 
                                        : hotspot.isInternal 
                                            ? 'bg-amber-500 hover:bg-amber-400 hover:scale-110 ring-2 ring-amber-300/50' 
                                            : 'bg-blue-500 hover:bg-emerald-400 hover:scale-110'
                                }`}
                            >
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-40 ${hotspot.isInternal ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                            </div>
                        </button>
                        <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-white dark:bg-gray-900 border ${hotspot.isInternal ? 'border-amber-400/60 dark:border-amber-600/60 shadow-amber-500/10' : 'border-gray-200 dark:border-gray-700'} shadow-xl rounded-xl py-2 px-3 transition-all duration-200 pointer-events-none origin-bottom ${activeHotspot === hotspot.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
                            {hotspot.isInternal && (
                                <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-amber-500" />
                                    <span>Cấu trúc bên trong</span>
                                </span>
                            )}
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">{hotspot.label}</h4>
                            {hotspot.description && (
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {hotspot.description}
                                </p>
                            )}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700 rotate-45 -mt-1"></div>
                        </div>
                    </div>
                </Html>
            ))}
        </group>
    );
}

interface ErrorBoundaryProps {
    fallback: React.ReactNode;
    children: React.ReactNode;
    resetKey?: string;
}

class ModelErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

function HandOrganInteraction({
    handStateRef,
    controlsRef,
}: {
    handStateRef?: React.MutableRefObject<HandState>;
    controlsRef: React.MutableRefObject<any>;
}) {
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    useFrame(() => {
        if (!handStateRef || !handStateRef.current || !controlsRef.current) return;
        const hs = handStateRef.current;
        if (!hs.detected || hs.landmarks.length < 9) {
            lastPosRef.current = null;
            return;
        }

        const lm = hs.landmarks[9] || hs.landmarks[0];
        const screenX = 1 - lm.x; // Mirrored webcam
        const screenY = lm.y;

        const isGrabbing =
            hs.gesture === "GRAB" ||
            (hs.rightHand?.gripStrength || 0) > 0.32 ||
            (hs.rightHand?.pinchDistance || 1) < 0.40 ||
            (hs.rightHand?.isIndexExtended && !hs.rightHand?.isPinkyExtended);

        if (isGrabbing) {
            if (lastPosRef.current) {
                const dx = screenX - lastPosRef.current.x;
                const dy = screenY - lastPosRef.current.y;

                if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                    const controls = controlsRef.current;
                    const camera = controls?.object;
                    const target = controls?.target;
                    if (camera && target) {
                        const offset = new THREE.Vector3().copy(camera.position).sub(target);
                        const spherical = new THREE.Spherical().setFromVector3(offset);
                        spherical.theta += dx * 4.2;
                        spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, spherical.phi - dy * 3.2));
                        offset.setFromSpherical(spherical);
                        camera.position.copy(target).add(offset);
                        camera.lookAt(target);
                        if (typeof controls.update === "function") {
                            controls.update();
                        }
                    }
                }
            }
            lastPosRef.current = { x: screenX, y: screenY };
        } else {
            lastPosRef.current = { x: screenX, y: screenY };

            // Tích hợp Cảm biến Điện thoại: Nghiêng điện thoại để xoay quan sát 360° cơ quan (Spatial Viewing)
            const sensor = deviceSensors.getData();
            if (sensor.isSupported && (Math.abs(sensor.roll) > 8 || Math.abs(sensor.pitch - 60) > 8)) {
                const controls = controlsRef.current;
                const camera = controls?.object;
                const target = controls?.target;
                if (camera && target) {
                    const rollDelta = (sensor.roll / 90) * 0.015;
                    const pitchDelta = ((sensor.pitch - 60) / 90) * 0.012;

                    const offset = new THREE.Vector3().copy(camera.position).sub(target);
                    const spherical = new THREE.Spherical().setFromVector3(offset);
                    spherical.theta += rollDelta;
                    spherical.phi = Math.max(0.12, Math.min(Math.PI - 0.12, spherical.phi - pitchDelta));
                    offset.setFromSpherical(spherical);
                    camera.position.copy(target).add(offset);
                    camera.lookAt(target);
                    if (typeof controls.update === "function") {
                        controls.update();
                    }
                }
            }
        }
    });

    return null;
}

export default function ModelViewer({
    modelUrl,
    hotspots = [],
    onHotspotClick,
    handStateRef,
}: {
    modelUrl: string;
    hotspots?: HotspotData[];
    onHotspotClick?: (h: HotspotData) => void;
    handStateRef?: React.MutableRefObject<HandState>;
}) {
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
    const [isAutoRotate, setIsAutoRotate] = useState(false);
    const [showWireframe, setShowWireframe] = useState(false);
    const [showCrossSection, setShowCrossSection] = useState(false);
    const controlsRef = useRef<any>(null);

    // Cấu hình mặt cắt giải phẫu chuẩn y khoa
    const [slicePlaneType, setSlicePlaneType] = useState<SlicePlaneType>("coronal");
    const [sliceOffset, setSliceOffset] = useState<number>(0);
    const [sliceInverted, setSliceInverted] = useState<boolean>(false);

    const organConfig = useMemo(() => getOrganTissueConfig(modelUrl), [modelUrl]);

    // Xoay camera bằng hệ tọa độ cầu (Spherical Coordinates) chuẩn Three.js 100% an toàn
    const rotateCamera = (deltaTheta: number, deltaPhi: number = 0) => {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
        const camera = controls.object;
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        if (!camera) return;

        const offset = new THREE.Vector3().copy(camera.position).sub(target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += deltaTheta;
        spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, spherical.phi + deltaPhi));
        offset.setFromSpherical(spherical);
        camera.position.copy(target).add(offset);
        camera.lookAt(target);
        if (typeof controls.update === "function") {
            controls.update();
        }
    };

    const zoomCamera = (factor: number) => {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
        const camera = controls.object;
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        if (!camera) return;

        const offset = new THREE.Vector3().copy(camera.position).sub(target);
        const currentDist = offset.length();
        const newDist = Math.max(1.0, Math.min(10.0, currentDist * factor));
        offset.setLength(newDist);
        camera.position.copy(target).add(offset);
        if (typeof controls.update === "function") {
            controls.update();
        }
    };

    // Các hàm xoay mô hình 3D chủ động (Quick Rotation Controls)
    const handleRotateLeft = () => rotateCamera(Math.PI / 8, 0);
    const handleRotateRight = () => rotateCamera(-Math.PI / 8, 0);
    const handleRotateUp = () => rotateCamera(0, -Math.PI / 12);
    const handleRotateDown = () => rotateCamera(0, Math.PI / 12);

    const handleResetCamera = () => {
        if (controlsRef.current) {
            if (typeof controlsRef.current.reset === "function") {
                try {
                    controlsRef.current.reset();
                } catch (e) {}
            }
            if (controlsRef.current.object) {
                controlsRef.current.object.position.set(0, 0, 4);
            }
            if (controlsRef.current.target) {
                controlsRef.current.target.set(0, 0, 0);
            }
            if (typeof controlsRef.current.update === "function") {
                controlsRef.current.update();
            }
        }
    };

    const handleZoomIn = () => zoomCamera(0.85);
    const handleZoomOut = () => zoomCamera(1.18);

    const handleModelClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (hotspots && hotspots.length > 0 && e.point) {
            let nearest: HotspotData | null = null;
            let minDist = Infinity;
            for (const h of hotspots) {
                const hPos = new THREE.Vector3(...h.position);
                if (e.object && (e.object as any).matrixWorld) {
                    hPos.applyMatrix4((e.object as any).matrixWorld);
                }
                const dist = e.point.distanceTo(hPos);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = h;
                }
            }
            if (nearest && minDist < 2.2) {
                setActiveHotspot(nearest.id);
                if (onHotspotClick) onHotspotClick(nearest);
                return;
            }
        }
        setActiveHotspot(null);
    };

    return (
        <div 
            className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#070b13] rounded-2xl overflow-hidden border border-slate-800 flex flex-col touch-none select-none"
            style={{ touchAction: "none" }}
        >
            <Canvas 
                camera={{ position: [0, 0, 4], fov: 45 }} 
                gl={{ localClippingEnabled: true, stencil: true, powerPreference: "high-performance" }}
                className="w-full h-full touch-none"
                style={{ touchAction: "none", width: "100%", height: "100%" }}
            >
                {/* Nền studio tối huyền bí chuẩn phòng lab giải phẫu cao cấp */}
                <color attach="background" args={["#070b13"]} />
                <fog attach="fog" args={["#070b13", 8, 25]} />

                {/* Hệ thống ánh sáng Studio rực rỡ, cân bằng, tôn vinh màu sắc giải phẫu */}
                <ambientLight intensity={0.65} />
                <directionalLight position={[5, 7, 5]} intensity={1.1} castShadow />
                <directionalLight position={[-5, -3, -3]} intensity={0.45} color="#38bdf8" />
                <pointLight position={[0, 3, 2.5]} intensity={0.7} color="#ffffff" />
                <pointLight position={[0, -3, 1.5]} intensity={0.35} color="#fda4af" />
                
                <Suspense fallback={null}>
                    <ModelErrorBoundary
                        resetKey={modelUrl}
                        fallback={
                            <Html center>
                                <div className="p-3 bg-slate-900/95 border border-amber-500/50 rounded-xl text-center backdrop-blur-md shadow-xl max-w-xs">
                                    <p className="text-amber-400 font-bold text-xs mb-1">Đang tải cấu trúc 3D</p>
                                    <p className="text-slate-400 text-[10px]">Vui lòng kiểm tra lại tài nguyên giải phẫu...</p>
                                </div>
                            </Html>
                        }
                    >
                        <Model 
                            url={modelUrl} 
                            hotspots={hotspots}
                            activeHotspot={activeHotspot}
                            setActiveHotspot={setActiveHotspot}
                            onHotspotClick={onHotspotClick}
                            onModelClick={handleModelClick} 
                            showWireframe={showWireframe}
                            showCrossSection={showCrossSection}
                            slicePlaneType={slicePlaneType}
                            sliceOffset={sliceOffset}
                            sliceInverted={sliceInverted}
                        />
                    </ModelErrorBoundary>
                    <Environment preset="city" />
                    <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4} color="#000000" />

                    {/* Bộ điều khiển tương tác cử chỉ xoay mô hình (bàn tay 3D đã hiển thị toàn cục ở Global3DHandOverlay) */}
                    {handStateRef && (
                        <HandOrganInteraction handStateRef={handStateRef} controlsRef={controlsRef} />
                    )}
                </Suspense>

                <OrbitControls 
                    ref={controlsRef}
                    makeDefault 
                    autoRotate={isAutoRotate} 
                    autoRotateSpeed={0.8} 
                    enableDamping 
                    dampingFactor={0.06} 
                    minDistance={1} 
                    maxDistance={10} 
                    touches={{
                        ONE: THREE.TOUCH.ROTATE,
                        TWO: THREE.TOUCH.DOLLY_PAN
                    }}
                />
            </Canvas>
            
            {/* Hướng dẫn thao tác nổi góc trên bên trái */}
            <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 pointer-events-none z-10 max-w-[85vw]">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-900/90 backdrop-blur-md text-slate-200 border border-slate-700/80 shadow-2xl">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                    <span className="inline-flex items-center gap-1.5">
                        <MousePointer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                        <span>Kéo để xoay 360°</span>
                        <span className="hidden sm:inline">• Cuộn thu phóng</span>
                    </span>
                    <span className="text-slate-600 hidden md:inline">|</span>
                    <span className="hidden md:inline-flex items-center gap-1.5">
                        <Hand className="w-3.5 h-3.5 text-amber-400" />
                        <span>Nắm tay di chuyển để xoay</span>
                    </span>
                </span>
            </div>

            {/* BẢNG ĐIỀU KHIỂN CẮT LỚP GIẢI PHẪU Y KHOA CHUYÊN DỤNG */}
            {showCrossSection && (
                <div 
                    className="absolute top-12 left-2.5 right-2.5 sm:top-auto sm:bottom-4 sm:left-4 sm:right-auto sm:w-80 bg-slate-900/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-indigo-500/50 z-20 transition-all duration-300 text-slate-200"
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    style={{ touchAction: "auto" }}
                >
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Cắt lớp Mô đặc Y khoa
                            </h4>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                            {organConfig.name}
                        </span>
                    </div>

                    {/* Chọn 3 mặt cắt giải phẫu quốc tế */}
                    <div className="space-y-1.5 mb-2.5">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                            <span>Mặt phẳng giải phẫu:</span>
                            <span className="text-[10px] text-slate-400">
                                {slicePlaneType === "coronal" ? "Đứng ngang (Trước/Sau)" : slicePlaneType === "sagittal" ? "Đứng dọc (Trái/Phải)" : "Cắt ngang (CT/MRI)"}
                            </span>
                        </label>
                        <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950/80 rounded-lg text-[11px] font-medium border border-slate-800">
                            <button
                                onClick={() => setSlicePlaneType("coronal")}
                                className={`py-1.5 px-1 rounded-md text-center transition-all ${
                                    slicePlaneType === "coronal"
                                        ? "bg-indigo-600 text-white shadow-sm font-bold"
                                        : "text-slate-400 hover:text-white"
                                }`}
                                title="Mặt phẳng Đứng Ngang (Coronal) - Chuẩn quan sát buồng tim & phổi"
                            >
                                Coronal
                            </button>
                            <button
                                onClick={() => setSlicePlaneType("sagittal")}
                                className={`py-1.5 px-1 rounded-md text-center transition-all ${
                                    slicePlaneType === "sagittal"
                                        ? "bg-indigo-600 text-white shadow-sm font-bold"
                                        : "text-slate-400 hover:text-white"
                                }`}
                                title="Mặt phẳng Đứng Dọc (Sagittal) - Chia đôi bán cầu não/tim"
                            >
                                Sagittal
                            </button>
                            <button
                                onClick={() => setSlicePlaneType("axial")}
                                className={`py-1.5 px-1 rounded-md text-center transition-all ${
                                    slicePlaneType === "axial"
                                        ? "bg-indigo-600 text-white shadow-sm font-bold"
                                        : "text-slate-400 hover:text-white"
                                }`}
                                title="Mặt phẳng Cắt Ngang (Axial) - Chuẩn lát cắt vi tính CT/MRI"
                            >
                                Axial
                            </button>
                        </div>
                    </div>

                    {/* Thanh trượt độ sâu cắt (Depth Offset) */}
                    <div className="space-y-1 mb-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-300">Vị trí lát cắt:</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-indigo-400">
                                    {sliceOffset <= -2.2 ? "Nguyên vẹn" : sliceOffset >= 2.2 ? "Cắt hết" : sliceOffset > 0 ? `+${sliceOffset.toFixed(2)}` : sliceOffset.toFixed(2)}
                                </span>
                                <button
                                    onClick={() => setSliceOffset(0)}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                                    title="Đưa mặt cắt về chính giữa tâm (50%)"
                                >
                                    Tâm
                                </button>
                                <button
                                    onClick={() => setSliceOffset(-2.3)}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                                    title="Đưa mặt phẳng ra hẳn bên ngoài, giữ nguyên vẹn 100% mô hình"
                                >
                                    Nguyên vẹn
                                </button>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="-2.4"
                            max="2.4"
                            step="0.05"
                            value={sliceOffset}
                            onChange={(e) => setSliceOffset(parseFloat(e.target.value))}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            style={{ touchAction: "auto" }}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-medium px-0.5">
                            <span>Nguyên vẹn (0% cắt)</span>
                            <span>Tâm (50%)</span>
                            <span>Cắt sâu (100%)</span>
                        </div>
                    </div>

                    {/* Đảo chiều cắt & chú thích y khoa */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                        <button
                            onClick={() => setSliceInverted(!sliceInverted)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                                sliceInverted
                                    ? "bg-indigo-950/80 border-indigo-700 text-indigo-300"
                                    : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                            }`}
                            title="Đổi hướng nhìn sang nửa còn lại của cơ quan"
                        >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                            </svg>
                            <span>Đảo chiều cắt</span>
                        </button>
                        <span className="text-[10px] text-slate-400 italic truncate max-w-[140px]" title={organConfig.description}>
                            {organConfig.description}
                        </span>
                    </div>
                </div>
            )}

            {/* Thanh công cụ Xoay 3D & Chức năng (3D Controls Dock góc dưới bên phải) */}
            <div className="absolute bottom-2.5 right-2.5 sm:bottom-6 sm:right-6 flex flex-col gap-2 z-10">
                {/* Bộ nút xoay 3D tức thì */}
                <div className="flex items-center gap-1 p-1 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl">
                    <button
                        onClick={handleRotateLeft}
                        className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1"
                        title="Xoay sang trái 30°"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-[10px] font-bold hidden sm:inline">Trái</span>
                    </button>
                    <button
                        onClick={handleResetCamera}
                        className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-all flex items-center gap-1"
                        title="Căn giữa / Đặt lại góc nhìn ban đầu"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="3" strokeWidth={2} />
                            <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
                        </svg>
                        <span className="text-[10px] font-bold hidden sm:inline">Căn giữa</span>
                    </button>
                    <button
                        onClick={handleRotateRight}
                        className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1"
                        title="Xoay sang phải 30°"
                    >
                        <span className="text-[10px] font-bold hidden sm:inline">Phải</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
                    <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                        title="Phóng to"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                        title="Thu nhỏ"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                    </button>
                </div>

                {/* Các nút chế độ 3D */}
                <div className="flex flex-col gap-1.5">
                    <button 
                        onClick={() => setIsAutoRotate(!isAutoRotate)}
                        className={`flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl border shadow-xl transition-all duration-200 ${
                            isAutoRotate 
                                ? 'bg-cyan-600 border-cyan-500 text-white shadow-cyan-600/30' 
                                : 'bg-slate-900/90 backdrop-blur-md border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Bật/Tắt tự động xoay 360°"
                    >
                        <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">
                            {isAutoRotate ? "Đang tự xoay 360°" : "Tự xoay 360°"}
                        </span>
                    </button>
                    <button 
                        onClick={() => setShowCrossSection(!showCrossSection)}
                        className={`flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl border shadow-xl transition-all duration-200 ${
                            showCrossSection 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/30' 
                                : 'bg-slate-900/90 backdrop-blur-md border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Cắt lớp giải phẫu y khoa (Medical Cross-section)"
                    >
                        <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l-7-7m7 7l-2.121 2.121M15.536 8.464a2 2 0 11-2.828-2.828 2 2 0 012.828 2.828zM8.464 15.536a2 2 0 11-2.828-2.828 2 2 0 012.828 2.828z" />
                        </svg>
                        <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">
                            {showCrossSection ? "Tắt cắt lớp" : "Cắt lớp y khoa"}
                        </span>
                    </button>
                    <button 
                        onClick={() => setShowWireframe(!showWireframe)}
                        className={`flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl border shadow-xl transition-all duration-200 ${
                            showWireframe 
                                ? 'bg-violet-600 border-violet-500 text-white shadow-violet-600/30' 
                                : 'bg-slate-900/90 backdrop-blur-md border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Chế độ khung dây (Wireframe)"
                    >
                        <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">Khung dây</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Preload models for faster switching
useGLTF.preload("/models/brain.glb");
useGLTF.preload("/models/heart.glb");
useGLTF.preload("/models/lungs.glb");
useGLTF.preload("/models/kidneys.glb");
useGLTF.preload("/models/kidney.glb");
useGLTF.preload("/models/stomach.glb");
useGLTF.preload("/models/liver.glb");
useGLTF.preload("/models/intestine.glb");
useGLTF.preload("/models/pancreas.glb");
useGLTF.preload("/models/skin.glb");
useGLTF.preload("/models/eyeball.glb");

