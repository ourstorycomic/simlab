"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import {
  CELL_TYPES,
  CELL_TYPE_CATALOG,
  OrganelleItem,
} from "./data/organellesData";

interface PlantCellViewerProps {
  onOrganelleSelect?: (organelle: OrganelleItem | null) => void;
  selectedId?: string | null;
  className?: string;
}

export default function PlantCellViewer({
  onOrganelleSelect,
  selectedId: controlledSelectedId,
  className = "",
}: PlantCellViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Cell Type State (8 Cell Types)
  const [currentCellTypeId, setCurrentCellTypeId] = useState<string>("plant");
  const currentCellType = CELL_TYPE_CATALOG[currentCellTypeId] || CELL_TYPE_CATALOG.plant;
  const organellesList = currentCellType.organelles;

  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    currentCellType.initialLabelKey || currentCellType.organelles[0]?.id || "vacuole"
  );
  const selectedId =
    controlledSelectedId !== undefined && controlledSelectedId !== null
      ? controlledSelectedId
      : internalSelectedId;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [glowEnabled, setGlowEnabled] = useState<boolean>(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cellRootRef = useRef<THREE.Group | null>(null);
  const hotspotsGroupRef = useRef<THREE.Group | null>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const maskDataRef = useRef<{
    keys: string[];
    ids: Uint8Array;
    width: number;
    height: number;
    texture: THREE.Texture;
  } | null>(null);

  const cameraAnimRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    progress: number;
  } | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const uniformsRef = useRef<{
    organelleSelected: { value: number };
    organelleHovered: { value: number };
    organelleColor: { value: THREE.Color };
    organelleFade: { value: number };
    organelleTime: { value: number };
  }>({
    organelleSelected: { value: 1 },
    organelleHovered: { value: 0 },
    organelleColor: { value: new THREE.Color("#06b6d4") },
    organelleFade: { value: 1 },
    organelleTime: { value: 0 },
  });

  const selectedOrganelle = organellesList.find((o) => o.id === selectedId) || organellesList[0] || null;

  // Fly Camera Smoothly to Target
  const flyCameraTo = useCallback((targetPos: THREE.Vector3, cameraPos: THREE.Vector3) => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraAnimRef.current = {
      active: true,
      startPos: cameraRef.current.position.clone(),
      endPos: cameraPos.clone(),
      startTarget: controlsRef.current.target.clone(),
      endTarget: targetPos.clone(),
      progress: 0,
    };
  }, []);

  // Select Organelle: dừng tự xoay, phát sáng bào quan được ấn, không zoom cận cảnh
  const selectOrganelle = useCallback(
    (id: string | null) => {
      // Dừng tự xoay ngay khi người dùng chọn bất kỳ bào quan nào
      setAutoRotate(false);
      setInternalSelectedId(id || "");
      const org = organellesList.find((o) => o.id === id) || null;
      if (onOrganelleSelect) onOrganelleSelect(org);

      // 1. Cập nhật shader uniforms cho tế bào có mask
      const maskKeys = currentCellType.maskKeys || [];
      if (uniformsRef.current) {
        if (id && glowEnabled && maskKeys.length > 0) {
          const idx = maskKeys.indexOf(id) + 1;
          uniformsRef.current.organelleSelected.value = idx > 0 ? idx : 0;
          uniformsRef.current.organelleFade.value = idx > 0 ? 1 : 0;
          if (org) {
            uniformsRef.current.organelleColor.value.set(org.color);
          }
        } else {
          uniformsRef.current.organelleSelected.value = 0;
          uniformsRef.current.organelleFade.value = 0;
        }
      }

      // 2. Highlight cho các model dựa trên mesh (sperm, yeast, blood, virus)
      if (cellRootRef.current && maskKeys.length === 0) {
        cellRootRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            const mat = m.material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              const meshName = m.name.toLowerCase();
              const isMatch = id && (
                meshName.includes(id.toLowerCase()) ||
                (m.userData && m.userData.labelKey === id)
              );
              if (isMatch) {
                mat.emissive.set(org?.color || 0x38bdf8);
                mat.emissiveIntensity = 0.8;
              } else {
                mat.emissive.set(0x000000);
                mat.emissiveIntensity = 0;
              }
            }
          }
        });
      }

      // 3. Giữ nguyên góc nhìn và khoảng cách zoom hiện tại của người dùng khi chọn bào quan
    },
    [currentCellType.maskKeys, glowEnabled, onOrganelleSelect, organellesList]
  );

  // Pin Texture Generator for Hotspots
  const createPinTexture = (colorHex: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128);
      ctx.beginPath();
      ctx.arc(64, 64, 34, 0, 2 * Math.PI);
      ctx.fillStyle = colorHex;
      ctx.shadowColor = colorHex;
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(64, 64, 46, 0, 2 * Math.PI);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(64, 64, 42, 0, 2 * Math.PI);
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.98)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(64, 64, 14, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const showHotspotsRef = useRef(showHotspots);
  useEffect(() => {
    showHotspotsRef.current = showHotspots;
  }, [showHotspots]);

  // Nạp 100% mô hình GLB và Mask PNG gốc cho cả 8 loại tế bào
  const loadCellAssets = useCallback(
    async (cellTypeId: string) => {
      if (!sceneRef.current || !hotspotsGroupRef.current) return;
      setIsLoading(true);
      setLoadError(null);

      // Dọn dẹp mô hình và sprite cũ
      if (cellRootRef.current) {
        sceneRef.current.remove(cellRootRef.current);
        cellRootRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.geometry?.dispose();
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose());
            } else if (m.material) {
              m.material.dispose();
            }
          }
        });
        cellRootRef.current = null;
      }

      if (hotspotsGroupRef.current.parent) {
        hotspotsGroupRef.current.parent.remove(hotspotsGroupRef.current);
      }
      hotspotsGroupRef.current.clear();
      spritesRef.current = [];
      maskDataRef.current = null;

      const nonLights = sceneRef.current.children.filter(
        (child) => !(child as any).isLight && child !== hotspotsGroupRef.current
      );
      nonLights.forEach((c) => sceneRef.current!.remove(c));

      const cellConfig = CELL_TYPE_CATALOG[cellTypeId] || CELL_TYPE_CATALOG.plant;
      const orgs = cellConfig.organelles;

      try {
        const gltfLoader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();
        if (MeshoptDecoder.ready) await MeshoptDecoder.ready;
        gltfLoader.setMeshoptDecoder(MeshoptDecoder);

        // 1. Tải Texture Mask nếu có (Plant, Animal, Bacteria, Neuron)
        if (cellConfig.maskUrl && cellConfig.maskKeys) {
          try {
            const maskTexture = await textureLoader.loadAsync(cellConfig.maskUrl);
            maskTexture.flipY = false;
            maskTexture.colorSpace = THREE.NoColorSpace;
            maskTexture.magFilter = THREE.NearestFilter;
            maskTexture.minFilter = THREE.NearestFilter;
            maskTexture.generateMipmaps = false;

            const img = maskTexture.image;
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imgData = ctx.getImageData(0, 0, img.width, img.height).data;
              const ids = new Uint8Array(img.width * img.height);
              for (let i = 0; i < ids.length; i++) ids[i] = imgData[i * 4];
              maskDataRef.current = {
                keys: cellConfig.maskKeys,
                ids,
                width: img.width,
                height: img.height,
                texture: maskTexture,
              };
            }
          } catch (e) {
            console.warn(`Không tải được mask cho ${cellTypeId}:`, e);
          }
        }

        // 2. Tải 100% tệp GLB gốc của tế bào
        const gltf = await gltfLoader.loadAsync(cellConfig.modelUrl);
        const root = gltf.scene;
        cellRootRef.current = root;

        if (cellConfig.rotationY !== undefined) {
          root.rotation.y = cellConfig.rotationY;
        }

        // Gán Shader Highlight cho mô hình: GIỮ MÔ HÌNH SÁNG RÕ TỰ NHIÊN, KHÔNG LÀM TỐI ĐEN
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.isMeshStandardMaterial) {
                mat.roughness = Math.max(mat.roughness, 0.4);
                mat.envMapIntensity = 0.95;

                if (maskDataRef.current) {
                  mat.onBeforeCompile = (shader) => {
                    shader.uniforms.organelleMask = { value: maskDataRef.current!.texture };
                    shader.uniforms.organelleSelected = uniformsRef.current.organelleSelected;
                    shader.uniforms.organelleHovered = uniformsRef.current.organelleHovered;
                    shader.uniforms.organelleColor = uniformsRef.current.organelleColor;
                    shader.uniforms.organelleFade = uniformsRef.current.organelleFade;
                    shader.uniforms.organelleTime = uniformsRef.current.organelleTime;

                    shader.fragmentShader = `
                      uniform sampler2D organelleMask;
                      uniform float organelleSelected;
                      uniform float organelleHovered;
                      uniform vec3 organelleColor;
                      uniform float organelleFade;
                      uniform float organelleTime;
                      ${shader.fragmentShader.replace(
                        "#include <emissivemap_fragment>",
                        `#include <emissivemap_fragment>
                        float organelleId = floor(texture2D(organelleMask, vMapUv).r * 255.0 + 0.5);
                        if (organelleSelected > 0.5) {
                          if (abs(organelleId - organelleSelected) < 0.5) {
                            float pulse = 0.85 + 0.35 * sin(organelleTime * 4.0);
                            totalEmissiveRadiance += organelleFade * pulse * (diffuseColor.rgb * 0.45 + organelleColor * 0.75);
                          } else {
                            // Giữ mô hình sáng rõ tự nhiên, chỉ làm dịu nhẹ (72% luma, blend 35%)
                            float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
                            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(luma) * 0.72, 0.35 * organelleFade);
                          }
                        }
                        if (organelleHovered > 0.5 && abs(organelleId - organelleHovered) < 0.5 && abs(organelleId - organelleSelected) > 0.5) {
                          totalEmissiveRadiance += diffuseColor.rgb * 0.3;
                        }`
                      )}
                    `;
                  };
                  mat.needsUpdate = true;
                }
              }
            }
          }
        });

        sceneRef.current.add(root);

        // 3. Tạo các điểm ghim Hotspot chính xác từ dữ liệu gốc
        for (const org of orgs) {
          if (!org.hotspots || org.hotspots.length === 0) continue;
          const pinTex = createPinTexture(org.color);
          const mat = new THREE.SpriteMaterial({
            map: pinTex,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          });

          for (const spot of org.hotspots) {
            const sprite = new THREE.Sprite(mat);
            sprite.position.fromArray(spot.position);
            sprite.scale.setScalar(0.07);
            sprite.renderOrder = 20;
            sprite.userData = {
              organelleId: org.id,
              normal: new THREE.Vector3().fromArray(spot.normal),
              baseScale: 0.07,
            };
            hotspotsGroupRef.current.add(sprite);
            spritesRef.current.push(sprite);
          }
        }

        if (cellRootRef.current && hotspotsGroupRef.current) {
          cellRootRef.current.add(hotspotsGroupRef.current);
        }

        // Tự động chọn bào quan đầu tiên
        const initKey = cellConfig.initialLabelKey || orgs[0]?.id || "";
        const initOrg = orgs.find((o) => o.id === initKey) || orgs[0] || null;
        if (initOrg) {
          setInternalSelectedId(initOrg.id);
          if (onOrganelleSelect) onOrganelleSelect(initOrg);

          if (uniformsRef.current && cellConfig.maskKeys) {
            const idx = cellConfig.maskKeys.indexOf(initOrg.id) + 1;
            uniformsRef.current.organelleSelected.value = idx > 0 ? idx : 0;
            uniformsRef.current.organelleFade.value = idx > 0 ? 1 : 0;
            uniformsRef.current.organelleColor.value.set(initOrg.color);
          }
        }

        // Đặt góc nhìn Camera bao quát toàn cảnh tế bào sáng rõ, lùi xa vừa vặn theo từng loại
        const initialCamMap: Record<string, THREE.Vector3> = {
          blood: new THREE.Vector3(0.1, 3.2, 7.8),
          virus: new THREE.Vector3(0.1, 2.6, 5.8),
          yeast: new THREE.Vector3(0.1, 2.2, 4.6),
          sperm: new THREE.Vector3(0.1, 2.0, 4.2),
        };
        const initialCamPos = initialCamMap[cellTypeId] || new THREE.Vector3(0.08, 1.65, 3.2);
        flyCameraTo(new THREE.Vector3(0, 0, 0), initialCamPos);
        setIsLoading(false);
      } catch (err: unknown) {
        console.error("Lỗi nạp mô hình tế bào 3D:", err);
        setLoadError(err instanceof Error ? err.message : "Lỗi khi tải mô hình 3D");
        setIsLoading(false);
      }
    },
    [flyCameraTo, onOrganelleSelect]
  );

  // Khởi tạo Scene Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    let animId: number;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      36,
      (container.clientWidth || 1000) / (container.clientHeight || 700),
      0.05,
      60
    );
    camera.position.set(0.08, 1.55, 2.75);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth || 1000, container.clientHeight || 700);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Độ phơi sáng cao tạo cảm giác trong trẻo, rực rỡ và tươi sáng
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.2;
    controls.maxDistance = 35.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Hệ thống 4 nguồn chiếu sáng chuyên nghiệp như Astra gốc
    const hemiLight = new THREE.HemisphereLight(0xe7f0ff, 0x475569, 1.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa7f3d0, 1.0);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const bottomLight = new THREE.DirectionalLight(0xd9ffb8, 1.35);
    bottomLight.position.set(0, -3, 1.2);
    scene.add(bottomLight);

    const hotspotsGroup = new THREE.Group();
    scene.add(hotspotsGroup);
    hotspotsGroupRef.current = hotspotsGroup;

    // Nạp tế bào thực vật ban đầu
    loadCellAssets("plant");

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    setTimeout(handleResize, 50);

    const clock = new THREE.Clock();
    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      uniformsRef.current.organelleTime.value = elapsed;

      // Camera di chuyển mượt mà
      if (cameraAnimRef.current && cameraAnimRef.current.active) {
        const anim = cameraAnimRef.current;
        anim.progress = Math.min(anim.progress + 0.045, 1.0);
        const ease = 1 - Math.pow(1 - anim.progress, 3);
        camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);
        if (anim.progress >= 1.0) anim.active = false;
      }

      // Tự xoay (chỉ xoay khi autoRotate bật)
      if (autoRotateRef.current && cellRootRef.current && (!cameraAnimRef.current || !cameraAnimRef.current.active)) {
        cellRootRef.current.rotation.y += 0.003;
      }

      // Hotspots nhấp nháy tinh tế
      if (hotspotsGroupRef.current) {
        hotspotsGroupRef.current.visible = showHotspotsRef.current;
        if (showHotspotsRef.current) {
          const pulse = 1 + 0.08 * Math.sin(elapsed * 3.0);
          for (const sprite of spritesRef.current) {
            const isSel = sprite.userData.organelleId === selectedId;
            const targetScale = isSel ? sprite.userData.baseScale * 1.35 * pulse : sprite.userData.baseScale;
            sprite.scale.setScalar(targetScale);
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Cập nhật shader uniforms khi selectedId hoặc glowEnabled thay đổi
  useEffect(() => {
    if (!uniformsRef.current) return;
    const maskKeys = currentCellType.maskKeys || [];
    if (selectedId && glowEnabled && maskKeys.length > 0) {
      const idx = maskKeys.indexOf(selectedId) + 1;
      uniformsRef.current.organelleSelected.value = idx > 0 ? idx : 0;
      uniformsRef.current.organelleFade.value = idx > 0 ? 1 : 0;
      const org = organellesList.find((o) => o.id === selectedId);
      if (org) {
        uniformsRef.current.organelleColor.value.set(org.color);
      }
    } else {
      uniformsRef.current.organelleSelected.value = 0;
      uniformsRef.current.organelleFade.value = 0;
    }
  }, [currentCellType.maskKeys, glowEnabled, organellesList, selectedId]);

  // Nhận diện click trên canvas (Hotspot hoặc Texture Mask hoặc Mesh)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !cellRootRef.current) return;

    // Nếu người dùng vừa kéo chuột để xoay model (khoảng cách > 6px), không coi là click
    const dragDist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );
    if (dragDist > 6) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // 1. Kiểm tra Hotspot Sprites
    if (showHotspots && spritesRef.current.length > 0) {
      const intersects = raycaster.intersectObjects(spritesRef.current, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Sprite;
        selectOrganelle(hit.userData.organelleId);
        return;
      }
    }

    // 2. Kiểm tra bề mặt 3D Mesh & Texture Mask & Vùng giải phẫu lân cận
    const intersects = raycaster.intersectObjects(cellRootRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      // A. Nếu có Texture Mask (Plant, Animal, Bacteria, Neuron)
      if (maskDataRef.current && hit.uv) {
        const mask = maskDataRef.current;
        const px = Math.min(Math.max(0, Math.floor(hit.uv.x * mask.width)), mask.width - 1);
        const py = Math.min(Math.max(0, Math.floor(hit.uv.y * mask.height)), mask.height - 1);
        const organelleIdIndex = mask.ids[py * mask.width + px];
        if (organelleIdIndex > 0 && mask.keys[organelleIdIndex - 1]) {
          selectOrganelle(mask.keys[organelleIdIndex - 1]);
          return;
        }
      }

      // B. Nếu là mesh riêng lẻ có tên hoặc labelKey
      let orgId =
        (hit.object.userData && hit.object.userData.organelleId) ||
        (hit.object.parent && hit.object.parent.userData && hit.object.parent.userData.organelleId);

      if (!orgId && hit.object.name) {
        const hitName = hit.object.name.toLowerCase();
        const matched = organellesList.find(
          (o) => hitName.includes(o.id.toLowerCase()) || (o.nameEn && hitName.includes(o.nameEn.toLowerCase()))
        );
        if (matched) orgId = matched.id;
      }

      if (orgId) {
        selectOrganelle(orgId);
        return;
      }

      // C. VÙNG KHÔNG GIAN 3D: Tự động kích hoạt Bào quan gần nhất với vị trí nhấp chuột (hit.point)
      // Cho phép người dùng nhấp vào bất kỳ vùng nào của cấu trúc để xem thông tin, không bắt buộc trúng dấu chấm!
      if (hit.point && cellRootRef.current) {
        const localPoint = cellRootRef.current.worldToLocal(hit.point.clone());
        let closestOrgId: string | null = null;
        let minDistance = Infinity;

        for (const org of organellesList) {
          if (!org.hotspots || org.hotspots.length === 0) continue;
          for (const hs of org.hotspots) {
            const hsPos = new THREE.Vector3(hs.position[0], hs.position[1], hs.position[2]);
            const dist = localPoint.distanceTo(hsPos);
            if (dist < minDistance) {
              minDistance = dist;
              closestOrgId = org.id;
            }
          }
        }

        if (closestOrgId) {
          selectOrganelle(closestOrgId);
          return;
        }
      }
    }
  };

  const handleResetCamera = () => {
    const initialCamMap: Record<string, THREE.Vector3> = {
      blood: new THREE.Vector3(0.1, 3.2, 7.8),
      virus: new THREE.Vector3(0.1, 2.6, 5.8),
      yeast: new THREE.Vector3(0.1, 2.2, 4.6),
      sperm: new THREE.Vector3(0.1, 2.0, 4.2),
    };
    const camPos = initialCamMap[currentCellTypeId] || new THREE.Vector3(0.08, 1.65, 3.2);
    flyCameraTo(new THREE.Vector3(0, 0, 0), camPos);
  };

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden select-none bg-slate-950 ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-emerald-400 font-bold text-sm tracking-wide">
            Đang tải dữ liệu 3D {currentCellType.name}…
          </p>
          <span className="text-xs text-slate-400 mt-1">100% Mô hình giải phẫu thực tế GLB & Texture Mask</span>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="max-w-md bg-rose-950/80 border border-rose-500/50 p-5 rounded-2xl text-center">
            <p className="text-rose-400 font-bold text-sm mb-1">Không thể tải mô hình tế bào!</p>
            <p className="text-xs text-rose-200">{loadError}</p>
          </div>
        </div>
      )}

      {/* Thanh chọn 8 loại tế bào */}
      <div className="w-full px-4 py-2 bg-[#0b0f19] border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar flex-shrink-0 z-20">
        <div className="flex items-center gap-1.5 flex-nowrap">
          {CELL_TYPES.map((c) => {
            const isActive = c.id === currentCellTypeId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (c.id !== currentCellTypeId) {
                    setCurrentCellTypeId(c.id);
                    loadCellAssets(c.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 shadow-sm" : "bg-slate-600"}`} />
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            {organellesList.length} Cấu trúc bào quan
          </span>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden flex">
        {/* Main 3D Viewport */}
        <div
          ref={containerRef}
          onPointerDown={(e) => {
            pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={handleCanvasClick}
          className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing outline-none"
        >
          {/* Badge Bào quan đang chọn trên góc trái */}
          {selectedOrganelle && (
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse"
                style={{ backgroundColor: selectedOrganelle.color }}
              />
              <span className="text-xs font-bold text-white tracking-wide">
                {selectedOrganelle.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({selectedOrganelle.nameEn})
              </span>
            </div>
          )}

          {/* Quick Floating Controls (Bottom Center) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl">
            {/* Hotspots Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHotspots((prev) => !prev);
              }}
              title="Bật/Tắt điểm ghim bào quan"
              className={`p-2 rounded-xl text-xs font-medium transition-all ${
                showHotspots
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {/* Glow Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGlowEnabled((prev) => !prev);
              }}
              title="Bật/Tắt phát sáng cấu trúc"
              className={`p-2 rounded-xl text-xs font-medium transition-all ${
                glowEnabled
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            {/* Auto Rotate Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAutoRotate((prev) => !prev);
              }}
              title={autoRotate ? "Dừng tự xoay" : "Bật tự xoay"}
              className={`p-2 rounded-xl text-xs font-medium transition-all ${
                autoRotate
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1" />

            {/* Zoom In */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (cameraRef.current && controlsRef.current) {
                  const dir = cameraRef.current.position.clone().sub(controlsRef.current.target);
                  cameraRef.current.position.copy(controlsRef.current.target).add(dir.multiplyScalar(0.75));
                }
              }}
              title="Phóng to"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {/* Zoom Out */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (cameraRef.current && controlsRef.current) {
                  const dir = cameraRef.current.position.clone().sub(controlsRef.current.target);
                  cameraRef.current.position.copy(controlsRef.current.target).add(dir.multiplyScalar(1.35));
                }
              }}
              title="Thu nhỏ (Zoom xa)"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
              </svg>
            </button>

            {/* Reset Camera */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetCamera();
              }}
              title="Đặt lại góc nhìn"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="w-80 md:w-96 h-full bg-[#0a0e17] border-l border-slate-800 flex flex-col z-10 flex-shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                {currentCellType.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {organellesList.findIndex((o) => o.id === selectedId) + 1} / {organellesList.length}
              </span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {selectedOrganelle ? (
                <>
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedOrganelle.color }}
                  />
                  <span>{selectedOrganelle.name}</span>
                </>
              ) : (
                "Chọn một bào quan"
              )}
            </h3>
            {selectedOrganelle && (
              <p className="text-xs text-slate-400 italic mt-0.5">{selectedOrganelle.nameEn}</p>
            )}
          </div>

          {/* Organelle Details */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {selectedOrganelle ? (
              <>
                {/* Detail Component Image */}
                {selectedOrganelle.image && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
                    <img
                      src={selectedOrganelle.image}
                      alt={selectedOrganelle.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/90 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                      Chi tiết hiển vi & minh họa
                    </span>
                  </div>
                )}

                {/* Role / Function */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1 font-mono">
                    Chức năng sinh học
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {selectedOrganelle.role}
                  </p>
                </div>

                {/* Summary */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider font-mono">
                    Cấu trúc & Cơ chế
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedOrganelle.summary}
                  </p>
                </div>

                {/* Spec Table */}
                <div className="space-y-2 pt-1 border-t border-slate-800/60">
                  <div className="flex items-start justify-between text-xs py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Vị trí:</span>
                    <span className="text-slate-200 text-right max-w-[65%] font-medium">
                      {selectedOrganelle.location}
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-xs py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Kích thước:</span>
                    <span className="text-slate-200 text-right font-medium">
                      {selectedOrganelle.size}
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-xs py-1">
                    <span className="text-slate-400">Quan sát hiển vi:</span>
                    <span className="text-slate-200 text-right max-w-[65%] font-medium">
                      {selectedOrganelle.microscopy}
                    </span>
                  </div>
                </div>

                {/* Interesting Fact */}
                {selectedOrganelle.fact && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Bạn có biết?</span>
                    </div>
                    <p className="text-emerald-200/90 leading-relaxed">{selectedOrganelle.fact}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                Nhấp vào một bào quan trên mô hình 3D hoặc danh sách dưới đây để xem chi tiết.
              </p>
            )}

            {/* List of Organelles */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-2 font-mono">
                Danh sách các bào quan ({organellesList.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {organellesList.map((org) => {
                  const isSelected = org.id === selectedId;
                  return (
                    <button
                      key={org.id}
                      onClick={() => selectOrganelle(org.id)}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                        isSelected
                          ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                          : "bg-slate-900/40 text-slate-300 border-slate-800/60 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: org.color }}
                        />
                        <span className="truncate font-medium">{org.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                        {org.hotspots ? `${org.hotspots.length} điểm` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
