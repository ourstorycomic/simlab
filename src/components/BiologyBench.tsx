"use client";

import React, { useState } from "react";
import ModelViewer, { HotspotData } from "./ModelViewer";

interface Organ {
    id: string;
    name: string;
    file: string;
    description: string;
    function: string;
    systems: string[];
    hotspots?: HotspotData[];
}

const ORGANS: Organ[] = [
    {
        id: "brain",
        name: "Não bộ",
        file: "/models/brain.glb",
        description: "Bộ não là trung tâm chỉ huy phức tạp nhất của cơ thể con người, chứa khoảng 86 tỷ tế bào thần kinh (neuron) kết nối với nhau qua hàng nghìn tỷ khớp thần kinh (synapse). Nó trôi nổi trong dịch não tủy và được bảo vệ nghiêm ngặt bởi hộp sọ cứng cáp.",
        function: "Xử lý hàng triệu tín hiệu mỗi giây, kiểm soát mọi hoạt động từ nhịp tim, nhịp thở vô thức cho đến các tư duy logic, trí nhớ, ngôn ngữ và cảm xúc bậc cao của con người.",
        systems: ["Hệ thần kinh trung ương"],
        hotspots: [
            { id: "frontal", label: "Thùy trán", description: "Thùy trán (Frontal Lobe) là phần lớn nhất của não bộ, chiếm khoảng một phần ba bán cầu não, nằm ngay sau trán.\n\nĐây là 'trung tâm điều hành' tối cao của con người, đóng vai trò chủ đạo trong việc ra quyết định, lập kế hoạch phức tạp, giải quyết vấn đề và tư duy logic.\n\nNó cũng chứa Vỏ não vận động chính (kiểm soát các cử động cơ bắp tự chủ) và vùng Broca (chịu trách nhiệm sản sinh ngôn ngữ). Các tổn thương ở thùy trán có thể làm thay đổi hoàn toàn tính cách, hành vi xã hội và làm mất khả năng phán đoán của một người.", position: [-0.7, 0.65, 0.8] },
            { id: "parietal", label: "Thùy đỉnh", description: "Thùy đỉnh (Parietal Lobe) nằm ở gần đỉnh đầu, ngay phía sau thùy trán.\n\nKhu vực này chịu trách nhiệm tích hợp các thông tin cảm giác từ nhiều giác quan khác nhau, đặc biệt là cảm giác về không gian và điều hướng (Proprioception). Nơi đây chứa Vỏ não cảm giác chính, giúp bạn cảm nhận được các kích thích xúc giác như nóng, lạnh, đau đớn và áp lực từ da.\n\nNhờ thùy đỉnh, bạn có thể nhắm mắt lại mà vẫn xác định được vị trí các bộ phận trên cơ thể mình đang ở đâu trong không gian.", position: [0.15, 1.1, 0.65] },
            { id: "temporal", label: "Thùy thái dương", description: "Thùy thái dương (Temporal Lobe) nằm ở hai bên bán cầu não, ngang vị trí hai bên tai.\n\nTrung tâm xử lý thính giác chính nằm ở đây, giúp chúng ta nghe và phân tích được các âm thanh, giọng nói. Vùng Wernicke nằm ở thùy thái dương trái đóng vai trò sống còn trong việc hiểu ngôn ngữ.\n\nBên cạnh đó, sâu bên trong thùy thái dương là Hồi hải mã (Hippocampus) - cấu trúc quan trọng nhất để chuyển hóa ký ức ngắn hạn thành ký ức dài hạn. Bệnh Alzheimer thường bắt đầu phá hủy các tế bào thần kinh ở khu vực này đầu tiên.", position: [0.75, -0.1, 0.82] },
            { id: "cerebellum", label: "Tiểu não", description: "Tiểu não (Cerebellum), có nghĩa là 'não nhỏ' trong tiếng Latin, nằm cuộn tròn ở phía sau và dưới cùng của não bộ. Mặc dù chỉ chiếm 10% thể tích não, nó chứa hơn 50% tổng số tế bào thần kinh.\n\nTiểu não không tự khởi xướng các chuyển động, nhưng nó nhận tín hiệu vận động từ thùy trán và liên tục tinh chỉnh chúng. Nó giúp chúng ta giữ thăng bằng, phối hợp các động tác cơ bắp một cách nhịp nhàng, trơn tru và chính xác đến từng milimet.\n\nKhi bạn học đi xe đạp, bơi lội hay chơi piano, tiểu não chính là nơi ghi nhớ các phản xạ cơ bắp 'tự động' này.", position: [0.72, -0.9, 0.55] }
        ]
    },
    {
        id: "heart",
        name: "Trái tim",
        file: "/models/heart.glb",
        description: "Trái tim là một khối cơ rỗng đặc biệt (cơ tim), kích thước bằng khoảng một nắm tay, nằm hơi lệch về bên trái của lồng ngực. Nó gồm 4 buồng (2 tâm nhĩ, 2 tâm thất) với hệ thống van tim phức tạp giúp máu lưu thông theo một chiều duy nhất.",
        function: "Hoạt động như một cỗ máy bơm vĩnh cửu, đập khoảng 100.000 lần mỗi ngày để luân chuyển 5-6 lít máu đi nuôi dưỡng toàn bộ các tế bào trong cơ thể.",
        systems: ["Hệ tuần hoàn"],
        hotspots: [
            { id: "aorta", label: "Động mạch chủ", description: "Động mạch chủ (Aorta) là ống dẫn máu lớn nhất trong cơ thể con người, có hình dáng như một cây gậy ba toong cong vòng lên trên tâm thất trái.\n\nNhiệm vụ của nó là tiếp nhận toàn bộ lượng máu giàu oxy vừa được tâm thất trái bơm ra dưới áp lực cực kỳ lớn, sau đó phân phối máu này đến tất cả các động mạch nhỏ hơn để nuôi dưỡng toàn bộ cơ thể (trừ phổi).\n\nThành của động mạch chủ rất dày và có tính đàn hồi cao, giúp nó giãn nở trong mỗi nhịp tim đập và co lại để duy trì huyết áp khi tim nghỉ ngơi.", position: [-0.35, 1.65, 0.55] },
            { id: "left-atrium", label: "Tâm nhĩ trái", description: "Tâm nhĩ trái (Left Atrium) là buồng tim nằm ở phía trên, bên trái.\n\nNó hoạt động như một khoang chứa, liên tục tiếp nhận dòng máu đỏ tươi, dồi dào oxy vừa được trao đổi khí từ tĩnh mạch phổi đổ về. Khi tâm nhĩ trái co bóp, nó sẽ mở van hai lá để đẩy toàn bộ lượng máu này xuống buồng tâm thất trái bên dưới.\n\nThành của tâm nhĩ mỏng hơn tâm thất rất nhiều vì nó chỉ cần bơm máu qua một khoảng cách rất ngắn (xuống buồng tim ngay dưới nó).", position: [0.82, 0.65, 0.5] },
            { id: "right-atrium", label: "Tâm nhĩ phải", description: "Tâm nhĩ phải (Right Atrium) là buồng tim nằm ở phía trên, bên phải.\n\nBuồng tim này liên tục tiếp nhận máu đỏ thẫm (đã bị các cơ quan lấy hết oxy và thải ra nhiều CO2) đổ về từ hệ tĩnh mạch chủ trên và dưới.\n\nNơi đây còn chứa Nút xoang (SA node) - được ví như 'máy tạo nhịp tim tự nhiên' của cơ thể. Nút xoang phát ra các xung điện đều đặn, lan truyền khắp cơ tim và kích hoạt các nhịp đập liên tục của trái tim suốt cuộc đời.", position: [-0.9, 0.35, 0.55] },
            { id: "left-ventricle", label: "Tâm thất trái", description: "Tâm thất trái (Left Ventricle) là buồng tim lớn nhất, khỏe nhất và quan trọng nhất.\n\nThành cơ của tâm thất trái dày gấp 3 lần tâm thất phải vì nó phải tạo ra một lực đẩy khổng lồ để tống lượng máu giàu oxy đi qua động mạch chủ, luân chuyển đến điểm xa nhất của cơ thể (như ngón chân, đỉnh đầu).\n\nHuyết áp mà chúng ta thường đo chính là áp lực do sự co bóp mạnh mẽ của tâm thất trái tạo ra lên thành mạch máu.", position: [0.7, -0.75, 0.65] },
            { id: "right-ventricle", label: "Tâm thất phải", description: "Tâm thất phải (Right Ventricle) là buồng tim nằm ở phía dưới, bên phải.\n\nNhiệm vụ duy nhất của nó là nhận máu nghèo oxy từ tâm nhĩ phải, sau đó bơm lượng máu này qua động mạch phổi để đi lên hai lá phổi.\n\nÁp lực bơm của tâm thất phải thấp hơn nhiều so với tâm thất trái, vì đoạn đường từ tim lên phổi rất ngắn và hệ mao mạch phổi rất mỏng manh, không thể chịu được áp lực cao.", position: [-0.65, -0.68, 0.66] },
            { id: "apex", label: "Mỏm tim", description: "Mỏm tim (Apex) là điểm thấp nhất và nhọn nhất của trái tim, hướng xuống dưới, ra trước và chếch sang trái.\n\nNó được tạo thành hoàn toàn bởi đỉnh của tâm thất trái. Đây là vị trí mà trái tim nằm gần thành ngực nhất. Do đó, khi bạn đặt tay lên ngực trái hoặc bác sĩ dùng ống nghe, vị trí mỏm tim chính là nơi nghe được nhịp tim đập rõ ràng và mạnh mẽ nhất.\n\nTrong mỗi nhịp co bóp tống máu đi, mỏm tim sẽ nảy lên và đập nhẹ vào thành lồng ngực tạo thành 'mỏm đập'.", position: [0.18, -1.35, 0.48] }
        ]
    },
    {
        id: "lungs",
        name: "Phổi",
        file: "/models/lungs.glb",
        description: "Phổi là cơ quan hô hấp dạng bọt xốp, đàn hồi, chiếm phần lớn không gian lồng ngực. Bên trong phổi là mạng lưới phế quản phân nhánh như rễ cây, kết thúc tại hàng triệu phế nang nhỏ li ti bao bọc bởi mao mạch máu.",
        function: "Nơi diễn ra quá trình trao đổi khí sinh tồn: oxy (O2) từ không khí được khuếch tán vào máu, và carbon dioxide (CO2) từ máu được thải ra ngoài qua từng nhịp thở.",
        systems: ["Hệ hô hấp"],
        hotspots: [
            { id: "trachea", label: "Khí quản", description: "Khí quản (Trachea) là một ống dẫn khí hình trụ dài khoảng 10-12cm, nằm ngay trước thực quản.\n\nNó được cấu tạo bởi 16 đến 20 vòng sụn hình chữ C. Các vòng sụn này hoạt động như một bộ khung cứng cáp giúp ống khí quản luôn mở rộng, không bị xẹp xuống khi áp suất thay đổi lúc hít thở.\n\nMặt trong của khí quản được bao phủ bởi hàng triệu lông mao li ti. Các lông mao này chuyển động liên tục hướng lên trên như một chiếc thang cuốn sinh học, đẩy chất nhầy chứa bụi bẩn và vi khuẩn ra khỏi phổi để bảo vệ đường hô hấp.", position: [0, 1.6, 0.2] },
            { id: "right-lung", label: "Phổi phải", description: "Phổi phải (Right Lung) có kích thước lớn hơn, nặng hơn và rộng hơn so với phổi trái.\n\nNó được chia làm 3 thùy riêng biệt: thùy trên, thùy giữa và thùy dưới thông qua các rãnh liên thùy. Sự phân chia này giúp phổi linh hoạt hơn khi nở rộng và co lại trong không gian giới hạn của lồng ngực.\n\nMặc dù lớn hơn, phổi phải lại ngắn hơn phổi trái một chút vì nó phải nhường một phần không gian phía dưới cho khối gan khổng lồ đẩy vòm hoành phải lên cao.", position: [-1.2, 0.1, 0.7] },
            { id: "left-lung", label: "Phổi trái", description: "Phổi trái (Left Lung) chỉ có 2 thùy (thùy trên và thùy dưới) và có thể tích nhỏ hơn phổi phải khoảng 10%.\n\nSự cắt giảm kích thước này là một sự thiết kế kỳ diệu của tự nhiên nhằm tạo ra 'Hố tim' (Cardiac notch) - một khoang lõm sâu ở bờ trong của phổi trái.\n\nHố tim này chính là không gian hoàn hảo để ôm trọn và bảo vệ phần đỉnh (mỏm tim) của trái tim nằm lệch về bên trái lồng ngực.", position: [1.2, 0.1, 0.7] },
            { id: "bronchus", label: "Phế quản", description: "Phế quản (Bronchi) là nơi khí quản chia nhánh làm hai (phế quản gốc phải và trái) để dẫn không khí trực tiếp đi sâu vào bên trong từng lá phổi.\n\nSau khi đi vào phổi, phế quản liên tục phân chia thành các nhánh nhỏ hơn (tiểu phế quản), tạo thành một cấu trúc gọi là 'Cây phế quản'.\n\nỞ tận cùng của các nhánh nhỏ nhất này là hơn 300 triệu phế nang - những túi khí siêu nhỏ nơi thực sự diễn ra phép màu trao đổi Oxy và CO2 với hệ mao mạch máu.", position: [-0.03, 0.3, 0.35] },
            { id: "base", label: "Đáy phổi", description: "Đáy phổi (Base) là phần dưới cùng, rộng nhất của mỗi lá phổi, có hình dạng hơi lõm.\n\nĐáy phổi nằm tựa sát lên bề mặt cong của Cơ hoành (Diaphragm) - cơ quan cơ bắp hình dù chịu trách nhiệm chính cho quá trình hít thở.\n\nKhi cơ hoành co lại và phẳng xuống, nó kéo toàn bộ đáy phổi xuống dưới, làm tăng thể tích lồng ngực, tạo ra áp suất âm hút không khí từ bên ngoài tràn vào lấp đầy các phế nang.", position: [-1.14, -1.2, 1] }
        ]
    },
    {
        id: "kidneys",
        name: "Thận",
        file: "/models/kidneys.glb",
        description: "Hai quả thận có hình hạt đậu, nằm đối xứng ở vùng thắt lưng. Dù kích thước bằng nắm tay, mỗi quả thận chứa đến hơn 1 triệu bộ lọc vi mô (nephron) hoạt động không ngừng nghỉ ngày đêm.",
        function: "Lọc các chất độc hại, urê và lượng nước dư thừa từ dòng máu để tạo thành nước tiểu. Thận cũng điều hòa huyết áp và kích thích sản sinh hồng cầu.",
        systems: ["Hệ bài tiết"],
        hotspots: [
            { id: "cortex", label: "Vỏ thận", description: "Vỏ thận (Renal Cortex) là lớp ngoài cùng, có màu đỏ sẫm do tập trung một lượng lớn mạch máu.\n\nĐây là nơi làm việc chính của thận, chứa hầu hết các Cuộn mao mạch (Cầu thận - Glomerulus). Máu chảy qua các mao mạch siêu nhỏ này dưới áp lực cao, ép nước, urê, muối và các chất độc hại thấm qua màng lọc.\n\nMỗi ngày, vỏ thận lọc tới 180 lít chất lỏng từ máu, nhưng 99% lượng nước đó sẽ được tái hấp thu trở lại cơ thể ở các giai đoạn sau.", position: [-0.9, 0.55, 0.7] },
            { id: "medulla", label: "Tủy thận", description: "Tủy thận (Renal Medulla) là lớp bên trong, chứa từ 8 đến 18 cấu trúc hình nón gọi là Tháp thận.\n\nTủy thận không thực hiện việc lọc ban đầu mà làm nhiệm vụ cô đặc nước tiểu. Nó chứa hệ thống 'Ống góp' và vòng Henle hoạt động như những chiếc máy bơm hút ngược nước và các khoáng chất cần thiết (như Natri, Kali) từ dịch lọc trả lại vào máu.\n\nNhờ sự cô đặc này, từ 180 lít dịch lọc ban đầu, cơ thể chỉ thải ra ngoài khoảng 1.5 đến 2 lít nước tiểu mỗi ngày, giúp chúng ta không bị mất nước tử vong.", position: [0.85, 0.2, 0.7] },
            { id: "ureter", label: "Niệu quản", description: "Niệu quản (Ureter) là hai đường ống nhỏ (dài khoảng 25-30cm) nối từ đài bể thận xuống bàng quang.\n\nKhác với tưởng tượng của nhiều người, nước tiểu không chảy xuống bàng quang nhờ trọng lực. Thành của niệu quản được cấu tạo bằng các lớp cơ trơn mọc đan chéo.\n\nCứ mỗi 10 đến 15 giây, các cơ này lại tạo ra một làn sóng co bóp (nhu động) mạnh mẽ để chủ động vắt và đẩy từng tia nước tiểu xuống bàng quang, bất kể cơ thể bạn đang đứng hay đang lộn ngược.", position: [0.4, -1.1, 0.5] }
        ]
    },
    {
        id: "liver",
        name: "Gan",
        file: "/models/liver.glb",
        description: "Gan là cơ quan nội tạng đặc lớn nhất cơ thể, nặng khoảng 1.5kg, nằm ở hạ sườn phải. Gan là cơ quan duy nhất có khả năng tự tái tạo kỳ diệu ngay cả khi bị cắt bỏ đi 70% thể tích.",
        function: "Được ví như 'nhà máy hóa chất' của cơ thể: tiết dịch mật tiêu hóa mỡ, dự trữ năng lượng, tổng hợp protein máu và khử độc tố (cồn, thuốc).",
        systems: ["Hệ tiêu hóa", "Hệ nội tiết"],
        hotspots: [
            { id: "right-lobe", label: "Thùy phải", description: "Thùy phải (Right Lobe) là thùy lớn nhất của gan, chiếm khoảng 5/6 tổng khối lượng của toàn bộ lá gan.\n\nNó chứa hàng tỷ tế bào gan (hepatocyte) làm việc như các nhà máy hóa chất siêu việt. Thùy phải dự trữ một lượng lớn Glycogen - nhiên liệu dự phòng sẽ được nhanh chóng phân giải thành Glucose bơm vào máu mỗi khi bạn đói lả.\n\nBên dưới thùy phải là nơi tọa lạc của túi mật - cơ quan nhỏ lưu trữ dịch mật do gan sản xuất ra.", position: [-0.75, 0.35, 0.75] },
            { id: "left-lobe", label: "Thùy trái", description: "Thùy trái (Left Lobe) nhỏ hơn, mỏng hơn và phẳng hơn so với thùy phải.\n\nNó kéo dài vượt qua đường giữa của ổ bụng, ôm sát lấy một phần của dạ dày. Cũng giống như thùy phải, nó nhận máu chứa đầy dưỡng chất (và cả độc tố) từ ruột đổ về.\n\nCác tế bào Kupffer (đại thực bào) dồi dào trong gan sẽ không ngừng 'tuần tra' các mạch máu ở đây để 'nuốt chửng' vi khuẩn, hồng cầu già cỗi và vô hiệu hóa các phân tử độc hại (như rượu cồn, paracetamol) trước khi chúng kịp đi vào hệ tuần hoàn chung.", position: [0.85, 0.25, 0.75] },
            { id: "portal", label: "Tĩnh mạch cửa", description: "Tĩnh mạch cửa (Portal Vein) là một trong những mạch máu kỳ lạ và quan trọng nhất của cơ thể con người.\n\nThông thường tĩnh mạch mang máu sạch từ cơ quan về tim. Nhưng Tĩnh mạch cửa lại mang 100% dòng máu vừa rời khỏi hệ tiêu hóa (ruột non, ruột già, dạ dày, lách) - mang theo tất cả thức ăn vừa tiêu hóa được - đổ TRỰC TIẾP vào gan.\n\nNhờ cơ chế 'trạm thu phí' này, gan có thể kiểm duyệt và xử lý toàn bộ dưỡng chất, lọc bỏ mọi chất độc mà bạn ăn phải trước khi cho phép dòng máu này quay trở lại tim để đi nuôi cơ thể.", position: [0.1, -0.3, 0.82] }
        ]
    },
    {
        id: "intestine",
        name: "Hệ đường ruột",
        file: "/models/intestine.glb",
        description: "Hệ đường ruột là một ống cơ dài cuộn khúc chằng chịt trong ổ bụng. Ruột non cực dài (6-7m) với hàng triệu lông mao siêu nhỏ. Ruột già (đại tràng) ngắn hơn nhưng lớn hơn, bao bọc quanh ruột non như một khung hình vuông.",
        function: "Ruột non là nơi diễn ra 90% quá trình tiêu hóa và hấp thụ các dưỡng chất, vitamin vào máu. Ruột già tái hấp thu lượng nước còn lại và tạo khuôn phân để đào thải.",
        systems: ["Hệ tiêu hóa"],
        hotspots: [
            { id: "duodenum", label: "Tá tràng", description: "Tá tràng (Duodenum) là đoạn đầu tiên, ngắn nhất (khoảng 25cm) nhưng quan trọng nhất của ruột non, có hình chữ C ôm lấy đầu tuyến tụy.\n\nĐây là chiến trường tiêu hóa khốc liệt nhất: Hỗn hợp nhũ trấp chứa đầy axit từ dạ dày trút xuống đây sẽ được trung hòa ngay lập tức bởi dịch kiềm mạnh từ tuyến tụy.\n\nĐồng thời, dịch mật từ gan cũng được bơm vào tá tràng để 'đánh tan' các cục mỡ thành hạt nhỏ liti, giúp các enzyme tiêu hóa dễ dàng phá vỡ cấu trúc thức ăn thành axit amin và glucose.", position: [0.6, 0.8, 0.75] },
            { id: "jejunum", label: "Hỗng tràng", description: "Hỗng tràng (Jejunum) là phần giữa của ruột non, dài khoảng 2.5 mét.\n\nLớp lót bên trong của nó không hề bằng phẳng mà được tạo thành từ hàng triệu nếp gấp và lông mao (Villi) hình ngón tay siêu nhỏ. Nếu trải phẳng toàn bộ bề mặt này ra, nó có diện tích xấp xỉ một sân tennis!\n\nDiện tích khổng lồ này giúp tối đa hóa khả năng hút cạn kiệt các phân tử dinh dưỡng, vitamin và khoáng chất đã được phân giải, đưa chúng ngấm thẳng trực tiếp qua thành ruột vào hệ mao mạch máu.", position: [-0.45, 0.1, 0.82] },
            { id: "colon", label: "Đại tràng", description: "Đại tràng (Colon), hay còn gọi là ruột già, là đoạn cuối cùng của hệ tiêu hóa dài khoảng 1.5 mét.\n\nNhiệm vụ của nó không còn là tiêu hóa thức ăn, mà là tái hấp thu nước. Hỗn hợp lỏng lẻo từ ruột non đổ xuống đây sẽ bị hút cạn nước để từ từ đóng khuôn thành phân cứng.\n\nĐại tràng cũng là 'khu rừng nhiệt đới' sinh học chứa hàng nghìn tỷ vi khuẩn cộng sinh (Hệ vi sinh vật đường ruột). Chúng ăn các chất xơ mà con người không tiêu hóa được, sinh ra khí gas và tổng hợp các loại Vitamin thiết yếu (như Vitamin K, B12) cho cơ thể.", position: [0.75, -0.55, 0.72] }
        ]
    },
    {
        id: "pancreas",
        name: "Tuyến tụy",
        file: "/models/pancreas.glb",
        description: "Tuyến tụy là một cơ quan mềm, hình lá, dài khoảng 15cm, nằm vắt ngang ổ bụng, ẩn sâu phía sau dạ dày. Nó kết nối trực tiếp với khúc đầu của ruột qua một ống dẫn chung.",
        function: "Đóng vai trò 'kép': Chức năng ngoại tiết (tiết ra các enzyme cực mạnh để phân giải thức ăn) và nội tiết (tiết insulin và glucagon vào máu để điều hòa lượng đường).",
        systems: ["Hệ tiêu hóa", "Hệ nội tiết"],
        hotspots: [
            { id: "head", label: "Đầu tụy", description: "Đầu tụy (Head) là phần to nhất và mở rộng nhất của tuyến tụy, nằm nép gọn gàng bên trong đường cong chữ C của đoạn tá tràng (ruột non).\n\nĐây là ngã tư giao thông cực kỳ quan trọng. Ống mật chủ từ gan và ống tụy chính đều hội tụ tại khu vực đầu tụy trước khi cùng đổ chung các dịch tiêu hóa quyền lực vào tá tràng để xử lý thức ăn.\n\nDo vị trí nhạy cảm này, các khối u hay viêm nhiễm ở đầu tụy thường dễ gây ra tình trạng tắc nghẽn ống mật, dẫn đến hiện tượng vàng da, vàng mắt.", position: [-1.32, -0.36, 0.55] },
            { id: "body", label: "Thân tụy", description: "Thân tụy (Body) là phần thuôn dài vắt ngang qua cột sống và động mạch chủ để tiến về bên trái ổ bụng.\n\nPhần thân này chứa một lượng khổng lồ các Nang tuyến (Acini) làm nhiệm vụ Ngoại tiết. Mỗi ngày, chúng sản xuất ra hơn 1 lít 'nước tụy' - một loại cocktail chứa các enzyme tiêu hóa cực mạnh (Amylase, Lipase, Protease) có khả năng làm tan chảy tinh bột, mỡ và thịt động vật.\n\nĐể tự bảo vệ mình không bị chính các enzyme này 'tiêu hóa', tụy chỉ tiết ra enzyme dưới dạng tiền chất bất hoạt, chúng chỉ được kích hoạt khi đã an toàn đi vào ruột non.", position: [0.05, 0.25, 0.45] },
            { id: "tail", label: "Đuôi tụy", description: "Đuôi tụy (Tail) là đoạn chóp hẹp nhất, kéo dài tới tận rốn lách ở góc trên bên trái của ổ bụng.\n\nTại khu vực đuôi tụy này tập trung mật độ cao nhất của các Tiểu đảo Langerhans - các cụm tế bào thần kỳ làm nhiệm vụ Nội tiết.\n\nCác tế bào Beta tại đây liên tục đo lường lượng đường (Glucose) trong máu. Ngay khi bạn ăn đồ ngọt, chúng sẽ lập tức giải phóng hormone Insulin thẳng vào máu. Insulin như một chiếc 'chìa khóa' mở cửa cho tất cả các tế bào trên cơ thể hấp thụ đường, giúp hạ đường huyết xuống mức an toàn. Thiếu hụt Insulin sẽ dẫn đến căn bệnh Tiểu đường.", position: [1.55, 0.3, 0.35] },
            { id: "duct", label: "Ống tụy", description: "Ống tụy (Pancreatic Duct), hay ống Wirsung, là đường hầm chính chạy dọc xuyên suốt chiều dài của tuyến tụy từ đuôi đến đầu.\n\nNó hoạt động như một hệ thống cống ngầm, thu thập toàn bộ men tiêu hóa từ hàng triệu nang tụy nhỏ lẻ. Gần đến tá tràng, ống tụy thường hợp nhất với ống mật chủ tạo thành một bóng phình (bóng Vater) có van đóng mở.\n\nKhi có thức ăn mỡ đi vào ruột non, các tín hiệu thần kinh sẽ ra lệnh mở van này, tống hàng loạt dịch tụy và dịch mật xuống để nghiền nát bữa ăn của bạn.", position: [-0.61, 0.39, 0.5] }
        ]
    },
    {
        id: "eyeball",
        name: "Nhãn cầu (Mắt)",
        file: "/models/eyeball.glb",
        description: "Con mắt là một kỳ quan tiến hóa sinh học, hoạt động như một cỗ máy ảnh độ phân giải siêu cao. Nó được cấu tạo từ 3 lớp áo màng (củng mạc, mạch mạc, võng mạc) và hệ thống thấu kính hội tụ ánh sáng hoàn hảo.",
        function: "Thu nhận photon ánh sáng, điều chỉnh tiêu cự liên tục, và chuyển hóa quang năng thành các xung điện thần kinh để não bộ tạo ra hình ảnh 3D có ý nghĩa.",
        systems: ["Hệ giác quan", "Hệ thần kinh"],
        hotspots: [
            { id: "cornea", label: "Giác mạc", description: "Giác mạc (Cornea) là lớp màng kính cong, hoàn toàn trong suốt bao bọc phía ngoài cùng của lòng đen.\n\nKhác với lăng kính (thủy tinh thể) nằm bên trong, giác mạc mới thực sự là thấu kính mạnh nhất của mắt, đóng góp đến 70% sức mạnh hội tụ ánh sáng.\n\nĐiều kỳ lạ là giác mạc không hề có mạch máu để đảm bảo độ trong suốt tuyệt đối. Nó sống sót bằng cách hấp thụ oxy trực tiếp từ không khí bên ngoài và nhận dinh dưỡng từ nước mắt. Khi bạn phẫu thuật mổ cận Lasik, bác sĩ chính là đang gọt dũa lại độ cong của lớp giác mạc này.", position: [-0.94, 0.05, 1.47] },
            { id: "iris", label: "Mống mắt", description: "Mống mắt (Iris) là phần có màu sắc rực rỡ của mắt (nâu, xanh lam, xanh lá), hoạt động chính xác như cơ chế khẩu độ của một chiếc máy ảnh.\n\nMống mắt được cấu tạo bởi hai bộ cơ vòng cực kỳ nhạy cảm. Ở trung tâm mống mắt có một lỗ hổng gọi là Đồng tử (Con ngươi). Khi ra ngoài trời nắng gắt, mống mắt sẽ co lại làm đồng tử nhỏ xíu như đầu kim để bảo vệ võng mạc khỏi bị cháy sáng.\n\nNgược lại, khi bạn đi vào phòng tối, mống mắt lập tức giãn rộng tối đa để thu nhận từng tia sáng yếu ớt nhất, giúp bạn nhìn thấy đường đi.", position: [-1.22, -0.53, 1.15] },
            { id: "optic", label: "Dây thần kinh thị giác", description: "Dây thần kinh thị giác (Optic Nerve) là bó 'cáp quang sinh học' khổng lồ nằm ở phía sau nhãn cầu, chứa khoảng 1.2 triệu sợi trục thần kinh.\n\nSau khi võng mạc chuyển đổi ánh sáng thành tín hiệu điện, dây thần kinh thị giác có nhiệm vụ truyền tải dữ liệu hình ảnh băng thông rộng này về Thùy chẩm ở phía sau não bộ với tốc độ chớp nhoáng.\n\nTại vị trí dây thần kinh này cắm vào võng mạc, hoàn toàn không có tế bào cảm quang nào tồn tại. Đó chính là lý do tạo ra 'Điểm mù' tự nhiên trên mắt người mà bộ não của chúng ta phải liên tục tự 'photoshop' cắt ghép hình ảnh để che đi.", position: [1.61, -0.18, 0.54] }
        ]
    },
    {
        id: "skin",
        name: "Da",
        file: "/models/skin.glb",
        description: "Da không chỉ là lớp vỏ ngoài mà là một 'cơ quan' đúng nghĩa, lớn nhất và nặng nhất cơ thể (chiếm tới 16% trọng lượng). Nó tái tạo liên tục và thay mới hoàn toàn sau mỗi 28 ngày.",
        function: "Bức tường thành vững chắc chống lại vi khuẩn và tia UV. Da điều hòa thân nhiệt (qua mồ hôi và mạch máu), tổng hợp Vitamin D và chứa hàng triệu cảm biến xúc giác.",
        systems: ["Hệ vỏ bọc", "Hệ bài tiết"],
        hotspots: [
            { id: "epidermis", label: "Lớp biểu bì", description: "Lớp biểu bì (Epidermis) là lớp phòng thủ ngoài cùng, mỏng như tờ giấy nhưng cực kỳ bền chắc.\n\nNó được cấu tạo từ nhiều lớp tế bào sừng xếp chồng lên nhau như áo giáp vảy. Hàng ngày, hàng triệu tế bào da chết trên cùng bị bong tróc đi, và được thay thế bằng các tế bào mới liên tục đẩy lên từ lớp đáy.\n\nBiểu bì cũng chứa tế bào Melanocyte sản sinh hắc tố Melanin. Melanin hoạt động như một chiếc 'ô dù siêu nhỏ' bung ra để hấp thụ và bảo vệ lõi DNA của tế bào khỏi sự tàn phá của tia cực tím (UV) từ mặt trời, quy định nên màu da của bạn.", position: [-0.05, 0.88, 1.4] },
            { id: "dermis", label: "Lớp hạ bì", description: "Lớp hạ bì (Dermis) là lớp lõi dày và sống động nhất của làn da.\n\nĐây là nơi tập trung các sợi Collagen và Elastin đan chéo nhau, cung cấp độ đàn hồi và độ căng mịn cho da (sự đứt gãy các sợi này theo thời gian chính là nguyên nhân tạo ra nếp nhăn).\n\nHạ bì chứa hệ thống mao mạch máu chằng chịt giúp điều hòa thân nhiệt: khi nóng mạch máu giãn ra để tản nhiệt, khi lạnh chúng co lại để giữ ấm. Nó cũng là nơi sinh sống của các tuyến mồ hôi, tuyến bã nhờn và hàng triệu thụ thể thần kinh xúc giác giúp bạn cảm nhận sự mơn trớn hay đau đớn.", position: [0.29, 0.05, 1.4] },
            { id: "hypodermis", label: "Mô dưới da", description: "Mô dưới da (Hypodermis), hay lớp hạ bì sâu, chủ yếu được cấu tạo từ các mô mỡ và mô liên kết lỏng lẻo.\n\nNó hoạt động như một lớp đệm nhún êm ái bảo vệ xương và các cơ quan nội tạng bên trong khỏi các lực va đập cơ học từ môi trường bên ngoài.\n\nLớp mỡ này còn là kho dự trữ năng lượng khổng lồ và là một lớp áo khoác cách nhiệt tuyệt vời, ngăn chặn cơ thể mất nhiệt vào mùa đông. Mạng lưới mạch máu lớn và dây thần kinh chính cũng đi qua lớp này trước khi phân nhánh lên lớp hạ bì nông hơn.", position: [-0.39, -1.15, 1.4] },
            { id: "follicle", label: "Nang lông", description: "Nang lông (Hair Follicle) là những hốc nhỏ hình ống xuyên sâu từ lớp biểu bì xuống tận lớp hạ bì.\n\nTại đáy nang lông là nhú bì, nơi các tế bào phân chia cực kỳ mạnh mẽ để xây dựng nên cấu trúc sợi lông/tóc bằng chất sừng (Keratin) đẩy trồi lên bề mặt da.\n\nMỗi nang lông đều được liên kết với một Tuyến bã nhờn (tiết dầu làm mượt lông và chống thấm nước cho da) và một Cơ dựng lông. Khi bạn bị lạnh hoặc hoảng sợ, cơ này sẽ co rút mạnh, kéo đứng sợi lông lên, gây ra hiện tượng 'nổi da gà' điển hình của loài thú.", position: [0.89, -0.44, 1.4] }
        ]
    }
];

export default function BiologyBench() {
    const [selectedOrganId, setSelectedOrganId] = useState<string>(ORGANS[0].id);
    const [activeHotspotInfo, setActiveHotspotInfo] = useState<HotspotData | null>(null);
    
    const selectedOrgan = ORGANS.find(o => o.id === selectedOrganId) || ORGANS[0];

    const handleOrganSelect = (id: string) => {
        setSelectedOrganId(id);
        setActiveHotspotInfo(null);
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-[#f8fafc] dark:bg-[#0a0e17] text-gray-800 dark:text-gray-100 transition-colors duration-300">
            {/* Sidebar: Organ List */}
            <div id="tour-bio-sidebar" className="w-full md:w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur z-10">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                        Mô hình Giải phẫu
                    </h2>
                </div>
                <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                    {ORGANS.map((organ) => {
                        const isSelected = organ.id === selectedOrganId;
                        return (
                            <button
                                key={organ.id}
                                onClick={() => handleOrganSelect(organ.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium border flex items-center justify-between group ${
                                    isSelected 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-400 shadow-sm" 
                                    : "bg-transparent border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                                {organ.name}
                                {isSelected && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Area: 3D Viewer & Info */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-hidden">
                {/* 3D Canvas */}
                <div id="tour-bio-viewer" className="flex-1 min-h-[400px] lg:min-h-0 bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col relative">
                    <ModelViewer 
                        modelUrl={selectedOrgan.file} 
                        hotspots={selectedOrgan.hotspots}
                        onHotspotClick={(hotspot) => setActiveHotspotInfo(hotspot)}
                    />
                </div>

                {/* Info Panel */}
                <div id="tour-bio-info" className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{selectedOrgan.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedOrgan.systems.map(sys => (
                                    <span key={sys} className="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold rounded-lg border border-blue-100 dark:border-blue-800">
                                        {sys}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {/* General Info vs Hotspot Info */}
                            {!activeHotspotInfo ? (
                                <>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Cấu tạo & Mô tả</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {selectedOrgan.description}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Chức năng chính</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {selectedOrgan.function}
                                        </p>
                                    </div>
                                    
                                    {selectedOrgan.hotspots && selectedOrgan.hotspots.length > 0 && (
                                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                                                </svg>
                                                Mô hình này có các điểm tương tác. Hãy bấm vào các chấm xanh trên mô hình để xem chi tiết từng bộ phận.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30 animate-fade-in relative">
                                    <button 
                                        onClick={() => setActiveHotspotInfo(null)}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 mb-3">
                                        Chi tiết bộ phận
                                    </span>
                                    
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{activeHotspotInfo.label}</h4>
                                    
                                    {activeHotspotInfo.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {activeHotspotInfo.description}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
}
