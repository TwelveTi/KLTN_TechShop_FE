# App Layer — Tầng 5

Composition root. Nơi DUY NHẤT được phép biết mọi tầng khác.

- Lồng provider theo đúng thứ tự phụ thuộc (Toast → Auth → Cart → Router).
- Tiêm dependency vào `@core` (ví dụ: cấp `getToken` cho httpClient — GĐ2).
- Error boundary cấp cao nhất.

`App.tsx` hiện vẫn tự chuyển màn hình bằng `window.history.pushState`.
**GĐ3** sẽ thay bằng router có ranh giới ở `src/routes/`: route table dạng data,
nested route, guard, và lazy. Khi đó `App.tsx` chỉ còn phần ráp provider.
