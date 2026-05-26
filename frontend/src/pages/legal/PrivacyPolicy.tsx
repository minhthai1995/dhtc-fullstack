import { LegalLayout } from './LegalLayout'

export function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Chính sách bảo mật"
      subtitle="Chợ Đêm Sơn Trà cam kết bảo vệ quyền riêng tư của khách hàng, tiểu thương và đối tác. Tài liệu này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân."
      effectiveDate="25/05/2026"
    >
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

      <h2>3. Mục đích sử dụng dữ liệu</h2>
      <ol>
        <li>Cung cấp dịch vụ thương mại điện tử (đăng ký, đăng nhập, đặt hàng, thanh toán, vận chuyển).</li>
        <li>Xác thực danh tính và bảo vệ tài khoản (chống fraud, bot, spam).</li>
        <li>Liên lạc với bạn về đơn hàng, khuyến mãi (chỉ khi bạn đã đồng ý nhận tin).</li>
        <li>Phân tích thống kê tổng hợp (KHÔNG định danh cá nhân) để cải thiện trải nghiệm.</li>
        <li>Tuân thủ nghĩa vụ pháp lý (hoá đơn điện tử, báo cáo thuế theo luật Việt Nam).</li>
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
      </ul>
      <p>
        Chúng tôi KHÔNG dùng cookies tracking của bên thứ ba (Google Analytics, Facebook Pixel) ở
        thời điểm hiện tại.
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

      <hr />

      <h2>English summary (for Meta App Review)</h2>
      <p>
        <strong>Chợ Đêm Sơn Trà</strong> (Son Tra Night Market) is a cultural night market in Da
        Nang, Vietnam, operating an e-commerce platform at <code>dhtcdanang.com</code> to connect
        local vendors with domestic and international customers.
      </p>
      <p>
        <strong>Data collected via Facebook Login</strong> (scopes: <code>email</code>,{' '}
        <code>public_profile</code>): App-scoped User ID, email (optional), first/last name, profile
        picture URL, locale.
      </p>
      <p>
        <strong>Data collected via Messenger Platform</strong> (when user initiates conversation with
        our official Facebook Page): Page-scoped ID (PSID), message content, timestamps. Used solely
        for customer support and auto-reply.
      </p>
      <p>
        <strong>Data sharing:</strong> No data is sold or shared with advertisers. Limited sharing
        with Vietcombank (payment), DHL (shipping), AWS/Cloudflare (infrastructure).
      </p>
      <p>
        <strong>User rights:</strong> Access, rectification, deletion, portability. Self-service
        deletion available at <a href="/data-deletion">/data-deletion</a>. Email{' '}
        <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a> for any requests.
      </p>
    </LegalLayout>
  )
}
