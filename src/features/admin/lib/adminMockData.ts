import type {
  AdminBrand,
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminUser,
  DashboardSummary,
  LowStockItem,
  RevenuePoint,
  TopSellingProduct,
} from '../types'

export const INITIAL_CATEGORIES: AdminCategory[] = [
  { id: 'cat-laptops', name: 'Laptops', slug: 'laptops', description: 'Ultrabooks, gaming laptops, and creator workstations', isActive: true, productCount: 14 },
  { id: 'cat-smartphones', name: 'Smartphones', slug: 'smartphones', description: 'Flagship OLED smartphones and accessories', isActive: true, productCount: 18 },
  { id: 'cat-keyboards', name: 'Keyboards', slug: 'keyboards', description: 'Custom mechanical keyboards and keycaps', isActive: true, productCount: 22 },
  { id: 'cat-mice', name: 'Mice & Pointers', slug: 'mice', description: 'Ergonomic and ultra-lightweight gaming mice', isActive: true, productCount: 16 },
  { id: 'cat-audio', name: 'Audio & Headphones', slug: 'audio', description: 'Studio monitors, ANC headphones and DACs', isActive: true, productCount: 12 },
  { id: 'cat-monitors', name: 'Monitors', slug: 'monitors', description: 'High-refresh 4K IPS and QD-OLED displays', isActive: true, productCount: 9 },
  { id: 'cat-components', name: 'Components & GPUs', slug: 'components', description: 'Graphics cards, high-speed RAM and processors', isActive: true, productCount: 28 },
]

export const INITIAL_BRANDS: AdminBrand[] = [
  { id: 'brand-apple', name: 'Apple', slug: 'apple', description: 'Cupertino California tech titan', isActive: true, productCount: 18 },
  { id: 'brand-dell', name: 'Dell', slug: 'dell', description: 'Enterprise and XPS computing', isActive: true, productCount: 11 },
  { id: 'brand-asus', name: 'ASUS ROG', slug: 'asus', description: 'Republic of Gamers hardware', isActive: true, productCount: 15 },
  { id: 'brand-logitech', name: 'Logitech G', slug: 'logitech', description: 'Pro esports peripherals', isActive: true, productCount: 24 },
  { id: 'brand-keychron', name: 'Keychron', slug: 'keychron', description: 'Premium mechanical typing tools', isActive: true, productCount: 16 },
  { id: 'brand-sony', name: 'Sony', slug: 'sony', description: 'Leading ANC audio and creator tech', isActive: true, productCount: 9 },
  { id: 'brand-samsung', name: 'Samsung', slug: 'samsung', description: 'OLED displays, Galaxy phones and SSDs', isActive: true, productCount: 21 },
  { id: 'brand-razer', name: 'Razer', slug: 'razer', description: 'For Gamers By Gamers', isActive: true, productCount: 13 },
]

export const INITIAL_PRODUCTS: AdminProduct[] = [
  {
    id: 'p-1',
    name: 'AeroBook Pro 14 (M3 Max)',
    slug: 'aerobook-pro-14-m3-max',
    sku: 'LAP-APL-M3M14',
    categoryId: 'cat-laptops',
    brandId: 'brand-apple',
    category: INITIAL_CATEGORIES[0],
    brand: INITIAL_BRANDS[0],
    basePrice: 1899,
    salePrice: 1799,
    shortDescription: 'Liquid Retina XDR 120Hz display with M3 Max 14-core GPU and 36GB unified memory.',
    description: 'The premier machine for developers, creators, and high-performance engineers. Delivers up to 22 hours of battery life with silent acoustic profiles.',
    stockQuantity: 28,
    status: 'ACTIVE',
    isFeatured: true,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80', publicId: 'prod_m3_pro_01', isPrimary: true }],
    variants: [
      { sku: 'LAP-APL-M3M14-512', variantName: '14" / 512GB SSD / 18GB RAM', price: 1899, stockQuantity: 18 },
      { sku: 'LAP-APL-M3M14-1TB', variantName: '14" / 1TB SSD / 36GB RAM', price: 2399, stockQuantity: 10 },
    ],
    specifications: [
      { name: 'Processor', valueText: 'Apple M3 Max (14-core CPU, 30-core GPU)' },
      { name: 'Memory', valueText: '36GB Unified Memory' },
      { name: 'Storage', valueText: '1TB PCIe 4.0 NVMe' },
      { name: 'Display', valueText: '14.2-inch Liquid Retina XDR (3024x1964, 120Hz)' },
    ],
    createdAt: '2026-06-15T08:30:00Z',
    updatedAt: '2026-08-01T14:20:00Z',
  },
  {
    id: 'p-2',
    name: 'NovaPhone X2 Ultra 5G',
    slug: 'novaphone-x2-ultra-5g',
    sku: 'PHN-SAM-X2U',
    categoryId: 'cat-smartphones',
    brandId: 'brand-samsung',
    category: INITIAL_CATEGORIES[1],
    brand: INITIAL_BRANDS[6],
    basePrice: 899,
    salePrice: 799,
    shortDescription: '6.8" 120Hz Dynamic AMOLED 2X with titanium casing and Snapdragon 8 Gen 3.',
    description: 'Next-generation AI features built directly into hardware, quad-telephoto optical zoom, and 5000mAh battery with 45W fast charging.',
    stockQuantity: 45,
    status: 'ACTIVE',
    isFeatured: true,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=80', publicId: 'prod_novaphone_01', isPrimary: true }],
    variants: [
      { sku: 'PHN-SAM-X2U-256', variantName: 'Titanium Gray / 256GB', price: 899, stockQuantity: 25 },
      { sku: 'PHN-SAM-X2U-512', variantName: 'Titanium Black / 512GB', price: 1049, stockQuantity: 20 },
    ],
    specifications: [
      { name: 'Display', valueText: '6.8" QHD+ AMOLED (1-120Hz)' },
      { name: 'SoC', valueText: 'Qualcomm Snapdragon 8 Gen 3' },
      { name: 'Camera', valueText: '200MP Main + 50MP 5x Periscope' },
      { name: 'Battery', valueText: '5000mAh with 45W Fast Charging' },
    ],
    createdAt: '2026-06-18T10:00:00Z',
    updatedAt: '2026-08-05T09:12:00Z',
  },
  {
    id: 'p-3',
    name: 'Pulse Pro Wireless Mechanical Keyboard',
    slug: 'pulse-pro-wireless-mechanical-keyboard',
    sku: 'KEY-KCH-PLSPRO',
    categoryId: 'cat-keyboards',
    brandId: 'brand-keychron',
    category: INITIAL_CATEGORIES[2],
    brand: INITIAL_BRANDS[4],
    basePrice: 149,
    salePrice: null,
    shortDescription: 'CNC aluminum body, QMK/VIA programmable, Gateron Jupiter Red linear switches.',
    description: 'Solid typing feel with acoustic silicone dampening, hot-swappable PCB, south-facing RGB, and tri-mode Bluetooth 5.1/2.4G/USB-C.',
    stockQuantity: 82,
    status: 'ACTIVE',
    isFeatured: false,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80', publicId: 'prod_pulsepro_01', isPrimary: true }],
    variants: [
      { sku: 'KEY-KCH-PLSPRO-RED', variantName: 'Red Linear Switches', price: 149, stockQuantity: 42 },
      { sku: 'KEY-KCH-PLSPRO-BAN', variantName: 'Banana Tactile Switches', price: 149, stockQuantity: 40 },
    ],
    specifications: [
      { name: 'Layout', valueText: '75% Compact (84 keys)' },
      { name: 'Connectivity', valueText: 'Bluetooth 5.1 / 2.4GHz / Type-C' },
      { name: 'Switch Type', valueText: 'Hot-swappable Gateron Jupiter' },
      { name: 'Keycaps', valueText: 'Double-shot PBT Cherry Profile' },
    ],
    createdAt: '2026-06-20T11:45:00Z',
    updatedAt: '2026-07-28T16:30:00Z',
  },
  {
    id: 'p-4',
    name: 'Apex Precision Wireless Mouse',
    slug: 'apex-precision-wireless-mouse',
    sku: 'MOU-LOG-APXPRC',
    categoryId: 'cat-mice',
    brandId: 'brand-logitech',
    category: INITIAL_CATEGORIES[3],
    brand: INITIAL_BRANDS[3],
    basePrice: 129,
    salePrice: 109,
    shortDescription: '49-gram ultra-lightweight chassis with 32,000 DPI Hero 2 sensor and 4K polling.',
    description: 'Engineered for tournament-grade aim and zero-latency wireless transmission. Hybrid optical-mechanical switches rated for 100M clicks.',
    stockQuantity: 4, // low stock!
    status: 'ACTIVE',
    isFeatured: false,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80', publicId: 'prod_apex_mouse_01', isPrimary: true }],
    specifications: [
      { name: 'Weight', valueText: '49g' },
      { name: 'Sensor', valueText: 'Hero 2 (32,000 DPI, 500+ IPS)' },
      { name: 'Polling Rate', valueText: '4000Hz Wireless' },
      { name: 'Battery', valueText: 'Up to 95 hours continuous' },
    ],
    createdAt: '2026-06-22T14:15:00Z',
    updatedAt: '2026-08-08T11:00:00Z',
  },
  {
    id: 'p-5',
    name: 'SonarStudio Spatial Audio ANC Headphones',
    slug: 'sonarstudio-spatial-audio-anc-headphones',
    sku: 'AUD-SNY-SNRSTD',
    categoryId: 'cat-audio',
    brandId: 'brand-sony',
    category: INITIAL_CATEGORIES[4],
    brand: INITIAL_BRANDS[5],
    basePrice: 349,
    salePrice: 299,
    shortDescription: 'Custom 40mm bio-cellulose drivers, LDAC lossless codec, and 30-hour battery.',
    description: 'Immersive soundstage with industry-leading dual-processor active noise cancellation and personalized HRTF spatial audio tracking.',
    stockQuantity: 19,
    status: 'ACTIVE',
    isFeatured: true,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80', publicId: 'prod_sonar_01', isPrimary: true }],
    specifications: [
      { name: 'Driver Size', valueText: '40mm Custom Carbon Composite' },
      { name: 'Frequency Response', valueText: '4Hz - 40,000Hz (Hi-Res)' },
      { name: 'Codecs', valueText: 'LDAC, AAC, SBC, aptX Lossless' },
      { name: 'ANC', valueText: 'Integrated Processor V2 + QN1' },
    ],
    createdAt: '2026-06-25T09:00:00Z',
    updatedAt: '2026-08-02T13:40:00Z',
  },
  {
    id: 'p-6',
    name: 'UltraVision 27" 4K OLED Pro Display',
    slug: 'ultravision-27-4k-oled-pro-display',
    sku: 'MON-ASU-UV27',
    categoryId: 'cat-monitors',
    brandId: 'brand-asus',
    category: INITIAL_CATEGORIES[5],
    brand: INITIAL_BRANDS[2],
    basePrice: 799,
    salePrice: null,
    shortDescription: '27-inch 4K QD-OLED, 240Hz refresh, 0.03ms response time, 99% DCI-P3.',
    description: 'Reference-level color accuracy with custom heatsink cooling to prevent burn-in. Built-in USB-C hub with 90W Power Delivery.',
    stockQuantity: 2, // low stock!
    status: 'ACTIVE',
    isFeatured: true,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80', publicId: 'prod_ultravision_01', isPrimary: true }],
    specifications: [
      { name: 'Panel Type', valueText: '3rd Gen QD-OLED (3840x2160)' },
      { name: 'Refresh Rate', valueText: '240Hz (0.03ms GtG)' },
      { name: 'Color Space', valueText: '99% DCI-P3, Delta E < 1' },
      { name: 'I/O', valueText: '2x DP 1.4, 2x HDMI 2.1, USB-C 90W PD' },
    ],
    createdAt: '2026-07-01T15:20:00Z',
    updatedAt: '2026-08-07T10:15:00Z',
  },
  {
    id: 'p-7',
    name: 'TitanCore RTX 4080 Super OC 16GB',
    slug: 'titancore-rtx-4080-super-oc-16gb',
    sku: 'CMP-ASU-T4080S',
    categoryId: 'cat-components',
    brandId: 'brand-asus',
    category: INITIAL_CATEGORIES[6],
    brand: INITIAL_BRANDS[2],
    basePrice: 1199,
    salePrice: null,
    shortDescription: '16GB GDDR6X, Axial-tech fans, dual BIOS, reinforced die-cast frame.',
    description: 'Unmatched 4K ray tracing performance with DLSS 3.5 frame generation and massive vapor chamber thermal solution.',
    stockQuantity: 0, // out of stock!
    status: 'OUT_OF_STOCK',
    isFeatured: false,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80', publicId: 'prod_titancore_01', isPrimary: true }],
    specifications: [
      { name: 'CUDA Cores', valueText: '10,240' },
      { name: 'VRAM', valueText: '16GB GDDR6X (256-bit)' },
      { name: 'Boost Clock', valueText: '2580 MHz (OC Mode)' },
      { name: 'TDP', valueText: '320W (Recommended 750W PSU)' },
    ],
    createdAt: '2026-07-05T12:00:00Z',
    updatedAt: '2026-08-09T18:00:00Z',
  },
  {
    id: 'p-8',
    name: 'XPS Studio 16 Workstation',
    slug: 'xps-studio-16-workstation',
    sku: 'LAP-DEL-XPS16',
    categoryId: 'cat-laptops',
    brandId: 'brand-dell',
    category: INITIAL_CATEGORIES[0],
    brand: INITIAL_BRANDS[1],
    basePrice: 2199,
    salePrice: 1999,
    shortDescription: 'Intel Core Ultra 9 185H, 4K OLED touch, RTX 4070, 32GB LPDDR5x.',
    description: 'CNC machined aluminum with glass touchpad and invisible capacitive function row. High power creator computing on Windows 11 Pro.',
    stockQuantity: 12,
    status: 'ACTIVE',
    isFeatured: false,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=80', publicId: 'prod_xps16_01', isPrimary: true }],
    specifications: [
      { name: 'Processor', valueText: 'Intel Core Ultra 9 185H (16-core)' },
      { name: 'Graphics', valueText: 'NVIDIA GeForce RTX 4070 8GB' },
      { name: 'RAM', valueText: '32GB LPDDR5x 7467MHz' },
      { name: 'Display', valueText: '16.3" 4K+ OLED Touch (3840x2400)' },
    ],
    createdAt: '2026-07-10T08:00:00Z',
    updatedAt: '2026-08-06T14:10:00Z',
  },
  {
    id: 'p-9',
    name: 'QuantumKey Low-Profile RGB Board',
    slug: 'quantumkey-low-profile-rgb-board',
    sku: 'KEY-RZR-QNTMLP',
    categoryId: 'cat-keyboards',
    brandId: 'brand-razer',
    category: INITIAL_CATEGORIES[2],
    brand: INITIAL_BRANDS[7],
    basePrice: 179,
    salePrice: null,
    shortDescription: 'Ultra-thin aluminum chassis with optical low-profile linear switches.',
    description: 'Next level typing ergonomics with hyper-speed 2.4G wireless, multi-device Bluetooth, and magnetic wrist rest.',
    stockQuantity: 34,
    status: 'DRAFT',
    isFeatured: false,
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=80', publicId: 'prod_quantumkey_01', isPrimary: true }],
    createdAt: '2026-07-15T16:00:00Z',
    updatedAt: '2026-08-04T12:00:00Z',
  },
]

export const INITIAL_USERS: AdminUser[] = [
  {
    id: 'u-1',
    email: 'trungphandinh340@gmail.com',
    fullName: 'Phan Đình Trung',
    phone: '+84 912 345 678',
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-08-06T07:11:31.000Z',
    createdAt: '2026-01-05T08:00:00Z',
    lastActiveAt: '2026-08-10T09:45:00Z',
    totalOrders: 0,
    totalSpent: 0,
    address: 'District 1, Ho Chi Minh City, Vietnam',
  },
  {
    id: 'u-2',
    email: 'alex.nguyen@techshop.dev',
    fullName: 'Alex Nguyen',
    phone: '+84 988 123 456',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-08-06T08:12:59.000Z',
    createdAt: '2026-02-10T11:20:00Z',
    lastActiveAt: '2026-08-10T08:30:00Z',
    totalOrders: 12,
    totalSpent: 5420,
    address: 'District 3, Ho Chi Minh City, Vietnam',
  },
  {
    id: 'u-3',
    email: 'minh.tran@techcorp.vn',
    fullName: 'Minh Tran',
    phone: '+84 903 789 012',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: null,
    createdAt: '2026-03-01T09:40:00Z',
    lastActiveAt: '2026-08-09T17:15:00Z',
    totalOrders: 7,
    totalSpent: 3280,
    address: 'Cau Giay District, Hanoi, Vietnam',
  },
  {
    id: 'u-4',
    email: 'sarah.connor@cyberdyne.io',
    fullName: 'Sarah Connor',
    phone: '+1 (555) 432-8901',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-08-06T09:30:00.000Z',
    createdAt: '2026-03-15T14:15:00Z',
    lastActiveAt: '2026-08-08T11:20:00Z',
    totalOrders: 5,
    totalSpent: 2840,
    address: 'Los Angeles, CA 90001, USA',
  },
  {
    id: 'u-5',
    email: 'david.chen@enterprise.io',
    fullName: 'David Chen',
    phone: '+1 (555) 876-1234',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: null,
    createdAt: '2026-03-22T10:10:00Z',
    lastActiveAt: '2026-08-07T14:00:00Z',
    totalOrders: 4,
    totalSpent: 1950,
    address: 'Seattle, WA 98101, USA',
  },
  {
    id: 'u-6',
    email: 'elena.rostova@designworks.com',
    fullName: 'Elena Rostova',
    phone: '+1 (555) 654-7890',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-08-07T10:15:00.000Z',
    createdAt: '2026-04-10T16:00:00Z',
    lastActiveAt: '2026-08-05T09:30:00Z',
    totalOrders: 3,
    totalSpent: 2248,
    address: 'Austin, TX 78701, USA',
  },
  {
    id: 'u-7',
    email: 'marcus.brody@museum.org',
    fullName: 'Marcus Brody',
    phone: '+1 (555) 321-9876',
    role: 'CUSTOMER',
    status: 'SUSPENDED',
    emailVerifiedAt: '2026-08-07T11:00:00.000Z',
    createdAt: '2026-04-20T16:00:00Z',
    lastActiveAt: '2026-07-25T13:45:00Z',
    totalOrders: 1,
    totalSpent: 149,
    address: 'Chicago, IL 60601, USA',
  },
  {
    id: 'u-8',
    email: 'baongoc.tran@creativehub.vn',
    fullName: 'Bao Ngoc Tran',
    phone: '+84 977 456 789',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-08-08T12:00:00.000Z',
    createdAt: '2026-05-02T10:30:00Z',
    lastActiveAt: '2026-08-09T19:00:00Z',
    totalOrders: 6,
    totalSpent: 4120,
    address: 'Hai Chau, Da Nang, Vietnam',
  },
  {
    id: 'u-9',
    email: 'an.nguyen@cloudops.vn',
    fullName: 'Nguyen Van An',
    phone: '+84 933 654 321',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: null,
    createdAt: '2026-05-18T12:00:00Z',
    lastActiveAt: '2026-08-10T06:15:00Z',
    totalOrders: 2,
    totalSpent: 890,
    address: 'Binh Thanh, Ho Chi Minh City, Vietnam',
  },
  {
    id: 'u-10',
    email: 'rachel.green@fashiontech.co',
    fullName: 'Rachel Green',
    phone: '+1 (555) 999-1234',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-08-08T14:30:00.000Z',
    createdAt: '2026-06-01T10:30:00Z',
    lastActiveAt: '2026-08-06T15:20:00Z',
    totalOrders: 4,
    totalSpent: 1890,
    address: 'New York, NY 10001, USA',
  },
  {
    id: 'u-11',
    email: 'liam.miller@techshop.dev',
    fullName: 'Liam Miller',
    phone: '+1 (555) 777-8888',
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-08-08T16:00:00.000Z',
    createdAt: '2026-01-15T09:00:00Z',
    lastActiveAt: '2026-08-10T08:00:00Z',
    totalOrders: 0,
    totalSpent: 0,
    address: 'San Francisco, CA 94105, USA',
  },
  {
    id: 'u-12',
    email: 'hamy.le@startuphub.vn',
    fullName: 'Ha My Le',
    phone: '+84 944 888 999',
    role: 'CUSTOMER',
    status: 'SUSPENDED',
    emailVerifiedAt: null,
    createdAt: '2026-06-15T08:45:00Z',
    lastActiveAt: '2026-07-10T11:00:00Z',
    totalOrders: 0,
    totalSpent: 0,
    address: 'Ba Dinh, Hanoi, Vietnam',
  },
]

export const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: 'ord-1001',
    orderCode: 'TS-2026-1001',
    customer: {
      id: 'u-2',
      name: 'Sarah Connor',
      email: 'sarah.connor@gmail.com',
      phone: '+1 (555) 432-8901',
    },
    shippingAddress: {
      recipientName: 'Sarah Connor',
      phone: '+1 (555) 432-8901',
      street: '742 Cyberdyne Blvd, Suite 400',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'United States',
    },
    items: [
      {
        id: 'item-1',
        productId: 'p-1',
        productName: 'AeroBook Pro 14 (M3 Max)',
        productSku: 'LAP-APL-M3M14-1TB',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
        unitPrice: 1899,
        quantity: 1,
        totalPrice: 1899,
      },
      {
        id: 'item-2',
        productId: 'p-4',
        productName: 'Apex Precision Wireless Mouse',
        productSku: 'MOU-LOG-APXPRC',
        imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80',
        unitPrice: 109,
        quantity: 1,
        totalPrice: 109,
      },
    ],
    subtotal: 2008,
    discount: 50,
    shippingFee: 0,
    totalAmount: 1958,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    fulfilmentStatus: 'DELIVERED',
    trackingNumber: 'VNP-883921-US',
    carrier: 'FedEx Express',
    timeline: [
      { status: 'CREATED', title: 'Order placed', description: 'Order successfully created via web checkout', timestamp: '2026-08-01T14:22:00Z' },
      { status: 'PAID', title: 'VNPay payment authorized', description: 'Transaction #VN948271 completed ($1,958.00)', timestamp: '2026-08-01T14:25:00Z' },
      { status: 'PROCESSING', title: 'Fulfillment initiated', description: 'Items picked and verified in Warehouse A', timestamp: '2026-08-02T08:30:00Z' },
      { status: 'SHIPPED', title: 'Dispatched with carrier', description: 'FedEx tracking assigned: VNP-883921-US', timestamp: '2026-08-02T16:10:00Z' },
      { status: 'DELIVERED', title: 'Delivered to recipient', description: 'Signed and delivered at front desk', timestamp: '2026-08-04T11:45:00Z' },
    ],
    createdAt: '2026-08-01T14:22:00Z',
    updatedAt: '2026-08-04T11:45:00Z',
  },
  {
    id: 'ord-1002',
    orderCode: 'TS-2026-1002',
    customer: {
      id: 'u-3',
      name: 'David Chen',
      email: 'david.chen@enterprise.io',
      phone: '+1 (555) 876-1234',
    },
    shippingAddress: {
      recipientName: 'David Chen',
      phone: '+1 (555) 876-1234',
      street: '1200 Market Street, 18th Floor',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'United States',
    },
    items: [
      {
        id: 'item-3',
        productId: 'p-6',
        productName: 'UltraVision 27" 4K OLED Pro Display',
        productSku: 'MON-ASU-UV27',
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80',
        unitPrice: 799,
        quantity: 2,
        totalPrice: 1598,
      },
    ],
    subtotal: 1598,
    discount: 0,
    shippingFee: 25,
    totalAmount: 1623,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    fulfilmentStatus: 'SHIPPED',
    trackingNumber: 'TRK-99210-SF',
    carrier: 'UPS Ground',
    timeline: [
      { status: 'CREATED', title: 'Order placed', description: 'Order placed by corporate customer', timestamp: '2026-08-06T09:15:00Z' },
      { status: 'PAID', title: 'VNPay payment cleared', description: 'Transaction #VN948332 successful ($1,623.00)', timestamp: '2026-08-06T09:17:00Z' },
      { status: 'PROCESSING', title: 'Packaging dual monitors', description: 'Cushioned pallet prepared', timestamp: '2026-08-07T10:00:00Z' },
      { status: 'SHIPPED', title: 'In Transit', description: 'Package picked up by UPS Ground', timestamp: '2026-08-08T15:30:00Z' },
    ],
    createdAt: '2026-08-06T09:15:00Z',
    updatedAt: '2026-08-08T15:30:00Z',
  },
  {
    id: 'ord-1003',
    orderCode: 'TS-2026-1003',
    customer: {
      id: 'u-4',
      name: 'Elena Rostova',
      email: 'elena.rostova@designworks.com',
      phone: '+1 (555) 654-7890',
    },
    shippingAddress: {
      recipientName: 'Elena Rostova',
      phone: '+1 (555) 654-7890',
      street: '450 West 33rd Street, Loft 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
    },
    items: [
      {
        id: 'item-4',
        productId: 'p-2',
        productName: 'NovaPhone X2 Ultra 5G',
        productSku: 'PHN-SAM-X2U-512',
        imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=80',
        unitPrice: 899,
        quantity: 1,
        totalPrice: 899,
      },
      {
        id: 'item-5',
        productId: 'p-5',
        productName: 'SonarStudio Spatial Audio ANC Headphones',
        productSku: 'AUD-SNY-SNRSTD',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        unitPrice: 299,
        quantity: 1,
        totalPrice: 299,
      },
    ],
    subtotal: 1198,
    discount: 100,
    shippingFee: 0,
    totalAmount: 1098,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    fulfilmentStatus: 'PROCESSING',
    timeline: [
      { status: 'CREATED', title: 'Order placed', description: 'Customer completed checkout with coupon TECH100', timestamp: '2026-08-08T18:40:00Z' },
      { status: 'PAID', title: 'Payment verified', description: 'VNPay payment confirmed ($1,098.00)', timestamp: '2026-08-08T18:42:00Z' },
      { status: 'PROCESSING', title: 'Picking items', description: 'Items sent to packaging queue', timestamp: '2026-08-09T08:00:00Z' },
    ],
    createdAt: '2026-08-08T18:40:00Z',
    updatedAt: '2026-08-09T08:00:00Z',
  },
  {
    id: 'ord-1004',
    orderCode: 'TS-2026-1004',
    customer: {
      id: 'u-7',
      name: 'Rachel Green',
      email: 'rachel.green@fashiontech.co',
      phone: '+1 (555) 999-1234',
    },
    shippingAddress: {
      recipientName: 'Rachel Green',
      phone: '+1 (555) 999-1234',
      street: '90 Bedford Street, Apt 20',
      city: 'New York',
      state: 'NY',
      postalCode: '10014',
      country: 'United States',
    },
    items: [
      {
        id: 'item-6',
        productId: 'p-3',
        productName: 'Pulse Pro Wireless Mechanical Keyboard',
        productSku: 'KEY-KCH-PLSPRO',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
        unitPrice: 149,
        quantity: 1,
        totalPrice: 149,
      },
    ],
    subtotal: 149,
    discount: 0,
    shippingFee: 15,
    totalAmount: 164,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    fulfilmentStatus: 'PENDING',
    timeline: [
      { status: 'CREATED', title: 'Cash on Delivery order created', description: 'Customer selected COD payment method', timestamp: '2026-08-09T20:10:00Z' },
    ],
    createdAt: '2026-08-09T20:10:00Z',
    updatedAt: '2026-08-09T20:10:00Z',
  },
  {
    id: 'ord-1005',
    orderCode: 'TS-2026-1005',
    customer: {
      id: 'u-5',
      name: 'Marcus Brody',
      email: 'marcus.brody@museum.org',
      phone: '+1 (555) 321-9876',
    },
    shippingAddress: {
      recipientName: 'Marcus Brody',
      phone: '+1 (555) 321-9876',
      street: '150 Central Park West',
      city: 'New York',
      state: 'NY',
      postalCode: '10023',
      country: 'United States',
    },
    items: [
      {
        id: 'item-7',
        productId: 'p-4',
        productName: 'Apex Precision Wireless Mouse',
        productSku: 'MOU-LOG-APXPRC',
        imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80',
        unitPrice: 129,
        quantity: 1,
        totalPrice: 129,
      },
    ],
    subtotal: 129,
    discount: 0,
    shippingFee: 10,
    totalAmount: 139,
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: 'REFUNDED',
    fulfilmentStatus: 'CANCELLED',
    notes: 'Customer requested cancellation prior to dispatch.',
    timeline: [
      { status: 'CREATED', title: 'Order submitted', description: 'Credit card checkout', timestamp: '2026-08-03T11:00:00Z' },
      { status: 'PAID', title: 'Card charge successful', description: 'Processed through payment gateway', timestamp: '2026-08-03T11:02:00Z' },
      { status: 'CANCELLED', title: 'Order cancelled by customer', description: 'Customer changed mind', timestamp: '2026-08-03T14:30:00Z' },
      { status: 'REFUNDED', title: 'Refund processed', description: 'Full refund $139.00 returned to card', timestamp: '2026-08-03T15:00:00Z' },
    ],
    createdAt: '2026-08-03T11:00:00Z',
    updatedAt: '2026-08-03T15:00:00Z',
  },
]

export const REVENUE_SERIES_30D: RevenuePoint[] = [
  { date: '2026-07-12', revenue: 3200, orders: 4 },
  { date: '2026-07-14', revenue: 4850, orders: 6 },
  { date: '2026-07-16', revenue: 2900, orders: 3 },
  { date: '2026-07-18', revenue: 6100, orders: 8 },
  { date: '2026-07-20', revenue: 5400, orders: 7 },
  { date: '2026-07-22', revenue: 7800, orders: 10 },
  { date: '2026-07-24', revenue: 4200, orders: 5 },
  { date: '2026-07-26', revenue: 8900, orders: 11 },
  { date: '2026-07-28', revenue: 6700, orders: 9 },
  { date: '2026-07-30', revenue: 9500, orders: 13 },
  { date: '2026-08-01', revenue: 8200, orders: 10 },
  { date: '2026-08-03', revenue: 11400, orders: 15 },
  { date: '2026-08-05', revenue: 7900, orders: 9 },
  { date: '2026-08-07', revenue: 13200, orders: 18 },
  { date: '2026-08-09', revenue: 12500, orders: 16 },
]

export const REVENUE_SERIES_7D: RevenuePoint[] = [
  { date: '2026-08-04', revenue: 6400, orders: 7 },
  { date: '2026-08-05', revenue: 7900, orders: 9 },
  { date: '2026-08-06', revenue: 9800, orders: 12 },
  { date: '2026-08-07', revenue: 13200, orders: 18 },
  { date: '2026-08-08', revenue: 10400, orders: 14 },
  { date: '2026-08-09', revenue: 12500, orders: 16 },
  { date: '2026-08-10', revenue: 14100, orders: 19 },
]

export const REVENUE_SERIES_90D: RevenuePoint[] = [
  { date: '2026-05-15', revenue: 38000, orders: 52 },
  { date: '2026-06-01', revenue: 49000, orders: 68 },
  { date: '2026-06-15', revenue: 62000, orders: 84 },
  { date: '2026-07-01', revenue: 74000, orders: 98 },
  { date: '2026-07-15', revenue: 86000, orders: 112 },
  { date: '2026-08-01', revenue: 99400, orders: 130 },
]

export const TOP_SELLING_PRODUCTS: TopSellingProduct[] = [
  {
    productId: 'p-1',
    productName: 'AeroBook Pro 14 (M3 Max)',
    productSku: 'LAP-APL-M3M14',
    categoryName: 'Laptops',
    soldQuantity: 64,
    revenue: 121536,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
  },
  {
    productId: 'p-2',
    productName: 'NovaPhone X2 Ultra 5G',
    productSku: 'PHN-SAM-X2U',
    categoryName: 'Smartphones',
    soldQuantity: 92,
    revenue: 82708,
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=80',
  },
  {
    productId: 'p-5',
    productName: 'SonarStudio Spatial Audio ANC Headphones',
    productSku: 'AUD-SNY-SNRSTD',
    categoryName: 'Audio',
    soldQuantity: 118,
    revenue: 41182,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
  },
  {
    productId: 'p-6',
    productName: 'UltraVision 27" 4K OLED Pro Display',
    productSku: 'MON-ASU-UV27',
    categoryName: 'Monitors',
    soldQuantity: 38,
    revenue: 30362,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80',
  },
  {
    productId: 'p-3',
    productName: 'Pulse Pro Wireless Mechanical Keyboard',
    productSku: 'KEY-KCH-PLSPRO',
    categoryName: 'Keyboards',
    soldQuantity: 145,
    revenue: 21605,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
  },
]

export const LOW_STOCK_PRODUCTS: LowStockItem[] = [
  {
    productId: 'p-7',
    productName: 'TitanCore RTX 4080 Super OC 16GB',
    sku: 'CMP-ASU-T4080S',
    categoryName: 'Components & GPUs',
    currentStock: 0,
    threshold: 10,
    status: 'OUT_OF_STOCK',
  },
  {
    productId: 'p-6',
    productName: 'UltraVision 27" 4K OLED Pro Display',
    sku: 'MON-ASU-UV27',
    categoryName: 'Monitors',
    currentStock: 2,
    threshold: 5,
    status: 'ACTIVE',
  },
  {
    productId: 'p-4',
    productName: 'Apex Precision Wireless Mouse',
    sku: 'MOU-LOG-APXPRC',
    categoryName: 'Mice & Pointers',
    currentStock: 4,
    threshold: 8,
    status: 'ACTIVE',
  },
]

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  totalRevenue: 297393,
  revenueGrowthPercent: 18.4,
  totalOrders: 457,
  ordersGrowthPercent: 12.1,
  totalProducts: 9,
  activeProductsCount: 7,
  outOfStockCount: 1,
  totalCustomers: 1248,
  newCustomersThisMonth: 142,
  averageOrderValue: 650.75,
  orderStatusCounts: {
    pending: 12,
    processing: 28,
    shipped: 45,
    delivered: 362,
    cancelled: 10,
  },
  paymentStatusCounts: {
    paid: 418,
    pending: 24,
    failed: 6,
    refunded: 9,
  },
}

// In-Memory Persistent Store for demo/offline admin operations
class MockAdminDataStore {
  private categories: AdminCategory[] = [...INITIAL_CATEGORIES]
  private brands: AdminBrand[] = [...INITIAL_BRANDS]
  private products: AdminProduct[] = [...INITIAL_PRODUCTS]
  private users: AdminUser[] = [...INITIAL_USERS]
  private orders: AdminOrder[] = [...INITIAL_ORDERS]

  getCategories(): AdminCategory[] {
    return [...this.categories]
  }

  createCategory(payload: Partial<AdminCategory>): AdminCategory {
    const newCat: AdminCategory = {
      id: `cat-${Date.now()}`,
      name: payload.name || 'Untitled Category',
      slug: payload.slug || (payload.name || 'untitled').toLowerCase().replace(/\s+/g, '-'),
      description: payload.description || '',
      isActive: payload.isActive ?? true,
      productCount: 0,
    }
    this.categories.unshift(newCat)
    return newCat
  }

  updateCategory(id: string, payload: Partial<AdminCategory>): AdminCategory {
    const index = this.categories.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Category not found')
    this.categories[index] = { ...this.categories[index], ...payload }
    return this.categories[index]
  }

  deleteCategory(id: string): void {
    this.categories = this.categories.filter((c) => c.id !== id)
  }

  getBrands(): AdminBrand[] {
    return [...this.brands]
  }

  createBrand(payload: Partial<AdminBrand>): AdminBrand {
    const newBrand: AdminBrand = {
      id: `brand-${Date.now()}`,
      name: payload.name || 'Untitled Brand',
      slug: payload.slug || (payload.name || 'untitled').toLowerCase().replace(/\s+/g, '-'),
      description: payload.description || '',
      isActive: payload.isActive ?? true,
      productCount: 0,
    }
    this.brands.unshift(newBrand)
    return newBrand
  }

  updateBrand(id: string, payload: Partial<AdminBrand>): AdminBrand {
    const index = this.brands.findIndex((b) => b.id === id)
    if (index === -1) throw new Error('Brand not found')
    this.brands[index] = { ...this.brands[index], ...payload }
    return this.brands[index]
  }

  deleteBrand(id: string): void {
    this.brands = this.brands.filter((b) => b.id !== id)
  }

  getProducts(): AdminProduct[] {
    return [...this.products]
  }

  createProduct(payload: Partial<AdminProduct>): AdminProduct {
    const category = this.categories.find((c) => c.id === payload.categoryId) || this.categories[0]
    const brand = this.brands.find((b) => b.id === payload.brandId) || this.brands[0]
    const newProduct: AdminProduct = {
      id: `p-${Date.now()}`,
      name: payload.name || 'Untitled Product',
      slug: payload.slug || (payload.name || 'untitled').toLowerCase().replace(/\s+/g, '-'),
      sku: payload.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: payload.categoryId || category.id,
      brandId: payload.brandId || brand.id,
      category,
      brand,
      basePrice: Number(payload.basePrice) || 0,
      salePrice: payload.salePrice ? Number(payload.salePrice) : null,
      shortDescription: payload.shortDescription || '',
      description: payload.description || '',
      stockQuantity: Number(payload.stockQuantity) || 0,
      status: payload.status || 'DRAFT',
      isFeatured: payload.isFeatured ?? false,
      images: payload.images?.length
        ? payload.images
        : [{ imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80', publicId: `img_${Date.now()}`, isPrimary: true }],
      variants: payload.variants || [],
      specifications: payload.specifications || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.products.unshift(newProduct)
    return newProduct
  }

  updateProduct(id: string, payload: Partial<AdminProduct>): AdminProduct {
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Product not found')
    const current = this.products[index]
    const category = payload.categoryId ? this.categories.find((c) => c.id === payload.categoryId) || current.category : current.category
    const brand = payload.brandId ? this.brands.find((b) => b.id === payload.brandId) || current.brand : current.brand
    this.products[index] = {
      ...current,
      ...payload,
      category,
      brand,
      updatedAt: new Date().toISOString(),
    }
    return this.products[index]
  }

  deleteProduct(id: string): void {
    this.products = this.products.filter((p) => p.id !== id)
  }

  getUsers(): AdminUser[] {
    return [...this.users]
  }

  createUser(payload: Partial<AdminUser>): AdminUser {
    const newUser: AdminUser = {
      id: `u-${Date.now()}`,
      email: payload.email || '',
      fullName: payload.fullName || '',
      phone: payload.phone || null,
      role: payload.role || 'CUSTOMER',
      status: payload.status || 'ACTIVE',
      emailVerifiedAt: payload.emailVerifiedAt ?? payload.email_verified_at ?? null,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      address: payload.address,
    }
    this.users.unshift(newUser)
    return newUser
  }

  updateUser(id: string, payload: Partial<AdminUser>): AdminUser {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) throw new Error('User not found')
    this.users[index] = { ...this.users[index], ...payload }
    return this.users[index]
  }

  deleteUser(id: string): void {
    this.users = this.users.filter((u) => u.id !== id)
  }

  getOrders(): AdminOrder[] {
    return [...this.orders]
  }

  updateOrderStatus(orderId: string, fulfilmentStatus: AdminOrder['fulfilmentStatus'], note?: string): AdminOrder {
    const index = this.orders.findIndex((o) => o.id === orderId)
    if (index === -1) throw new Error('Order not found')
    const order = this.orders[index]
    const newTimelineItem = {
      status: fulfilmentStatus,
      title: `Status updated to ${fulfilmentStatus}`,
      description: note || `Admin updated fulfilment state to ${fulfilmentStatus}`,
      timestamp: new Date().toISOString(),
    }
    const updatedOrder = {
      ...order,
      fulfilmentStatus,
      timeline: [...order.timeline, newTimelineItem],
      updatedAt: new Date().toISOString(),
    }
    this.orders[index] = updatedOrder
    return updatedOrder
  }

  getDashboardSummary(): DashboardSummary {
    const products = this.products
    const activeProducts = products.filter((p) => p.status === 'ACTIVE').length
    const outOfStock = products.filter((p) => p.stockQuantity === 0 || p.status === 'OUT_OF_STOCK').length
    const users = this.users
    const orders = this.orders
    const totalRev = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0)

    return {
      ...MOCK_DASHBOARD_SUMMARY,
      totalRevenue: totalRev > 0 ? totalRev + 290000 : MOCK_DASHBOARD_SUMMARY.totalRevenue,
      totalProducts: products.length,
      activeProductsCount: activeProducts,
      outOfStockCount: outOfStock,
      totalCustomers: users.length,
      totalOrders: orders.length + 450,
    }
  }

  getLowStockItems(): LowStockItem[] {
    return this.products
      .filter((p) => p.stockQuantity <= 5 || p.status === 'OUT_OF_STOCK')
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku || 'N/A',
        categoryName: p.category?.name || 'General',
        currentStock: p.stockQuantity,
        threshold: 8,
        status: p.status,
      }))
  }
}

export const mockAdminStore = new MockAdminDataStore()
