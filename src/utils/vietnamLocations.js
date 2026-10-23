// Danh sách tỉnh/thành và phường/xã Việt Nam, lấy từ API công khai provinces.open-api.vn.
// Bản v2 theo đợt sắp xếp hành chính 2025: 34 tỉnh/thành, phường/xã nằm thẳng dưới tỉnh, không còn quận/huyện.
const LOCATIONS_URL = 'https://provinces.open-api.vn/api/v2/?depth=2'

// Tải một lần rồi giữ trong bộ nhớ, mở lại form không phải tải lại ~600KB.
let cache = null

// Đưa về dạng gọn { name, wards: [tên phường] }. Nếu API có trả quận/huyện thì gộp phường của mọi quận lại.
function normalize(province) {
  const wards = province.wards?.length
    ? province.wards
    : (province.districts || []).flatMap((district) => district.wards || [])
  return {
    name: province.name,
    wards: wards.map((ward) => ward.name).sort((a, b) => a.localeCompare(b, 'vi')),
  }
}

// Trả về null khi không tải được, để form chuyển sang ô nhập tay thay vì chặn người dùng.
export async function loadProvinces() {
  if (cache) return cache
  try {
    const response = await fetch(LOCATIONS_URL)
    if (!response.ok) return null
    const provinces = (await response.json()).map(normalize).filter((province) => province.wards.length)
    if (provinces.length === 0) return null
    cache = provinces.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    return cache
  } catch {
    return null
  }
}

// Ghép địa chỉ để hiển thị, bỏ phần trống và chữ giữ chỗ quận/huyện mà bản FE cũ từng lưu.
export function formatAddress(address) {
  return [address.addressLine, address.ward, address.district, address.province]
    .filter((part) => part && part !== 'Khong ap dung')
    .join(', ')
}
