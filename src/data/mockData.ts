import { Profile, Venue, Event, Province, District, Review } from '../types/database';

export const MOCK_PROVINCES: Province[] = [
  { code: 'HN', name: 'Hà Nội' },
  { code: 'HCM', name: 'Hồ Chí Minh' },
  { code: 'DN', name: 'Đà Nẵng' },
];

export const MOCK_DISTRICTS: District[] = [
  { code: 'HN_BD', province_code: 'HN', name: 'Ba Đình' },
  { code: 'HN_CG', province_code: 'HN', name: 'Cầu Giấy' },
  { code: 'HN_TX', province_code: 'HN', name: 'Thanh Xuân' },
  { code: 'HN_HBT', province_code: 'HN', name: 'Hai Bà Trưng' },
  { code: 'HCM_Q1', province_code: 'HCM', name: 'Quận 1' },
  { code: 'HCM_Q10', province_code: 'HCM', name: 'Quận 10' },
  { code: 'HCM_TB', province_code: 'HCM', name: 'Tân Bình' },
  { code: 'HCM_BTH', province_code: 'HCM', name: 'Bình Thạnh' },
  { code: 'DN_HC', province_code: 'DN', name: 'Hải Châu' },
];

export const MOCK_PROFILES: Profile[] = [];

export const MOCK_VENUES: Venue[] = [
  {
    id: 'venue-1',
    name: 'Sân Cầu Lông Viettel Hoàng Hoa Thám',
    address: 'Ngõ 19 Liễu Giai / Hoàng Hoa Thám, Ba Đình, Hà Nội',
    district_code: 'HN_BD',
    latitude: 21.0375,
    longitude: 105.8152,
    created_by: 'system',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'venue-2',
    name: 'Sân Cầu Lông Cung Thể Thao Quần Ngựa',
    address: '30 Văn Cao, Liễu Giai, Ba Đình, Hà Nội',
    district_code: 'HN_BD',
    latitude: 21.0412,
    longitude: 105.8143,
    created_by: 'system',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'venue-3',
    name: 'Sân Cầu Lông Kỳ Hòa (Quận 10)',
    address: 'Sư Vạn Hạnh nối dài, Phường 12, Quận 10, TP. Hồ Chí Minh',
    district_code: 'HCM_Q10',
    latitude: 10.7761,
    longitude: 106.6712,
    created_by: 'system',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'venue-4',
    name: 'Sân Cầu Lông Cầu Giấy (Nhà Thi Đấu Cầu Giấy)',
    address: '35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội',
    district_code: 'HN_CG',
    latitude: 21.0354,
    longitude: 105.7942,
    created_by: 'system',
    created_at: '2025-01-01T00:00:00Z',
  },
];

export const MOCK_EVENTS: Event[] = [];

export const MOCK_REVIEWS: Review[] = [];

