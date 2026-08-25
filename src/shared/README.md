# Shared Layer — Tầng 2

Code dùng lại được ở **bất kỳ ứng dụng nào**, không biết gì về nghiệp vụ TechShop.

- `ui/` — primitive trình bày (Button, Modal, Icon, Table…). Nhận mọi thứ qua props.
- `hooks/` — hook phi nghiệp vụ (timing, DOM, selection, disclosure). *Được lấp ở GĐ2.*
- `utils/` — hàm thuần: money, date, text, url, array. *Được lấp ở GĐ2.*
- `styles/` — `tokens.css` (nơi DUY NHẤT khai báo token toàn cục) và `base.css` (reset).

**Được import:** `@domain`, `@core`.
**Cấm import:** `@features`, `@layouts`, `@routes`, `@app`.

Nếu một thứ cần biết `Product`, `Order`, `useCart` hay URL — nó không thuộc về đây.
