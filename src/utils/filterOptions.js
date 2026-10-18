// Bỏ dấu, viết thường để gõ "ha noi" hay "hà nội" đều tìm ra "Hà Nội".
export function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

// Lọc theo chữ người dùng gõ. `stripPrefix` bỏ phần chung như "Tỉnh", "Phường" trước khi so,
// nếu không gõ "h" sẽ khớp mọi "Thành phố". Tên bắt đầu bằng chữ đã gõ được xếp lên trước.
export function filterOptions(options, query, stripPrefix) {
  const q = normalizeText(query.trim())
  if (!q) return options
  const key = (option) => normalizeText(stripPrefix ? option.replace(stripPrefix, '') : option)
  const matches = options.filter((option) => key(option).includes(q))
  return [
    ...matches.filter((option) => key(option).startsWith(q)),
    ...matches.filter((option) => !key(option).startsWith(q)),
  ]
}
