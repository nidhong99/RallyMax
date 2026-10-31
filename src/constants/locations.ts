import { District, Province } from "../types/database";

export const PROVINCES: Province[] = [
  { code: "HN", name: "Hà Nội" },
  { code: "HCM", name: "Hồ Chí Minh" },
  { code: "DN", name: "Đà Nẵng" },
];

export const DISTRICTS: District[] = [
  // Hà Nội
  { code: "HN_CG", province_code: "HN", name: "Cầu Giấy", latitude: 21.0362, longitude: 105.7906 },
  { code: "HN_BD", province_code: "HN", name: "Ba Đình", latitude: 21.0341, longitude: 105.8242 },
  { code: "HN_DD", province_code: "HN", name: "Đống Đa", latitude: 21.0181, longitude: 105.8272 },
  { code: "HN_TX", province_code: "HN", name: "Thanh Xuân", latitude: 20.9937, longitude: 105.8118 },
  { code: "HN_HBT", province_code: "HN", name: "Hai Bà Trưng", latitude: 21.0069, longitude: 105.8524 },
  { code: "HN_NTL", province_code: "HN", name: "Nam Từ Liêm", latitude: 21.0142, longitude: 105.7644 },
  { code: "HN_BTL", province_code: "HN", name: "Bắc Từ Liêm", latitude: 21.0645, longitude: 105.7562 },
  { code: "HN_HD", province_code: "HN", name: "Hà Đông", latitude: 20.9723, longitude: 105.7744 },
  { code: "HN_HM", province_code: "HN", name: "Hoàng Mai", latitude: 20.9752, longitude: 105.8538 },
  { code: "HN_TH", province_code: "HN", name: "Tây Hồ", latitude: 21.0716, longitude: 105.8228 },
  { code: "HN_LB", province_code: "HN", name: "Long Biên", latitude: 21.0366, longitude: 105.8924 },
  { code: "HN_HK", province_code: "HN", name: "Hoàn Kiếm", latitude: 21.0285, longitude: 105.8542 },
  { code: "HN_TT", province_code: "HN", name: "Thanh Trì", latitude: 20.9497, longitude: 105.8456 },
  { code: "HN_GL", province_code: "HN", name: "Gia Lâm", latitude: 21.0163, longitude: 105.9407 },
  { code: "HN_HDC", province_code: "HN", name: "Hoài Đức", latitude: 21.0217, longitude: 105.7029 },
  { code: "HN_DA", province_code: "HN", name: "Đông Anh", latitude: 21.1372, longitude: 105.8456 },

  // TP. Hồ Chí Minh
  { code: "HCM_Q1", province_code: "HCM", name: "Quận 1", latitude: 10.7769, longitude: 106.7009 },
  { code: "HCM_Q3", province_code: "HCM", name: "Quận 3", latitude: 10.7844, longitude: 106.6844 },
  { code: "HCM_Q4", province_code: "HCM", name: "Quận 4", latitude: 10.7578, longitude: 106.7013 },
  { code: "HCM_Q5", province_code: "HCM", name: "Quận 5", latitude: 10.7554, longitude: 106.6672 },
  { code: "HCM_Q6", province_code: "HCM", name: "Quận 6", latitude: 10.7481, longitude: 106.6352 },
  { code: "HCM_Q7", province_code: "HCM", name: "Quận 7", latitude: 10.734, longitude: 106.7218 },
  { code: "HCM_Q8", province_code: "HCM", name: "Quận 8", latitude: 10.7241, longitude: 106.6286 },
  { code: "HCM_Q10", province_code: "HCM", name: "Quận 10", latitude: 10.7716, longitude: 106.6672 },
  { code: "HCM_Q11", province_code: "HCM", name: "Quận 11", latitude: 10.7672, longitude: 106.6508 },
  { code: "HCM_Q12", province_code: "HCM", name: "Quận 12", latitude: 10.8672, longitude: 106.6414 },
  { code: "HCM_TB", province_code: "HCM", name: "Tân Bình", latitude: 10.8015, longitude: 106.6528 },
  { code: "HCM_BTH", province_code: "HCM", name: "Bình Thạnh", latitude: 10.8106, longitude: 106.7091 },
  { code: "HCM_PN", province_code: "HCM", name: "Phú Nhuận", latitude: 10.7992, longitude: 106.6806 },
  { code: "HCM_GV", province_code: "HCM", name: "Gò Vấp", latitude: 10.8387, longitude: 106.6653 },
  { code: "HCM_TP", province_code: "HCM", name: "Tân Phú", latitude: 10.7901, longitude: 106.6281 },
  { code: "HCM_BT", province_code: "HCM", name: "Bình Tân", latitude: 10.7654, longitude: 106.6039 },
  { code: "HCM_TD", province_code: "HCM", name: "TP. Thủ Đức", latitude: 10.8494, longitude: 106.7537 },

  // Đà Nẵng
  { code: "DN_HC", province_code: "DN", name: "Hải Châu", latitude: 16.0594, longitude: 108.2208 },
  { code: "DN_TK", province_code: "DN", name: "Thanh Khê", latitude: 16.0617, longitude: 108.1884 },
  { code: "DN_ST", province_code: "DN", name: "Sơn Trà", latitude: 16.0903, longitude: 108.2483 },
  { code: "DN_NHS", province_code: "DN", name: "Ngũ Hành Sơn", latitude: 16.0125, longitude: 108.2619 },
  { code: "DN_LC", province_code: "DN", name: "Liên Chiểu", latitude: 16.0825, longitude: 108.1467 },
  { code: "DN_CL", province_code: "DN", name: "Cẩm Lệ", latitude: 15.9989, longitude: 108.1969 },
];

// Tương thích ngược
export const MOCK_DISTRICTS = DISTRICTS;
