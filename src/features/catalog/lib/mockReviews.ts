import type {
  ProductDetailData,
  ProductReview,
  ProductReviewsData,
  ReviewDistributionBucket,
} from '../types'

/**
 * Local mock reviews. Deterministic per product so the UI is stable across
 * renders/reloads. The returned shape mirrors what a future backend endpoint
 * (e.g. GET /products/:id/reviews) is expected to provide, so swapping this
 * for a real fetch requires no UI changes.
 */

const REVIEWER_NAMES = [
  'Minh Tran',
  'Sarah Chen',
  'David Okafor',
  'Elena Rossi',
  'James Whitfield',
  'Priya Nair',
  'Lucas Meyer',
  'Aisha Rahman',
  'Tomás Herrera',
  'Grace Lim',
  'Nguyen Bao',
  'Oliver Grant',
]

const COMMENT_POOL: Record<number, string[]> = {
  5: [
    'Exceeded every expectation. Build quality is outstanding and performance is flawless under heavy load. Would buy again without hesitation.',
    'Absolutely worth it. Arrived quickly, packaging was premium, and it has been rock solid since day one.',
    'Best purchase I have made this year. The attention to detail is obvious and it handles everything I throw at it.',
    'Fantastic value for the price point. Set up in minutes and it just works — no complaints at all.',
  ],
  4: [
    'Really solid overall. Docked one star only because the shipping took a little longer than expected, but the product itself is great.',
    'Very happy with it. Performs well for daily use; battery could be marginally better but nothing that affects the experience.',
    'Great hardware with a premium feel. Minor learning curve at first, but excellent once dialed in.',
    'Does exactly what it promises. A tiny bit pricey, yet the quality justifies it.',
  ],
  3: [
    'Decent for the price. Works fine for everyday tasks but do not expect it to shine under intensive workloads.',
    'It is okay. Nothing wrong with it, but nothing that wowed me either. Fair value.',
    'Mixed feelings — good performance, but the accessories in the box felt a little basic.',
  ],
  2: [
    'A bit underwhelming. It works, but I expected more polish given the price. Support was helpful though.',
    'Had a couple of minor issues out of the box. Manageable, but worth mentioning.',
  ],
  1: [
    'Not for me. It did not match what I was expecting and I ended up looking at alternatives.',
  ],
}

// Small deterministic hash so each product gets a stable but varied dataset.
function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function buildDistribution(total: number, average: number): ReviewDistributionBucket[] {
  // Weight buckets around the average so the histogram looks believable.
  const weights: Record<number, number> = {
    5: Math.max(0, 1 - Math.abs(5 - average) / 2.2),
    4: Math.max(0, 1 - Math.abs(4 - average) / 2.2),
    3: Math.max(0, 1 - Math.abs(3 - average) / 2.4),
    2: Math.max(0, 1 - Math.abs(2 - average) / 2.6),
    1: Math.max(0, 1 - Math.abs(1 - average) / 3),
  }
  const weightSum = Object.values(weights).reduce((s, w) => s + w, 0) || 1

  const buckets: ReviewDistributionBucket[] = ([5, 4, 3, 2, 1] as const).map((stars) => ({
    stars,
    count: Math.round((weights[stars] / weightSum) * total),
  }))

  // Reconcile rounding drift into the top bucket so counts sum to `total`.
  const summed = buckets.reduce((s, b) => s + b.count, 0)
  const drift = total - summed
  if (drift !== 0) buckets[0].count = Math.max(0, buckets[0].count + drift)

  return buckets
}

function buildReviews(product: ProductDetailData, seed: number, count: number): ProductReview[] {
  const reviews: ProductReview[] = []
  const baseTime = Date.parse('2026-08-08T00:00:00.000Z')
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = 0; i < count; i += 1) {
    const r = (seed + i * 2654435761) >>> 0
    // Skew ratings toward the product's overall rating.
    const roll = r % 100
    const stars = roll < 62 ? 5 : roll < 84 ? 4 : roll < 94 ? 3 : roll < 98 ? 2 : 1
    const commentsForStars = COMMENT_POOL[stars]
    const comment = commentsForStars[r % commentsForStars.length]
    // Unsigned shifts (>>>) keep the index positive; signed >> can go negative
    // for uint32 values with the high bit set.
    const name = REVIEWER_NAMES[(r >>> 3) % REVIEWER_NAMES.length]

    reviews.push({
      id: `${product.id}-rv-${i + 1}`,
      user: name,
      rating: stars,
      comment,
      verifiedPurchase: r % 5 !== 0, // ~80% verified
      createdAt: new Date(baseTime - ((r >>> 5) % 240) * dayMs).toISOString(),
    })
  }

  // Newest first.
  return reviews.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getProductReviews(product: ProductDetailData): ProductReviewsData {
  const seed = hashString(product.id || product.name)
  const total = product.reviewCount || 0
  const average = product.rating || 0

  // Render a realistic sample of individual cards (not necessarily all `total`).
  const sampleSize = Math.min(12, Math.max(3, total))

  return {
    average,
    total,
    distribution: buildDistribution(total, average),
    reviews: buildReviews(product, seed, sampleSize),
  }
}
