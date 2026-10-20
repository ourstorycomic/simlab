export interface OrganelleItem {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  role: string;
  summary: string;
  fact: string;
  location: string;
  size: string;
  microscopy: string;
  image: string;
  hotspots?: Array<{
    position: [number, number, number];
    normal: [number, number, number];
  }>;
}

export interface CellTypeDefinition {
  id: string;
  name: string;
  nameEn: string;
  thumbnail: string;
  description: string;
  modelUrl: string;
  maskUrl?: string;
  maskKeys?: string[];
  rotationY?: number;
  initialLabelKey?: string;
  organelles: OrganelleItem[];
}

export const MASK_KEYS = [
  'vacuole',
  'nucleus',
  'mitochondrion',
  'golgi',
  'chloroplast',
  'cell-wall',
];

// 1. Tế bào thực vật (Plant Cell)
export const PLANT_CELL_ORGANELLES: OrganelleItem[] = [
  {
    id: 'vacuole',
    name: 'Không bào trung tâm',
    nameEn: 'Central Vacuole',
    color: '#06b6d4',
    role: 'Dự trữ chất dinh dưỡng & tạo áp suất trương nước',
    summary: 'Một khoang chứa đầy dịch bào lớn chiếm phần lớn thể tích tế bào, giúp dự trữ chất dinh dưỡng, ion và tạo áp suất trương giúp tế bào luôn căng và thân cây đứng thẳng.',
    fact: 'Ở tế bào thực vật trưởng thành, không bào trung tâm có thể chiếm tới 80% - 90% thể tích tế bào!',
    location: 'Nằm ở trung tâm tế bào, ép tế bào chất và các bào quan khác sát màng ngoài',
    size: 'Chiếm 30% - 90% thể tích tế bào',
    microscopy: 'Nhìn thấy rõ dưới kính hiển vi quang học như một vùng sáng trong suốt',
    image: '/images/components/vacuole.webp',
    hotspots: [
      { position: [-0.189, 0.115, -0.0902], normal: [0.1212, 0.9898, 0.0743] }
    ]
  },
  {
    id: 'chloroplast',
    name: 'Lục lạp',
    nameEn: 'Chloroplast',
    color: '#10b981',
    role: 'Quang hợp & chuyển hóa năng lượng mặt trời',
    summary: 'Bào quan đặc trưng của thực vật chứa chất diệp lục (chlorophyll). Lục lạp hấp thu năng lượng ánh sáng mặt trời để chuyển hóa CO₂ và nước thành glucose tích lũy sinh khối.',
    fact: 'Lục lạp có hệ thống DNA vòng và ribosome 70S riêng, bắt nguồn từ vi khuẩn lam nội cộng sinh cách đây hơn 1.5 tỷ năm.',
    location: 'Phân bố rải rác khắp tế bào chất quanh không bào',
    size: 'Dài khoảng 4 - 10 µm, đường kính 2 - 4 µm',
    microscopy: 'Dễ nhận dạng dưới kính hiển vi quang học nhờ màu xanh lục tự nhiên của chất diệp lục',
    image: '/images/components/chloroplast.webp',
    hotspots: [
      { position: [-0.3945, 0.062, -0.6366], normal: [0.1374, 0.9861, 0.0937] },
      { position: [0.4528, 0.0812, -0.3956], normal: [0.2509, 0.9604, -0.1213] },
      { position: [-0.5156, 0.0699, 0.5584], normal: [-0.0488, 0.992, 0.1167] }
    ]
  },
  {
    id: 'nucleus',
    name: 'Nhân tế bào',
    nameEn: 'Nucleus',
    color: '#a855f7',
    role: 'Lưu trữ thông tin di truyền & điều khiển hoạt động sống',
    summary: 'Trung tâm đầu não của tế bào, được bao bọc bởi màng nhân kép có các phức hợp lỗ nhân. Chứa vật chất di truyền (DNA dạng sợi chất nhiễm sắc) chỉ huy quá trình nhân đôi và biểu hiện gen.',
    fact: 'Nhân chứa hạch nhân (nhân con - nucleolus), nơi chịu trách nhiệm tổng hợp các phân tử RNA ribosome (rRNA).',
    location: 'Nằm lệch về một phía do bị không bào trung tâm chèn ép',
    size: 'Đường kính khoảng 5 - 10 µm',
    microscopy: 'Quan sát rõ bằng kính hiển vi quang học khi nhuộm bằng chất màu kiềm tính (Acetocarmine, DAPI)',
    image: '/images/components/nucleus.webp',
    hotspots: [
      { position: [0.2191, 0.0982, 0.2222], normal: [-0.7878, 0.6062, 0.1092] }
    ]
  },
  {
    id: 'mitochondrion',
    name: 'Ti thể',
    nameEn: 'Mitochondrion',
    color: '#f97316',
    role: 'Hô hấp tế bào & sản xuất năng lượng ATP',
    summary: 'Nhà máy năng lượng của tế bào. Màng trong gấp nếp tạo thành các mào (cristae) chứa enzyme tổng hợp năng lượng ATP từ phân tử đường thông qua chu trình Krebs và chuỗi chuyền electron.',
    fact: 'Ti thể cũng sở hữu DNA dạng vòng riêng và có thể tự phân chia độc lập với chu kỳ phân chia của nhân.',
    location: 'Phân bố rải rác trong bào tương tế bào chất',
    size: 'Dài 1 - 5 µm, hình bầu dục hoặc hình que',
    microscopy: 'Nhìn thấy dạng hạt nhỏ dưới kính hiển vi quang học hoặc cấu trúc màng trong dưới kính hiển vi điện tử',
    image: '/images/components/mitochondrion.webp',
    hotspots: [
      { position: [0.2416, 0.0628, -0.205], normal: [-0.0714, 0.9847, -0.1588] },
      { position: [0.1875, 0.0574, 0.6396], normal: [-0.1074, 0.9783, 0.177] }
    ]
  },
  {
    id: 'golgi',
    name: 'Bộ máy Golgi',
    nameEn: 'Golgi Apparatus',
    color: '#ec4899',
    role: 'Chỉnh sửa, phân loại và đóng gói đại phân tử',
    summary: 'Gồm các túi màng dẹt xếp chồng lên nhau độc lập. Tiếp nhận protein và lipid từ lưới nội chất, gắn thêm chuỗi đường (glycosyl hóa), sau đó phân phối đến màng tế bào hoặc tiêu bào.',
    fact: 'Được đặt theo tên nhà bác học Camillo Golgi người Ý, người phát hiện ra nó vào năm 1898 bằng phương pháp nhuộm bạc.',
    location: 'Nằm gần lưới nội chất và màng tế bào',
    size: 'Xấp xỉ 1 - 3 µm',
    microscopy: 'Quan sát cấu trúc chi tiết bằng kính hiển vi điện tử truyền qua',
    image: '/images/components/golgi.webp',
    hotspots: [
      { position: [-0.012, 0.0224, 0.5309], normal: [-0.7819, 0.0784, 0.6184] }
    ]
  },
  {
    id: 'cell-wall',
    name: 'Thành tế bào & Màng',
    nameEn: 'Cell Wall & Membrane',
    color: '#84cc16',
    role: 'Định hình, nâng đỡ cơ học & bảo vệ tế bào',
    summary: 'Lớp vỏ cứng cáp bao ngoài cùng của tế bào thực vật, cấu tạo chủ yếu từ các sợi cellulose đan xen trong ma trận hemicellulose và pectin. Giúp cây chống chịu áp suất thẩm thấu cao mà không vỡ.',
    fact: 'Các cầu sinh chất (plasmodesmata) xuyên qua thành tế bào cho phép các tế bào thực vật lân cận trao đổi vật chất và thông tin liên lạc trực tiếp.',
    location: 'Lớp ngoài cùng, bao bọc màng sinh chất',
    size: 'Độ dày từ 0.1 đến 10 µm tùy loại tế bào',
    microscopy: 'Dễ dàng quan sát dưới kính hiển vi quang học cơ bản',
    image: '/images/components/membrane-wall.webp',
    hotspots: [
      { position: [-0.1953, -0.2152, 0.8042], normal: [0.1562, 0.769, -0.6199] }
    ]
  },
  {
    id: 'endoplasmic-reticulum',
    name: 'Lưới nội chất (ER)',
    nameEn: 'Endoplasmic Reticulum',
    color: '#38bdf8',
    role: 'Tổng hợp protein, lipid & giải độc tế bào',
    summary: 'Hệ thống màng ống và túi dẹp thông với màng nhân. Lưới nội chất hạt đính các hạt ribosome chuyên tổng hợp protein xuất bào; lưới nội chất trơn tổng hợp lipid, chuyển hóa đường và khử độc.',
    fact: 'ER là hệ thống màng rộng lớn nhất trong tế bào, chiếm hơn 50% tổng diện tích màng nội bào.',
    location: 'Nối liền trực tiếp với màng ngoài của nhân tế bào',
    size: 'Trải rộng khắp toàn bộ tế bào chất',
    microscopy: 'Chỉ quan sát được chi tiết các hạt ribosome và xoang màng bằng kính hiển vi điện tử TEM',
    image: '/images/components/rough-er.webp',
    hotspots: [
      { position: [0.4545, 0.1069, 0.3449], normal: [0.5351, 0.8436, 0.0453] }
    ]
  }
];

// 2. Tế bào động vật (Animal Cell)
export const ANIMAL_CELL_ORGANELLES: OrganelleItem[] = [
  {
    id: 'animal-nucleus',
    name: 'Nhân tế bào',
    nameEn: 'Nucleus & Envelope',
    color: '#c084fc',
    role: 'Lưu trữ bộ gen & điều phối hoạt động chuyển hóa',
    summary: 'Màng nhân kép bao bọc vật chất di truyền DNA cuộn xoắn quanh histone. Điều khiển mọi quá trình phiên mã, nhân đôi và phát triển của tế bào động vật.',
    fact: 'Mỗi tế bào người chứa khoảng 2m chiều dài phân tử DNA được cuộn xoắn siêu chặt trong nhân có đường kính chỉ vài micromet.',
    location: 'Trung tâm tế bào động vật',
    size: 'Đường kính 5 - 8 µm',
    microscopy: 'Bắt màu tím đậm với thuốc nhuộm Giemsa hoặc xanh Methylen',
    image: '/images/components/nuclear-envelope.webp',
    hotspots: [
      { position: [0.2859, 0.3302, -0.1952], normal: [0.2885, -0.3804, 0.8787] }
    ]
  },
  {
    id: 'animal-nucleolus',
    name: 'Hạch nhân (Nhân con)',
    nameEn: 'Nucleolus',
    color: '#a855f7',
    role: 'Tổng hợp RNA ribosome (rRNA) & ráp tiểu đơn vị ribosome',
    summary: 'Vùng đậm đặc không có màng nằm ngay bên trong nhân, nơi tập trung các cụm gen rRNA và các protein chuyên trách lắp ráp ribosome.',
    fact: 'Hạch nhân sẽ biến mất trong kỳ đầu của nguyên phân và được tái tạo lại ở kỳ cuối.',
    location: 'Bên trong nhân tế bào',
    size: 'Đường kính 1 - 2 µm',
    microscopy: 'Vùng tối sẫm màu nhất khi soi dưới kính hiển vi quang học và điện tử',
    image: '/images/components/nucleolus.webp',
    hotspots: [
      { position: [0.3528, 0.2389, 0.0537], normal: [0.281, 0.6979, 0.6588] }
    ]
  },
  {
    id: 'animal-rough-er',
    name: 'Lưới nội chất hạt',
    nameEn: 'Rough Endoplasmic Reticulum',
    color: '#60a5fa',
    role: 'Tổng hợp và đóng gói các protein xuất bào',
    summary: 'Các túi màng dẹp có bề mặt đính dày đặc các hạt ribosome 80S. Tiếp nhận chuỗi polypeptide mới tổng hợp, cuộn gập cấu trúc 3D và đưa sang thể Golgi.',
    fact: 'Tế bào tuyến tụy tổng hợp enzyme tiêu hóa có lưới nội chất hạt cực kỳ phát triển.',
    location: 'Bao quanh màng nhân',
    size: 'Mạng lưới trải rộng trong bào tương',
    microscopy: 'Quan sát dạng mạng lưới hạt dưới kính hiển vi điện tử truyền qua (TEM)',
    image: '/images/components/rough-er.webp',
    hotspots: [
      { position: [0.6898, 0.0895, 0.1457], normal: [0.9494, 0.0194, 0.3134] }
    ]
  },
  {
    id: 'animal-golgi',
    name: 'Thể Golgi',
    nameEn: 'Golgi Apparatus',
    color: '#f0a9b8',
    role: 'Gắn đường, phân loại và xuất bào các đại phân tử',
    summary: 'Xếp chồng từ 4 - 8 túi màng cong. Gắn chuỗi oligosaccharide lên protein, hoàn thiện cấu trúc và đóng gói thành túi tiết xuất bào.',
    fact: 'Được đặt theo tên Camillo Golgi người Ý, phát minh năm 1898 bằng kỹ thuật nhuộm bạc.',
    location: 'Nằm giữa lưới nội chất và màng tế bào',
    size: '1 - 3 µm',
    microscopy: 'Dạng mạng lưới dẹp uốn cong dưới kính hiển vi điện tử',
    image: '/images/components/golgi.webp',
    hotspots: [
      { position: [-0.0251, 0.1503, 0.5397], normal: [-0.2586, 0.9488, 0.1816] }
    ]
  },
  {
    id: 'animal-mitochondrion',
    name: 'Ti thể động vật',
    nameEn: 'Mitochondrion',
    color: '#fb923c',
    role: 'Hô hấp hiếu khí & tổng hợp ATP năng lượng',
    summary: 'Nhà máy năng lượng chuyển hóa glucose và axit béo thành ATP. Màng trong gấp nếp thành mào cristae mang chuỗi chuyền electron.',
    fact: 'Tế bào cơ tim người chứa tới 40% thể tích là ti thể để duy trì nhịp đập liên tục suốt đời.',
    location: 'Phân bố rải rác khắp tế bào chất',
    size: 'Dài 1.5 - 3 µm',
    microscopy: 'Nhìn thấy dạng hạt nhỏ dưới kính quang học hoặc cấu trúc mào qua TEM',
    image: '/images/components/mitochondrion.webp',
    hotspots: [
      { position: [-0.4249, 0.0985, -0.3806], normal: [0.2673, 0.9592, -0.0917] },
      { position: [-0.4203, 0.0718, 0.7271], normal: [-0.5347, 0.2055, 0.8197] }
    ]
  },
  {
    id: 'animal-lysosome',
    name: 'Tiêu bào (Lysosome)',
    nameEn: 'Lysosome',
    color: '#8b5cf6',
    role: 'Tiêu hóa nội bào, tiêu diệt vi khuẩn & dọn dẹp tế bào',
    summary: 'Túi màng đơn chứa enzyme thủy phân axit (pH ~ 4.5 - 5.0). Tiêu hóa vi khuẩn sau thực bào và tái chế các bào quan già cỗi.',
    fact: 'Được ví như "nhà máy xử lý rác và túi tự sát" của tế bào nếu màng bị vỡ hàng loạt.',
    location: 'Rải rác trong bào tương',
    size: '0.1 - 1.2 µm',
    microscopy: 'Phát hiện qua nhuộm enzyme phosphatase axit',
    image: '/images/components/lysosome.webp',
    hotspots: [
      { position: [-0.4255, 0.0617, -0.1676], normal: [-0.5579, 0.7626, 0.3275] }
    ]
  },
  {
    id: 'animal-centrioles',
    name: 'Trung tử & Trung thể',
    nameEn: 'Centrioles & Centrosome',
    color: '#f59e0b',
    role: 'Tổ chức vi ống và tạo thoi phân bào khi phân chia tế bào',
    summary: 'Cặp trung tử xếp vuông góc nhau, mỗi trung tử gồm 9 bộ ba vi ống protein tubulin. Trung tâm điều phối hệ thống thoi vô sắc.',
    fact: 'Chỉ có ở tế bào động vật và thực vật bậc thấp; thực vật hạt kín không có trung tử.',
    location: 'Nằm sát màng nhân tế bào',
    size: '0.2 x 0.5 µm mỗi trung tử',
    microscopy: 'Quan sát dưới kính hiển vi điện tử huỳnh quang',
    image: '/images/components/centrioles.webp',
    hotspots: [
      { position: [-0.4897, 0.0665, 0.0772], normal: [-0.2577, 0.9641, 0.0642] }
    ]
  },
  {
    id: 'animal-plasma-membrane',
    name: 'Màng sinh chất',
    nameEn: 'Plasma Membrane',
    color: '#93c5fd',
    role: 'Ranh giới ngăn cách, kiểm soát xuất nhập chất & truyền tín hiệu',
    summary: 'Lớp kép phospholipid khảm động protein và cholesterol. Cho phép tế bào động vật biến dạng linh hoạt khi vận động.',
    fact: 'Màng tế bào rất mềm dẻo cho phép bạch cầu biến hình chui qua khe thành mao mạch.',
    location: 'Lớp vỏ ngoài cùng của tế bào động vật',
    size: 'Dày khoảng 7.5 - 10 nm',
    microscopy: 'Hai lớp sẫm kẹp lớp sáng dưới kính hiển vi TEM',
    image: '/images/components/membrane-wall.webp',
    hotspots: [
      { position: [-0.205, 0.0551, 0.9236], normal: [-0.0953, 0.9014, 0.4224] }
    ]
  }
];

// 3. Tế bào vi khuẩn (Bacteria - Prokaryote)
export const BACTERIA_ORGANELLES: OrganelleItem[] = [
  {
    id: 'bacteria-cell-wall',
    name: 'Thành tế bào Peptidoglycan',
    nameEn: 'Peptidoglycan Cell Wall',
    color: '#84cc16',
    role: 'Tạo bộ khung vững chắc chống vỡ dưới áp suất thẩm thấu',
    summary: 'Cấu tạo từ polysaccharide liên kết chéo bởi peptide. Giúp vi khuẩn duy trì hình dạng que (bacillus) và chống chịu môi trường khắc nghiệt.',
    fact: 'Kháng sinh Penicillin tiêu diệt vi khuẩn bằng cách ức chế enzyme tổng hợp cầu nối peptidoglycan này.',
    location: 'Lớp ngoài bao quanh màng sinh chất',
    size: 'Dày 10 - 80 nm',
    microscopy: 'Quan sát màu qua phương pháp nhuộm Gram kinh điển',
    image: '/images/components/membrane-wall.webp',
    hotspots: [
      { position: [-0.3066, 0.179, 0.1822], normal: [0.1181, 0.397, 0.9102] }
    ]
  },
  {
    id: 'bacteria-nucleoid',
    name: 'Vùng nhân (Nucleoid)',
    nameEn: 'Bacterial Nucleoid',
    color: '#c084fc',
    role: 'Chứa một phân tử ADN vòng kép duy nhất trần',
    summary: 'Không có màng nhân bao bọc. Chứa phân tử ADN trần dạng vòng siêu xoắn mang toàn bộ thông tin mã hóa cấu trúc vi khuẩn.',
    fact: 'ADN không liên kết với histone giúp vi khuẩn nhân đôi siêu nhanh (chỉ 20 phút/thế hệ ở E. coli).',
    location: 'Trung tâm tế bào chất',
    size: 'Chiếm 20% thể tích tế bào',
    microscopy: 'Nhuộm Feulgen chuyên biệt cho ADN',
    image: '/images/components/bacteria-nucleoid.webp',
    hotspots: [
      { position: [-0.0462, 0.2023, -0.067], normal: [-0.1523, 0.7514, 0.642] }
    ]
  },
  {
    id: 'bacteria-ribosomes',
    name: 'Ribosome 70S',
    nameEn: '70S Ribosomes',
    color: '#ef4444',
    role: 'Tổng hợp protein vi khuẩn siêu tốc',
    summary: 'Gồm hai tiểu đơn vị 50S và 30S kết hợp. Nhỏ hơn ribosome 80S của sinh vật nhân thực, là đích tác động của nhiều loại kháng sinh.',
    fact: 'Mỗi tế bào vi khuẩn đang lớn chứa từ 15.000 đến 30.000 ribosome hoạt động hết công suất.',
    location: 'Tự do trong dịch tế bào chất',
    size: 'Đường kính khoảng 20 nm',
    microscopy: 'Chỉ quan sát được dưới kính hiển vi điện tử siêu phân giải',
    image: '/images/components/ribosomes.webp',
    hotspots: [
      { position: [0.4018, 0.087, -0.3068], normal: [-0.0292, 0.6265, 0.7789] }
    ]
  },
  {
    id: 'bacteria-flagellum',
    name: 'Tiêu mao (Flagellum)',
    nameEn: 'Flagellum',
    color: '#fb923c',
    role: 'Động cơ quay giúp vi khuẩn bơi về phía dinh dưỡng',
    summary: 'Sợi protein xoắn gắn vào thể gốc trên màng. Thể gốc quay như một động cơ điện phân tử bằng dòng proton H+ với tốc độ 100.000 vòng/phút.',
    fact: 'Giúp vi khuẩn bơi với tốc độ gấp 60 lần chiều dài cơ thể mỗi giây.',
    location: 'Gắn ở một cực hoặc bề mặt màng',
    size: 'Dài 10 - 20 µm, đường kính 20 nm',
    microscopy: 'Nhuộm bạc làm dày sợi hoặc soi kính SEM',
    image: '/images/components/bacteria-appendages.webp',
    hotspots: [
      { position: [0.9354, 0.0666, -0.0468], normal: [-0.2836, 0.6418, 0.7125] }
    ]
  },
  {
    id: 'bacteria-pili',
    name: 'Lông mao & Pili tiếp hợp',
    nameEn: 'Pili & Fimbriae',
    color: '#a3e635',
    role: 'Bám dính bề mặt vật chủ & truyền plasmid kháng thuốc',
    summary: 'Hàng trăm sợi lông mảnh ngắn bao quanh vỏ vi khuẩn. Pili giới tính (F-pilus) tạo cầu nối truyền plasmid kháng sinh giữa các vi khuẩn.',
    fact: 'Pili giúp vi khuẩn bám chặt vào tế bào niêm mạc ruột chống lại dòng chảy bài tiết.',
    location: 'Phân bố khắp bề mặt thành tế bào',
    size: 'Dài 0.5 - 2 µm, đường kính 3 - 8 nm',
    microscopy: 'Kính hiển vi điện tử truyền qua (TEM)',
    image: '/images/components/bacteria-appendages.webp',
    hotspots: [
      { position: [-0.7114, -0.0717, 0.2563], normal: [-0.0657, 0.97, -0.2342] }
    ]
  }
];

// 4. Tế bào thần kinh (Neuron)
export const NEURON_ORGANELLES: OrganelleItem[] = [
  {
    id: 'neuron-dendrites',
    name: 'Sợi nhánh (Dendrites)',
    nameEn: 'Dendrites',
    color: '#a78bfa',
    role: 'Thu nhận xung thần kinh từ hàng nghìn nơ-ron khác',
    summary: 'Tỏa nhánh như tán cây từ thân nơ-ron. Trên bề mặt có vô số gai nhánh tiếp nhận tín hiệu hóa học synap.',
    fact: 'Mỗi nơ-ron có thể nhận tới 10.000 khớp nối synap thông qua mạng lưới sợi nhánh này.',
    location: 'Tỏa ra xung quanh thân tế bào',
    size: 'Dài hàng trăm micromet',
    microscopy: 'Nhuộm huỳnh quang hai photon sống',
    image: '/images/components/neuron-dendrites.webp',
    hotspots: [
      { position: [-0.7009, 0.0165, 0.3601], normal: [0.4485, 0.2232, 0.8654] }
    ]
  },
  {
    id: 'neuron-soma',
    name: 'Thân Nơ-ron (Soma)',
    nameEn: 'Neuronal Soma',
    color: '#c084fc',
    role: 'Trung tâm chuyển hóa dinh dưỡng & tích hợp điện thế',
    summary: 'Chứa các thể Nissl (lưới nội chất hạt dồi dào) và bộ máy Golgi. Tiếp nhận tín hiệu và quyết định phát xung thần kinh.',
    fact: 'Hầu hết các nơ-ron ở vỏ não tồn tại suốt đời mà không trải qua quá trình phân chia thay mới.',
    location: 'Chất xám não bộ, tủy sống và hạch thần kinh',
    size: 'Đường kính 10 - 50 µm',
    microscopy: 'Nhuộm tím Cresyl hoặc ngấm bạc Golgi',
    image: '/images/components/neuron-soma.webp',
    hotspots: [
      { position: [-0.3373, 0.0334, 0.209], normal: [0.3547, 0.3332, 0.8736] }
    ]
  },
  {
    id: 'neuron-nucleus',
    name: 'Nhân nơ-ron',
    nameEn: 'Neuron Nucleus',
    color: '#8b5cf6',
    role: 'Chỉ huy phiên mã tổng hợp chất dẫn truyền xung thần kinh',
    summary: 'Nhân tròn lớn sáng màu với một hạch nhân rất nổi rõ. Chỉ huy sản xuất các thụ thể màng và enzyme tổng hợp chất dẫn truyền.',
    fact: 'Mức độ hoạt động phiên mã của nhân nơ-ron phản ánh trực tiếp quá trình lưu giữ ký ức dài hạn.',
    location: 'Tâm thân nơ-ron',
    size: '10 - 15 µm',
    microscopy: 'Thuốc nhuộm DAPI hoặc hematoxylin',
    image: '/images/components/neuron-nucleus.webp',
    hotspots: [
      { position: [-0.4709, 0.0393, 0.1246], normal: [0.061, 0.9684, -0.2417] }
    ]
  },
  {
    id: 'neuron-axon',
    name: 'Sợi trục (Axon)',
    nameEn: 'Axon',
    color: '#60a5fa',
    role: 'Dẫn truyền xung điện thế hoạt động đi xa một chiều',
    summary: 'Bắt đầu từ gò sợi trục. Màng sợi trục giàu kênh ion Na+/K+ phụ thuộc điện thế giúp dẫn truyền tín hiệu điện một chiều tới đích.',
    fact: 'Sợi trục nơ-ron vận động điều khiển ngón chân có thể dài hơn 1 mét từ tủy sống xuống bàn chân.',
    location: 'Kéo dài từ gò sợi trục đến cúc tận cùng',
    size: 'Dài vài mm đến hơn 1 m',
    microscopy: 'Kính hiển vi phân cực và SEM',
    image: '/images/components/neuron-axon.webp',
    hotspots: [
      { position: [0.6431, -0.061, 0.0179], normal: [0.3037, 0.6038, 0.7371] }
    ]
  },
  {
    id: 'neuron-myelin',
    name: 'Bao Myelin',
    nameEn: 'Myelin Sheath',
    color: '#fde68a',
    role: 'Cách điện sinh học & dẫn truyền xung thần kinh nhảy cóc',
    summary: 'Tế bào Schwann hoặc Oligodendrocyte cuộn nhiều lớp quanh sợi trục. Giữa các bao có eo Ranvier giúp xung điện nhảy cóc với tốc độ 120 m/s.',
    fact: 'Tổn thương bao Myelin dẫn đến các bệnh lý thần kinh nặng như xơ cứng rải rác (Multiple Sclerosis).',
    location: 'Bọc từng đoạn dọc sợi trục',
    size: 'Mỗi đoạn bao dài ~1 mm',
    microscopy: 'Nhuộm Osmium tetroxide bắt màu đen chất béo lipid',
    image: '/images/components/neuron-myelin.webp',
    hotspots: [
      { position: [0.1576, -0.0263, 0.0394], normal: [0.104, 0.5372, 0.837] }
    ]
  },
  {
    id: 'neuron-terminals',
    name: 'Cúc tận cùng (Terminals)',
    nameEn: 'Axon Terminals',
    color: '#d8b4fe',
    role: 'Phóng thích chất dẫn truyền thần kinh qua khe synap',
    summary: 'Chứa hàng nghìn bóng túi chứa acetylcholine, dopamine hoặc serotonin. Kênh Ca2+ mở làm vỡ túi giải phóng chất kích thích nơ-ron tiếp theo.',
    fact: 'Bộ não con người có khoảng 100 nghìn tỷ khớp synap kết nối mạng lưới tư duy.',
    location: 'Đầu mút tận cùng của các nhánh sợi trục',
    size: 'Rộng 1 - 2 µm',
    microscopy: 'Kính hiển vi điện tử truyền qua TEM',
    image: '/images/components/neuron-terminals.webp',
    hotspots: [
      { position: [0.8314, -0.1153, 0.0929], normal: [0.105, 0.9711, 0.2142] }
    ]
  }
];

// 5. Tế bào tinh trùng (Sperm Cell)
export const SPERM_ORGANELLES: OrganelleItem[] = [
  {
    id: 'sperm-head',
    name: 'Đầu tinh trùng',
    nameEn: 'Sperm Head',
    color: '#93c5fd',
    role: 'Bảo quản và vận chuyển bộ nhiễm sắc thể đơn bội',
    summary: 'Dạng hạt dẹt thuôn nhọn chứa DNA cô đặc cao độ nhờ protamine, giảm tối đa lực cản ma sát khi bơi trong dịch sinh dục nữ.',
    fact: 'Nhân tinh trùng gần như bất hoạt hoàn toàn về phiên mã, chờ thụ tinh kết hợp với trứng.',
    location: 'Phần đầu phía trước',
    size: 'Dài 5 µm, rộng 3 µm',
    microscopy: 'Nhuộm Papanicolaou',
    image: '/images/components/sperm-head.webp',
    hotspots: [
      { position: [0.1962, 0.4793, 0.1834], normal: [-0.6308, 0.6962, 0.3427] }
    ]
  },
  {
    id: 'sperm-acrosome',
    name: 'Thể đỉnh (Acrosome)',
    nameEn: 'Acrosome',
    color: '#38bdf8',
    role: 'Tiết enzyme hyaluronidase khoan màng trứng',
    summary: 'Túi enzyme trùm lên 2/3 đầu tinh trùng. Khoan thủng lớp tế bào hạt và màng trong suốt (zona pellucida) của noãn.',
    fact: 'Phản ứng thể đỉnh xảy ra ngay khi tinh trùng chạm thụ thể ZP3 trên màng trứng.',
    location: 'Mũ chụp bọc quanh đỉnh đầu',
    size: 'Chiếm 50% diện tích đầu',
    microscopy: 'Khảo sát huỳnh quang miễn dịch kháng thể chống acrosin',
    image: '/images/components/sperm-acrosome-detail.webp',
    hotspots: [
      { position: [0.3214, 0.509, 0.2244], normal: [0.5735, 0.7004, 0.4249] }
    ]
  },
  {
    id: 'sperm-nucleus',
    name: 'Nhân đơn bội (n=23)',
    nameEn: 'Haploid Nucleus',
    color: '#c084fc',
    role: 'Chứa 23 nhiễm sắc thể mang thông tin di truyền của bố',
    summary: 'Chứa 22 nhiễm sắc thể thường và 1 nhiễm sắc thể giới tính (X hoặc Y) quyết định giới tính đời con.',
    fact: 'Tỷ lệ sinh tự nhiên là xấp xỉ 105 bé trai / 100 bé gái nhờ sự linh hoạt của tinh trùng mang NST Y.',
    location: 'Bên trong đầu tinh trùng',
    size: 'Chiếm phần lớn thể tích đầu',
    microscopy: 'Nhuộm xanh methylen',
    image: '/images/components/sperm-nucleus-detail.webp',
    hotspots: [
      { position: [0.2344, 0.461, 0.2292], normal: [-0.3416, 0.2157, 0.9148] }
    ]
  },
  {
    id: 'sperm-midpiece',
    name: 'Đoạn giữa (Ty thể xoắn)',
    nameEn: 'Mitochondrial Midpiece',
    color: '#fb923c',
    role: 'Nhà máy cung cấp ATP nuôi chuyển động quạt đuôi',
    summary: 'Chứa 50 - 75 ti thể lớn sắp xếp xoắn ốc chặt chẽ quanh sợi trục vi ống, chuyển hóa đường fructose thành ATP.',
    fact: 'Ti thể của tinh trùng bị tiêu hủy khi vào trong noãn, do đó ADN ti thể chỉ di truyền theo dòng mẹ.',
    location: 'Nối giữa cổ và đuôi',
    size: 'Dài 7 - 8 µm',
    microscopy: 'Kính hiển vi điện tử quét thấy rõ vân xoắn ốc',
    image: '/images/components/sperm-midpiece-detail.webp',
    hotspots: [
      { position: [0.0479, 0.3302, 0.068], normal: [-0.2354, 0.5691, 0.7878] }
    ]
  },
  {
    id: 'sperm-tail',
    name: 'Đuôi roi (Flagellum)',
    nameEn: 'Sperm Tail',
    color: '#60a5fa',
    role: 'Quạt sóng liên tục đẩy tinh trùng bơi về phía trước',
    summary: 'Cấu trúc vi ống 9+2 kết hợp protein động cơ dynein. Uốn lượn liên tục 50 Hz đẩy tinh trùng bơi ngược dòng 1 - 4 mm/phút.',
    fact: 'Chiếm gần 90% tổng chiều dài của cả tinh trùng (~50 µm).',
    location: 'Toàn bộ phần thân sau',
    size: 'Dài 45 - 50 µm',
    microscopy: 'Quan sát chuyển động sống bằng kính hiển vi tương phản pha',
    image: '/images/components/sperm-tail-detail.webp',
    hotspots: [
      { position: [-0.3682, 0.0264, -0.1592], normal: [0.1679, 0.9814, 0.0927] }
    ]
  }
];

// 6. Tế bào nấm men (Yeast Cell)
export const YEAST_ORGANELLES: OrganelleItem[] = [
  {
    id: 'yeast-cell-wall',
    name: 'Thành Chitin & Glucan',
    nameEn: 'Yeast Cell Wall',
    color: '#e2b866',
    role: 'Cấu trúc cứng bảo vệ nấm men chống biến dạng áp suất',
    summary: 'Gồm mạng lưới beta-glucan và chitin kiên cố ở lớp trong và mannoprotein ở lớp ngoài, chống chịu nồng độ cồn ethanol cao.',
    fact: 'Nấm men Saccharomyces cerevisiae là sinh vật then chốt sản xuất bánh mì, bia và rượu vang từ hàng ngàn năm trước.',
    location: 'Lớp vỏ ngoài cùng',
    size: 'Dày 100 - 200 nm',
    microscopy: 'Kính hiển vi quang học dạng hình cầu oval',
    image: '/images/components/yeast-cell-wall-v3.webp',
    hotspots: [
      { position: [0.2532, 0.12, 0.8903], normal: [0.209, 0.0829, 0.9744] }
    ]
  },
  {
    id: 'yeast-bud',
    name: 'Chồi con (Bud)',
    nameEn: 'Daughter Bud',
    color: '#f5d78e',
    role: 'Sinh sản vô tính bằng cách nảy chồi',
    summary: 'Tế bào mẹ hình thành phần lồi nhỏ, nhân đôi ADN và chuyển một bản sao nhân cùng bào quan sang chồi con trước khi tách rời.',
    fact: 'Chu kỳ nảy chồi của nấm men chỉ mất khoảng 90 phút trong môi trường giàu đường và dưỡng chất.',
    location: 'Nhô ra trên bề mặt tế bào mẹ',
    size: '1 - 3 µm',
    microscopy: 'Thuốc nhuộm Calcofluor white huỳnh quang',
    image: '/images/components/yeast-bud-v3.webp',
    hotspots: [
      { position: [1.7599, 0.0056, 0.4216], normal: [0.3492, 0.1272, 0.9284] }
    ]
  },
  {
    id: 'yeast-membrane',
    name: 'Màng sinh chất nấm men',
    nameEn: 'Plasma Membrane',
    color: '#f472b6',
    role: 'Vận chuyển đường glucose và điều hòa ion nội bào',
    summary: 'Lớp kép phospholipid giàu ergosterol (chất tương đương cholesterol ở động vật, là đích nhắm của thuốc kháng nấm).',
    fact: 'Thuốc chống nấm Azole tiêu diệt nấm men bằng cách ức chế quá trình sinh tổng hợp ergosterol trên màng này.',
    location: 'Ngay dưới thành tế bào',
    size: '7 - 10 nm',
    microscopy: 'Kính hiển vi TEM',
    image: '/images/components/yeast-membrane-v3.webp',
    hotspots: [
      { position: [0.6797, 0.12, 0.617], normal: [0.6349, 0.0617, 0.7701] }
    ]
  },
  {
    id: 'yeast-nucleus',
    name: 'Nhân tế bào nấm men',
    nameEn: 'Yeast Nucleus',
    color: '#a855f7',
    role: 'Chứa 16 nhiễm sắc thể của sinh vật nhân thực hoàn chỉnh',
    summary: 'Có màng nhân kép. Khi phân chia, màng nhân không tiêu biến như ở động vật mà phân chia kín (closed mitosis).',
    fact: 'Bộ gen nấm men là hệ gen sinh vật nhân thực đầu tiên được giải mã hoàn chỉnh trong lịch sử năm 1996.',
    location: 'Trung tâm tế bào chất',
    size: '1.5 - 2 µm',
    microscopy: 'Nhuộm thuốc nhuộm DAPI',
    image: '/images/components/yeast-nucleus-v3.webp',
    hotspots: [
      { position: [1.0643, 0.1884, 0.0364], normal: [0.3221, 0.4313, 0.8428] }
    ]
  },
  {
    id: 'yeast-vacuole',
    name: 'Không bào nấm men',
    nameEn: 'Yeast Vacuole',
    color: '#7dd3fc',
    role: 'Túi tiêu hóa enzyme tương đương lysosome & cân bằng nội môi',
    summary: 'Thoái hóa protein lỗi, dự trữ ion kim loại và điều hòa áp suất thẩm thấu khi lên men.',
    fact: 'Nghiên cứu quá trình tự thực (Autophagy) tại không bào nấm men đã mang lại giải Nobel Y học năm 2016.',
    location: 'Chiếm vùng lớn bên cạnh nhân',
    size: '1 - 3 µm',
    microscopy: 'Nhuộm màu trung tính Neutral Red',
    image: '/images/components/yeast-vacuole-v3.webp',
    hotspots: [
      { position: [-0.1902, 0.2207, 0.1872], normal: [0.4421, 0.5004, 0.7444] }
    ]
  },
  {
    id: 'yeast-mitochondria',
    name: 'Ti thể nấm men',
    nameEn: 'Yeast Mitochondria',
    color: '#fb923c',
    role: 'Hô hấp hiếu khí khi có oxy hoặc chuyển sang lên men',
    summary: 'Tạo năng lượng khi có mặt khí oxy. Trong điều kiện kỵ khí, nấm men chuyển sang lên men rượu sinh ra cồn ethanol và CO2.',
    fact: 'Hiệu ứng Pasteur: Nấm men ức chế lên men khi nồng độ oxy trong môi trường tăng cao.',
    location: 'Rải rác trong tế bào chất',
    size: '1 - 2 µm',
    microscopy: 'Nhuộm Rhodamine 123 huỳnh quang',
    image: '/images/components/yeast-mitochondria-v3.webp',
    hotspots: [
      { position: [0.0501, 0.0324, -0.4049], normal: [0.2026, 0.1496, 0.9678] }
    ]
  },
  {
    id: 'yeast-er',
    name: 'Lưới nội chất nấm men',
    nameEn: 'Endoplasmic Reticulum',
    color: '#60a5fa',
    role: 'Tổng hợp protein tiết và phospholipid màng',
    summary: 'Hệ thống màng ống liên kết với màng nhân, chịu trách nhiệm gắn glycosyl lên protein xuất bào.',
    fact: 'Nấm men được ứng dụng rộng rãi trong kỹ nghệ sinh học để sản xuất vaccine viêm gan B tái tổ hợp.',
    location: 'Quanh màng nhân',
    size: 'Trải rộng nội bào',
    microscopy: 'Kính hiển vi TEM',
    image: '/images/components/yeast-er-v3.webp',
    hotspots: [
      { position: [0.148, 0.0549, 0.1736], normal: [0.3583, 0.4735, 0.8046] }
    ]
  },
  {
    id: 'yeast-bud-scars',
    name: 'Vết sẹo chồi (Bud Scars)',
    nameEn: 'Bud Scars',
    color: '#c08a3e',
    role: 'Dấu vết vĩnh viễn sau mỗi lần sinh chồi con',
    summary: 'Vòng nhẫn giàu chitin còn lại trên thành tế bào mẹ sau khi chồi con tách rời.',
    fact: 'Dựa vào số vết sẹo chồi, nhà khoa học xác định chính xác tuổi thọ nấm men (tối đa ~25 - 30 lần sinh chồi).',
    location: 'Trên bề mặt thành tế bào mẹ',
    size: 'Đường kính ~1 µm',
    microscopy: 'Nhuộm Calcofluor white phát huỳnh quang vòng tròn sáng',
    image: '/images/components/yeast-bud-scars-v3.webp',
    hotspots: [
      { position: [-1.1657, 0.0021, -0.0997], normal: [0.5653, 0.5517, 0.6132] }
    ]
  }
];

// 7. Tế bào máu (Blood Cells)
export const BLOOD_CELL_ORGANELLES: OrganelleItem[] = [
  {
    id: 'blood-red-cells',
    name: 'Hồng cầu đĩa lõm 2 mặt',
    nameEn: 'Red Blood Cells (Erythrocytes)',
    color: '#ef4444',
    role: 'Vận chuyển khí O2 từ phổi đến mô và mang CO2 về phổi',
    summary: 'Hình đĩa lõm 2 mặt tăng 30% diện tích tiếp xúc trao đổi khí, mềm dẻo luồn lách qua mao mạch 3 µm. Không có nhân và ti thể.',
    fact: 'Mỗi hồng cầu chứa 270 triệu phân tử Hemoglobin, và cơ thể tạo ra 2 triệu hồng cầu mới mỗi giây!',
    location: 'Chiếm 99% tế bào máu',
    size: 'Đường kính 7 - 8 µm, dày mép 2 µm',
    microscopy: 'Màu đỏ tự nhiên không cần nhuộm',
    image: '/images/components/blood-red-cells-v3.webp',
    hotspots: [
      { position: [-1.0498, 0.472, 2.0899], normal: [0.3269, 0.52, 0.7891] }
    ]
  },
  {
    id: 'blood-white-cell',
    name: 'Bạch cầu (Leukocyte)',
    nameEn: 'White Blood Cell',
    color: '#c4b5fd',
    role: 'Hàng rào miễn dịch săn lùng và tiêu diệt vi khuẩn, virus',
    summary: 'Có nhân phân thùy đặc trưng, chuyển động amip, thực bào dị vật và phóng thích kháng thể bảo vệ cơ thể.',
    fact: 'Bạch cầu có thể biến hình chui qua khe tế bào nội mô mạch máu (hiện tượng xuyên mạch) để tới ổ viêm.',
    location: 'Tuần hoàn trong máu và mô bạch huyết',
    size: '10 - 20 µm',
    microscopy: 'Nhuộm Giemsa thấy nhân tím sẫm',
    image: '/images/components/blood-white-cell-v3.webp',
    hotspots: [
      { position: [0.5651, -0.5432, 1.2345], normal: [0.2582, 0.4426, 0.8587] }
    ]
  },
  {
    id: 'blood-nucleus',
    name: 'Nhân phân thùy bạch cầu',
    nameEn: 'Lobulated Nucleus',
    color: '#8b5cf6',
    role: 'Chỉ huy phản ứng viêm và đáp ứng miễn dịch đặc hiệu',
    summary: 'Nhân phân chia thành 3 - 5 thùy nối bằng cầu sợi nhiễm sắc, đặc trưng ở bạch cầu trung tính.',
    fact: 'Cấu trúc phân thùy giúp nhân mềm dẻo hơn, hỗ trợ bạch cầu biến dạng xuyên mạch dễ dàng.',
    location: 'Bên trong bạch cầu',
    size: 'Chiếm phần lớn thể tích bạch cầu',
    microscopy: 'Nhuộm Wright bắt màu tím đậm',
    image: '/images/components/blood-nucleus-v3.webp',
    hotspots: [
      { position: [-0.3972, -0.9948, -0.055], normal: [0.2093, 0.5462, 0.8111] }
    ]
  },
  {
    id: 'blood-granules',
    name: 'Hạt tiết kháng khuẩn',
    nameEn: 'Secretory Granules',
    color: '#f472b6',
    role: 'Chứa lysozyme, peroxidase và enzyme diệt khuẩn',
    summary: 'Các bọc túi giải phóng enzyme tiêu hủy màng vi khuẩn và kích hoạt phản ứng viêm tại chỗ.',
    fact: 'Tế bào giải phóng các gốc oxy hóa tự do (ROS) cực mạnh để khử trùng vi khuẩn.',
    location: 'Dày đặc trong bào tương bạch cầu',
    size: '0.2 - 0.5 µm',
    microscopy: 'Dạng hạt lấm chấm màu hồng hoặc xanh',
    image: '/images/components/blood-granules-v3.webp',
    hotspots: [
      { position: [1.0138, -0.5331, -0.0032], normal: [-0.1947, 0.268, 0.9435] }
    ]
  },
  {
    id: 'blood-platelets',
    name: 'Tiểu cầu (Platelets)',
    nameEn: 'Blood Platelets',
    color: '#f9a8d4',
    role: 'Khởi động đông máu và tạo nút chặn vết thương',
    summary: 'Mảnh tế bào không nhân sinh ra từ megakaryocyte. Kết dính tạo nút tiểu cầu và giải phóng fibrin cầm máu.',
    fact: 'Đời sống tiểu cầu chỉ kéo dài 8 - 10 ngày trước khi bị phân hủy tại lách.',
    location: 'Lơ lửng trong huyết tương',
    size: '2 - 3 µm',
    microscopy: 'Dạng mảnh lốm đốm nhỏ màu tím nhạt',
    image: '/images/components/blood-platelets-v3.webp',
    hotspots: [
      { position: [1.6003, 0.603, -2.8342], normal: [0.2945, 0.4713, 0.8314] }
    ]
  }
];

// 8. Thể thực khuẩn (Bacteriophage T4 Virus)
export const VIRUS_ORGANELLES: OrganelleItem[] = [
  {
    id: 'phage-capsid',
    name: 'Đầu Capsid khối 20 mặt',
    nameEn: 'Capsid Head',
    color: '#a78bfa',
    role: 'Bảo vệ bộ gen ADN xoắn kép dưới áp suất cao',
    summary: 'Vỏ protein icosahedron cân xứng chứa phân tử ADN kép nén chặt dưới áp suất lên đến 50 atm.',
    fact: 'ADN bên trong đầu virus bị nén chặt tương đương áp lực gấp 25 lần lốp ô tô.',
    location: 'Phần trên cùng của virus',
    size: 'Dài ~120 nm, rộng 86 nm',
    microscopy: 'Kính hiển vi điện tử TEM và Cryo-EM',
    image: '/images/components/phage-capsid-v3.webp',
    hotspots: [
      { position: [-0.3043, 1.9298, 0.2678], normal: [-0.1935, 0.7796, 0.5957] }
    ]
  },
  {
    id: 'phage-dna',
    name: 'Lõi ADN kép',
    nameEn: 'Viral dsDNA Genome',
    color: '#facc15',
    role: 'Mang toàn bộ chương trình gen chiếm đoạt vi khuẩn',
    summary: 'Chứa khoảng 169.000 cặp base mã hóa gần 300 loại protein điều khiển toàn bộ bộ máy nhân đôi của vi khuẩn.',
    fact: 'Thể thực khuẩn là thực thể sinh học phong phú nhất trên Trái Đất với khoảng 10^31 cá thể.',
    location: 'Nén chặt bên trong khoang đầu capsid',
    size: 'Chuỗi DNA dài khoảng 55 µm khi kéo thẳng',
    microscopy: 'Tái dựng cấu trúc nguyên tử qua Cryo-EM',
    image: '/images/components/phage-dna-v3.webp',
    hotspots: [
      { position: [0.0779, 2.3099, 0.3708], normal: [0.3596, 0.3815, 0.8516] }
    ]
  },
  {
    id: 'phage-tail-sheath',
    name: 'Bao đuôi co rút',
    nameEn: 'Contractile Tail Sheath',
    color: '#2dd4bf',
    role: 'Hoạt động như ống tiêm bơm ADN xuyên qua màng vi khuẩn',
    summary: 'Gồm ống trụ rỗng bọc ngoài bởi bao co rút. Khi bám dính, bao co ngắn 50% đẩy ống trụ xuyên thủng thành vi khuẩn.',
    fact: 'Cơ chế tiêm gen hoạt động như một cỗ máy nanorobot cơ học tinh xảo nhất trong sinh giới.',
    location: 'Nằm giữa đầu và đĩa gốc',
    size: 'Dài 100 nm, đường kính 20 nm',
    microscopy: 'Kính hiển vi SEM thấy rõ trạng thái co và duỗi',
    image: '/images/components/phage-tail-sheath-v3.webp',
    hotspots: [
      { position: [-0.0728, 1.0321, 0.1242], normal: [0.2308, 0.7152, 0.6597] }
    ]
  },
  {
    id: 'phage-baseplate',
    name: 'Đĩa gốc & Gai nhọn (Baseplate)',
    nameEn: 'Baseplate & Spikes',
    color: '#3b82f6',
    role: 'Cảm biến nhận diện bề mặt thụ thể và tiết lysozyme',
    summary: 'Cụm protein hình lục giác ở đáy ống đuôi. Chứa các gai nhọn và lysozyme giúp thủy phân thành peptidoglycan vi khuẩn.',
    fact: 'Baseplate biến đổi hình thái từ vòm sang phẳng khi kích hoạt quá trình tiêm nhiễm.',
    location: 'Đáy của thân đuôi',
    size: 'Đường kính khoảng 40 nm',
    microscopy: 'Dựng hình cấu trúc nguyên tử qua Cryo-EM',
    image: '/images/components/phage-baseplate-v3.webp',
    hotspots: [
      { position: [0.0236, 0.5762, 0.2363], normal: [0.2034, 0.5695, 0.7964] }
    ]
  },
  {
    id: 'phage-tail-fibers',
    name: 'Sợi đuôi (Tail Fibers)',
    nameEn: 'Tail Fibers',
    color: '#fb923c',
    role: 'Chân hạ cánh và nhận diện đặc hiệu bề mặt vi khuẩn',
    summary: 'Sáu sợi đuôi có khớp co gập như chân nhện, nhận diện đặc hiệu các phân tử LPS trên bề mặt E. coli.',
    fact: 'Mỗi thể thực khuẩn chỉ tiêu diệt một loài vi khuẩn cụ thể, mở ra triển vọng liệu pháp thực khuẩn thay thế kháng sinh.',
    location: 'Gắn xòe ra từ đĩa gốc',
    size: 'Dài khoảng 140 nm',
    microscopy: 'Dạng chân nhện hạ cánh trên bề mặt vi khuẩn',
    image: '/images/components/phage-tail-fibers-v3.webp',
    hotspots: [
      { position: [0.5415, 0.6806, 0.5297], normal: [0.2605, 0.577, 0.7741] }
    ]
  },
  {
    id: 'phage-host-wall',
    name: 'Vỏ vi khuẩn vật chủ (Host Wall)',
    nameEn: 'Host Bacterial Wall',
    color: '#4ade80',
    role: 'Bề mặt đích để thể thực khuẩn bám dính và xâm nhập',
    summary: 'Lớp màng ngoài và thành peptidoglycan của vi khuẩn bị thể thực khuẩn neo bám và khoan thủng trong quá trình tiêm nhiễm.',
    fact: 'Sau khi tiêm ADN, thể thực khuẩn nhân lên và làm tan rã (lyse) toàn bộ thành tế bào vật chủ để phóng thích 200 virion mới.',
    location: 'Bề mặt tiếp xúc dưới chân phage',
    size: 'Thành vi khuẩn dày 10 - 30 nm',
    microscopy: 'Kính hiển vi điện tử quét thấy hàng chục phage bám trên một vi khuẩn',
    image: '/images/components/phage-host-wall-v3.webp',
    hotspots: [
      { position: [-0.3967, 0.0071, 0.165], normal: [0.1265, 0.6848, 0.7177] }
    ]
  }
];

export const CELL_TYPE_CATALOG: Record<string, CellTypeDefinition> = {
  plant: {
    id: 'plant',
    name: 'Tế bào thực vật',
    nameEn: 'Plant Cell',
    thumbnail: '/images/thumbnails/plant-cell.webp',
    description: 'Tế bào nhân thực đặc trưng với thành cellulose vững chắc, lục lạp quang hợp và không bào trung tâm khổng lồ.',
    modelUrl: '/models/plant-cell-v2.glb',
    maskUrl: '/models/plant-cell-organelles.png',
    maskKeys: ['vacuole', 'nucleus', 'mitochondrion', 'golgi', 'chloroplast', 'cell-wall'],
    rotationY: -0.22,
    initialLabelKey: 'nucleus',
    organelles: PLANT_CELL_ORGANELLES,
  },
  animal: {
    id: 'animal',
    name: 'Tế bào động vật',
    nameEn: 'Animal Cell',
    thumbnail: '/images/thumbnails/animal-cell.webp',
    description: 'Tế bào nhân thực linh hoạt không có thành cellulose, giàu trung thể, tiêu bào lysosome và ti thể hoạt động mạnh.',
    modelUrl: '/models/animal-cell-v2.glb',
    maskUrl: '/models/animal-cell-organelles.png',
    maskKeys: ['animal-nucleus', 'animal-mitochondrion', 'animal-golgi', 'animal-centrioles', 'animal-plasma-membrane'],
    initialLabelKey: 'animal-nucleus',
    organelles: ANIMAL_CELL_ORGANELLES,
  },
  bacteria: {
    id: 'bacteria',
    name: 'Tế bào vi khuẩn',
    nameEn: 'Bacteria (Prokaryote)',
    thumbnail: '/images/thumbnails/bacteria-cell.webp',
    description: 'Sinh vật nhân sơ đơn bào cổ xưa với thành peptidoglycan, vùng nhân ADN trần và tiêu mao quay siêu tốc.',
    modelUrl: '/models/bacteria-cell-v2.glb',
    maskUrl: '/models/bacteria-cell-organelles.png',
    maskKeys: ['bacteria-nucleoid', 'bacteria-flagellum', 'bacteria-pili'],
    initialLabelKey: 'bacteria-nucleoid',
    organelles: BACTERIA_ORGANELLES,
  },
  neuron: {
    id: 'neuron',
    name: 'Tế bào thần kinh',
    nameEn: 'Neuron',
    thumbnail: '/images/thumbnails/neuron.webp',
    description: 'Tế bào chuyên hóa cao độ dẫn truyền xung điện sinh học, sở hữu sợi nhánh tiếp nhận và sợi trục bọc myelin.',
    modelUrl: '/models/neuron-cell-v2.glb',
    maskUrl: '/models/neuron-cell-organelles.png',
    maskKeys: ['neuron-nucleus', 'neuron-myelin'],
    initialLabelKey: 'neuron-soma',
    organelles: NEURON_ORGANELLES,
  },
  sperm: {
    id: 'sperm',
    name: 'Tế bào tinh trùng',
    nameEn: 'Spermatozoon',
    thumbnail: '/images/thumbnails/sperm-cell.webp',
    description: 'Giao tử đực đơn bội linh động với thể đỉnh acrosome xuyên màng và ti thể xoắn cung cấp năng lượng quạt đuôi.',
    modelUrl: '/models/sperm-cell-v2.glb',
    initialLabelKey: 'sperm-head',
    organelles: SPERM_ORGANELLES,
  },
  yeast: {
    id: 'yeast',
    name: 'Tế bào nấm men',
    nameEn: 'Yeast Cell',
    thumbnail: '/images/thumbnails/yeast-cell-v3.webp',
    description: 'Nấm men đơn bào nhân thực sinh sản bằng nảy chồi, thành chitin kiên cố và khả năng lên men rượu sinh học.',
    modelUrl: '/models/yeast-cell-v3.glb',
    initialLabelKey: 'yeast-nucleus',
    organelles: YEAST_ORGANELLES,
  },
  blood: {
    id: 'blood',
    name: 'Tế bào máu',
    nameEn: 'Blood Cells',
    thumbnail: '/images/thumbnails/blood-cells-v3.webp',
    description: 'Bao gồm hồng cầu đĩa lõm vận chuyển oxy, bạch cầu bảo vệ miễn dịch và tiểu cầu cầm máu đông máu.',
    modelUrl: '/models/blood-cells-v3.glb',
    initialLabelKey: 'blood-red-cells',
    organelles: BLOOD_CELL_ORGANELLES,
  },
  virus: {
    id: 'virus',
    name: 'Thể thực khuẩn (virus)',
    nameEn: 'Bacteriophage T4',
    thumbnail: '/images/thumbnails/bacteriophage-v3.webp',
    description: 'Virus cấu trúc nanorobot tinh xảo chuyên ký sinh tiêu diệt vi khuẩn với đầu capsid 20 mặt và bao đuôi bơm ADN.',
    modelUrl: '/models/bacteriophage-v3.glb',
    initialLabelKey: 'phage-capsid',
    organelles: VIRUS_ORGANELLES,
  },
};

export const CELL_TYPES = Object.values(CELL_TYPE_CATALOG).map((c) => ({
  id: c.id,
  name: c.name,
  nameEn: c.nameEn,
  thumbnail: c.thumbnail,
  available: true,
}));

export const ORGANELLES: OrganelleItem[] = PLANT_CELL_ORGANELLES;
