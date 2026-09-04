import { useNavigate } from '@core/router'
import { paths } from '@routes/paths'
import { Icon } from '@shared/ui/Icon'
import { ProductCard } from '@shared/ui/ProductCard'
import { GroundingNote } from './GroundingNote'
import type { AdvisorMessage } from '../types'

/**
 * Một lượt trong khung chat.
 *
 * Bố cục phản ánh đúng ranh giới dữ liệu: `text` là lời của model, danh sách
 * dưới nó là các hàng backend lấy từ cơ sở dữ liệu. Hai thứ không bao giờ trộn
 * vào nhau — không có chuyện dò tên sản phẩm trong câu trả lời rồi dựng thẻ từ
 * đó. Nhờ vậy, nếu model có nhắc một sản phẩm không tồn tại thì tên đó chỉ nằm
 * trong đoạn chữ và không có thẻ nào cho nó.
 */

/**
 * Câu trả lời về dưới dạng markdown nhẹ của model (`**đậm**`, gạch đầu dòng).
 * Ta không nạp thư viện markdown cho một khung chat — chỉ tách đoạn và bỏ dấu
 * `**`, đủ để đọc mà không phải tin vào việc render HTML do model sinh ra.
 */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/\*\*/g, '').trim())
    .filter((line) => line !== '')
}

export function AdvisorMessageBubble({ message }: { message: AdvisorMessage }) {
  const navigate = useNavigate()

  if (message.role === 'user') {
    return (
      <li className="ts-advisor-turn ts-advisor-turn--user">
        <p className="ts-advisor-bubble ts-advisor-bubble--user">{message.text}</p>
      </li>
    )
  }

  const isError = message.isError === true

  return (
    <li className="ts-advisor-turn">
      <div className="ts-advisor-turn__avatar" aria-hidden="true">
        <Icon name={isError ? 'alert-circle' : 'sparkles'} size={16} />
      </div>

      <div className="ts-advisor-turn__body">
        <div className={`ts-advisor-bubble${isError ? ' ts-advisor-bubble--error' : ''}`}>
          {toParagraphs(message.text).map((line, index) => (
            <p className="ts-advisor-bubble__line" key={index}>
              {line}
            </p>
          ))}
        </div>

        {message.products.length > 0 && (
          <ul className="ts-advisor-products">
            {message.products.map((product) => (
              <li key={product.id}>
                {/* `default` (thẻ dọc) chứ không phải `list`: biến thể `list`
                    cố định ảnh 220px và chỉ xuống hàng ở viewport dưới 640px,
                    nên trong panel rộng 360px trên màn hình desktop nó để lại
                    ~140px cho toàn bộ phần chữ. Thẻ dọc vừa khít cột hẹp. */}
                <ProductCard
                  product={product}
                  onOpen={() => navigate(paths.product(product.id))}
                />
              </li>
            ))}
          </ul>
        )}

        <GroundingNote toolCalls={message.toolCalls} />
      </div>
    </li>
  )
}
