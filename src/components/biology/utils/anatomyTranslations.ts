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

// Bảng tra cứu chuyên biệt cho các cấu trúc đặc thù, các cơ quan và nhóm cơ hay gặp
export const SPECIAL_ANATOMY_DICT: Record<string, Partial<AnatomyDetailInfo>> = {
  // Nhóm cơ gian sườn (Intercostal Muscles)
  FMA9758: {
    viName: "Cơ gian sườn trong cùng",
    enName: "Innermost intercostal muscle",
    latinName: "Musculus intercostalis intimus",
    description: "Lớp cơ sâu nhất nằm giữa các xương sườn, cách biệt với lớp cơ gian sườn trong bởi bó mạch thần kinh gian sườn. Có vai trò hỗ trợ ổn định thành ngực và tham gia vào động tác thở ra gắng sức.",
  },
  FMA9757: {
    viName: "Cơ gian sườn trong",
    enName: "Internal intercostal muscle",
    latinName: "Musculus intercostalis internus",
    description: "Lớp cơ nằm ở giữa hai xương sườn, các thớ cơ chạy chếch xuống dưới và ra sau, giúp hạ xương sườn và co hẹp thể tích lồng ngực khi thở ra tích cực.",
  },
  FMA9756: {
    viName: "Cơ gian sườn ngoài",
    enName: "External intercostal muscle",
    latinName: "Musculus intercostalis externus",
    description: "Lớp cơ nông nhất nằm giữa các xương sườn, các thớ cơ chạy chếch xuống dưới và ra trước, có tác dụng nâng xương sườn lên để mở rộng khoang ngực khi hít vào.",
  },
  FMA9622: {
    viName: "Cơ ngực lớn",
    enName: "Pectoralis major muscle",
    latinName: "Musculus pectoralis major",
    description: "Khối cơ hình quạt dày khỏe phủ trọn phần ngực trên, có chức năng khép, xoay trong và gập cánh tay về phía trước ngực.",
  },
  FMA9623: {
    viName: "Cơ ngực bé",
    enName: "Pectoralis minor muscle",
    latinName: "Musculus pectoralis minor",
    description: "Cơ hình tam giác nằm dưới cơ ngực lớn, bám từ các xương sườn 3, 4, 5 tới mỏm quạ xương bả vai, giúp kéo xương vai xuống dưới và ra trước.",
  },
  FMA9624: {
    viName: "Cơ dưới đòn",
    enName: "Subclavius muscle",
    latinName: "Musculus subclavius",
    description: "Cơ nhỏ hình trụ nằm dưới xương đòn, bảo vệ đám rối cánh tay và mạch máu dưới đòn.",
  },
  FMA9625: {
    viName: "Cơ răng trước",
    enName: "Serratus anterior muscle",
    latinName: "Musculus serratus anterior",
    description: "Cơ dẹt hình răng cưa bám vào các xương sườn ở thành ngực bên, giữ chặt xương bả vai áp sát vào lồng ngực khi đẩy tay.",
  },
  FMA9626: {
    viName: "Cơ thẳng bụng (Cơ 6 múi)",
    enName: "Rectus abdominis muscle",
    latinName: "Musculus rectus abdominis",
    description: "Dải cơ dài thẳng đứng ở thành bụng trước được chia cắt bởi các chẽ gân ngang tạo nên các múi bụng, có tác dụng gập cột sống và nén ép các tạng bụng.",
  },
  FMA9627: {
    viName: "Cơ chéo bụng ngoài",
    enName: "External oblique muscle",
    latinName: "Musculus obliquus externus abdominis",
    description: "Lớp cơ rộng lớn nhất ở thành bụng bên, giúp xoay thân mình sang bên đối diện và gập cột sống.",
  },
  FMA9628: {
    viName: "Cơ chéo bụng trong",
    enName: "Internal oblique muscle",
    latinName: "Musculus obliquus internus abdominis",
    description: "Lớp cơ nằm dưới cơ chéo ngoài, giúp xoay thân mình cùng bên và tham gia nhịp thở ra gắng sức.",
  },
  FMA9629: {
    viName: "Cơ ngang bụng",
    enName: "Transversus abdominis muscle",
    latinName: "Musculus transversus abdominis",
    description: "Lớp cơ sâu nhất ở thành bụng với các sợi chạy ngang, đóng vai trò như chiếc đai nẹp tự nhiên bảo vệ cột sống và nâng đỡ các tạng.",
  },
  FMA37664: {
    viName: "Cơ nhị đầu cánh tay (Chuột tay)",
    enName: "Biceps brachii muscle",
    latinName: "Musculus biceps brachii",
    description: "Cơ hai đầu nằm ở mặt trước cánh tay, là cơ gập cẳng tay và ngửa bàn tay chủ yếu.",
  },
  FMA37688: {
    viName: "Cơ tam đầu cánh tay",
    enName: "Triceps brachii muscle",
    latinName: "Musculus triceps brachii",
    description: "Khối cơ ba đầu ở mặt sau cánh tay, là cơ duỗi cẳng tay mạnh nhất.",
  },
  FMA22357: {
    viName: "Cơ mông lớn",
    enName: "Gluteus maximus muscle",
    latinName: "Musculus gluteus maximus",
    description: "Khối cơ dày và khỏe nhất cơ thể người, giúp duỗi khớp háng và giữ vững tư thế đứng thẳng của con người.",
  },
  FMA22428: {
    viName: "Cơ tứ đầu đùi",
    enName: "Quadriceps femoris muscle",
    latinName: "Musculus quadriceps femoris",
    description: "Khối cơ khổng lồ gồm 4 phần ở mặt trước đùi (thẳng đùi, rộng ngoài, rộng trong, rộng giữa), là động cơ chính để duỗi cẳng chân khi đi, chạy, nhảy.",
  },

  // Cơ vận nhãn (Eye muscles)
  FMA49051: { viName: "Cơ chéo dưới mắt trái", enName: "Left inferior oblique muscle", description: "Cơ vận nhãn xoay nhãn cầu lên trên và ra ngoài." },
  FMA49050: { viName: "Cơ chéo dưới mắt phải", enName: "Right inferior oblique muscle", description: "Cơ vận nhãn xoay nhãn cầu lên trên và ra ngoài." },
  FMA49047: { viName: "Cơ thẳng dưới mắt trái", enName: "Left inferior rectus muscle", description: "Cơ vận nhãn kéo nhãn cầu nhìn xuống dưới." },
  FMA49046: { viName: "Cơ thẳng dưới mắt phải", enName: "Right inferior rectus muscle", description: "Cơ vận nhãn kéo nhãn cầu nhìn xuống dưới." },
  FMA49055: { viName: "Cơ thẳng ngoài mắt trái", enName: "Left lateral rectus muscle", description: "Cơ vận nhãn đưa mắt liếc ra ngoài." },
  FMA49054: { viName: "Cơ thẳng ngoài mắt phải", enName: "Right lateral rectus muscle", description: "Cơ vận nhãn đưa mắt liếc ra ngoài." },
  FMA49057: { viName: "Cơ thẳng trong mắt trái", enName: "Left medial rectus muscle", description: "Cơ vận nhãn đưa mắt liếc vào trong." },
  FMA49056: { viName: "Cơ thẳng trong mắt phải", enName: "Right medial rectus muscle", description: "Cơ vận nhãn đưa mắt liếc vào trong." },
  FMA49045: { viName: "Cơ thẳng trên mắt trái", enName: "Left superior rectus muscle", description: "Cơ vận nhãn kéo nhãn cầu nhìn lên trên." },
  FMA49044: { viName: "Cơ thẳng trên mắt phải", enName: "Right superior rectus muscle", description: "Cơ vận nhãn kéo nhãn cầu nhìn lên trên." },
  FMA49053: { viName: "Cơ chéo trên mắt trái", enName: "Left superior oblique muscle", description: "Cơ vận nhãn luồn qua ròng rọc xoay mắt xuống dưới và ra ngoài." },
  FMA49052: { viName: "Cơ chéo trên mắt phải", enName: "Right superior oblique muscle", description: "Cơ vận nhãn luồn qua ròng rọc xoay mắt xuống dưới và ra ngoài." },
  FMA49049: { viName: "Cơ nâng mi trên mắt trái", enName: "Left levator palpebrae superioris", description: "Cơ mở mắt chính ở mi trên." },
  FMA49048: { viName: "Cơ nâng mi trên mắt phải", enName: "Right levator palpebrae superioris", description: "Cơ mở mắt chính ở mi trên." },

  // Các tạng chính
  FMA14643: {
    viName: "Mạc treo ruột non",
    enName: "Mesentery of small intestine",
    latinName: "Mesenterium intestini tenuis",
    description: "Mạc treo ruột non neo giữ và nâng đỡ toàn bộ các quai ruột non vào thành sau ổ bụng, chứa hệ thống động mạch - tĩnh mạch mạc treo tràng trên và hạch bạch huyết.",
  },
  FJ3396: {
    viName: "Mạc treo ruột non",
    enName: "Mesentery of small intestine",
    latinName: "Mesenterium intestini tenuis",
    description: "Mạc treo ruột non neo giữ các quai ruột non vào thành sau ổ bụng, đưa dưỡng chất về gan qua tĩnh mạch cửa.",
  },
  FMA14656: {
    viName: "Mạc nối lớn",
    enName: "Greater omentum",
    latinName: "Omentum majus",
    description: "Nếp phúc mạc lớn phủ như chiếc tạp dề từ bờ cong lớn dạ dày rủ xuống phía trước các quai ruột non, chứa nhiều mô mỡ và đại thực bào bảo vệ ổ bụng.",
  },
  FMA14657: {
    viName: "Mạc nối nhỏ",
    enName: "Lesser omentum",
    latinName: "Omentum minus",
    description: "Nếp phúc mạc nối liền bờ cong nhỏ dạ dày và tá tràng với rốn gan, chứa cuống gan.",
  },
  FMA7148: {
    viName: "Dạ dày",
    enName: "Stomach",
    latinName: "Gaster / Ventriculus",
    description: "Túi cơ rỗng nhào trộn thức ăn với dịch vị chứa acid HCl và enzyme pepsin để bắt đầu tiêu hóa protein.",
  },
  FMA7197: {
    viName: "Gan",
    enName: "Liver",
    latinName: "Hepar",
    description: "Tuyến tiêu hóa lớn nhất cơ thể, đảm nhiệm hơn 500 chức năng sống bao gồm chuyển hóa đường, dự trữ năng lượng, giải độc, tổng hợp protein huyết tương và tiết dịch mật.",
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
    description: "Tuyến pha vừa ngoại tiết enzyme tiêu hóa, vừa nội tiết Insulin và Glucagon điều hòa đường huyết.",
  },
  FMA7206: {
    viName: "Ruột non",
    enName: "Small intestine",
    latinName: "Intestinum tenue",
    description: "Đoạn dài nhất của ống tiêu hóa gồm tá tràng, hỗng tràng và hồi tràng, nơi diễn ra phần lớn quá trình tiêu hóa hóa học và hấp thu chất dinh dưỡng vào máu.",
  },
  FMA7207: {
    viName: "Đại tràng (Ruột già)",
    enName: "Large intestine (Colon)",
    latinName: "Intestinum crassum",
    description: "Đoạn cuối của ống tiêu hóa hấp thu nước, điện giải và lên men chất xơ tạo khuôn phân.",
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
    description: "Khoang cơ tim dày nhất, chịu trách nhiệm co bóp tạo áp lực tống máu giàu oxy vào động mạch chủ đi nuôi toàn bộ cơ thể.",
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

// Từ điển từ vựng giải phẫu chuyên ngành chuẩn
const ANATOMY_TERM_TRANSLATIONS: [RegExp, string][] = [
  // Cụm từ chuyên biệt
  [/\binnermost intercostal\b/gi, "gian sườn trong cùng"],
  [/\binternal intercostal\b/gi, "gian sườn trong"],
  [/\bexternal intercostal\b/gi, "gian sườn ngoài"],
  [/\bintercostal\b/gi, "gian sườn"],
  [/\bsubcostal\b/gi, "dưới sườn"],
  [/\bpectoralis major\b/gi, "ngực lớn"],
  [/\bpectoralis minor\b/gi, "ngực bé"],
  [/\brectus abdominis\b/gi, "thẳng bụng"],
  [/\bexternal oblique\b/gi, "chéo bụng ngoài"],
  [/\binternal oblique\b/gi, "chéo bụng trong"],
  [/\btransversus abdominis\b/gi, "ngang bụng"],
  [/\bbiceps brachii\b/gi, "nhị đầu cánh tay"],
  [/\btriceps brachii\b/gi, "tam đầu cánh tay"],
  [/\bbiceps femoris\b/gi, "nhị đầu đùi"],
  [/\bquadriceps femoris\b/gi, "tứ đầu đùi"],
  [/\blatissimus dorsi\b/gi, "lưng rộng"],
  [/\bgluteus maximus\b/gi, "mông lớn"],
  [/\bgluteus medius\b/gi, "mông nhỡ"],
  [/\bgluteus minimus\b/gi, "mông bé"],
  [/\bsternocleidomastoid\b/gi, "ức đòn chũm"],
  [/\blevator scapulae\b/gi, "nâng vai"],
  [/\brhomboid major\b/gi, "trám lớn"],
  [/\brhomboid minor\b/gi, "trám bé"],
  [/\bteres major\b/gi, "tròn lớn"],
  [/\bteres minor\b/gi, "tròn bé"],
  [/\bsupraspinatus\b/gi, "trên gai"],
  [/\binfraspinatus\b/gi, "dưới gai"],
  [/\bsubscapularis\b/gi, "dưới vai"],
  [/\bbrachioradialis\b/gi, "cánh tay quay"],
  [/\bpronator teres\b/gi, "sấp tròn"],
  [/\bpronator quadratus\b/gi, "sấp vuông"],
  [/\bsemitendinosus\b/gi, "bán gân"],
  [/\bsemimembranosus\b/gi, "bán màng"],
  [/\bvastus lateralis\b/gi, "rộng ngoài"],
  [/\bvastus medialis\b/gi, "rộng trong"],
  [/\bvastus intermedius\b/gi, "rộng giữa"],
  [/\bgastrocnemius\b/gi, "bụng chân"],
  [/\bsoleus\b/gi, "dép"],
  [/\btibialis anterior\b/gi, "chày trước"],
  [/\btibialis posterior\b/gi, "chày sau"],
  [/\bperoneus longus\b|\bfibularis longus\b/gi, "mác dài"],
  [/\bperoneus brevis\b|\bfibularis brevis\b/gi, "mác ngắn"],
  [/\bextensor digitorum\b/gi, "duỗi các ngón"],
  [/\bflexor digitorum\b/gi, "gấp các ngón"],
  [/\bextensor hallucis\b/gi, "duỗi ngón cái chân"],
  [/\bflexor hallucis\b/gi, "gấp ngón cái chân"],
  [/\bextensor pollicis\b/gi, "duỗi ngón cái tay"],
  [/\bflexor pollicis\b/gi, "gấp ngón cái tay"],
  [/\babductor pollicis\b/gi, "dạng ngón cái"],
  [/\badductor pollicis\b/gi, "khép ngón cái"],
  [/\babductor digiti minimi\b/gi, "dạng ngón út"],
  [/\bflexor digiti minimi\b/gi, "gấp ngón út"],
  [/\bextensor digiti minimi\b/gi, "duỗi ngón út"],
  [/\blumbrical\b/gi, "giun"],
  [/\binterosseous\b|\binterossei\b/gi, "gian cốt"],
  [/\bplantar\b/gi, "gan chân"],
  [/\bpalmar\b/gi, "gan tay"],
  [/\bdorsal\b/gi, "mu"],
  [/\bserratus anterior\b/gi, "răng trước"],
  [/\bserratus posterior\b/gi, "răng sau"],
  [/\bpectoralis\b/gi, "ngực"],
  [/\bdeltoid\b/gi, "delta"],
  [/\btrapezius\b/gi, "thang"],
  [/\bdiaphragm\b/gi, "hoành"],
  [/\bsartorius\b/gi, "may"],
  [/\bgracilis\b/gi, "thon"],
  [/\bpectineus\b/gi, "lược"],
  [/\bpiriformis\b/gi, "hình lê"],
  [/\bobturator\b/gi, "bịt"],
  [/\bgemellus\b/gi, "sinh đôi"],
  [/\bquadratus\b/gi, "vuông"],
  [/\bpopliteus\b/gi, "kheo"],
  [/\banconeus\b/gi, "khuỷu"],
  [/\bsupinator\b/gi, "ngửa"],
  [/\bpronator\b/gi, "sấp"],
  [/\bcoracobrachialis\b/gi, "quạ cánh tay"],
  [/\bbrachialis\b/gi, "cánh tay"],
  [/\borbicularis oculi\b/gi, "vòng mi mắt"],
  [/\borbicularis oris\b/gi, "vòng miệng"],
  [/\bmasseter\b/gi, "cắn"],
  [/\btemporalis\b/gi, "thái dương"],
  [/\bzygomaticus\b/gi, "gò má"],
  [/\bbuccinator\b/gi, "mút"],
  [/\bplatysma\b/gi, "bám da cổ"],
  [/\bhyoid\b/gi, "xương móng"],

  // Nhánh & Cây đường mật, mạch máu, thần kinh
  [/\bcaudate lobe\b/gi, "thùy đuôi"],
  [/\bquadrate lobe\b/gi, "thùy vuông"],
  [/\bbiliary tree\b/gi, "đường mật"],
  [/\bbiliary duct\b/gi, "ống mật"],
  [/\bbile duct\b/gi, "ống mật chủ"],
  [/\bhepatic\b/gi, "gan"],
  [/\bcoronary\b/gi, "vành"],
  [/\bbrachiocephalic\b/gi, "tay đầu"],
  [/\bsubclavian\b/gi, "dưới đòn"],
  [/\bcarotid\b/gi, "cảnh"],
  [/\bjugular\b/gi, "cảnh"],
  [/\bfemoral\b/gi, "đùi"],
  [/\bbrachial\b/gi, "cánh tay"],
  [/\bradial\b/gi, "quay"],
  [/\bulnar\b/gi, "trụ"],
  [/\biliac\b/gi, "chậu"],
  [/\brenal\b/gi, "thận"],
  [/\bmesenteric\b/gi, "mạc treo"],
  [/\bceliac\b/gi, "thân tạng"],
  [/\bpulmonary\b/gi, "phổi"],
  [/\bsciatic\b/gi, "tọa (hông to)"],
  [/\bmedian\b/gi, "giữa"],
  [/\bvagus\b/gi, "phế vị (dây X)"],
  [/\bphrenic\b/gi, "hoành"],
  [/\btributary\b/gi, "nhánh"],
  [/\bbranch\b/gi, "nhánh"],
  [/\btrunk\b/gi, "thân"],
  [/\bplexus\b/gi, "đám rối"],
  [/\bcavity\b/gi, "khoang"],
  [/\bvalvule\b/gi, "van nhỏ"],
  [/\bvalve\b/gi, "van"],
  [/\barch\b/gi, "quai"],
  [/\bsegmental\b/gi, "phân thùy"],
  [/\bbronchial\b/gi, "phế quản"],
  [/\bapical\b/gi, "đỉnh"],
  [/\bbasal\b/gi, "đáy"],

  // Xương khớp
  [/\bfemur\b/gi, "xương đùi"],
  [/\btibia\b/gi, "xương chày"],
  [/\bfibula\b/gi, "xương mác"],
  [/\bhumerus\b/gi, "xương cánh tay"],
  [/\bradius\b/gi, "xương quay"],
  [/\bulna\b/gi, "xương trụ"],
  [/\bclavicle\b/gi, "xương đòn"],
  [/\bscapula\b/gi, "xương bả vai"],
  [/\bsternum\b/gi, "xương ức"],
  [/\brib\b/gi, "xương sườn"],
  [/\bvertebra\b/gi, "đốt sống"],
  [/\bpelvis\b/gi, "xương chậu"],
  [/\bsacrum\b/gi, "xương cùng"],
  [/\bcoccyx\b/gi, "xương cụt"],
  [/\bpatella\b/gi, "xương bánh chè"],
  [/\bcarpal\b/gi, "xương cổ tay"],
  [/\btarsal\b/gi, "xương cổ chân"],
  [/\bmetacarpal\b/gi, "xương đốt bàn tay"],
  [/\bmetatarsal\b/gi, "xương đốt bàn chân"],
  [/\bphalanx\b/gi, "đốt ngón"],
  [/\bcranium\b/gi, "hộp sọ"],
  [/\bskull\b/gi, "xương sọ"],

  // Các danh từ bộ phận
  [/\btrachea\b/gi, "khí quản"],
  [/\besophagus\b/gi, "thực quản"],
  [/\blarynx\b/gi, "thanh quản"],
  [/\bpharynx\b/gi, "hầu"],
  [/\blung\b/gi, "phổi"],
  [/\bheart\b/gi, "tim"],
  [/\bstomach\b/gi, "dạ dày"],
  [/\bliver\b/gi, "gan"],
  [/\bpancreas\b/gi, "tụy"],
  [/\bspleen\b/gi, "lách"],
  [/\bkidney\b/gi, "thận"],
  [/\bureter\b/gi, "niệu quản"],
  [/\bbladder\b/gi, "bàng quang"],
  [/\burethra\b/gi, "niệu đạo"],
  [/\bduodenum\b/gi, "tá tràng"],
  [/\bjejunum\b/gi, "hỗng tràng"],
  [/\bileum\b/gi, "hồi tràng"],
  [/\bcolon\b/gi, "đại tràng"],
  [/\bcecum\b/gi, "manh tràng"],
  [/\bappendix\b/gi, "ruột thừa"],
  [/\brectum\b/gi, "trực tràng"],
  [/\bgallbladder\b/gi, "túi mật"],
  [/\bbrain\b/gi, "não bộ"],
  [/\bcerebrum\b/gi, "đại não"],
  [/\bcerebellum\b/gi, "tiểu não"],
  [/\bspinal cord\b/gi, "tủy sống"],
  [/\bfoot\b/gi, "bàn chân"],
  [/\bhand\b/gi, "bàn tay"],
  [/\bfinger\b/gi, "ngón tay"],
  [/\btoe\b/gi, "ngón chân"],

  // Tính từ vị trí, thứ tự & hướng
  [/\bfirst\b/gi, "thứ nhất"],
  [/\bsecond\b/gi, "thứ hai"],
  [/\bthird\b/gi, "thứ ba"],
  [/\bfourth\b/gi, "thứ tư"],
  [/\bfifth\b/gi, "thứ năm"],
  [/\bsixth\b/gi, "thứ sáu"],
  [/\bseventh\b/gi, "thứ bảy"],
  [/\beighth\b/gi, "thứ tám"],
  [/\bninth\b/gi, "thứ chín"],
  [/\btenth\b/gi, "thứ mười"],
  [/\beventh\b/gi, "thứ mười một"],
  [/\btwelfth\b/gi, "thứ mười hai"],
  [/\bsuperior\b/gi, "trên"],
  [/\binferior\b/gi, "dưới"],
  [/\banterior\b/gi, "trước"],
  [/\bposterior\b/gi, "sau"],
  [/\bmedial\b/gi, "trong"],
  [/\blateral\b/gi, "ngoài"],
  [/\bproximal\b/gi, "gần"],
  [/\bdistal\b/gi, "xa"],
  [/\bexternal\b/gi, "ngoài"],
  [/\binternal\b/gi, "trong"],
  [/\bdeep\b/gi, "sâu"],
  [/\bsuperficial\b/gi, "nông"],
  [/\bmajor\b/gi, "lớn"],
  [/\bminor\b/gi, "bé"],
  [/\blongus\b/gi, "dài"],
  [/\bbrevis\b/gi, "ngắn"],
  [/\bof\b/gi, "của"],
  [/\bset\b/gi, "nhóm"],
  [/\bpart\b/gi, "phần"],
];

/**
 * Dịch thuật danh pháp giải phẫu tiếng Anh sang tiếng Việt chuẩn Y khoa với cấu trúc ngữ pháp đảo chuẩn
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

  // 2. Nhận diện loại cấu trúc giải phẫu chính (Tiền tố danh từ tiếng Việt)
  let prefix = "";
  let cleanName = rawName.trim();
  const lower = cleanName.toLowerCase();

  // Nhận diện cơ bắp (muscle hoặc các tên cơ đặc trưng)
  const isMuscle =
    /\bmuscle\b/i.test(cleanName) ||
    /\b(oblique|rectus|lumbrical|interosseous|interossei|abductor|adductor|flexor|extensor|levator|depressor|serratus|scalene|biceps|triceps|quadriceps|gluteus|gastrocnemius|soleus|trapezius|deltoid|pectoralis|sartorius|gracilis|piriformis|intercostal)\b/i.test(cleanName);

  if (isMuscle) {
    prefix = "Cơ ";
    cleanName = cleanName.replace(/\bmuscles?\b/gi, "");
  } else if (/\bartery\b/i.test(cleanName)) {
    prefix = "Động mạch ";
    cleanName = cleanName.replace(/\barter(y|ies)\b/gi, "");
  } else if (/\bvein\b/i.test(cleanName)) {
    prefix = "Tĩnh mạch ";
    cleanName = cleanName.replace(/\bveins?\b/gi, "");
  } else if (/\bnerve\b/i.test(cleanName)) {
    prefix = "Dây thần kinh ";
    cleanName = cleanName.replace(/\bnerves?\b/gi, "");
  } else if (/\bbone\b/i.test(cleanName)) {
    prefix = "Xương ";
    cleanName = cleanName.replace(/\bbones?\b/gi, "");
  } else if (/\bligament\b/i.test(cleanName)) {
    prefix = "Dây chằng ";
    cleanName = cleanName.replace(/\bligaments?\b/gi, "");
  } else if (/\bcartilage\b/i.test(cleanName)) {
    prefix = "Sụn ";
    cleanName = cleanName.replace(/\bcartilages?\b/gi, "");
  } else if (/\btendon\b/i.test(cleanName)) {
    prefix = "Gân ";
    cleanName = cleanName.replace(/\btendons?\b/gi, "");
  } else if (/\bfascia\b/i.test(cleanName)) {
    prefix = "Cân mạc ";
    cleanName = cleanName.replace(/\bfascias?\b/gi, "");
  }

  // Nhận diện bên trái / phải để chuyển về cuối tên tiếng Việt
  let sideSuffix = "";
  if (/\bleft\b/i.test(cleanName)) {
    sideSuffix = " trái";
    cleanName = cleanName.replace(/\bleft\b/gi, "");
  } else if (/\bright\b/i.test(cleanName)) {
    sideSuffix = " phải";
    cleanName = cleanName.replace(/\bright\b/gi, "");
  }

  // 3. Dịch các thành phần từ vựng chuyên ngành
  let translated = cleanName;
  for (const [pattern, viWord] of ANATOMY_TERM_TRANSLATIONS) {
    translated = translated.replace(pattern, viWord);
  }

  // Loại bỏ các từ dư thừa
  translated = translated.replace(/\bcủa\b/gi, " ");
  translated = translated.replace(/\s+/g, " ").trim();

  // Ghép cấu trúc chuẩn: [Tiền tố loại giải phẫu] + [Tên bộ phận đã dịch] + [Bên trái/phải]
  let result = (prefix + translated + sideSuffix).replace(/\s+/g, " ").trim();

  // Chuẩn hóa viết hoa chữ cái đầu tiên
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  const defaultDesc = `Cấu trúc giải phẫu học chính thức thuộc hệ cơ quan của cơ thể người, liên kết và phối hợp sinh lý chặt chẽ với các mô xung quanh.`;

  return {
    viName: result || rawName,
    enName: rawName,
    description: defaultDesc,
  };
}
