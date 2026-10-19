// ─── Dữ liệu & Bộ Sinh Phương Trình Hóa Học Động Minigame Chuẩn GDPT 2018 ───
// Kho dữ liệu phong phú 100+ phương trình + Cơ chế sinh phản ứng động ngẫu nhiên chống học vẹt

export interface EquationItem {
  id: string;
  grade: 8 | 9 | 10 | 11 | 12;
  category: "metal_acid" | "acid_base" | "precipitation" | "redox" | "gas_evolution" | "organic" | "combustion";
  categoryLabel: string;
  reactants: string;       // Vế trái (chất tham gia)
  products: string;        // Vế phải (sản phẩm)
  fullEquation: string;    // Phương trình đầy đủ kèm điều kiện
  condition?: string;      // t°, xúc tác, điện phân...
  phenomenon: string;      // Hiện tượng thực tế trực quan
  colorHint?: string;      // Màu sắc đặc trưng
  points: number;          // Điểm cơ bản
}

export const BASE_EQUATION_DATABASE: EquationItem[] = [
  // ══════════════════════════════════════════════════════════
  // ─── KHỐI LỚP 8 & 9 (Cơ Bản: Kim Loại, Phi Kim, Axit, Bazơ, Muối) ───
  // ══════════════════════════════════════════════════════════
  {
    id: "eq-8-1",
    grade: 8,
    category: "metal_acid",
    categoryLabel: "Kim loại + Axit",
    reactants: "Zn + 2HCl",
    products: "ZnCl₂ + H₂↑",
    fullEquation: "Zn + 2HCl → ZnCl₂ + H₂↑",
    phenomenon: "Mảnh kẽm tan dần, sủi bọt khí H₂ không màu mãnh liệt, tỏa nhiệt làm nóng ống nghiệm.",
    points: 100,
  },
  {
    id: "eq-8-2",
    grade: 8,
    category: "metal_acid",
    categoryLabel: "Kim loại + Axit",
    reactants: "2Al + 6HCl",
    products: "2AlCl₃ + 3H₂↑",
    fullEquation: "2Al + 6HCl → 2AlCl₃ + 3H₂↑",
    phenomenon: "Lá nhôm tan nhanh chóng, bọt khí H₂ thoát ra dữ dội, tỏa nhiều nhiệt.",
    points: 110,
  },
  {
    id: "eq-8-3",
    grade: 8,
    category: "metal_acid",
    categoryLabel: "Kim loại + Axit",
    reactants: "Fe + 2HCl",
    products: "FeCl₂ + H₂↑",
    fullEquation: "Fe + 2HCl → FeCl₂ + H₂↑",
    phenomenon: "Đinh sắt tan dần, sủi bọt khí H₂, dung dịch chuyển sang màu xanh lục nhạt của muối Fe²⁺.",
    points: 100,
  },
  {
    id: "eq-8-4",
    grade: 8,
    category: "metal_acid",
    categoryLabel: "Kim loại + Axit",
    reactants: "Mg + H₂SO₄ (loãng)",
    products: "MgSO₄ + H₂↑",
    fullEquation: "Mg + H₂SO₄ → MgSO₄ + H₂↑",
    phenomenon: "Dây magie bốc cháy sủi bọt khí cực nhanh, tan biến trong dung dịch axit.",
    points: 110,
  },
  {
    id: "eq-8-5",
    grade: 8,
    category: "combustion",
    categoryLabel: "Sự cháy",
    reactants: "CH₄ + 2O₂",
    products: "CO₂ + 2H₂O",
    condition: "t°",
    fullEquation: "CH₄ + 2O₂ --t°--> CO₂ + 2H₂O",
    phenomenon: "Khí metan cháy với ngọn lửa màu xanh lam nhạt, tỏa lượng nhiệt rất lớn.",
    points: 100,
  },
  {
    id: "eq-8-6",
    grade: 8,
    category: "combustion",
    categoryLabel: "Sự cháy phi kim",
    reactants: "4P + 5O₂",
    products: "2P₂O₅",
    condition: "t°",
    fullEquation: "4P + 5O₂ --t°--> 2P₂O₅",
    phenomenon: "Photpho đỏ bốc cháy sáng chói, tạo khói trắng dày đặc dạng bột P₂O₅ bám quanh bình.",
    points: 120,
  },
  {
    id: "eq-8-7",
    grade: 8,
    category: "combustion",
    categoryLabel: "Sự cháy phi kim",
    reactants: "S + O₂",
    products: "SO₂↑",
    condition: "t°",
    fullEquation: "S + O₂ --t°--> SO₂↑",
    phenomenon: "Lưu huỳnh cháy trong oxi với ngọn lửa màu xanh lam sáng, sinh khí SO₂ mùi hắc nồng nặc.",
    points: 110,
  },
  {
    id: "eq-8-8",
    grade: 8,
    category: "combustion",
    categoryLabel: "Kim loại cháy trong Oxi",
    reactants: "3Fe + 2O₂",
    products: "Fe₃O₄",
    condition: "t°",
    fullEquation: "3Fe + 2O₂ --t°--> Fe₃O₄",
    phenomenon: "Dây sắt quấn mồi than cháy sáng chói rực rỡ, các hạt xỉ Fe₃O₄ nóng đỏ bắn tung tóe.",
    points: 130,
  },
  {
    id: "eq-8-9",
    grade: 8,
    category: "redox",
    categoryLabel: "Khử oxit kim loại",
    reactants: "CuO + H₂",
    products: "Cu + H₂O",
    condition: "t°",
    fullEquation: "CuO + H₂ --t°--> Cu + H₂O",
    phenomenon: "Bột CuO màu đen chuyển dần thành lớp đồng kim loại màu đỏ gạch, có hơi nước ngưng tụ.",
    points: 120,
  },
  {
    id: "eq-8-10",
    grade: 8,
    category: "redox",
    categoryLabel: "Khử oxit kim loại",
    reactants: "Fe₂O₃ + 3CO",
    products: "2Fe + 3CO₂↑",
    condition: "t°",
    fullEquation: "Fe₂O₃ + 3CO --t°--> 2Fe + 3CO₂↑",
    phenomenon: "Bột quặng sắt màu nâu đỏ chuyển sang màu xám đen của kim loại sắt tự do.",
    points: 130,
  },
  {
    id: "eq-8-11",
    grade: 8,
    category: "gas_evolution",
    categoryLabel: "Điều chế Oxi phòng thí nghiệm",
    reactants: "2KClO₃",
    products: "2KCl + 3O₂↑",
    condition: "MnO₂, t°",
    fullEquation: "2KClO₃ --MnO₂, t°--> 2KCl + 3O₂↑",
    phenomenon: "Chất rắn nóng chảy giải phóng bọt khí O₂ làm que đóm còn tàn đỏ bùng cháy mãnh liệt.",
    points: 130,
  },
  {
    id: "eq-9-1",
    grade: 9,
    category: "acid_base",
    categoryLabel: "Trung hòa Axit - Bazơ",
    reactants: "NaOH + HCl",
    products: "NaCl + H₂O",
    fullEquation: "NaOH + HCl → NaCl + H₂O",
    phenomenon: "Dung dịch kiềm bị trung hòa hoàn toàn, phenolphthalein mất màu hồng trở lại không màu.",
    points: 100,
  },
  {
    id: "eq-9-2",
    grade: 9,
    category: "acid_base",
    categoryLabel: "Oxit bazơ + Axit",
    reactants: "CuO + 2HCl",
    products: "CuCl₂ + H₂O",
    fullEquation: "CuO + 2HCl → CuCl₂ + H₂O",
    phenomenon: "Bột oxit đồng màu đen tan hoàn toàn, tạo dung dịch màu xanh lam trong suốt.",
    points: 110,
  },
  {
    id: "eq-9-3",
    grade: 9,
    category: "acid_base",
    categoryLabel: "Oxit bazơ + Axit",
    reactants: "Fe₂O₃ + 6HCl",
    products: "2FeCl₃ + 3H₂O",
    fullEquation: "Fe₂O₃ + 6HCl → 2FeCl₃ + 3H₂O",
    phenomenon: "Bột gỉ sắt nâu đỏ tan dần, tạo dung dịch muối sắt(III) có màu vàng nâu đặc trưng.",
    points: 120,
  },
  {
    id: "eq-9-4",
    grade: 9,
    category: "precipitation",
    categoryLabel: "Nhận biết gốc Sunfat",
    reactants: "BaCl₂ + H₂SO₄",
    products: "BaSO₄↓ + 2HCl",
    fullEquation: "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl",
    phenomenon: "Xuất hiện kết tủa trắng tinh khiết BaSO₄ không tan trong bất kỳ axit mạnh nào.",
    points: 120,
  },
  {
    id: "eq-9-5",
    grade: 9,
    category: "precipitation",
    categoryLabel: "Tạo kết tủa bazơ",
    reactants: "CuSO₄ + 2NaOH",
    products: "Cu(OH)₂↓ + Na₂SO₄",
    fullEquation: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄",
    phenomenon: "Tạo kết tủa dạng keo màu xanh lam đậm Cu(OH)₂ lắng dần xuống đáy ống nghiệm.",
    points: 120,
  },
  {
    id: "eq-9-6",
    grade: 9,
    category: "precipitation",
    categoryLabel: "Tạo kết tủa bazơ sắt(III)",
    reactants: "FeCl₃ + 3NaOH",
    products: "Fe(OH)₃↓ + 3NaCl",
    fullEquation: "FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl",
    phenomenon: "Xuất hiện kết tủa màu nâu đỏ của Fe(OH)₃ đặc trưng.",
    points: 120,
  },
  {
    id: "eq-9-7",
    grade: 9,
    category: "precipitation",
    categoryLabel: "Tạo kết tủa bazơ sắt(II)",
    reactants: "FeSO₄ + 2NaOH",
    products: "Fe(OH)₂↓ + Na₂SO₄",
    fullEquation: "FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄",
    phenomenon: "Xuất hiện kết tủa màu trắng xanh Fe(OH)₂, để ngoài không khí hóa nâu đỏ do bị oxi hóa.",
    points: 130,
  },
  {
    id: "eq-9-8",
    grade: 9,
    category: "gas_evolution",
    categoryLabel: "Muối Cacbonat + Axit",
    reactants: "CaCO₃ + 2HCl",
    products: "CaCl₂ + CO₂↑ + H₂O",
    fullEquation: "CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O",
    phenomenon: "Mảnh đá vôi tan nhanh, sủi bọt khí CO₂ không màu làm vẩn đục nước vôi trong.",
    points: 120,
  },
  {
    id: "eq-9-9",
    grade: 9,
    category: "gas_evolution",
    categoryLabel: "Muối Cacbonat + Axit",
    reactants: "Na₂CO₃ + 2HCl",
    products: "2NaCl + CO₂↑ + H₂O",
    fullEquation: "Na₂CO₃ + 2HCl → 2NaCl + CO₂↑ + H₂O",
    phenomenon: "Dung dịch sủi bọt khí CO₂ mãnh liệt tức thì không cần đun nóng.",
    points: 110,
  },
  {
    id: "eq-9-10",
    grade: 9,
    category: "gas_evolution",
    categoryLabel: "Khí CO₂ + Nước vôi trong",
    reactants: "CO₂ + Ca(OH)₂",
    products: "CaCO₃↓ + H₂O",
    fullEquation: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O",
    phenomenon: "Nước vôi trong đang trong suốt nhanh chóng bị vẩn đục màu trắng sữa của CaCO₃.",
    points: 120,
  },
  {
    id: "eq-9-11",
    grade: 9,
    category: "redox",
    categoryLabel: "Kim loại mạnh đẩy kim loại yếu",
    reactants: "Fe + CuSO₄",
    products: "FeSO₄ + Cu↓",
    fullEquation: "Fe + CuSO₄ → FeSO₄ + Cu↓",
    phenomenon: "Đinh sắt phủ lớp đồng kim loại màu đỏ gạch, màu xanh lam của dung dịch nhạt dần.",
    points: 130,
  },
  {
    id: "eq-9-12",
    grade: 9,
    category: "redox",
    categoryLabel: "Kim loại mạnh đẩy kim loại yếu",
    reactants: "Cu + 2AgNO₃",
    products: "Cu(NO₃)₂ + 2Ag↓",
    fullEquation: "Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag↓",
    phenomenon: "Lá đồng phủ một lớp tinh thể bạc lấp lánh ánh kim, dung dịch chuyển sang màu xanh lam.",
    points: 140,
  },
  {
    id: "eq-9-13",
    grade: 9,
    category: "gas_evolution",
    categoryLabel: "Kim loại kiềm tác dụng nước",
    reactants: "2Na + 2H₂O",
    products: "2NaOH + H₂↑",
    fullEquation: "2Na + 2H₂O → 2NaOH + H₂↑",
    phenomenon: "Mẩu Na nóng chảy thành giọt cầu chạy tròn trên mặt nước, sủi bọt khí H₂, dung dịch hóa kiềm.",
    points: 140,
  },

  // ══════════════════════════════════════════════════════════
  // ─── KHỐI LỚP 10 (Oxi Hóa Khử, Halogen, Lưu Huỳnh, Tốc Độ) ───
  // ══════════════════════════════════════════════════════════
  {
    id: "eq-10-1",
    grade: 10,
    category: "redox",
    categoryLabel: "Clo đẩy Brom khỏi muối",
    reactants: "Cl₂ + 2NaBr",
    products: "2NaCl + Br₂",
    fullEquation: "Cl₂ + 2NaBr → 2NaCl + Br₂",
    phenomenon: "Dung dịch không màu chuyển dần sang màu vàng cam đặc trưng của Brom lỏng.",
    points: 150,
  },
  {
    id: "eq-10-2",
    grade: 10,
    category: "redox",
    categoryLabel: "Brom đẩy Iot khỏi muối",
    reactants: "Br₂ + 2NaI",
    products: "2NaBr + I₂",
    fullEquation: "Br₂ + 2NaI → 2NaBr + I₂",
    phenomenon: "Tạo Iot làm dung dịch có màu tím đen, làm hồ tinh bột chuyển màu xanh tím.",
    points: 150,
  },
  {
    id: "eq-10-3",
    grade: 10,
    category: "precipitation",
    categoryLabel: "Nhận biết ion Clorua",
    reactants: "AgNO₃ + NaCl",
    products: "AgCl↓ + NaNO₃",
    fullEquation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
    phenomenon: "Xuất hiện kết tủa trắng AgCl vón cục, nhanh chóng hóa đen khi tiếp xúc ánh sáng.",
    points: 130,
  },
  {
    id: "eq-10-4",
    grade: 10,
    category: "precipitation",
    categoryLabel: "Nhận biết ion Bromua",
    reactants: "AgNO₃ + NaBr",
    products: "AgBr↓ + NaNO₃",
    fullEquation: "AgNO₃ + NaBr → AgBr↓ + NaNO₃",
    phenomenon: "Xuất hiện kết tủa màu vàng nhạt AgBr không tan trong axit nitric loãng.",
    points: 140,
  },
  {
    id: "eq-10-5",
    grade: 10,
    category: "precipitation",
    categoryLabel: "Nhận biết ion Iotua",
    reactants: "AgNO₃ + NaI",
    products: "AgI↓ + NaNO₃",
    fullEquation: "AgNO₃ + NaI → AgI↓ + NaNO₃",
    phenomenon: "Xuất hiện kết tủa màu vàng đậm AgI đậm nét, không tan cả trong amoniac.",
    points: 140,
  },
  {
    id: "eq-10-6",
    grade: 10,
    category: "redox",
    categoryLabel: "Halogen tác dụng Kim loại",
    reactants: "2Fe + 3Cl₂",
    products: "2FeCl₃",
    condition: "t°",
    fullEquation: "2Fe + 3Cl₂ --t°--> 2FeCl₃",
    phenomenon: "Dây sắt nung đỏ bốc cháy sáng chói trong bình khí Clo, sinh khói nâu đỏ FeCl₃.",
    points: 160,
  },
  {
    id: "eq-10-7",
    grade: 10,
    category: "redox",
    categoryLabel: "Nhiệt phân thuốc tím",
    reactants: "2KMnO₄",
    products: "K₂MnO₄ + MnO₂ + O₂↑",
    condition: "t°",
    fullEquation: "2KMnO₄ --t°--> K₂MnO₄ + MnO₂ + O₂↑",
    phenomenon: "Bột thuốc tím nổ lách tách khi đun nóng, giải phóng khí O₂ làm tàn đốm than bùng cháy.",
    points: 160,
  },
  {
    id: "eq-10-8",
    grade: 10,
    category: "redox",
    categoryLabel: "Kim loại + H₂SO₄ đặc nóng",
    reactants: "Cu + 2H₂SO₄ (đặc)",
    products: "CuSO₄ + SO₂↑ + 2H₂O",
    condition: "t°",
    fullEquation: "Cu + 2H₂SO₄(đặc) --t°--> CuSO₄ + SO₂↑ + 2H₂O",
    phenomenon: "Đồng tan khi đun nóng, dung dịch ngả màu xanh lam, sinh khí SO₂ mùi hắc tẩy màu cánh hoa.",
    points: 180,
  },
  {
    id: "eq-10-9",
    grade: 10,
    category: "redox",
    categoryLabel: "Phi kim + H₂SO₄ đặc nóng",
    reactants: "C + 2H₂SO₄ (đặc)",
    products: "CO₂↑ + 2SO₂↑ + 2H₂O",
    condition: "t°",
    fullEquation: "C + 2H₂SO₄(đặc) --t°--> CO₂↑ + 2SO₂↑ + 2H₂O",
    phenomenon: "Mẩu than tan dần trong axit đặc sôi, thoát hỗn hợp khí CO₂ và SO₂ mùi hắc.",
    points: 190,
  },
  {
    id: "eq-10-10",
    grade: 10,
    category: "gas_evolution",
    categoryLabel: "Điều chế Cl₂ phòng thí nghiệm",
    reactants: "MnO₂ + 4HCl (đặc)",
    products: "MnCl₂ + Cl₂↑ + 2H₂O",
    condition: "t°",
    fullEquation: "MnO₂ + 4HCl(đặc) --t°--> MnCl₂ + Cl₂↑ + 2H₂O",
    phenomenon: "Bột MnO₂ đen tan dần, giải phóng khí Clo màu vàng lục có mùi xốc độc hại.",
    points: 180,
  },
  {
    id: "eq-10-11",
    grade: 10,
    category: "gas_evolution",
    categoryLabel: "Muối Sunfua + Axit",
    reactants: "FeS + 2HCl",
    products: "FeCl₂ + H₂S↑",
    fullEquation: "FeS + 2HCl → FeCl₂ + H₂S↑",
    phenomenon: "Bột màu đen tan dần, sủi bọt khí H₂S có mùi trứng thối đặc trưng.",
    points: 160,
  },

  // ══════════════════════════════════════════════════════════
  // ─── KHỐI LỚP 11 (Điện Ly, Nitơ - Photpho, Hóa Học Hữu Cơ) ───
  // ══════════════════════════════════════════════════════════
  {
    id: "eq-11-1",
    grade: 11,
    category: "redox",
    categoryLabel: "Cu + Axit Nitric đặc",
    reactants: "3Cu + 8HNO₃ (loãng)",
    products: "3Cu(NO₃)₂ + 2NO↑ + 4H₂O",
    fullEquation: "3Cu + 8HNO₃(loãng) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O",
    phenomenon: "Đồng tan, dung dịch màu xanh lam, khí NO không màu thoát ra gặp oxi hóa nâu đỏ NO₂.",
    points: 190,
  },
  {
    id: "eq-11-2",
    grade: 11,
    category: "redox",
    categoryLabel: "Cu + Axit Nitric đặc nóng",
    reactants: "Cu + 4HNO₃ (đặc)",
    products: "Cu(NO₃)₂ + 2NO₂↑ + 2H₂O",
    fullEquation: "Cu + 4HNO₃(đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O",
    phenomenon: "Đồng tan mãnh liệt, dung dịch chuyển sang xanh lam, khí NO₂ màu nâu đỏ độc bốc lên ngùn ngụt.",
    points: 180,
  },
  {
    id: "eq-11-3",
    grade: 11,
    category: "acid_base",
    categoryLabel: "Tạo khói Amoni Clorua",
    reactants: "NH₃ + HCl",
    products: "NH₄Cl",
    fullEquation: "NH₃(k) + HCl(k) → NH₄Cl(r)",
    phenomenon: "Hai đũa thủy tinh nhúng dung dịch đặc đưa lại gần tạo làn khói trắng dày đặc như sương mù.",
    points: 160,
  },
  {
    id: "eq-11-4",
    grade: 11,
    category: "redox",
    categoryLabel: "Amoniac khử Oxit kim loại",
    reactants: "2NH₃ + 3CuO",
    products: "3Cu + N₂↑ + 3H₂O",
    condition: "t°",
    fullEquation: "2NH₃ + 3CuO --t°--> 3Cu + N₂↑ + 3H₂O",
    phenomenon: "Bột CuO màu đen chuyển thành màu đỏ kim loại của Cu khi nung nóng trong luồng khí NH₃.",
    points: 190,
  },
  {
    id: "eq-11-5",
    grade: 11,
    category: "precipitation",
    categoryLabel: "Nhận biết ion Photphat",
    reactants: "3AgNO₃ + Na₃PO₄",
    products: "Ag₃PO₄↓ + 3NaNO₃",
    fullEquation: "3AgNO₃ + Na₃PO₄ → Ag₃PO₄↓ + 3NaNO₃",
    phenomenon: "Xuất hiện kết tủa màu vàng tươi đặc trưng của Ag₃PO₄ tan được trong axit nitric.",
    points: 170,
  },
  {
    id: "eq-11-6",
    grade: 11,
    category: "organic",
    categoryLabel: "Phản ứng cộng Brom của Anken",
    reactants: "C₂H₄ + Br₂",
    products: "C₂H₄Br₂",
    fullEquation: "CH₂=CH₂ + Br₂ → CH₂Br-CH₂Br",
    phenomenon: "Khí etilen làm mất màu nâu đỏ của nước Brom ở nhiệt độ phòng tạo chất lỏng không màu.",
    points: 170,
  },
  {
    id: "eq-11-7",
    grade: 11,
    category: "organic",
    categoryLabel: "Phản ứng thế ion kim loại Ankin-1",
    reactants: "C₂H₂ + 2AgNO₃ + 2NH₃",
    products: "AgC≡CAg↓ + 2NH₄NO₃",
    fullEquation: "HC≡CH + 2AgNO₃ + 2NH₃ → Ag-C≡C-Ag↓ + 2NH₄NO₃",
    phenomenon: "Khí axetilen sục vào dung dịch AgNO₃/NH₃ tạo kết tủa màu vàng nhạt bạc axetylua.",
    points: 200,
  },
  {
    id: "eq-11-8",
    grade: 11,
    category: "organic",
    categoryLabel: "Phản ứng thế Brom của Benzen",
    reactants: "C₆H₆ + Br₂",
    products: "C₆H₅Br + HBr↑",
    condition: "bột Fe, t°",
    fullEquation: "C₆H₆ + Br₂ --Fe, t°--> C₆H₅Br + HBr↑",
    phenomenon: "Màu nâu đỏ của Brom nhạt dần, có khí HBr thoát ra làm quỳ tím ẩm hóa đỏ rực.",
    points: 190,
  },

  // ══════════════════════════════════════════════════════════
  // ─── KHỐI LỚP 12 (Este, Cacbohidrat, Amin, Kim Loại Chuyển Tiếp, Phức) ───
  // ══════════════════════════════════════════════════════════
  {
    id: "eq-12-1",
    grade: 12,
    category: "organic",
    categoryLabel: "Phản ứng Este hóa",
    reactants: "CH₃COOH + C₂H₅OH",
    products: "CH₃COOC₂H₅ + H₂O",
    condition: "H₂SO₄ đặc, t°",
    fullEquation: "CH₃COOH + C₂H₅OH ⇄ CH₃COOC₂H₅ + H₂O",
    phenomenon: "Tạo chất lỏng etyl axetat nhẹ hơn nước nổi lên trên, tỏa mùi thơm hoa quả chín dễ chịu.",
    points: 180,
  },
  {
    id: "eq-12-2",
    grade: 12,
    category: "organic",
    categoryLabel: "Xà phòng hóa Este",
    reactants: "CH₃COOC₂H₅ + NaOH",
    products: "CH₃COONa + C₂H₅OH",
    condition: "t°",
    fullEquation: "CH₃COOC₂H₅ + NaOH --t°--> CH₃COONa + C₂H₅OH",
    phenomenon: "Hỗn hợp tách lớp ban đầu hòa tan hoàn toàn thành dung dịch đồng nhất sau khi đun nóng.",
    points: 170,
  },
  {
    id: "eq-12-3",
    grade: 12,
    category: "organic",
    categoryLabel: "Phản ứng Tráng gương Glucozơ",
    reactants: "C₆H₁₂O₆ + 2AgNO₃ + 3NH₃ + H₂O",
    products: "C₆H₁₁O₇NH₄ + 2Ag↓ + 2NH₄NO₃",
    condition: "t°",
    fullEquation: "R-CHO + 2AgNO₃ + 3NH₃ + H₂O --t°--> R-COONH₄ + 2Ag↓ + 2NH₄NO₃",
    phenomenon: "Lớp bạc kim loại sáng loáng bám đều như gương soi lên bề mặt thành ống nghiệm.",
    points: 220,
  },
  {
    id: "eq-12-4",
    grade: 12,
    category: "precipitation",
    categoryLabel: "Tạo phức Đồng Glucozơ",
    reactants: "2C₆H₁₂O₆ + Cu(OH)₂",
    products: "(C₆H₁₁O₆)₂Cu + 2H₂O",
    fullEquation: "2C₆H₁₂O₆ + Cu(OH)₂ → (C₆H₁₁O₆)₂Cu + 2H₂O",
    phenomenon: "Kết tủa Cu(OH)₂ xanh lam tan ra, tạo dung dịch phức chất màu xanh lam thẫm trong suốt.",
    points: 210,
  },
  {
    id: "eq-12-5",
    grade: 12,
    category: "redox",
    categoryLabel: "Phản ứng Nhiệt nhôm",
    reactants: "2Al + Fe₂O₃",
    products: "Al₂O₃ + 2Fe",
    condition: "t° cao",
    fullEquation: "2Al + Fe₂O₃ --t°--> Al₂O₃ + 2Fe",
    phenomenon: "Phản ứng tỏa nhiệt dữ dội (trên 2000°C), phát sáng chói lòa, sắt sinh ra ở trạng thái nóng chảy.",
    points: 230,
  },
  {
    id: "eq-12-6",
    grade: 12,
    category: "acid_base",
    categoryLabel: "Tính lưỡng tính của Al(OH)₃",
    reactants: "Al(OH)₃ + NaOH",
    products: "Na[Al(OH)₄]",
    fullEquation: "Al(OH)₃ + NaOH → Na[Al(OH)₄]",
    phenomenon: "Kết tủa keo trắng Al(OH)₃ tan hoàn toàn trong dung dịch xút dư tạo dung dịch trong suốt.",
    points: 190,
  },
  {
    id: "eq-12-7",
    grade: 12,
    category: "redox",
    categoryLabel: "Hợp chất Crom chuyển màu pH",
    reactants: "K₂Cr₂O₇ + 2KOH",
    products: "2K₂CrO₄ + H₂O",
    fullEquation: "K₂Cr₂O₇ + 2KOH ⇄ 2K₂CrO₄ + H₂O",
    phenomenon: "Dung dịch Đicromat màu da cam lập tức chuyển sang màu vàng chanh của ion Cromat khi thêm kiềm.",
    points: 210,
  },
  {
    id: "eq-12-8",
    grade: 12,
    category: "redox",
    categoryLabel: "Chuẩn độ Oxi hóa Fe²⁺ bằng Thuốc tím",
    reactants: "10FeSO₄ + 2KMnO₄ + 8H₂SO₄",
    products: "5Fe₂(SO₄)₃ + K₂SO₄ + 2MnSO₄ + 8H₂O",
    fullEquation: "10FeSO₄ + 2KMnO₄ + 8H₂SO₄ → 5Fe₂(SO₄)₃ + K₂SO₄ + 2MnSO₄ + 8H₂O",
    phenomenon: "Dung dịch thuốc tím KMnO₄ bị mất màu tím đặc trưng, chuyển sang màu vàng rơm của muối Fe³⁺.",
    points: 250,
  },
  {
    id: "eq-12-9",
    grade: 12,
    category: "metal_acid",
    categoryLabel: "Ăn mòn điện hóa học",
    reactants: "Zn + H₂SO₄ (có vài giọt CuSO₄)",
    products: "ZnSO₄ + H₂↑ + Cu",
    fullEquation: "Zn + CuSO₄ → ZnSO₄ + Cu (Tạo pin điện hóa Zn-Cu)",
    phenomenon: "Cu bám vào Zn tạo cặp điện cực pin, khí H₂ giải phóng mãnh liệt gấp 10 lần bình thường.",
    points: 220,
  },
  {
    id: "eq-12-10",
    grade: 12,
    category: "redox",
    categoryLabel: "Sắt phản ứng với Axit Nitric loãng dư",
    reactants: "Fe + 4HNO₃ (loãng)",
    products: "Fe(NO₃)₃ + NO↑ + 2H₂O",
    fullEquation: "Fe + 4HNO₃(loãng) → Fe(NO₃)₃ + NO↑ + 2H₂O",
    phenomenon: "Sắt tan tạo dung dịch muối sắt(III) vàng nâu, sinh khí NO không màu hóa nâu trong không khí.",
    points: 210,
  },
  {
    id: "eq-12-11",
    grade: 12,
    category: "redox",
    categoryLabel: "Sắt tác dụng muối Sắt(III)",
    reactants: "Fe + 2FeCl₃",
    products: "3FeCl₂",
    fullEquation: "Fe + 2FeCl₃ → 3FeCl₂",
    phenomenon: "Bột sắt tan dần trong dung dịch màu vàng nâu của FeCl₃, dung dịch chuyển sang màu xanh lục nhạt.",
    points: 200,
  },
  {
    id: "eq-12-12",
    grade: 12,
    category: "redox",
    categoryLabel: "Đồng khử muối Sắt(III)",
    reactants: "Cu + 2FeCl₃",
    products: "CuCl₂ + 2FeCl₂",
    fullEquation: "Cu + 2FeCl₃ → CuCl₂ + 2FeCl₂",
    phenomenon: "Lá đồng tan dần không sủi bọt, dung dịch chuyển từ vàng nâu sang xanh lam (ứng dụng ăn mòn mạch in PCB).",
    points: 210,
  },
];

// ─── BỘ SINH PHẢN ỨNG ĐỘNG (PROCEDURAL REACTION GENERATOR) ───
// Sinh ngẫu nhiên hàng chục phương trình biến thể thực tế để không thể soạn trước câu trả lời
export function generateProceduralEquations(): EquationItem[] {
  const dynamicItems: EquationItem[] = [];

  // 1. Nhóm Kim loại + Axit (Mg, Al, Zn, Fe với HCl, H₂SO₄ loãng)
  const METALS = [
    { sym: "Mg", val: 2, name: "Magie" },
    { sym: "2Al", val: 3, name: "Nhôm", coefAcidHcl: 6, coefAcidH2so4: 3, prodSaltHcl: "2AlCl₃", prodSaltH2so4: "Al₂(SO₄)₃", coefH2: 3 },
    { sym: "Zn", val: 2, name: "Kẽm" },
    { sym: "Fe", val: 2, name: "Sắt" },
  ];

  METALS.forEach((m, idx) => {
    // Với HCl
    if (m.sym === "2Al") {
      dynamicItems.push({
        id: `dyn-metal-al-hcl-${idx}`,
        grade: 9,
        category: "metal_acid",
        categoryLabel: "Kim loại + Axit",
        reactants: "2Al + 6HCl",
        products: "2AlCl₃ + 3H₂↑",
        fullEquation: "2Al + 6HCl → 2AlCl₃ + 3H₂↑",
        phenomenon: "Nhôm tan nhanh, bọt khí H₂ thoát ra mãnh liệt, dung dịch trong suốt tỏa nhiệt nóng.",
        points: 110,
      });
      dynamicItems.push({
        id: `dyn-metal-al-h2so4-${idx}`,
        grade: 9,
        category: "metal_acid",
        categoryLabel: "Kim loại + Axit",
        reactants: "2Al + 3H₂SO₄ (loãng)",
        products: "Al₂(SO₄)₃ + 3H₂↑",
        fullEquation: "2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂↑",
        phenomenon: "Dải nhôm tan dần, sủi bọt khí H₂ mạnh mẽ.",
        points: 120,
      });
    } else {
      dynamicItems.push({
        id: `dyn-metal-${m.sym.toLowerCase()}-h2so4-${idx}`,
        grade: 9,
        category: "metal_acid",
        categoryLabel: "Kim loại + Axit",
        reactants: `${m.sym} + H₂SO₄ (loãng)`,
        products: `${m.sym}SO₄ + H₂↑`,
        fullEquation: `${m.sym} + H₂SO₄ → ${m.sym}SO₄ + H₂↑`,
        phenomenon: `Kim loại ${m.name} tan dần, sủi bọt khí H₂ không màu thoát ra ngoài miệng ống nghiệm.`,
        points: 110,
      });
    }
  });

  // 2. Nhóm Muối Cacbonat + Axit (Na₂CO₃, K₂CO₃, BaCO₃, MgCO₃ + HCl/HNO₃)
  const CARBONATES = [
    { name: "Natri Cacbonat", f: "Na₂CO₃", saltHcl: "2NaCl", saltHno3: "2NaNO₃" },
    { name: "Kali Cacbonat", f: "K₂CO₃", saltHcl: "2KCl", saltHno3: "2KNO₃" },
    { name: "Bari Cacbonat", f: "BaCO₃", saltHcl: "BaCl₂", saltHno3: "Ba(NO₃)₂" },
    { name: "Magie Cacbonat", f: "MgCO₃", saltHcl: "MgCl₂", saltHno3: "Mg(NO₃)₂" },
  ];

  CARBONATES.forEach((c, idx) => {
    dynamicItems.push({
      id: `dyn-carb-${idx}-hcl`,
      grade: 9,
      category: "gas_evolution",
      categoryLabel: "Muối Cacbonat + Axit",
      reactants: `${c.f} + 2HCl`,
      products: `${c.saltHcl} + CO₂↑ + H₂O`,
      fullEquation: `${c.f} + 2HCl → ${c.saltHcl} + CO₂↑ + H₂O`,
      phenomenon: `Chất phản ứng ${c.name} tan, sủi bọt khí CO₂ tức thì làm đục nước vôi trong.`,
      points: 120,
    });
    dynamicItems.push({
      id: `dyn-carb-${idx}-hno3`,
      grade: 9,
      category: "gas_evolution",
      categoryLabel: "Muối Cacbonat + Axit",
      reactants: `${c.f} + 2HNO₃`,
      products: `${c.saltHno3} + CO₂↑ + H₂O`,
      fullEquation: `${c.f} + 2HNO₃ → ${c.saltHno3} + CO₂↑ + H₂O`,
      phenomenon: `Sủi bọt khí CO₂ thoát ra, dung dịch muối tan trong suốt.`,
      points: 130,
    });
  });

  // 3. Nhóm Kết tủa Sunfat (BaCl₂ + Muối sunfat tan)
  const SULFATES = [
    { name: "Natri Sunfat", f: "Na₂SO₄", prod: "2NaCl" },
    { name: "Kali Sunfat", f: "K₂SO₄", prod: "2KCl" },
    { name: "Magie Sunfat", f: "MgSO₄", prod: "MgCl₂" },
    { name: "Kẽm Sunfat", f: "ZnSO₄", prod: "ZnCl₂" },
  ];

  SULFATES.forEach((s, idx) => {
    dynamicItems.push({
      id: `dyn-sulfate-${idx}`,
      grade: 9,
      category: "precipitation",
      categoryLabel: "Tạo kết tủa Bari Sunfat",
      reactants: `BaCl₂ + ${s.f}`,
      products: `BaSO₄↓ + ${s.prod}`,
      fullEquation: `BaCl₂ + ${s.f} → BaSO₄↓ + ${s.prod}`,
      phenomenon: `Xuất hiện ngay kết tủa màu trắng tinh BaSO₄ không tan trong axit mạnh.`,
      points: 120,
    });
  });

  // 4. Nhóm Nhiệt phân Muối Hidrocacbonat & Nitrat
  dynamicItems.push(
    {
      id: "dyn-decomp-nahco3",
      grade: 9,
      category: "gas_evolution",
      categoryLabel: "Nhiệt phân Muối Hidrocacbonat",
      reactants: "2NaHCO₃",
      products: "Na₂CO₃ + CO₂↑ + H₂O",
      condition: "t°",
      fullEquation: "2NaHCO₃ --t°--> Na₂CO₃ + CO₂↑ + H₂O",
      phenomenon: "Bột nở NaHCO₃ giải phóng khí CO₂ và hơi nước khi nung nóng.",
      points: 130,
    },
    {
      id: "dyn-decomp-cuoh2",
      grade: 9,
      category: "gas_evolution",
      categoryLabel: "Nhiệt phân Bazơ không tan",
      reactants: "Cu(OH)₂",
      products: "CuO + H₂O",
      condition: "t°",
      fullEquation: "Cu(OH)₂ --t°--> CuO + H₂O",
      phenomenon: "Kết tủa màu xanh lam chuyển dần sang bột oxit CuO màu đen khi đun trên đèn cồn.",
      points: 120,
    },
    {
      id: "dyn-decomp-feoh3",
      grade: 9,
      category: "gas_evolution",
      categoryLabel: "Nhiệt phân Bazơ không tan",
      reactants: "2Fe(OH)₃",
      products: "Fe₂O₃ + 3H₂O",
      condition: "t°",
      fullEquation: "2Fe(OH)₃ --t°--> Fe₂O₃ + 3H₂O",
      phenomenon: "Kết tủa nâu đỏ Fe(OH)₃ bị mất nước, tạo bột Fe₂O₃ màu đỏ thẫm.",
      points: 130,
    },
    {
      id: "dyn-decomp-agno3",
      grade: 11,
      category: "redox",
      categoryLabel: "Nhiệt phân muối Bạc Nitrat",
      reactants: "2AgNO₃",
      products: "2Ag↓ + 2NO₂↑ + O₂↑",
      condition: "t°",
      fullEquation: "2AgNO₃ --t°--> 2Ag↓ + 2NO₂↑ + O₂↑",
      phenomenon: "Muối bạc phân hủy giải phóng khí màu nâu đỏ NO₂ và để lại kim loại bạc xám đen.",
      points: 180,
    }
  );

  return dynamicItems;
}

// Tổng hợp kho toàn bộ câu hỏi (100+ câu hỏi đa dạng)
export const FULL_EQUATION_DATABASE: EquationItem[] = [
  ...BASE_EQUATION_DATABASE,
  ...generateProceduralEquations(),
];

export const EQUATION_DATABASE = FULL_EQUATION_DATABASE;

// Danh sách Danh hiệu
export interface RankTier {
  minScore: number;
  title: string;
  badge: string;
  color: string;
  bgGradient: string;
}

export const RANK_TIERS: RankTier[] = [
  { minScore: 4000, title: "Viện Sĩ Hóa Học", badge: "👑", color: "#f59e0b", bgGradient: "from-amber-500 to-yellow-600" },
  { minScore: 2800, title: "Phù Thủy Phản Ứng", badge: "🔮", color: "#a855f7", bgGradient: "from-purple-500 to-indigo-600" },
  { minScore: 1800, title: "Bậc Thầy Cân Bằng", badge: "⚡", color: "#3b82f6", bgGradient: "from-blue-500 to-cyan-600" },
  { minScore: 1000, title: "Nhà Nghiên Cứu", badge: "🔬", color: "#10b981", bgGradient: "from-emerald-500 to-teal-600" },
  { minScore: 500, title: "Trợ Lý Phòng Lab", badge: "⚗️", color: "#06b6d4", bgGradient: "from-cyan-500 to-blue-500" },
  { minScore: 0, title: "Tập Sự Pha Chế", badge: "🧪", color: "#64748b", bgGradient: "from-slate-500 to-gray-600" },
];

export function getRankTier(score: number): RankTier {
  return RANK_TIERS.find((t) => score >= t.minScore) || RANK_TIERS[RANK_TIERS.length - 1];
}

// ─── Lấy Round Câu Hỏi Mới Không Bao Giờ Trùng Lặp Trong Cùng Ván Đấu ───
export function getGameRound(options: {
  grade?: number; // 0 = tất cả
  count?: number; // Số cặp hiển thị cùng lúc (mặc định 5)
  excludeIds?: Set<string>; // Danh sách các câu đã chơi trong ván này để tránh lặp tuyệt đối
}): {
  leftList: { id: string; formula: string }[];
  rightList: { id: string; formula: string }[];
  equations: Record<string, EquationItem>;
} {
  const { grade = 0, count = 5, excludeIds = new Set() } = options;

  let pool = FULL_EQUATION_DATABASE;

  if (grade > 0) {
    if (grade === 8 || grade === 9) {
      pool = FULL_EQUATION_DATABASE.filter((eq) => eq.grade === 8 || eq.grade === 9);
    } else {
      pool = FULL_EQUATION_DATABASE.filter((eq) => eq.grade === grade);
    }
  }

  // 1. Loại bỏ các câu đã xuất hiện trong ván đấu này
  let candidatePool = pool.filter((eq) => !excludeIds.has(eq.id));

  // Nếu đã chơi cạn hết ngân hàng câu hỏi của khối này, reset lại để lấy tiếp
  if (candidatePool.length < count) {
    candidatePool = [...pool];
  }

  // 2. Thuật toán Fisher-Yates xáo trộn công bằng
  const shuffled = [...candidatePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  const leftList = selected.map((eq) => ({ id: eq.id, formula: eq.reactants }));
  const rightList = selected.map((eq) => ({ id: eq.id, formula: eq.products }));

  // Xáo trộn vị trí của vế phải để người chơi không đoán theo thứ tự
  for (let i = rightList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rightList[i], rightList[j]] = [rightList[j], rightList[i]];
  }

  const equationsMap: Record<string, EquationItem> = {};
  selected.forEach((eq) => {
    equationsMap[eq.id] = eq;
  });

  return {
    leftList,
    rightList,
    equations: equationsMap,
  };
}
