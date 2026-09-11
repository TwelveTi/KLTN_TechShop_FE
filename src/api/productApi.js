import axiosClient from './axiosClient'

// Sản phẩm, danh mục, thương hiệu — phần công khai, không cần đăng nhập.
const productApi = {
  // params: { page, limit, keyword, category, brands, minPrice, maxPrice, sort, rating, inStock }
  getProducts: (params = {}) =>
    axiosClient.get('/products', { params: { onlyActive: true, ...params } }),

  getProductById: (idOrSlug) => axiosClient.get(`/products/${idOrSlug}`),

  getCategories: () => axiosClient.get('/categories'),

  getBrands: () => axiosClient.get('/brands'),
}

export default productApi
