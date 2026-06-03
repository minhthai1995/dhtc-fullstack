import { LegalLayout } from './LegalLayout'
import { useT } from '@/i18n/useT'

function ViBody() {
  return (
    <>
      <h2>1. Giới thiệu</h2>
      <p>
        Chợ Đêm Sơn Trà (sau đây gọi là <strong>"Chúng tôi"</strong>) là chợ đêm văn hoá - du lịch
        toạ lạc tại quận Sơn Trà, thành phố Đà Nẵng, Việt Nam. Chúng tôi vận hành nền tảng thương mại
        điện tử tại <a href="https://dhtcdanang.com">dhtcdanang.com</a> nhằm kết nối hơn 300 tiểu
        thương truyền thống với khách hàng trong nước và quốc tế.
      </p>
      <p>
        Bằng việc sử dụng dịch vụ của chúng tôi, bạn (<strong>"Người dùng"</strong>) đồng ý với các
        điều khoản trong Chính sách bảo mật này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
      </p>

      <h2>2. Dữ liệu chúng tôi thu thập</h2>

      <h3>2.1. Thông tin do bạn cung cấp trực tiếp</h3>
      <ul>
        <li>
          <strong>Tài khoản:</strong> địa chỉ email, mật khẩu (đã băm bcrypt), họ tên, số điện thoại,
          vai trò (khách hàng / tiểu thương / quản trị).
        </li>
        <li>
          <strong>Hồ sơ tiểu thương:</strong> tên gian hàng, mã số thuế (nếu có), địa chỉ kinh doanh,
          tài khoản ngân hàng để nhận thanh toán.
        </li>
        <li>
          <strong>Đơn hàng:</strong> địa chỉ giao hàng, sản phẩm đã mua, lịch sử giao dịch, ghi chú.
        </li>
        <li>
          <strong>Hình ảnh sản phẩm:</strong> ảnh do tiểu thương tải lên, được tự động xử lý (resize,
          xoay theo EXIF) và lưu trữ trên máy chủ.
        </li>
      </ul>

      <h3>2.2. Thông tin từ Facebook Login (Meta Platforms, Inc.)</h3>
      <p>
        Khi bạn chọn đăng nhập bằng Facebook, chúng tôi yêu cầu quyền truy cập tối thiểu (scope:
        <code>email</code>, <code>public_profile</code>) và nhận về các trường dữ liệu sau từ Facebook
        Graph API v19.0:
      </p>
      <ul>
        <li>
          <strong>Facebook App-scoped User ID</strong> (định danh duy nhất gắn với ứng dụng của chúng
          tôi, không phải Facebook UID toàn cầu).
        </li>
        <li>
          <strong>Email</strong> (nếu bạn cấp quyền — chúng tôi dùng để liên kết tài khoản đã tồn tại
          hoặc tạo tài khoản mới).
        </li>
        <li>
          <strong>Họ và tên</strong> (first name, last name) — hiển thị trên hồ sơ tài khoản.
        </li>
        <li>
          <strong>Ảnh đại diện</strong> (profile picture URL chất lượng cao) — hiển thị trên giao diện
          tiểu thương / khách hàng.
        </li>
        <li>
          <strong>Ngôn ngữ ưa thích</strong> (locale, ví dụ <code>vi_VN</code>, <code>en_US</code>) —
          để hiển thị giao diện phù hợp.
        </li>
      </ul>
      <div className="callout">
        <strong>Lưu ý:</strong> Nếu bạn không cấp quyền email, chúng tôi tạo một địa chỉ email nội bộ
        dạng <code>fb_&lt;id&gt;@dhtc.local</code> chỉ dùng để định danh nội bộ — địa chỉ này không
        bao giờ được dùng để gửi mail và không được tiết lộ cho bên thứ ba.
      </div>

      <h3>2.3. Thông tin từ Facebook Messenger (khi bạn chủ động trò chuyện với gian hàng)</h3>
      <p>
        Khi bạn nhấn vào nút Messenger trên trang của chúng tôi hoặc nhắn tin cho fanpage chính thức
        của Chợ Đêm Sơn Trà, chúng tôi nhận và lưu trữ:
      </p>
      <ul>
        <li>
          <strong>Page-scoped ID (PSID)</strong> — định danh người dùng do Facebook cấp riêng cho
          fanpage, không phải Facebook UID.
        </li>
        <li>
          <strong>Nội dung tin nhắn</strong> bạn gửi đến fanpage — dùng để trả lời tự động và lưu lịch
          sử hỗ trợ khách hàng.
        </li>
        <li>
          <strong>Thời gian gửi, trạng thái đã đọc</strong> — phục vụ phân tích thời gian phản hồi
          trung bình.
        </li>
        <li>
          <strong>Thông tin bạn tự nguyện cung cấp trong tin nhắn</strong> như số điện thoại, địa chỉ
          giao hàng, mã đơn hàng — chúng tôi trích xuất bằng regex để liên kết với tài khoản (nếu có)
          và phục vụ chăm sóc khách hàng.
        </li>
      </ul>

      <h3>2.4. Thông tin tự động thu thập (page tracking)</h3>
      <ul>
        <li>
          <strong>Visitor ID & Session ID</strong> ngẫu nhiên (lưu trong <code>localStorage</code> của
          trình duyệt) — không gắn với danh tính cá nhân.
        </li>
        <li>
          <strong>Đường dẫn trang đã xem</strong>, <strong>thời gian xem</strong>, <strong>nguồn truy
          cập</strong> (referrer), <strong>thiết bị</strong> (mobile/desktop/tablet — derive từ
          User-Agent).
        </li>
        <li>
          <strong>Mã quốc gia</strong> (nếu reverse proxy gắn header <code>CF-IPCountry</code>) — phục
          vụ phân tích thị trường.
        </li>
        <li>
          <strong>Địa chỉ IP</strong> — chỉ lưu tạm thời cho mục đích rate-limit và phòng chống lạm
          dụng, xoá sau 7 ngày.
        </li>
      </ul>

      <h2>3. Mục đích sử dụng dữ liệu và cơ sở pháp lý</h2>
      <p>
        Chúng tôi xử lý dữ liệu cá nhân trên cơ sở: <strong>(a)</strong> thực hiện hợp đồng (đơn
        hàng, thanh toán); <strong>(b)</strong> đồng ý của bạn (cookie phân tích, nhận tin khuyến
        mãi); <strong>(c)</strong> nghĩa vụ pháp lý; <strong>(d)</strong> lợi ích hợp pháp (bảo mật
        tài khoản, chống gian lận) — theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, Luật An
        toàn thông tin mạng 86/2015/QH13, và các văn bản pháp luật liên quan có hiệu lực.
      </p>
      <ol>
        <li>Cung cấp dịch vụ thương mại điện tử (đăng ký, đăng nhập, đặt hàng, thanh toán, vận chuyển).</li>
        <li>Xác thực danh tính và bảo vệ tài khoản (chống fraud, bot, spam).</li>
        <li>Liên lạc với bạn về đơn hàng, khuyến mãi (chỉ khi bạn đã đồng ý nhận tin).</li>
        <li>Phân tích thống kê tổng hợp ẩn danh (GA4 — chỉ khi bạn đồng ý cookie) để cải thiện trải nghiệm.</li>
        <li>Tuân thủ nghĩa vụ pháp lý (hoá đơn điện tử, báo cáo thuế theo luật Việt Nam).</li>
        <li>Ghi nhận lựa chọn đồng ý cookie và xử lý yêu cầu xoá / xuất dữ liệu của bạn (DSR).</li>
      </ol>

      <h2>4. Chia sẻ dữ liệu với bên thứ ba</h2>
      <p>
        Chúng tôi <strong>không bán</strong> dữ liệu cá nhân của bạn. Dữ liệu chỉ được chia sẻ với
        các đối tác dịch vụ sau khi cần thiết để hoàn thành giao dịch:
      </p>
      <ul>
        <li>
          <strong>Vietcombank (VietQR API):</strong> thông tin giao dịch (số tiền, mã tham chiếu, mã
          đơn hàng) để xử lý thanh toán.
        </li>
        <li>
          <strong>DHL Express:</strong> địa chỉ giao hàng, số điện thoại người nhận, danh sách sản
          phẩm để lập vận đơn quốc tế.
        </li>
        <li>
          <strong>Meta Platforms (Facebook):</strong> chỉ là phía cung cấp dữ liệu cho chúng tôi qua
          OAuth + Messenger — chúng tôi KHÔNG đẩy ngược dữ liệu khách hàng lên Meta ngoài tương tác
          trực tiếp giữa user và fanpage.
        </li>
        <li>
          <strong>Nhà cung cấp hạ tầng:</strong> AWS Singapore (lưu trữ dữ liệu), Cloudflare (CDN +
          DDoS protection).
        </li>
        <li>
          <strong>Cơ quan nhà nước:</strong> khi có yêu cầu hợp pháp bằng văn bản (lệnh khám xét, yêu
          cầu của Cục An ninh mạng, Tổng cục Thuế).
        </li>
      </ul>

      <h2>5. Lưu trữ và bảo mật</h2>
      <ul>
        <li>
          <strong>Mã hoá truyền tải:</strong> tất cả lưu lượng dùng HTTPS (TLS 1.2+).
        </li>
        <li>
          <strong>Mã hoá lưu trữ:</strong> mật khẩu băm bằng <code>bcrypt</code> (cost factor 12), không
          thể giải mã ngược.
        </li>
        <li>
          <strong>Token Facebook & API keys:</strong> chỉ lưu trong biến môi trường máy chủ, không
          ghi log, không hiển thị trong giao diện.
        </li>
        <li>
          <strong>Phân quyền truy cập:</strong> dữ liệu khách hàng chỉ truy cập được bởi tiểu thương
          có đơn liên quan và quản trị viên có xác thực 2 yếu tố.
        </li>
        <li>
          <strong>Vị trí máy chủ:</strong> AWS Asia Pacific (Singapore), với bản sao lưu hàng ngày.
        </li>
      </ul>

      <h2>6. Thời gian lưu trữ (Retention)</h2>
      <ul>
        <li><strong>Tài khoản đang hoạt động:</strong> lưu đến khi bạn yêu cầu xoá.</li>
        <li>
          <strong>Tài khoản không hoạt động:</strong> sau 24 tháng không đăng nhập, chúng tôi sẽ gửi
          email nhắc và xoá sau 30 ngày nếu không phản hồi.
        </li>
        <li>
          <strong>Hoá đơn và chứng từ thuế:</strong> lưu 10 năm theo Luật Kế toán Việt Nam (Điều 41).
        </li>
        <li>
          <strong>Lịch sử chat Messenger:</strong> 12 tháng kể từ tin nhắn cuối cùng.
        </li>
        <li>
          <strong>Page-view logs:</strong> 90 ngày dưới dạng chi tiết, sau đó tổng hợp ẩn danh.
        </li>
        <li><strong>Địa chỉ IP:</strong> 7 ngày.</li>
      </ul>

      <h2>7. Quyền của bạn (User Rights)</h2>
      <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>
      <ul>
        <li><strong>Quyền truy cập:</strong> xem dữ liệu chúng tôi đang lưu về bạn.</li>
        <li><strong>Quyền chỉnh sửa:</strong> cập nhật thông tin sai hoặc lỗi thời.</li>
        <li>
          <strong>Quyền xoá ("right to be forgotten"):</strong> yêu cầu xoá toàn bộ dữ liệu —
          xem hướng dẫn chi tiết tại <a href="/data-deletion">trang Xoá dữ liệu</a>.
        </li>
        <li><strong>Quyền xuất dữ liệu:</strong> tải xuống bản sao dữ liệu của bạn dưới định dạng JSON.</li>
        <li>
          <strong>Quyền rút lại đồng ý:</strong> ngừng cho phép Facebook Login bằng cách vào{' '}
          <a href="https://www.facebook.com/settings?tab=business_tools">
            Facebook Settings → Business Integrations
          </a>{' '}
          và gỡ ứng dụng "Chợ Đêm Sơn Trà".
        </li>
      </ul>

      <h2>8. Cookies và lưu trữ trình duyệt</h2>
      <ul>
        <li>
          <code>access_token</code> (sessionStorage) — JWT đăng nhập, tự động xoá khi đóng tab.
        </li>
        <li>
          <code>visitor_id</code> (localStorage) — ID khách truy cập ngẫu nhiên, dùng để gộp các phiên
          xem trang của cùng một thiết bị.
        </li>
        <li>
          <code>fb_oauth_state</code> (HttpOnly cookie, TTL 600s) — CSRF token cho luồng Facebook
          Login.
        </li>
        <li>
          <code>dhtc_cookie_consent</code> (localStorage) — lưu lựa chọn đồng ý cookie của bạn
          (giá trị <code>"accepted"</code> hoặc <code>"rejected"</code>). Không chứa dữ liệu cá
          nhân; được xoá khi bạn xoá dữ liệu trình duyệt.
        </li>
      </ul>
      <p>
        Khi bạn <strong>đồng ý</strong> qua banner thông báo cookie, chúng tôi sẽ tải{' '}
        <strong>Google Analytics 4 (GA4)</strong> của Google LLC để đo lường lượt truy cập ẩn danh.
        Nếu bạn <strong>từ chối</strong>, GA4 không được tải và không có dữ liệu nào được gửi đến
        Google. Bạn có thể thay đổi lựa chọn bất cứ lúc nào bằng cách xoá{' '}
        <code>dhtc_cookie_consent</code> khỏi localStorage của trình duyệt và tải lại trang.
      </p>
      <p>
        Chúng tôi không dùng <strong>Facebook Pixel</strong> hoặc bất kỳ cookie tracking nào khác
        của bên thứ ba ngoài GA4 đã nêu trên.
      </p>

      <h2>9. Trẻ em dưới 13 tuổi</h2>
      <p>
        Dịch vụ của chúng tôi không hướng đến trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập dữ
        liệu của trẻ em. Nếu bạn là phụ huynh và phát hiện con mình đã đăng ký tài khoản, vui lòng
        liên hệ <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a> để chúng tôi xoá
        ngay lập tức.
      </p>

      <h2>10. Thay đổi chính sách</h2>
      <p>
        Chúng tôi có thể cập nhật Chính sách bảo mật này. Mọi thay đổi đáng kể sẽ được thông báo qua
        email và banner trên trang chủ ít nhất 15 ngày trước khi có hiệu lực. Việc tiếp tục sử dụng
        dịch vụ sau ngày hiệu lực đồng nghĩa với việc bạn chấp nhận chính sách mới.
      </p>

      <h2>11. Liên hệ</h2>
      <p>
        Mọi câu hỏi về Chính sách bảo mật, vui lòng liên hệ Cán bộ Bảo vệ Dữ liệu (DPO):
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Hotline:</strong> +84 236 3 888 666 (giờ hành chính, GMT+7)
        </li>
        <li>
          <strong>Địa chỉ:</strong> Chợ Đêm Sơn Trà, đường Mai Hắc Đế, phường An Hải Tây, quận Sơn
          Trà, thành phố Đà Nẵng, Việt Nam.
        </li>
      </ul>
    </>
  )
}

function EnBody() {
  return (
    <>
      <h2>1. Introduction</h2>
      <p>
        Chợ Đêm Sơn Trà (hereafter <strong>"We"</strong>) is a cultural and tourism night market
        located in Sơn Trà District, Đà Nẵng City, Vietnam. We operate an e-commerce platform at{' '}
        <a href="https://dhtcdanang.com">dhtcdanang.com</a> connecting more than 300 traditional
        vendors with domestic and international customers.
      </p>
      <p>
        By using our services, you (<strong>"User"</strong>) agree to the terms of this Privacy
        Policy. If you do not agree, please stop using the services.
      </p>

      <h2>2. Data we collect</h2>

      <h3>2.1. Information you provide directly</h3>
      <ul>
        <li>
          <strong>Account:</strong> email address, password (bcrypt-hashed), full name, phone number,
          role (customer / merchant / admin).
        </li>
        <li>
          <strong>Merchant profile:</strong> shop name, tax ID (if any), business address, bank
          account for receiving payments.
        </li>
        <li>
          <strong>Orders:</strong> shipping address, products purchased, transaction history, notes.
        </li>
        <li>
          <strong>Product images:</strong> photos uploaded by merchants, automatically processed
          (resize, EXIF-orient) and stored on our servers.
        </li>
      </ul>

      <h3>2.2. Information from Facebook Login (Meta Platforms, Inc.)</h3>
      <p>
        When you choose to log in with Facebook, we request the minimum scopes (<code>email</code>,{' '}
        <code>public_profile</code>) and receive the following fields from the Facebook Graph API
        v19.0:
      </p>
      <ul>
        <li>
          <strong>Facebook App-scoped User ID</strong> (a unique identifier scoped to our app — not
          the global Facebook UID).
        </li>
        <li>
          <strong>Email</strong> (if granted — used to link to an existing account or create a new
          one).
        </li>
        <li>
          <strong>First and last name</strong> — displayed on your account profile.
        </li>
        <li>
          <strong>Profile picture</strong> (high-quality URL) — displayed in merchant/customer UI.
        </li>
        <li>
          <strong>Preferred locale</strong> (e.g. <code>vi_VN</code>, <code>en_US</code>) — to render
          the matching language.
        </li>
      </ul>
      <div className="callout">
        <strong>Note:</strong> If you do not grant email permission, we generate an internal-only
        address of the form <code>fb_&lt;id&gt;@dhtc.local</code> solely for internal identification
        — this address is never used to send mail and is never disclosed to third parties.
      </div>

      <h3>2.3. Information from Facebook Messenger (when you initiate a chat with our page)</h3>
      <p>
        When you click the Messenger button on our site or message our official Chợ Đêm Sơn Trà
        Facebook Page, we receive and store:
      </p>
      <ul>
        <li>
          <strong>Page-scoped ID (PSID)</strong> — an identifier issued by Facebook scoped to our
          Page (not the global Facebook UID).
        </li>
        <li>
          <strong>Message content</strong> you send to the Page — used to power auto-reply and keep
          a support history.
        </li>
        <li>
          <strong>Send timestamp and read status</strong> — used to compute average response time.
        </li>
        <li>
          <strong>Information you voluntarily share in messages</strong> such as phone, shipping
          address, order code — we extract these via regex to link to your account (if any) and
          handle customer support.
        </li>
      </ul>

      <h3>2.4. Automatically collected information (page tracking)</h3>
      <ul>
        <li>
          <strong>Visitor ID & Session ID</strong> (random values stored in browser{' '}
          <code>localStorage</code>) — not tied to your real identity.
        </li>
        <li>
          <strong>Pages viewed</strong>, <strong>time on page</strong>, <strong>referrer</strong>,{' '}
          <strong>device type</strong> (mobile/desktop/tablet derived from User-Agent).
        </li>
        <li>
          <strong>Country code</strong> (if the reverse proxy attaches the <code>CF-IPCountry</code>{' '}
          header) — used for market analytics.
        </li>
        <li>
          <strong>IP address</strong> — kept only temporarily for rate-limiting and abuse
          prevention, deleted after 7 days.
        </li>
      </ul>

      <h2>3. How we use data and our legal basis</h2>
      <p>
        We process personal data on the bases of: <strong>(a)</strong> contract performance (orders,
        payment); <strong>(b)</strong> your consent (analytics cookies, marketing opt-in);{' '}
        <strong>(c)</strong> legal obligation; <strong>(d)</strong> legitimate interests (account
        security, fraud prevention) — in accordance with Decree 13/2023/NĐ-CP on personal data
        protection, the Network Information Security Law 86/2015/QH13, and other applicable
        Vietnamese regulations in force.
      </p>
      <ol>
        <li>Provide e-commerce services (sign-up, login, ordering, payment, shipping).</li>
        <li>Authenticate identity and protect accounts (fraud, bot, spam prevention).</li>
        <li>Communicate about orders and promotions (only with your opt-in).</li>
        <li>Anonymous aggregate analytics (GA4 — only when you consent to cookies) to improve UX.</li>
        <li>Comply with legal obligations (e-invoices, tax reporting under Vietnamese law).</li>
        <li>Record your cookie consent choices and handle data deletion / export requests (DSR).</li>
      </ol>

      <h2>4. Sharing with third parties</h2>
      <p>
        We <strong>do not sell</strong> your personal data. Data is shared only with service partners
        when necessary to complete a transaction:
      </p>
      <ul>
        <li>
          <strong>Vietcombank (VietQR API):</strong> transaction info (amount, reference code, order
          ID) for payment processing.
        </li>
        <li>
          <strong>DHL Express:</strong> shipping address, recipient phone, item list to generate
          international waybills.
        </li>
        <li>
          <strong>Meta Platforms (Facebook):</strong> only the source of data flowing to us via OAuth
          + Messenger — we do NOT push customer data back to Meta beyond direct user-to-Page
          interactions.
        </li>
        <li>
          <strong>Infrastructure providers:</strong> AWS Singapore (data hosting), Cloudflare (CDN +
          DDoS protection).
        </li>
        <li>
          <strong>Government bodies:</strong> upon valid written legal requests (search warrants,
          requests from the Cybersecurity Department or General Department of Taxation).
        </li>
      </ul>

      <h2>5. Storage and security</h2>
      <ul>
        <li>
          <strong>Transport encryption:</strong> all traffic over HTTPS (TLS 1.2+).
        </li>
        <li>
          <strong>At-rest encryption:</strong> passwords hashed with <code>bcrypt</code> (cost
          factor 12), not reversible.
        </li>
        <li>
          <strong>Facebook tokens & API keys:</strong> kept only in server environment variables,
          never logged, never shown in the UI.
        </li>
        <li>
          <strong>Access control:</strong> customer data is only accessible to merchants with related
          orders and admins with 2-factor authentication.
        </li>
        <li>
          <strong>Server location:</strong> AWS Asia Pacific (Singapore), with daily backups.
        </li>
      </ul>

      <h2>6. Retention periods</h2>
      <ul>
        <li><strong>Active accounts:</strong> retained until you request deletion.</li>
        <li>
          <strong>Inactive accounts:</strong> after 24 months without login, we send a reminder email
          and delete after 30 days if no response.
        </li>
        <li>
          <strong>Invoices and tax records:</strong> retained 10 years per Vietnamese Accounting Law
          (Article 41).
        </li>
        <li>
          <strong>Messenger chat history:</strong> 12 months from the last message.
        </li>
        <li>
          <strong>Page-view logs:</strong> 90 days at row-level, then aggregated anonymously.
        </li>
        <li><strong>IP addresses:</strong> 7 days.</li>
      </ul>

      <h2>7. Your rights</h2>
      <p>You have the following rights regarding your personal data:</p>
      <ul>
        <li><strong>Right of access:</strong> view the data we store about you.</li>
        <li><strong>Right to rectification:</strong> update incorrect or outdated information.</li>
        <li>
          <strong>Right to erasure ("right to be forgotten"):</strong> request full data deletion —
          see detailed steps at <a href="/data-deletion">the Data Deletion page</a>.
        </li>
        <li><strong>Right to data portability:</strong> download a copy of your data as JSON.</li>
        <li>
          <strong>Right to withdraw consent:</strong> revoke Facebook Login by going to{' '}
          <a href="https://www.facebook.com/settings?tab=business_tools">
            Facebook Settings → Business Integrations
          </a>{' '}
          and removing the "Chợ Đêm Sơn Trà" app.
        </li>
      </ul>

      <h2>8. Cookies and browser storage</h2>
      <ul>
        <li>
          <code>access_token</code> (sessionStorage) — login JWT, auto-cleared when the tab closes.
        </li>
        <li>
          <code>visitor_id</code> (localStorage) — random visitor ID used to group sessions from the
          same device.
        </li>
        <li>
          <code>fb_oauth_state</code> (HttpOnly cookie, TTL 600s) — CSRF token for the Facebook
          Login flow.
        </li>
        <li>
          <code>dhtc_cookie_consent</code> (localStorage) — stores your cookie consent choice
          (<code>"accepted"</code> or <code>"rejected"</code>). Contains no personal data; cleared
          when you clear browser data.
        </li>
      </ul>
      <p>
        When you <strong>accept</strong> via the cookie consent banner, we load{' '}
        <strong>Google Analytics 4 (GA4)</strong> by Google LLC for anonymous traffic measurement.
        If you <strong>decline</strong>, GA4 is never loaded and no data is sent to Google. You can
        change your choice at any time by clearing <code>dhtc_cookie_consent</code> from your
        browser's localStorage and reloading the page.
      </p>
      <p>
        We do not use <strong>Facebook Pixel</strong> or any other third-party tracking cookies
        beyond GA4 as stated above.
      </p>

      <h2>9. Children under 13</h2>
      <p>
        Our services are not directed to children under 13. We do not knowingly collect children's
        data. If you are a parent and discover your child has registered, please contact{' '}
        <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a> and we will delete the
        data immediately.
      </p>

      <h2>10. Policy changes</h2>
      <p>
        We may update this Privacy Policy. Material changes will be announced via email and a
        homepage banner at least 15 days before they take effect. Continued use of the services after
        the effective date constitutes acceptance of the new policy.
      </p>

      <h2>11. Contact</h2>
      <p>For any questions about this Privacy Policy, contact our Data Protection Officer (DPO):</p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Hotline:</strong> +84 236 3 888 666 (business hours, GMT+7)
        </li>
        <li>
          <strong>Address:</strong> Chợ Đêm Sơn Trà, Mai Hắc Đế street, An Hải Tây ward, Sơn Trà
          district, Đà Nẵng city, Vietnam.
        </li>
      </ul>
    </>
  )
}

export function PrivacyPolicy() {
  const { t, lang } = useT()
  const effectiveDate = lang === 'en' ? 'May 31, 2026' : '31/05/2026'
  return (
    <LegalLayout
      title={t('legalPage.privacy.title')}
      subtitle={t('legalPage.privacy.subtitle')}
      effectiveDate={effectiveDate}
    >
      {lang === 'en' ? <EnBody /> : <ViBody />}
    </LegalLayout>
  )
}
