// VI + EN dictionary for public-facing surfaces (Landing, legal pages).
// Keys are dotted by section. Add new keys to BOTH locales.

export type Lang = 'vi' | 'en'

export const SUPPORTED: Lang[] = ['vi', 'en']

type Dict = Record<string, string>

const vi: Dict = {
  // Top notice
  'notice.openNow': 'MỞ CỬA HÔM NAY · 17:30 – 23:45',
  'notice.openShort': '17:30 – 23:45',
  'notice.newLocation': 'ĐỊA ĐIỂM MỚI TỪ 08/2025 · CHÂN CẦU RỒNG',
  'notice.openLive': 'ĐANG MỞ',
  'notice.closedLive': 'NGOÀI GIỜ',

  // Nav
  'nav.story': 'Câu chuyện',
  'nav.flavors': 'Ẩm thực',
  'nav.zones': '4 khu vực',
  'nav.events': 'Lịch đêm',
  'nav.visit': 'Đường đến',
  'nav.faq': 'Hỏi đáp',
  'nav.contact': 'Liên hệ',
  'nav.contactMsg': 'Liên hệ Messenger',
  'nav.menuOpen': 'Mở menu',
  'nav.menuClose': 'Đóng menu',
  'nav.langSwitch': 'EN',
  'nav.brandSub': 'Đà Nẵng · since 2018',

  // Hero
  'hero.pill1': 'Wonders Night Market · Since 2018',
  'hero.pill2': 'Đà Nẵng · An Hải Tây',
  'hero.headlinePre': 'Đêm Đà Nẵng',
  'hero.headlineEm': 'bắt đầu',
  'hero.headlinePost': 'ở đây.',
  'hero.sub':
    'Khói than nướng, đèn lồng đỏ và sóng người dưới chân Cầu Rồng — hơn 150 gian hàng trải khắp 4 khu. Hải sản tươi, mì Quảng, bánh tráng nướng, kem bơ; mở đèn từ 17:30 mỗi đêm.',
  'hero.cta1': 'Khám phá ẩm thực',
  'hero.cta2': 'Đường đến chợ',
  'hero.fact1.value': '150+',
  'hero.fact1.label': 'gian hàng',
  'hero.fact1.sub': '4 khu vực · ~1.500 m²',
  'hero.fact2.value': '365',
  'hero.fact2.label': 'đêm mỗi năm',
  'hero.fact2.sub': 'mở cửa từ 17:30 mỗi ngày',
  'hero.fact3.value': '2018',
  'hero.fact3.label': 'năm khai trương',
  'hero.fact3.sub': 'biểu tượng đêm Đà Nẵng',
  'hero.issue': 'Số 05 · 2026',
  'hero.issueSub': 'Wonders Night Market · Đà Nẵng',
  'hero.prevSlide': 'Ảnh trước',
  'hero.nextSlide': 'Ảnh tiếp',
  'hero.slideTabs': 'Chuyển ảnh hero',

  // Stats
  'stats.label': 'Bằng số liệu',
  'stats.note': 'Số liệu tổng hợp từ tài liệu chính thức của VinWonders, Sun World và fanpage chợ — cập nhật tháng 5/2026.',
  'stats.1.label': 'GIAN HÀNG',
  'stats.2.label': 'DIỆN TÍCH SAU MỞ RỘNG 08/2025',
  'stats.3.label': 'ẨM THỰC · QUÀ · PHỤ KIỆN · THỜI TRANG',
  'stats.4.label': 'HOẠT ĐỘNG LIÊN TỤC TỪ 2018',
  'stats.1.unit': '+',
  'stats.2.unit': 'm²',
  'stats.3.unit': ' khu',
  'stats.4.unit': ' năm',

  // Story
  'story.section': 'I · CHƯƠNG MỞ',
  'story.title': 'Câu chuyện chợ đêm',
  'story.openBadge': 'Khai trương',
  'story.openSince': '→ nay',
  'story.openMeta': 'Mở rộng 08/2025 lên 1.500 m² · 150+ gian hàng',
  'story.h2': 'Tám năm dưới chân Cầu Rồng — một biểu tượng đêm Đà Nẵng.',
  'story.p1':
    'Khai trương năm 2018 ngay dưới chân Cầu Rồng, Chợ Đêm Sơn Trà từ một dãy quầy hàng nhỏ đã phát triển thành <b>khu chợ đêm lớn nhất Đà Nẵng</b> với hơn 150 gian hàng. Tháng 8/2025, chợ được di dời sang vị trí mới rộng hơn (~1.500 m²) ngay đối diện đường cũ.',
  'story.p2':
    'Bốn khu vực — Ẩm thực, Quà lưu niệm, Túi xách & Phụ kiện, Thời trang — được bố trí gọn gàng. Mỗi tối, hàng nghìn thực khách Việt và quốc tế dừng chân trước khi đi xem Cầu Rồng phun lửa.',
  'story.p3':
    'Hôm nay, chợ vẫn giữ nhịp đêm ấy — đèn lồng, hương khói nướng, tiếng cụng ly — đồng thời mở thêm kênh Messenger để khách phương xa tiện hỏi đường, đặt bàn nhóm hay tư vấn lịch trình một đêm Đà Nẵng.',
  'story.pill1': 'An Hải Tây, Sơn Trà',
  'story.pill2': '17:30 – 23:45 hàng ngày',
  'story.pill3': '150+ gian hàng',

  // Dragon moment
  'dragon.label': 'Khoảnh khắc · 21:00 cuối tuần',
  'dragon.titlePre': 'Khi Cầu Rồng phun lửa, toàn bộ chợ đêm',
  'dragon.titleEm': 'ngừng ăn để nhìn lên.',
  'dragon.p1':
    'Mỗi tối thứ Bảy và Chủ nhật, đúng 21:00, đầu rồng bắc qua sông Hàn phun ba loạt lửa rồi ba loạt nước. Từ Khu A của chợ, chỉ cần ngẩng đầu là thấy — không cần ra bờ sông chen lấn.',
  'dragon.p2':
    'Tiểu thương quen tới mức không buồn quay xem. Khách du lịch thì vẫn rút điện thoại quay — đó là tín hiệu để bạn biết mình đang đúng nơi, đúng đêm.',
  'dragon.schedTitle': 'Lịch phun lửa & nước',
  'dragon.sat': 'Thứ Bảy',
  'dragon.sun': 'Chủ nhật',
  'dragon.weekdays': 'Thứ 2 – Thứ 6',
  'dragon.off': 'nghỉ',
  'dragon.source': 'Nguồn: Sở Du lịch Đà Nẵng — lịch chính thức 2026. Nếu trời mưa to, suất diễn có thể tạm hoãn.',

  // Gallery
  'gallery.section': 'II · KHÔNG GIAN',
  'gallery.title': 'Một đêm ở Sơn Trà',
  'gallery.frame': 'Frame',
  'gallery.1': 'Toàn cảnh chợ đêm về khuya',
  'gallery.2': 'Ánh đèn chợ đêm',
  'gallery.3': 'Khoảnh khắc một đêm',

  // Dishes (editorial cards)
  'dishes.section': 'III · ẨM THỰC',
  'dishes.title': '8 món phải thử',
  'dishes.sub':
    'Tinh hoa miền Trung gói trong một đêm — từ bánh tráng nướng 15k đến hải sản nướng than đỏ lúc đêm khuya. Giá tham khảo cập nhật 2025.',
  'dishes.priceLabel': 'Giá tham khảo',
  'dishes.footnote':
    'Giá tham khảo dựa trên VinWonders, Sovaba, Sun World, DulichLive (2025) — có thể thay đổi theo mùa.',
  'dish.1.name': 'Bánh tráng nướng',
  'dish.1.desc': 'Bánh tráng nướng trứng, ruốc và pate trên than hoa, bẻ giòn rụm — món đường phố kinh điển của chợ đêm Đà Nẵng.',
  'dish.1.price': '10 – 15k',
  'dish.1.tag': 'Ăn vặt',
  'dish.2.name': 'Mì Quảng tôm thịt',
  'dish.2.desc': 'Sợi mì vàng nghệ, nước dùng sánh đậm, ăn kèm bánh tráng nướng — đặc sản Quảng Nam – Đà Nẵng.',
  'dish.2.price': '40 – 70k',
  'dish.2.tag': 'Đặc sản miền Trung',
  'dish.3.name': 'Bánh xèo miền Trung',
  'dish.3.desc': 'Vỏ vàng nghệ giòn rụm, nhân tôm thịt và giá đỗ, cuốn rau rừng chấm nước mắm chua ngọt.',
  'dish.3.price': '35 – 50k',
  'dish.3.tag': 'Bánh giòn',
  'dish.4.name': 'Bánh bèo chén',
  'dish.4.desc': 'Bánh bèo trắng mềm trong chén sứ nhỏ, rắc tôm cháy và hành phi, chan nước mắm chua ngọt — đậm chất Huế – Đà Nẵng.',
  'dish.4.price': '25 – 40k',
  'dish.4.tag': 'Món dân dã',
  'dish.5.name': 'Ốc các loại',
  'dish.5.desc': 'Ốc hương xào bơ tỏi, ốc móng tay rang me, ốc giác hấp sả — món nhậu đêm cực phổ biến.',
  'dish.5.price': '50 – 120k',
  'dish.5.tag': 'Hơn 12 loại',
  'dish.6.name': 'Hải sản nướng & hấp',
  'dish.6.desc': 'Tôm sú, cua, ghẹ, sò điệp, mực — chọn con tươi ngay tại quầy, nướng than hoa hoặc hấp sả tại chỗ.',
  'dish.6.price': '100 – 800k',
  'dish.6.tag': 'Hải sản',
  'dish.7.name': 'Kem bơ Đà Nẵng',
  'dish.7.desc': 'Bơ sáp xay nhuyễn, kem dừa béo và đậu phộng rang — món tráng miệng huyền thoại của Đà Nẵng.',
  'dish.7.price': '10 – 25k',
  'dish.7.tag': 'Tráng miệng',
  'dish.8.name': 'Hải sản khô làm quà',
  'dish.8.desc': 'Mực một nắng, tôm khô, cá bống sông Trà, ghẹ sữa rim me — đóng gói hút chân không mang về.',
  'dish.8.price': '200 – 500k/kg',
  'dish.8.tag': 'Quà mang về',

  // Zones
  'zones.section': 'IV · BẢN ĐỒ KHU',
  'zones.title': '4 khu vực — 150+ gian hàng',
  'zones.sub':
    'Sau đợt mở rộng tháng 8/2025, chợ được chia thành 4 khu rõ ràng theo loại mặt hàng — dễ tìm, dễ so sánh giá. Bố cục dựa trên tài liệu chính thức của VinWonders & Sun World Đà Nẵng.',
  'zones.cta': 'Xem cập nhật từ fanpage chính thức',
  'zones.zonePrefix': 'Khu',
  'zone.A.name': 'Khu ẩm thực',
  'zone.A.desc': 'Hải sản tươi sống, mì Quảng, bánh xèo, bánh tráng nướng, ốc, kem bơ — gần như mọi món Đà Nẵng đều có.',
  'zone.A.count': '~60 quầy',
  'zone.A.price': '10k – 800k',
  'zone.B.name': 'Quà lưu niệm',
  'zone.B.desc': 'Đèn lồng Hội An mini, nón lá thêu tay, tượng đá Non Nước, móc khoá Cầu Rồng — quà tặng đặc trưng miền Trung.',
  'zone.B.count': '~35 quầy',
  'zone.B.price': '50k – 150k',
  'zone.C.name': 'Túi xách & Phụ kiện',
  'zone.C.desc': 'Túi vải đan tay, ví da bò, balo du lịch, mắt kính, đồng hồ — mặt hàng cho du khách đi biển dài ngày.',
  'zone.C.count': '~30 quầy',
  'zone.C.price': '80k – 400k',
  'zone.D.name': 'Thời trang & Lưu trú',
  'zone.D.desc': 'Áo phông in cảnh Đà Nẵng, đầm maxi đi biển, dép sandal, mũ rộng vành — phục vụ phong cách du lịch ven biển.',
  'zone.D.count': '~25 quầy',
  'zone.D.price': '60k – 350k',

  // Events
  'events.section': 'V · LỊCH ĐÊM',
  'events.title': 'Lịch một buổi tối',
  'events.sub': 'Sáu khung giờ vàng. Hãy đến sớm, ăn từ từ, và đừng quên xem Cầu Rồng phun lửa lúc 21:00 cuối tuần.',
  'event.1.time': '17:30 – 18:30',
  'event.1.title': 'Khai mạc & lên đèn',
  'event.1.desc': 'Tiểu thương dựng quầy, bật đèn lồng. Đến sớm để tránh đông và chọn quầy ưng ý.',
  'event.2.time': '18:30 – 19:00',
  'event.2.title': 'Acoustic mở màn',
  'event.2.desc': 'Ban nhạc đường phố biểu diễn nhạc Việt – Quốc tế, không khí dần nhộn nhịp.',
  'event.3.time': '19:00 – 21:30',
  'event.3.title': 'Giờ vàng ẩm thực',
  'event.3.desc': 'Toàn bộ 150+ gian hàng phục vụ đồng loạt — đông và sôi động nhất, nên đặt bàn trước nếu nhóm 6+.',
  'event.4.time': '21:00 (T7 & CN)',
  'event.4.title': 'Cầu Rồng phun lửa',
  'event.4.desc': 'Đi bộ 3 phút sang Cầu Rồng xem màn phun lửa & phun nước — quay lại chợ ăn khuya.',
  'event.5.time': '21:30 – 23:00',
  'event.5.title': 'Quà & lưu niệm',
  'event.5.desc': 'Sau bữa tối, ghé khu quà lưu niệm & thời trang dạo bộ — không gian dịu lại, đèn lồng rực rỡ nhất khung giờ này.',
  'event.6.time': '23:00 – 23:59',
  'event.6.title': 'Late-night hải sản',
  'event.6.desc': 'Khu nướng đêm vẫn mở, đặc biệt sôi động cuối tuần. Đi nhóm bạn rủ nhau ăn nhẹ trước khi về.',

  // Testimonials
  'testi.label': 'Tiếng nói thực khách · trích từ Tripadvisor & Google Maps',
  'testi.more': 'Năm trích đoạn khác chúng tôi đọc tuần này',

  // Tips
  'tips.section': 'VI · MẸO ĐỊA PHƯƠNG',
  'tips.title': 'Sáu điều nên biết trước',
  'tips.sub':
    'Lời nhắn của những người Đà Nẵng đã đi chợ này nhiều lần — tổng hợp từ fanpage Facebook chính thức và các bài review trên Tripadvisor.',
  'tips.meta': 'Soạn lại tháng 5/2026',
  'tip.1.title': 'Đến đúng "giờ vàng"',
  'tip.1.desc': 'Từ 19:00 – 21:30 toàn bộ gian hàng đã sẵn sàng, không khí náo nhiệt nhất. Tránh đến sau 22:30 vì nhiều quầy ăn đã dọn.',
  'tip.2.title': 'Hỏi giá trước khi gọi',
  'tip.2.desc': 'Một số quầy hải sản có thể giá cao. Hỏi giá theo kg/phần trước khi gật đầu — tránh bất ngờ khi tính tiền.',
  'tip.3.title': 'Canh giờ Cầu Rồng',
  'tip.3.desc': 'Tối T7 & CN lúc 21:00 Cầu Rồng phun lửa — đi bộ 3 phút. Ăn nhẹ trước, no sau.',
  'tip.4.title': 'Chọn quán đông khách Việt',
  'tip.4.desc': 'Ưu tiên quán có khách Việt ngồi sẵn — đây là chỉ báo tốt nhất về vệ sinh & giá hợp lý.',
  'tip.5.title': 'Gửi xe ngay cổng',
  'tip.5.desc': 'Bãi xe máy ngay cổng chợ. Ô tô gửi tại đường Trần Hưng Đạo (cách ~200m) hoặc gọi Grab/taxi.',
  'tip.6.title': 'Đem theo tiền mặt VND',
  'tip.6.desc': 'Phần lớn quầy ăn vặt quen tiền mặt mệnh giá nhỏ (10k – 100k). Một số quầy có dán mã QR ngân hàng để tiện hơn.',

  // Visit
  'visit.section': 'VII · ĐƯỜNG ĐẾN',
  'visit.title': 'Tham quan & đường đến',
  'visit.mapTitle': 'Bản đồ Chợ Đêm Sơn Trà',
  'visit.addressLabel': 'Địa chỉ',
  'visit.addressLine1': 'Đường Lý Nam Đế × Mai Hắc Đế',
  'visit.addressLine2': 'Phường An Hải Tây, quận Sơn Trà, thành phố Đà Nẵng — ngay chân Cầu Rồng. Địa điểm mới từ tháng 8/2025.',
  'visit.hoursLabel': 'Giờ mở cửa',
  'visit.hoursWeekday': 'Thứ 2 – Thứ 6',
  'visit.hoursWeekend': 'Thứ 7 – Chủ nhật',
  'visit.hoursGolden': 'Giờ vàng',
  'visit.howLabel': 'Cách đến',
  'visit.how1.title': 'Từ Cầu Rồng:',
  'visit.how1.body': 'đi bộ 3 phút (~250m)',
  'visit.how2.title': 'Từ trung tâm Tây sông Hàn:',
  'visit.how2.body': '~5 phút Grab Bike (~20k)',
  'visit.how3.title': 'Từ sân bay Đà Nẵng:',
  'visit.how3.body': '~15 phút taxi (~80k–100k)',

  // FAQ
  'faq.section': 'VIII · GIẢI ĐÁP',
  'faq.title': 'Câu hỏi thường gặp',
  'faq.1.q': 'Chợ Đêm Sơn Trà mở cửa mấy giờ?',
  'faq.1.a':
    'Chợ mở cửa hàng ngày từ 17:30 đến 23:45 (Thứ 2 – Thứ 6) và 17:00 đến 23:59 (Thứ 7 – Chủ nhật). Khung giờ vàng đông khách nhất là 19:00 – 21:30. Một số quầy hải sản mở khuya hơn vào cuối tuần.',
  'faq.2.q': 'Địa chỉ chính xác của chợ ở đâu?',
  'faq.2.a':
    'Chợ nằm trên đường Lý Nam Đế giao Mai Hắc Đế, phường An Hải Tây, quận Sơn Trà, thành phố Đà Nẵng — ngay dưới chân Cầu Rồng, đi bộ 3 phút từ bờ Đông sông Hàn. Từ tháng 8/2025 chợ đã được di dời sang vị trí mới với diện tích rộng hơn (~1.500 m²).',
  'faq.3.q': 'Vào chợ có mất phí không?',
  'faq.3.a': 'Hoàn toàn miễn phí vào cổng. Phí gửi xe máy ~5.000đ/lượt, ô tô gửi tại đường Trần Hưng Đạo cách chợ 200m.',
  'faq.4.q': 'Trung bình ăn uống mất bao nhiêu tiền?',
  'faq.4.a':
    'Ăn vặt nhẹ (bánh tráng, kem bơ, chè): 20.000đ – 70.000đ/món. Bữa chính (mì Quảng, bánh xèo, bánh bèo): 50.000đ – 150.000đ/người. Hải sản tươi cao cấp như tôm hùm, cua hoàng đế dao động 300k – 800k tuỳ trọng lượng — hãy hỏi giá theo kg trước khi gọi.',
  'faq.5.q': 'Nên mang tiền mặt hay dùng app ngân hàng?',
  'faq.5.a':
    'Khuyến nghị mang tiền mặt VND mệnh giá nhỏ (10k – 100k) — quầy ăn vặt quen tiền mặt nhất. Một số quầy có dán mã QR ngân hàng nội địa để khách trả tiện hơn. Thẻ tín dụng quốc tế hiếm khi được chấp nhận tại các quầy nhỏ.',
  'faq.6.q': 'Có thể đặt món trước qua Facebook / Messenger không?',
  'faq.6.a':
    'Có. Bạn có thể nhắn tin trực tiếp với fanpage chính thức "Chợ Đêm Sơn Trà – Wonders Night Market" hoặc với từng tiểu thương để đặt món, đặt bàn, hỏi giá trước khi đến.',
  'faq.7.q': 'Đi từ trung tâm Đà Nẵng / sân bay đến chợ thế nào?',
  'faq.7.a':
    'Từ Cầu Rồng: đi bộ 3 phút. Từ trung tâm bờ Tây sông Hàn: ~5 phút taxi/Grab (~30k). Từ sân bay Đà Nẵng quốc tế: ~15 phút taxi (~80k – 100k). Từ biển Mỹ Khê: ~10 phút đi bộ hoặc 3 phút xe máy.',
  'faq.8.q': 'Có món chay không?',
  'faq.8.a':
    'Có một vài gian hàng chay với mì Quảng chay, bánh xèo nấm, gỏi cuốn chay, chè & nước trái cây ép tươi. Số lượng quầy chay hạn chế, nên đến sớm trước 19:30.',
  'faq.9.q': 'Đặt đặc sản giao về nhà / quốc tế được không?',
  'faq.9.a':
    'Có. Bạn có thể nhắn tin với fanpage chính thức để đặt đặc sản đóng gói (mì Quảng khô, bánh tráng, mắm nêm, kem bơ đông lạnh) — giao toàn quốc và DHL Express quốc tế 5–10 ngày.',

  // CTA
  'cta.eyebrow': 'Hẹn gặp dưới chân Cầu Rồng',
  'cta.titlePre': 'Một đêm Đà Nẵng,',
  'cta.titleEm': 'bắt đầu từ đây',
  'cta.titlePost': '.',
  'cta.body':
    '17:30 đèn lồng bật sáng, 19:00 cao điểm hương khói nướng, 22:30 ban nhạc đường phố lên sân khấu. Cần tư vấn đặt bàn nhóm đông, sự kiện hay quay phim — nhắn Messenger hoặc gọi hotline ban quản lý.',
  'cta.btnMessenger': 'Nhắn Messenger',
  'cta.btnCall': 'Gọi +84 94 704 6556',
  'cta.specLabel': 'Thông tin đến chợ',
  'cta.spec1.l': 'Mở cửa hàng đêm',
  'cta.spec1.sub': 'thứ 2 – thứ 6 · cuối tuần từ 17:00',
  'cta.spec2.l': 'Đóng cửa thường',
  'cta.spec2.sub': 'cuối tuần kéo dài đến 23:59',
  'cta.spec3.l': 'Phí vào cổng',
  'cta.spec3.sub': 'miễn phí cho khách tham quan',
  'cta.spec4.l': 'Chỗ đỗ xe máy',
  'cta.spec4.sub': 'bãi gửi xe công cộng dọc Mai Hắc Đế',
  'cta.spec3.v': '0₫',
  'cta.spec4.v': '~150',

  // Legal strip
  'legal.eyebrow': 'Minh bạch · Tuân thủ',
  'legal.title': 'Cam kết pháp lý & bảo vệ dữ liệu khách hàng',
  'legal.intro':
    'Chợ Đêm Sơn Trà tuân thủ Luật An toàn thông tin mạng Việt Nam, Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và yêu cầu của Meta Platform Policy. Tất cả tài liệu pháp lý đều công khai.',
  'legal.requestDelete': 'Yêu cầu xoá dữ liệu',
  'legal.privacy.title': 'Chính sách bảo mật',
  'legal.privacy.desc':
    'Chúng tôi thu thập gì, lưu trữ bao lâu, chia sẻ với ai. Tuân thủ GDPR-like + Nghị định 13/2023/NĐ-CP Việt Nam.',
  'legal.privacy.meta': 'Hiệu lực 25/05/2026',
  'legal.terms.title': 'Điều khoản sử dụng',
  'legal.terms.desc':
    'Hợp đồng pháp lý giữa bạn và Chợ Đêm Sơn Trà. Trách nhiệm khách hàng, tiểu thương, thanh toán, đổi trả.',
  'legal.terms.meta': 'Hiệu lực 25/05/2026',
  'legal.delete.title': 'Hướng dẫn xoá dữ liệu',
  'legal.delete.desc':
    '3 cách xoá: self-service trong tài khoản, gửi email, hoặc gỡ ứng dụng khỏi Facebook. Xác minh trong 3 ngày, xoá trong 30 ngày.',
  'legal.delete.meta': 'Meta Data Deletion Callback',
  'legal.readMore': 'Đọc đầy đủ',
  'legal.entity.label': 'Đơn vị vận hành',
  'legal.entity.name': 'Công ty CP DHTC Đà Nẵng',
  'legal.entity.gpkd': 'GPKD 0401234567 · Sở KH&ĐT Đà Nẵng',
  'legal.hq.label': 'Trụ sở',
  'legal.hq.address': 'Mai Hắc Đế × Lý Nam Đế, phường An Hải Tây, quận Sơn Trà, thành phố Đà Nẵng, Việt Nam',
  'legal.email.label': 'Email pháp lý',
  'legal.email.sub': 'Hỗ trợ DPO & yêu cầu xoá dữ liệu',
  'legal.hotline.label': 'Hotline',
  'legal.hotline.sub': '8:00 – 22:00 GMT+7 hằng ngày',

  // Footer
  'footer.brandDesc':
    'Khu chợ đêm lớn nhất Đà Nẵng — biểu tượng ẩm thực miền Trung từ năm 2018. Hơn 150 gian hàng, mở cửa hàng đêm dưới chân Cầu Rồng.',
  'footer.exploreLabel': 'Khám phá',
  'footer.exploreStory': 'Câu chuyện chợ đêm',
  'footer.exploreFlavors': '8 món phải thử',
  'footer.exploreZones': '4 khu vực',
  'footer.exploreEvents': 'Lịch hoạt động đêm',
  'footer.exploreVisit': 'Cách đến chợ',
  'footer.exploreFaq': 'Hỏi đáp',
  'footer.contactLabel': 'Liên hệ & Pháp lý',
  'footer.linkPrivacy': 'Chính sách bảo mật',
  'footer.linkTerms': 'Điều khoản sử dụng',
  'footer.linkDelete': 'Hướng dẫn xoá dữ liệu',
  'footer.copyright': '© 2026 Chợ Đêm Sơn Trà · Đà Nẵng · dhtcdanang.com',
  'footer.gpkd': 'GPKD: 0401234567 · Sở KH&ĐT Đà Nẵng cấp',

  // Simple Navbar wrapper (authenticated shell)
  'navbar.brand': 'DHTC',
  'navbar.logout': 'Đăng xuất',

  // Home (authenticated dashboard)
  'home.title': 'Bảng điều khiển',
  'home.logout': 'Đăng xuất',
  'home.accountInfo': 'Thông tin tài khoản',
  'home.fieldId': 'ID',
  'home.fieldEmail': 'Email',
  'home.fieldStatus': 'Trạng thái',
  'home.statusActive': 'Đang hoạt động',
  'home.statusLocked': 'Bị khoá',
  'home.placeholder': 'Thêm chức năng vào đây.',

  // 404
  'notfound.title': 'Trang không tồn tại',
  'notfound.sub': 'URL này không hợp lệ hoặc đã bị xoá.',
  'notfound.back': 'Về trang chủ',

  // Customer marketplace layout — nav
  'cust.nav.home': 'Trang chủ',
  'cust.nav.shop': 'Mua sắm',
  'cust.nav.guide': 'Cẩm nang',
  'cust.nav.contact': 'Liên hệ',

  // Customer marketplace layout — categories
  'cust.cat.all': 'Tất cả',
  'cust.cat.coffee': 'Cà phê',
  'cust.cat.pepper': 'Hồ tiêu',
  'cust.cat.ginseng': 'Sâm & thảo dược',
  'cust.cat.driedFruit': 'Trái cây sấy',
  'cust.cat.honey': 'Mật ong',
  'cust.cat.fishSauce': 'Nước mắm',
  'cust.cat.rice': 'Gạo đặc sản',

  // Customer marketplace layout — account menu
  'cust.acc.account': 'Tài khoản',
  'cust.acc.orders': 'Đơn hàng',
  'cust.acc.logout': 'Đăng xuất',
  'cust.acc.login': 'Đăng nhập',

  // Customer marketplace layout — footer
  'cust.foot.brand': 'DHTC Đà Nẵng',
  'cust.foot.tagline':
    'Nền tảng thương mại nông sản đặc sản Việt Nam, kết nối tiểu thương và khách hàng toàn cầu.',
  'cust.foot.productsLabel': 'Sản phẩm',
  'cust.foot.supportLabel': 'Hỗ trợ',
  'cust.foot.contactLabel': 'Liên hệ',
  'cust.foot.product1': 'Cà phê Đắk Lắk',
  'cust.foot.product2': 'Hồ tiêu Gia Lai',
  'cust.foot.product3': 'Sâm Ngọc Linh',
  'cust.foot.product4': 'Mật ong rừng',
  'cust.foot.support1': 'Chính sách giao hàng',
  'cust.foot.support2': 'Đổi trả hàng',
  'cust.foot.support3': 'Thanh toán an toàn',
  'cust.foot.support4': 'Liên hệ DHTC',
  'cust.foot.location': 'Đà Nẵng, Việt Nam',
  'cust.foot.copyright': '© 2026 DHTC Đà Nẵng. All rights reserved.',

  // Facebook OAuth return page
  'fbReturn.errInvalidState': 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
  'fbReturn.errCancelled': 'Bạn đã huỷ đăng nhập bằng Facebook.',
  'fbReturn.errFbDown': 'Không kết nối được Facebook. Vui lòng thử lại sau ít phút.',
  'fbReturn.errGeneric': 'Đã có lỗi xảy ra. Vui lòng thử lại.',
  'fbReturn.errWithCode': 'Đăng nhập thất bại ({code}).',
  'fbReturn.title': 'Đăng nhập không thành công',
  'fbReturn.backToLogin': 'Quay lại đăng nhập',
  'fbReturn.completing': 'Đang hoàn tất đăng nhập…',

  // Login page
  'auth.login.title': 'Đăng nhập',
  'auth.login.subtitle': 'Chào mừng quay lại',
  'auth.login.emailLabel': 'Email',
  'auth.login.passwordLabel': 'Mật khẩu',
  'auth.login.submit': 'Đăng nhập',
  'auth.login.submitting': 'Đang đăng nhập…',
  'auth.login.errCreds': 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
  'auth.login.or': 'hoặc',
  'auth.login.fbContinue': 'Tiếp tục với Facebook',
  'auth.login.noAccount': 'Chưa có tài khoản?',
  'auth.login.registerLink': 'Đăng ký ngay',
  'auth.login.terms': 'Bằng cách đăng nhập, bạn đồng ý với',
  'auth.login.termsLink': 'Điều khoản sử dụng',

  // Register page
  'auth.register.title': 'Tạo tài khoản',
  'auth.register.subtitle': 'Tham gia nền tảng nông sản Việt Nam',
  'auth.register.roleLabel': 'Bạn là',
  'auth.register.roleCustomer': 'Người mua',
  'auth.register.roleCustomerSub': 'Tìm & mua nông sản',
  'auth.register.roleSeller': 'Tiểu thương',
  'auth.register.roleSellerSub': 'Bán sản phẩm của bạn',
  'auth.register.emailLabel': 'Email',
  'auth.register.passwordLabel': 'Mật khẩu',
  'auth.register.passwordHint': 'Tối thiểu 8 ký tự',
  'auth.register.confirmLabel': 'Xác nhận mật khẩu',
  'auth.register.confirmHint': 'Nhập lại mật khẩu',
  'auth.register.submit': 'Đăng ký',
  'auth.register.submitting': 'Đang tạo tài khoản…',
  'auth.register.errMismatch': 'Mật khẩu xác nhận không khớp.',
  'auth.register.errShort': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'auth.register.errFail': 'Đăng ký thất bại. Email có thể đã được sử dụng.',
  'auth.register.fbButton': 'Đăng ký bằng Facebook',
  'auth.register.haveAccount': 'Đã có tài khoản?',
  'auth.register.loginLink': 'Đăng nhập',
}

const en: Dict = {
  // Top notice
  'notice.openNow': 'OPEN TONIGHT · 17:30 – 23:45',
  'notice.openShort': '17:30 – 23:45',
  'notice.newLocation': 'NEW LOCATION SINCE 08/2025 · BY DRAGON BRIDGE',
  'notice.openLive': 'OPEN NOW',
  'notice.closedLive': 'CLOSED',

  // Nav
  'nav.story': 'Story',
  'nav.flavors': 'Flavors',
  'nav.zones': '4 Zones',
  'nav.events': 'Tonight',
  'nav.visit': 'Visit',
  'nav.faq': 'FAQ',
  'nav.contact': 'Contact',
  'nav.contactMsg': 'Messenger Us',
  'nav.menuOpen': 'Open menu',
  'nav.menuClose': 'Close menu',
  'nav.langSwitch': 'VI',
  'nav.brandSub': 'Đà Nẵng · since 2018',

  // Hero
  'hero.pill1': 'Wonders Night Market · Since 2018',
  'hero.pill2': 'Đà Nẵng · An Hải Tây',
  'hero.headlinePre': 'A Đà Nẵng night',
  'hero.headlineEm': 'begins',
  'hero.headlinePost': 'right here.',
  'hero.sub':
    'Charcoal smoke, red lanterns and a river of people at the foot of Dragon Bridge — 150+ stalls across 4 zones. Fresh seafood, mì Quảng, grilled rice paper, avocado ice cream; lights on from 17:30 every night.',
  'hero.cta1': 'Explore the flavors',
  'hero.cta2': 'How to get here',
  'hero.fact1.value': '150+',
  'hero.fact1.label': 'stalls',
  'hero.fact1.sub': '4 zones · ~1,500 m²',
  'hero.fact2.value': '365',
  'hero.fact2.label': 'nights a year',
  'hero.fact2.sub': 'open daily from 17:30',
  'hero.fact3.value': '2018',
  'hero.fact3.label': 'founded',
  'hero.fact3.sub': "an icon of Đà Nẵng's night",
  'hero.issue': 'Issue 05 · 2026',
  'hero.issueSub': 'Wonders Night Market · Đà Nẵng',
  'hero.prevSlide': 'Previous slide',
  'hero.nextSlide': 'Next slide',
  'hero.slideTabs': 'Hero slides',

  // Stats
  'stats.label': 'By the numbers',
  'stats.note': 'Figures compiled from official VinWonders, Sun World documents and the market fanpage — updated May 2026.',
  'stats.1.label': 'STALLS',
  'stats.2.label': 'FOOTPRINT AFTER 08/2025 EXPANSION',
  'stats.3.label': 'FOOD · GIFTS · ACCESSORIES · FASHION',
  'stats.4.label': 'OPEN CONTINUOUSLY SINCE 2018',
  'stats.1.unit': '+',
  'stats.2.unit': 'm²',
  'stats.3.unit': ' zones',
  'stats.4.unit': ' years',

  // Story
  'story.section': 'I · OPENING CHAPTER',
  'story.title': 'How the night market began',
  'story.openBadge': 'Founded',
  'story.openSince': '→ today',
  'story.openMeta': 'Expanded 08/2025 to 1,500 m² · 150+ stalls',
  'story.h2': "Eight years under the Dragon Bridge — an icon of Đà Nẵng's nights.",
  'story.p1':
    'Opened in 2018 right at the foot of Dragon Bridge, Sơn Trà Night Market grew from a small row of stalls into <b>the largest night market in Đà Nẵng</b> with over 150 stalls. In August 2025, it moved to a wider new location (~1,500 m²) directly across from the old street.',
  'story.p2':
    'Four zones — Food, Gifts, Bags & Accessories, Fashion — are laid out cleanly. Every night, thousands of Vietnamese and international guests stop here before walking over to watch the Dragon Bridge breathe fire.',
  'story.p3':
    "Today, the market keeps that same nightly rhythm — lanterns, the smoke of the grill, glasses clinking — and now opens a Messenger channel so far-away guests can ask directions, book group tables, or plan a Đà Nẵng evening.",
  'story.pill1': 'An Hải Tây, Sơn Trà',
  'story.pill2': '17:30 – 23:45 daily',
  'story.pill3': '150+ stalls',

  // Dragon moment
  'dragon.label': 'A moment · 21:00 weekends',
  'dragon.titlePre': 'When the Dragon breathes fire, the whole market',
  'dragon.titleEm': 'stops eating to look up.',
  'dragon.p1':
    'Every Saturday and Sunday evening, at exactly 21:00, the dragon head spanning the Hàn river blows three rounds of fire and three of water. From Zone A of the market, just look up — no need to fight the crowd on the riverbank.',
  'dragon.p2':
    "The vendors are so used to it they don't even turn to watch. The tourists still pull out their phones — that's how you know you're in the right place, on the right night.",
  'dragon.schedTitle': 'Fire & water show schedule',
  'dragon.sat': 'Saturday',
  'dragon.sun': 'Sunday',
  'dragon.weekdays': 'Mon – Fri',
  'dragon.off': 'off',
  'dragon.source': "Source: Đà Nẵng Department of Tourism — official 2026 schedule. Heavy rain may postpone a show.",

  // Gallery
  'gallery.section': 'II · ATMOSPHERE',
  'gallery.title': 'One night in Sơn Trà',
  'gallery.frame': 'Frame',
  'gallery.1': 'The market at full swing, late night',
  'gallery.2': 'Lantern light on the stalls',
  'gallery.3': 'A moment from one evening',

  // Dishes
  'dishes.section': 'III · FLAVORS',
  'dishes.title': '8 dishes you have to try',
  'dishes.sub':
    'The best of central Vietnam in one night — from 15k grilled rice paper to late-night grilled seafood. Reference prices updated 2025.',
  'dishes.priceLabel': 'Reference price',
  'dishes.footnote':
    'Reference prices from VinWonders, Sovaba, Sun World, DulichLive (2025) — subject to seasonal change.',
  'dish.1.name': 'Bánh tráng nướng',
  'dish.1.desc': 'Grilled rice paper with quail egg, dried shrimp & pâté over charcoal — the classic Đà Nẵng street snack.',
  'dish.1.price': '10 – 15k',
  'dish.1.tag': 'Street food',
  'dish.2.name': 'Mì Quảng (shrimp & pork)',
  'dish.2.desc': 'Turmeric noodles in a rich, low-broth sauce, served with crisp rice cracker — the soul dish of Quảng Nam – Đà Nẵng.',
  'dish.2.price': '40 – 70k',
  'dish.2.tag': 'Central VN signature',
  'dish.3.name': 'Bánh xèo (central style)',
  'dish.3.desc': "Crispy turmeric crepe filled with shrimp, pork and bean sprouts; wrapped in herbs and dipped in sweet-and-sour fish sauce.",
  'dish.3.price': '35 – 50k',
  'dish.3.tag': 'Crispy crepe',
  'dish.4.name': 'Bánh bèo (rice cup cakes)',
  'dish.4.desc': 'Soft white rice cakes in tiny porcelain cups, topped with dried shrimp and fried shallots — pure Huế–Đà Nẵng comfort.',
  'dish.4.price': '25 – 40k',
  'dish.4.tag': 'Comfort food',
  'dish.5.name': 'Sea snails (12+ kinds)',
  'dish.5.desc': 'Sweet snails sautéed in garlic butter, razor clams with tamarind, conch steamed with lemongrass — the late-night drinking favorite.',
  'dish.5.price': '50 – 120k',
  'dish.5.tag': '12+ varieties',
  'dish.6.name': 'Grilled & steamed seafood',
  'dish.6.desc': 'Tiger prawns, crab, scallops, squid — picked fresh at the stall, grilled over charcoal or steamed with lemongrass on the spot.',
  'dish.6.price': '100 – 800k',
  'dish.6.tag': 'Seafood',
  'dish.7.name': 'Kem bơ (avocado ice cream)',
  'dish.7.desc': "Whipped buttery avocado, coconut ice cream and crushed peanuts — Đà Nẵng's legendary dessert.",
  'dish.7.price': '10 – 25k',
  'dish.7.tag': 'Dessert',
  'dish.8.name': 'Dried seafood gifts',
  'dish.8.desc': 'Sun-dried squid, dried shrimp, gobies, tamarind crab — vacuum-sealed and ready to take home.',
  'dish.8.price': '200 – 500k/kg',
  'dish.8.tag': 'Take home',

  // Zones
  'zones.section': 'IV · ZONE MAP',
  'zones.title': '4 zones — 150+ stalls',
  'zones.sub':
    "After the August 2025 expansion, the market is split into 4 clear zones by category — easy to navigate, easy to compare prices. Layout per VinWonders & Sun World Đà Nẵng's official documents.",
  'zones.cta': 'See updates from the official fanpage',
  'zones.zonePrefix': 'Zone',
  'zone.A.name': 'Food court',
  'zone.A.desc': 'Live seafood, mì Quảng, bánh xèo, grilled rice paper, snails, avocado ice cream — almost every Đà Nẵng classic in one place.',
  'zone.A.count': '~60 stalls',
  'zone.A.price': '10k – 800k',
  'zone.B.name': 'Souvenirs',
  'zone.B.desc': 'Mini Hội An lanterns, hand-embroidered conical hats, Non Nước marble figurines, Dragon Bridge keychains — central Vietnam keepsakes.',
  'zone.B.count': '~35 stalls',
  'zone.B.price': '50k – 150k',
  'zone.C.name': 'Bags & accessories',
  'zone.C.desc': 'Woven cloth bags, cowhide wallets, travel backpacks, sunglasses, watches — items for the long-haul beach traveler.',
  'zone.C.count': '~30 stalls',
  'zone.C.price': '80k – 400k',
  'zone.D.name': 'Fashion & beachwear',
  'zone.D.desc': 'Đà Nẵng-print tees, beach maxi dresses, sandals, wide-brimmed hats — the seaside-traveler look.',
  'zone.D.count': '~25 stalls',
  'zone.D.price': '60k – 350k',

  // Events
  'events.section': 'V · TONIGHT',
  'events.title': 'A night, hour by hour',
  'events.sub': "Six golden windows. Come early, eat slowly, and don't miss the Dragon Bridge fire show at 21:00 on weekends.",
  'event.1.time': '17:30 – 18:30',
  'event.1.title': 'Setup & lanterns on',
  'event.1.desc': 'Vendors set up the stalls and light the lanterns. Come early to avoid the crowd and pick the stall you like.',
  'event.2.time': '18:30 – 19:00',
  'event.2.title': 'Acoustic warm-up',
  'event.2.desc': 'Street bands play Vietnamese and international hits — the market starts to come alive.',
  'event.3.time': '19:00 – 21:30',
  'event.3.title': 'Golden hours',
  'event.3.desc': "All 150+ stalls serving in parallel — the busiest and loudest stretch; book ahead for groups of 6+.",
  'event.4.time': '21:00 (Sat & Sun)',
  'event.4.title': 'Dragon Bridge fire show',
  'event.4.desc': 'A 3-minute walk over to the Dragon Bridge to catch the fire & water show — then back for a late bite.',
  'event.5.time': '21:30 – 23:00',
  'event.5.title': 'Gifts & strolling',
  'event.5.desc': 'After dinner, drift over to the gifts & fashion zones — the air softens, and the lanterns glow brightest in this window.',
  'event.6.time': '23:00 – 23:59',
  'event.6.title': 'Late-night seafood',
  'event.6.desc': "The grill stalls stay open, especially lively on weekends. Grab friends for a light snack before heading home.",

  // Testimonials
  'testi.label': 'Voices of real visitors · pulled from Tripadvisor & Google Maps',
  'testi.more': 'Five other clips we read this week',

  // Tips
  'tips.section': 'VI · LOCAL TIPS',
  'tips.title': 'Six things to know first',
  'tips.sub':
    "Notes from Đà Nẵng locals who've walked this market many times — compiled from the official Facebook fanpage and Tripadvisor reviews.",
  'tips.meta': 'Updated May 2026',
  'tip.1.title': 'Hit the "golden hours"',
  'tip.1.desc': "Between 19:00 – 21:30 every stall is ready and the energy peaks. Avoid arriving after 22:30 — many food stalls start packing up.",
  'tip.2.title': 'Always ask the price first',
  'tip.2.desc': "Some seafood stalls run pricey. Ask by kg or portion before nodding yes — no surprises at the bill.",
  'tip.3.title': 'Time the Dragon Bridge',
  'tip.3.desc': "Sat & Sun at 21:00 the Dragon Bridge breathes fire — a 3-minute walk over. Eat light first, then come back to feast.",
  'tip.4.title': 'Pick stalls with locals in them',
  'tip.4.desc': 'Prefer stalls already full of Vietnamese diners — the single best signal for hygiene and fair price.',
  'tip.5.title': 'Park right at the gate',
  'tip.5.desc': 'Motorbike parking is right at the market gate. For cars, park along Trần Hưng Đạo (~200m away) or call Grab/taxi.',
  'tip.6.title': 'Bring small Vietnamese cash',
  'tip.6.desc': 'Most snack stalls run on small bills (10k – 100k VND). Some have local bank QR stickers, but cash still moves fastest.',

  // Visit
  'visit.section': 'VII · DIRECTIONS',
  'visit.title': 'Visit & how to get here',
  'visit.mapTitle': 'Map of Sơn Trà Night Market',
  'visit.addressLabel': 'Address',
  'visit.addressLine1': 'Lý Nam Đế × Mai Hắc Đế Street',
  'visit.addressLine2': "An Hải Tây Ward, Sơn Trà District, Đà Nẵng City — right at the foot of Dragon Bridge. New location since August 2025.",
  'visit.hoursLabel': 'Opening hours',
  'visit.hoursWeekday': 'Mon – Fri',
  'visit.hoursWeekend': 'Sat – Sun',
  'visit.hoursGolden': 'Golden hours',
  'visit.howLabel': 'Getting here',
  'visit.how1.title': 'From Dragon Bridge:',
  'visit.how1.body': '3-minute walk (~250m)',
  'visit.how2.title': "From the city center (west bank):",
  'visit.how2.body': '~5 min by Grab Bike (~20k)',
  'visit.how3.title': 'From Đà Nẵng airport:',
  'visit.how3.body': '~15 min by taxi (~80k–100k)',

  // FAQ
  'faq.section': 'VIII · FAQ',
  'faq.title': 'Frequently asked',
  'faq.1.q': 'What are the opening hours?',
  'faq.1.a':
    'The market opens daily from 17:30 to 23:45 (Mon–Fri) and 17:00 to 23:59 (Sat–Sun). The golden window is 19:00 – 21:30. Some seafood stalls stay open later on weekends.',
  'faq.2.q': 'Where exactly is the market?',
  'faq.2.a':
    "The market is on Lý Nam Đế Street at Mai Hắc Đế, An Hải Tây Ward, Sơn Trà District, Đà Nẵng — right at the foot of Dragon Bridge, a 3-minute walk from the east bank of the Hàn river. Since August 2025 it has moved to a wider new site (~1,500 m²).",
  'faq.3.q': 'Is there an entrance fee?',
  'faq.3.a': 'Completely free to enter. Motorbike parking ~5,000 VND/visit; car parking on Trần Hưng Đạo (~200m from the market).',
  'faq.4.q': 'How much should I budget for food?',
  'faq.4.a':
    'Light snacks (rice paper, kem bơ, sweet soups): 20,000 – 70,000 VND each. Main dishes (mì Quảng, bánh xèo, bánh bèo): 50,000 – 150,000 VND per person. Premium fresh seafood (lobster, king crab) runs 300k – 800k by weight — always confirm the per-kilo price before ordering.',
  'faq.5.q': 'Cash or banking app?',
  'faq.5.a':
    'Bring small VND notes (10k – 100k) — snack stalls run smoothest on cash. Some stalls show a local bank QR. International credit cards are rarely accepted at small stalls.',
  'faq.6.q': 'Can I pre-order via Facebook / Messenger?',
  'faq.6.a':
    'Yes. Message the official "Chợ Đêm Sơn Trà – Wonders Night Market" fanpage or individual vendors to pre-order dishes, book a table or ask prices before you come.',
  'faq.7.q': 'How do I get from the city center / airport?',
  'faq.7.a':
    "From Dragon Bridge: 3-minute walk. From the west-bank center: ~5 min by taxi/Grab (~30k). From Đà Nẵng International Airport: ~15 min by taxi (~80k–100k). From Mỹ Khê Beach: ~10 min walk or 3 min by motorbike.",
  'faq.8.q': 'Are there vegetarian options?',
  'faq.8.a':
    'Yes — a handful of stalls serve vegetarian mì Quảng, mushroom bánh xèo, fresh spring rolls, sweet soups and pressed fruit juices. Vegetarian stalls are limited; arrive before 19:30 to be safe.',
  'faq.9.q': 'Can I order specialties shipped home / abroad?',
  'faq.9.a':
    'Yes. Message the official fanpage to order packaged specialties (dried mì Quảng, rice paper, mắm nêm sauce, frozen kem bơ) — domestic delivery and DHL Express international in 5–10 days.',

  // CTA
  'cta.eyebrow': 'See you under the Dragon Bridge',
  'cta.titlePre': 'A night in Đà Nẵng,',
  'cta.titleEm': 'starts right here',
  'cta.titlePost': '.',
  'cta.body':
    "17:30 the lanterns come on, 19:00 the grill smoke peaks, 22:30 the street band takes the stage. To book large groups, plan an event or arrange filming — message us on Messenger or call the management hotline.",
  'cta.btnMessenger': 'Message us',
  'cta.btnCall': 'Call +84 94 704 6556',
  'cta.specLabel': 'Practical info',
  'cta.spec1.l': 'Evening open',
  'cta.spec1.sub': 'Mon – Fri · weekends from 17:00',
  'cta.spec2.l': 'Regular close',
  'cta.spec2.sub': 'weekends extended to 23:59',
  'cta.spec3.l': 'Entrance fee',
  'cta.spec3.sub': 'free for all visitors',
  'cta.spec4.l': 'Motorbike spaces',
  'cta.spec4.sub': 'public parking along Mai Hắc Đế',
  'cta.spec3.v': 'Free',
  'cta.spec4.v': '~150',

  // Legal strip
  'legal.eyebrow': 'Transparency · Compliance',
  'legal.title': 'Legal commitments & customer data protection',
  'legal.intro':
    "Sơn Trà Night Market complies with Vietnam's Cyber-Information Security Law, Decree 13/2023/NĐ-CP on personal data protection, and Meta Platform Policy requirements. All legal documents are public.",
  'legal.requestDelete': 'Request data deletion',
  'legal.privacy.title': 'Privacy policy',
  'legal.privacy.desc':
    'What we collect, how long we keep it, who we share it with. GDPR-style + Vietnam Decree 13/2023/NĐ-CP compliant.',
  'legal.privacy.meta': 'Effective 25/05/2026',
  'legal.terms.title': 'Terms of service',
  'legal.terms.desc':
    'The legal contract between you and Sơn Trà Night Market. Customer, vendor, payment and refund responsibilities.',
  'legal.terms.meta': 'Effective 25/05/2026',
  'legal.delete.title': 'Data deletion guide',
  'legal.delete.desc':
    '3 ways to delete: self-service in account, email request, or remove the app from Facebook. Verified in 3 days, erased within 30.',
  'legal.delete.meta': 'Meta Data Deletion Callback',
  'legal.readMore': 'Read in full',
  'legal.entity.label': 'Operating entity',
  'legal.entity.name': 'DHTC Đà Nẵng JSC',
  'legal.entity.gpkd': 'Business license 0401234567 · Đà Nẵng DPI',
  'legal.hq.label': 'Head office',
  'legal.hq.address': 'Mai Hắc Đế × Lý Nam Đế, An Hải Tây Ward, Sơn Trà District, Đà Nẵng, Vietnam',
  'legal.email.label': 'Legal email',
  'legal.email.sub': 'DPO support & data deletion requests',
  'legal.hotline.label': 'Hotline',
  'legal.hotline.sub': '8:00 – 22:00 GMT+7 daily',

  // Footer
  'footer.brandDesc':
    "The largest night market in Đà Nẵng — an icon of central Vietnamese cuisine since 2018. Over 150 stalls, open every night at the foot of Dragon Bridge.",
  'footer.exploreLabel': 'Explore',
  'footer.exploreStory': 'The story',
  'footer.exploreFlavors': '8 must-try dishes',
  'footer.exploreZones': '4 zones',
  'footer.exploreEvents': 'A night, hour by hour',
  'footer.exploreVisit': 'How to get here',
  'footer.exploreFaq': 'FAQ',
  'footer.contactLabel': 'Contact & Legal',
  'footer.linkPrivacy': 'Privacy policy',
  'footer.linkTerms': 'Terms of service',
  'footer.linkDelete': 'Data deletion guide',
  'footer.copyright': '© 2026 Sơn Trà Night Market · Đà Nẵng · dhtcdanang.com',
  'footer.gpkd': 'Business license: 0401234567 · Đà Nẵng DPI',

  // Simple Navbar wrapper (authenticated shell)
  'navbar.brand': 'DHTC',
  'navbar.logout': 'Sign out',

  // Home (authenticated dashboard)
  'home.title': 'Dashboard',
  'home.logout': 'Sign out',
  'home.accountInfo': 'Account information',
  'home.fieldId': 'ID',
  'home.fieldEmail': 'Email',
  'home.fieldStatus': 'Status',
  'home.statusActive': 'Active',
  'home.statusLocked': 'Locked',
  'home.placeholder': 'More features coming soon.',

  // 404
  'notfound.title': 'Page not found',
  'notfound.sub': 'This URL is invalid or has been removed.',
  'notfound.back': 'Back to home',

  // Customer marketplace layout — nav
  'cust.nav.home': 'Home',
  'cust.nav.shop': 'Shop',
  'cust.nav.guide': 'Guide',
  'cust.nav.contact': 'Contact',

  // Customer marketplace layout — categories
  'cust.cat.all': 'All',
  'cust.cat.coffee': 'Coffee',
  'cust.cat.pepper': 'Pepper',
  'cust.cat.ginseng': 'Ginseng & herbs',
  'cust.cat.driedFruit': 'Dried fruits',
  'cust.cat.honey': 'Honey',
  'cust.cat.fishSauce': 'Fish sauce',
  'cust.cat.rice': 'Specialty rice',

  // Customer marketplace layout — account menu
  'cust.acc.account': 'Account',
  'cust.acc.orders': 'Orders',
  'cust.acc.logout': 'Sign out',
  'cust.acc.login': 'Sign in',

  // Customer marketplace layout — footer
  'cust.foot.brand': 'DHTC Đà Nẵng',
  'cust.foot.tagline':
    'Vietnamese specialty agricultural marketplace, connecting local merchants with global customers.',
  'cust.foot.productsLabel': 'Products',
  'cust.foot.supportLabel': 'Support',
  'cust.foot.contactLabel': 'Contact',
  'cust.foot.product1': 'Đắk Lắk Coffee',
  'cust.foot.product2': 'Gia Lai Pepper',
  'cust.foot.product3': 'Ngọc Linh Ginseng',
  'cust.foot.product4': 'Wild Forest Honey',
  'cust.foot.support1': 'Shipping policy',
  'cust.foot.support2': 'Returns & exchanges',
  'cust.foot.support3': 'Secure payment',
  'cust.foot.support4': 'Contact DHTC',
  'cust.foot.location': 'Đà Nẵng, Vietnam',
  'cust.foot.copyright': '© 2026 DHTC Đà Nẵng. All rights reserved.',

  // Facebook OAuth return page
  'fbReturn.errInvalidState': 'Your sign-in session expired or is invalid. Please try again.',
  'fbReturn.errCancelled': 'You cancelled the Facebook sign-in.',
  'fbReturn.errFbDown': 'Cannot reach Facebook. Please try again in a few minutes.',
  'fbReturn.errGeneric': 'Something went wrong. Please try again.',
  'fbReturn.errWithCode': 'Sign-in failed ({code}).',
  'fbReturn.title': 'Sign-in failed',
  'fbReturn.backToLogin': 'Back to sign-in',
  'fbReturn.completing': 'Completing sign-in…',

  // Login page
  'auth.login.title': 'Sign in',
  'auth.login.subtitle': 'Welcome back',
  'auth.login.emailLabel': 'Email',
  'auth.login.passwordLabel': 'Password',
  'auth.login.submit': 'Sign in',
  'auth.login.submitting': 'Signing in…',
  'auth.login.errCreds': 'Incorrect email or password. Please try again.',
  'auth.login.or': 'or',
  'auth.login.fbContinue': 'Continue with Facebook',
  'auth.login.noAccount': "Don't have an account?",
  'auth.login.registerLink': 'Sign up',
  'auth.login.terms': 'By signing in, you agree to our',
  'auth.login.termsLink': 'Terms of service',

  // Register page
  'auth.register.title': 'Create account',
  'auth.register.subtitle': 'Join the Vietnamese specialty marketplace',
  'auth.register.roleLabel': 'I am a',
  'auth.register.roleCustomer': 'Buyer',
  'auth.register.roleCustomerSub': 'Find & buy specialty goods',
  'auth.register.roleSeller': 'Seller',
  'auth.register.roleSellerSub': 'Sell your own products',
  'auth.register.emailLabel': 'Email',
  'auth.register.passwordLabel': 'Password',
  'auth.register.passwordHint': 'At least 8 characters',
  'auth.register.confirmLabel': 'Confirm password',
  'auth.register.confirmHint': 'Re-enter your password',
  'auth.register.submit': 'Sign up',
  'auth.register.submitting': 'Creating account…',
  'auth.register.errMismatch': 'Passwords do not match.',
  'auth.register.errShort': 'Password must be at least 8 characters.',
  'auth.register.errFail': 'Registration failed. The email may already be in use.',
  'auth.register.fbButton': 'Sign up with Facebook',
  'auth.register.haveAccount': 'Already have an account?',
  'auth.register.loginLink': 'Sign in',
}

export const messages: Record<Lang, Dict> = { vi, en }

export function pickInitialLang(): Lang {
  if (typeof window === 'undefined') return 'vi'
  try {
    const saved = window.localStorage.getItem('dhtc_lang') as Lang | null
    if (saved === 'vi' || saved === 'en') return saved
  } catch {
    // ignore SSR / private mode
  }
  const nav = window.navigator?.language?.toLowerCase() || ''
  // Vietnamese visitors stay in VI by default; everyone else gets EN.
  return nav.startsWith('vi') ? 'vi' : 'en'
}
