export type SkillLevel =
  | 'BEGINNER'
  | 'LOW_INTERMEDIATE'
  | 'INTERMEDIATE'
  | 'HIGH_INTERMEDIATE'
  | 'ADVANCED'
  | 'PRO';

export const SKILL_LEVEL_ORDER: SkillLevel[] = [
  'BEGINNER',
  'LOW_INTERMEDIATE',
  'INTERMEDIATE',
  'HIGH_INTERMEDIATE',
  'ADVANCED',
  'PRO',
];

export const SKILL_LABELS: Record<SkillLevel, { label: string; desc: string; badgeVariant: 'neutral' | 'teal' | 'blue' | 'green' | 'orange' | 'purple' }> = {
  BEGINNER: { label: 'Yếu / Mới chơi', desc: 'Mới tập chơi, đánh cầu qua lưới cơ bản', badgeVariant: 'neutral' },
  LOW_INTERMEDIATE: { label: 'TB- (Trung bình yếu)', desc: 'Phát cầu ổn, biết qua lại, chưa mạnh đập/thủ', badgeVariant: 'teal' },
  INTERMEDIATE: { label: 'TB (Trung bình)', desc: 'Biết bao sân cơ bản, điều cầu ổn định, đánh đôi khá', badgeVariant: 'blue' },
  HIGH_INTERMEDIATE: { label: 'TB+ (Trung bình khá)', desc: 'Tấn công tốt, đập cầu uy lực, thủ lưới linh hoạt', badgeVariant: 'green' },
  ADVANCED: { label: 'Khá', desc: 'Kỹ chiến thuật toàn diện, thể lực sung mãn, kinh nghiệm dày dặn', badgeVariant: 'orange' },
  PRO: { label: 'Bán chuyên / Chuyên nghiệp', desc: 'Vận động viên hoặc cựu VĐV năng khiếu', badgeVariant: 'purple' },
};

export type DominantHand = 'RIGHT' | 'LEFT' | 'BOTH';

export type PlayStyle = 'SINGLES' | 'DOUBLES_FRONT' | 'DOUBLES_BACK' | 'ALL_ROUND';

export const PLAY_STYLE_LABELS: Record<PlayStyle, string> = {
  SINGLES: 'Chuyên Đơn',
  DOUBLES_FRONT: 'Đánh Lưới / Phản Tạt (Trước)',
  DOUBLES_BACK: 'Công Đập Cầu Sau (Sau)',
  ALL_ROUND: 'Công Thủ Toàn Diện',
};

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  province_code: string;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birth_year?: number;
  skill_level: SkillLevel;
  dominant_hand: DominantHand;
  play_style: PlayStyle;
  bio?: string;
  district_code?: string;
  role?: 'HOST' | 'PLAYER' | 'ADMIN';
  is_verified_host?: boolean;
  reliability_score: number; // 0 - 100%
  total_matches_played: number;
  total_no_shows: number;
  created_at?: string;
  updated_at?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  district_code: string;
  latitude?: number;
  longitude?: number;
  total_courts: number;
  contact_phone?: string;
  maps_url?: string;
  price_range?: string;
  created_by?: string;
  created_at?: string;
}

export type EventStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Event {
  id: string;
  host_id: string;
  venue_id?: string;
  venue_name?: string;
  location_url?: string;
  court_numbers?: string;
  cover_image_url?: string;
  cover_image_position?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  shuttlecock_type?: string;
  fee_per_player: number;
  female_fee_per_player?: number;
  payment_qr_url?: string;
  payment_note?: string;
  max_players: number;
  min_players: number;
  min_skill_level: SkillLevel;
  max_skill_level: SkillLevel;
  requires_approval: boolean;
  status: EventStatus;
  cancellation_reason?: string;
  created_at: string;
  updated_at?: string;
  
  // Joined fields
  venue?: Venue;
  host?: Profile;
  registrations?: EventRegistration[];
}

export type RegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLIST'
  | 'CANCELLED'
  | 'CHECKED_IN'
  | 'NO_SHOW';

export type PaymentStatus = 'UNPAID' | 'PENDING_CONFIRMATION' | 'PAID' | 'REFUNDED';

export interface EventRegistration {
  id: string;
  event_id: string;
  player_id: string;
  guest_count: number;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  registered_at: string;
  reviewed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  host_notes?: string;

  // Joined fields
  player?: Profile;
}

export interface Review {
  id: string;
  event_id: string;
  reviewer_id: string;
  reviewee_id: string;
  review_type: 'HOST_TO_PLAYER' | 'PLAYER_TO_HOST';
  rating: number; // 1 - 5
  skill_accuracy_rating?: number;
  punctuality_rating?: number;
  comment?: string;
  is_no_show: boolean;
  created_at: string;
  reviewer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  event_id?: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
