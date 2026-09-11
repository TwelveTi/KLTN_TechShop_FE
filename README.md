# TechShop Frontend

Giao diện web của khoá luận TechShop — cửa hàng thiết bị công nghệ có trợ lý AI tư vấn
và hệ thống gợi ý sản phẩm.

## 1. Công nghệ sử dụng

| Thành phần | Thư viện | Vai trò |
|---|---|---|
| Thư viện giao diện | React 19 | Dựng giao diện bằng component |
| Công cụ build | Vite | Chạy server dev và đóng gói bản build |
| CSS | Tailwind CSS 4 | Viết style bằng class có sẵn, không cần file .css riêng |
| Điều hướng | React Router | Mỗi URL ứng với một trang |
| Gọi API | Axios | Gửi request tới backend Express |
| Biểu tượng | Lucide | Một bộ icon duy nhất cho toàn app |
| Chữ | Fontsource | Ba bộ chữ đóng gói cùng app, không tải từ CDN |

Toàn bộ mã nguồn viết bằng **JavaScript (JSX)**, không dùng TypeScript, để đồng bộ với
backend cũng viết bằng JavaScript thuần.

Giao diện tuân theo bản thiết kế trong [`docs/design-system.md`](docs/design-system.md)
và các bản đặc tả trang trong `docs/pages/`, `docs/components/`.

> Thư mục `docs/` cố tình **không đưa lên git** (giống quyết định cũ ở `FE_V2`).
> Nó chỉ nằm trên máy, nên khi đổi máy nhớ chép tay sang.

## 2. Cách chạy

```bash
npm install
npm run dev
```

Mặc định chạy ở http://localhost:5173. Backend phải chạy sẵn ở
http://localhost:3000 (đổi được trong file `.env`).

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 3. Cấu trúc thư mục

```
src/
├── main.jsx            Điểm khởi động, bọc các Provider
├── App.jsx             Bảng định tuyến — toàn bộ URL của app nằm ở đây
├── index.css           Tầng token: màu, chữ, bo góc, đổ bóng, chế độ tối
│
├── api/                Mỗi file là một nhóm endpoint của backend
│   ├── axiosClient.js  Cấu hình axios chung: gắn token, bóc dữ liệu, xử lý 401
│   ├── authApi.js      Đăng nhập, đăng ký, quên mật khẩu
│   ├── productApi.js   Sản phẩm, danh mục, thương hiệu
│   ├── cartApi.js      Giỏ hàng
│   ├── orderApi.js     Đặt hàng, thanh toán VNPay
│   ├── reviewApi.js    Đánh giá sản phẩm
│   ├── userApi.js      Hồ sơ và địa chỉ giao hàng
│   ├── aiApi.js        Trợ lý AI tư vấn / so sánh
│   ├── recommendationApi.js  Hệ thống gợi ý
│   └── adminApi.js     Toàn bộ API trang quản trị
│
├── context/            Dữ liệu dùng chung cho nhiều trang
│   ├── AuthContext.jsx Người đang đăng nhập
│   └── CartContext.jsx Giỏ hàng
│
├── components/
│   ├── ui/             Thư viện component chung: Button, Input, Card, Badge,
│   │                   Modal, Alert, Table, Skeleton, EmptyState…
│   └── …               Component của cửa hàng: Header, ProductCard, giỏ, gợi ý
│
├── layouts/            Bốn khung trang
│   ├── MainLayout      Cửa hàng: header + thanh danh mục + chân trang
│   ├── FocusedLayout   Đặt hàng: header rút gọn, không có lối rẽ
│   ├── AuthLayout      Đăng nhập: chia hai cột
│   └── AdminLayout     Quản trị: menu trái + thanh tiêu đề
│
├── pages/              Mỗi file là một trang
│   └── admin/          Các trang của khu vực quản trị
└── utils/format.js     Định dạng tiền, ngày tháng, nhãn trạng thái
```

## 4. Bốn điểm cần nắm khi đọc code

### 4.1. Mọi request đều đi qua `api/axiosClient.js`

File này cấu hình axios một lần cho cả app:

- **Interceptor request** tự gắn `Authorization: Bearer <token>` vào mọi lời gọi,
  nên các file API bên dưới không phải tự lo chuyện đăng nhập.
- **Interceptor response** bóc lớp vỏ `{ code, message, data }` mà backend trả về,
  nên ở màn hình chỉ nhận được phần `data`. Khi gặp lỗi 401 (token hết hạn) thì nó
  tự xin token mới qua `/auth/refresh` rồi gửi lại request đúng một lần.

### 4.2. Gọi API trong `useEffect`, giữ 3 biến trạng thái

Mỗi trang cần dữ liệu đều theo cùng một khuôn:

```jsx
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

useEffect(() => {
  productApi.getProducts()
    .then((res) => setData(res.items))
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false))
}, [])
```

Khuôn này lặp lại ở mọi trang một cách có chủ ý: đọc tới đâu hiểu tới đó, không cần
biết thêm khái niệm cache hay thư viện quản lý trạng thái nào khác.

### 4.3. Màu và cỡ chữ là token, không viết thẳng vào component

`src/index.css` khai báo một lần toàn bộ bảng màu, thang chữ, bo góc và đổ bóng
dưới dạng biến CSS, rồi ánh xạ sang class của Tailwind. Component chỉ gọi tên:
`bg-surface`, `text-muted`, `rounded-md`, `shadow-sm` — không có mã màu nào nằm
rải rác trong JSX.

Nhờ vậy chế độ tối chỉ cần định nghĩa lại giá trị của các biến trong một khối
`@media (prefers-color-scheme: dark)` duy nhất, không phải sửa từng trang.

### 4.4. Bộ lọc nằm trên URL

Trang danh sách sản phẩm dùng `useSearchParams` để lưu từ khoá, danh mục, thương hiệu
và số trang lên thanh địa chỉ. Nhờ vậy link chia sẻ được, và nút Back của trình duyệt
hoạt động đúng.

## 5. Danh sách trang

| URL | Trang | Yêu cầu |
|---|---|---|
| `/` | Trang chủ | — |
| `/products` | Danh sách sản phẩm, lọc và phân trang | — |
| `/products/:id` | Chi tiết sản phẩm, đánh giá, sản phẩm tương tự | — |
| `/cart` | Giỏ hàng | — |
| `/advisor` | Trợ lý AI tư vấn và so sánh | — |
| `/login`, `/register`, `/forgot-password` | Tài khoản | — |
| `/checkout` | Đặt hàng | Đăng nhập |
| `/checkout/success`, `/checkout/failed` | Kết quả thanh toán | — |
| `/profile`, `/my-orders`, `/addresses` | Khu vực tài khoản | Đăng nhập |
| `/admin/*` | Khu vực quản trị | Đăng nhập, role ADMIN |

## 6. Hai tính năng AI trên giao diện

**Trợ lý tư vấn** (`pages/AdvisorPage.jsx`) — người dùng hỏi bằng tiếng Việt, backend
gọi model kèm công cụ tra cứu sản phẩm trong cơ sở dữ liệu rồi trả về câu trả lời cùng
danh sách sản phẩm liên quan. Một lượt hỏi có thể mất vài chục giây, nên timeout của
axios được đặt 60 giây.

**Dải gợi ý** (`components/RecommendationRail.jsx`) — hiển thị sản phẩm được gợi ý kèm
nhãn lý do (giống sản phẩm đã xem, hợp tầm giá, đang bán chạy...). Khi người dùng bấm
vào một gợi ý, giao diện gửi hai tín hiệu về server: `recordOutcome` để tính CTR cho
chương đánh giá, và `reportClick` để hệ thống học thêm về sở thích người dùng. Nút
"Vì sao gợi ý sản phẩm này?" gọi model sinh một lời giải thích ngắn — chỉ gọi khi người
dùng bấm, không gọi sẵn, để không tiêu hết hạn mức API.
