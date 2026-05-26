import { LegalLayout } from './LegalLayout'

export function DataDeletion() {
  return (
    <LegalLayout
      title="Hướng dẫn xoá dữ liệu"
      subtitle="Bạn có quyền yêu cầu Chợ Đêm Sơn Trà xoá toàn bộ dữ liệu cá nhân của mình bất cứ lúc nào. Trang này hướng dẫn cách thực hiện — đáp ứng yêu cầu của Meta App Review và Luật An toàn thông tin mạng Việt Nam."
      effectiveDate="25/05/2026"
    >
      <h2>1. Có 3 cách để xoá dữ liệu</h2>

      <h3>Cách 1: Tự xoá trong tài khoản (Self-service)</h3>
      <ol>
        <li>
          Đăng nhập tại <a href="/login">dhtcdanang.com/login</a>.
        </li>
        <li>
          Vào <strong>Tài khoản → Cài đặt → Xoá tài khoản</strong>.
        </li>
        <li>Nhập lý do xoá (tuỳ chọn) và xác nhận bằng mật khẩu / mã OTP qua email.</li>
        <li>
          Hệ thống sẽ huỷ kích hoạt tài khoản ngay lập tức và xoá hoàn toàn dữ liệu trong vòng{' '}
          <strong>30 ngày</strong>.
        </li>
      </ol>

      <h3>Cách 2: Gửi yêu cầu qua email</h3>
      <p>
        Nếu bạn không thể đăng nhập (mất mật khẩu, mất quyền truy cập Facebook…), vui lòng gửi email
        đến <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a> với tiêu đề{' '}
        <strong>"Yêu cầu xoá dữ liệu"</strong> và nội dung gồm:
      </p>
      <ul>
        <li>Họ và tên đăng ký trên hệ thống.</li>
        <li>Email hoặc số điện thoại đã dùng để đăng ký.</li>
        <li>
          Nếu đăng nhập bằng Facebook: cung cấp Facebook App-scoped User ID (xem hướng dẫn lấy ID ở
          mục 3 bên dưới).
        </li>
        <li>
          Lý do xoá (tuỳ chọn — giúp chúng tôi cải thiện dịch vụ).
        </li>
      </ul>
      <p>
        Chúng tôi sẽ xác minh danh tính trong vòng <strong>3 ngày làm việc</strong> và xoá dữ liệu
        trong vòng <strong>30 ngày</strong> kể từ khi xác minh thành công.
      </p>

      <h3>Cách 3: Gỡ ứng dụng Chợ Đêm Sơn Trà khỏi Facebook</h3>
      <p>
        Nếu bạn đăng nhập bằng Facebook và chỉ muốn ngắt kết nối (không xoá tài khoản chính):
      </p>
      <ol>
        <li>
          Vào{' '}
          <a href="https://www.facebook.com/settings?tab=business_tools">
            Facebook → Settings & Privacy → Settings → Apps and Websites
          </a>
          .
        </li>
        <li>Tìm ứng dụng <strong>"Chợ Đêm Sơn Trà"</strong> trong danh sách Active.</li>
        <li>Nhấn <strong>"Remove"</strong> để gỡ.</li>
      </ol>
      <p>
        Facebook sẽ gửi tín hiệu <strong>Data Deletion Callback</strong> đến máy chủ của chúng tôi.
        Khi nhận được, chúng tôi sẽ tự động:
      </p>
      <ul>
        <li>Vô hiệu hoá liên kết Facebook Login với tài khoản của bạn.</li>
        <li>Xoá Facebook App-scoped User ID, profile picture URL, locale, raw OAuth payload.</li>
        <li>Giữ lại email/họ tên nếu bạn đã từng đặt hàng (cần cho hoá đơn).</li>
        <li>
          Nếu bạn muốn xoá hoàn toàn tài khoản (bao gồm cả lịch sử đơn hàng), vui lòng dùng Cách 1
          hoặc Cách 2.
        </li>
      </ul>

      <h2>2. Dữ liệu nào sẽ bị xoá?</h2>
      <ul>
        <li>Thông tin tài khoản: email, mật khẩu băm, họ tên, số điện thoại, vai trò.</li>
        <li>Hồ sơ Facebook: App-scoped User ID, ảnh đại diện, locale, raw OAuth payload.</li>
        <li>Hồ sơ Messenger: Page-scoped ID (PSID), lịch sử tin nhắn.</li>
        <li>Wishlist, giỏ hàng, đánh giá sản phẩm.</li>
        <li>Visitor ID, session log, page-view history.</li>
        <li>Hồ sơ tiểu thương (nếu có): tên gian hàng, mô tả, hình ảnh sản phẩm.</li>
      </ul>

      <h2>3. Dữ liệu nào KHÔNG bị xoá ngay (lưu giữ theo luật)?</h2>
      <p>
        Theo Luật Kế toán Việt Nam (Điều 41) và Thông tư 78/2021/TT-BTC về hoá đơn điện tử, một số
        dữ liệu sẽ được lưu trữ với hình thức tối thiểu (chỉ dùng cho mục đích thuế và kiểm toán):
      </p>
      <ul>
        <li>
          Hoá đơn điện tử của các đơn hàng đã hoàn thành thanh toán — lưu <strong>10 năm</strong>.
        </li>
        <li>
          Log giao dịch tài chính (số tiền, ngày giao dịch, mã giao dịch) — lưu <strong>10 năm</strong>.
        </li>
      </ul>
      <p>
        Trên các hồ sơ này, thông tin cá nhân (email, số điện thoại) sẽ được <strong>ẩn danh hoá</strong>{' '}
        (thay bằng mã định danh đã băm) sau khi bạn yêu cầu xoá.
      </p>

      <h2>4. Cách lấy Facebook App-scoped User ID</h2>
      <p>
        Nếu bạn cần cung cấp App-scoped User ID khi gửi email yêu cầu xoá (Cách 2):
      </p>
      <ol>
        <li>Đăng nhập Facebook tại <a href="https://www.facebook.com">facebook.com</a>.</li>
        <li>
          Vào{' '}
          <a href="https://www.facebook.com/settings?tab=business_tools">
            Settings → Apps and Websites
          </a>
          .
        </li>
        <li>
          Nhấn vào ứng dụng <strong>"Chợ Đêm Sơn Trà"</strong>.
        </li>
        <li>
          Trong phần <strong>"User ID for this app"</strong>, sao chép chuỗi số dài (ví dụ:{' '}
          <code>10221234567890123</code>).
        </li>
      </ol>

      <h2>5. Xác nhận hoàn tất</h2>
      <p>
        Sau khi xoá dữ liệu xong, chúng tôi sẽ gửi email xác nhận đến địa chỉ bạn đã đăng ký, kèm:
      </p>
      <ul>
        <li><strong>Mã xác nhận xoá</strong> (Deletion Confirmation Code).</li>
        <li>
          <strong>URL trạng thái</strong> để bạn có thể kiểm tra trạng thái xoá bất cứ lúc nào:{' '}
          <code>https://dhtcdanang.com/data-deletion/status/&lt;code&gt;</code>.
        </li>
        <li>Danh sách các loại dữ liệu đã xoá và các loại dữ liệu giữ lại theo luật.</li>
      </ul>

      <h2>6. Liên hệ</h2>
      <ul>
        <li>
          <strong>Email yêu cầu xoá dữ liệu:</strong>{' '}
          <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Hotline hỗ trợ:</strong> +84 236 3 888 666 (giờ hành chính, GMT+7)
        </li>
        <li>
          <strong>Địa chỉ:</strong> Chợ Đêm Sơn Trà, đường Mai Hắc Đế, phường An Hải Tây, quận Sơn
          Trà, thành phố Đà Nẵng, Việt Nam.
        </li>
      </ul>

      <hr />

      <h2>English summary (for Meta App Review)</h2>
      <p>
        Users can request deletion of their personal data at any time through 3 methods:
      </p>
      <ol>
        <li>
          <strong>Self-service:</strong> Log in at <a href="/login">dhtcdanang.com/login</a> →
          Account → Settings → Delete account.
        </li>
        <li>
          <strong>Email request:</strong> Send email to{' '}
          <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a> with subject "Data
          Deletion Request" and verification details.
        </li>
        <li>
          <strong>Facebook disconnect:</strong> Remove "Chợ Đêm Sơn Trà" app from{' '}
          <a href="https://www.facebook.com/settings?tab=business_tools">
            Facebook Settings → Apps and Websites
          </a>
          . Our server will receive the Data Deletion Callback and automatically purge all
          Facebook-derived data (app-scoped User ID, profile picture, locale, OAuth payload).
        </li>
      </ol>
      <p>
        <strong>SLA:</strong> Identity verification within 3 business days; full data purge within 30
        days from verification. Confirmation email sent upon completion with a unique Deletion
        Confirmation Code.
      </p>
      <p>
        <strong>Retention exception:</strong> Tax invoices and financial transaction logs are
        retained for 10 years per Vietnamese Accounting Law (Article 41) and Circular 78/2021/TT-BTC,
        with personal identifiers anonymized.
      </p>
    </LegalLayout>
  )
}
