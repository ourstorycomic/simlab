import * as THREE from "three";
import { HotspotData, SlicePlaneType } from "@/components/ModelViewer";

// ─────────────────────────────────────────────────────────────────────────────
// 1. VẼ GIẢI PHẪU MẮT (EYEBALL CROSS-SECTION)
// ─────────────────────────────────────────────────────────────────────────────
function drawEyeballAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.40; // Bán kính nhãn cầu ~410px

    // 1.1 Khối dịch kính (Vitreous Body) - Buồng chứa dịch trong veo
    const vitGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, R);
    vitGrad.addColorStop(0, "#f0fdfa");
    vitGrad.addColorStop(0.35, "#e0f2fe");
    vitGrad.addColorStop(0.75, "#bae6fd");
    vitGrad.addColorStop(1, "#38bdf8");
    ctx.fillStyle = vitGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Ống Hyaloid mờ ảo chạy từ đĩa thị giác tới thể thủy tinh
    ctx.save();
    ctx.strokeStyle = "rgba(186, 230, 253, 0.45)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx + R * 0.85, cy);
    ctx.quadraticCurveTo(cx + 40, cy - 30, cx - R * 0.45, cy);
    ctx.stroke();
    ctx.restore();

    // 1.2 Võng mạc (Retina) - Lớp màng cảm quang màu cam hồng
    ctx.save();
    ctx.strokeStyle = "#fb923c";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 5, -Math.PI * 0.65, Math.PI * 0.65, false);
    ctx.stroke();

    // Viền răng cưa (Ora Serrata)
    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 10, -Math.PI * 0.62, Math.PI * 0.62, false);
    ctx.stroke();
    ctx.restore();

    // 1.3 Màng mạch (Choroid) - Lớp mạch máu nuôi dưỡng sẫm màu
    ctx.save();
    ctx.strokeStyle = "#3e1f17";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 2, -Math.PI * 0.72, Math.PI * 0.72, false);
    ctx.stroke();
    ctx.restore();

    // 1.4 Củng mạc (Sclera) - Lớp vỏ trắng đục bảo vệ bên ngoài
    ctx.save();
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 14, -Math.PI * 0.75, Math.PI * 0.75, false);
    ctx.stroke();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 24, -Math.PI * 0.75, Math.PI * 0.75, false);
    ctx.stroke();
    ctx.restore();

    // 1.5 Đĩa thị giác & Thần kinh thị giác (Optic Disc & Nerve) phía sau (Bên phải X > cx)
    const opticX = cx + R * 0.95;
    const opticY = cy;
    ctx.save();
    const nGrad = ctx.createLinearGradient(opticX - 20, opticY, opticX + 100, opticY);
    nGrad.addColorStop(0, "#fed7aa");
    nGrad.addColorStop(0.5, "#fdba74");
    nGrad.addColorStop(1, "#f97316");
    ctx.fillStyle = nGrad;
    ctx.beginPath();
    ctx.moveTo(opticX, opticY - 32);
    ctx.bezierCurveTo(opticX + 40, opticY - 28, opticX + 70, opticY - 24, opticX + 110, opticY - 20);
    ctx.lineTo(opticX + 110, opticY + 20);
    ctx.bezierCurveTo(opticX + 70, opticY + 24, opticX + 40, opticY + 28, opticX, opticY + 32);
    ctx.closePath();
    ctx.fill();

    // Đĩa thị giác (Điểm mù)
    ctx.fillStyle = "#ffedd5";
    ctx.beginPath();
    ctx.ellipse(opticX, opticY, 14, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cây mạch máu võng mạc
    const drawVessels = (color: string, offsetY: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(opticX, opticY + offsetY);
        ctx.quadraticCurveTo(cx + R * 0.6, cy - R * 0.4, cx + R * 0.2, cy - R * 0.75);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(opticX, opticY + offsetY);
        ctx.quadraticCurveTo(cx + R * 0.6, cy + R * 0.4, cx + R * 0.1, cy + R * 0.75);
        ctx.stroke();
    };
    drawVessels("#ef4444", -5); // Động mạch
    drawVessels("#0284c7", 5);  // Tĩnh mạch
    ctx.restore();

    // 1.6 Thể mi (Ciliary Body) & Dây chằng treo (Zonules)
    const lensX = cx - R * 0.42;
    const lensY = cy;
    const ciliaryTopY = cy - 130;
    const ciliaryBotY = cy + 130;

    ctx.save();
    ctx.fillStyle = "#b91c1c";
    // Thể mi trên
    ctx.beginPath();
    ctx.moveTo(lensX - 25, ciliaryTopY - 20);
    ctx.lineTo(lensX + 25, ciliaryTopY - 15);
    ctx.lineTo(lensX + 15, ciliaryTopY + 25);
    ctx.lineTo(lensX - 35, ciliaryTopY + 15);
    ctx.closePath();
    ctx.fill();

    // Thể mi dưới
    ctx.beginPath();
    ctx.moveTo(lensX - 25, ciliaryBotY + 20);
    ctx.lineTo(lensX + 25, ciliaryBotY + 15);
    ctx.lineTo(lensX + 15, ciliaryBotY - 25);
    ctx.lineTo(lensX - 35, ciliaryBotY - 15);
    ctx.closePath();
    ctx.fill();

    // Dây chằng treo (Zonular fibers)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1.2;
    for (let i = -15; i <= 15; i += 5) {
        ctx.beginPath();
        ctx.moveTo(lensX + i, ciliaryTopY + 15);
        ctx.lineTo(lensX + i * 0.6, lensY - 70);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(lensX + i, ciliaryBotY - 15);
        ctx.lineTo(lensX + i * 0.6, lensY + 70);
        ctx.stroke();
    }
    ctx.restore();

    // 1.7 Thể thủy tinh (Crystalline Lens) - Thấu kính hội tụ biconvex
    ctx.save();
    const lensGrad = ctx.createRadialGradient(lensX - 10, lensY - 15, 10, lensX, lensY, 80);
    lensGrad.addColorStop(0, "#ffffff");
    lensGrad.addColorStop(0.4, "#f0f9ff");
    lensGrad.addColorStop(0.75, "#bae6fd");
    lensGrad.addColorStop(1, "#38bdf8");
    ctx.fillStyle = lensGrad;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(lensX, lensY - 75);
    ctx.bezierCurveTo(lensX - 45, lensY - 40, lensX - 45, lensY + 40, lensX, lensY + 75);
    ctx.bezierCurveTo(lensX + 45, lensY + 40, lensX + 45, lensY - 40, lensX, lensY - 75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vệt sáng lấp lánh
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.ellipse(lensX - 18, lensY - 28, 10, 22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 1.8 Mống mắt (Iris) & Đồng tử (Pupil)
    ctx.save();
    const irisGrad = ctx.createLinearGradient(lensX - 50, 0, lensX, 0);
    irisGrad.addColorStop(0, "#1e3a8a");
    irisGrad.addColorStop(0.5, "#3b82f6");
    irisGrad.addColorStop(1, "#60a5fa");
    ctx.fillStyle = irisGrad;

    // Mống mắt trên
    ctx.beginPath();
    ctx.moveTo(lensX - 25, ciliaryTopY + 15);
    ctx.bezierCurveTo(lensX - 30, cy - 65, lensX - 40, cy - 45, lensX - 45, cy - 35);
    ctx.lineTo(lensX - 35, cy - 35);
    ctx.bezierCurveTo(lensX - 28, cy - 45, lensX - 20, cy - 60, lensX - 15, ciliaryTopY + 15);
    ctx.closePath();
    ctx.fill();

    // Mống mắt dưới
    ctx.beginPath();
    ctx.moveTo(lensX - 25, ciliaryBotY - 15);
    ctx.bezierCurveTo(lensX - 30, cy + 65, lensX - 40, cy + 45, lensX - 45, cy + 35);
    ctx.lineTo(lensX - 35, cy + 35);
    ctx.bezierCurveTo(lensX - 28, cy + 45, lensX - 20, cy + 60, lensX - 15, ciliaryBotY - 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 1.9 Tiền phòng (Anterior Chamber) & Giác mạc (Cornea)
    ctx.save();
    ctx.strokeStyle = "rgba(224, 242, 254, 0.9)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx - R * 0.1, cy, R * 0.72, Math.PI * 0.72, Math.PI * 1.28, false);
    ctx.stroke();

    ctx.fillStyle = "rgba(240, 249, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(cx - R * 0.1, cy, R * 0.68, Math.PI * 0.72, Math.PI * 1.28, false);
    ctx.lineTo(lensX - 35, cy - 70);
    ctx.lineTo(lensX - 35, cy + 70);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. VẼ GIẢI PHẪU TRÁI TIM (CORONAL 4-CHAMBER HEART CROSS-SECTION)
// ─────────────────────────────────────────────────────────────────────────────
function drawHeartAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;
    const cy = size / 2;

    const baseGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, size * 0.45);
    baseGrad.addColorStop(0, "#9f1239");
    baseGrad.addColorStop(0.65, "#881337");
    baseGrad.addColorStop(1, "#4c0519");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // Thớ sợi cơ tim
    ctx.save();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.22)";
    ctx.lineWidth = 2.2;
    for (let i = 80; i < size * 0.48; i += 12) {
        ctx.beginPath();
        ctx.ellipse(cx + 20, cy + 30, i * 0.9, i * 1.1, -0.2, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    // 2.1 Tâm nhĩ phải
    const raX = cx - 140;
    const raY = cy - 140;
    const raGrad = ctx.createRadialGradient(raX, raY, 20, raX, raY, 110);
    raGrad.addColorStop(0, "#1e1b4b");
    raGrad.addColorStop(0.6, "#311028");
    raGrad.addColorStop(1, "#881337");
    ctx.fillStyle = raGrad;
    ctx.beginPath();
    ctx.ellipse(raX, raY, 85, 95, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 2.2 Tâm nhĩ trái
    const laX = cx + 150;
    const laY = cy - 150;
    const laGrad = ctx.createRadialGradient(laX, laY, 20, laX, laY, 105);
    laGrad.addColorStop(0, "#3f0a1d");
    laGrad.addColorStop(0.65, "#4c0519");
    laGrad.addColorStop(1, "#881337");
    ctx.fillStyle = laGrad;
    ctx.beginPath();
    ctx.ellipse(laX, laY, 80, 85, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // 2.3 Tâm thất phải
    const rvX = cx - 145;
    const rvY = cy + 120;
    const rvGrad = ctx.createRadialGradient(rvX, rvY, 25, rvX, rvY, 130);
    rvGrad.addColorStop(0, "#17122e");
    rvGrad.addColorStop(0.65, "#2a0d1f");
    rvGrad.addColorStop(1, "#881337");
    ctx.fillStyle = rvGrad;
    ctx.beginPath();
    ctx.moveTo(rvX - 45, rvY - 140);
    ctx.bezierCurveTo(rvX - 110, rvY - 20, rvX - 95, rvY + 120, rvX - 15, rvY + 175);
    ctx.bezierCurveTo(rvX + 55, rvY + 130, rvX + 65, rvY - 30, rvX + 15, rvY - 140);
    ctx.closePath();
    ctx.fill();

    // 2.4 Tâm thất trái (Thành cơ dày 15mm)
    const lvX = cx + 140;
    const lvY = cy + 130;
    const lvGrad = ctx.createRadialGradient(lvX, lvY, 30, lvX, lvY, 150);
    lvGrad.addColorStop(0, "#450a18");
    lvGrad.addColorStop(0.7, "#2e0813");
    lvGrad.addColorStop(1, "#881337");
    ctx.fillStyle = lvGrad;
    ctx.beginPath();
    ctx.moveTo(lvX - 25, lvY - 150);
    ctx.bezierCurveTo(lvX + 90, lvY - 40, lvX + 105, lvY + 110, lvX + 25, lvY + 205);
    ctx.bezierCurveTo(lvX - 65, lvY + 215, lvX - 95, lvY + 100, lvX - 85, lvY - 150);
    ctx.closePath();
    ctx.fill();

    // 2.5 Vách liên thất
    ctx.save();
    ctx.fillStyle = "#9f1239";
    ctx.strokeStyle = "#be123c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 40);
    ctx.bezierCurveTo(cx - 35, cy + 120, cx - 15, cy + 220, cx + 55, cy + 340);
    ctx.lineTo(cx + 85, cy + 330);
    ctx.bezierCurveTo(cx + 50, cy + 210, cx + 45, cy + 110, cx + 45, cy - 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2.6 Cột cơ nhú
    const drawPapillary = (x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = "#be123c";
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0.2, 0, Math.PI * 2);
        ctx.fill();
    };
    drawPapillary(lvX + 50, lvY + 60, 26, 50);
    drawPapillary(lvX - 45, lvY + 75, 22, 45);
    drawPapillary(rvX - 45, rvY + 60, 20, 42);

    // 2.7 Van 2 lá & Van 3 lá
    ctx.save();
    ctx.strokeStyle = "#f8fafc";
    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.lineWidth = 4;

    // Van 2 lá
    ctx.beginPath();
    ctx.moveTo(laX - 55, laY + 80);
    ctx.quadraticCurveTo(laX - 25, laY + 130, laX - 35, laY + 160);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(laX + 45, laY + 80);
    ctx.quadraticCurveTo(laX + 20, laY + 130, laX + 25, laY + 155);
    ctx.stroke();

    // Van 3 lá
    ctx.beginPath();
    ctx.moveTo(raX - 40, raY + 90);
    ctx.quadraticCurveTo(raX - 20, raY + 135, raX - 25, raY + 160);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(raX + 45, raY + 90);
    ctx.quadraticCurveTo(raX + 20, raY + 135, raX + 22, raY + 155);
    ctx.stroke();

    // 2.8 Thừng gân (Chordae)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.6;
    const drawChorda = (vx: number, vy: number, px: number, py: number) => {
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(px, py);
        ctx.stroke();
    };
    drawChorda(laX - 35, laY + 160, lvX - 45, lvY + 50);
    drawChorda(laX - 30, laY + 160, lvX - 40, lvY + 55);
    drawChorda(laX + 25, laY + 155, lvX + 50, lvY + 35);
    drawChorda(laX + 20, laY + 155, lvX + 45, lvY + 40);
    drawChorda(raX - 25, raY + 160, rvX - 45, rvY + 40);
    drawChorda(raX + 22, raY + 155, rvX - 40, rvY + 45);
    ctx.restore();

    // 2.9 Mỡ rãnh tim và mạch vành
    ctx.save();
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 12;
    ctx.strokeRect(8, 8, size - 16, size - 16);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(cx - 195, cy - 25, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(cx - 180, cy - 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. VẼ GIẢI PHẪU NÃO BỘ (CHÍNH XÁC THEO MẶT CẮT CORONAL VÀ SAGITTAL)
// ─────────────────────────────────────────────────────────────────────────────

// 3.1 MẶT CẮT CORONAL (ĐỨNG NGANG - BỔ ĐÔI ĐỐI XỨNG 2 BÁN CẦU ĐẠI NÃO)
function drawBrainCoronalAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;
    const cy = size / 2;

    // Nền chất trắng dưới vỏ (Subcortical White Matter)
    const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, size * 0.45);
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(0.55, "#f6ede4");
    bgGrad.addColorStop(0.85, "#ebd9ca");
    bgGrad.addColorStop(1, "#cbb6a3");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // 1. Rãnh liên bán cầu não (Longitudinal Fissure) chạy dọc chính giữa
    ctx.save();
    ctx.strokeStyle = "#4a3b30";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, 30);
    ctx.lineTo(cx, cy - 65);
    ctx.stroke();

    // Màng não liềm đại não (Falx Cerebri)
    ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(cx, 30);
    ctx.lineTo(cx, cy - 70);
    ctx.stroke();
    ctx.restore();

    // 2. Vỏ não chất xám (Cerebral Cortex) uốn lượn đối xứng hai bên bán cầu
    ctx.save();
    ctx.strokeStyle = "#8c7a6b";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Vỏ não bán cầu trái
    ctx.beginPath();
    for (let a = -Math.PI * 0.5; a <= Math.PI * 0.6; a += 0.05) {
        const rad = size * 0.40 + Math.sin(a * 14) * 14;
        const x = cx - 15 - Math.cos(a + Math.PI * 0.5) * (rad * 0.88);
        const y = cy + Math.sin(a + Math.PI * 0.5) * (rad * 0.95);
        if (a === -Math.PI * 0.5) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Vỏ não bán cầu phải (đối xứng)
    ctx.beginPath();
    for (let a = -Math.PI * 0.5; a <= Math.PI * 0.6; a += 0.05) {
        const rad = size * 0.40 + Math.sin(a * 14) * 14;
        const x = cx + 15 + Math.cos(a + Math.PI * 0.5) * (rad * 0.88);
        const y = cy + Math.sin(a + Math.PI * 0.5) * (rad * 0.95);
        if (a === -Math.PI * 0.5) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Lớp viền vỏ não sẫm màu
    ctx.strokeStyle = "#5f4f43";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    // 3. Thể chai (Corpus Callosum) - Dải sợi trắng vắt ngang qua đường giữa
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 130, cy - 65);
    ctx.quadraticCurveTo(cx, cy - 95, cx + 130, cy - 65);
    ctx.quadraticCurveTo(cx, cy - 75, cx - 130, cy - 65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Hai buồng Não thất bên (Lateral Ventricles) đối xứng hai bên đường giữa
    const drawVentricleHorn = (side: number) => {
        ctx.save();
        const vGrad = ctx.createLinearGradient(cx + side * 40, cy - 55, cx + side * 100, cy + 20);
        vGrad.addColorStop(0, "#bae6fd");
        vGrad.addColorStop(1, "#0284c7");
        ctx.fillStyle = vGrad;

        ctx.beginPath();
        // Sừng não thất bên hình cánh bướm
        ctx.moveTo(cx + side * 15, cy - 60);
        ctx.quadraticCurveTo(cx + side * 85, cy - 50, cx + side * 95, cy);
        ctx.quadraticCurveTo(cx + side * 50, cy + 15, cx + side * 15, cy - 20);
        ctx.closePath();
        ctx.fill();

        // Đám rối mạch mạc viền đỏ (Choroid plexus)
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.restore();
    };
    drawVentricleHorn(-1); // Não thất bên trái
    drawVentricleHorn(1);  // Não thất bên phải

    // 5. Não thất ba (Third Ventricle) ở đường giữa
    ctx.save();
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(cx - 5, cy - 10, 10, 65);
    ctx.restore();

    // 6. Đồi thị (Thalamus) đối xứng hai bên não thất ba
    ctx.save();
    const drawThalamus = (side: number) => {
        const tx = cx + side * 75;
        const ty = cy + 25;
        const thalGrad = ctx.createRadialGradient(tx, ty, 10, tx, ty, 60);
        thalGrad.addColorStop(0, "#d5c4b3");
        thalGrad.addColorStop(1, "#9e8b7a");
        ctx.fillStyle = thalGrad;
        ctx.beginPath();
        ctx.ellipse(tx, ty, 55, 40, side * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#7c6858";
        ctx.lineWidth = 2;
        ctx.stroke();
    };
    drawThalamus(-1);
    drawThalamus(1);
    ctx.restore();

    // 7. Hồi hải mã (Hippocampus) cuộn ở sừng thái dương dưới
    ctx.save();
    const drawHippocampus = (side: number) => {
        const hx = cx + side * 180;
        const hy = cy + 160;
        ctx.strokeStyle = "#8c7a6b";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(hx, hy, 28, 0, Math.PI * 1.5, side < 0);
        ctx.stroke();
        // Lòng sừng thái dương
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(hx, hy, 12, 0, Math.PI * 2);
        ctx.fill();
    };
    drawHippocampus(-1);
    drawHippocampus(1);
    ctx.restore();

    // 8. Cầu não & Thân não ở trung tâm phía dưới
    ctx.save();
    const bsGrad = ctx.createLinearGradient(cx - 50, cy + 180, cx + 50, cy + 320);
    bsGrad.addColorStop(0, "#f5ebe1");
    bsGrad.addColorStop(1, "#cbb6a3");
    ctx.fillStyle = bsGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 240, 65, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8c7a6b";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
}

// 3.2 MẶT CẮT SAGITTAL (ĐỨNG DỌC GIỮA - THẤY THỂ CHAI, THÂN NÃO, TIỂU NÃO)
function drawBrainSagittalAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;
    const cy = size / 2;

    const bgGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, size * 0.48);
    bgGrad.addColorStop(0, "#fdfcfb");
    bgGrad.addColorStop(0.5, "#f5ebe1");
    bgGrad.addColorStop(0.85, "#e8d8c8");
    bgGrad.addColorStop(1, "#baa896");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Nan hoa dẫn truyền chất trắng
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 1.8;
    for (let a = -Math.PI * 0.85; a < Math.PI * 0.35; a += 0.08) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 120, cy - 30 + Math.sin(a) * 80);
        ctx.lineTo(cx + Math.cos(a) * 360, cy - 30 + Math.sin(a) * 320);
        ctx.stroke();
    }
    ctx.restore();

    // Vỏ não chất xám
    ctx.save();
    ctx.strokeStyle = "#8c7a6b";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let angle = -Math.PI * 0.95; angle <= Math.PI * 0.45; angle += 0.04) {
        const rad = size * 0.42 + Math.sin(angle * 18) * 16 + Math.cos(angle * 7) * 10;
        const x = cx + Math.cos(angle) * rad;
        const y = cy - 20 + Math.sin(angle) * (rad * 0.88);
        if (angle === -Math.PI * 0.95) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "#5f4f43";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Thể chai
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 190, cy - 35);
    ctx.bezierCurveTo(cx - 150, cy - 130, cx + 120, cy - 135, cx + 180, cy - 40);
    ctx.bezierCurveTo(cx + 195, cy - 15, cx + 175, cy + 10, cx + 155, cy - 15);
    ctx.bezierCurveTo(cx + 100, cy - 85, cx - 110, cy - 80, cx - 165, cy - 10);
    ctx.bezierCurveTo(cx - 185, cy + 15, cx - 205, cy - 10, cx - 190, cy - 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Não thất
    ctx.save();
    const ventGrad = ctx.createLinearGradient(cx, cy - 60, cx, cy + 20);
    ventGrad.addColorStop(0, "#bae6fd");
    ventGrad.addColorStop(1, "#38bdf8");
    ctx.fillStyle = ventGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy - 35);
    ctx.bezierCurveTo(cx - 90, cy - 65, cx + 90, cy - 65, cx + 140, cy - 25);
    ctx.bezierCurveTo(cx + 70, cy + 15, cx - 40, cy + 20, cx - 150, cy - 35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Đồi thị
    ctx.save();
    const thalGrad = ctx.createRadialGradient(cx, cy + 45, 10, cx, cy + 45, 75);
    thalGrad.addColorStop(0, "#d6c7b7");
    thalGrad.addColorStop(1, "#a89988");
    ctx.fillStyle = thalGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 45, 65, 45, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8c7d6c";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Tiểu não & Cây sự sống
    const cbX = cx + 160;
    const cbY = cy + 180;
    ctx.save();
    const cbGrad = ctx.createRadialGradient(cbX, cbY, 20, cbX, cbY, 130);
    cbGrad.addColorStop(0, "#a89485");
    cbGrad.addColorStop(0.8, "#7c685a");
    cbGrad.addColorStop(1, "#4a3c33");
    ctx.fillStyle = cbGrad;
    ctx.beginPath();
    ctx.ellipse(cbX, cbY, 125, 95, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Cây sự sống
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cbX - 65, cbY + 15);
    ctx.lineTo(cbX, cbY);
    ctx.stroke();

    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(cbX, cbY);
    ctx.quadraticCurveTo(cbX + 25, cbY - 45, cbX + 65, cbY - 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cbX, cbY);
    ctx.quadraticCurveTo(cbX + 45, cbY + 5, cbX + 90, cbY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cbX, cbY);
    ctx.quadraticCurveTo(cbX + 30, cbY + 45, cbX + 70, cbY + 65);
    ctx.stroke();
    ctx.restore();

    // Cầu não & thân não
    ctx.save();
    const bsGrad = ctx.createLinearGradient(cx - 70, cy + 90, cx - 10, cy + 280);
    bsGrad.addColorStop(0, "#f5ebe1");
    bsGrad.addColorStop(1, "#d5c4b3");
    ctx.fillStyle = bsGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 35, cy + 90);
    ctx.bezierCurveTo(cx - 105, cy + 130, cx - 110, cy + 180, cx - 45, cy + 210);
    ctx.lineTo(cx - 35, cy + 320);
    ctx.lineTo(cx + 25, cy + 320);
    ctx.lineTo(cx + 35, cy + 180);
    ctx.bezierCurveTo(cx + 30, cy + 120, cx + 15, cy + 90, cx - 35, cy + 90);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#8c7a6b";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. VẼ GIẢI PHẪU TUYẾN TỤY (PANCREAS ANATOMICAL CROSS-SECTION)
// Chuẩn 100% y khoa thực tế: Nhu mô tuyến đặc dạng chùm hạt (Acinar lobules),
// Ống tụy chính Wirsung phân nhánh xương cá, ống mật chủ hợp lưu tại bóng Vater,
// Động mạch & tĩnh mạch lách, cùng hàng ngàn tiểu đảo Langerhans nội tiết!
// Tuyệt đối là mô tuyến đặc, KHÔNG CÓ buồng hay hốc rỗng tim!
// ─────────────────────────────────────────────────────────────────────────────
function drawPancreasAtlas(ctx: CanvasRenderingContext2D, size: number, planeType: SlicePlaneType = "coronal") {
    const cx = size / 2;
    const cy = size / 2;

    if (planeType === "coronal") {
        // ── 4.A MẶT CẮT ĐỨNG NGANG DỌC THEO THÂN TUYẾN TỤY (CORONAL LONGITUDINAL) ──
        
        // 4.A.1 Nền nhu mô tụy vàng cam cá hồi tự nhiên (Parenchyma)
        const baseGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, size * 0.48);
        baseGrad.addColorStop(0, "#fed7aa"); // Vàng cam ấm tự nhiên
        baseGrad.addColorStop(0.35, "#fdba74");
        baseGrad.addColorStop(0.7, "#ea580c"); // Sắc hồng cam mô tuyến
        baseGrad.addColorStop(1, "#9a3412"); // Viền bao xơ ngoài tụy
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, size, size);

        // 4.A.2 Mạng lưới vách liên kết gian tiểu thùy (Interlobular connective tissue septa)
        ctx.save();
        ctx.strokeStyle = "rgba(194, 65, 12, 0.22)";
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 40; i++) {
            const sx = Math.random() * size;
            const sy = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(
                sx + (Math.random() - 0.5) * 120,
                sy + (Math.random() - 0.5) * 120,
                sx + (Math.random() - 0.5) * 120,
                sy + (Math.random() - 0.5) * 120,
                sx + (Math.random() - 0.5) * 180,
                sy + (Math.random() - 0.5) * 180
            );
            ctx.stroke();
        }
        ctx.restore();

        // 4.A.3 Hàng nghìn nang tuyến tụy acinar (Ngoại tiết - tiết enzyme)
        ctx.save();
        ctx.fillStyle = "rgba(254, 215, 170, 0.4)";
        ctx.strokeStyle = "rgba(180, 83, 9, 0.25)";
        ctx.lineWidth = 1.0;
        for (let x = 16; x < size; x += 18) {
            for (let y = 16; y < size; y += 18) {
                const offsetX = (Math.sin(x * 12.3 + y * 7.1) * 6);
                const offsetY = (Math.cos(x * 4.9 + y * 11.2) * 6);
                ctx.beginPath();
                ctx.arc(x + offsetX, y + offsetY, 6.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();

        // 4.A.4 Các Tiểu đảo Langerhans (Nội tiết tiết Insulin & Glucagon)
        // Tập trung mật độ dày đặc ở vùng thân & đuôi tụy
        ctx.save();
        for (let i = 0; i < 140; i++) {
            const lx = cx + (Math.sin(i * 4.7) * size * 0.42);
            const ly = cy + (Math.cos(i * 3.1) * size * 0.32);
            
            // Hào quang tiểu đảo
            const isletGrad = ctx.createRadialGradient(lx, ly, 1, lx, ly, 9);
            isletGrad.addColorStop(0, "#ffffff");
            isletGrad.addColorStop(0.5, "#fef08a"); // Tế bào Beta & Alpha
            isletGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
            ctx.fillStyle = isletGrad;
            ctx.beginPath();
            ctx.arc(lx, ly, 9, 0, Math.PI * 2);
            ctx.fill();

            // Vi mao mạch nuôi dưỡng tiểu đảo
            ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(lx, ly, 5.5, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // 4.A.5 Tĩnh mạch lách (Splenic Vein) chạy sau bờ trên tụy
        ctx.save();
        ctx.strokeStyle = "#1d4ed8"; // Màu xanh thẫm của tĩnh mạch
        ctx.lineWidth = 11;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.44, cy - 65);
        ctx.bezierCurveTo(cx - size * 0.20, cy - 85, cx + size * 0.15, cy - 60, cx + size * 0.40, cy - 70);
        ctx.stroke();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        // 4.A.6 Động mạch lách (Splenic Artery) uốn lượn ngoằn ngoèo đặc trưng
        ctx.save();
        ctx.strokeStyle = "#b91c1c"; // Màu đỏ tươi của động mạch
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.44, cy - 80);
        ctx.bezierCurveTo(cx - size * 0.30, cy - 110, cx - size * 0.15, cy - 65, cx - size * 0.05, cy - 100);
        ctx.bezierCurveTo(cx + size * 0.08, cy - 60, cx + size * 0.22, cy - 115, cx + size * 0.38, cy - 85);
        ctx.stroke();
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        // 4.A.7 Ống tụy chính (Ống Wirsung - Main Pancreatic Duct)
        // Chạy dài từ đuôi tụy (bên trái) qua thân tụy sang đầu tụy (bên phải)
        ctx.save();
        // Lớp vỏ cơ - liên kết trắng ngà
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.42, cy - 10);
        ctx.bezierCurveTo(cx - size * 0.22, cy - 35, cx + size * 0.08, cy + 5, cx + size * 0.35, cy + 45);
        ctx.stroke();

        // Lòng ống nhẵn trong veo dẫn dịch tụy trong suốt
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 7;
        ctx.stroke();

        // Các nhánh ống bài xuất nhỏ hình xương cá (Interlobular ductules)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.6;
        for (let t = 0.06; t < 0.94; t += 0.06) {
            const px = cx - size * 0.42 + t * (size * 0.77);
            const py = (cy - 10) * (1 - t) + (cy + 45) * t + Math.sin(t * Math.PI) * 15;
            
            // Nhánh trên
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - 14, py - 42);
            ctx.stroke();
            // Nhánh dưới
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 10, py + 42);
            ctx.stroke();
        }
        ctx.restore();

        // 4.A.8 Ống mật chủ (Common Bile Duct) hợp nhất tại đầu tụy (bên phải)
        const bdX = cx + size * 0.30;
        const bdY = cy + 40;
        ctx.save();
        // Vỏ ống mật
        ctx.strokeStyle = "#166534"; // Xanh mật gan
        ctx.lineWidth = 15;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bdX - 10, bdY - 150);
        ctx.quadraticCurveTo(bdX + 12, bdY - 60, bdX, bdY + 65);
        ctx.stroke();

        // Lòng dịch mật màu xanh lục
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Bóng gan tụy (Ampulla of Vater) nơi hai ống hợp lưu phình ra
        const vaterGrad = ctx.createRadialGradient(bdX + 2, bdY + 60, 4, bdX + 2, bdY + 60, 18);
        vaterGrad.addColorStop(0, "#f0fdf4");
        vaterGrad.addColorStop(0.5, "#22c55e");
        vaterGrad.addColorStop(1, "#14532d");
        ctx.fillStyle = vaterGrad;
        ctx.beginPath();
        ctx.arc(bdX + 2, bdY + 60, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // 4.A.9 Ống tụy phụ (Santorini Duct) tách nhánh ở đầu tụy
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx + size * 0.22, cy + 22);
        ctx.quadraticCurveTo(cx + size * 0.26, cy - 15, cx + size * 0.32, cy - 40);
        ctx.stroke();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

    } else {
        // ── 4.B MẶT CẮT NGANG/DỌC QUA THÂN TỤY (AXIAL & SAGITTAL CROSS-SECTION) ──
        // Tiết diện hình tam giác lăng trụ đặc trưng của thân tụy
        
        // Nền mô liên kết sau phúc mạc
        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(0, 0, size, size);

        // Khối nhu mô thân tụy hình lăng trụ/tam giác bo tròn
        ctx.save();
        const panCrossGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, size * 0.38);
        panCrossGrad.addColorStop(0, "#fed7aa");
        panCrossGrad.addColorStop(0.5, "#fb923c");
        panCrossGrad.addColorStop(0.85, "#c2410c");
        panCrossGrad.addColorStop(1, "#7c2d12");
        ctx.fillStyle = panCrossGrad;

        ctx.beginPath();
        ctx.moveTo(cx - size * 0.32, cy - size * 0.22); // Bờ trên
        ctx.bezierCurveTo(cx, cy - size * 0.30, cx + size * 0.28, cy - size * 0.25, cx + size * 0.34, cy);
        ctx.bezierCurveTo(cx + size * 0.30, cy + size * 0.28, cx, cy + size * 0.32, cx - size * 0.30, cy + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(154, 52, 18, 0.8)";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();

        // Nang tuyến acinar li ti rải đều trong mặt cắt
        ctx.save();
        ctx.fillStyle = "rgba(255, 237, 213, 0.4)";
        ctx.strokeStyle = "rgba(180, 83, 9, 0.3)";
        ctx.lineWidth = 1;
        for (let r = 25; r < size * 0.30; r += 20) {
            for (let a = 0; a < Math.PI * 2; a += 0.35) {
                const ax = cx + Math.cos(a) * r;
                const ay = cy + Math.sin(a) * r * 0.75;
                ctx.beginPath();
                ctx.arc(ax, ay, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();

        // Lòng ống tụy chính Wirsung cắt ngang (tiết diện tròn tâm ống)
        ctx.save();
        // Vành cơ ngoài
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx - 20, cy + 15, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Lòng ống xanh ngọc
        const ductGrad = ctx.createRadialGradient(cx - 20, cy + 15, 2, cx - 20, cy + 15, 18);
        ductGrad.addColorStop(0, "#e0f2fe");
        ductGrad.addColorStop(0.7, "#38bdf8");
        ductGrad.addColorStop(1, "#0284c7");
        ctx.fillStyle = ductGrad;
        ctx.beginPath();
        ctx.arc(cx - 20, cy + 15, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Tĩnh mạch lách chạy ở mặt sau tụy (Cắt ngang thành hình bầu dục lớn)
        ctx.save();
        const veinGrad = ctx.createRadialGradient(cx + 80, cy - 80, 5, cx + 80, cy - 80, 40);
        veinGrad.addColorStop(0, "#93c5fd");
        veinGrad.addColorStop(0.7, "#1d4ed8");
        veinGrad.addColorStop(1, "#172554");
        ctx.fillStyle = veinGrad;
        ctx.beginPath();
        ctx.ellipse(cx + 80, cy - 80, 42, 28, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Động mạch lách (Cắt ngang)
        ctx.save();
        const artGrad = ctx.createRadialGradient(cx - 90, cy - 100, 4, cx - 90, cy - 100, 24);
        artGrad.addColorStop(0, "#fca5a5");
        artGrad.addColorStop(0.7, "#dc2626");
        artGrad.addColorStop(1, "#7f1d1d");
        ctx.fillStyle = artGrad;
        ctx.beginPath();
        ctx.arc(cx - 90, cy - 100, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VẼ GIẢI PHẪU THẬN (CORONAL KIDNEY CROSS-SECTION)
// ─────────────────────────────────────────────────────────────────────────────
function drawKidneyAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;
    const cy = size / 2;

    const baseGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, size * 0.45);
    baseGrad.addColorStop(0, "#991b1b");
    baseGrad.addColorStop(0.7, "#7f1d1d");
    baseGrad.addColorStop(1, "#450a0a");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // Vỏ thận (Cortex)
    ctx.save();
    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 45;
    ctx.strokeRect(25, 25, size - 50, size - 50);

    // Cầu thận li ti
    ctx.fillStyle = "rgba(254, 202, 202, 0.45)";
    for (let i = 0; i < 350; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        if (x < 70 || x > size - 70 || y < 70 || y > size - 70) {
            ctx.beginPath();
            ctx.arc(x, y, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    // Các Tháp Thận (Renal Pyramids)
    const pyramidAngles = [-2.5, -2.0, -1.5, -0.9, 0.9, 1.5, 2.0, 2.5];
    pyramidAngles.forEach(angle => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        const dist = size * 0.28;
        const pGrad = ctx.createRadialGradient(dist, 0, 10, dist, 0, 70);
        pGrad.addColorStop(0, "#450a0a");
        pGrad.addColorStop(0.7, "#7f1d1d");
        pGrad.addColorStop(1, "#991b1b");
        ctx.fillStyle = pGrad;

        ctx.beginPath();
        ctx.moveTo(dist - 50, -5);
        ctx.lineTo(dist + 60, -45);
        ctx.bezierCurveTo(dist + 75, 0, dist + 75, 0, dist + 60, 45);
        ctx.lineTo(dist - 50, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    // Đài bể thận (Pelvis & Calyces)
    ctx.save();
    const pelGrad = ctx.createLinearGradient(cx - 80, cy, cx + 80, cy);
    pelGrad.addColorStop(0, "#f8fafc");
    pelGrad.addColorStop(0.5, "#e2e8f0");
    pelGrad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = pelGrad;
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(cx - 35, cy - 120);
    ctx.bezierCurveTo(cx - 80, cy - 70, cx - 95, cy + 60, cx - 40, cy + 130);
    ctx.lineTo(cx - 20, cy + 280);
    ctx.lineTo(cx + 20, cy + 280);
    ctx.bezierCurveTo(cx + 40, cy + 130, cx + 55, cy + 60, cx + 45, cy - 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mỡ xoang thận
    ctx.fillStyle = "rgba(254, 240, 138, 0.65)";
    for (let i = 0; i < 40; i++) {
        const fx = cx + (Math.random() - 0.5) * 110;
        const fy = cy + (Math.random() - 0.5) * 190;
        ctx.beginPath();
        ctx.arc(fx, fy, Math.random() * 8 + 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VẼ GIẢI PHẪU HỆ ĐƯỜNG RUỘT (INTESTINE ANATOMICAL CROSS-SECTION)
// Chuẩn 100% y khoa: Khung đại tràng (ruột già) bao quanh có múi phình Haustra,
// nếp bán nguyệt & dải mạc; mạc treo ruột chứa mạch máu rẽ quạt;
// ─────────────────────────────────────────────────────────────────────────────
// 6. VẼ GIẢI PHẪU MÔ ĐẶC HỆ ĐƯỜNG RUỘT (INTESTINE SOLID TISSUE CROSS-SECTION)
// Chuẩn mô thịt cơ trơn & niêm mạc máu đỏ tươi đồng nhất y khoa:
// Màu đỏ thẫm/đỏ máu tươi tự nhiên, thớ cơ trơn đan chéo, mạng vi mao mạch nuôi dưỡng
// và bề mặt mô sống ẩm ướt. Tuyệt đối không dùng hình vẽ 2D decal tròn gây lệch mô hình!
// ─────────────────────────────────────────────────────────────────────────────
function drawIntestineAtlas(ctx: CanvasRenderingContext2D, size: number, _planeType: SlicePlaneType = "coronal") {
    const cx = size / 2;
    const cy = size / 2;

    // 6.1 Nền mô cơ trơn & mô liên kết máu đỏ tươi (Rich Fleshy Red Base)
    const baseGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, size * 0.55);
    baseGrad.addColorStop(0, "#9f1239"); // Đỏ tươi mô cơ sống
    baseGrad.addColorStop(0.35, "#881337");
    baseGrad.addColorStop(0.7, "#6b0d26");
    baseGrad.addColorStop(1, "#4c0519"); // Đỏ thẫm máu mô sâu
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // 6.2 Thớ sợi cơ trơn nhu động đan xen tự nhiên (Smooth Muscle Fibers)
    ctx.save();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.18)";
    ctx.lineWidth = 2.0;
    for (let r = 30; r < size * 0.75; r += 12) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.05, r * 0.95, 0.2, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    // 6.3 Vi sợi cơ dọc và cơ vòng đan chéo mềm mại
    ctx.save();
    ctx.strokeStyle = "rgba(225, 29, 72, 0.22)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 220; i++) {
        const sx = Math.random() * size;
        const sy = Math.random() * size;
        const len = Math.random() * 80 + 30;
        const angle = (Math.random() - 0.5) * 0.6 + 0.3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        ctx.stroke();
    }
    ctx.restore();

    // 6.4 Mạng lưới vi mao mạch máu nuôi mô ruột (Micro-vascular Capillaries)
    ctx.save();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 45; i++) {
        let vx = Math.random() * size;
        let vy = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        for (let s = 0; s < 4; s++) {
            vx += (Math.random() - 0.5) * 60;
            vy += (Math.random() - 0.5) * 60;
            ctx.lineTo(vx, vy);
        }
        ctx.stroke();
    }

    // Nhánh tĩnh mạch vi tuần hoàn màu tím xanh sẫm
    ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 25; i++) {
        let vx = Math.random() * size;
        let vy = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        for (let s = 0; s < 3; s++) {
            vx += (Math.random() - 0.5) * 50;
            vy += (Math.random() - 0.5) * 50;
            ctx.lineTo(vx, vy);
        }
        ctx.stroke();
    }
    ctx.restore();

    // 6.5 Các điểm nhung mao & nang mô liên kết li ti (Mucosal Stroma Texture)
    ctx.save();
    ctx.fillStyle = "rgba(254, 205, 211, 0.25)";
    for (let i = 0; i < 600; i++) {
        const px = Math.random() * size;
        const py = Math.random() * size;
        ctx.beginPath();
        ctx.arc(px, py, Math.random() * 2.2 + 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Đốm ẩm ướt mô sống tự nhiên (Glistening specular highlights)
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    for (let i = 0; i < 80; i++) {
        const gx = Math.random() * size;
        const gy = Math.random() * size;
        ctx.beginPath();
        ctx.ellipse(gx, gy, Math.random() * 6 + 2, Math.random() * 3 + 1, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}


// ─────────────────────────────────────────────────────────────────────────────
// 7. VẼ CÁC CƠ QUAN KHÁC (GAN, PHỔI, DA)
// ─────────────────────────────────────────────────────────────────────────────
function drawLiverAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;
    const cy = size / 2;

    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, size * 0.45);
    grad.addColorStop(0, "#782218");
    grad.addColorStop(0.7, "#581810");
    grad.addColorStop(1, "#380d08");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Mạng lưới tiểu thùy gan đa giác
    ctx.save();
    ctx.strokeStyle = "rgba(185, 50, 36, 0.35)";
    ctx.lineWidth = 1.5;
    const r = 36;
    for (let x = 40; x < size; x += r * 1.7) {
        for (let y = 40; y < size; y += r * 1.5) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                const px = x + Math.cos(a) * r * 0.8;
                const py = y + Math.sin(a) * r * 0.8;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = "#2a0805";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy + 180);
    ctx.quadraticCurveTo(cx - 20, cy + 40, cx + 120, cy - 80);
    ctx.stroke();
    ctx.restore();
}

function drawLungAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;
    const cy = size / 2;

    const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, size * 0.45);
    grad.addColorStop(0, "#f43f5e");
    grad.addColorStop(0.6, "#be123c");
    grad.addColorStop(1, "#881337");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 8 + 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    const drawBronchus = (bx: number, by: number, rad: number) => {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#4c0519";
        ctx.beginPath();
        ctx.arc(bx, by, rad * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bx, by, rad + 3, 0, Math.PI * 2);
        ctx.stroke();
    };
    drawBronchus(cx - 80, cy - 60, 28);
    drawBronchus(cx + 90, cy - 30, 24);
    drawBronchus(cx + 20, cy + 90, 18);
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. VẼ GIẢI PHẪU VI THỂ CẤU TRÚC DA (SKIN HISTOLOGY CROSS-SECTION)
// Chuẩn 100% y khoa Atlas Netter: Lớp biểu bì sừng hóa có màng đáy nhú bì lượn sóng,
// nhiều nang lông cắm sâu có bao rễ, tuyến bã nhờn, cơ dựng lông,
// tuyến mồ hôi cuộn xoắn có ống lò xo, thụ thể xúc giác Meissner & Pacini,
// mạng mao mạch nhú bì và mô mỡ dưới da sống động!
// ─────────────────────────────────────────────────────────────────────────────
function drawSkinAtlas(ctx: CanvasRenderingContext2D, size: number) {
    const cx = size / 2;

    // 8.1 LỚP MÔ MỠ DƯỚI DA (HYPODERMIS / SUBCUTANEOUS FAT) - Tầng đáy (Y: 660 ~ 1024)
    // Nền mô liên kết mỡ vàng ấm
    const hypoGrad = ctx.createLinearGradient(0, size * 0.65, 0, size);
    hypoGrad.addColorStop(0, "#fde047");
    hypoGrad.addColorStop(0.5, "#facc15");
    hypoGrad.addColorStop(1, "#eab308");
    ctx.fillStyle = hypoGrad;
    ctx.fillRect(0, size * 0.65, size, size * 0.35);

    // Hàng trăm tế bào mỡ (Adipocytes) hình cầu tròn mềm mại
    ctx.save();
    for (let x = 12; x < size; x += 30) {
        for (let y = size * 0.66; y < size; y += 28) {
            const rx = x + ((y % 56 === 0) ? 14 : 0) + (Math.sin(x * 5.2 + y) * 3);
            const ry = y + (Math.cos(x + y * 4.1) * 3);
            const r = 14 + Math.sin(x * 3 + y * 7) * 2;
            
            // Giọt lipid màu vàng tươi
            const lipGrad = ctx.createRadialGradient(rx - 3, ry - 3, 2, rx, ry, r);
            lipGrad.addColorStop(0, "#fef9c3");
            lipGrad.addColorStop(0.7, "#fef08a");
            lipGrad.addColorStop(1, "#facc15");
            ctx.fillStyle = lipGrad;
            ctx.beginPath();
            ctx.arc(rx, ry, r, 0, Math.PI * 2);
            ctx.fill();

            // Màng tế bào mỡ
            ctx.strokeStyle = "rgba(202, 138, 4, 0.4)";
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Nhân tế bào mỡ dẹt bị ép sát màng
            ctx.fillStyle = "#854d0e";
            ctx.beginPath();
            ctx.ellipse(rx + r * 0.75, ry, 2, 3.5, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Các vách sợi liên kết màng ngăn mô mỡ (Fibrous Septa)
    ctx.strokeStyle = "rgba(254, 205, 211, 0.65)";
    ctx.lineWidth = 4;
    for (let sx = 80; sx < size; sx += 180) {
        ctx.beginPath();
        ctx.moveTo(sx, size * 0.65);
        ctx.bezierCurveTo(sx + 25, size * 0.78, sx - 20, size * 0.88, sx + 15, size);
        ctx.stroke();
    }
    ctx.restore();

    // 8.2 LỚP TRUNG BÌ / HẠ BÌ (DERMIS) - Tầng giữa (Y: 130 ~ 670)
    // Nền collagen và sợi chun elastin hồng tươi ấm áp
    const dermGrad = ctx.createLinearGradient(0, size * 0.13, 0, size * 0.67);
    dermGrad.addColorStop(0, "#fbcfe8"); // Hạ bì nông
    dermGrad.addColorStop(0.35, "#fda4af");
    dermGrad.addColorStop(0.75, "#fb7185"); // Hạ bì sâu
    dermGrad.addColorStop(1, "#f43f5e");
    ctx.fillStyle = dermGrad;
    ctx.fillRect(0, size * 0.13, size, size * 0.54);

    // Mạng lưới vi sợi collagen đan chéo
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 90; i++) {
        const lx = Math.random() * size;
        const ly = size * 0.15 + Math.random() * (size * 0.50);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (Math.random() - 0.5) * 80, ly + (Math.random() - 0.5) * 40);
        ctx.stroke();
    }
    ctx.restore();

    // 8.3 MẠNG LƯỚI MAO MẠCH MÁU DƯỚI DA & NHÚ BÌ (Dermal Capillaries)
    ctx.save();
    // Thân động mạch đỏ dưới da
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.64);
    ctx.bezierCurveTo(size * 0.3, size * 0.62, size * 0.7, size * 0.66, size, size * 0.63);
    ctx.stroke();

    // Thân tĩnh mạch xanh dưới da
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.66);
    ctx.bezierCurveTo(size * 0.35, size * 0.67, size * 0.65, size * 0.63, size, size * 0.67);
    ctx.stroke();

    // Các quai mao mạch vươn lên nhú bì
    for (let cxp = 45; cxp < size; cxp += 90) {
        // Động mạch nhánh đỏ
        ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(cxp, size * 0.64);
        ctx.quadraticCurveTo(cxp - 10, size * 0.35, cxp + 12, size * 0.15);
        ctx.stroke();

        // Tĩnh mạch nhánh xanh
        ctx.strokeStyle = "rgba(59, 130, 246, 0.85)";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(cxp + 12, size * 0.15);
        ctx.quadraticCurveTo(cxp + 25, size * 0.38, cxp + 8, size * 0.66);
        ctx.stroke();
    }
    ctx.restore();

    // 8.4 TUYẾN MỒ HÔI NGOẠI TIẾT (ECCRINE SWEAT GLANDS)
    // 2 búi tuyến mồ hôi cuộn xoắn như cuộn len ở hạ bì sâu với ống dẫn ngoằn ngoèo vươn lên bề mặt
    const sweatGlands = [
        { x: size * 0.22, y: size * 0.62 },
        { x: size * 0.72, y: size * 0.60 }
    ];

    sweatGlands.forEach(sg => {
        ctx.save();
        // Búi cuộn tuyến mồ hôi
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 0; i < 9; i++) {
            const ox = sg.x + Math.sin(i * 1.7) * 22;
            const oy = sg.y + Math.cos(i * 2.1) * 20;
            ctx.beginPath();
            ctx.arc(ox, oy, 11, 0, Math.PI * 2);
            ctx.stroke();

            // Lòng ống mồ hôi
            ctx.fillStyle = "#38bdf8";
            ctx.beginPath();
            ctx.arc(ox, oy, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ống bài xuất mồ hôi hình lò xo vươn thẳng lên bề mặt da
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        let py = sg.y - 20;
        let px = sg.x;
        ctx.moveTo(px, py);
        while (py > size * 0.04) {
            py -= 18;
            px += (Math.sin(py * 0.15) * 8);
            ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Lòng ống xanh nhạt
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Lỗ thoát mồ hôi (Sweat pore) ở lớp sừng
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.ellipse(px, size * 0.03, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 8.5 THỤ THỂ THẦN KINH CẢM GIÁC (SENSORY RECEPTORS)
    // A. Thể xúc giác Meissner ở nhú bì (nhận biết va chạm nhẹ)
    const meissnerPositions = [size * 0.15, size * 0.42, size * 0.68, size * 0.88];
    meissnerPositions.forEach(mx => {
        ctx.save();
        ctx.fillStyle = "#fef08a";
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(mx, size * 0.14, 8, 14, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sợi thần kinh cảm giác dẫn truyền
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mx, size * 0.15);
        ctx.quadraticCurveTo(mx - 8, size * 0.28, mx, size * 0.45);
        ctx.stroke();
        ctx.restore();
    });

    // B. Thể lá Pacini ở sâu trong mô mỡ (hình củ hành nhiều lớp đồng tâm - cảm nhận áp lực)
    const paciniPositions = [size * 0.36, size * 0.84];
    paciniPositions.forEach(px => {
        ctx.save();
        const py = size * 0.72;
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1.2;
        for (let r = 5; r <= 22; r += 4) {
            ctx.fillStyle = r === 5 ? "#eab308" : "rgba(254, 240, 138, 0.3)";
            ctx.beginPath();
            ctx.ellipse(px, py, r * 1.3, r, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    });

    // 8.6 NHIỀU NANG LÔNG (HAIR FOLLICLES) CẮM SÂU CHÂN THỰC THEO MÔ HÌNH 3D
    // Vẽ 6 nang lông tương ứng với toàn bộ các sợi lông trên đỉnh mô hình da
    const follicles = [
        { x: size * 0.18, tilt: -0.09, depth: size * 0.66, length: 110 },
        { x: size * 0.34, tilt: -0.06, depth: size * 0.72, length: 140 },
        { x: size * 0.50, tilt: -0.04, depth: size * 0.74, length: 155 },
        { x: size * 0.66, tilt: 0.05,  depth: size * 0.71, length: 135 },
        { x: size * 0.80, tilt: 0.08,  depth: size * 0.68, length: 120 },
        { x: size * 0.92, tilt: 0.11,  depth: size * 0.64, length: 105 }
    ];

    follicles.forEach(f => {
        ctx.save();
        const topX = f.x;
        const topY = 0;
        const botX = f.x + Math.sin(f.tilt) * f.depth;
        const botY = f.depth;

        // A. Bao rễ nang lông bên ngoài (Outer Root Sheath)
        ctx.strokeStyle = "#ffedd5";
        ctx.lineWidth = 20;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(topX, topY + 20);
        ctx.lineTo(botX, botY);
        ctx.stroke();

        ctx.strokeStyle = "#fed7aa";
        ctx.lineWidth = 14;
        ctx.stroke();

        // B. Tuyến bã nhờn (Sebaceous Gland) ôm hai bên cổ nang lông (Y ~ 220-320)
        const sebY = topY + (botY - topY) * 0.35;
        const sebX = topX + (botX - topX) * 0.35;

        const drawSebLobe = (lx: number, ly: number, lr: number) => {
            const sebGrad = ctx.createRadialGradient(lx, ly, 2, lx, ly, lr);
            sebGrad.addColorStop(0, "#ffffff");
            sebGrad.addColorStop(0.5, "#fef08a");
            sebGrad.addColorStop(1, "#f59e0b");
            ctx.fillStyle = sebGrad;
            ctx.beginPath();
            ctx.arc(lx, ly, lr, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#d97706";
            ctx.lineWidth = 1.0;
            ctx.stroke();
        };

        // Chùm nang tuyến bã bên trái
        drawSebLobe(sebX - 16, sebY, 12);
        drawSebLobe(sebX - 26, sebY + 12, 10);
        drawSebLobe(sebX - 18, sebY + 22, 11);

        // Chùm nang tuyến bã bên phải
        drawSebLobe(sebX + 16, sebY + 5, 11);
        drawSebLobe(sebX + 24, sebY + 18, 9);

        // C. Cơ dựng lông (Arrector Pili Muscle) nối từ giữa nang lông chéo lên nhú bì
        const mStartBackX = sebX - 12;
        const mStartBackY = sebY + 30;
        const mEndUpX = sebX - 85;
        const mEndUpY = size * 0.16;

        ctx.strokeStyle = "#be123c"; // Màu đỏ thẫm của cơ trơn
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(mStartBackX, mStartBackY);
        ctx.quadraticCurveTo((mStartBackX + mEndUpX) / 2 - 15, (mStartBackY + mEndUpY) / 2, mEndUpX, mEndUpY);
        ctx.stroke();

        // Thớ cơ trơn
        ctx.strokeStyle = "#fda4af";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // D. Bóng chân lông (Hair Bulb) phình to ở đáy cắm sâu vào mô mỡ
        const bulbGrad = ctx.createRadialGradient(botX, botY, 3, botX, botY, 26);
        bulbGrad.addColorStop(0, "#fed7aa");
        bulbGrad.addColorStop(0.5, "#d97706");
        bulbGrad.addColorStop(1, "#78350f");
        ctx.fillStyle = bulbGrad;
        ctx.beginPath();
        ctx.arc(botX, botY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Nhú bì chân tóc (Dermal papilla) khuyết lõm vào đáy chứa mao mạch nuôi
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(botX, botY + 14, 10, 0, Math.PI, true);
        ctx.fill();

        // E. Thân sợi lông sừng hóa (Hair Shaft) màu đen nâu bóng mượt
        ctx.strokeStyle = "#271206";
        ctx.lineWidth = 7.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(topX - Math.sin(f.tilt) * f.length, topY - f.length); // Sợi lông vươn ra ngoài không khí
        ctx.lineTo(botX, botY);
        ctx.stroke();

        // Lõi tủy sợi lông
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.restore();
    });

    // 8.7 LỚP BIỂU BÌ (EPIDERMIS) & MÀNG ĐÁY NHÚ BÌ LƯỢN SÓNG (Y: 0 ~ 130)
    ctx.save();
    // Nền tầng tế bào gai & đáy (Stratum Basale & Spinosum)
    const epiGrad = ctx.createLinearGradient(0, 0, 0, size * 0.14);
    epiGrad.addColorStop(0, "#fed7aa");
    epiGrad.addColorStop(0.65, "#fdba74");
    epiGrad.addColorStop(1, "#fb923c");
    ctx.fillStyle = epiGrad;

    // Ranh giới màng đáy nhấp nhô lượn sóng tạo nhú chân bì (Dermal Papillae)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, size * 0.12);
    for (let x = 0; x <= size; x += 24) {
        ctx.quadraticCurveTo(x + 6, size * 0.14, x + 12, size * 0.12);
        ctx.quadraticCurveTo(x + 18, size * 0.09, x + 24, size * 0.12);
    }
    ctx.lineTo(size, 0);
    ctx.closePath();
    ctx.fill();

    // Viền màng đáy đậm
    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.12);
    for (let x = 0; x <= size; x += 24) {
        ctx.quadraticCurveTo(x + 6, size * 0.14, x + 12, size * 0.12);
        ctx.quadraticCurveTo(x + 18, size * 0.09, x + 24, size * 0.12);
    }
    ctx.stroke();

    // Lớp sừng hóa bảo vệ trên cùng (Stratum Corneum) màu vàng nâu sừng mỏng
    const cornGrad = ctx.createLinearGradient(0, 0, 0, 24);
    cornGrad.addColorStop(0, "#fde68a");
    cornGrad.addColorStop(0.7, "#f59e0b");
    cornGrad.addColorStop(1, "#b45309");
    ctx.fillStyle = cornGrad;
    ctx.fillRect(0, 0, size, 22);

    // Vảy sừng bong tróc mỏng nhẹ trên bề mặt
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 40; i++) {
        const vx = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(vx, 3);
        ctx.lineTo(vx + 15, 2);
        ctx.stroke();
    }
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// BỘ ĐIỀU PHỐI VẼ TEXTURE ATLAS CHUYÊN NGHIỆP THEO TỪNG CƠ QUAN VÀ TRỤC CẮT
// ─────────────────────────────────────────────────────────────────────────────
export function createAnatomicalAtlasTexture(url: string, planeType: SlicePlaneType = "coronal"): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) return new THREE.CanvasTexture(canvas);

    const lower = url.toLowerCase();
    if (lower.includes("eyeball")) {
        drawEyeballAtlas(ctx, size);
    } else if (lower.includes("heart")) {
        drawHeartAtlas(ctx, size);
    } else if (lower.includes("brain")) {
        // Nếu cắt Coronal (đứng ngang): Vẽ hai bán cầu não đối xứng chuẩn y khoa!
        // Nếu cắt Sagittal (đứng dọc): Vẽ thể chai, cầu não và cây sự sống tiểu não!
        if (planeType === "coronal") {
            drawBrainCoronalAtlas(ctx, size);
        } else {
            drawBrainSagittalAtlas(ctx, size);
        }
    } else if (lower.includes("pancreas")) {
        // Tuyến tụy: Ống tụy chính Wirsung, ống mật chủ, tiểu thùy tụy và tiểu đảo Langerhans!
        drawPancreasAtlas(ctx, size, planeType);
    } else if (lower.includes("intestine")) {
        // Hệ đường ruột: Khung đại tràng haustra, mạc treo ruột và mạng quai ruột non
        drawIntestineAtlas(ctx, size, planeType);
    } else if (lower.includes("kidney")) {
        drawKidneyAtlas(ctx, size);
    } else if (lower.includes("liver")) {
        drawLiverAtlas(ctx, size);
    } else if (lower.includes("lung")) {
        drawLungAtlas(ctx, size);
    } else if (lower.includes("skin")) {
        drawSkinAtlas(ctx, size);
    } else {
        drawPancreasAtlas(ctx, size, planeType);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.needsUpdate = true;
    return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁC ĐIỂM CHÚ THÍCH GIẢI PHẪU NỘI TẠNG KHI CẮT LỚP (INTERNAL HOTSPOTS)
// ─────────────────────────────────────────────────────────────────────────────
export function getInternalHotspotsForOrgan(url: string, planeType: SlicePlaneType = "coronal"): HotspotData[] {
    const lower = url.toLowerCase();

    if (lower.includes("pancreas")) {
        return [
            {
                id: "int-pancreatic-duct",
                label: "Ống tụy chính (Ống Wirsung)",
                description: "Đường ống chính chạy dọc từ đuôi đến đầu tụy, thu thập toàn bộ men tiêu hóa (amylase, lipase, protease) để dẫn xuống tá tràng.",
                position: [0.0, 0.0, 0.0]
            },
            {
                id: "int-bile-duct",
                label: "Ống mật chủ hợp lưu",
                description: "Đoạn ống mật dẫn dịch mật từ gan đi xuống, hợp nhất với ống tụy tại bóng Vater để cùng đổ dịch vào ruột non.",
                position: [0.75, 0.2, 0.0]
            },
            {
                id: "int-acini",
                label: "Nang tuyến tụy ngoại tiết",
                description: "Hàng triệu cụm tế bào nang tụy sản xuất hơn 1 lít enzyme tiêu hóa mỗi ngày để trung hòa và tiêu hóa thức ăn.",
                position: [-0.65, -0.2, 0.0]
            },
            {
                id: "int-islets",
                label: "Tiểu đảo Langerhans nội tiết",
                description: "Các cụm tế bào thần kỳ rải rác trong tụy chứa tế bào Beta (tiết Insulin hạ đường huyết) và tế bào Alpha (tiết Glucagon tăng đường huyết).",
                position: [-0.35, 0.35, 0.0]
            }
        ];
    }

    if (lower.includes("intestine")) {
        return [
            {
                id: "int-colon-haustra",
                label: "Múi phình & Nếp bán nguyệt Đại tràng",
                description: "Khung đại tràng (ruột già) có đường kính lớn gấp đôi ruột non, các nếp gấp bán nguyệt chia đại tràng thành chuỗi các múi phình (haustra) chuyên hút kiệt nước và tạo khuôn chất thải.",
                position: [-0.95, 0.35, 0.0]
            },
            {
                id: "int-jejunum-loops",
                label: "Quai Hỗng tràng & Nếp gấp Kerckring",
                description: "Hàng chục quai ruột non xếp tầng ở trung tâm với nếp gấp vòng Kerckring và hàng triệu lông mao mịn màng, làm tăng diện tích hấp thu dưỡng chất lên tới 250m².",
                position: [0.0, 0.0, 0.0]
            },
            {
                id: "int-mesentery-vessels",
                label: "Mạc treo & Bó mạch mạc treo tràng trên",
                description: "Tấm màng kép phúc mạc chứa mô mỡ vàng và mạng lưới động - tĩnh mạch mạc treo tràng trên tỏa hình rẽ quạt để nuôi dưỡng và đưa toàn bộ chất dinh dưỡng về gan.",
                position: [0.35, -0.25, 0.0]
            },
            {
                id: "int-rectum-ampulla",
                label: "Ống Trực tràng (Rectum)",
                description: "Đoạn cuối cùng dài khoảng 12-15cm có thành cơ trơn cực dày, nối liền đại tràng sigma xuống hậu môn để kiểm soát việc đào thải.",
                position: [0.0, -1.05, 0.0]
            }
        ];
    }

    if (lower.includes("eyeball")) {
        return [
            {
                id: "int-lens",
                label: "Thể thủy tinh (Lens)",
                description: "Thấu kính hội tụ trong suốt biconvex, điều tiết tiêu cự để ánh sáng hội tụ chính xác trên hoàng điểm võng mạc.",
                position: [-0.35, 0.0, 0.0]
            },
            {
                id: "int-vitreous",
                label: "Khối dịch kính (Vitreous Body)",
                description: "Chất keo dạng gelatin trong suốt chiếm 80% thể tích nhãn cầu, giúp duy trì áp lực nội nhãn và hình dạng quả cầu mắt.",
                position: [0.15, 0.0, 0.0]
            },
            {
                id: "int-retina",
                label: "Võng mạc (Retina)",
                description: "Lớp màng thần kinh cảm quang mỏng manh chứa hơn 120 triệu tế bào que (nhìn tối) và 6 triệu tế bào nón (nhìn màu).",
                position: [0.75, 0.45, 0.0]
            },
            {
                id: "int-iris",
                label: "Mống mắt & Đồng tử",
                description: "Khẩu độ sinh học tự động đóng mở để kiểm soát lượng photon ánh sáng đi vào mắt.",
                position: [-0.45, 0.45, 0.0]
            }
        ];
    }

    if (lower.includes("heart")) {
        return [
            {
                id: "int-left-ventricle",
                label: "Buồng Tâm thất trái (LV)",
                description: "Buồng tim quan trọng nhất, có thành cơ tim dày gấp 3 lần thất phải (12-15mm) để tạo áp lực tống máu nuôi dưỡng toàn cơ thể.",
                position: [0.55, -0.45, 0.0]
            },
            {
                id: "int-right-ventricle",
                label: "Buồng Tâm thất phải (RV)",
                description: "Buồng tim hình trăng khuyết nhận máu tĩnh mạch và bơm qua động mạch phổi lên hai lá phổi.",
                position: [-0.55, -0.45, 0.0]
            },
            {
                id: "int-septum",
                label: "Vách liên thất (Septum)",
                description: "Khối vách cơ chắc khỏe ngăn đôi hai tâm thất, ngăn chặn sự pha trộn giữa máu giàu oxy và máu nghèo oxy.",
                position: [0.05, -0.2, 0.0]
            },
            {
                id: "int-mitral-valve",
                label: "Van 2 lá & Thừng gân",
                description: "Hệ thống van lá và các dây chằng thừng gân (Chordae Tendineae) neo vào cột cơ nhú, ngăn máu chảy ngược về tâm nhĩ trái.",
                position: [0.35, 0.15, 0.0]
            }
        ];
    }

    if (lower.includes("brain")) {
        if (planeType === "coronal") {
            return [
                {
                    id: "int-cortex-coronal",
                    label: "Vỏ não chất xám (Cerebral Cortex)",
                    description: "Dải chất xám dày 3-4mm bao bọc bên ngoài cả hai bán cầu đại não, chứa hàng tỷ thân neuron điều hành tư duy và cảm giác.",
                    position: [-0.75, 0.65, 0.0]
                },
                {
                    id: "int-corpus-callosum",
                    label: "Thể chai (Corpus Callosum)",
                    description: "Dải sợi thần kinh trắng khổng lồ gồm hơn 200 triệu sợi trục kết nối và truyền tin liên tục giữa hai bán cầu đại não.",
                    position: [0.0, 0.25, 0.0]
                },
                {
                    id: "int-ventricles-bilateral",
                    label: "Não thất bên đối xứng (Ventricles)",
                    description: "Hai khoang rỗng đối xứng chứa dịch não tủy (CSF) và đám rối mạch mạc, nâng đỡ não bộ khỏi trọng lực và va đập.",
                    position: [-0.25, 0.05, 0.0]
                },
                {
                    id: "int-hippocampus",
                    label: "Hồi hải mã (Hippocampus)",
                    description: "Cấu trúc hình con cá ngựa cuộn sâu trong thùy thái dương, trung tâm chuyển hóa ký ức ngắn hạn thành ký ức dài hạn.",
                    position: [0.55, -0.45, 0.0]
                }
            ];
        }

        return [
            {
                id: "int-corpus-callosum",
                label: "Thể chai (Corpus Callosum)",
                description: "Dải sợi thần kinh trắng khổng lồ gồm hơn 200 triệu sợi trục kết nối và truyền tin liên tục giữa hai bán cầu đại não.",
                position: [0.0, 0.25, 0.0]
            },
            {
                id: "int-ventricle",
                label: "Não thất bên (Ventricle)",
                description: "Hệ thống khoang rỗng sản sinh và lưu thông dịch não tủy (CSF) để nâng đỡ và bảo vệ não bộ khỏi chấn động.",
                position: [0.1, 0.05, 0.0]
            },
            {
                id: "int-arbor-vitae",
                label: "Cây sự sống (Arbor Vitae)",
                description: "Cấu trúc chất trắng phân nhánh kỳ diệu bên trong tiểu não, kiểm soát sự phối hợp vận động và giữ thăng bằng cơ thể.",
                position: [0.65, -0.65, 0.0]
            }
        ];
    }

    if (lower.includes("kidney")) {
        return [
            {
                id: "int-pyramid",
                label: "Tháp thận (Renal Pyramid)",
                description: "Cấu trúc hình nón của tủy thận chứa hàng nghìn ống góp và quai Henle làm nhiệm vụ cô đặc nước tiểu.",
                position: [0.45, 0.35, 0.0]
            },
            {
                id: "int-pelvis",
                label: "Bể thận (Renal Pelvis)",
                description: "Khoang hình phễu lớn gom toàn bộ nước tiểu từ các đài thận để dẫn xuống ống niệu quản.",
                position: [-0.05, 0.0, 0.0]
            },
            {
                id: "int-cortex",
                label: "Vỏ thận (Renal Cortex)",
                description: "Lớp ngoài chứa hơn 1 triệu cuộn mao mạch cầu thận (Nephron) đảm nhiệm việc lọc máu không ngừng nghỉ.",
                position: [-0.75, 0.55, 0.0]
            }
        ];
    }

    return [];
}
