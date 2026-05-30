import { LegalLayout } from './LegalLayout'
import { useT } from '@/i18n/useT'

function ViBody() {
  return (
    <>
      <h2>1. Chấp nhận điều khoản</h2>
      <p>
        Bằng việc tạo tài khoản, đăng nhập, hoặc sử dụng bất kỳ tính năng nào của Chợ Đêm Sơn Trà
        (sau đây gọi là <strong>"Nền tảng"</strong>), bạn xác nhận đã đọc, hiểu và đồng ý ràng buộc
        với toàn bộ Điều khoản này cùng với{' '}
        <a href="/privacy">Chính sách bảo mật</a>. Nếu không đồng ý, vui lòng ngừng sử dụng.
      </p>

      <h2>2. Điều kiện sử dụng</h2>
      <ul>
        <li>Bạn phải <strong>đủ 18 tuổi</strong> hoặc có sự đồng ý của người giám hộ.</li>
        <li>
          Bạn cam kết cung cấp thông tin <strong>chính xác, đầy đủ</strong> và cập nhật khi cần.
        </li>
        <li>Một người chỉ được sở hữu một tài khoản. Việc tạo nhiều tài khoản để gian lận có thể dẫn đến khoá vĩnh viễn.</li>
      </ul>

      <h2>3. Tài khoản và bảo mật</h2>
      <ul>
        <li>
          Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động xảy ra dưới tài khoản của mình.
        </li>
        <li>
          Nếu phát hiện truy cập trái phép, vui lòng thông báo ngay cho{' '}
          <a href="mailto:support@dhtcdanang.com">support@dhtcdanang.com</a>.
        </li>
        <li>
          Khi đăng nhập bằng Facebook, bạn đồng thời chịu sự điều chỉnh của{' '}
          <a href="https://www.facebook.com/legal/terms">Điều khoản dịch vụ Facebook</a> đối với phần
          dữ liệu Facebook cung cấp cho chúng tôi.
        </li>
      </ul>

      <h2>4. Vai trò người dùng</h2>

      <h3>4.1. Khách hàng</h3>
      <ul>
        <li>Cam kết thanh toán đầy đủ khi đặt hàng và cung cấp địa chỉ giao hàng chính xác.</li>
        <li>Không sử dụng nền tảng cho mục đích bất hợp pháp, gian lận hoặc lừa đảo.</li>
        <li>
          Khi đánh giá sản phẩm, đánh giá phải trung thực, không bôi nhọ, không sử dụng ngôn từ tục
          tĩu.
        </li>
      </ul>

      <h3>4.2. Tiểu thương (Seller)</h3>
      <ul>
        <li>
          Cam kết bán sản phẩm <strong>đúng mô tả</strong>, <strong>đúng chất lượng</strong>, và tuân
          thủ quy định về an toàn thực phẩm (nếu là thực phẩm).
        </li>
        <li>
          Không bán hàng giả, hàng nhái, hàng cấm, hàng xâm phạm quyền sở hữu trí tuệ.
        </li>
        <li>
          Tự chịu trách nhiệm về thuế GTGT, thuế thu nhập cá nhân theo quy định của Nhà nước.
        </li>
        <li>Xử lý đơn hàng và phản hồi khiếu nại trong vòng 48 giờ.</li>
        <li>
          Cam kết hình ảnh sản phẩm <strong>thuộc sở hữu của mình</strong> hoặc đã được cấp phép sử
          dụng.
        </li>
      </ul>

      <h2>5. Thanh toán</h2>
      <ul>
        <li>
          Thanh toán qua <strong>Vietcombank VietQR</strong> — số tiền sẽ được giữ trong ví chợ đến
          khi khách xác nhận đã nhận hàng (hoặc tự động sau 7 ngày).
        </li>
        <li>
          Phí dịch vụ: <strong>5%</strong> giá trị đơn hàng (đã bao gồm phí xử lý thanh toán).
        </li>
        <li>
          Tiểu thương rút tiền tối thiểu 100.000 VND, xử lý trong vòng 2 ngày làm việc.
        </li>
        <li>Mọi giao dịch đều có hoá đơn điện tử theo Thông tư 78/2021/TT-BTC.</li>
      </ul>

      <h2>6. Vận chuyển</h2>
      <ul>
        <li>
          Đối tác vận chuyển chính: <strong>DHL Express</strong> (quốc tế), <strong>Giao Hàng Nhanh
          / Viettel Post</strong> (nội địa).
        </li>
        <li>Thời gian giao hàng quốc tế: 5-10 ngày làm việc.</li>
        <li>Thời gian giao hàng nội địa: 1-3 ngày làm việc.</li>
        <li>
          Trường hợp thất lạc/hư hỏng do đơn vị vận chuyển, khách hàng được bồi thường theo chính sách
          của đơn vị vận chuyển.
        </li>
      </ul>

      <h2>7. Đổi trả và hoàn tiền</h2>
      <ul>
        <li>
          Khách hàng có quyền yêu cầu trả hàng trong <strong>7 ngày</strong> kể từ ngày nhận với điều
          kiện sản phẩm còn nguyên seal, chưa qua sử dụng.
        </li>
        <li>
          Thực phẩm tươi sống không thuộc diện đổi trả trừ khi có lỗi rõ ràng (hỏng, thiu, sai sản
          phẩm).
        </li>
        <li>Tiểu thương có 48 giờ để phản hồi yêu cầu đổi trả.</li>
        <li>
          Trường hợp tranh chấp, Quản trị viên Chợ Đêm Sơn Trà sẽ là bên trung gian giải quyết, quyết
          định cuối cùng dựa trên bằng chứng (ảnh, video, lịch sử chat).
        </li>
      </ul>

      <h2>8. Quyền sở hữu trí tuệ</h2>
      <ul>
        <li>
          Logo, thương hiệu "Chợ Đêm Sơn Trà", thiết kế giao diện thuộc sở hữu của chúng tôi.
        </li>
        <li>
          Nội dung do tiểu thương đăng (mô tả sản phẩm, hình ảnh) thuộc sở hữu của tiểu thương — họ
          cấp cho chúng tôi giấy phép không độc quyền, toàn cầu, miễn phí để hiển thị trên nền tảng
          và quảng bá nền tảng.
        </li>
        <li>
          Cấm sao chép, scrape dữ liệu sản phẩm với mục đích thương mại mà không có sự đồng ý bằng
          văn bản.
        </li>
      </ul>

      <h2>9. Nội dung bị cấm</h2>
      <p>Bạn đồng ý KHÔNG đăng hoặc giao dịch các nội dung/sản phẩm sau:</p>
      <ul>
        <li>Hàng giả, hàng nhái, hàng xâm phạm bản quyền/nhãn hiệu.</li>
        <li>Vũ khí, chất nổ, chất cấm, ma tuý, thuốc lá điện tử.</li>
        <li>Động vật hoang dã, sản phẩm từ động vật hoang dã thuộc danh mục CITES.</li>
        <li>Nội dung khiêu dâm, bạo lực, kích động thù hằn.</li>
        <li>Thông tin sai lệch về dịch bệnh, chính trị, tôn giáo.</li>
        <li>Phần mềm độc hại, malware, công cụ hack.</li>
      </ul>
      <p>
        Vi phạm sẽ dẫn đến gỡ bỏ sản phẩm, khoá tài khoản, và có thể bị báo cáo cho cơ quan chức
        năng.
      </p>

      <h2>10. Chấm dứt sử dụng</h2>
      <ul>
        <li>
          Bạn có thể tự xoá tài khoản bất cứ lúc nào — xem hướng dẫn tại{' '}
          <a href="/data-deletion">/data-deletion</a>.
        </li>
        <li>
          Chúng tôi có quyền tạm khoá hoặc chấm dứt tài khoản nếu phát hiện vi phạm, có thông báo
          trước 7 ngày (trừ trường hợp vi phạm nghiêm trọng).
        </li>
        <li>
          Sau khi tài khoản chấm dứt, số dư trong ví (nếu có) sẽ được hoàn trả về tài khoản ngân hàng
          đã đăng ký trong vòng 30 ngày.
        </li>
      </ul>

      <h2>11. Tuyên bố miễn trừ trách nhiệm</h2>
      <p>
        Dịch vụ được cung cấp <strong>"như hiện trạng"</strong>. Chúng tôi không bảo đảm rằng dịch vụ
        sẽ luôn sẵn sàng, không gián đoạn, hoặc không có lỗi. Trong phạm vi pháp luật cho phép, chúng
        tôi không chịu trách nhiệm về thiệt hại gián tiếp, ngẫu nhiên, hoặc do mất dữ liệu phát sinh
        từ việc sử dụng dịch vụ.
      </p>

      <h2>12. Giải quyết tranh chấp</h2>
      <ul>
        <li>
          Mọi tranh chấp ưu tiên giải quyết qua thương lượng. Liên hệ{' '}
          <a href="mailto:support@dhtcdanang.com">support@dhtcdanang.com</a>.
        </li>
        <li>
          Nếu không thoả thuận được, tranh chấp sẽ được giải quyết tại{' '}
          <strong>Toà án Nhân dân thành phố Đà Nẵng</strong>, theo pháp luật Việt Nam.
        </li>
      </ul>

      <h2>13. Thay đổi điều khoản</h2>
      <p>
        Chúng tôi có thể cập nhật Điều khoản này. Thay đổi đáng kể sẽ được thông báo qua email và
        banner ít nhất 15 ngày trước khi có hiệu lực. Việc tiếp tục sử dụng dịch vụ sau ngày hiệu
        lực đồng nghĩa với việc bạn chấp nhận điều khoản mới.
      </p>

      <h2>14. Liên hệ</h2>
      <ul>
        <li>
          <strong>Email hỗ trợ:</strong>{' '}
          <a href="mailto:support@dhtcdanang.com">support@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Email pháp lý:</strong>{' '}
          <a href="mailto:legal@dhtcdanang.com">legal@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Hotline:</strong> +84 236 3 888 666 (8h00 - 22h00 GMT+7)
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
      <h2>1. Acceptance of terms</h2>
      <p>
        By creating an account, logging in, or using any feature of Chợ Đêm Sơn Trà (hereafter the{' '}
        <strong>"Platform"</strong>), you confirm that you have read, understood, and agree to be
        bound by these Terms together with our <a href="/privacy">Privacy Policy</a>. If you do not
        agree, please stop using the services.
      </p>

      <h2>2. Eligibility</h2>
      <ul>
        <li>You must be <strong>18 or older</strong>, or have guardian consent.</li>
        <li>
          You commit to providing <strong>accurate, complete</strong> information and to keeping it
          updated when needed.
        </li>
        <li>
          A person may only own one account. Creating multiple accounts for fraudulent purposes may
          lead to permanent suspension.
        </li>
      </ul>

      <h2>3. Account security</h2>
      <ul>
        <li>You are responsible for securing your password and all activity under your account.</li>
        <li>
          If you detect unauthorized access, notify{' '}
          <a href="mailto:support@dhtcdanang.com">support@dhtcdanang.com</a> immediately.
        </li>
        <li>
          When logging in with Facebook, you are also subject to the{' '}
          <a href="https://www.facebook.com/legal/terms">Facebook Terms of Service</a> for the data
          Facebook provides to us.
        </li>
      </ul>

      <h2>4. User roles</h2>

      <h3>4.1. Customers</h3>
      <ul>
        <li>Commit to full payment at order time and to providing an accurate shipping address.</li>
        <li>Do not use the Platform for unlawful, fraudulent, or deceptive purposes.</li>
        <li>
          Reviews must be honest, non-defamatory, and free of obscene language.
        </li>
      </ul>

      <h3>4.2. Sellers (merchants)</h3>
      <ul>
        <li>
          Commit to selling products <strong>as described</strong> and <strong>at the stated
          quality</strong>, in compliance with food safety regulations where applicable.
        </li>
        <li>
          Do not sell counterfeit, knock-off, prohibited goods, or goods that infringe intellectual
          property rights.
        </li>
        <li>
          Bear responsibility for VAT and personal income tax obligations under Vietnamese law.
        </li>
        <li>Process orders and respond to complaints within 48 hours.</li>
        <li>
          Warrant that product images <strong>are owned by you</strong> or properly licensed.
        </li>
      </ul>

      <h2>5. Payment</h2>
      <ul>
        <li>
          Payments are processed via <strong>Vietcombank VietQR</strong> — funds are held in
          escrow until the customer confirms receipt (or automatically after 7 days).
        </li>
        <li>
          Service fee: <strong>5%</strong> of order value (includes payment processing fees).
        </li>
        <li>
          Minimum merchant withdrawal: 100,000 VND, processed within 2 business days.
        </li>
        <li>Every transaction generates an e-invoice per Circular 78/2021/TT-BTC.</li>
      </ul>

      <h2>6. Shipping</h2>
      <ul>
        <li>
          Primary shipping partners: <strong>DHL Express</strong> (international),{' '}
          <strong>Giao Hàng Nhanh / Viettel Post</strong> (domestic).
        </li>
        <li>International delivery time: 5-10 business days.</li>
        <li>Domestic delivery time: 1-3 business days.</li>
        <li>
          If loss or damage occurs in transit, customers are compensated under the carrier's
          policy.
        </li>
      </ul>

      <h2>7. Returns and refunds</h2>
      <ul>
        <li>
          Customers may request a return within <strong>7 days</strong> of receipt, provided the
          product is sealed and unused.
        </li>
        <li>
          Fresh produce is non-returnable unless there is a clear defect (spoiled, wrong item).
        </li>
        <li>Merchants have 48 hours to respond to a return request.</li>
        <li>
          In disputes, Chợ Đêm Sơn Trà administrators mediate; the final decision is based on
          evidence (photos, video, chat history).
        </li>
      </ul>

      <h2>8. Intellectual property</h2>
      <ul>
        <li>
          The "Chợ Đêm Sơn Trà" logo and brand, and the platform's UI design, are owned by us.
        </li>
        <li>
          Content posted by merchants (product descriptions, images) is owned by the merchant — they
          grant us a non-exclusive, worldwide, royalty-free license to display it on the platform
          and to promote the platform.
        </li>
        <li>
          Scraping or copying product data for commercial purposes without written consent is
          prohibited.
        </li>
      </ul>

      <h2>9. Prohibited content</h2>
      <p>You agree NOT to post or transact in the following content/products:</p>
      <ul>
        <li>Counterfeit goods, knock-offs, or items infringing copyright/trademark.</li>
        <li>Weapons, explosives, controlled substances, drugs, e-cigarettes.</li>
        <li>Wildlife or wildlife-derived products listed under CITES.</li>
        <li>Pornographic, violent, or hate-inciting content.</li>
        <li>Misinformation about disease outbreaks, politics, or religion.</li>
        <li>Malware, spyware, hacking tools.</li>
      </ul>
      <p>
        Violations will result in product removal, account suspension, and possible report to
        authorities.
      </p>

      <h2>10. Termination</h2>
      <ul>
        <li>
          You may delete your account at any time — see instructions at{' '}
          <a href="/data-deletion">/data-deletion</a>.
        </li>
        <li>
          We reserve the right to suspend or terminate your account if violations are detected, with
          7 days' notice (except for serious violations).
        </li>
        <li>
          After termination, any wallet balance is returned to your registered bank account within
          30 days.
        </li>
      </ul>

      <h2>11. Disclaimer</h2>
      <p>
        The service is provided <strong>"as is"</strong>. We do not warrant that the service will
        always be available, uninterrupted, or error-free. To the extent permitted by law, we are not
        liable for indirect, incidental, or data-loss damages arising from your use of the service.
      </p>

      <h2>12. Dispute resolution</h2>
      <ul>
        <li>
          Disputes are first resolved by negotiation. Contact{' '}
          <a href="mailto:support@dhtcdanang.com">support@dhtcdanang.com</a>.
        </li>
        <li>
          If negotiation fails, disputes will be resolved at the{' '}
          <strong>People's Court of Đà Nẵng City</strong>, under Vietnamese law.
        </li>
      </ul>

      <h2>13. Changes to terms</h2>
      <p>
        We may update these Terms. Material changes will be announced via email and a banner at
        least 15 days before they take effect. Continued use of the service after the effective date
        constitutes acceptance of the new terms.
      </p>

      <h2>14. Contact</h2>
      <ul>
        <li>
          <strong>Support email:</strong>{' '}
          <a href="mailto:support@dhtcdanang.com">support@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Legal email:</strong>{' '}
          <a href="mailto:legal@dhtcdanang.com">legal@dhtcdanang.com</a>
        </li>
        <li>
          <strong>Hotline:</strong> +84 236 3 888 666 (8:00 - 22:00 GMT+7)
        </li>
        <li>
          <strong>Address:</strong> Chợ Đêm Sơn Trà, Mai Hắc Đế street, An Hải Tây ward, Sơn Trà
          district, Đà Nẵng city, Vietnam.
        </li>
      </ul>
    </>
  )
}

export function TermsOfService() {
  const { t, lang } = useT()
  const effectiveDate = lang === 'en' ? 'May 25, 2026' : '25/05/2026'
  return (
    <LegalLayout
      title={t('legalPage.terms.title')}
      subtitle={t('legalPage.terms.subtitle')}
      effectiveDate={effectiveDate}
    >
      {lang === 'en' ? <EnBody /> : <ViBody />}
    </LegalLayout>
  )
}
