# Đóng góp vào TechShop Frontend

Đọc [ARCHITECTURE.md](./ARCHITECTURE.md) trước. Tài liệu này là phần *làm thế nào*.

```bash
npm install
npm run dev          # cổng 5173 — backend CORS chỉ cho phép origin này
npm test             # 190 test
npm run lint         # ranh giới kiến trúc được kiểm ở đây
npm run build        # tsc -b && vite build
```

---

## Ba luật, dạng ngắn nhất

1. **Phụ thuộc chỉ đi xuống.** `app → routes/layouts → features → shared → domain → core`
2. **Tiền là số cho tới lúc render.** Biến tiền kết thúc bằng `Vnd` và luôn là `number`.
3. **Mỗi loại state có đúng một chỗ ở.** URL · server-cache · session context · local state.

Nếu bạn phải phá một trong ba luật này để làm xong việc, đó là dấu hiệu thiết kế
cần đổi — mở một cuộc thảo luận, đừng thêm `eslint-disable`.

---

## Thêm một màn hình mới — năm bước

Làm theo đúng thứ tự này thì mỗi bước chỉ phụ thuộc vào bước sau nó.

| # | File | Việc |
|---|---|---|
| 1 | `routes/paths.ts` | Thêm builder: `productDetail: (id) => '/products/' + id` |
| 2 | `routes/routeTree.ts` | Thêm route, kèm `guard` nếu cần đăng nhập, `lazy` nếu nặng |
| 3 | `features/<f>/screens/XScreen.tsx` | Đọc URL state, gọi hook, ráp component |
| 4 | `features/<f>/hooks/useX.ts` | `useQuery(key, fetcher, { staleTime })` |
| 5 | `features/<f>/api/` | `<f>Api.ts` + `dto.ts` + `mappers.ts` + `queryKeys.ts` |

**Không viết chuỗi URL ở bất kỳ đâu ngoài `paths.ts`.** Không gọi `api/` từ
component — chỉ gọi hook.

## Thêm một feature mới

Copy `src/features/_template/`, đổi tên, xoá phần không cần. Template biên dịch
được và tuân thủ mọi rule, nên nó không thể trôi khỏi thực tế.

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

## Lint sẽ chặn bạn ở đâu (và vì sao)

Những rule này **là** kiến trúc. Thông báo lỗi luôn nói phải làm gì.

| Bạn viết | Lint nói | Làm đúng |
|---|---|---|
| `fetch(...)` | chỉ trong `@core/http` | `http.get<T>(path)` |
| `localStorage` / `sessionStorage` | chỉ trong `@core/storage` | `createVersionedStore()` — có version schema |
| `window.history` | chỉ trong `core/router/history.ts` | `useNavigate()` / `<Link>` |
| `Intl.NumberFormat`, `toLocaleString()` | chỉ trong `@shared/utils` | `formatVnd()` / `formatCount()` |
| `Intl.DateTimeFormat`, `toLocaleDateString()` | chỉ trong `@shared/utils` | `formatDate()` / `formatDateTime()` |
| `import … from '@features/x/api/y'` | không import sâu | `from '@features/x'` — thêm export vào `index.ts` nếu cần |
| `shared/` import `@features/...` | sai chiều phụ thuộc | hạ xuống `@domain`/`@shared`, hoặc tiêm từ `@app` |
| `../../../something` | vượt hai cấp | dùng alias tầng |
| file > 300 dòng | cảnh báo `max-lines` | tách — xem bên dưới |

**Cảnh báo `max-lines` là tín hiệu, không phải luật thẩm mỹ.** `ProfilePage`
1.577 dòng không xuất hiện sau một PR; nó lớn dần qua hai chục PR mà không có
ngưỡng nào để nói "đủ rồi". Ngân sách: screen ≤ 200 dòng và ≤ 5 `useState`,
component ≤ 150, hook ≤ 120.

Muốn thêm một ngoại lệ vào `eslint.config.js`? Được — nhưng kèm comment giải
thích **vì sao**, và nó sẽ được review như một quyết định kiến trúc.

---

## Kiểm thử

Test đặt **cạnh** file gốc: `money.ts` ↔ `money.test.ts`.

| Loại | Môi trường | Khi nào viết |
|---|---|---|
| Logic thuần (`domain/`, `shared/utils/`, `core/`) | `node` (mặc định) | **Luôn luôn.** Rẻ, nhanh, và bảo vệ phần rủi ro cao nhất |
| Component | thêm `// @vitest-environment happy-dom` ở đầu file | Khi component chứa hành vi (form, luồng nhiều bước) |

Nhập liệu trong test component dùng `fireEvent.change` với giá trị đầy đủ, không
dùng `user.type`: với input controlled của React 19 trên happy-dom, `user.type`
chỉ giữ lại ký tự đầu — hạn chế của môi trường, không phải của component.

**Đổi thứ gì liên quan tới tiền hoặc trạng thái đơn thì viết test TRƯỚC.** Đó là
hai vùng mà lỗi im lặng gây thiệt hại thật.

---

## Quy ước đặt tên

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Screen | `<Tên>Screen.tsx` | `CatalogScreen.tsx` |
| Layout | `<Tên>Layout.tsx` | `AdminLayout.tsx` |
| Hook | `use<Thứ>.ts`, một hook mỗi file | `useProducts.ts` |
| Query hook | `use<Entity>` / `use<Entity>s` | `useProduct` / `useProducts` |
| Mutation hook | `use<ĐộngTừ><Entity>` | `useUpdateOrderStatus` |
| Payload backend | hậu tố `Dto` | `ProductDto` |
| Type domain | danh từ trần | `Product` |
| Mapper | `to<Domain>` | `toProduct(dto)` |
| Query key | `['<feature>','<entity>',…]` | `['catalog','products',filters]` |
| Biến tiền | luôn `number`, hậu tố `Vnd` | `priceVnd`, `subtotalVnd` |
| Boolean | `is` / `has` / `can` / `should` | `isPurchasable` |
| Prop callback | `on<SựKiện>` | `onSelectCategory` |
| Hàm xử lý | `handle<SựKiện>` | `handleSelectCategory` |
| Hằng module | SCREAMING_SNAKE | `FREE_SHIPPING_THRESHOLD_VND` |
| Export | named ở mọi nơi; `export default` **chỉ** ở file được `lazy()` nạp | |

---

## Checklist trước khi mở PR

- [ ] `npm run lint` — 0 lỗi (cảnh báo `max-lines` thì giải thích trong PR)
- [ ] `npm test` — xanh, và có test mới nếu bạn thêm logic thuần
- [ ] `npm run build` — xanh
- [ ] Không thêm `eslint-disable` nào mà không có comment giải thích
- [ ] Nếu thêm export vào `features/*/index.ts`: nói rõ trong PR vì sao cần
- [ ] Nếu chạm tới tiền hoặc trạng thái đơn: đã có test bao phủ
