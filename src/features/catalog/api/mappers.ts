import type { Product } from '@domain/product'
import { toVnd } from '@shared/utils/money'
import { slugify } from '@shared/utils/text'
import type { ProductDetail, ProductSpecItem, ProductVariant } from '../types'
import type { ProductDto, ProductVariantDto } from './dto'

/**
 * Mapper DTO → domain. Biên giới giữa "hình dạng của backend" và "ngôn ngữ của
 * ứng dụng".
 *
 * Đây cũng là nơi DUY NHẤT tiền được chuyển từ payload sang số nguyên VND —
 * xuống dưới đây không còn chuỗi tiền nào tồn tại.
 */

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'

function primaryImage(dto: ProductDto): string {
  return dto.images?.find((image) => image.isPrimary)?.imageUrl ?? dto.images?.[0]?.imageUrl ?? PLACEHOLDER_IMAGE
}

function isOutOfStock(dto: Pick<ProductDto, 'status' | 'stockQuantity'>): boolean {
  return dto.status === 'OUT_OF_STOCK' || Number(dto.stockQuantity ?? 0) <= 0
}

/** Sản phẩm trong danh sách / lưới / gợi ý. */
export function toProduct(dto: ProductDto): Product {
  const basePriceVnd = toVnd(dto.basePrice)
  const salePriceVnd = dto.salePrice == null ? null : toVnd(dto.salePrice)
  const hasDiscount = salePriceVnd !== null && salePriceVnd > 0 && salePriceVnd < basePriceVnd

  return {
    id: String(dto.id),
    name: dto.name,
    category: dto.category?.name || 'Technology',
    brand: dto.brand?.name || undefined,
    priceVnd: hasDiscount ? (salePriceVnd as number) : basePriceVnd,
    originalPriceVnd: hasDiscount ? basePriceVnd : undefined,
    badge: dto.isFeatured ? 'Featured' : hasDiscount ? 'Hot Deal' : undefined,
    isFeatured: Boolean(dto.isFeatured),
    imageUrl: primaryImage(dto),
    outOfStock: isOutOfStock(dto),
    shortDescription: dto.shortDescription || undefined,
    rating: Number(dto.averageRating || 0),
    reviewCount: Number(dto.reviewCount || 0),
    stockQuantity: Number(dto.stockQuantity || 0),
    specsList: (dto.variants ?? []).slice(0, 3).map((variant) => variant.variantName ?? '').filter(Boolean),
  }
}

function toVariant(dto: ProductVariantDto, fallbackPriceVnd: number): ProductVariant {
  const priceVnd = toVnd(dto.salePrice ?? dto.price ?? fallbackPriceVnd)
  return {
    id: String(dto.id || dto.sku),
    name: dto.variantName || dto.name || 'Standard Edition',
    sku: dto.sku || `SKU-${dto.id}`,
    priceVnd,
    inStock: dto.status !== 'OUT_OF_STOCK' && (dto.stockQuantity === undefined || Number(dto.stockQuantity) > 0),
    isDefault: Boolean(dto.isDefault),
  }
}

/** Sản phẩm ở trang chi tiết — mọi thứ của `toProduct` cộng nội dung dài. */
export function toProductDetail(dto: ProductDto, relatedProducts: Product[] = []): ProductDetail {
  const product = toProduct(dto)
  const basePriceVnd = toVnd(dto.basePrice)

  const galleryImages = (dto.images ?? [])
    .map((image) => image.imageUrl)
    .filter((url): url is string => Boolean(url))

  const variants: ProductVariant[] =
    dto.variants && dto.variants.length > 0
      ? dto.variants.map((variant) => toVariant(variant, product.priceVnd))
      : [
          {
            id: `${dto.id}-default`,
            name: 'Standard Edition',
            sku: dto.sku || `SKU-${dto.id}`,
            priceVnd: product.priceVnd,
            inStock: !isOutOfStock(dto),
            isDefault: true,
          },
        ]

  const specifications: ProductSpecItem[] = (dto.specifications ?? []).map((spec) => ({
    group: 'Technical Specifications',
    name: spec.definition?.name || spec.name || 'Specification',
    value: spec.valueText || String(spec.valueNumber ?? spec.valueBoolean ?? '-'),
  }))

  return {
    ...product,
    slug: dto.slug || slugify(dto.name),
    categorySlug: dto.category?.slug || slugify(dto.category?.name || 'tech'),
    brand: dto.brand?.name || 'TechShop Verified',
    brandSlug: dto.brand?.slug || slugify(dto.brand?.name || 'brand'),
    inStock: !isOutOfStock(dto),
    shortDescription: dto.shortDescription || dto.description || '',
    fullDescription:
      dto.description || dto.shortDescription || 'Official genuine hardware product from TechShop.',
    specs: variants.map((variant) => variant.name).join(', '),
    specsList: variants.map((variant) => variant.name),
    galleryImages: galleryImages.length > 0 ? galleryImages : [PLACEHOLDER_IMAGE],
    variants,
    specifications,
    highlights: [
      'Official 2-Year Manufacturer Warranty included',
      '30-Day Hassle-Free Returns on technical defects',
      'Free Express Shipping on orders over 1.000.000₫',
      '24/7 Dedicated Technical & Setup Support',
    ],
    relatedProducts,
    // Giữ lại giá gốc kể cả khi không giảm, để trang chi tiết hiển thị bảng giá.
    basePriceVnd,
  }
}
