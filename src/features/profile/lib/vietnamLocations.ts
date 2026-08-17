export type WardOption = {
  name: string
}

export type DistrictOption = {
  name: string
  wards: WardOption[]
}

export type ProvinceOption = {
  name: string
  districts: DistrictOption[]
}

type ApiWard = {
  name: string
}

type ApiDistrict = {
  name: string
  wards?: ApiWard[] | null
}

type ApiProvince = {
  name: string
  districts?: ApiDistrict[] | null
  wards?: ApiWard[] | null
}

/**
 * Vietnam removed the district level in the 2025 administrative reform: the API
 * now returns 34 provinces whose wards hang directly off the province, with no
 * `districts` array at all. The backend's `user_addresses.district` column is
 * still NOT NULL, so a province without districts gets this placeholder stored
 * in that column — it must never be shown to a shopper or offered as a choice.
 */
export const NO_DISTRICT_LABEL = 'Khong ap dung'

/** True for a district value that only exists to satisfy the database. */
export const isPlaceholderDistrict = (name?: string | null): boolean =>
  !name || name.trim() === '' || name === NO_DISTRICT_LABEL

/**
 * The district to store for a province. Real districts are still honoured if
 * the API ever serves them again; otherwise this is the placeholder.
 */
export const resolveDistrictName = (province?: ProvinceOption | null): string =>
  province?.districts[0]?.name || NO_DISTRICT_LABEL

/** Every ward selectable under a province, across all of its districts. */
export const resolveWardsForProvince = (province?: ProvinceOption | null): WardOption[] =>
  (province?.districts || []).flatMap((district) => district.wards)

/** Drops empty parts and the placeholder district from a displayed address. */
export const formatAddressParts = (parts: Array<string | null | undefined>): string =>
  parts.filter((part) => part && !isPlaceholderDistrict(part)).join(', ')

export const fallbackVietnamLocations: ProvinceOption[] = [
  {
    name: 'Thanh pho Ho Chi Minh',
    districts: [
      { name: NO_DISTRICT_LABEL, wards: [{ name: 'Phuong Sai Gon' }, { name: 'Phuong Ben Thanh' }] },
    ],
  },
  {
    name: 'Thanh pho Ha Noi',
    districts: [
      { name: NO_DISTRICT_LABEL, wards: [{ name: 'Phuong Ba Dinh' }, { name: 'Phuong Hoan Kiem' }] },
    ],
  },
  {
    name: 'Thanh pho Da Nang',
    districts: [
      { name: NO_DISTRICT_LABEL, wards: [{ name: 'Phuong Hai Chau' }, { name: 'Phuong Son Tra' }] },
    ],
  },
  {
    name: 'Tinh Gia Lai',
    districts: [
      { name: NO_DISTRICT_LABEL, wards: [{ name: 'Phuong Pleiku' }, { name: 'Xa An Khe' }] },
    ],
  },
]

const normalizeProvince = (province: ApiProvince): ProvinceOption => {
  if (province.districts?.length) {
    return {
      name: province.name,
      districts: province.districts.map((district) => ({
        name: district.name,
        wards: district.wards?.map((ward) => ({ name: ward.name })) || [],
      })),
    }
  }

  return {
    name: province.name,
    districts: [
      {
        name: NO_DISTRICT_LABEL,
        wards: province.wards?.map((ward) => ({ name: ward.name })) || [],
      },
    ],
  }
}

export const loadVietnamLocations = async () => {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/v2/?depth=2')

    if (!response.ok) {
      return fallbackVietnamLocations
    }

    const locations = (await response.json()) as ApiProvince[]
    const normalizedLocations = locations.map(normalizeProvince).filter((province) => province.districts.length)

    return normalizedLocations.length ? normalizedLocations : fallbackVietnamLocations
  } catch {
    return fallbackVietnamLocations
  }
}
