import { useSearchParams } from 'react-router-dom'
import { LegalLayout } from './LegalLayout'
import { useT } from '@/i18n/useT'

function ViBody() {
  return (
    <>
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
        <li>Visitor ID, session log, page-view history, bản ghi đồng ý cookie (<code>consent_logs</code>).</li>
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
          <code>https://dhtcdanang.com/data-deletion?code=&lt;code&gt;</code>.
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
    </>
  )
}

function EnBody() {
  return (
    <>
      <h2>1. Three ways to delete your data</h2>

      <h3>Method 1: Self-service deletion in your account</h3>
      <ol>
        <li>
          Log in at <a href="/login">dhtcdanang.com/login</a>.
        </li>
        <li>
          Go to <strong>Account → Settings → Delete account</strong>.
        </li>
        <li>Enter a deletion reason (optional) and confirm with your password / email OTP.</li>
        <li>
          The system deactivates your account immediately and fully purges data within{' '}
          <strong>30 days</strong>.
        </li>
      </ol>

      <h3>Method 2: Email request</h3>
      <p>
        If you cannot log in (lost password, lost Facebook access...), email{' '}
        <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a> with the subject{' '}
        <strong>"Data Deletion Request"</strong> and include:
      </p>
      <ul>
        <li>The full name registered on our system.</li>
        <li>The email or phone number used for registration.</li>
        <li>
          If you logged in with Facebook: provide your Facebook App-scoped User ID (see Section 4
          below to find it).
        </li>
        <li>
          Reason for deletion (optional — helps us improve our service).
        </li>
      </ul>
      <p>
        We verify identity within <strong>3 business days</strong> and purge data within{' '}
        <strong>30 days</strong> of successful verification.
      </p>

      <h3>Method 3: Remove the Chợ Đêm Sơn Trà app from Facebook</h3>
      <p>
        If you logged in with Facebook and only want to disconnect (without deleting your main
        account):
      </p>
      <ol>
        <li>
          Go to{' '}
          <a href="https://www.facebook.com/settings?tab=business_tools">
            Facebook → Settings & Privacy → Settings → Apps and Websites
          </a>
          .
        </li>
        <li>Find the <strong>"Chợ Đêm Sơn Trà"</strong> app under Active.</li>
        <li>Click <strong>"Remove"</strong>.</li>
      </ol>
      <p>
        Facebook will send a <strong>Data Deletion Callback</strong> to our server. On receipt, we
        automatically:
      </p>
      <ul>
        <li>Disable the Facebook Login link to your account.</li>
        <li>Delete the Facebook App-scoped User ID, profile picture URL, locale, raw OAuth payload.</li>
        <li>Retain your email/name if you have ever placed an order (required for invoicing).</li>
        <li>
          If you want full account deletion (including order history), please use Method 1 or
          Method 2.
        </li>
      </ul>

      <h2>2. What data is deleted?</h2>
      <ul>
        <li>Account info: email, hashed password, full name, phone, role.</li>
        <li>Facebook profile: App-scoped User ID, profile picture, locale, raw OAuth payload.</li>
        <li>Messenger profile: Page-scoped ID (PSID), message history.</li>
        <li>Wishlist, cart, product reviews.</li>
        <li>Visitor ID, session logs, page-view history, cookie consent records (<code>consent_logs</code>).</li>
        <li>Merchant profile (if any): shop name, description, product images.</li>
      </ul>

      <h2>3. What data is NOT deleted immediately (kept by law)?</h2>
      <p>
        Under Vietnamese Accounting Law (Article 41) and Circular 78/2021/TT-BTC on e-invoicing,
        some data is retained in minimal form (used only for tax and audit purposes):
      </p>
      <ul>
        <li>
          E-invoices of completed paid orders — retained <strong>10 years</strong>.
        </li>
        <li>
          Financial transaction logs (amount, date, transaction ID) — retained{' '}
          <strong>10 years</strong>.
        </li>
      </ul>
      <p>
        On these records, personal identifiers (email, phone) are <strong>anonymized</strong>{' '}
        (replaced with hashed identifiers) once you request deletion.
      </p>

      <h2>4. How to find your Facebook App-scoped User ID</h2>
      <p>
        If you need to provide your App-scoped User ID when emailing a deletion request (Method 2):
      </p>
      <ol>
        <li>Log in to Facebook at <a href="https://www.facebook.com">facebook.com</a>.</li>
        <li>
          Go to{' '}
          <a href="https://www.facebook.com/settings?tab=business_tools">
            Settings → Apps and Websites
          </a>
          .
        </li>
        <li>
          Click the <strong>"Chợ Đêm Sơn Trà"</strong> app.
        </li>
        <li>
          Under <strong>"User ID for this app"</strong>, copy the long numeric string (e.g.{' '}
          <code>10221234567890123</code>).
        </li>
      </ol>

      <h2>5. Confirmation of completion</h2>
      <p>
        Once deletion is complete, we email a confirmation to your registered address, including:
      </p>
      <ul>
        <li><strong>Deletion Confirmation Code</strong>.</li>
        <li>
          <strong>Status URL</strong> for you to check deletion status at any time:{' '}
          <code>https://dhtcdanang.com/data-deletion?code=&lt;code&gt;</code>.
        </li>
        <li>A list of deleted data types and data types retained by law.</li>
      </ul>

      <h2>6. Contact</h2>
      <ul>
        <li>
          <strong>Data deletion request email:</strong>{' '}
          <a href="mailto:privacy@dhtcdanang.com">privacy@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Support hotline:</strong> +84 236 3 888 666 (business hours, GMT+7)
        </li>
        <li>
          <strong>Address:</strong> Chợ Đêm Sơn Trà, Mai Hắc Đế street, An Hải Tây ward, Sơn Trà
          district, Đà Nẵng city, Vietnam.
        </li>
      </ul>
    </>
  )
}

export function DataDeletion() {
  const { t, lang } = useT()
  const [searchParams] = useSearchParams()
  const confirmationCode = searchParams.get('code')
  const effectiveDate = lang === 'en' ? 'May 31, 2026' : '31/05/2026'
  return (
    <LegalLayout
      title={t('legalPage.dataDeletion.title')}
      subtitle={t('legalPage.dataDeletion.subtitle')}
      effectiveDate={effectiveDate}
    >
      {confirmationCode && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          {lang === 'en' ? (
            <>
              <strong>Deletion request received.</strong> Your data will be purged within 30 days.
              <br />
              Confirmation code: <code className="font-mono text-sm">{confirmationCode}</code>
            </>
          ) : (
            <>
              <strong>Đã nhận yêu cầu xoá dữ liệu.</strong> Dữ liệu sẽ được xoá trong vòng 30 ngày.
              <br />
              Mã xác nhận: <code className="font-mono text-sm">{confirmationCode}</code>
            </>
          )}
        </div>
      )}
      {lang === 'en' ? <EnBody /> : <ViBody />}
    </LegalLayout>
  )
}
