export type Language = 'vi' | 'en';

export interface Translations {
  nav: {
    brand: string;
    explore: string;
    myEvents: string;
    admin: string;
    createEvent: string;
    signIn: string;
    profile: string;
    profileDesc: string;
    adminSystem: string;
    adminSystemDesc: string;
    signOut: string;
    signOutDesc: string;
    roleSuperAdmin: string;
    roleHost: string;
    rolePlayer: string;
    roleAdminBadge: string;
    roleHostBadge: string;
    rolePlayerBadge: string;
    athlete: string;
    language: string;
    vietnamese: string;
    english: string;
  };
  auth: {
    title: string;
    subtitle: string;
    emailSection: string;
    emailPlaceholder: string;
    emailContinue: string;
    processing: string;
    orContinueWith: string;
    google: string;
    facebook: string;
    emailRequired: string;
    emailInvalid: string;
    googleError: string;
    facebookError: string;
    emailError: string;
    failed: string;
  };
  explorer: {
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    allDistricts: string;
    allSkills: string;
    availableOnly: string;
    reset: string;
    foundCount: string;
    noEvents: string;
    noEventsDesc: string;
    createNow: string;
  };
  card: {
    full: string;
    open: string;
    ended: string;
    yourEvent: string;
    approved: string;
    pending: string;
    slots: string;
    map: string;
    host: string;
    reliability: string;
    fee: string;
    manage: string;
    viewApplication: string;
    join: string;
    court: string;
  };
  myEvents: {
    title: string;
    subtitle: string;
    tabHosted: string;
    tabJoined: string;
    filterAll: string;
    filterPending: string;
    filterApproved: string;
    filterCheckedIn: string;
    filterCancelled: string;
    noHosted: string;
    noHostedDesc: string;
    noJoined: string;
    noJoinedDesc: string;
    exploreNow: string;
  };
  skills: Record<string, { label: string; desc: string }>;
  common: {
    close: string;
    cancel: string;
    confirm: string;
    save: string;
    loading: string;
    currency: string;
    onlyHostCanCreate: string;
  };
}

export const translations: Record<Language, Translations> = {
  vi: {
    nav: {
      brand: 'RallyMax',
      explore: 'Khám phá kèo',
      myEvents: 'Kèo của tôi',
      admin: 'Quản trị (Admin)',
      createEvent: 'Tạo kèo mới',
      signIn: 'Đăng nhập',
      profile: 'Thông tin cá nhân',
      profileDesc: 'Xem & chỉnh sửa hồ sơ',
      adminSystem: 'Bảng Quản Trị Hệ Thống',
      adminSystemDesc: 'Quản lý DB Sân, User & Kèo',
      signOut: 'Đăng xuất',
      signOutDesc: 'Thoát khỏi phiên đăng nhập',
      roleSuperAdmin: 'Quản trị viên tối cao (Toàn quyền hệ thống)',
      roleHost: 'Vai trò Host (Tổ chức kèo)',
      rolePlayer: 'Vai trò Player (Tham gia kèo)',
      roleAdminBadge: 'Admin',
      roleHostBadge: 'Host',
      rolePlayerBadge: 'Player',
      athlete: 'Vận động viên',
      language: 'Ngôn ngữ',
      vietnamese: 'Tiếng Việt',
      english: 'English',
    },
    auth: {
      title: 'Đăng nhập',
      subtitle: 'Kết nối sân cầu lông & cộng đồng đam mê thể thao',
      emailSection: 'Đăng nhập bằng Email',
      emailPlaceholder: 'Nhập email của bạn (vd: nidhong99@gmail.com)...',
      emailContinue: 'Tiếp tục với Email',
      processing: 'Đang xử lý...',
      orContinueWith: 'hoặc tiếp tục với',
      google: 'Tiếp tục bằng tài khoản Google (Gmail)',
      facebook: 'Tiếp tục bằng tài khoản Facebook',
      emailRequired: 'Vui lòng nhập địa chỉ email.',
      emailInvalid: 'Địa chỉ email không hợp lệ (ví dụ: name@gmail.com).',
      googleError: 'Lỗi đăng nhập Google.',
      facebookError: 'Lỗi đăng nhập Facebook.',
      emailError: 'Lỗi đăng nhập bằng email.',
      failed: 'Đăng nhập không thành công.',
    },
    explorer: {
      heroTitle: '🏸 Nền tảng kết nối kèo cầu lông RallyMax',
      heroSubtitle: 'Tìm bạn đánh cầu cùng trình độ, tổ chức giao lưu minh bạch, điểm danh chống bùng kèo',
      searchPlaceholder: '🔍 Tìm tên sân, quận, tiêu đề kèo...',
      allDistricts: 'Tất cả khu vực',
      allSkills: 'Tất cả trình độ',
      availableOnly: 'Chỉ hiện kèo còn chỗ',
      reset: 'Đặt lại',
      foundCount: 'Tìm thấy {count} kèo giao lưu phù hợp',
      noEvents: 'Không tìm thấy kèo nào',
      noEventsDesc: 'Thử thay đổi bộ lọc tìm kiếm hoặc tạo một kèo giao lưu mới',
      createNow: 'Tạo kèo mới ngay',
    },
    card: {
      full: 'Đã đủ slot',
      open: 'Đang mở',
      ended: 'Đã kết thúc',
      yourEvent: '👑 Kèo của bạn',
      approved: '✅ Đã duyệt',
      pending: '⏳ Chờ duyệt',
      slots: '🏸 {count}/{max} slot',
      map: 'Bản đồ ↗',
      host: 'Host',
      reliability: 'uy tín',
      fee: 'Phí tham gia',
      manage: 'Quản lý kèo',
      viewApplication: 'Xem đơn',
      join: 'Tham gia',
      court: 'Sân',
    },
    myEvents: {
      title: 'Kèo của tôi',
      subtitle: 'Theo dõi lịch giao lưu, quản lý người tham gia và điểm danh',
      tabHosted: 'Kèo tôi tổ chức',
      tabJoined: 'Kèo tôi tham gia',
      filterAll: 'Tất cả',
      filterPending: 'Chờ duyệt',
      filterApproved: 'Đã duyệt',
      filterCheckedIn: 'Đã điểm danh',
      filterCancelled: 'Đã huỷ / Bùng',
      noHosted: 'Bạn chưa tổ chức kèo nào',
      noHostedDesc: 'Tạo kèo giao lưu để kết nối với những người chơi khác',
      noJoined: 'Bạn chưa đăng ký kèo nào',
      noJoinedDesc: 'Khám phá danh sách các kèo giao lưu đang mở và tham gia ngay',
      exploreNow: 'Khám phá kèo ngay',
    },
    skills: {
      BEGINNER: { label: 'Yếu / Mới chơi', desc: 'Mới tập chơi, đánh cầu qua lưới cơ bản' },
      LOW_INTERMEDIATE: { label: 'TB- (Trung bình yếu)', desc: 'Phát cầu ổn, biết qua lại, chưa mạnh đập/thủ' },
      INTERMEDIATE: { label: 'TB (Trung bình)', desc: 'Biết bao sân cơ bản, điều cầu ổn định, đánh đôi khá' },
      HIGH_INTERMEDIATE: { label: 'TB+ (Trung bình khá)', desc: 'Tấn công tốt, đập cầu uy lực, thủ lưới linh hoạt' },
      ADVANCED: { label: 'Khá', desc: 'Kỹ chiến thuật toàn diện, thể lực sung mãn, kinh nghiệm dày dặn' },
      PRO: { label: 'Bán chuyên / Chuyên nghiệp', desc: 'Vận động viên hoặc cựu VĐV năng khiếu' },
    },
    common: {
      close: 'Đóng',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      save: 'Lưu',
      loading: 'Đang xử lý...',
      currency: 'đ',
      onlyHostCanCreate: 'Tài khoản của bạn là Player. Chỉ Host hoặc Admin mới có quyền tạo kèo giao lưu.',
    },
  },
  en: {
    nav: {
      brand: 'RallyMax',
      explore: 'Explore Sessions',
      myEvents: 'My Sessions',
      admin: 'Admin Dashboard',
      createEvent: 'Create Session',
      signIn: 'Sign in',
      profile: 'Profile Information',
      profileDesc: 'View & edit your profile',
      adminSystem: 'System Administration',
      adminSystemDesc: 'Manage Venues, Users & Sessions',
      signOut: 'Log out',
      signOutDesc: 'Sign out of your account',
      roleSuperAdmin: 'Super Administrator (Full Access)',
      roleHost: 'Host Role (Organize Sessions)',
      rolePlayer: 'Player Role (Join Sessions)',
      roleAdminBadge: 'Admin',
      roleHostBadge: 'Host',
      rolePlayerBadge: 'Player',
      athlete: 'Athlete',
      language: 'Language',
      vietnamese: 'Tiếng Việt',
      english: 'English',
    },
    auth: {
      title: 'Sign In',
      subtitle: 'Connect badminton venues & passionate sports community',
      emailSection: 'Sign in with Email',
      emailPlaceholder: 'Enter your email (e.g. user@gmail.com)...',
      emailContinue: 'Continue with Email',
      processing: 'Processing...',
      orContinueWith: 'or continue with',
      google: 'Continue with Google (Gmail)',
      facebook: 'Continue with Facebook',
      emailRequired: 'Please enter your email address.',
      emailInvalid: 'Invalid email address (e.g. name@gmail.com).',
      googleError: 'Google sign-in error.',
      facebookError: 'Facebook sign-in error.',
      emailError: 'Email sign-in error.',
      failed: 'Sign-in failed.',
    },
    explorer: {
      heroTitle: '🏸 RallyMax Badminton Session Finder',
      heroSubtitle: 'Find players matching your skill level, host transparent sessions, and track attendance',
      searchPlaceholder: '🔍 Search venue, district, session title...',
      allDistricts: 'All areas',
      allSkills: 'All skill levels',
      availableOnly: 'Available spots only',
      reset: 'Reset',
      foundCount: 'Found {count} matching sessions',
      noEvents: 'No sessions found',
      noEventsDesc: 'Try adjusting your search filters or create a new badminton session',
      createNow: 'Create session now',
    },
    card: {
      full: 'Full',
      open: 'Open',
      ended: 'Ended',
      yourEvent: '👑 Your Session',
      approved: '✅ Approved',
      pending: '⏳ Pending',
      slots: '🏸 {count}/{max} slots',
      map: 'Map ↗',
      host: 'Host',
      reliability: 'reliability',
      fee: 'Fee',
      manage: 'Manage',
      viewApplication: 'View Status',
      join: 'Join Game',
      court: 'Court',
    },
    myEvents: {
      title: 'My Sessions',
      subtitle: 'Track your schedule, manage attendees, and take attendance',
      tabHosted: 'Sessions I Host',
      tabJoined: 'Sessions I Joined',
      filterAll: 'All',
      filterPending: 'Pending',
      filterApproved: 'Approved',
      filterCheckedIn: 'Checked In',
      filterCancelled: 'Cancelled / No-show',
      noHosted: "You haven't hosted any sessions yet",
      noHostedDesc: 'Create a session to connect with fellow badminton enthusiasts',
      noJoined: "You haven't registered for any sessions yet",
      noJoinedDesc: 'Explore open sessions and join a game today',
      exploreNow: 'Explore Sessions Now',
    },
    skills: {
      BEGINNER: { label: 'Beginner', desc: 'Basic rallies over the net, learning fundamentals' },
      LOW_INTERMEDIATE: { label: 'Low-Int (Intermediate -)', desc: 'Stable serves and returns, developing attack and defense' },
      INTERMEDIATE: { label: 'Mid-Int (Intermediate)', desc: 'Consistent placement, solid court coverage, good doubles flow' },
      HIGH_INTERMEDIATE: { label: 'High-Int (Intermediate +)', desc: 'Strong offensive smashes, agile net defense, tactical play' },
      ADVANCED: { label: 'Advanced', desc: 'Complete tactical repertoire, great stamina, competition experienced' },
      PRO: { label: 'Semi-Pro / Pro', desc: 'Competitive tournament player or provincial athlete' },
    },
    common: {
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      loading: 'Processing...',
      currency: 'VND',
      onlyHostCanCreate: 'Your account is a Player. Only Hosts or Admins can create badminton sessions.',
    },
  },
};
