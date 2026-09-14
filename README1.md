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

Dựng lại 2026-09-12 từ `src/App.jsx` — đây là toàn bộ bản đồ URL, không thiếu route
nào. **20 trang**, xếp theo bốn khung layout.

| URL | Trang | Layout | Yêu cầu |
|---|---|---|---|
| `/` | Trang chủ: sản phẩm nổi bật + hai dải gợi ý | Main | — |
| `/products` | Danh sách, lọc theo danh mục/thương hiệu/giá, sắp xếp, phân trang | Main | — |
| `/products/:id` | Chi tiết: ảnh, thông số, đánh giá, sản phẩm tương tự | Main | — |
| `/cart` | Giỏ hàng | Main | — |
| `/advisor` | Trợ lý AI tư vấn và so sánh | Main | — |
| `/checkout/:result` | Kết quả thanh toán (`success` / `failed` từ VNPay) | Main | — |
| `/profile` | Hồ sơ, đổi mật khẩu, ảnh đại diện | Main | Đăng nhập |
| `/my-orders` | Lịch sử đơn, xem chi tiết, **nút huỷ đơn** | Main | Đăng nhập |
| `/addresses` | Sổ địa chỉ giao hàng | Main | Đăng nhập |
| `*` | Không tìm thấy trang | Main | — |
| `/login` | Đăng nhập | Auth | — |
| `/register` | Đăng ký | Auth | — |
| `/forgot-password` | Quên mật khẩu bằng OTP | Auth | — |
| `/checkout` | Đặt hàng: địa chỉ, mã giảm giá, chọn cách thanh toán | Focused | Đăng nhập |
| `/admin` | Bảng điều khiển: doanh thu, biểu đồ ngày, sản phẩm bán chạy | Admin | ADMIN |
| `/admin/products` | Quản lý sản phẩm: CRUD, ảnh, biến thể, thông số | Admin | ADMIN |
| `/admin/categories` | Quản lý danh mục | Admin | ADMIN |
| `/admin/brands` | Quản lý thương hiệu | Admin | ADMIN |
| `/admin/orders` | Quản lý đơn, đổi trạng thái | Admin | ADMIN |
| `/admin/users` | Quản lý người dùng | Admin | ADMIN |

Trang đặt hàng dùng `FocusedLayout` — header rút gọn, **không có lối rẽ nào** ra
khỏi luồng. Đây là lựa chọn thiết kế, không phải thiếu sót: mỗi liên kết ở bước
thanh toán là một cơ hội bỏ giỏ.

## 5.1 Tác nhân và chốt chặn quyền

Bảng này ứng một-đối-một với mục 4.2 của README backend.

| Tác nhân | Thấy được gì |
| --- | --- |
| **Khách vãng lai** | 6 trang cửa hàng + 3 trang đăng nhập/đăng ký. Hỏi được trợ lý AI và nhận gợi ý — backend nhận diện bằng `X-Session-Id` |
| **Khách hàng** | Thêm 4 trang: đặt hàng, hồ sơ, đơn hàng, sổ địa chỉ |
| **Quản trị viên** | Thêm 6 trang dưới `/admin` |

Chốt chặn nằm ở một component duy nhất, `components/ProtectedRoute.jsx`:

- `<ProtectedRoute>` — chưa đăng nhập thì chuyển về `/login`, **nhớ đường dẫn cũ**
  trong `location.state.from` để quay lại sau khi đăng nhập.
- `<ProtectedRoute adminOnly>` — đã đăng nhập nhưng không phải ADMIN thì về `/`.
- Trong lúc còn đang kiểm token (`loading`) thì hiện khung chờ, **không điều hướng**.
  Bỏ nhánh này là người đã đăng nhập bị đá ra ngoài mỗi lần tải lại trang.

Đây là chốt chặn **trải nghiệm**, không phải chốt chặn bảo mật: quyền thật do
backend quyết định ở mỗi request. Người dùng tự sửa `role` trong localStorage chỉ
nhìn thấy khung trang admin rỗng, mọi lời gọi API vẫn trả 403.

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

## 7. Trạng thái giữ ở đâu

Ba nơi, và ranh giới giữa chúng là thứ SRS cần mô tả:

| Nơi | Giữ gì | Vì sao ở đó |
|---|---|---|
| `localStorage` | `accessToken`, `visitorId`, `guestCart` | Sống qua lần tải lại trang |
| Cookie `httpOnly` | Refresh token | JavaScript **không đọc được**, nên một lỗ XSS không lấy được phiên dài hạn. Đây là lý do access token để ở localStorage là chấp nhận được: nó chỉ sống 15 phút |
| `Context` trong RAM | Người đang đăng nhập (`AuthContext`), giỏ hàng (`CartContext`) | Nhiều trang cùng cần, không muốn truyền qua props nhiều tầng |

**`visitorId`** sinh bằng `crypto.randomUUID()` ở lần mở app đầu tiên và gửi kèm
mọi request qua header `X-Session-Id`. Nhờ nó backend ghi được hành vi và giữ được
hội thoại AI của **khách chưa đăng nhập** — điều kiện để hệ gợi ý hoạt động ngay
từ phiên đầu chứ không chờ người dùng đăng ký.

**Giỏ hàng có hai chế độ.** Chưa đăng nhập thì giỏ nằm trong `localStorage`; lúc
đăng nhập, `CartContext` đẩy từng dòng lên server rồi **xoá giỏ cục bộ**. Người
dùng chọn hàng trước, đăng nhập sau, không mất giỏ.

**Làm mới token** xử lý một chỗ duy nhất trong `axiosClient.js`: gặp 401 thì gọi
`/auth/refresh` **đúng một lần** (cờ `_retry`) rồi gửi lại request cũ; thất bại thì
xoá token. Không có vòng lặp vô hạn khi refresh token cũng hết hạn.

## 8. Ánh xạ sang API backend

Chín module trong `src/api/` gọi **70 lời gọi** tới backend. Bảng này để đối chiếu
với mục 5.0.1 của README backend khi viết chương *Interface Requirements*:

| Module | Endpoint thật sự gọi | Trang dùng |
|---|---|---|
| `authApi` | `/auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/verify-reset-otp`, `/reset-password`, `/resend-reset-otp`, `/resend-verification`, `/change-password`, `/users/me` | Đăng nhập, đăng ký, quên mật khẩu |
| `productApi` | `/products`, `/products/:idOrSlug`, `/categories`, `/brands` | Trang chủ, danh sách, chi tiết |
| `cartApi` | `/cart`, `/cart/items`, `/cart/items/:id` | Giỏ, đặt hàng |
| `orderApi` | `/orders`, `/orders/me`, `/orders/:id/cancel`, `/discounts/validate`, `/payments/vnpay/create-url` | Đặt hàng, đơn của tôi |
| `reviewApi` | `/products/:id/reviews`, `/products/:id/reviews/summary`, `/reviews/:id` | Chi tiết sản phẩm |
| `userApi` | `/users/me`, `/users/me/avatar`, `/addresses/me`, `/addresses/me/:id`, `/addresses/me/:id/default` | Hồ sơ, sổ địa chỉ |
| `aiApi` | `/ai/advisor`, `/ai/compare`, `/ai/conversations`, `/ai/conversations/:id` | Trợ lý AI |
| `recommendationApi` | `/recommendations`, `/recommendations/products/:id/similar`, `/recommendations/items/:id/outcome`, `/ai/recommendations/:id/explain`, `/behaviors` | Dải gợi ý, theo dõi hành vi |
| `adminApi` | `/admin/products`, `/categories`, `/brands`, `/orders`, `/orders/:id/status`, `/users`, `/uploads/products/images`, `/revenue/summary`, `/revenue/daily`, `/revenue/products` | Sáu trang quản trị |

### 8.1 Có ở backend nhưng giao diện chưa gọi

Phần này phải nằm trong SRS ở mục *phạm vi*, không phải giấu đi — **23 endpoint**
đã chạy và đã có trong Swagger nhưng chưa có màn hình nào gọi tới:

| Thiếu màn nào | Endpoint đang bỏ trống |
|---|---|
| Nút "Đăng nhập với Google" | `/auth/google`, `/auth/google/callback` |
| Màn quản lý voucher | `/admin/discounts` CRUD |
| Ba biểu đồ doanh thu còn lại | `/admin/revenue/monthly`, `/categories`, `/brands` |
| Màn bộ khung thông số | `/admin/categories/{categoryId}/specifications`, `/admin/specifications/{id}` |
| Danh sách thiết bị đăng nhập | `/auth/sessions`, `/auth/sessions/{id}`, `/auth/sessions/revoke-others` |
| Dropdown "tìm kiếm gần đây" | `/search-history/me`, `/me/keywords`, `/me/{id}` |
| Trang riêng danh mục / thương hiệu | `/brands/{slug}`, `/categories/{slug}` |
| Bảng điều khiển bộ gợi ý | `/admin/recommendations/stats`, `/admin/recommendations/similarity/rebuild` |
| Chưa quyết | `GET /me/preferences`, `GET /auth/check-email` |

Cách đếm lại danh sách này khi code đổi nằm ở mục 5.0.1 của README backend.

### 8.2 Đã gỡ hẳn, không phải chưa làm

Bản giao diện cũ (`FE/thesis-frontend`) có **nút tim wishlist** chỉ đổi trạng thái
cục bộ và trang **`/profile/notifications`** gắn `TODO(BE)` — cả hai hứa một tính
năng backend không có. Bản này gỡ hẳn thay vì để lại giao diện giả. SRS nên xếp
wishlist và thông báo realtime vào *Hướng phát triển*.

## 9. Yêu cầu phi chức năng và giới hạn đã biết

| Thuộc tính | Hiện trạng |
|---|---|
| Responsive | Thiết kế cho desktop, tablet và mobile; lưới và khoảng cách theo thang 8px |
| Chế độ tối | Tự theo cài đặt hệ điều hành, khai một lần trong `index.css` qua `@media (prefers-color-scheme: dark)` |
| Chờ và lỗi | Mỗi trang giữ ba biến `data` / `loading` / `error`; có `Skeleton` lúc chờ và `EmptyState` khi rỗng |
| Timeout | 60 giây cho mọi request — đặt theo lượt hỏi AI, vốn là lời gọi chậm nhất |
| Chữ | Ba bộ chữ **đóng gói cùng app** (Fontsource), không tải từ CDN: mở được khi mạng chặn Google Fonts |
| Truy cập được (a11y) | Nhãn luôn nằm trên ô nhập, không dùng placeholder thay nhãn. **Chưa kiểm bằng công cụ nào** |
| Kiểm thử tự động | **Chưa có file test nào.** 18 file / 202 assertion của bản cũ mất theo lần viết lại — xem 11.1 nhóm A0 của README backend |
| Đo hiệu năng | Chưa đo Lighthouse hay kích thước bundle lần nào |
| Trình duyệt hỗ trợ | Chưa khai báo ma trận; thực tế mới chạy trên Chrome bản mới |

## 10. Vị trí trong git

Mã nguồn nằm ở repo `KLTN_TechShop_FE`, nhánh **`FE_V3`** (commit đầu `2da3b11`,
đẩy lên 2026-09-12). Ba nhánh là ba thế hệ giao diện xếp theo thời gian:

| Nhánh | Là gì |
|---|---|
| `main`, `FE_V1`, `FE_V2` | Bản cũ `FE/thesis-frontend` — tự viết router, query cache và http client |
| `FE_V3` | Bản này, viết lại trên stack phổ thông |

Bản cũ giữ lại để đối chiếu khi viết chương so sánh, không phải để chạy. Mỗi lần
chỉ một frontend chạy được: `FRONTEND_URL` của backend ghim cổng 5173.
