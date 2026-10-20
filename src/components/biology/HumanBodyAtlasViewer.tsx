"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as pako from "pako";
import {
  ANATOMY_SYSTEMS,
  ANATOMY_PRESETS,
  ANATOMY_CATEGORIES,
} from "./data/anatomySystemsData";
import { translateAnatomyName } from "./utils/anatomyTranslations";

interface SelectedStructureInfo {
  id: string;
  name: string;
  viName: string;
  enName: string;
  description: string;
  system: string;
  systemName: string;
  systemColor: string;
  conceptId?: string;
}

interface HumanBodyAtlasViewerProps {
  onStructureSelect?: (info: SelectedStructureInfo | null) => void;
  onNavigateToOrgan?: (organId: string) => void;
  className?: string;
}

export default function HumanBodyAtlasViewer({
  onStructureSelect,
  onNavigateToOrgan,
  className = "",
}: HumanBodyAtlasViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activePreset, setActivePreset] = useState<string>("overview");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [leftTab, setLeftTab] = useState<"regions" | "systems">("regions");
  const [activeSystems, setActiveSystems] = useState<Set<string>>(
    () => new Set(["skeletal", "cardiac", "respiratory", "digestive", "urinary"])
  );
  const [selectedStructure, setSelectedStructure] = useState<SelectedStructureInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<{ current: number; total: number; percent: number }>({
    current: 0,
    total: 15,
    percent: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  const [explodeLevel, setExplodeLevel] = useState<number>(0);
  const [isIsolated, setIsIsolated] = useState<boolean>(false);
  const [smartLabels, setSmartLabels] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const atlasRootRef = useRef<THREE.Group | null>(null);
  const systemGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const allMeshesRef = useRef<THREE.Mesh[]>([]);
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);
  const pinBadgeRef = useRef<HTMLDivElement>(null);
  const materialsCacheRef = useRef<Map<string, THREE.Material>>(new Map());
  const ghostMaterialsCacheRef = useRef<Map<string, THREE.Material>>(new Map());
  const cameraAnimRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    progress: number;
  } | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Highlight material for selected structure (vibrant solid pink/rose like reference photo)
  const highlightMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.FrontSide,
    });
  }, []);

  // System Colors Map
  const systemColorsMap = useMemo(() => {
    return new Map(ANATOMY_SYSTEMS.map((s) => [s.id, new THREE.Color(s.color)]));
  }, []);

  // Decompress GZIP Buffer
  const decompressGzip = async (arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
    try {
      const uint8 = new Uint8Array(arrayBuffer);
      const unzipped = pako.ungzip(uint8);
      return unzipped.buffer.slice(unzipped.byteOffset, unzipped.byteOffset + unzipped.byteLength);
    } catch (err) {
      if (typeof DecompressionStream !== "undefined") {
        const stream = new Response(new Blob([arrayBuffer]))
          .body!
          .pipeThrough(new DecompressionStream("gzip"));
        return await new Response(stream).arrayBuffer();
      }
      throw err;
    }
  };

  const getSystemMaterial = useCallback((systemId: string): THREE.Material => {
    if (materialsCacheRef.current.has(systemId)) {
      return materialsCacheRef.current.get(systemId)!;
    }
    const color = systemColorsMap.get(systemId) || new THREE.Color("#e2e8f0");
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.FrontSide,
    });
    materialsCacheRef.current.set(systemId, mat);
    return mat;
  }, [systemColorsMap]);

  // Semi-transparent ghost material for non-selected parts (trong suốt mờ mờ chuẩn X-quang như Ảnh 3)
  const getGhostMaterial = useCallback((systemId: string): THREE.Material => {
    if (ghostMaterialsCacheRef.current.has(systemId)) {
      return ghostMaterialsCacheRef.current.get(systemId)!;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#334155"),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.FrontSide,
    });
    ghostMaterialsCacheRef.current.set(systemId, mat);
    return mat;
  }, []);

  // Thuật toán 2D Shelf Packing Layout bóc tách xếp hàng các bộ phận khít, gọn, đẹp
  const computeGridLayout = (meshes: THREE.Mesh[], aspect: number = 2.2) => {
    const pad = 0.008; // 8mm đệm giữa các chi tiết, không loãng khoảng trống
    const rowGap = 0.010; // 10mm đệm giữa các hàng

    const items = meshes.map((m) => {
      const bounds = m.userData.bounds;
      const min = bounds ? bounds[0] : [-0.02, -0.02, -0.02];
      const max = bounds ? bounds[1] : [0.02, 0.02, 0.02];
      const realW = Math.max(0.015, max[0] - min[0]);
      const realH = Math.max(0.015, max[1] - min[1]);
      return {
        id: m.userData.id,
        width: realW + pad,
        height: realH + pad,
      };
    });

    const totalArea = items.reduce((sum, item) => sum + item.width * item.height, 0);
    // Bề rộng tối đa mỗi hàng ~2.2m - 2.6m vừa vặn góc nhìn camera
    const rowMaxWidth = Math.max(
      Math.max(0.3, ...items.map((i) => i.width)),
      1.05 * Math.sqrt(totalArea * Math.max(1.0, aspect))
    );

    // Sắp xếp các bộ phận theo chiều cao giảm dần
    items.sort((a, b) => b.height - a.height || a.id.localeCompare(b.id));

    // Pass 1: Gom các items thành từng hàng và tính chiều cao thực tế của từng hàng
    const rows: { items: typeof items; rowH: number }[] = [];
    let currentRowItems: typeof items = [];
    let currentX = 0;
    let currentRowH = 0;

    for (const item of items) {
      if (currentX > 0 && currentX + item.width > rowMaxWidth) {
        rows.push({ items: currentRowItems, rowH: currentRowH });
        currentRowItems = [item];
        currentX = item.width;
        currentRowH = item.height;
      } else {
        currentRowItems.push(item);
        currentX += item.width;
        currentRowH = Math.max(currentRowH, item.height);
      }
    }
    if (currentRowItems.length > 0) {
      rows.push({ items: currentRowItems, rowH: currentRowH });
    }

    // Pass 2: Đặt tọa độ căn giữa theo từng hàng, loại bỏ hoàn toàn khoảng trống thừa
    const cells = new Map<string, { x: number; y: number; width: number; height: number }>();
    let currentY = 0;
    let gridWidth = 0;

    for (const row of rows) {
      let x = 0;
      for (const item of row.items) {
        cells.set(item.id, {
          x: x + item.width / 2,
          y: -currentY - row.rowH / 2, // Căn đều trung tâm theo hàng
          width: item.width,
          height: item.height,
        });
        x += item.width;
      }
      gridWidth = Math.max(gridWidth, x);
      currentY += row.rowH + rowGap;
    }

    const totalHeight = currentY;
    cells.forEach((val) => {
      val.x -= gridWidth / 2;
      val.y += totalHeight / 2;
    });

    return { cells, totalWidth: gridWidth, totalHeight };
  };

  // Fly Camera to Target
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

  // Áp dụng vật liệu hiển thị và trạng thái làm mờ / cô lập (Chuẩn X-quang như Ảnh 3)
  const applyMeshAppearance = useCallback(
    (targetMesh: THREE.Mesh | null, isolated: boolean) => {
      allMeshesRef.current.forEach((m) => {
        const sys = m.userData.system || "other";
        const isSysActive = activeSystems.has(sys);

        if (!targetMesh) {
          m.visible = isSysActive;
          m.material = getSystemMaterial(sys);
        } else if (m === targetMesh) {
          m.visible = true;
          m.material = highlightMaterial;
        } else {
          if (isolated) {
            m.visible = false;
          } else {
            // Hiện toàn bộ khung xương và các hệ cơ quan liên quan trong suốt mờ ảo chuẩn X-quang như Ảnh 3
            // Khung xương (skeletal) luôn là điểm tựa giải phẫu giúp người dùng định vị chính xác vị trí cơ quan
            const shouldBeGhostVisible =
              sys === "skeletal" ||
              sys === targetMesh.userData.system ||
              isSysActive;
            m.visible = shouldBeGhostVisible;
            if (shouldBeGhostVisible) {
              m.material = getGhostMaterial(sys);
            }
          }
        }
      });
    },
    [activeSystems, getSystemMaterial, getGhostMaterial, highlightMaterial]
  );

  // Select Mesh with Smooth Zoom & Ghosting (Tự động đưa về model cơ thể chuẩn như Ảnh 3)
  const selectMesh = useCallback(
    (mesh: THREE.Mesh | null) => {
      if (!mesh) {
        selectedMeshRef.current = null;
        setSelectedStructure(null);
        setIsIsolated(false);
        if (onStructureSelect) onStructureSelect(null);
        applyMeshAppearance(null, false);
        return;
      }

      selectedMeshRef.current = mesh;

      // 1. Tự động trả thanh trượt về 0% và đưa tất cả bộ phận về vị trí giải phẫu tự nhiên trong cơ thể
      setExplodeLevel(0);
      allMeshesRef.current.forEach((m) => {
        m.position.set(0, 0, 0);
        m.updateMatrix();
        m.updateMatrixWorld(true);
      });

      // 2. Tính toán tâm giải phẫu của bộ phận được chọn trong cơ thể
      mesh.updateMatrixWorld(true);
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
      }
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.08);

      // Cự ly nhìn vừa vặn từ phía trước (+Z), thấy rõ bộ phận trong ngữ cảnh lồng ngực/khung người mờ ảo
      const targetDist = Math.max(maxDim * 3.0, 0.52);
      const endCamPos = new THREE.Vector3(center.x, center.y + 0.03, center.z + targetDist);

      flyCameraTo(center, endCamPos);
      applyMeshAppearance(mesh, isIsolated);

      const data = mesh.userData;
      const sysDef = ANATOMY_SYSTEMS.find((s) => s.id === data.system);
      const sysName = data.system === "cardiac" ? "Tim" : sysDef?.name || "Hệ cơ quan";
      const trans = translateAnatomyName(data.name || mesh.name || "Cấu trúc cơ thể", data.conceptId);
      const info: SelectedStructureInfo = {
        id: data.id || mesh.name,
        name: data.name || mesh.name || "Cấu trúc cơ thể",
        viName: trans.viName,
        enName: trans.enName,
        description: trans.description,
        system: data.system || "other",
        systemName: sysName,
        systemColor: sysDef?.color || "#38bdf8",
        conceptId: data.conceptId,
      };

      setSelectedStructure(info);
      if (onStructureSelect) onStructureSelect(info);
    },
    [applyMeshAppearance, flyCameraTo, isIsolated, onStructureSelect]
  );

  // Chọn nhanh cơ quan trong ngữ cảnh toàn thân (Ảnh 3)
  const selectOrganInBody = useCallback(
    (organKey: string) => {
      if (allMeshesRef.current.length === 0) return;

      let targetMesh: THREE.Mesh | null = null;
      if (organKey === "heart") {
        // Tìm cấu trúc Cavity of right atrium (FMA11359 / FJ2424) chính xác như Ảnh 3
        targetMesh =
          allMeshesRef.current.find(
            (m) => m.userData.conceptId === "FMA11359" || m.userData.id === "FJ2424"
          ) ||
          allMeshesRef.current.find(
            (m) =>
              m.userData.system === "cardiac" &&
              (m.userData.name?.toLowerCase().includes("atrium") ||
                ((m.userData.origCenter?.y || 0) < 1.25 && (m.userData.origCenter?.y || 0) > 0.8))
          ) ||
          null;
      } else if (organKey === "brain") {
        targetMesh =
          allMeshesRef.current.find(
            (m) =>
              m.userData.conceptId === "FMA78454" ||
              m.userData.id === "FJ1730" ||
              (m.userData.system === "nervous" && (m.userData.origCenter?.y || 0) > 1.3)
          ) || null;
      } else if (organKey === "lungs") {
        targetMesh =
          allMeshesRef.current.find((m) => m.userData.system === "respiratory") ||
          null;
      } else if (organKey === "liver") {
        targetMesh =
          allMeshesRef.current.find((m) => m.userData.system === "digestive") ||
          null;
      }

      if (targetMesh) {
        selectMesh(targetMesh);
      }
    },
    [selectMesh]
  );

  // Toggle Isolate Mode
  const toggleIsolate = () => {
    const next = !isIsolated;
    setIsIsolated(next);
    applyMeshAppearance(selectedMeshRef.current, next);
  };

  // Load Atlas function
  const loadAtlas = useCallback(
    async (targetGender: "male" | "female") => {
      if (!sceneRef.current) return;
      setIsLoading(true);
      setLoadError(null);
      selectMesh(null);

      if (atlasRootRef.current) {
        sceneRef.current.remove(atlasRootRef.current);
        atlasRootRef.current = null;
      }
      systemGroupsRef.current.clear();
      allMeshesRef.current = [];

      try {
        // 1. Tải bản đồ cơ thể đầy đủ từ /atlas/atlas.json
        const baseManifestResp = await fetch("/atlas/atlas.json");
        if (!baseManifestResp.ok) {
          throw new Error("Không thể tải tệp atlas.json");
        }
        const baseManifest = await baseManifestResp.json();

        // 2. Nếu là nữ, tải thêm tệp cấu trúc cơ quan sinh dục nữ & tuyến vú
        let femaleParts: any[] = [];
        if (targetGender === "female") {
          try {
            const femaleResp = await fetch("/atlas-female/atlas.json");
            if (femaleResp.ok) {
              const femaleManifest = await femaleResp.json();
              femaleParts = femaleManifest.parts || [];
            }
          } catch (e) {
            console.warn("Không tải được dữ liệu atlas-female, tiếp tục...", e);
          }
          // Bật hệ sinh sản khi xem nữ để thấy ngay tử cung, buồng trứng, tuyến vú
          setActiveSystems((prev) => {
            const next = new Set(prev);
            next.add("reproductive");
            return next;
          });
        }

        const rootGroup = new THREE.Group();
        rootGroup.name = targetGender === "female" ? "AtlasFemale" : "AtlasMale";

        for (const sys of ANATOMY_SYSTEMS) {
          const g = new THREE.Group();
          g.name = `System_${sys.id}`;
          g.userData = { systemId: sys.id };
          systemGroupsRef.current.set(sys.id, g);
          rootGroup.add(g);
        }

        const otherGroup = new THREE.Group();
        otherGroup.name = "System_other";
        otherGroup.visible = false;
        systemGroupsRef.current.set("other", otherGroup);
        rootGroup.add(otherGroup);

        // Các ID cơ quan sinh dục nam cần loại bỏ khi ở giới tính Nữ
        const maleExcludedIds = new Set([
          "FJ3132", "FJ3133", "FJ3134", "FJ3135", "FJ3136", "FJ3137",
          "FJ3138", "FJ3139", "FJ3140", "FJ3141", "FJ3142", "FJ3143",
          "FJ3148", "FJ3149"
        ]);

        const partsByChunk = new Map<number, any[]>();
        for (const part of baseManifest.parts) {
          if (targetGender === "female" && (maleExcludedIds.has(part.id) || part.system === "reproductive")) {
            continue;
          }
          const c = part.chunk || 0;
          if (!partsByChunk.has(c)) partsByChunk.set(c, []);
          partsByChunk.get(c)!.push(part);
        }

        const totalChunks = targetGender === "female" ? 16 : 15;

        // Tải 15 chunk của toàn bộ cơ thể người (khung xương, tim, phổi, tiêu hóa, não, cơ...)
        for (let chunkIdx = 0; chunkIdx < 15; chunkIdx++) {
          const chunkParts = partsByChunk.get(chunkIdx) || [];

          setLoadProgress({
            current: chunkIdx + 1,
            total: totalChunks,
            percent: Math.round(((chunkIdx + 1) / totalChunks) * 100),
          });

          const chunkUrl = `/atlas/body-${chunkIdx}.bin.gz`;
          const chunkResp = await fetch(chunkUrl);
          if (!chunkResp.ok) {
            console.warn(`Không tải được chunk body-${chunkIdx}, tiếp tục...`);
            continue;
          }
          const compressed = await chunkResp.arrayBuffer();
          const rawBuffer = await decompressGzip(compressed);

          for (const part of chunkParts) {
            if (part.id === "FJ2810" || part.name === "Skin" || part.system === "integumentary") {
              continue;
            }

            const geom = new THREE.BufferGeometry();
            const posOffset = part.positions;
            const vertexCount = part.vertexCount;
            const posLength = vertexCount * 3;

            const posArray = new Float32Array(rawBuffer, posOffset, posLength);
            geom.setAttribute("position", new THREE.BufferAttribute(posArray, 3));

            if (part.normals !== undefined && part.normals !== null) {
              const normArray = new Int16Array(rawBuffer, part.normals, posLength);
              geom.setAttribute("normal", new THREE.BufferAttribute(normArray, 3, true));
            } else {
              geom.computeVertexNormals();
            }

            if (part.indices !== undefined && part.indices !== null) {
              const idxOffset = part.indices;
              const idxLength = part.indexCount;
              const indexArray = new Uint32Array(rawBuffer, idxOffset, idxLength);
              geom.setIndex(new THREE.BufferAttribute(indexArray, 1));
            }

            const material = getSystemMaterial(part.system);
            const mesh = new THREE.Mesh(geom, material);
            mesh.name = part.id;

            geom.computeBoundingBox();
            const meshBox = geom.boundingBox || new THREE.Box3();
            const meshCenter = meshBox.getCenter(new THREE.Vector3());

            mesh.userData = {
              id: part.id,
              name: part.name,
              system: part.system,
              conceptId: part.conceptId,
              bounds: part.bounds,
              origCenter: meshCenter.clone(),
            };

            allMeshesRef.current.push(mesh);
            const targetGroup = systemGroupsRef.current.get(part.system) || otherGroup;
            targetGroup.add(mesh);
          }
        }

        // Nếu là Nữ: Nạp thêm chunk female-0.bin.gz chứa cơ quan sinh dục nữ & tuyến vú
        if (targetGender === "female" && femaleParts.length > 0) {
          setLoadProgress({
            current: 16,
            total: 16,
            percent: 100,
          });

          const femaleChunkResp = await fetch("/atlas-female/female-0.bin.gz");
          if (femaleChunkResp.ok) {
            const compressed = await femaleChunkResp.arrayBuffer();
            const rawBuffer = await decompressGzip(compressed);

            for (const part of femaleParts) {
              const geom = new THREE.BufferGeometry();
              const posOffset = part.positions;
              const vertexCount = part.vertexCount;
              const posLength = vertexCount * 3;

              const posArray = new Float32Array(rawBuffer, posOffset, posLength);
              geom.setAttribute("position", new THREE.BufferAttribute(posArray, 3));

              if (part.normals !== undefined && part.normals !== null) {
                const normArray = new Int16Array(rawBuffer, part.normals, posLength);
                geom.setAttribute("normal", new THREE.BufferAttribute(normArray, 3, true));
              } else {
                geom.computeVertexNormals();
              }

              if (part.indices !== undefined && part.indices !== null) {
                const idxOffset = part.indices;
                const idxLength = part.indexCount;
                const indexArray = new Uint32Array(rawBuffer, idxOffset, idxLength);
                geom.setIndex(new THREE.BufferAttribute(indexArray, 1));
              }

              const material = getSystemMaterial(part.system);
              const mesh = new THREE.Mesh(geom, material);
              mesh.name = part.id;

              geom.computeBoundingBox();
              const meshBox = geom.boundingBox || new THREE.Box3();
              const meshCenter = meshBox.getCenter(new THREE.Vector3());

              mesh.userData = {
                id: part.id,
                name: part.name,
                system: part.system,
                conceptId: part.conceptId,
                bounds: part.bounds,
                origCenter: meshCenter.clone(),
              };

              allMeshesRef.current.push(mesh);
              const targetGroup = systemGroupsRef.current.get(part.system) || otherGroup;
              targetGroup.add(mesh);
            }
          }
        }

        const box = new THREE.Box3().setFromObject(rootGroup);
        const center = box.getCenter(new THREE.Vector3());
        rootGroup.position.sub(center);

        // Tính toán bố cục lưới 2D ban đầu cho các cấu trúc
        const gridLayout = computeGridLayout(allMeshesRef.current);
        allMeshesRef.current.forEach((mesh) => {
          const cell = gridLayout.cells.get(mesh.userData.id);
          if (cell) {
            mesh.userData.gridPos = new THREE.Vector3(cell.x, cell.y, 0);
          }
        });

        sceneRef.current.add(rootGroup);
        atlasRootRef.current = rootGroup;
        applyMeshAppearance(null, false);
        setIsLoading(false);
      } catch (err: unknown) {
        console.error("Atlas loading failed:", err);
        setLoadError(err instanceof Error ? err.message : "Lỗi khi nạp dữ liệu giải phẫu");
        setIsLoading(false);
      }
    },
    [applyMeshAppearance, getSystemMaterial, selectMesh]
  );

  // Initial Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    let animId: number;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.15, 2.35);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.05; // Cho phép phóng to cận cảnh các chi tiết nhỏ
    controls.maxDistance = 30.0; // Cho phép zoom lùi ra xa toàn cảnh thoải mái
    controls.target.set(0, 0.15, 0);
    controlsRef.current = controls;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.8);
    scene.add(hemiLight);

    const dirFront = new THREE.DirectionalLight(0xffffff, 2.0);
    dirFront.position.set(2, 4, 3);
    scene.add(dirFront);

    const dirBack = new THREE.DirectionalLight(0x94a3b8, 1.2);
    dirBack.position.set(-2, 2, -3);
    scene.add(dirBack);

    const dirBottom = new THREE.DirectionalLight(0x38bdf8, 0.7);
    dirBottom.position.set(0, -3, 1);
    scene.add(dirBottom);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      if (cameraAnimRef.current && cameraAnimRef.current.active) {
        const anim = cameraAnimRef.current;
        anim.progress = Math.min(anim.progress + 0.045, 1.0);
        const ease = 1 - Math.pow(1 - anim.progress, 3);
        camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);
        if (anim.progress >= 1.0) {
          anim.active = false;
        }
      }

      // Update 3D projected pin badge for selected structure (Ảnh 3)
      if (selectedMeshRef.current && pinBadgeRef.current && container) {
        const box = new THREE.Box3().setFromObject(selectedMeshRef.current);
        const center = box.getCenter(new THREE.Vector3());
        const projected = center.clone().project(camera);
        if (projected.z < 1) {
          const px = ((projected.x + 1) * container.clientWidth) / 2;
          const py = ((-projected.y + 1) * container.clientHeight) / 2;
          pinBadgeRef.current.style.transform = `translate3d(${px + 12}px, ${py - 14}px, 0)`;
          pinBadgeRef.current.style.display = "flex";
        } else {
          pinBadgeRef.current.style.display = "none";
        }
      } else if (pinBadgeRef.current) {
        pinBadgeRef.current.style.display = "none";
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    loadAtlas(gender);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    applyMeshAppearance(selectedMeshRef.current, isIsolated);
  }, [activeSystems, applyMeshAppearance, isIsolated]);

  // Exploded View Slider: Bung dãn cách 3D & Chia xếp hàng 2D (Grid Packing Layout)
  useEffect(() => {
    const factor = explodeLevel / 100;
    if (allMeshesRef.current.length === 0) return;

    // Tính toán bố cục lưới chính xác cho các bộ phận đang hiển thị (loại bỏ hoàn toàn ô trống)
    const visibleMeshes = allMeshesRef.current.filter((m) => m.visible);
    const targetMeshes = visibleMeshes.length > 0 ? visibleMeshes : allMeshesRef.current;
    const gridLayout = computeGridLayout(targetMeshes);

    targetMeshes.forEach((mesh) => {
      const cell = gridLayout.cells.get(mesh.userData.id);
      if (cell) {
        mesh.userData.gridPos = new THREE.Vector3(cell.x, cell.y, 0);
      }
    });

    const systemRadialAngles: Record<string, number> = {
      skeletal: 0,
      muscular: Math.PI * 0.25,
      connective: Math.PI * 0.5,
      cardiac: Math.PI * 0.75,
      arterial: Math.PI * 0.9,
      venous: Math.PI * 1.1,
      nervous: Math.PI * 1.3,
      respiratory: Math.PI * 1.5,
      digestive: Math.PI * 1.7,
      urinary: Math.PI * 1.85,
      endocrine: Math.PI * 0.1,
      lymphatic: Math.PI * 0.4,
      sensory: Math.PI * 0.6,
      reproductive: Math.PI * 1.95,
    };

    allMeshesRef.current.forEach((mesh) => {
      const origCenter = mesh.userData.origCenter as THREE.Vector3;
      const gridPos = mesh.userData.gridPos as THREE.Vector3;
      if (!origCenter) return;

      const angle = systemRadialAngles[mesh.userData.system] || 0;

      if (factor <= 0.35) {
        const e = factor / 0.35;
        const rx = Math.sin(angle) * e * 0.35;
        const ry = origCenter.y * e * 0.2;
        const rz = Math.cos(angle) * e * 0.35;
        mesh.position.set(rx, ry, rz);
      } else {
        const e = (factor - 0.35) / 0.65;
        const rx = Math.sin(angle) * 0.35;
        const ry = origCenter.y * 0.2;
        const rz = Math.cos(angle) * 0.35;

        const rootPos = atlasRootRef.current ? atlasRootRef.current.position : new THREE.Vector3();
        const targetX = gridPos ? gridPos.x - origCenter.x - rootPos.x : rx;
        const targetY = gridPos ? gridPos.y - origCenter.y - rootPos.y : ry;
        const targetZ = gridPos ? -origCenter.z - rootPos.z : rz;

        mesh.position.set(
          THREE.MathUtils.lerp(rx, targetX, e),
          THREE.MathUtils.lerp(ry, targetY, e),
          THREE.MathUtils.lerp(rz, targetZ, e)
        );
      }
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);
    });

    // Camera căn giữa toàn bộ lưới các bộ phận vào chính giữa màn hình (Full view centered)
    if (atlasRootRef.current && cameraRef.current && controlsRef.current && !selectedMeshRef.current) {
      atlasRootRef.current.updateMatrixWorld(true);

      // Tính chính xác Bounding Box thực tế của tất cả các bộ phận đang hiển thị
      const activeBox = new THREE.Box3();
      const visibleMeshes = allMeshesRef.current.filter((m) => m.visible);
      const targets = visibleMeshes.length > 0 ? visibleMeshes : allMeshesRef.current;
      targets.forEach((m) => {
        activeBox.expandByObject(m);
      });

      const center = activeBox.getCenter(new THREE.Vector3());
      const size = activeBox.getSize(new THREE.Vector3());

      const baseTargetY = 0.15;
      const baseDistance = 2.35;

      // Căn camera thẳng vào trung tâm khối bóc tách, bù nhẹ 6% chiều cao tránh thanh điều khiển ở đáy
      const explodedTargetY = center.y + size.y * 0.06;
      const targetY = THREE.MathUtils.lerp(baseTargetY, explodedTargetY, factor);
      const targetX = THREE.MathUtils.lerp(0, center.x, factor);

      // Tính khoảng cách camera lùi ra để VỪA KHÍT TRỌN VẸN MÀN HÌNH (Full screen)
      const cam = cameraRef.current;
      const vFovRad = THREE.MathUtils.degToRad(cam.fov / 2);
      const hFovRad = Math.atan(Math.tan(vFovRad) * cam.aspect);
      const distH = (size.y / 2) / Math.tan(vFovRad);
      const distW = (size.x / 2) / Math.tan(hFovRad);
      const explodedDistance = Math.max(distH, distW) * 1.15;

      const targetDistance = THREE.MathUtils.lerp(baseDistance, Math.max(2.2, explodedDistance), factor);

      cameraRef.current.position.set(targetX, targetY, targetDistance);
      controlsRef.current.target.set(targetX, targetY, 0);
      controlsRef.current.update();
    }
  }, [explodeLevel, activeSystems]);

  // Handle Raycast Mesh Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !atlasRootRef.current) return;

    // Nếu người dùng vừa kéo chuột để xoay model (khoảng cách di chuyển > 6px), không coi là click
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

    const visibleMeshes = allMeshesRef.current.filter((m) => m.visible);
    const intersects = raycaster.intersectObjects(visibleMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      selectMesh(hit);
    } else {
      selectMesh(null);
    }
  };

  // Preset Handlers
  const handleApplyPreset = (presetId: string) => {
    setActivePreset(presetId);
    const preset = ANATOMY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActiveSystems(new Set(preset.systems));
    selectMesh(null);
  };

  const toggleSystem = (sysId: string) => {
    setActivePreset("custom");
    setActiveSystems((prev) => {
      const next = new Set(prev);
      if (next.has(sysId)) {
        next.delete(sysId);
      } else {
        next.add(sysId);
      }
      return next;
    });
  };

  const isolateSystem = (sysId: string) => {
    setActiveSystems(new Set([sysId]));
    setActivePreset("custom");
  };

  // Camera Presets
  const setCameraAngle = (angle: "front" | "back" | "side" | "perspective" | "head" | "chest" | "abdomen" | "arms" | "legs" | "reset") => {
    if (!cameraRef.current || !controlsRef.current) return;
    const c = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (angle) {
      case "front":
        flyCameraTo(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, 2.6));
        break;
      case "back":
        flyCameraTo(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, -2.6));
        break;
      case "side":
        flyCameraTo(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.6, 0.3, 0));
        break;
      case "perspective":
        flyCameraTo(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.8, 1.2, 2.2));
        break;
      case "head":
        flyCameraTo(new THREE.Vector3(0, 0.65, 0), new THREE.Vector3(0, 0.7, 0.95));
        break;
      case "chest":
        flyCameraTo(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.4, 1.15));
        break;
      case "abdomen":
        flyCameraTo(new THREE.Vector3(0, -0.05, 0), new THREE.Vector3(0, 0.05, 1.15));
        break;
      case "arms":
        flyCameraTo(new THREE.Vector3(0.35, 0.2, 0), new THREE.Vector3(0.5, 0.25, 1.3));
        break;
      case "legs":
        flyCameraTo(new THREE.Vector3(0, -0.55, 0), new THREE.Vector3(0, -0.5, 1.5));
        break;
      case "reset":
        flyCameraTo(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.4, 2.8));
        break;
    }
  };

  const filteredSystems = useMemo(() => {
    if (activeCategory === "all") return ANATOMY_SYSTEMS;
    return ANATOMY_SYSTEMS.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}>
      {/* Loading Stream Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-cyan-400 font-bold text-sm tracking-wide">
            Đang giải nén mô hình giải phẫu 3D ({loadProgress.percent}%)
          </p>
          <div className="w-64 h-2 bg-slate-800 rounded-full mt-3 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${loadProgress.percent}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            Đang nạp khối dữ liệu nhị phân: {loadProgress.current}/{loadProgress.total} Chunks
          </span>
        </div>
      )}

      {/* Error Message */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="max-w-md bg-red-950/80 border border-red-500/50 p-5 rounded-2xl text-center">
            <p className="text-red-400 font-bold text-sm mb-1">Không thể tải mô hình cơ thể!</p>
            <p className="text-xs text-red-200">{loadError}</p>
          </div>
        </div>
      )}

      {/* Main 3-Column Lab Layout: Regions/Systems (Left) + Viewport (Center) + Inspector (Right) */}
      <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left: Navigation Panel (Ảnh 2 & Ảnh 4) */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 bg-[#0b0f19] border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col h-auto lg:h-full z-20 overflow-hidden">
          {/* Header Title & Subtitle (Ảnh 2) */}
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Bản đồ cơ thể người</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">SINH HỌC · MÔ PHỎNG</p>
            </div>
          </div>

          {/* Search Box (Luôn hiển thị như Ảnh 2 & Ảnh 3) */}
          <div className="p-2.5 border-b border-slate-800/60 bg-slate-900/50 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm một cấu trúc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-500">/</span>
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-2 right-2 mt-1 z-30 max-h-56 overflow-y-auto bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl p-1 space-y-1">
                {(() => {
                  const q = searchQuery.toLowerCase().trim();
                  const results = allMeshesRef.current
                    .filter((m) => {
                      const name = (m.userData.name || "").toLowerCase();
                      const concept = (m.userData.conceptId || "").toLowerCase();
                      const id = (m.userData.id || "").toLowerCase();
                      return name.includes(q) || concept.includes(q) || id.includes(q);
                    })
                    .slice(0, 10);

                  if (results.length === 0) {
                    return (
                      <p className="p-2 text-center text-[11px] text-slate-400">
                        Không tìm thấy cấu trúc phù hợp
                      </p>
                    );
                  }

                  return results.map((m) => (
                    <button
                      key={m.uuid}
                      onClick={() => {
                        selectMesh(m);
                        setSearchQuery("");
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-xs text-slate-200 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold block truncate">
                          {m.userData.conceptId || m.userData.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {m.userData.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 flex-shrink-0">
                        {m.userData.system}
                      </span>
                    </button>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Quick 3D Organs Shortcut Bar (Luôn hiển thị như Ảnh 2 & Ảnh 3) */}
          <div className="p-2.5 border-b border-slate-800/60 bg-slate-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                CÁC CƠ QUAN 3D
              </span>
              <span className="text-[10px] font-mono text-slate-500">10</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "heart", name: "Tim", img: "/images/organs/heart.webp" },
                { id: "brain", name: "Não", img: "/images/organs/brain.webp" },
                { id: "lungs", name: "Phổi", img: "/images/organs/lungs.webp" },
              ].map((o) => (
                <button
                  key={o.id}
                  onClick={() => selectOrganInBody(o.id)}
                  className="p-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-750 flex flex-col items-center gap-1 transition-all group"
                  title={`Định vị ${o.name} trong cơ thể (X-quang)`}
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-900 p-0.5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.img} alt={o.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 group-hover:text-white">
                    {o.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2 Tabs: Các vùng | Các hệ cơ quan (Ảnh 2) */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/40 flex-shrink-0">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setLeftTab("regions")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === "regions"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Các vùng
              </button>
              <button
                onClick={() => setLeftTab("systems")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === "systems"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Các hệ cơ quan
              </button>
            </div>
          </div>

          {/* Left Panel Body: Regions or Systems */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {leftTab === "regions" ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed px-1">
                  Chọn một vùng cơ thể để khám phá các cấu trúc giải phẫu ở đó.
                </p>

                {/* 5 Region Buttons with silhouettes (Ảnh 2) */}
                <div className="space-y-1.5">
                  {[
                    { id: "head", name: "Đầu và cổ", angle: "head" as const },
                    { id: "chest", name: "Ngực", angle: "chest" as const },
                    { id: "abdomen", name: "Bụng & vùng chậu", angle: "abdomen" as const },
                    { id: "arms", name: "Cánh tay & bàn tay", angle: "arms" as const },
                    { id: "legs", name: "Chân & bàn chân", angle: "legs" as const },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setCameraAngle(r.angle)}
                      className="w-full p-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-sky-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          {r.name}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* GÓC XEM NHANH (Ảnh 3) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    GÓC XEM NHANH
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setActiveSystems(new Set(["cardiac", "respiratory", "digestive", "urinary"]));
                        selectMesh(null);
                      }}
                      className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center gap-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span>Cơ quan</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSystems(new Set(["skeletal"]));
                        selectMesh(null);
                      }}
                      className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center gap-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                        🦴
                      </div>
                      <span>Bộ xương</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSystems(new Set(["muscular", "skeletal"]));
                        selectMesh(null);
                      }}
                      className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center gap-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform">
                        💪
                      </div>
                      <span>Cơ</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      flyCameraTo(new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0, 0.15, 2.35));
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-sky-300 flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <span>💡</span>
                    <span>Tìm hiểu</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Systems Panel */
              <div className="space-y-3">
                {/* Category Chips */}
                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                  {ANATOMY_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                        activeCategory === cat.id
                          ? "bg-sky-600 text-white"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Systems List */}
                <div className="space-y-1">
                  {filteredSystems.map((sys) => {
                    const isVisible = activeSystems.has(sys.id);
                    return (
                      <div
                        key={sys.id}
                        className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          isVisible
                            ? "bg-slate-900/80 border-slate-700/60 text-slate-200"
                            : "bg-slate-900/30 border-slate-800/40 text-slate-500 opacity-50"
                        }`}
                      >
                        <div
                          onClick={() => toggleSystem(sys.id)}
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sys.color }}
                          />
                          <p className="text-xs font-semibold truncate leading-tight text-slate-200">
                            {sys.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => isolateSystem(sys.id)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-950/60 text-sky-400 border border-sky-800/40 hover:bg-sky-900"
                          >
                            Solo
                          </button>
                          <button
                            onClick={() => toggleSystem(sys.id)}
                            className={`p-1 rounded ${
                              isVisible ? "text-sky-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-800"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Left Panel Footer: Smart Labels & Sources (Ảnh 2) */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-1.5 flex-shrink-0">
            <button
              onClick={() => setSmartLabels(!smartLabels)}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Nhãn thông minh</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${smartLabels ? "bg-sky-400" : "bg-slate-600"}`} />
            </button>

            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
              <span>Nguồn và ghi công</span>
              <span>FMA Anatomy</span>
            </div>
          </div>
        </div>

        {/* Center: 3D Viewport */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col bg-[#070b13]">
          {/* Top-Left Tag: Cấu trúc đang hiện (Ảnh 2) */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-semibold text-slate-300">
              Cấu trúc đang hiện: {allMeshesRef.current.filter((m) => m.visible).length || 733}
            </span>
          </div>

          {/* Top-Right Zoom and Reset Controls (Ảnh 2) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={() => {
                if (cameraRef.current && controlsRef.current) {
                  const target = controlsRef.current.target;
                  const dir = cameraRef.current.position.clone().sub(target);
                  cameraRef.current.position.copy(target).add(dir.multiplyScalar(1.3));
                  controlsRef.current.update();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Thu nhỏ (Zoom xa)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (cameraRef.current && controlsRef.current) {
                  const target = controlsRef.current.target;
                  const dir = cameraRef.current.position.clone().sub(target);
                  cameraRef.current.position.copy(target).add(dir.multiplyScalar(0.75));
                  controlsRef.current.update();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Phóng to"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button
              onClick={() => setCameraAngle("reset")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đặt lại góc nhìn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* 3D Smart Pin Label */}
          <div
            ref={pinBadgeRef}
            style={{ display: "none" }}
            className="absolute top-0 left-0 z-20 pointer-events-none items-center gap-1.5 bg-slate-900/90 border border-sky-400/80 px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md transition-opacity"
          >
            <span className="w-2 h-2 rounded-full bg-pink-500 shadow-sm animate-pulse" />
            <span className="text-[11px] font-bold text-sky-200 tracking-wider">
              {selectedStructure?.viName || selectedStructure?.name}
            </span>
            {selectedStructure?.conceptId && (
              <span className="text-[9px] font-mono text-slate-400">
                ({selectedStructure.conceptId})
              </span>
            )}
          </div>

          {/* Floating Center Button: Quay lại toàn thân (Ảnh 4) */}
          {selectedStructure && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => {
                  selectMesh(null);
                  flyCameraTo(new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0, 0.15, 2.35));
                }}
                className="px-4 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-700 backdrop-blur-md text-xs font-semibold text-slate-200 hover:text-white shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
              >
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Quay lại toàn thân</span>
              </button>
            </div>
          )}

          {/* Floating Bottom Bar: Angles + Explode Slider (Ảnh 2 & Ảnh 3) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-lg bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl space-y-2">
            {/* Row 1: Angles & Gender */}
            <div className="flex items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setCameraAngle("front")}
                  className="px-2.5 py-1 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Mặt trước
                </button>
                <button
                  onClick={() => setCameraAngle("back")}
                  className="px-2.5 py-1 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Mặt sau
                </button>
                <button
                  onClick={() => setCameraAngle("side")}
                  className="px-2.5 py-1 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Mặt bên
                </button>
                <button
                  onClick={() => setCameraAngle("perspective")}
                  className="px-2.5 py-1 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Phối cảnh
                </button>
              </div>

              {/* Gender selector */}
              <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => {
                    if (gender !== "male") {
                      setGender("male");
                      loadAtlas("male");
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    gender === "male"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Nam
                </button>
                <button
                  onClick={() => {
                    if (gender !== "female") {
                      setGender("female");
                      loadAtlas("female");
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    gender === "female"
                      ? "bg-pink-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>

            {/* Row 2: Tách các cấu trúc ra xa nhau Slider (Ảnh 2 & 3) */}
            <div className="flex items-center justify-between gap-3 px-2 pt-1 border-t border-slate-800/60 text-xs">
              <span className="text-[11px] font-medium text-slate-300 whitespace-nowrap">
                Tách các cấu trúc ra xa nhau
              </span>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explodeLevel}
                  onChange={(e) => setExplodeLevel(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  title="Kéo thanh trượt để chia xếp các bộ phận thành hàng lối 2D"
                />
                <span className="font-mono text-[11px] text-slate-300 w-8 text-right font-semibold">
                  {explodeLevel}%
                </span>
                <button
                  onClick={() => setExplodeLevel(0)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Đặt lại vị trí"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Compass Orientation Gizmo (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 font-mono shadow-xl pointer-events-none">
            <span className="absolute top-1 text-[9px] font-bold">S</span>
            <span className="absolute left-1.5 text-[9px] font-bold">R</span>
            <span className="text-[10px] font-bold text-sky-400">A</span>
            <span className="absolute right-1.5 text-[9px] font-bold">L</span>
            <span className="absolute bottom-1 text-[9px] font-bold">I</span>
          </div>

          {/* Canvas Element Container */}
          <div
            ref={containerRef}
            onPointerDown={(e) => {
              pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
            }}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />
        </div>

        {/* Right: Structure Inspector Sidebar (Ảnh 2 & Ảnh 4) */}
        <div className="w-full lg:w-80 xl:w-88 flex-shrink-0 bg-[#0b0f19] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-auto lg:h-full z-20 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 bg-[#0b0f19] flex items-center justify-between flex-shrink-0">
            {selectedStructure ? (
              <button
                onClick={() => selectMesh(null)}
                className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Quay lại duyệt</span>
              </button>
            ) : (
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Khám phá Giải phẫu</span>
              </h3>
            )}
            {selectedStructure && (
              <button
                onClick={() => selectMesh(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
                title="Đóng chi tiết"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-xs">
            {selectedStructure ? (
              /* Selected Structure Details (Ảnh 4) */
              <div className="h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selectedStructure.systemColor }}
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {selectedStructure.systemName.toUpperCase()} · CẤU TRÚC RIÊNG LẺ
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {selectedStructure.viName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-sky-400 italic">
                        {selectedStructure.enName}
                      </span>
                      {selectedStructure.conceptId && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {selectedStructure.conceptId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      {selectedStructure.description}
                    </p>
                  </div>

                  {/* 3D Linked Organ Card (Ảnh 4) */}
                  {(() => {
                    const sys = selectedStructure.system;
                    const structLower = (selectedStructure.id + " " + selectedStructure.name).toLowerCase();
                    
                    let linked = { id: "heart", name: "Tim", image: "/images/organs/heart.webp" };
                    if (structLower.includes("stomach") || structLower.includes("dạ dày") || structLower.includes("gaster")) {
                      linked = { id: "stomach", name: "Dạ dày", image: "/images/organs/stomach.webp" };
                    } else if (structLower.includes("kidney") || structLower.includes("thận") || structLower.includes("ren")) {
                      linked = { id: "kidney", name: "Thận", image: "/images/organs/kidneys.webp" };
                    } else if (structLower.includes("pancreas") || structLower.includes("tụy")) {
                      linked = { id: "pancreas", name: "Tụy", image: "/images/organs/pancreas.webp" };
                    } else if (structLower.includes("liver") || structLower.includes("gan") || structLower.includes("mật")) {
                      linked = { id: "liver", name: "Gan", image: "/images/organs/liver.webp" };
                    } else if (structLower.includes("lung") || structLower.includes("phổi") || structLower.includes("khí quản") || structLower.includes("phế quản")) {
                      linked = { id: "lungs", name: "Phổi", image: "/images/organs/lungs.webp" };
                    } else if (structLower.includes("brain") || structLower.includes("não") || structLower.includes("tủy") || structLower.includes("cerebr")) {
                      linked = { id: "brain", name: "Não", image: "/images/organs/brain.webp" };
                    } else if (structLower.includes("eye") || structLower.includes("mắt") || structLower.includes("nhãn cầu")) {
                      linked = { id: "eyeball", name: "Nhãn cầu (Mắt)", image: "/images/organs/eyeball.webp" };
                    } else if (structLower.includes("intestine") || structLower.includes("ruột") || structLower.includes("tràng") || structLower.includes("colon")) {
                      linked = { id: "intestine", name: "Ruột & Tiêu hóa", image: "/images/organs/intestine.webp" };
                    } else {
                      const organMap: Record<string, { id: string; name: string; image: string }> = {
                        cardiac: { id: "heart", name: "Tim", image: "/images/organs/heart.webp" },
                        nervous: { id: "brain", name: "Não", image: "/images/organs/brain.webp" },
                        digestive: { id: "stomach", name: "Dạ dày", image: "/images/organs/stomach.webp" },
                        respiratory: { id: "lungs", name: "Phổi", image: "/images/organs/lungs.webp" },
                        urinary: { id: "kidney", name: "Thận", image: "/images/organs/kidneys.webp" },
                        endocrine: { id: "pancreas", name: "Tụy", image: "/images/organs/pancreas.webp" },
                        sensory: { id: "eyeball", name: "Nhãn cầu", image: "/images/organs/eyeball.webp" },
                      };
                      linked = organMap[sys] || { id: "heart", name: "Tim", image: "/images/organs/heart.webp" };
                    }
                    return (
                      <div
                        onClick={() => onNavigateToOrgan?.(linked.id)}
                        className="p-3 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/50 border border-sky-500/40 shadow-lg cursor-pointer hover:border-sky-400 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-sky-500/40 overflow-hidden p-0.5 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={linked.image} alt={linked.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white block group-hover:text-sky-300 transition-colors">
                              Khám phá ở dạng 3D
                            </span>
                            <span className="text-[11px] text-sky-400 block font-medium">
                              {linked.name}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* System Functional Info */}
                  {(() => {
                    const sysDef = ANATOMY_SYSTEMS.find((s) => s.id === selectedStructure.system);
                    if (!sysDef) return null;
                    return (
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                          VỀ HỆ NÀY
                        </span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {sysDef.description}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Big Blue-Indigo Action Button (Ảnh 4) */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={toggleIsolate}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
                      isIsolated
                        ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.02]"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>{isIsolated ? "Hiện cấu trúc xung quanh" : "Chỉ hiện cấu trúc này"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Initial Right Sidebar (Ảnh 2) */
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
                      KHÁM PHÁ GIẢI PHẪU
                    </span>
                    <h4 className="text-base font-bold text-white mb-1.5 leading-snug">
                      Hiểu rõ hơn về cơ thể bạn.
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Từ toàn bộ hệ cơ quan đến những cấu trúc nhỏ nhất. Khám phá cách cơ thể người kết nối với nhau.
                    </p>
                  </div>

                  {/* 3 Featured Organ Cards with Real 3D Images (Ảnh 2) */}
                  <div className="space-y-2 pt-1">
                    {[
                      { id: "heart", name: "Tim", system: "cardiac", image: "/images/organs/heart.webp", angle: "chest" as const },
                      { id: "brain", name: "Não", system: "nervous", image: "/images/organs/brain.webp", angle: "head" as const },
                      { id: "liver", name: "Gan", system: "digestive", image: "/images/organs/liver.webp", angle: "abdomen" as const },
                    ].map((organ) => (
                      <button
                        key={organ.id}
                        onClick={() => selectOrganInBody(organ.id)}
                        className="w-full p-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-between group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={organ.image} alt={organ.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors block">
                              {organ.name}
                            </span>
                            <span className="text-[10px] text-slate-400">Khám phá tiêu bản 3D</span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guided Tour Button & Bottom Note (Ảnh 2) */}
                <div className="space-y-3 pt-3">
                  <button
                    onClick={() => setCameraAngle("chest")}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-750 transition-all shadow-md"
                  >
                    <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Khám phá có hướng dẫn</span>
                  </button>
                  <p className="text-[10px] text-slate-500 leading-relaxed text-center px-2">
                    Chọn mô hình để xem kỹ một cấu trúc. Kéo để xoay, cuộn để thu phóng.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="p-2.5 border-t border-slate-800 bg-[#0b0f19] text-[10px] text-slate-400 flex items-center justify-between flex-shrink-0">
            <span>Xoay: Chuột trái · Phóng to: Cuộn</span>
            <span className="text-sky-400 font-medium">Atlas Giải phẫu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
