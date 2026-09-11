// Khối xám thay chỗ nội dung đang tải. Dùng skeleton thay vòng xoay ở những
// chỗ đã biết trước bố cục, để trang không nhảy khi dữ liệu về.
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-sm bg-sunken ${className}`} />
}

// Skeleton của một thẻ sản phẩm: đúng hình dạng thẻ thật.
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  )
}

// Lưới skeleton, số lượng khớp với số thẻ sắp hiện ra.
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải sản phẩm"
      className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
