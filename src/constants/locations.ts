import { District, Province } from '../types/database';

export const PROVINCES: Province[] = [
  { code: 'HN', name: 'Hà Nội' },
  { code: 'HCM', name: 'Hồ Chí Minh' },
  { code: 'DN', name: 'Đà Nẵng' },
];

export const DISTRICTS: District[] = [
  // Hà Nội
  { code: 'HN_CG', province_code: 'HN', name: 'Cầu Giấy' },
  { code: 'HN_BD', province_code: 'HN', name: 'Ba Đình' },
  { code: 'HN_DD', province_code: 'HN', name: 'Đống Đa' },
  { code: 'HN_TX', province_code: 'HN', name: 'Thanh Xuân' },
  { code: 'HN_HBT', province_code: 'HN', name: 'Hai Bà Trưng' },
  { code: 'HN_NTL', province_code: 'HN', name: 'Nam Từ Liêm' },
  { code: 'HN_BTL', province_code: 'HN', name: 'Bắc Từ Liêm' },
  { code: 'HN_HD', province_code: 'HN', name: 'Hà Đông' },
  { code: 'HN_HM', province_code: 'HN', name: 'Hoàng Mai' },
  { code: 'HN_TH', province_code: 'HN', name: 'Tây Hồ' },
  { code: 'HN_LB', province_code: 'HN', name: 'Long Biên' },
  { code: 'HN_HK', province_code: 'HN', name: 'Hoàn Kiếm' },
  { code: 'HN_TT', province_code: 'HN', name: 'Thanh Trì' },
  { code: 'HN_GL', province_code: 'HN', name: 'Gia Lâm' },
  { code: 'HN_HDC', province_code: 'HN', name: 'Hoài Đức' },
  { code: 'HN_DA', province_code: 'HN', name: 'Đông Anh' },

  // TP. Hồ Chí Minh
  { code: 'HCM_Q1', province_code: 'HCM', name: 'Quận 1' },
  { code: 'HCM_Q3', province_code: 'HCM', name: 'Quận 3' },
  { code: 'HCM_Q4', province_code: 'HCM', name: 'Quận 4' },
  { code: 'HCM_Q5', province_code: 'HCM', name: 'Quận 5' },
  { code: 'HCM_Q6', province_code: 'HCM', name: 'Quận 6' },
  { code: 'HCM_Q7', province_code: 'HCM', name: 'Quận 7' },
  { code: 'HCM_Q8', province_code: 'HCM', name: 'Quận 8' },
  { code: 'HCM_Q10', province_code: 'HCM', name: 'Quận 10' },
  { code: 'HCM_Q11', province_code: 'HCM', name: 'Quận 11' },
  { code: 'HCM_Q12', province_code: 'HCM', name: 'Quận 12' },
  { code: 'HCM_TB', province_code: 'HCM', name: 'Tân Bình' },
  { code: 'HCM_BTH', province_code: 'HCM', name: 'Bình Thạnh' },
  { code: 'HCM_PN', province_code: 'HCM', name: 'Phú Nhuận' },
  { code: 'HCM_GV', province_code: 'HCM', name: 'Gò Vấp' },
  { code: 'HCM_TP', province_code: 'HCM', name: 'Tân Phú' },
  { code: 'HCM_BT', province_code: 'HCM', name: 'Bình Tân' },
  { code: 'HCM_TD', province_code: 'HCM', name: 'TP. Thủ Đức' },

  // Đà Nẵng
  { code: 'DN_HC', province_code: 'DN', name: 'Hải Châu' },
  { code: 'DN_TK', province_code: 'DN', name: 'Thanh Khê' },
  { code: 'DN_ST', province_code: 'DN', name: 'Sơn Trà' },
  { code: 'DN_NHS', province_code: 'DN', name: 'Ngũ Hành Sơn' },
  { code: 'DN_LC', province_code: 'DN', name: 'Liên Chiểu' },
  { code: 'DN_CL', province_code: 'DN', name: 'Cẩm Lệ' },
];

// Tương thích ngược
export const MOCK_DISTRICTS = DISTRICTS;
