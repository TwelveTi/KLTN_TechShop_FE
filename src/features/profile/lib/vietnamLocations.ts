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

export const NO_DISTRICT_LABEL = 'Khong ap dung'

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
