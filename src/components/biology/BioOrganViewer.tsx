"use client";

import React, { useState } from "react";
import ModelViewer, { HotspotData } from "../ModelViewer";

export interface Organ {
  id: string;
  name: string;
  latin?: string;
  file: string;
  description: string;
  function: string;
  systems: string[];
  specs?: {
    role: string;
    location: string;
    size: string;
    weight: string;
    bloodSupply: string;
    tissue: string;
  };
  note?: string;
  hotspots?: HotspotData[];
}

export const ORGANS: Organ[] = [
  {
    id: "heart",
    name: "Tim",
    latin: "Cor",
    file: "/models/heart.glb",
    description: "Một cơ bơm cơ bắp giúp đưa máu đi khắp cơ thể. Tim gồm 4 buồng với hệ thống van tim phức tạp giúp máu lưu thông theo một chiều duy nhất qua vòng tuần hoàn phổi và hệ thống.",
    function: "Đập khoảng 100.000 lần mỗi ngày để luân chuyển 5-6 lít máu đi nuôi dưỡng toàn bộ các tế bào trong cơ thể.",
    systems: ["Hệ tuần hoàn", "Hệ tim mạch"],
    specs: {
      role: "Tuần hoàn máu",
      location: "Giữa ngực bên trái",
      size: "Khoảng bằng nắm tay",
      weight: "250–350 g",
      bloodSupply: "Động mạch vành trái và phải",
      tissue: "Cơ tim",
    },
    note: "Tim đập khoảng 100.000 lần mỗi ngày ở người trưởng thành bình thường.",
    hotspots: [
      { id: "left-atrium", label: "Tâm nhĩ trái", description: "Nhận máu giàu oxy từ phổi đổ về rồi đẩy xuống tâm thất trái qua van hai lá.", position: [0.82, 0.65, 0.5] },
      { id: "aorta", label: "Động mạch chủ", description: "Động mạch chủ (Aorta) là ống dẫn máu lớn nhất cơ thể, tiếp nhận máu giàu oxy từ tâm thất trái dưới áp lực cực lớn.", position: [-0.35, 1.65, 0.55] },
      { id: "right-atrium", label: "Tâm nhĩ phải", description: "Tiếp nhận máu đỏ thẫm nghèo oxy từ tĩnh mạch chủ. Chứa nút xoang (SA node) - máy tạo nhịp tim tự nhiên.", position: [-0.9, 0.35, 0.55] },
      { id: "left-ventricle", label: "Tâm thất trái", description: "Buồng tim khỏe nhất, thành cơ dày gấp 3 lần thất phải để tạo áp lực tống máu đi nuôi toàn cơ thể.", position: [0.7, -0.75, 0.65] },
      { id: "right-ventricle", label: "Tâm thất phải", description: "Bơm máu nghèo oxy lên động mạch phổi để thực hiện trao đổi khí tại phế nang.", position: [-0.65, -0.68, 0.66] },
      { id: "apex", label: "Mỏm tim", description: "Điểm thấp nhất và nhọn nhất của tim, hướng xuống dưới và chếch sang trái lồng ngực.", position: [0.18, -1.35, 0.48] },
    ],
  },
  {
    id: "brain",
    name: "Não",
    latin: "Encephalon",
    file: "/models/brain.glb",
    description: "Bộ não là trung tâm chỉ huy phức tạp nhất của cơ thể con người, chứa khoảng 86 tỷ tế bào thần kinh (neuron) kết nối với nhau qua hàng nghìn tỷ khớp thần kinh (synapse).",
    function: "Xử lý hàng triệu tín hiệu mỗi giây, kiểm soát nhịp tim, nhịp thở và các tư duy logic, trí nhớ, cảm xúc bậc cao.",
    systems: ["Hệ thần kinh trung ương"],
    specs: {
      role: "Xử lý thông tin và điều khiển",
      location: "Trong hộp sọ",
      size: "Thể tích ~1.200–1.400 cm³",
      weight: "Khoảng 1.3–1.4 kg",
      bloodSupply: "Động mạch cảnh trong & động mạch đốt sống",
      tissue: "Mô thần kinh (chất xám & chất trắng)",
    },
    note: "Bộ não tiêu thụ tới 20% lượng oxy và năng lượng của toàn bộ cơ thể dù chỉ chiếm 2% khối lượng.",
    hotspots: [
      { id: "frontal", label: "Thùy trán", description: "Trung tâm điều hành tối cao: ra quyết định, giải quyết vấn đề và ngôn ngữ vận động.", position: [-0.7, 0.65, 0.8] },
      { id: "parietal", label: "Thùy đỉnh", description: "Tích hợp cảm giác xúc giác, nhiệt độ, áp lực và định hướng không gian bản thể.", position: [0.15, 1.1, 0.65] },
      { id: "temporal", label: "Thùy thái dương", description: "Xử lý âm thanh, ngôn ngữ Wernicke và ghi nhớ ký ức thông qua hồi hải mã.", position: [0.75, -0.1, 0.82] },
      { id: "cerebellum", label: "Tiểu não", description: "Duy trì thăng bằng và điều phối nhịp nhàng các vận động tinh xảo của cơ bắp.", position: [0.72, -0.9, 0.55] },
    ],
  },
  {
    id: "liver",
    name: "Gan",
    latin: "Hepar",
    file: "/models/liver.glb",
    description: "Nhà máy hóa sinh đồ sộ nhất của cơ thể người, thực hiện hơn 500 chức năng chuyển hóa, khử độc và tiết mật.",
    function: "Chuyển hóa chất dinh dưỡng, lọc bỏ độc tố khỏi dòng máu và sản xuất dịch mật hỗ trợ tiêu hóa chất béo.",
    systems: ["Hệ tiêu hóa"],
    specs: {
      role: "Chuyển hóa, khử độc & tiết mật",
      location: "Hạ sườn phải, dưới cơ hoành",
      size: "Rộng khoảng 25–28 cm",
      weight: "1.4–1.8 kg",
      bloodSupply: "Tĩnh mạch cửa (75%) và động mạch gan (25%)",
      tissue: "Nhu mô gan và các tiểu thùy gan",
    },
    note: "Gan là cơ quan nội tạng duy nhất trong cơ thể có khả năng tự tái tạo mô bị tổn thương.",
    hotspots: [
      { id: "right-lobe", label: "Thùy gan phải", description: "Thùy lớn nhất chiếm phần lớn thể tích gan, chứa các tiểu thùy gan lọc máu.", position: [0.8, 0.2, 0.6] },
      { id: "left-lobe", label: "Thùy gan trái", description: "Thùy nhỏ hơn kéo dài sang bên trái dạ dày.", position: [-0.8, 0.3, 0.5] },
      { id: "gallbladder", label: "Túi mật", description: "Túi chứa và cô đặc dịch mật trước khi bài xuất vào tá tràng.", position: [0.3, -0.5, 0.7] },
    ],
  },
  {
    id: "lungs",
    name: "Phổi",
    latin: "Pulmones",
    file: "/models/lungs.glb",
    description: "Cơ quan hô hấp dạng bọt xốp đàn hồi, chiếm phần lớn không gian lồng ngực. Bên trong là mạng lưới phế quản phân nhánh kết thúc tại hơn 300 triệu phế nang.",
    function: "Trao đổi khí sinh tồn: oxy (O₂) khuếch tán vào máu và carbon dioxide (CO₂) thải ra ngoài qua từng nhịp thở.",
    systems: ["Hệ hô hấp"],
    specs: {
      role: "Trao đổi khí O₂ & CO₂",
      location: "Hai bên lồng ngực, ôm lấy tim",
      size: "Dung tích sống 3–5 lít",
      weight: "1.0–1.2 kg cả hai bên",
      bloodSupply: "Động mạch phổi và động mạch phế quản",
      tissue: "Nhu mô phổi & 300 triệu phế nang",
    },
    note: "Tổng diện tích bề mặt trao đổi khí của phế nang hai lá phổi rộng tương đương một sân tennis (khoảng 70–100 m²).",
    hotspots: [
      { id: "trachea", label: "Khí quản", description: "Ống dẫn khí hình trụ cấu tạo bởi các vòng sụn chữ C.", position: [0, 1.6, 0.2] },
      { id: "right-lung", label: "Phổi phải", description: "Gồm 3 thùy riêng biệt (trên, giữa, dưới), lớn hơn phổi trái.", position: [-1.2, 0.1, 0.7] },
      { id: "left-lung", label: "Phổi trái", description: "Chỉ gồm 2 thùy và có hố tim để ôm trọn mỏm tim lệch sang trái.", position: [1.2, 0.1, 0.7] },
    ],
  },
  {
    id: "stomach",
    name: "Dạ dày",
    latin: "Gaster",
    file: "/models/stomach.glb",
    description: "Túi cơ hình chữ J có tính đàn hồi cao, co bóp nhào trộn thức ăn với dịch vị axit HCl và men pepsin.",
    function: "Nghiền nát cơ học và tiêu hóa hóa học protein thành dưỡng trấp trước khi chuyển xuống ruột non.",
    systems: ["Hệ tiêu hóa"],
    specs: {
      role: "Nhào trộn & tiêu hóa protein",
      location: "Vùng thượng vị và hạ sườn trái",
      size: "Dung tích 1.0–1.5 lít",
      weight: "Khoảng 150–200 g (khi rỗng)",
      bloodSupply: "Động mạch thân tạng",
      tissue: "Cơ trơn (3 lớp: dọc, vòng, chéo) & niêm mạc",
    },
    note: "Axit clohydric (HCl) trong dịch vị dạ dày có độ pH từ 1.5–2.0, đủ mạnh để hòa tan nhiều kim loại.",
    hotspots: [
      { id: "cardia", label: "Tâm vị (Cardia)", description: "Vùng nối tiếp giữa thực quản và dạ dày, có cơ thắt tâm vị ngăn axit trào ngược.", position: [0.35, 1.1, 0.2] },
      { id: "fundus", label: "Đáy vị (Fundus)", description: "Phần vòm cao nhất nằm bên trái tâm vị, thường chứa bóng hơi dạ dày nhìn thấy trên X-quang.", position: [0.85, 0.95, 0.15] },
      { id: "body", label: "Thân dạ dày (Corpus)", description: "Phần lớn nhất ở giữa, nơi co bóp nhào trộn thức ăn mạnh mẽ và tiết lượng lớn dịch vị axit HCl.", position: [0.55, 0.05, 0.25] },
      { id: "greater-curvature", label: "Bờ cong lớn", description: "Bờ ngoài dài lồi sang bên trái, nơi mạc nối lớn bám vào và phủ xuống như tấm tạp dề bảo vệ.", position: [1.05, -0.4, 0.1] },
      { id: "pylorus", label: "Môn vị & Tá tràng", description: "Cơ thắt môn vị kiểm soát tốc độ đưa dưỡng trấp từng đợt nhỏ xuống tá tràng để hấp thụ.", position: [-0.65, -0.75, 0.3] },
    ],
  },
  {
    id: "kidney",
    name: "Thận",
    latin: "Ren",
    file: "/models/kidneys.glb",
    description: "Hai cơ quan hình hạt đậu nằm sau phúc mạc, mỗi quả chứa khoảng 1 triệu đơn vị lọc nephron tinh vi.",
    function: "Lọc liên tục dòng máu để đào thải chất cặn bã qua nước tiểu, điều hòa huyết áp và cân bằng điện giải.",
    systems: ["Hệ tiết niệu"],
    specs: {
      role: "Lọc máu & bài tiết nước tiểu",
      location: "Sau phúc mạc, hai bên cột sống thắt lưng",
      size: "Dài 10–12 cm, rộng 5–6 cm",
      weight: "Khoảng 130–150 g mỗi quả",
      bloodSupply: "Động mạch thận từ động mạch chủ bụng",
      tissue: "Vỏ thận, tủy thận & các nephron",
    },
    note: "Mỗi ngày, hai quả thận lọc khoảng 180 lít huyết tương nhưng 99% lượng nước được tái hấp thu trở lại cơ thể.",
    hotspots: [
      { id: "right-kidney", label: "Thận phải", description: "Nằm thấp hơn thận trái khoảng 1-2 cm do bị gan đè ép ở phía trên.", position: [-0.95, 0.05, 0.2] },
      { id: "left-kidney", label: "Thận trái", description: "Nằm sát lách và đuôi tụy, vị trí hơi cao hơn thận phải.", position: [0.95, 0.15, 0.2] },
      { id: "adrenal-gland", label: "Tuyến thượng thận", description: "Tuyến nội tiết hình tam giác nằm úp trên cực trên mỗi quả thận, tiết cortisol và adrenaline sinh tồn.", position: [0.85, 1.05, 0.1] },
      { id: "renal-vessels", label: "Động - Tĩnh mạch thận", description: "Nhánh mạch máu lớn nối trực tiếp động mạch chủ bụng và tĩnh mạch chủ dưới, đưa 20% cung lượng tim vào thận.", position: [0.0, 0.2, 0.35] },
      { id: "ureter", label: "Niệu quản (Ureter)", description: "Ống dẫn cơ trơn dẫn nước tiểu liên tục từ bể thận xuống bàng quang bằng sóng nhu động.", position: [0.45, -1.1, 0.15] },
    ],
  },
  {
    id: "pancreas",
    name: "Tụy",
    latin: "Pancreas",
    file: "/models/pancreas.glb",
    description: "Tuyến kép độc đáo của cơ thể người, vừa có chức năng ngoại tiết (tiết men tiêu hóa) vừa có chức năng nội tiết (tiết insulin và glucagon).",
    function: "Tiết dịch tụy giàu enzyme tiêu hóa tinh bột, mỡ, protein và điều hòa lượng đường trong máu liên tục suốt ngày đêm.",
    systems: ["Hệ tiêu hóa", "Hệ nội tiết"],
    specs: {
      role: "Tiết men tiêu hóa & Điều hòa đường huyết",
      location: "Sau dạ dày, vắt ngang thành bụng sau",
      size: "Dài khoảng 12–15 cm",
      weight: "Khoảng 70–100 g",
      bloodSupply: "Động mạch thân tạng và động mạch mạc treo tràng trên",
      tissue: "Nang tuyến ngoại tiết & Tiểu đảo Langerhans",
    },
    note: "Nếu không có insulin do các tế bào Beta của tụy sản xuất, tế bào cơ thể không thể hấp thu glucose và dẫn tới đái tháo đường.",
    hotspots: [
      { id: "head", label: "Đầu tụy & Tá tràng", description: "Phần dày nhất nằm gọn trong khung chữ C của tá tràng, nơi hợp lưu với ống mật chủ.", position: [1.1, -0.1, 0.2] },
      { id: "body", label: "Thân tụy", description: "Đoạn nằm vắt ngang phía trước cột sống và các mạch máu lớn của bụng.", position: [0.0, 0.15, 0.2] },
      { id: "tail", label: "Đuôi tụy", description: "Đoạn thuôn nhọn kéo dài sang bên trái và tiếp xúc trực tiếp với rốn lách.", position: [-1.2, 0.3, 0.1] },
      { id: "pancreatic-duct", label: "Ống tụy chính (Wirsung)", description: "Ống dẫn thu thập dịch men tiêu hóa chạy dọc suốt chiều dài tụy rồi đổ vào tá tràng.", position: [-0.2, 0.0, 0.35] },
    ],
  },
  {
    id: "intestine",
    name: "Ruột & Hệ tiêu hóa",
    latin: "Intestinum",
    file: "/models/intestine.glb",
    description: "Toàn bộ hệ thống ống tiêu hóa dài khoảng 7-8m, gồm ruột non (tá tràng, hỗng tràng, hồi tràng) và ruột già (đại tràng, trực tràng).",
    function: "Hoàn tất quá trình tiêu hóa thức ăn, hấp thu tối đa dưỡng chất và nước, đồng thời bài tiết các chất cặn bã.",
    systems: ["Hệ tiêu hóa"],
    specs: {
      role: "Hấp thu dưỡng chất & Tái hấp thu nước",
      location: "Chiếm hầu hết khoang bụng và chậu hông",
      size: "Ruột non ~6m, Ruột già ~1.5m",
      weight: "Khoảng 2.0–2.5 kg",
      bloodSupply: "Động mạch mạc treo tràng trên và dưới",
      tissue: "Lớp cơ trơn nhu động & Niêm mạc giàu nhung mao",
    },
    note: "Diện tích bề mặt hấp thu của ruột non được mở rộng gấp hàng trăm lần nhờ các vi nhung mao, đạt diện tích tương đương 250 m².",
    hotspots: [
      { id: "small-intestine", label: "Ruột non (Hỗng - Hồi tràng)", description: "Các quai ruột gấp nếp cuộn ở trung tâm bụng, chịu trách nhiệm hấp thu 90% dưỡng chất vào máu.", position: [0.05, -0.35, 0.45] },
      { id: "colon", label: "Đại tràng (Ruột già)", description: "Khung ruột bao bọc xung quanh ruột non, chuyên tái hấp thu nước và điện giải.", position: [-0.85, 0.3, 0.3] },
      { id: "appendix", label: "Manh tràng & Ruột thừa", description: "Góc dưới bên phải bụng nơi tiếp giáp giữa ruột non và ruột già, chứa hệ vi sinh vật dự trữ.", position: [-0.95, -0.85, 0.25] },
      { id: "rectum", label: "Trực tràng & Hậu môn", description: "Đoạn ống thẳng cuối cùng lưu trữ phân trước khi bài xuất qua phản xạ tống phân.", position: [0.0, -1.25, 0.15] },
    ],
  },
  {
    id: "eyeball",
    name: "Nhãn cầu (Mắt)",
    latin: "Oculus",
    file: "/models/eyeball.glb",
    description: "Cơ quan thụ cảm thị giác hình cầu tinh xảo, tiếp nhận photon ánh sáng và truyền tín hiệu thần kinh về vỏ não thị giác.",
    function: "Hội tụ ánh sáng qua giác mạc và thể thủy tinh lên võng mạc, tạo hình ảnh đảo ngược với độ sắc nét và màu sắc sống động.",
    systems: ["Hệ giác quan", "Hệ thần kinh"],
    specs: {
      role: "Thu nhận và xử lý tín hiệu thị giác",
      location: "Nằm trong hốc mắt xương sọ",
      size: "Đường kính khoảng 24 mm",
      weight: "Khoảng 7.5–8.0 g",
      bloodSupply: "Động mạch mắt (nhánh động mạch cảnh trong)",
      tissue: "Củng mạc, màng bồ đào và võng mạc thần kinh",
    },
    note: "Mắt người có thể phân biệt khoảng 10 triệu màu sắc khác nhau và có tốc độ điều tiết lấy nét nhanh hơn bất kỳ ống kính máy ảnh nào.",
    hotspots: [
      { id: "pupil", label: "Đồng tử (Pupil - Con ngươi)", description: "Lỗ tròn rỗng màu đen ở chính tâm mắt. Đóng vai trò như khẩu độ máy ảnh: tự động co nhỏ (~2mm) khi gặp ánh sáng mạnh và giãn to (lên tới ~8mm) trong bóng tối để điều tiết lượng photon đi vào nhãn cầu.", position: [1.32, 0.0, 0.1] },
      { id: "iris", label: "Mống mắt (Iris - Tròng mắt)", description: "Vành đĩa cơ tròn chứa sắc tố melanin (vân màu xanh xám vàng) bao quanh đồng tử. Gồm cơ thắt và cơ giãn giúp co mở đồng tử liên tục.", position: [1.22, 0.35, 0.15] },
      { id: "cornea", label: "Giác mạc (Cornea)", description: "Lớp màng hình chỏm cầu trong suốt nằm ở ngoài cùng phía trước nhãn cầu, đóng góp tới 70% tổng công suất quang học của mắt để khúc xạ ánh sáng.", position: [1.38, 0.0, 0.1] },
      { id: "sclera", label: "Củng mạc (Sclera - Lòng trắng)", description: "Lớp vỏ mô xơ màu trắng ngà dai chắc bao bọc 5/6 diện tích nhãn cầu, giúp duy trì hình dạng cầu và bảo vệ cấu trúc bên trong.", position: [0.2, 0.85, 0.35] },
      { id: "muscles", label: "Cơ vận nhãn (Cơ ngoài mắt)", description: "Hệ thống 6 bó cơ vân bám vào thành củng mạc, phối hợp nhịp nhàng giúp mắt liếc nhìn linh hoạt lên, xuống, trái, phải.", position: [-0.6, 0.35, 0.5] },
      { id: "optic-nerve", label: "Dây thần kinh thị giác (Dây TK II)", description: "Bó gồm hơn 1 triệu sợi trục thần kinh xuất phát từ các tế bào hạch võng mạc, dẫn truyền tín hiệu hình ảnh về vỏ não thị giác.", position: [-1.3, -0.05, 0.0] },
    ],
  },
];

interface BioOrganViewerProps {
  onOrganSelect?: (organ: Organ) => void;
  selectedId?: string;
  onBackToBody?: () => void;
  className?: string;
}

export default function BioOrganViewer({
  onOrganSelect,
  selectedId: controlledSelectedId,
  onBackToBody,
  className = "",
}: BioOrganViewerProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>("heart");
  const selectedOrganId = controlledSelectedId || internalSelectedId;
  const [activeHotspotInfo, setActiveHotspotInfo] = useState<HotspotData | null>(null);

  const selectedOrgan = ORGANS.find((o) => o.id === selectedOrganId) || ORGANS[0];

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    setActiveHotspotInfo(null);
    const org = ORGANS.find((o) => o.id === id);
    if (org && onOrganSelect) onOrganSelect(org);
  };

  return (
    <div className={`w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-950 ${className}`}>
      {/* Left / Center: 3D Viewport Area */}
      <div className="flex-1 relative h-full flex flex-col overflow-hidden">
        {/* Top Organ Navigation Bar (Ảnh 5) */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 z-10 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {onBackToBody && (
              <button
                onClick={onBackToBody}
                className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Quay lại cơ thể</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                CÁC CƠ QUAN 3D
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {selectedOrgan.name}
              </span>
            </div>
          </div>

          {/* Quick Organ Selector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {ORGANS.map((organ) => {
              const isSel = organ.id === selectedOrganId;
              return (
                <button
                  key={organ.id}
                  onClick={() => handleSelect(organ.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    isSel
                      ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {organ.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Model View */}
        <div className="w-full flex-1 relative min-h-0 bg-[#070b13]">
          <ModelViewer
            modelUrl={selectedOrgan.file}
            hotspots={selectedOrgan.hotspots}
            onHotspotClick={(hotspot) => setActiveHotspotInfo(hotspot)}
          />

          {/* Floating Hotspot Callout on 3D Viewport if active (Ảnh 5) */}
          {activeHotspotInfo && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-sky-500/50 shadow-2xl flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {activeHotspotInfo.label}
                  </span>
                  <span className="text-[11px] text-slate-300 block max-w-sm truncate">
                    {activeHotspotInfo.description}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Hint Overlay */}
          <div className="absolute bottom-3 left-4 pointer-events-none bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Kéo để xoay 360° · Cuộn chuột để phóng to cấu trúc · Nhấp vào các điểm tròn</span>
          </div>
        </div>
      </div>

      {/* Right: Detailed Organ Inspector Sidebar (Ảnh 5) */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 h-auto lg:h-full z-20 overflow-hidden">
        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Header Title with Latin name (Ảnh 5) */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h4 className="text-lg font-bold text-white leading-tight">
                {selectedOrgan.name}
              </h4>
            </div>
            {selectedOrgan.latin && (
              <p className="text-xs italic text-slate-400 font-serif">
                {selectedOrgan.latin}
              </p>
            )}
            <p className="text-slate-300 text-xs mt-2 leading-relaxed">
              {selectedOrgan.description}
            </p>
          </div>

          {/* Scientific Specification Table (Ảnh 5) */}
          {selectedOrgan.specs && (
            <div className="space-y-2 border-b border-slate-800 pb-3">
              <div className="flex items-start justify-between py-1 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 flex-shrink-0">
                  CHỨC NĂNG
                </span>
                <span className="text-slate-200 text-right font-medium">
                  {selectedOrgan.specs.role}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 flex-shrink-0">
                  VỊ TRÍ
                </span>
                <span className="text-slate-200 text-right font-medium">
                  {selectedOrgan.specs.location}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 flex-shrink-0">
                  KÍCH THƯỚC
                </span>
                <span className="text-slate-200 text-right font-medium">
                  {selectedOrgan.specs.size}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 flex-shrink-0">
                  KHỐI LƯỢNG
                </span>
                <span className="text-slate-200 text-right font-medium">
                  {selectedOrgan.specs.weight}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 flex-shrink-0">
                  NGUỒN CẤP MÁU
                </span>
                <span className="text-slate-200 text-right font-medium">
                  {selectedOrgan.specs.bloodSupply}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 flex-shrink-0">
                  MÔ
                </span>
                <span className="text-slate-200 text-right font-medium">
                  {selectedOrgan.specs.tissue}
                </span>
              </div>
            </div>
          )}

          {/* Dark Indigo / Purple Note Box (Ảnh 5) */}
          {selectedOrgan.note && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none">💡</span>
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-indigo-300 font-semibold block mb-0.5">Ghi chú</strong>
                  <p className="text-indigo-200">{selectedOrgan.note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Structures List (Ảnh 5: CÁC CẤU TRÚC) */}
          {selectedOrgan.hotspots && selectedOrgan.hotspots.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                CÁC CẤU TRÚC ({selectedOrgan.hotspots.length})
              </span>
              <div className="space-y-1.5">
                {selectedOrgan.hotspots.map((h) => {
                  const isSel = activeHotspotInfo?.id === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => setActiveHotspotInfo(h)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSel
                          ? "bg-rose-950/60 border-rose-500 text-white shadow-md"
                          : "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSel ? "bg-rose-400" : "bg-slate-500"}`} />
                        <span className="text-xs font-semibold">{h.label}</span>
                      </div>
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Guide */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-900/80 text-[10px] text-slate-400 flex items-center justify-between flex-shrink-0">
          <span>Xoay: Chuột trái · Phóng to: Cuộn</span>
          <span className="text-rose-400 font-medium">Bản đồ cơ thể người</span>
        </div>
      </div>
    </div>
  );
}
