export type GenderType = 'Male' | 'Female' | 'Co-Living';
export type BedStatus = 'Available' | 'Occupied' | 'Maintenance';

export type Amenity = {
  id: string;
  name: string;
  icon: string;
};

export type Building = {
  id: string;
  name: string;
  address: string;
  city: string;
  gender_type: GenderType;
  description?: string;
  monthly_rent?: number;
  deposit_amount?: number;
  total_beds?: number;
  available_beds?: number;
  is_verified: boolean;
  thumbnail_url?: string;
  images?: string[];
  amenities?: Amenity[];
  rating?: number;
  review_count?: number;
  created_at: string;
};

export type SearchFilters = {
  city?: string;
  gender_type?: GenderType | '';
  min_rent?: number;
  max_rent?: number;
  amenities?: string[];
  available_from?: string;
};
