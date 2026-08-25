# `_template` — bộ khung cho một feature mới

Copy thư mục này, đổi tên, xoá những gì không cần. Người mới không phải đoán cấu
trúc, cũng không phải đọc một feature đang chạy để suy ra quy ước.

Thư mục này **không được import ở đâu cả** — nó là tài liệu ở dạng code.

    <feature>/
      index.ts        <- PUBLIC API. Nơi duy nhất bên ngoài được import.
      types.ts        <- type cục bộ của feature
      api/
        <f>Api.ts     <- chỉ endpoint + tham so
        dto.ts        <- payload backend, phan chieu NGUYEN VAN
        mappers.ts    <- DTO -> domain. Bien gioi duy nhat.
        queryKeys.ts  <- ['<feature>', '<entity>', ...args]
      hooks/          <- thu DUY NHAT man hinh goi de lay du lieu
      components/     <- khoi UI biet domain, nhan props, phat callback
      screens/        <- 1 file = 1 route
      styles/

## Năm bước thêm một màn hình mới

1. `routes/paths.ts` — thêm builder đường dẫn.
2. `routes/routeTree.ts` — thêm route (kèm `guard` nếu cần đăng nhập).
3. `features/<f>/screens/XScreen.tsx` — đọc URL state, gọi hook, ráp component.
4. `features/<f>/hooks/useX.ts` — `useQuery(key, fetcher)`.
5. `features/<f>/api/` — endpoint + DTO + mapper.

Đi từ trên xuống thì mỗi bước chỉ phụ thuộc vào bước sau nó.
