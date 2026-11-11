export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export type Booking = {
  id: string;
  tenant_id: string;
  building_id: string;
  bed_id?: string;
  status: BookingStatus;
  check_in_date?: string;
  check_out_date?: string;
  monthly_rent: number;
  deposit_amount: number;
  created_at: string;
  building?: {
    name: string;
    city: string;
    address: string;
  };
};
