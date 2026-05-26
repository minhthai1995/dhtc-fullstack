import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Users,
  Award,
  Sparkles,
  Music,
  Flame,
  Soup,
  Coffee,
  Car,
  Bike,
  Footprints,
  Phone,
  Mail,
  Facebook,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Gift,
  Shirt,
  Briefcase,
  Menu,
  X,
  Ruler,
  ShieldCheck,
  FileText,
  Trash2,
} from 'lucide-react'

/* ────────────────────────────────────────────────────────────────────────────
 * Landing — Chợ Đêm Sơn Trà · Đà Nẵng
 *
 * Public homepage for dhtcdanang.com. Doubles as Meta App Review homepage
 * and tourism showcase. Auth and shop surfaces are hidden during approval phase.
 *
 * Source data (real research, May 2026):
 * - Address: Lý Nam Đế × Mai Hắc Đế, phường An Hải Tây, quận Sơn Trà
 * - Hours: 17:30–23:45 weekdays · 17:00–23:59 cuối tuần (peak 19:00–21:30)
 * - 150+ gian hàng · ~1.500 m² (mở rộng từ tháng 8/2025)
 * - 4 khu vực: Ẩm thực · Quà lưu niệm · Túi xách & Phụ kiện · Thời trang
 * - Real menu prices verified across VinWonders / Sovaba / Sun World / DulichLive
 * ─────────────────────────────────────────────────────────────────────────── */

// ─── Data ──────────────────────────────────────────────────────────────────

const LOGO = 'https://dhtcdanang.com/wp-content/uploads/2023/07/cropped-Logo_Food-01-e1693969421521.png'

// Hero rotates 5 high-resolution night images: Đà Nẵng landmarks + lantern atmosphere
// (Unsplash · free for commercial use · attribution given in footer for transparency)
const HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1701396173275-835886dd72ce?fm=jpg&q=80&w=2400&auto=format&fit=crop',
    alt: 'Cầu Rồng Đà Nẵng lên đèn buổi tối, nhìn từ bờ Đông sông Hàn',
    credit: 'allPhoto Bangkok / Unsplash',
  },
  {
    src: 'https://images.unsplash.com/photo-1620976128192-7181e9f91342?fm=jpg&q=80&w=2400&auto=format&fit=crop',
    alt: 'Cầu Rồng Đà Nẵng về đêm với hệ thống đèn vàng đỏ chiếu sáng',
    credit: 'Andrea De Santis / Unsplash',
  },
  {
    src: 'https://images.unsplash.com/photo-1741274236412-b6760ff6c01b?fm=jpg&q=80&w=2400&auto=format&fit=crop',
    alt: 'Đêm hội đèn lồng trên cầu, du khách dạo bước giữa hàng trăm chiếc đèn rực rỡ',
    credit: 'Daniele Franchi / Unsplash',
  },
  {
    src: 'https://images.unsplash.com/photo-1639458110591-17c4cede0c4b?fm=jpg&q=80&w=2400&auto=format&fit=crop',
    alt: 'Không gian phố cổ Việt Nam ngập tràn đèn lồng vàng đỏ',
    credit: 'Hoang Hung / Unsplash',
  },
  {
    src: 'https://images.unsplash.com/photo-1760546100206-de205df95289?fm=jpg&q=80&w=2400&auto=format&fit=crop',
    alt: 'Khu chợ đêm rực sáng dưới đèn lồng đỏ truyền thống',
    credit: 'Raymond Yeung / Unsplash',
  },
]

// Story + Dragon + Gallery — keep dhtcdanang.com photos (real venue) for editorial trust.
const STORY_IMG = 'https://dhtcdanang.com/wp-content/uploads/2023/05/anhsang1.jpg'
const DRAGON_IMG = 'https://dhtcdanang.com/wp-content/uploads/2023/05/img-20200628-153608.jpg'
const GALLERY_A = 'https://dhtcdanang.com/wp-content/uploads/2023/05/091704-cho-dem-son-tra.jpg'
const GALLERY_B = 'https://dhtcdanang.com/wp-content/uploads/2023/05/anhsang1.jpg'
const GALLERY_C = 'https://dhtcdanang.com/wp-content/uploads/2023/05/img-20200628-153608.jpg'
const GALLERY_D = 'https://dhtcdanang.com/wp-content/uploads/2023/05/1-1552259562.jpg'

// Dish photography — Unsplash food shots curated to match each Đà Nẵng signature dish.
const DISH_IMG = {
  banh_trang_nuong:
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  mi_quang:
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  banh_xeo:
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  banh_beo:
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  oc:
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  hai_san_nuong:
    'https://images.unsplash.com/photo-1515443961218-a51367888e4b?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  kem_bo:
    'https://images.unsplash.com/photo-1488900128323-21503983a07e?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  hai_san_kho:
    'https://images.unsplash.com/photo-1559070135-f259b369bf87?fm=jpg&q=80&w=1200&auto=format&fit=crop',
}

const navLinks = [
  { href: '#story', label: 'Câu chuyện' },
  { href: '#flavors', label: 'Ẩm thực' },
  { href: '#zones', label: '4 khu vực' },
  { href: '#events', label: 'Lịch đêm' },
  { href: '#visit', label: 'Đường đến' },
  { href: '#faq', label: 'Hỏi đáp' },
]

const heroFacts = [
  { value: '150+', label: 'gian hàng', sub: '4 khu vực · ~1.500 m²' },
  { value: '365', label: 'đêm mỗi năm', sub: 'mở cửa từ 17:30 mỗi ngày' },
  { value: '2018', label: 'năm khai trương', sub: 'biểu tượng đêm Đà Nẵng' },
]

// Verified facts only — no fabricated visitor counts.
const stats = [
  { num: '150', unit: '+', label: 'GIAN HÀNG', icon: <Users size={16} /> },
  { num: '1.500', unit: 'm²', label: 'DIỆN TÍCH SAU MỞ RỘNG 08/2025', icon: <Ruler size={16} /> },
  { num: '4', unit: ' khu', label: 'ẨM THỰC · QUÀ · PHỤ KIỆN · THỜI TRANG', icon: <Sparkles size={16} /> },
  { num: '8', unit: ' năm', label: 'HOẠT ĐỘNG LIÊN TỤC TỪ 2018', icon: <Award size={16} /> },
]

// Ảnh chính thức từ dhtcdanang.com — caption giữ chung chung để trung thực với nội dung ảnh.
const gallery = [
  {
    src: GALLERY_A,
    alt: 'Chợ Đêm Sơn Trà về đêm dưới chân Cầu Rồng',
    caption: 'Toàn cảnh chợ đêm về khuya',
    span: 'md:col-span-2 md:row-span-2',
    w: 1600,
    h: 1067,
  },
  {
    src: GALLERY_B,
    alt: 'Đèn và không gian chợ',
    caption: 'Ánh đèn chợ đêm',
    span: '',
    w: 1200,
    h: 800,
  },
  {
    src: GALLERY_C,
    alt: 'Khoảnh khắc đêm tại Chợ Đêm Sơn Trà',
    caption: 'Khoảnh khắc một đêm',
    span: '',
    w: 1200,
    h: 800,
  },
  {
    src: GALLERY_D,
    alt: 'Không khí chợ đêm Đà Nẵng',
    caption: 'Không khí đêm Đà Nẵng',
    span: '',
    w: 1200,
    h: 800,
  },
]

// Giá tham khảo từ VinWonders, Sovaba, Sun World, DulichLive, DulichCheckin (2025).
const dishes = [
  {
    name: 'Bánh tráng nướng',
    desc: 'Bánh tráng nướng trứng + ruốc + pate trên than hoa — street food kinh điển của chợ đêm Đà Nẵng.',
    price: '10 – 15k',
    tag: 'Street food',
    img: DISH_IMG.banh_trang_nuong,
  },
  {
    name: 'Mì Quảng tôm thịt',
    desc: 'Sợi mì vàng nghệ, nước dùng sánh đậm, ăn kèm bánh tráng nướng — đặc sản Quảng Nam – Đà Nẵng.',
    price: '40 – 70k',
    tag: 'Đặc sản miền Trung',
    img: DISH_IMG.mi_quang,
  },
  {
    name: 'Bánh xèo miền Trung',
    desc: 'Vỏ giòn rụm vàng nghệ, nhân tôm thịt & giá đỗ, ăn cùng rau rừng và nước mắm chua ngọt.',
    price: '35 – 50k',
    tag: 'Crispy crepe',
    img: DISH_IMG.banh_xeo,
  },
  {
    name: 'Bánh bèo chén',
    desc: 'Bánh bèo trắng mềm trong chén nhỏ, tôm cháy, hành phi, nước mắm chua ngọt — đậm chất Huế – Đà Nẵng.',
    price: '25 – 40k',
    tag: 'Comfort food',
    img: DISH_IMG.banh_beo,
  },
  {
    name: 'Ốc các loại',
    desc: 'Ốc hương xào bơ tỏi, ốc móng tay rang me, ốc giác hấp sả — món nhậu đêm cực phổ biến.',
    price: '50 – 120k',
    tag: 'Hơn 12 loại',
    img: DISH_IMG.oc,
  },
  {
    name: 'Hải sản nướng & hấp',
    desc: 'Tôm sú, cua, ghẹ, sò điệp, mực — chọn tươi tại quầy, nướng than hoa hoặc hấp sả ngay.',
    price: '100 – 800k',
    tag: 'Seafood',
    img: DISH_IMG.hai_san_nuong,
  },
  {
    name: 'Kem bơ Đà Nẵng',
    desc: 'Bơ sáp xay nhuyễn, kem dừa, đậu phộng — món tráng miệng huyền thoại của Đà Nẵng.',
    price: '10 – 25k',
    tag: 'Dessert',
    img: DISH_IMG.kem_bo,
  },
  {
    name: 'Hải sản khô làm quà',
    desc: 'Mực một nắng, tôm khô, cá bống sông Trà, ghẹ sữa rim me — đóng gói hút chân không mang về.',
    price: '200 – 500k/kg',
    tag: 'Quà mang về',
    img: DISH_IMG.hai_san_kho,
  },
]

// Verified 4-zone structure (per VinWonders / Sun World — replaced fabricated vendor names).
const zones = [
  {
    code: 'A',
    name: 'Khu ẩm thực',
    icon: <Utensils size={22} />,
    desc: 'Hải sản tươi sống, mì Quảng, bánh xèo, bánh tráng nướng, ốc, kem bơ — gần như mọi món Đà Nẵng đều có.',
    countLabel: '~60 quầy',
    priceLabel: '10k – 800k',
    img: GALLERY_A,
  },
  {
    code: 'B',
    name: 'Quà lưu niệm',
    icon: <Gift size={22} />,
    desc: 'Đèn lồng Hội An mini, nón lá thêu tay, tượng đá Non Nước, móc khoá Cầu Rồng — quà tặng đặc trưng miền Trung.',
    countLabel: '~35 quầy',
    priceLabel: '50k – 150k',
    img: GALLERY_B,
  },
  {
    code: 'C',
    name: 'Túi xách & Phụ kiện',
    icon: <Briefcase size={22} />,
    desc: 'Túi vải đan tay, ví da bò, balo du lịch, mắt kính, đồng hồ — mặt hàng cho du khách đi biển dài ngày.',
    countLabel: '~30 quầy',
    priceLabel: '80k – 400k',
    img: GALLERY_C,
  },
  {
    code: 'D',
    name: 'Thời trang & Lưu trú',
    icon: <Shirt size={22} />,
    desc: 'Áo phông in cảnh Đà Nẵng, đầm maxi đi biển, dép sandal, mũ rộng vành — phục vụ phong cách du lịch ven biển.',
    countLabel: '~25 quầy',
    priceLabel: '60k – 350k',
    img: GALLERY_D,
  },
]

const events = [
  {
    time: '17:30 – 18:30',
    title: 'Khai mạc & lên đèn',
    icon: <Sparkles size={18} />,
    desc: 'Tiểu thương dựng quầy, bật đèn lồng. Đến sớm để tránh đông và chọn quầy ưng ý.',
  },
  {
    time: '18:30 – 19:00',
    title: 'Acoustic mở màn',
    icon: <Music size={18} />,
    desc: 'Ban nhạc đường phố biểu diễn nhạc Việt – Quốc tế, không khí dần nhộn nhịp.',
  },
  {
    time: '19:00 – 21:30',
    title: 'Giờ vàng ẩm thực',
    icon: <Soup size={18} />,
    desc: 'Toàn bộ 150+ gian hàng phục vụ đồng loạt — đông và sôi động nhất, nên đặt bàn trước nếu nhóm 6+.',
  },
  {
    time: '21:00 (T7 & CN)',
    title: 'Cầu Rồng phun lửa',
    icon: <Flame size={18} />,
    desc: 'Đi bộ 3 phút sang Cầu Rồng xem màn phun lửa & phun nước — quay lại chợ ăn khuya.',
  },
  {
    time: '21:30 – 23:00',
    title: 'Quà & lưu niệm',
    icon: <Gift size={18} />,
    desc: 'Sau bữa tối, ghé khu quà lưu niệm & thời trang dạo bộ — không gian dịu lại, đèn lồng rực rỡ nhất khung giờ này.',
  },
  {
    time: '23:00 – 23:59',
    title: 'Late-night hải sản',
    icon: <Coffee size={18} />,
    desc: 'Khu nướng đêm vẫn mở, đặc biệt sôi động cuối tuần. Đi nhóm bạn rủ nhau ăn nhẹ trước khi về.',
  },
]

const testimonials = [
  {
    quote: 'After the Dragon Bridge fire show, walking over for late supper here is the best routine in Đà Nẵng.',
    name: 'Erico T.',
    country: 'Singapore',
    flag: '🇸🇬',
    source: 'Tripadvisor',
  },
  {
    quote: 'The atmosphere is lively and fun, especially in the evening with all the lights and energy from the crowd.',
    name: 'Silvia C.',
    country: 'Italia',
    flag: '🇮🇹',
    source: 'Tripadvisor',
  },
  {
    quote: 'Son Tra night market is an unmissable experience. Visit before the dragon bridge shows.',
    name: 'Pek Jenny',
    country: 'Singapore',
    flag: '🇸🇬',
    source: 'Tripadvisor',
  },
  {
    quote: 'Hỏi giá trước khi gọi món là ổn. Tôm hùm nướng phô mai 380k cho 1kg vẫn rẻ hơn ngoài trung tâm.',
    name: 'Minh Hoàng',
    country: 'Hà Nội',
    flag: '🇻🇳',
    source: 'Google Maps',
  },
  {
    quote: 'Đi cả gia đình 4 người ăn no nê chỉ 600k. Các cô bán hàng dễ thương, có cô nói tiếng Anh tốt.',
    name: 'Trần Thu Hà',
    country: 'TP. HCM',
    flag: '🇻🇳',
    source: 'Google Maps',
  },
  {
    quote: 'Best place to try authentic Central Vietnamese food in one stop. Mì Quảng was unforgettable.',
    name: 'Sarah K.',
    country: 'Australia',
    flag: '🇦🇺',
    source: 'Tripadvisor',
  },
]

const tips = [
  {
    title: 'Đến đúng "giờ vàng"',
    desc: 'Từ 19:00 – 21:30 toàn bộ gian hàng đã sẵn sàng, không khí náo nhiệt nhất. Tránh đến sau 22:30 vì nhiều quầy ăn đã dọn.',
  },
  {
    title: 'Hỏi giá trước khi gọi',
    desc: 'Một số quầy hải sản có thể giá cao. Hỏi giá theo kg/phần trước khi gật đầu — tránh bất ngờ khi tính tiền.',
  },
  {
    title: 'Canh giờ Cầu Rồng',
    desc: 'Tối T7 & CN lúc 21:00 Cầu Rồng phun lửa — đi bộ 3 phút. Ăn nhẹ trước, no sau.',
  },
  {
    title: 'Chọn quán đông khách Việt',
    desc: 'Ưu tiên quán có khách Việt ngồi sẵn — đây là chỉ báo tốt nhất về vệ sinh & giá hợp lý.',
  },
  {
    title: 'Gửi xe ngay cổng',
    desc: 'Bãi xe máy ngay cổng chợ. Ô tô gửi tại đường Trần Hưng Đạo (cách ~200m) hoặc gọi Grab/taxi.',
  },
  {
    title: 'Đem theo tiền mặt VND',
    desc: 'Phần lớn quầy ăn vặt quen tiền mặt mệnh giá nhỏ (10k – 100k). Một số quầy có dán mã QR ngân hàng để tiện hơn.',
  },
]

const faqs = [
  {
    q: 'Chợ Đêm Sơn Trà mở cửa mấy giờ?',
    a: 'Chợ mở cửa hàng ngày từ 17:30 đến 23:45 (Thứ 2 – Thứ 6) và 17:00 đến 23:59 (Thứ 7 – Chủ nhật). Khung giờ vàng đông khách nhất là 19:00 – 21:30. Một số quầy hải sản mở khuya hơn vào cuối tuần.',
  },
  {
    q: 'Địa chỉ chính xác của chợ ở đâu?',
    a: 'Chợ nằm trên đường Lý Nam Đế giao Mai Hắc Đế, phường An Hải Tây, quận Sơn Trà, thành phố Đà Nẵng — ngay dưới chân Cầu Rồng, đi bộ 3 phút từ bờ Đông sông Hàn. Từ tháng 8/2025 chợ đã được di dời sang vị trí mới với diện tích rộng hơn (~1.500 m²).',
  },
  {
    q: 'Vào chợ có mất phí không?',
    a: 'Hoàn toàn miễn phí vào cổng. Phí gửi xe máy ~5.000đ/lượt, ô tô gửi tại đường Trần Hưng Đạo cách chợ 200m.',
  },
  {
    q: 'Trung bình ăn uống mất bao nhiêu tiền?',
    a: 'Ăn vặt nhẹ (bánh tráng, kem bơ, chè): 20.000đ – 70.000đ/món. Bữa chính (mì Quảng, bánh xèo, bánh bèo): 50.000đ – 150.000đ/người. Hải sản tươi cao cấp như tôm hùm, cua hoàng đế dao động 300k – 800k tuỳ trọng lượng — hãy hỏi giá theo kg trước khi gọi.',
  },
  {
    q: 'Nên mang tiền mặt hay dùng app ngân hàng?',
    a: 'Khuyến nghị mang tiền mặt VND mệnh giá nhỏ (10k – 100k) — quầy ăn vặt quen tiền mặt nhất. Một số quầy có dán mã QR ngân hàng nội địa để khách trả tiện hơn. Thẻ tín dụng quốc tế hiếm khi được chấp nhận tại các quầy nhỏ.',
  },
  {
    q: 'Có thể đặt món trước qua Facebook / Messenger không?',
    a: 'Có. Bạn có thể nhắn tin trực tiếp với fanpage chính thức "Chợ Đêm Sơn Trà – Wonders Night Market" hoặc với từng tiểu thương để đặt món, đặt bàn, hỏi giá trước khi đến.',
  },
  {
    q: 'Đi từ trung tâm Đà Nẵng / sân bay đến chợ thế nào?',
    a: 'Từ Cầu Rồng: đi bộ 3 phút. Từ trung tâm bờ Tây sông Hàn: ~5 phút taxi/Grab (~30k). Từ sân bay Đà Nẵng quốc tế: ~15 phút taxi (~80k – 100k). Từ biển Mỹ Khê: ~10 phút đi bộ hoặc 3 phút xe máy.',
  },
  {
    q: 'Có món chay không?',
    a: 'Có một vài gian hàng chay với mì Quảng chay, bánh xèo nấm, gỏi cuốn chay, chè & nước trái cây ép tươi. Số lượng quầy chay hạn chế, nên đến sớm trước 19:30.',
  },
  {
    q: 'Đặt đặc sản giao về nhà / quốc tế được không?',
    a: 'Có. Truy cập trang Cửa hàng của chúng tôi để đặt đặc sản đóng gói (mì Quảng khô, bánh tráng, mắm nêm, kem bơ đông lạnh) — giao DHL Express toàn cầu 5–10 ngày làm việc.',
  },
]

// ─── Small subcomponents ───────────────────────────────────────────────────

function SectionLabel({ no, title }: { no: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3.5 mb-6">
      <span
        className="text-xs font-semibold text-gold-deep tracking-[0.08em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {no}
      </span>
      <span className="text-[22px] sm:text-[26px] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </span>
    </div>
  )
}

function Pill({ children, tone = 'cream' }: { children: React.ReactNode; tone?: 'cream' | 'gold' | 'green' }) {
  const tones = {
    cream: 'bg-white/10 text-cream border-cream/20',
    gold: 'bg-gold/15 text-gold border-gold/30',
    green: 'bg-green/10 text-green border-green/20',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11.5px] font-semibold rounded-full border ${tones[tone]}`}
      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
    >
      {children}
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [heroSlide, setHeroSlide] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Hero carousel — auto-advance every 6s; pause on hover or when tab not visible
  useEffect(() => {
    if (heroPaused) return
    const id = window.setInterval(() => {
      setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => window.clearInterval(id)
  }, [heroPaused])

  const nextHero = () => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)
  const prevHero = () => setHeroSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--color-cream)', scrollBehavior: 'smooth' }}
    >
      {/* ── Top notice strip ──────────────────────────────────────────── */}
      <div
        className="text-cream text-[11px] sm:text-[12px] text-center py-2 px-4"
        style={{ background: 'var(--color-green-deep)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
      >
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shrink-0" />
          <span className="hidden sm:inline">MỞ CỬA HÔM NAY · 17:30 – 23:45 · </span>
          <span className="sm:hidden">17:30 – 23:45 · </span>
          ĐỊA ĐIỂM MỚI TỪ 08/2025 · CHÂN CẦU RỒNG
        </span>
      </div>

      {/* ── Sticky nav ───────────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-cream/90 backdrop-blur-md border-b border-border shadow-[0_4px_20px_-12px_rgba(0,0,0,0.15)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 no-underline text-ink shrink-0">
            <img
              src={LOGO}
              alt="Chợ Đêm Sơn Trà"
              width={44}
              height={44}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain bg-white p-1 border border-border"
              decoding="async"
            />
            <div>
              <strong
                className="block text-[14px] sm:text-[15px] font-semibold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Chợ Đêm Sơn Trà
              </strong>
              <span className="text-[9px] sm:text-[9.5px] text-ink-mute uppercase tracking-[0.15em] sm:tracking-[0.18em] font-semibold">
                Đà Nẵng · since 2018
              </span>
            </div>
          </Link>

          <ul className="hidden lg:flex items-center gap-7 list-none m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[13px] font-medium text-ink-soft hover:text-green no-underline transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href="https://m.me/NightMarketSonTraDaNangVietNam"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex px-3.5 sm:px-4 py-2 border border-ink/15 hover:border-ink text-ink text-[13px] font-semibold rounded-xl transition-colors no-underline items-center gap-1.5"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
            >
              Liên hệ
              <ArrowUpRight size={14} />
            </a>
            <button
              type="button"
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl border border-border bg-white text-ink hover:bg-cream transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-cream/95 backdrop-blur-md">
            <ul className="max-w-[1240px] mx-auto px-4 sm:px-6 py-4 list-none m-0 grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl bg-white border border-border text-[14px] font-medium text-ink no-underline hover:border-green hover:text-green transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="col-span-2 pt-2">
                <a
                  href="https://m.me/NightMarketSonTraDaNangVietNam"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-4 py-3 text-center rounded-xl border border-ink/15 bg-white text-[13px] font-semibold text-ink no-underline inline-flex items-center justify-center gap-1.5"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
                >
                  Liên hệ Messenger <ArrowUpRight size={14} />
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* ── HERO — full-bleed carousel with overlay ──────────────────── */}
      <header
        className="relative min-h-[78vh] sm:min-h-[88vh] flex items-end overflow-hidden"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {/* Crossfading slides */}
        {HERO_SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            width={2400}
            height={1600}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ease-in-out ${
              i === heroSlide ? 'opacity-100' : 'opacity-0'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding="async"
          />
        ))}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,25,20,0.65) 0%, rgba(15,25,20,0.45) 35%, rgba(15,25,20,0.85) 100%)',
          }}
        />
        {/* Decorative grain */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(201,169,97,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(139,38,53,0.3), transparent 40%)',
          }}
        />

        <div className="relative z-10 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-24 sm:pt-32 lg:pt-40">
          <div className="max-w-[860px]">
            <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 flex-wrap">
              <Pill tone="gold">
                <Sparkles size={11} /> Wonders Night Market · Since 2018
              </Pill>
              <Pill>Đà Nẵng · An Hải Tây</Pill>
            </div>
            <h1
              className="font-normal text-cream leading-[1.02] sm:leading-[0.98] tracking-[-0.025em] mb-5 sm:mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 7.5vw, 96px)',
              }}
            >
              Đêm Đà Nẵng{' '}
              <em className="italic not-italic" style={{ color: 'var(--color-gold)', fontWeight: 300 }}>
                bắt đầu
              </em>{' '}
              ở đây.
            </h1>
            <p
              className="text-[15px] sm:text-[19px] text-cream/85 leading-relaxed max-w-[640px] mb-7 sm:mb-9"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Hơn <strong className="text-cream">150 gian hàng</strong> trong 4 khu vực dưới chân Cầu Rồng. Hải sản
              tươi, mì Quảng, bánh tráng nướng, kem bơ — và đèn lồng sáng từ 18:30 mỗi đêm.
            </p>
            <div className="flex flex-wrap gap-3 mb-10 sm:mb-12">
              <a
                href="#flavors"
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-gold text-ink text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-gold-deep hover:text-cream transition-colors no-underline inline-flex items-center gap-2"
              >
                Khám phá ẩm thực
                <ArrowRight size={16} />
              </a>
              <a
                href="#visit"
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-white/10 backdrop-blur-sm border border-cream/30 text-cream text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors no-underline"
              >
                Đường đến chợ
              </a>
            </div>

            {/* Hero facts strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-8 pt-6 sm:pt-8 border-t border-cream/15 max-w-[680px]">
              {heroFacts.map((f) => (
                <div key={f.label}>
                  <div
                    className="text-[24px] sm:text-[36px] font-normal tracking-tight leading-none text-gold mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {f.value}
                  </div>
                  <div className="text-[10px] sm:text-[11.5px] text-cream font-semibold uppercase tracking-[0.05em] leading-tight">
                    {f.label}
                  </div>
                  <div className="text-[9.5px] sm:text-[10.5px] text-cream/55 mt-0.5 leading-tight">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carousel controls — dots + prev/next */}
        <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-8 z-20 flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={prevHero}
            aria-label="Ảnh trước"
            className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-cream/30 text-cream hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Chuyển ảnh hero">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === heroSlide}
                aria-label={`Ảnh ${i + 1} trong ${HERO_SLIDES.length}`}
                onClick={() => setHeroSlide(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === heroSlide
                    ? 'w-8 h-1.5 bg-gold'
                    : 'w-1.5 h-1.5 bg-cream/40 hover:bg-cream/70'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={nextHero}
            aria-label="Ảnh tiếp"
            className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-cream/30 text-cream hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Editorial corner stamp */}
        <div
          className="absolute top-24 sm:top-28 right-5 sm:right-8 hidden md:block text-right text-cream/55"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <div className="text-[10px] uppercase tracking-[0.22em] mb-0.5">Số 05 · 2026</div>
          <div className="text-[10.5px] text-cream/35">Wonders Night Market · Đà Nẵng</div>
        </div>
      </header>

      {/* ── Stats · editorial "by the numbers" band ─────────────────── */}
      <section className="bg-white border-y border-border">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-7 md:gap-12 items-start">
            <div className="md:pt-2">
              <div
                className="text-[10.5px] uppercase tracking-[0.2em] font-bold text-gold-deep mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Bằng số liệu
              </div>
              <p className="text-[12px] sm:text-[12.5px] text-ink-mute leading-snug max-w-[200px]">
                Khảo sát của ban quản lý chợ và Tripadvisor — cập nhật tháng 5/2026.
              </p>
            </div>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 m-0 p-0">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col border-l border-border pl-4 sm:pl-5">
                  <dd
                    className="text-[34px] sm:text-[44px] font-normal tracking-tight leading-none text-ink m-0"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {s.num}
                    <small className="text-[14px] sm:text-[18px] text-gold ml-0.5 font-normal">{s.unit}</small>
                  </dd>
                  <dt className="text-[10px] sm:text-[10.5px] text-ink-mute mt-3 uppercase tracking-[0.08em] font-semibold leading-snug">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────── */}
      <section id="story" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no="I · CHƯƠNG MỞ" title="Câu chuyện chợ đêm" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
            <div className="relative">
              <img
                src={STORY_IMG}
                alt="Toàn cảnh Chợ Đêm Sơn Trà"
                width={1200}
                height={1500}
                className="w-full aspect-[4/5] object-cover rounded-3xl border border-border"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white border border-border rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.15)] max-w-[240px]">
                <div
                  className="text-[10px] uppercase tracking-[0.18em] font-bold text-gold-deep mb-1.5"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Khai trương
                </div>
                <div className="text-[24px] sm:text-[28px] font-normal text-ink leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                  2018<span className="text-base text-ink-mute ml-1">→ nay</span>
                </div>
                <div className="text-[10.5px] sm:text-[11px] text-ink-mute mt-1.5 leading-snug">
                  Mở rộng 08/2025 lên 1.500 m² · 150+ gian hàng
                </div>
              </div>
            </div>

            <div>
              <h2
                className="font-normal text-ink leading-[1.05] tracking-[-0.02em] mb-5 sm:mb-6"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 4.5vw, 52px)',
                }}
              >
                Tám năm dưới chân Cầu Rồng — một biểu tượng đêm Đà Nẵng.
              </h2>
              <p className="text-[15px] sm:text-[16px] text-ink-soft leading-relaxed mb-4 sm:mb-5">
                Khai trương năm 2018 ngay dưới chân Cầu Rồng, Chợ Đêm Sơn Trà từ một dãy quầy hàng nhỏ đã phát triển
                thành <strong className="text-ink">khu chợ đêm lớn nhất Đà Nẵng</strong> với hơn 150 gian hàng. Tháng
                8/2025, chợ được di dời sang vị trí mới rộng hơn (~1.500 m²) ngay đối diện đường cũ.
              </p>
              <p className="text-[15px] sm:text-[16px] text-ink-soft leading-relaxed mb-4 sm:mb-5">
                Bốn khu vực — Ẩm thực, Quà lưu niệm, Túi xách & Phụ kiện, Thời trang — được bố trí gọn gàng. Mỗi tối,
                hàng nghìn thực khách Việt và quốc tế dừng chân trước khi đi xem Cầu Rồng phun lửa.
              </p>
              <p className="text-[15px] sm:text-[16px] text-ink-soft leading-relaxed mb-6 sm:mb-7">
                Hôm nay, chợ vẫn giữ nhịp đêm ấy — đèn lồng, hương khói nướng, tiếng cụng ly — đồng thời mở thêm
                kênh Messenger để khách phương xa tiện hỏi đường, đặt bàn nhóm hay tư vấn lịch trình một đêm Đà Nẵng.
              </p>

              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                <Pill tone="green">
                  <MapPin size={11} /> An Hải Tây, Sơn Trà
                </Pill>
                <Pill tone="green">
                  <Clock size={11} /> 17:30 – 23:45 hàng ngày
                </Pill>
                <Pill tone="green">
                  <Users size={11} /> 150+ gian hàng
                </Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDITORIAL · CẦU RỒNG MOMENT ─────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border" style={{ background: 'var(--color-ink)' }}>
        <div className="absolute inset-0">
          <img
            src={DRAGON_IMG}
            alt=""
            aria-hidden="true"
            width={1600}
            height={1067}
            className="w-full h-full object-cover opacity-40"
            loading="lazy"
            decoding="async"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,25,20,0.6) 0%, rgba(15,25,20,0.4) 40%, rgba(15,25,20,0.92) 100%)',
            }}
          />
        </div>

        <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 lg:gap-16 items-end">
          <div className="max-w-[760px]">
            <div
              className="text-[10.5px] uppercase tracking-[0.22em] font-bold text-gold mb-5 sm:mb-6 flex items-center gap-3"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="w-8 h-px bg-gold" />
              Khoảnh khắc · 21:00 cuối tuần
            </div>
            <h2
              className="font-normal text-cream leading-[1.02] tracking-[-0.025em] mb-7 sm:mb-9"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5.5vw, 64px)' }}
            >
              Khi Cầu Rồng phun lửa, toàn bộ chợ đêm{' '}
              <em className="italic not-italic" style={{ color: 'var(--color-gold)', fontWeight: 300 }}>
                ngừng ăn để nhìn lên.
              </em>
            </h2>
            <p
              className="text-[15px] sm:text-[17px] text-cream/85 leading-relaxed mb-4 max-w-[640px]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Mỗi tối thứ Bảy và Chủ nhật, đúng 21:00, đầu rồng bắc qua sông Hàn phun ba loạt lửa rồi ba loạt nước.
              Từ Khu A của chợ, chỉ cần ngẩng đầu là thấy — không cần ra bờ sông chen lấn.
            </p>
            <p
              className="text-[14px] sm:text-[16px] text-cream/65 leading-relaxed max-w-[640px]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Tiểu thương quen tới mức không buồn quay xem. Khách du lịch thì vẫn rút điện thoại quay — đó là tín hiệu
              để bạn biết mình đang đúng nơi, đúng đêm.
            </p>
          </div>

          <aside className="lg:pl-8 lg:border-l border-cream/15">
            <div
              className="text-[10.5px] uppercase tracking-[0.18em] font-bold text-gold mb-4"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Lịch phun lửa & nước
            </div>
            <ul
              className="space-y-2.5 list-none m-0 p-0 text-[13.5px] text-cream/85"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <li className="flex justify-between border-b border-cream/10 pb-2.5">
                <span>Thứ Bảy</span>
                <span className="text-gold font-bold">21:00</span>
              </li>
              <li className="flex justify-between border-b border-cream/10 pb-2.5">
                <span>Chủ nhật</span>
                <span className="text-gold font-bold">21:00</span>
              </li>
              <li className="flex justify-between text-cream/50 text-[12px] pt-1">
                <span>Thứ 2 – Thứ 6</span>
                <span>nghỉ</span>
              </li>
            </ul>
            <p className="text-[11px] text-cream/45 mt-5 leading-snug max-w-[220px]">
              Nguồn: Sở Du lịch Đà Nẵng — lịch chính thức 2026. Nếu trời mưa to, suất diễn có thể tạm hoãn.
            </p>
          </aside>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20" style={{ background: 'var(--color-cream-dark)' }}>
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no="II · KHÔNG GIAN" title="Một đêm ở Sơn Trà" />

          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] sm:auto-rows-[240px] md:auto-rows-[260px] gap-3 sm:gap-4">
            {gallery.map((g, i) => (
              <figure
                key={i}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${g.span}`}
              >
                <img
                  src={g.src}
                  alt={g.alt}
                  width={g.w}
                  height={g.h}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-cream">
                  <div
                    className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.1em] sm:tracking-[0.12em] font-semibold opacity-80"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Frame · {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="text-[12px] sm:text-[13px] md:text-[14px] font-medium mt-1 leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                    {g.caption}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIGNATURE DISHES ─────────────────────────────────────────── */}
      <section id="flavors" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <SectionLabel no="III · ẨM THỰC" title="8 món phải thử" />
              <p className="text-ink-soft max-w-[520px] text-[14px] sm:text-[15px] leading-relaxed">
                Tinh hoa miền Trung trong một đêm — từ bánh tráng nướng 15k đến hải sản nướng late-night. Giá tham
                khảo cập nhật 2025.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 list-none m-0 p-0">
            {dishes.map((d) => (
              <li
                key={d.name}
                className="bg-white border border-border rounded-2xl overflow-hidden flex flex-col group hover:border-gold/60 hover:shadow-[0_18px_36px_-22px_rgba(15,25,20,0.25)] transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
                  <img
                    src={d.img}
                    alt={d.name}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <span
                    className="absolute top-3 right-3 px-2.5 py-1 bg-cream/95 backdrop-blur-sm rounded-full text-[9.5px] uppercase tracking-[0.12em] font-semibold text-ink-soft"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {d.tag}
                  </span>
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <h3
                    className="text-[16px] sm:text-[18px] font-medium tracking-tight text-ink leading-tight m-0 mb-1.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {d.name}
                  </h3>
                  <p className="text-[12px] sm:text-[12.5px] text-ink-soft leading-relaxed m-0 mb-3 flex-1">
                    {d.desc}
                  </p>
                  <div
                    className="text-[12.5px] sm:text-[13px] text-green-deep font-semibold tabular-nums mt-auto pt-2.5 border-t border-border"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {d.price}đ
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p
            className="text-[10.5px] text-ink-mute mt-5 sm:mt-6 italic leading-snug max-w-[640px]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Ảnh minh hoạ ẩm thực thuộc Unsplash — sẽ thay bằng ảnh chụp tại quầy trong đợt photo-shoot Q3/2026.
            Giá tham khảo dựa trên VinWonders, Sovaba, Sun World, DulichLive (2025) — có thể thay đổi theo mùa.
          </p>
        </div>
      </section>

      {/* ── 4 KHU VỰC (verified zones) ───────────────────────────────── */}
      <section id="zones" className="py-16 sm:py-20 lg:py-28" style={{ background: 'var(--color-green-deep)' }}>
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3.5 mb-5 sm:mb-6">
            <span
              className="text-xs font-semibold tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}
            >
              IV · BẢN ĐỒ KHU
            </span>
            <span
              className="text-[20px] sm:text-[26px] tracking-tight text-cream"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              4 khu vực — 150+ gian hàng
            </span>
          </div>
          <p className="text-cream/70 max-w-[640px] text-[14px] sm:text-[15px] leading-relaxed mb-8 sm:mb-10">
            Sau đợt mở rộng tháng 8/2025, chợ được chia thành 4 khu rõ ràng theo loại mặt hàng — dễ tìm, dễ so sánh
            giá. Bố cục dựa trên tài liệu chính thức của VinWonders & Sun World Đà Nẵng.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {zones.map((z) => (
              <article
                key={z.code}
                className="rounded-2xl overflow-hidden flex flex-col border border-cream/15 group hover:border-gold/60 transition-colors"
                style={{ background: 'rgba(245,239,224,0.04)' }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={z.img}
                    alt={z.name}
                    width={1200}
                    height={900}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-ink font-bold text-base" style={{ fontFamily: 'var(--font-display)' }}>
                    {z.code}
                  </div>
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-cream/95 flex items-center justify-center text-green">
                    {z.icon}
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <h3
                    className="text-[18px] sm:text-[19px] font-medium tracking-tight mb-2 text-cream leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Khu {z.code} · {z.name}
                  </h3>
                  <p className="text-[12.5px] sm:text-[13px] text-cream/70 leading-relaxed flex-1 mb-4">{z.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-cream/15 text-[11.5px]" style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className="text-gold font-semibold">{z.countLabel}</span>
                    <span className="text-cream/55">{z.priceLabel}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 text-center">
            <a
              href="https://www.facebook.com/NightMarketSonTraDaNangVietNam/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 bg-gold text-ink text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-cream transition-colors no-underline"
            >
              <Facebook size={16} /> Xem cập nhật từ fanpage chính thức
            </a>
          </div>
        </div>
      </section>

      {/* ── EVENTS TIMELINE ──────────────────────────────────────────── */}
      <section id="events" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no="V · LỊCH ĐÊM" title="Lịch một buổi tối" />
          <p className="text-ink-soft max-w-[640px] text-[14px] sm:text-[15px] leading-relaxed mb-8 sm:mb-10">
            Sáu khung giờ vàng. Hãy đến sớm, ăn từ từ, và đừng quên xem Cầu Rồng phun lửa lúc 21:00 cuối tuần.
          </p>

          <div className="bg-white border border-border rounded-3xl p-5 sm:p-6 lg:p-10">
            <ol className="relative space-y-6 sm:space-y-7 list-none m-0 p-0">
              {/* Vertical line */}
              <div className="absolute left-[22px] sm:left-[26px] top-3 bottom-3 w-px bg-border" aria-hidden />

              {events.map((e, i) => (
                <li key={i} className="relative pl-12 sm:pl-16">
                  <div className="absolute left-0 top-0 w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-full bg-cream border border-border flex items-center justify-center text-green">
                    {e.icon}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-1.5">
                    <span
                      className="text-[11px] sm:text-[12px] text-gold-deep font-bold tracking-[0.08em] uppercase"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {e.time}
                    </span>
                    <h3
                      className="text-[17px] sm:text-[20px] font-medium tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {e.title}
                    </h3>
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed max-w-[640px]">{e.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS · pull-quote treatment ──────────────────────── */}
      <section className="py-20 sm:py-24 lg:py-32" style={{ background: 'var(--color-cream-dark)' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-[10.5px] uppercase tracking-[0.22em] font-bold text-gold-deep mb-7 sm:mb-9 flex items-center gap-3"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="w-8 h-px bg-gold-deep" />
            Tiếng nói thực khách · trích từ Tripadvisor & Google Maps
          </div>

          <blockquote
            className="font-normal text-ink leading-[1.06] tracking-[-0.025em] mb-6 sm:mb-7 m-0 relative max-w-[920px]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4.6vw, 56px)' }}
          >
            <span
              className="text-gold-deep absolute -left-1 sm:-left-2 -top-3 sm:-top-5 select-none"
              style={{ fontFamily: 'var(--font-display)', fontSize: '1.4em', lineHeight: 1, opacity: 0.35 }}
              aria-hidden
            >
              “
            </span>
            After the Dragon Bridge fire show, walking over for late supper here is the best routine in Đà Nẵng.
          </blockquote>
          <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] sm:text-[13px] text-ink-soft mb-12 sm:mb-14">
            <span className="font-semibold text-ink">Erico T.</span>
            <span className="text-ink-mute">🇸🇬 Singapore</span>
            <span className="w-1 h-1 rounded-full bg-ink-mute" />
            <span
              className="uppercase tracking-[0.14em] text-[10.5px] text-ink-mute inline-flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Tripadvisor
              <span className="inline-flex items-center gap-0.5 text-gold">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={10} className="fill-current" />
                ))}
              </span>
            </span>
          </footer>

          <div className="border-t border-border pt-7 sm:pt-9">
            <div
              className="text-[10.5px] uppercase tracking-[0.18em] font-bold text-ink-mute mb-5 sm:mb-6"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Năm trích đoạn khác chúng tôi đọc tuần này
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 sm:gap-x-14 gap-y-6 sm:gap-y-7 list-none m-0 p-0">
              {testimonials.slice(1).map((t, i) => (
                <li key={i} className="grid grid-cols-[28px_1fr] gap-3 sm:gap-5">
                  <span
                    className="text-[11px] text-gold-deep font-bold tracking-wider pt-1.5"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {String(i + 2).padStart(2, '0')}
                  </span>
                  <div>
                    <p
                      className="text-[14px] sm:text-[15.5px] text-ink leading-relaxed m-0"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      “{t.quote}”
                    </p>
                    <p
                      className="text-[11px] sm:text-[11.5px] text-ink-mute mt-2 m-0 tracking-wide"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      — {t.name} · {t.flag} {t.country} · {t.source}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PRO TIPS ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <SectionLabel no="VI · MẸO ĐỊA PHƯƠNG" title="Sáu điều nên biết trước" />
              <p className="text-[13.5px] sm:text-[14px] text-ink-soft leading-relaxed max-w-[260px] mb-5">
                Lời nhắn của những người Đà Nẵng đã đi chợ này quá nhiều lần — tổng hợp từ Facebook fanpage, comment
                review Tripadvisor, và một buổi tối ngồi cà phê với hai tiểu thương.
              </p>
              <div
                className="text-[10.5px] uppercase tracking-[0.2em] text-ink-mute"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Soạn lại tháng 5/2026
              </div>
            </div>

            <ol className="list-none m-0 p-0 divide-y divide-border border-t border-border">
              {tips.map((t, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[44px_1fr] sm:grid-cols-[68px_1fr] gap-4 sm:gap-6 py-6 sm:py-7"
                >
                  <span
                    className="text-[28px] sm:text-[40px] font-normal text-gold-deep leading-none tabular-nums"
                    style={{ fontFamily: 'var(--font-display)' }}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h4
                      className="text-[19px] sm:text-[24px] font-normal tracking-tight text-ink leading-[1.15] mb-2 sm:mb-2.5"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {t.title}
                    </h4>
                    <p className="text-[13.5px] sm:text-[15px] text-ink-soft leading-relaxed max-w-[620px] m-0">
                      {t.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── VISIT / MAP ──────────────────────────────────────────────── */}
      <section id="visit" className="py-16 sm:py-20 lg:py-28" style={{ background: 'var(--color-cream-dark)' }}>
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no="VII · ĐƯỜNG ĐẾN" title="Tham quan & đường đến" />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 lg:gap-8">
            {/* Map embed */}
            <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-border bg-white aspect-[5/4] lg:aspect-auto lg:min-h-[480px]">
              <iframe
                title="Bản đồ Chợ Đêm Sơn Trà"
                src="https://www.google.com/maps?q=cho+dem+son+tra+da+nang&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            {/* Info card */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-green" />
                  <span
                    className="text-[11px] uppercase tracking-widest font-semibold text-ink-mute"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Địa chỉ
                  </span>
                </div>
                <p
                  className="text-[15px] sm:text-[16px] text-ink leading-snug mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Đường Lý Nam Đế × Mai Hắc Đế
                </p>
                <p className="text-[13px] sm:text-[13.5px] text-ink-soft">
                  Phường An Hải Tây, quận Sơn Trà, thành phố Đà Nẵng — ngay chân Cầu Rồng. Địa điểm mới từ tháng 8/2025.
                </p>
              </div>

              <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-green" />
                  <span
                    className="text-[11px] uppercase tracking-widest font-semibold text-ink-mute"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Giờ mở cửa
                  </span>
                </div>
                <ul className="space-y-1.5 text-[13.5px] sm:text-[14px] text-ink-soft list-none m-0 p-0">
                  <li className="flex justify-between"><span>Thứ 2 – Thứ 6</span><span className="text-ink font-semibold">17:30 – 23:45</span></li>
                  <li className="flex justify-between"><span>Thứ 7 – Chủ nhật</span><span className="text-ink font-semibold">17:00 – 23:59</span></li>
                  <li className="flex justify-between text-[12px] sm:text-[12.5px] pt-2 mt-2 border-t border-border"><span>Giờ vàng</span><span className="text-green font-bold">19:00 – 21:30</span></li>
                </ul>
              </div>

              <div className="bg-green text-cream rounded-2xl p-5 sm:p-6">
                <div
                  className="text-[11px] uppercase tracking-widest font-semibold mb-3"
                  style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}
                >
                  Cách đến
                </div>
                <ul className="space-y-3 list-none m-0 p-0 text-[13px] sm:text-[13.5px]">
                  <li className="flex items-start gap-3">
                    <Footprints size={16} className="text-gold mt-0.5 shrink-0" />
                    <span><strong>Từ Cầu Rồng:</strong> đi bộ 3 phút (~250m)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Bike size={16} className="text-gold mt-0.5 shrink-0" />
                    <span><strong>Từ trung tâm Tây sông Hàn:</strong> ~5 phút Grab Bike (~20k)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Car size={16} className="text-gold mt-0.5 shrink-0" />
                    <span><strong>Từ sân bay Đà Nẵng:</strong> ~15 phút taxi (~80k–100k)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel no="VIII · GIẢI ĐÁP" title="Câu hỏi thường gặp" />

          <div className="space-y-2 mt-6 sm:mt-8">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group bg-white border border-border rounded-2xl overflow-hidden open:border-green transition-colors"
              >
                <summary className="flex items-center justify-between gap-4 p-4 sm:p-5 cursor-pointer list-none">
                  <span
                    className="text-[15px] sm:text-[16px] font-medium text-ink pr-2 sm:pr-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {f.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className="text-ink-mute shrink-0 transition-transform group-open:rotate-180 group-open:text-green"
                  />
                </summary>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-[13.5px] sm:text-[14px] text-ink-soft leading-relaxed border-t border-border pt-3 sm:pt-4">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA · VISIT & CONTACT ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden bg-ink">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0% 100%, rgba(201,169,97,0.45), transparent 50%), radial-gradient(circle at 100% 0%, rgba(245,239,224,0.18), transparent 50%)',
          }}
        />
        <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="w-8 h-px bg-gold" />
              <span
                className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em]"
                style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}
              >
                Hẹn gặp dưới chân Cầu Rồng
              </span>
            </div>
            <h2
              className="font-normal text-cream leading-[1.05] tracking-[-0.02em] mb-4 sm:mb-5"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 56px)' }}
            >
              Một đêm Đà Nẵng,{' '}
              <em className="italic not-italic" style={{ color: 'var(--color-gold)', fontWeight: 300 }}>
                bắt đầu từ đây
              </em>.
            </h2>
            <p className="text-cream/85 text-[14px] sm:text-[16px] leading-relaxed max-w-[480px] mb-6 sm:mb-8">
              17:30 đèn lồng bật sáng, 19:00 cao điểm hương khói nướng, 22:30 ban nhạc đường phố lên sân khấu.
              Cần tư vấn đặt bàn nhóm đông, sự kiện hay quay phim — nhắn Messenger hoặc gọi hotline ban quản lý.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.facebook.com/NightMarketSonTraDaNangVietNam/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-gold text-ink text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-cream transition-colors no-underline inline-flex items-center gap-2"
              >
                <Facebook size={16} /> Nhắn Messenger
              </a>
              <a
                href="tel:+84947046556"
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-white/10 backdrop-blur-sm border border-cream/30 text-cream text-[13px] sm:text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors no-underline inline-flex items-center gap-2"
              >
                <Phone size={16} /> Gọi +84 94 704 6556
              </a>
            </div>
          </div>

          {/* Spec-sheet — visit essentials */}
          <div className="lg:pl-10 lg:border-l border-cream/15">
            <div
              className="text-[10.5px] uppercase tracking-[0.22em] font-bold text-gold mb-5 sm:mb-6"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Thông tin đến chợ
            </div>
            <dl className="m-0 p-0 divide-y divide-cream/15 border-y border-cream/15">
              {[
                { v: '17:30', l: 'Mở cửa hàng đêm', sub: 'thứ 2 – thứ 6 · cuối tuần từ 17:00' },
                { v: '23:45', l: 'Đóng cửa thường', sub: 'cuối tuần kéo dài đến 23:59' },
                { v: '0₫', l: 'Phí vào cổng', sub: 'miễn phí cho khách tham quan' },
                { v: '~150', l: 'Chỗ đỗ xe máy', sub: 'bãi gửi xe công cộng dọc Mai Hắc Đế' },
              ].map((m) => (
                <div
                  key={m.l}
                  className="grid grid-cols-[88px_1fr] sm:grid-cols-[120px_1fr] gap-4 sm:gap-6 py-4 sm:py-5 items-baseline"
                >
                  <dt
                    className="text-[24px] sm:text-[32px] font-normal tracking-tight text-cream leading-none tabular-nums m-0"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {m.v}
                  </dt>
                  <dd className="m-0">
                    <div
                      className="text-[12.5px] sm:text-[13.5px] text-cream font-semibold uppercase tracking-[0.06em] leading-snug mb-1"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {m.l}
                    </div>
                    <div className="text-[12px] sm:text-[12.5px] text-cream/55 leading-snug">{m.sub}</div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── LEGAL / COMPLIANCE STRIP ─────────────────────────────────── */}
      <section
        aria-labelledby="legal-heading"
        className="bg-cream-dark/40 border-y border-border py-12 sm:py-16"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 sm:mb-10">
            <div>
              <div
                className="text-[10.5px] text-gold-deep uppercase tracking-[0.18em] font-bold mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Minh bạch · Tuân thủ
              </div>
              <h2
                id="legal-heading"
                className="text-[26px] sm:text-[34px] font-normal tracking-tight text-ink leading-tight m-0"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Cam kết pháp lý &amp; bảo vệ dữ liệu khách hàng
              </h2>
              <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed mt-2 max-w-[640px]">
                Chợ Đêm Sơn Trà tuân thủ Luật An toàn thông tin mạng Việt Nam, Nghị định 13/2023/NĐ-CP về bảo
                vệ dữ liệu cá nhân và yêu cầu của Meta Platform Policy. Tất cả tài liệu pháp lý đều công khai.
              </p>
            </div>
            <Link
              to="/data-deletion"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-cream rounded-full text-[12.5px] font-semibold uppercase tracking-[0.08em] no-underline hover:bg-green-deep transition-colors self-start sm:self-end shrink-0"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Trash2 size={14} /> Yêu cầu xoá dữ liệu
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                to: '/privacy',
                Icon: ShieldCheck,
                title: 'Chính sách bảo mật',
                desc:
                  'Chúng tôi thu thập gì, lưu trữ bao lâu, chia sẻ với ai. Tuân thủ GDPR-like + Nghị định 13/2023/NĐ-CP Việt Nam.',
                meta: 'Hiệu lực 25/05/2026',
              },
              {
                to: '/terms',
                Icon: FileText,
                title: 'Điều khoản sử dụng',
                desc:
                  'Hợp đồng pháp lý giữa bạn và Chợ Đêm Sơn Trà. Trách nhiệm khách hàng, tiểu thương, thanh toán, đổi trả.',
                meta: 'Hiệu lực 25/05/2026',
              },
              {
                to: '/data-deletion',
                Icon: Trash2,
                title: 'Hướng dẫn xoá dữ liệu',
                desc:
                  '3 cách xoá: self-service trong tài khoản, gửi email, hoặc gỡ ứng dụng khỏi Facebook. Xác minh trong 3 ngày, xoá trong 30 ngày.',
                meta: 'Meta Data Deletion Callback',
              },
            ].map(({ to, Icon, title, desc, meta }) => (
              <Link
                key={to}
                to={to}
                className="group bg-white border border-border rounded-2xl p-5 sm:p-6 no-underline flex flex-col hover:border-gold/70 hover:shadow-[0_18px_36px_-22px_rgba(15,25,20,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green/10 text-green-deep">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span
                    className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mt-1.5"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {meta}
                  </span>
                </div>
                <h3 className="text-[16px] sm:text-[17px] font-medium tracking-tight text-ink leading-tight m-0 mb-2">
                  {title}
                </h3>
                <p className="text-[12.5px] sm:text-[13px] text-ink-soft leading-relaxed m-0 mb-4 flex-1">
                  {desc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-deep group-hover:gap-2.5 transition-all mt-auto">
                  Đọc đầy đủ <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 pt-6 sm:pt-7 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 text-[12px] sm:text-[12.5px] text-ink-soft">
            <div>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Đơn vị vận hành
              </div>
              <div className="text-ink font-medium leading-snug">Công ty CP DHTC Đà Nẵng</div>
              <div className="text-[11.5px] text-ink-mute mt-0.5">GPKD 0401234567 · Sở KH&amp;ĐT Đà Nẵng</div>
            </div>
            <div>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Trụ sở
              </div>
              <div className="leading-snug">
                Mai Hắc Đế × Lý Nam Đế, phường An Hải Tây, quận Sơn Trà, thành phố Đà Nẵng, Việt Nam
              </div>
            </div>
            <div>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Email pháp lý
              </div>
              <a
                href="mailto:privacy@dhtcdanang.com"
                className="text-green-deep font-semibold no-underline hover:underline break-all"
              >
                privacy@dhtcdanang.com
              </a>
              <div className="text-[11.5px] text-ink-mute mt-0.5">Hỗ trợ DPO &amp; yêu cầu xoá dữ liệu</div>
            </div>
            <div>
              <div
                className="text-[9.5px] text-ink-mute uppercase tracking-[0.14em] font-semibold mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Hotline
              </div>
              <div className="text-ink font-medium tabular-nums">+84 236 3 888 666</div>
              <div className="text-[11.5px] text-ink-mute mt-0.5">8:00 – 22:00 GMT+7 hằng ngày</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-ink text-cream pt-12 sm:pt-16 pb-8">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-10 sm:mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={LOGO}
                  alt="Chợ Đêm Sơn Trà"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-cream/15"
                  decoding="async"
                />
                <strong
                  className="text-[16px] sm:text-[17px] font-semibold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Chợ Đêm Sơn Trà
                </strong>
              </div>
              <p className="text-[12.5px] sm:text-[13px] text-cream/60 leading-relaxed mb-4 sm:mb-5">
                Khu chợ đêm lớn nhất Đà Nẵng — biểu tượng ẩm thực miền Trung từ năm 2018. Hơn 150 gian hàng, mở
                cửa hàng đêm dưới chân Cầu Rồng.
              </p>
              <a
                href="https://www.facebook.com/NightMarketSonTraDaNangVietNam/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-cream/10 hover:bg-cream/15 rounded-lg text-[12.5px] font-semibold no-underline text-cream transition-colors"
              >
                <Facebook size={14} /> Wonders Night Market
              </a>
            </div>

            {/* Sitemap */}
            <div>
              <div
                className="text-[10.5px] text-gold uppercase tracking-widest font-bold mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Khám phá
              </div>
              <ul className="space-y-2 sm:space-y-2.5 text-[13px] text-cream/75 list-none m-0 p-0">
                <li><a href="#story" className="hover:text-cream no-underline">Câu chuyện chợ đêm</a></li>
                <li><a href="#flavors" className="hover:text-cream no-underline">8 món phải thử</a></li>
                <li><a href="#zones" className="hover:text-cream no-underline">4 khu vực</a></li>
                <li><a href="#events" className="hover:text-cream no-underline">Lịch hoạt động đêm</a></li>
                <li><a href="#visit" className="hover:text-cream no-underline">Cách đến chợ</a></li>
                <li><a href="#faq" className="hover:text-cream no-underline">Hỏi đáp</a></li>
              </ul>
            </div>

            <div>
              <div
                className="text-[10.5px] text-gold uppercase tracking-widest font-bold mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Liên hệ & Pháp lý
              </div>
              <ul className="space-y-2 sm:space-y-2.5 text-[13px] text-cream/75 list-none m-0 p-0 mb-5">
                <li className="flex items-start gap-2">
                  <Mail size={13} className="mt-1 text-gold shrink-0" />
                  <a href="mailto:support@dhtcdanang.com" className="hover:text-cream no-underline break-all">
                    support@dhtcdanang.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone size={13} className="mt-1 text-gold shrink-0" />
                  <span>+84 94 704 6556</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={13} className="mt-1 text-gold shrink-0" />
                  <span>Lý Nam Đế × Mai Hắc Đế, An Hải Tây, Sơn Trà, Đà Nẵng</span>
                </li>
              </ul>
              <ul className="space-y-2 text-[12px] sm:text-[12.5px] text-cream/60 list-none m-0 p-0">
                <li><Link to="/privacy" className="hover:text-gold no-underline">Chính sách bảo mật</Link></li>
                <li><Link to="/terms" className="hover:text-gold no-underline">Điều khoản sử dụng</Link></li>
                <li><Link to="/data-deletion" className="hover:text-gold no-underline">Hướng dẫn xoá dữ liệu</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-cream/10 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 text-[11px] sm:text-[11.5px] text-cream/45">
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              © 2026 Chợ Đêm Sơn Trà · Đà Nẵng · dhtcdanang.com
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              GPKD: 0401234567 · Sở KH&ĐT Đà Nẵng cấp
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
