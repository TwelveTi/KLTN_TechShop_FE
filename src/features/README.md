# Feature Layer — Tầng 3

Lát cắt theo nghiệp vụ. Mỗi feature có thể chứa:

```
<feature>/
  index.ts      ← PUBLIC API: nơi import hợp lệ DUY NHẤT từ bên ngoài
  api/          ← <feature>Api.ts · dto.ts · mappers.ts
  hooks/        ← thứ duy nhất mà UI được gọi để lấy dữ liệu
  model/        ← type cục bộ + quy tắc nghiệp vụ thuần
  components/
  screens/      ← 1 file = 1 route  (hiện còn tên `pages/`, đổi ở GĐ3)
  styles/
```

## Danh sách feature

- `auth` — đăng nhập, đăng ký, phiên, đổi/quên mật khẩu. **Platform feature.**
- `cart` — dòng giỏ, số lượng, hợp nhất giỏ khách ↔ giỏ server. **Platform feature.**
- `catalog` — danh mục, thương hiệu, danh sách, chi tiết, tìm kiếm, lọc, đánh giá.
- `checkout` — tạo đơn, địa chỉ giao, thanh toán.
- `profile` — thông tin tài khoản, địa chỉ, lịch sử đơn.
- `admin` — dashboard, doanh thu, CRUD quản trị.
- `home` — trang chủ công khai.
- `recommendations`, `ai-assistant` — chưa triển khai.

## Luật giữa các feature

Mặc định **feature không được import feature khác**. Hai lối thoát duy nhất:

1. Thứ được chia sẻ là type/hàm thuần → chuyển xuống `@domain` hoặc `@shared`.
2. Là **platform feature** (`auth`, `cart`) → chỉ import qua `index.ts`.

Cạnh còn nợ: `checkout → profile` (địa chỉ). GĐ sau tách `features/addresses` riêng.
