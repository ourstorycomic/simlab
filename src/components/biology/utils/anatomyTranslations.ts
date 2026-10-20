/**
 * Từ điển & Module Dịch thuật Danh pháp Giải phẫu Y khoa Chuẩn Quốc tế (FMA - Terminologia Anatomica)
 * Giúp hiển thị chính xác tên tiếng Việt chuẩn Y khoa, tên tiếng Anh, danh pháp Latin và mô tả chức năng sinh học.
 */

export interface AnatomyDetailInfo {
  viName: string;
  enName: string;
  latinName?: string;
  conceptId?: string;
  description: string;
}

// Bảng tra cứu chuyên biệt cho các cấu trúc đặc thù và các cơ quan hay gặp
export const SPECIAL_ANATOMY_DICT: Record<string, Partial<AnatomyDetailInfo>> = {
  FMA14643: {
    viName: "Mạc treo ruột non",
    enName: "Mesentery of small intestine",
    latinName: "Mesenterium intestini tenuis",
    description: "Mạc treo ruột non là một cơ quan có cấu trúc liên tục dạng nếp gấp phúc mạc lớn, neo giữ và nâng đỡ toàn bộ các quai ruột non vào thành sau ổ bụng. Mạc treo chứa hệ thống động mạch - tĩnh mạch mạc treo tràng trên, mạng lưới hạch bạch huyết và dây thần kinh, đóng vai trò sống còn trong việc nuôi dưỡng và vận chuyển dưỡng chất từ ruột vào tuần hoàn chung.",
  },
  FJ3396: {
    viName: "Mạc treo ruột non",
    enName: "Mesentery of small intestine",
    latinName: "Mesenterium intestini tenuis",
    description: "Mạc treo ruột non là một cơ quan có cấu trúc liên tục dạng nếp gấp phúc mạc lớn, neo giữ và nâng đỡ toàn bộ các quai ruột non vào thành sau ổ bụng. Mạc treo chứa hệ thống động mạch - tĩnh mạch mạc treo tràng trên, mạng lưới hạch bạch huyết và dây thần kinh.",
  },
  FMA14656: {
    viName: "Mạc nối lớn",
    enName: "Greater omentum",
    latinName: "Omentum majus",
    description: "Nếp phúc mạc lớn phủ như một chiếc tạp dề từ bờ cong lớn dạ dày rủ xuống phía trước các quai ruột non, chứa nhiều mô mỡ và đại thực bào có tác dụng bảo vệ và bao vây các ổ nhiễm trùng trong ổ bụng.",
  },
  FMA14657: {
    viName: "Mạc nối nhỏ",
    enName: "Lesser omentum",
    latinName: "Omentum minus",
    description: "Nếp phúc mạc nối liền bờ cong nhỏ dạ dày và tá tràng với rốn gan, chứa cuống gan (ống mật chủ, động mạch gan riêng và tĩnh mạch cửa).",
  },
  FMA7148: {
    viName: "Dạ dày",
    enName: "Stomach",
    latinName: "Gaster / Ventriculus",
    description: "Túi phình cơ rỗng của ống tiêu hóa, nơi chứa đựng, nhào trộn thức ăn với dịch vị chứa acid HCl và enzyme pepsin để bắt đầu tiêu hóa protein.",
  },
  FMA7197: {
    viName: "Gan",
    enName: "Liver",
    latinName: "Hepar",
    description: "Tuyến tiêu hóa lớn nhất cơ thể, đảm nhiệm hơn 500 chức năng sống bao gồm chuyển hóa đường, dự trữ năng lượng, giải độc, tổng hợp protein huyết tương và tiết dịch mật tiêu hóa lipid.",
  },
  FMA7202: {
    viName: "Túi mật",
    enName: "Gallbladder",
    latinName: "Vesica biliaris",
    description: "Túi nhỏ hình quả lê nằm dưới mặt tạng của gan, có nhiệm vụ cô đặc và dự trữ dịch mật do gan tiết ra trước khi co bóp đổ vào tá tràng tiêu hóa chất béo.",
  },
  FMA7198: {
    viName: "Tụy tạng",
    enName: "Pancreas",
    latinName: "Pancreas",
    description: "Tuyến pha vừa ngoại tiết vừa nội tiết. Tụy ngoại tiết tiết enzyme tiêu hóa tinh bột, lipid và protein; tụy nội tiết (đảo tụy Langerhans) tiết Insulin và Glucagon điều hòa đường huyết.",
  },
  FMA7206: {
    viName: "Ruột non",
    enName: "Small intestine",
    latinName: "Intestinum tenue",
    description: "Đoạn dài nhất của ống tiêu hóa (khoảng 6 mét), gồm tá tràng, hỗng tràng và hồi tràng, nơi diễn ra phần lớn quá trình tiêu hóa hóa học và hấp thu chất dinh dưỡng vào máu.",
  },
  FMA7207: {
    viName: "Đại tràng (Ruột già)",
    enName: "Large intestine (Colon)",
    latinName: "Intestinum crassum",
    description: "Đoạn cuối của ống tiêu hóa có chức năng hấp thu nước, điện giải, nhờ hệ vi sinh đường ruột lên men chất xơ và cô đặc bã thức ăn tạo thành phân.",
  },
  FMA11359: {
    viName: "Tâm nhĩ phải",
    enName: "Right atrium",
    latinName: "Atrium dextrum",
    description: "Khoang tim tiếp nhận máu nghèo oxy từ toàn bộ cơ thể qua tĩnh mạch chủ trên và tĩnh mạch chủ dưới, sau đó tống máu qua van 3 lá xuống tâm thất phải.",
  },
  FMA7088: {
    viName: "Tâm thất trái",
    enName: "Left ventricle",
    latinName: "Ventriculus sinister",
    description: "Khoang cơ tim dày nhất, chịu trách nhiệm co bóp tạo áp lực tống máu giàu oxy vào động mạch chủ đi nuôi toàn bộ các cơ quan trong cơ thể.",
  },
  FMA7195: {
    viName: "Động mạch chủ ngực & bụng",
    enName: "Aorta",
    latinName: "Aorta",
    description: "Mạch máu động mạch lớn nhất của cơ thể người, dẫn máu từ tâm thất trái đi nuôi các cơ quan.",
  },
  FMA7203: {
    viName: "Lách",
    enName: "Spleen",
    latinName: "Splen / Lien",
    description: "Cơ quan lympho lớn nhất cơ thể, có chức năng lọc máu, dự trữ máu và tiêu hủy các hồng cầu già cỗi.",
  },
  FMA7204: {
    viName: "Thận",
    enName: "Kidney",
    latinName: "Ren",
    description: "Cơ quan bài tiết chính hình hạt đậu lọc máu, loại bỏ chất cặn bã urê, cân bằng nước, điện giải và điều hòa huyết áp.",
  },
  FMA7205: {
    viName: "Bàng quang",
    enName: "Urinary bladder",
    latinName: "Vesica urinaria",
    description: "Túi chứa nước tiểu rỗng có vách cơ đàn hồi nằm ở vùng chậu, dẫn lưu nước tiểu từ niệu quản và thải ra ngoài qua niệu đạo.",
  },
};

// Từ điển từ vựng giải phẫu chuyên ngành
const ANATOMY_WORD_MAP: [RegExp, string][] = [
  // Nhánh & Cây đường mật gan
  [/\bcaudate lobe\b/gi, "thùy đuôi"],
  [/\bquadrate lobe\b/gi, "thùy vuông"],
  [/\bbiliary tree\b/gi, "đường mật"],
  [/\bbiliary duct\b/gi, "ống mật"],
  [/\bbile duct\b/gi, "ống mật chủ"],
  [/\bhepatic\b/gi, "gan"],
  [/\btributary\b/gi, "Nhánh"],
  [/\bbranch\b/gi, "Nhánh"],
  [/\btrunk\b/gi, "Thân"],
  [/\bplexus\b/gi, "Đám rối"],
  [/\bcavity\b/gi, "Khoang"],
  [/\bvalvule\b/gi, "Van nhỏ"],
  [/\bvalve\b/gi, "Van"],
  [/\barch\b/gi, "Quai"],
  [/\bmesentery\b/gi, "Mạc treo"],
  [/\bomentum\b/gi, "Mạc nối"],
  [/\bperitoneum\b/gi, "Phúc mạc"],
  [/\bgingiva\b/gi, "Lợi (Nướu)"],
  [/\bupper jaw\b/gi, "hàm trên"],
  [/\blower jaw\b/gi, "hàm dưới"],
  [/\bmaxilla\b/gi, "Xương hàm trên"],
  [/\bmandible\b/gi, "Xương hàm dưới"],
  [/\bdiaphragm\b/gi, "Cơ hoành"],
  [/\btrachea\b/gi, "Khí quản"],
  [/\besophagus\b/gi, "Thực quản"],
  [/\blarynx\b/gi, "Thanh quản"],
  [/\bpharynx\b/gi, "Hầu"],
  [/\blung\b/gi, "Phổi"],
  [/\bbronchus\b/gi, "Phế quản"],
  [/\bbronchiole\b/gi, "Phế quản nhỏ"],
  [/\bheart\b/gi, "Tim"],
  [/\bstomach\b/gi, "Dạ dày"],
  [/\bliver\b/gi, "Gan"],
  [/\bpancreas\b/gi, "Tụy"],
  [/\bspleen\b/gi, "Lách"],
  [/\bkidney\b/gi, "Thận"],
  [/\bureter\b/gi, "Niệu quản"],
  [/\bbladder\b/gi, "Bàng quang"],
  [/\burethra\b/gi, "Niệu đạo"],
  [/\bduodenum\b/gi, "Tá tràng"],
  [/\bjejunum\b/gi, "Hỗng tràng"],
  [/\bileum\b/gi, "Hồi tràng"],
  [/\bcolon\b/gi, "Đại tràng"],
  [/\bcecum\b/gi, "Manh tràng"],
  [/\bappendix\b/gi, "Ruột thừa"],
  [/\brectum\b/gi, "Trực tràng"],
  [/\banus\b/gi, "Hậu môn"],
  [/\bgallbladder\b/gi, "Túi mật"],
  [/\bbrain\b/gi, "Não bộ"],
  [/\bcerebrum\b/gi, "Đại não"],
  [/\bcerebellum\b/gi, "Tiểu não"],
  [/\bbrainstem\b/gi, "Thân não"],
  [/\bspinal cord\b/gi, "Tủy sống"],
  [/\buterus\b/gi, "Tử cung"],
  [/\bovary\b/gi, "Buồng trứng"],
  [/\btestis\b/gi, "Tinh hoàn"],
  [/\bprostate\b/gi, "Tuyến tiền liệt"],
  [/\bthyroid\b/gi, "Tuyến giáp"],
  [/\bthymus\b/gi, "Tuyến ức"],
  [/\badrenal\b/gi, "Tuyến thượng thận"],

  // Xương khớp
  [/\bfemur\b/gi, "Xương đùi"],
  [/\btibia\b/gi, "Xương chày"],
  [/\bfibula\b/gi, "Xương mác"],
  [/\bhumerus\b/gi, "Xương cánh tay"],
  [/\bradius\b/gi, "Xương quay"],
  [/\bulna\b/gi, "Xương trụ"],
  [/\bclavicle\b/gi, "Xương đòn"],
  [/\bscapula\b/gi, "Xương bả vai"],
  [/\bsternum\b/gi, "Xương ức"],
  [/\brib\b/gi, "Xương sườn"],
  [/\bvertebra\b/gi, "Đốt sống"],
  [/\bpelvis\b/gi, "Xương chậu"],
  [/\bsacrum\b/gi, "Xương cùng"],
  [/\bcoccyx\b/gi, "Xương cụt"],
  [/\bpatella\b/gi, "Xương bánh chè"],
  [/\bcarpal\b/gi, "Xương cổ tay"],
  [/\btarsal\b/gi, "Xương cổ chân"],
  [/\bmetacarpal\b/gi, "Xương đốt bàn tay"],
  [/\bmetatarsal\b/gi, "Xương đốt bàn chân"],
  [/\bphalanx\b/gi, "Xương đốt ngón"],
  [/\bcranium\b/gi, "Hộp sọ"],
  [/\bskull\b/gi, "Xương sọ"],

  // Mạch máu & thần kinh
  [/\bartery\b/gi, "Động mạch"],
  [/\bvein\b/gi, "Tĩnh mạch"],
  [/\bnerve\b/gi, "Dây thần kinh"],
  [/\bcapillary\b/gi, "Mao mạch"],
  [/\baorta\b/gi, "Động mạch chủ"],
  [/\bvena cava\b/gi, "Tĩnh mạch chủ"],
  [/\blymph node\b/gi, "Hạch bạch huyết"],

  // Cơ bắp & sụn
  [/\bmuscle\b/gi, "Cơ"],
  [/\btendon\b/gi, "Gân"],
  [/\bligament\b/gi, "Dây chằng"],
  [/\bcartilage\b/gi, "Sụn"],
  [/\bfascia\b/gi, "Cân cơ"],

  // Vị trí & hướng
  [/\bleft\b/gi, "trái"],
  [/\bright\b/gi, "phải"],
  [/\bsuperior\b/gi, "trên"],
  [/\binferior\b/gi, "dưới"],
  [/\banterior\b/gi, "trước"],
  [/\bposterior\b/gi, "sau"],
  [/\bmedial\b/gi, "trong"],
  [/\blateral\b/gi, "ngoài"],
  [/\bascending\b/gi, "lên"],
  [/\bdescending\b/gi, "xuống"],
  [/\btransverse\b/gi, "ngang"],
  [/\bproximal\b/gi, "gần"],
  [/\bdistal\b/gi, "xa"],
  [/\bexternal\b/gi, "ngoài"],
  [/\binternal\b/gi, "trong"],
  [/\bdeep\b/gi, "sâu"],
  [/\bsuperficial\b/gi, "nông"],
  [/\bof\b/gi, "của"],
];

/**
 * Dịch thuật danh pháp giải phẫu tiếng Anh sang tiếng Việt chuẩn Y khoa
 */
export function translateAnatomyName(rawName: string, conceptId?: string): { viName: string; enName: string; description: string } {
  // 1. Kiểm tra từ điển chuyên biệt theo ConceptId hoặc RawName
  if (conceptId && SPECIAL_ANATOMY_DICT[conceptId]) {
    const item = SPECIAL_ANATOMY_DICT[conceptId];
    return {
      viName: item.viName || rawName,
      enName: item.enName || rawName,
      description: item.description || "Cấu trúc giải phẫu học chính thức của cơ thể người.",
    };
  }

  if (SPECIAL_ANATOMY_DICT[rawName]) {
    const item = SPECIAL_ANATOMY_DICT[rawName];
    return {
      viName: item.viName || rawName,
      enName: item.enName || rawName,
      description: item.description || "Cấu trúc giải phẫu học chính thức của cơ thể người.",
    };
  }

  // 2. Dịch tự động theo từ điển giải phẫu
  let translated = rawName;
  for (const [pattern, viWord] of ANATOMY_WORD_MAP) {
    translated = translated.replace(pattern, viWord);
  }

  // Xử lý các cụm từ "của trái X" -> "của X trái", "của phải Y" -> "của Y phải"
  translated = translated.replace(/của\s+(trái|phải)\s+([a-zA-ZÀ-ỹ\s]+)/gi, "của $2 $1");
  translated = translated.replace(/\s+/g, " ").trim();

  // Viết hoa chữ cái đầu tiên
  if (translated.length > 0) {
    translated = translated.charAt(0).toUpperCase() + translated.slice(1);
  }

  const defaultDesc = `Một cấu trúc giải phẫu học chính thức thuộc hệ cơ quan của cơ thể người, liên kết và phối hợp sinh lý chặt chẽ với các mô xung quanh.`;

  return {
    viName: translated || rawName,
    enName: rawName,
    description: defaultDesc,
  };
}
