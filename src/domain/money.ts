/**
 * Vnd — số nguyên đồng Việt Nam.
 *
 * Đây là một type alias chứ không phải branded type: mục tiêu là làm cho ý
 * định ĐỌC ĐƯỢC ở mọi chữ ký hàm, không phải dựng rào chắn kiểu. Quy ước đặt
 * tên mới là thứ thực thi Luật 02 — mọi biến tiền kết thúc bằng `Vnd`
 * (`priceVnd`, `subtotalVnd`, `shippingFeeVnd`) và luôn là số.
 *
 * Định dạng: `@shared/utils/money`. Tầng domain không format bao giờ.
 */
export type Vnd = number
