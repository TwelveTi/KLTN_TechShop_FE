# Kiến trúc TechShop Frontend — v2

React 19 · Vite · TypeScript · router tự viết · không thư viện state.

> Trạng thái: **GĐ 5 hoàn tất** — kiến trúc được máy thực thi.
> Xem thêm [CONTRIBUTING.md](./CONTRIBUTING.md) và `src/features/_template/`.

---

## Ba luật nền

1. **Phụ thuộc chỉ đi xuống** — `app → routes/layouts → features → shared → domain → core`.
   Không đi ngược, không đi ngang giữa hai feature.
2. **Tiền là số cho tới lúc render** — `domain` chỉ chứa `number` và enum;
   định dạng chỉ xảy ra ở JSX, qua `@shared/utils/money`. Mọi biến tiền kết
   thúc bằng `Vnd` (`priceVnd`, `subtotalVnd`).
3. **Mỗi loại state có đúng một chỗ ở** — URL · server-cache · session context · local state.

---

## Bản đồ tầng

| Tầng | Alias | Thư mục | Trách nhiệm | Được import |
|---|---|---|---|---|
| 5 | `@app` | `src/app` | Composition root: providers, bootstrap, error boundary | tất cả |
| 4 | `@routes` `@layouts` | `src/routes` `src/layouts` | Route table, guard, khung trang | 3 → 0 |
| 3 | `@features` | `src/features` | Lát cắt nghiệp vụ | 2 → 0 |
| 2 | `@shared` | `src/shared` | UI primitive, hook & util phi nghiệp vụ, style toàn cục | 1, 0 |
| 1 | `@domain` | `src/domain` | Ngôn ngữ nghiệp vụ: entity, enum, quy tắc thuần | **không import gì** |
| 0 | `@core` | `src/core` | Hạ tầng: http, query, storage, router, config | **không import gì** |

Alias được khai báo song song ở `vite.config.ts` (`resolve.alias`) và
`tsconfig.app.json` (`compilerOptions.paths`) — sửa một chỗ phải sửa cả hai.

---

## "Code này để đâu?"

Đọc từ trên xuống, dừng ở dòng đầu tiên đúng.

| Câu hỏi | Nơi đặt |
|---|---|
| Nó gọi mạng, đọc storage, quản lý cache, hay điều hướng? | `@core` |
| Nó là danh từ/quy tắc của cửa hàng, và không import gì? | `@domain` |
| Nó dùng được nguyên vẹn ở một dự án hoàn toàn khác? | `@shared` |
| Nó thuộc về đúng một màn hình? | `@features/<f>/components` |
| Nó lấy dữ liệu cho một feature? | `@features/<f>/hooks` |
| Nó quyết định ai được vào đâu? | `@routes/guards` |
| Nó bao quanh nhiều màn hình? | `@layouts` |
| Vẫn chưa rõ? | đặt cạnh nơi dùng, nâng lên sau |

---

## Quy ước CSS

- Token toàn cục **chỉ** khai báo trong `src/shared/styles/tokens.css`.
- File CSS của feature chỉ được khai báo alias có tiền tố feature
  (`--auth-*`, `--cart-*`, `--catalog-*`, `--profile-*`…), và alias đó phải trỏ
  tới một token toàn cục — không được là hex literal mới.
- `src/shared/styles/base.css` giữ reset + `html`/`body` + utility. Không style component.
- Component không viết màu / khoảng cách / bo góc dạng literal.

---

## Bốn ngăn state

Trước khi khai báo bất kỳ state nào, trả lời một câu hỏi để biết nó thuộc ngăn nào.

| Ngăn | Câu hỏi | Sống ở đâu |
|---|---|---|
| URL state | Refresh hoặc gửi link cho đồng nghiệp thì có cần giữ nguyên không? | pathname + `useSearchParams()` |
| Server cache | Backend là nguồn sự thật của nó? | `@core/query` — module singleton, không Provider |
| Session state | Có ≥ 2 nhánh cây xa nhau cùng cần? | Đúng 4 Context: Toast, Auth, Cart, Router |
| Local UI state | Còn lại — mặc định chọn cái này | `useState` tại component |

Thêm Context thứ 5 phải trả lời **có** cho cả ba: (1) ≥ 2 consumer ở hai nhánh
khác nhau; (2) không phải dữ liệu server; (3) không giữ được trong URL.

---

## Hợp đồng hạ tầng (GĐ 2)

```
Screen → feature hook → useQuery → featureApi → http → backend
                                        └─ mapper: DTO → domain
```

- Component **không bao giờ** import `api/` hay `@core/http`. Chỉ import hook.
- `*Dto` phản chiếu backend nguyên văn; `mappers.ts` là biên giới duy nhất.
- Tiền qua biên giới là **số nguyên VND**; format chỉ ở JSX.
- Một loại lỗi: `ApiError { status, kind, message, requestId }` với `kind` ∈
  `network · timeout · auth · forbidden · notFound · validation · conflict ·
  rateLimited · server · malformed`. UI switch theo `kind`, không đoán qua chuỗi.
- `queryCache` key: `['<feature>', '<entity>', …args]`; vô hiệu theo **tiền tố**.
- `localStorage`/`sessionStorage` chỉ qua `@core/storage` — có **version schema**,
  không đoán dữ liệu cũ theo nội dung.

---

## Router tự viết (GĐ 3)

```
routes/
  router/          ← engine phi nghiệp vụ, ~600 dòng, không import @features
    history.ts       MỘT hàm notify(); nơi DUY NHẤT chạm window.history
    matchPath.ts     khớp toàn phần + chấm điểm độ cụ thể
    types.ts         RouteDefinition, guard decision, flattenRoutes
    context.ts       2 context: state (đổi) / navigate (ổn định)
    hooks.ts         useLocation useNavigate useParams useSearchParams useRouteMatch
    RouterProvider   useSyncExternalStore(history)
    RouteRenderer    guard → Suspense → lồng layout qua Outlet
    Link Outlet ScrollRestoration
  routeTree.ts     bản đồ URL dạng DATA
  paths.ts         nguồn sự thật duy nhất của URL
  guards/          requireAuth · requireAdmin · requireGuest + màn hình trạng thái
```

**Bốn bất biến:**

1. `window.history` / `window.location` chỉ xuất hiện trong `history.ts` (ngoại lệ: `ScrollRestoration`, và `location.href` cho redirect ra ngoài như VNPay/OAuth).
2. Không nơi nào viết chuỗi URL — mọi đích đến qua `paths.*`.
3. Thứ tự khai báo trong `routeTree` KHÔNG ảnh hưởng kết quả khớp; độ cụ thể được chấm điểm, và catch-all là bậc thấp nhất.
4. Guard chạy TRƯỚC khi render và trước khi tải chunk lazy.

---

## Kiến trúc được thực thi bằng máy (GĐ 5)

Tài liệu dạy *lý do*; những thứ dưới đây giữ *ranh giới*. Một developer mới không
thể vi phạm kiến trúc một cách tình cờ — lỗi lint nói ngay tầng nào bị vi phạm và
phải làm gì.

### ESLint (`eslint.config.js`)

| Rule | Chặn |
|---|---|
| Chiều phụ thuộc theo tầng | `shared` import `@features`, `core` import `@shared`… — sinh tự động từ mảng `LAYERS` |
| `@features/*/*` | Import SÂU vào feature khác; chỉ `@features/<tên>` (public API) được phép |
| `fetch` | Ngoài `@core/http` |
| `localStorage` · `sessionStorage` | Ngoài `@core/storage` |
| `window.history` | Ngoài `core/router/history.ts` |
| `Intl.NumberFormat` · `toLocaleString()` | Ngoài `@shared/utils/{money,number}` |
| `Intl.DateTimeFormat` · `toLocaleDateString()` | Ngoài `@shared/utils/date` |
| `react` trong `domain/` và hạ tầng không-React | Giữ hai tầng đó test được không cần render |
| `../../../*` | Buộc dùng alias tầng |
| `max-lines` 300 (warn) | File phình dần không ai để ý |

Hai ngoại lệ **hiển ngôn** trong config, mỗi cái kèm lý do: `@routes/paths` (từ
vựng URL — module lá, cả `features` lẫn `routes` đều tiêu thụ) và
`features/addresses/lib/vietnamLocations.ts` (dataset tĩnh của bên thứ ba, không
đi qua API của ta).

### Test kiến trúc

`eslint` không đọc file `.css`, nên ba bất biến còn lại được giữ bằng test
(`src/shared/styles/cssConventions.test.ts`):

- mọi class mang tiền tố `ts-` (trừ utility và state modifier `.is-*`);
- token toàn cục chỉ khai báo trong `tokens.css`;
- CSS của feature chỉ khai báo alias mang tiền tố của chính feature đó.

`features/home/styles/home.css` nằm trong allowlist **có tên** của test đó — nợ
được theo dõi, không phải nợ bị lãng quên.

### Quyết định về CSS: giữ global, KHÔNG chuyển sang CSS Modules

Lộ trình ban đầu đặt "CSS Modules" ở GĐ 5. Sau khi đo, quyết định là **không**:

- 10.589 dòng CSS, 1.153 class riêng biệt. Chuyển sang Modules là đổi tên gần như
  mọi class ở cả `.css` lẫn `.tsx` — hàng nghìn sửa đổi, rủi ro hồi quy hình ảnh
  cao, và không thể kiểm chứng hết bằng test.
- Lợi ích duy nhất là scope thật, trong khi quy ước `ts-` hiện được tuân thủ
  **96%** và chưa gây va chạm nào quan sát được.
- Rủi ro/lợi ích đó phù hợp cho một dự án mới, không phù hợp cho một retrofit
  ngay trước bảo vệ.

Thay vào đó: quy ước được **thực thi bằng test**, và Modules là lựa chọn để dành
— chuyển dần từng feature khi có lý do chạm vào file đó. Đây là một quyết định có
ý thức, không phải một việc bị bỏ sót.

---

## Nợ kỹ thuật đã biết (có gắn `TODO(...)` trong code)

| Vị trí | Vấn đề | Xử lý ở |
|---|---|---|
| `UsersScreen` | Lọc/tìm kiếm chạy client-side trên 100 bản ghi đầu | **cần BE** — `findAndCountUsers` chỉ nhận `limit`/`offset` |
| `ProductsSection` | Sắp xếp bị vô hiệu hoá | **cần BE** — `/admin/products` chưa nhận `sortBy` |
| `adminApi.getDashboardSummary` | Kéo `limit=100` để đếm, bỏ sót bản ghi thứ 101+ | **cần BE** — nên có `/admin/dashboard` |
| Danh mục `laptop` rỗng song song với `seed-laptop` có hàng | Department bar dẫn tới danh mục rỗng | **cần dọn dữ liệu seed** |
| `features/home/styles/home.css` | Class không mang tiền tố `ts-` | có allowlist trong test CSS |
| Danh mục seed `laptop` rỗng trùng tên `seed-laptop` | Mặt tiền đã ẩn danh mục rỗng, nhưng dữ liệu vẫn sai | **cần dọn seed BE** |

Bốn dòng đầu là **giới hạn của backend**, không phải nợ frontend: chúng được ghi
rõ trong code, và `UsersScreen` còn hiển thị cảnh báo trên giao diện khi dữ liệu
bị cắt — v1 im lặng ở cả bốn chỗ.

**Đã đóng ở GĐ 3:** router có ranh giới (engine tách rời, route tree dạng data,
guard khai báo, nested route, lazy) · 12 prop callback điều hướng → `useNavigate`
/ `<Link>` · hai event `techshop:*` và `PopStateEvent` giả → một `notify()` ·
`ProfilePage` 1.577 dòng → layout + 5 màn hình · `AdminPage` 33 `useState` →
layout + 7 màn hình · bàn giao lựa chọn giỏ qua route state thay `sessionStorage`
· có 404 thật, khôi phục vị trí cuộn, tiêu đề trang theo route.

**Đã đóng ở GĐ 5:** 8 nhóm rule ESLint giữ ranh giới tầng · public API
(`index.ts`) cho cả 8 feature, import sâu bị chặn · `features/addresses` tách ra
để gỡ cạnh `checkout → profile` · router engine xuống `@core/router` (nó là hạ
tầng, không phải tầng 4) · `BrandsSection` + `CategoriesSection` → một
`TaxonomySection<T>` có 14 test · `admin/ConfirmModal` → `shared/ui/ConfirmDialog`
· thuật toán cửa sổ trang → `@shared/utils/pagination` có test · 7 chỗ format tại
chỗ còn sót từ GĐ2 bị rule bắt và sửa · `features/_template/` + CONTRIBUTING.md ·
test kiến trúc cho CSS.

**Đã đóng ở GĐ 4:** mọi màn hình đọc dữ liệu qua `useQuery` — không còn
`useEffect` fetch thủ công · điều hướng qua lại **không gọi lại mạng** (cache
theo key + `staleTime`) · StrictMode không còn gọi đôi (dedup) · bộ lọc catalog
và bảng admin sống trong URL, Back/Forward hoạt động · mutation khai báo
`invalidates` thay `fetchAllData()` · fallback mock ở đánh giá đã xoá · **lint
0 lỗi** (từ 66 ở baseline).

---

## Kiểm thử

`npm test` — 190 test, tập trung vào phần rủi ro cao và rẻ để test:

| Vùng | Bảo vệ điều gì |
|---|---|
| `domain/pricing` | Voucher không mua được miễn phí ship; tổng đơn không âm |
| `domain/cart` | Trần số lượng; tiền không NaN khi giỏ rỗng |
| `domain/order` | `REFUNDED ≠ CANCELLED`; chuyển trạng thái hợp lệ |
| `shared/utils/money` | Một định dạng duy nhất; không có đường parse ngược |
| `shared/utils/date` | Một locale; ngày LOCAL không nhảy ngày lúc 23h |
| `core/http` | Refresh 401 single-flight; phân loại lỗi; ngữ nghĩa envelope |
| `routes/router` | Khớp toàn phần (không phải tiền tố); catch-all không cướp `/`; thứ tự khai báo không đổi kết quả; làm phẳng cây route |
| `core/query` | Gộp request trùng; vô hiệu theo tiền tố; dữ liệu cũ không lọt sau `clear()` |

---

## Lộ trình

| GĐ | Nội dung | Trạng thái |
|---|---|---|
| 1 | Dựng khung: alias, `core/ domain/ layouts/`, `shared/ui`, tách token | ✅ xong |
| 2 | Hạ tầng: `unwrap`, `core/query`, domain types (tiền là số), DI cho http | ✅ xong |
| 3 | Router: `routes/router`, route tree, guard, lazy, tách Profile/Admin | ✅ xong |
| 4 | Chuyển màn hình sang hook `useQuery`/`useMutation`, URL state | ✅ xong |
| 5 | Siết ESLint ranh giới tầng, gộp component trùng, template + docs | ✅ xong |

Chi tiết đầy đủ: [Kiến trúc TechShop v2](https://claude.ai/code/artifact/6bd931ab-1ae9-4e4c-ac95-4bffeb48503a)
