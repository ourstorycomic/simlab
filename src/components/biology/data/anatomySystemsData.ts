export interface AnatomySystem {
  id: string;
  name: string;
  nameEn: string;
  category: 'motor' | 'circulatory' | 'visceral' | 'regulatory';
  color: string;
  icon: string;
  description: string;
  details: string;
}

export interface AnatomyPreset {
  id: string;
  name: string;
  icon: string;
  systems: string[];
}

export const ANATOMY_CATEGORIES = [
  { id: 'all', label: 'Tất cả hệ' },
  { id: 'motor', label: 'Vận động & Nâng đỡ' },
  { id: 'circulatory', label: 'Tuần hoàn & Điều khiển' },
  { id: 'visceral', label: 'Nội tạng & Chuyển hóa' },
  { id: 'regulatory', label: 'Điều hòa & Bảo vệ' },
];

export const ANATOMY_SYSTEMS: AnatomySystem[] = [
  {
    id: 'skeletal',
    name: 'Bộ xương',
    nameEn: 'Skeletal System',
    category: 'motor',
    color: '#e2d9ba',
    icon: '🦴',
    description: 'Khung nâng đỡ toàn bộ cơ thể gồm 206 xương ở người trưởng thành, bảo vệ các tạng nhạy cảm và là kho dự trữ khoáng chất canxi, phospho.',
    details: 'Xương sọ bảo vệ não bộ, lồng ngực bảo vệ tim - phổi, và tủy đỏ của xương xốp là nơi sinh ra hồng cầu, bạch cầu và tiểu cầu.'
  },
  {
    id: 'muscular',
    name: 'Hệ cơ',
    nameEn: 'Muscular System',
    category: 'motor',
    color: '#a85b50',
    icon: '💪',
    description: 'Hơn 600 cơ xương co rút tạo lực chuyển động, giữ thăng bằng tư thế, hỗ trợ lưu thông máu tĩnh mạch và sinh nhiệt giữ ấm thân nhiệt.',
    details: 'Cơ xương hoạt động theo ý muốn nhờ tín hiệu từ nơ-ron vận động. Các cơ trơn trong thành mạch và cơ tim co bóp tự động.'
  },
  {
    id: 'connective',
    name: 'Mô liên kết & Sụn',
    nameEn: 'Connective Tissue',
    category: 'motor',
    color: '#aec3bb',
    icon: '🔗',
    description: 'Sụn khớp, dây chằng, bao khớp và mạc cơ liên kết các khớp xương, hấp thụ xung lực cơ học và phân bổ áp lực vận động.',
    details: 'Sụn trong suốt bọc các đầu xương dài giúp các khớp cử động trơn tru không gây đau rát ma sát.'
  },
  {
    id: 'cardiac',
    name: 'Tim',
    nameEn: 'Heart & Coronary',
    category: 'circulatory',
    color: '#b96760',
    icon: '❤️',
    description: 'Tim là một máy bơm cơ gồm bốn buồng. Các van tim dẫn máu đi đúng chiều qua vòng tuần hoàn phổi và vòng tuần hoàn hệ thống.',
    details: 'Cơ tim có tính hưng phấn, dẫn truyền và co bóp nhịp nhàng tự động nhờ hệ thống dẫn truyền nút xoang nhĩ.'
  },
  {
    id: 'arterial',
    name: 'Hệ động mạch',
    nameEn: 'Arterial System',
    category: 'circulatory',
    color: '#c05245',
    icon: '🔴',
    description: 'Mạng lưới mạch máu thành dày giàu cơ trơn đàn hồi, dẫn truyền máu giàu oxy và dinh dưỡng từ thất trái đến từng mô tế bào.',
    details: 'Quai động mạch chủ phân nhánh thành các động mạch cảnh nuôi não, động mạch dưới đòn và động mạch chủ bụng.'
  },
  {
    id: 'venous',
    name: 'Hệ tĩnh mạch',
    nameEn: 'Venous System',
    category: 'circulatory',
    color: '#527c9f',
    icon: '🔵',
    description: 'Hệ thống mạch máu có van một chiều dẫn máu chứa chất thải CO₂ và bã trao đổi chất từ các mô trở về tâm nhĩ phải.',
    details: 'Tĩnh mạch chủ trên gom máu từ đầu cổ chi trên, tĩnh mạch chủ dưới gom máu từ khoang bụng và chi dưới.'
  },
  {
    id: 'nervous',
    name: 'Hệ thần kinh',
    nameEn: 'Nervous System',
    category: 'circulatory',
    color: '#d8b565',
    icon: '🧠',
    description: 'Não bộ, tủy sống và mạng lưới dây thần kinh ngoại biên xử lý hàng triệu tín hiệu điện mỗi giây điều khiển mọi hành vi và phản xạ.',
    details: 'Phân chia thành thần kinh trung ương (não, tủy sống) và thần kinh ngoại biên (các dây thần kinh sọ và dây thần kinh gai sống).'
  },
  {
    id: 'respiratory',
    name: 'Hệ hô hấp',
    nameEn: 'Respiratory System',
    category: 'visceral',
    color: '#b98991',
    icon: '🫁',
    description: 'Đường dẫn khí (mũi, hầu, thanh quản, khí quản, phế quản) và phổi. Hàng trăm triệu phế nang thực hiện trao đổi O₂ và CO₂.',
    details: 'Phổi phải có 3 thùy, phổi trái 2 thùy. Cơ hoành là cơ chủ lực hạ thấp tạo áp suất âm hút khí vào phổi.'
  },
  {
    id: 'digestive',
    name: 'Hệ tiêu hóa',
    nameEn: 'Digestive System',
    category: 'visceral',
    color: '#b8916b',
    icon: '🍽️',
    description: 'Ống tiêu hóa từ miệng, thực quản, dạ dày, ruột non đến đại tràng cùng gan, mật, tụy phân giải thức ăn thành dưỡng chất.',
    details: 'Ruột non có diện tích hấp thụ tới 300 m² nhờ hệ vi nhung mao; đại tràng tái hấp thu nước và đóng khuôn phân.'
  },
  {
    id: 'urinary',
    name: 'Hệ tiết niệu',
    nameEn: 'Urinary System',
    category: 'visceral',
    color: '#b47961',
    icon: '💧',
    description: 'Thận lọc khoảng 180 lít huyết tương mỗi ngày, đào thải chất độc qua nước tiểu dẫn xuống bàng quang và thải ra ngoài.',
    details: 'Điều hòa cân bằng nước, điện giải (Na⁺, K⁺), thăng bằng kiềm toan máu và điều hòa huyết áp nhờ hệ Renin-Angiotensin.'
  },
  {
    id: 'sensory',
    name: 'Cơ quan cảm giác',
    nameEn: 'Sensory Organs',
    category: 'regulatory',
    color: '#b0c8ce',
    icon: '👁️',
    description: 'Mắt, tai, khứu giác, vị giác và thụ thể xúc giác da tiếp nhận kích thích ngoại cảnh, biến thành xung điện truyền về não.',
    details: 'Giúp cơ thể định vị không gian, nhận thức màu sắc, âm thanh, nguy cơ chấn thương và tương tác với môi trường.'
  },
  {
    id: 'lymphatic',
    name: 'Hệ bạch huyết & Miễn dịch',
    nameEn: 'Lymphatic & Immune',
    category: 'regulatory',
    color: '#879f7c',
    icon: '🛡️',
    description: 'Hệ thống mạch bạch huyết, hạch lympho, lách và tuyến ức dẫn lưu dịch kẽ và sản sinh tế bào miễn dịch bảo vệ cơ thể.',
    details: 'Tế bào lympho T và B nhận diện, ghi nhớ và vô hiệu hóa kháng nguyên lạ, virus, vi khuẩn xâm nhập.'
  },
  {
    id: 'endocrine',
    name: 'Hệ nội tiết',
    nameEn: 'Endocrine System',
    category: 'regulatory',
    color: '#c5a09a',
    icon: '⚡',
    description: 'Tuyến yên, tuyến giáp, tuyến thượng thận và tụy nội tiết tiết hormone vào máu điều hòa tăng trưởng, trao đổi chất và sinh sản.',
    details: 'Phối hợp với hệ thần kinh tạo thành trục thần kinh - thể dịch giữ vững cân bằng nội môi.'
  },
  {
    id: 'reproductive',
    name: 'Hệ sinh sản',
    nameEn: 'Reproductive System',
    category: 'regulatory',
    color: '#bda098',
    icon: '🧬',
    description: 'Cơ quan sinh dục chuyên trách duy trì nòi giống, sản xuất giao tử (trứng, tinh trùng) và tiết hormone định hình giới tính.',
    details: 'Tinh hoàn tiết testosterone ở nam; buồng trứng tiết estrogen và progesterone ở nữ.'
  }
];

export const ANATOMY_PRESETS: AnatomyPreset[] = [
  {
    id: 'overview',
    name: 'Toàn thân (Xương & Tạng)',
    icon: '🧍',
    systems: ['skeletal', 'cardiac', 'respiratory', 'digestive', 'urinary']
  },
  {
    id: 'skeleton',
    name: 'Khung xương & Khớp',
    icon: '🦴',
    systems: ['skeletal', 'connective']
  },
  {
    id: 'muscular',
    name: 'Hệ cơ bắp & Vận động',
    icon: '💪',
    systems: ['skeletal', 'muscular']
  },
  {
    id: 'circulatory',
    name: 'Mạch máu & Tim',
    icon: '🩸',
    systems: ['cardiac', 'arterial', 'venous']
  },
  {
    id: 'visceral',
    name: 'Nội tạng ngực - bụng',
    icon: '🫀',
    systems: ['cardiac', 'respiratory', 'digestive', 'urinary']
  },
  {
    id: 'all_systems',
    name: 'Tất cả 14 hệ',
    icon: '🌐',
    systems: ['skeletal', 'muscular', 'connective', 'cardiac', 'arterial', 'venous', 'nervous', 'respiratory', 'digestive', 'urinary', 'sensory', 'lymphatic', 'endocrine', 'reproductive']
  }
];
