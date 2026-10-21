-- =================================================================
-- RALLYMAX MASTER DATABASE SCHEMA
-- Chuẩn BCNF + Phân quyền RBAC + Hỗ trợ Kèo định kỳ (Recurring Events)
-- =================================================================

-- 1. Bảng Provinces (Tỉnh / Thành phố)
CREATE TABLE IF NOT EXISTS public.provinces (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 2. Bảng Districts (Quận / Huyện)
CREATE TABLE IF NOT EXISTS public.districts (
    code VARCHAR(10) PRIMARY KEY,
    province_code VARCHAR(10) NOT NULL REFERENCES public.provinces(code) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL
);

-- 3. Bảng Profiles (Hồ sơ người dùng kèm Phân quyền RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    birth_year SMALLINT CHECK (birth_year >= 1940 AND birth_year <= 2025),
    
    -- Thuộc tính chuyên môn cầu lông
    skill_level VARCHAR(20) DEFAULT 'BEGINNER' CHECK (
        skill_level IN ('BEGINNER', 'LOW_INTERMEDIATE', 'INTERMEDIATE', 'HIGH_INTERMEDIATE', 'ADVANCED', 'PRO')
    ),
    dominant_hand VARCHAR(10) DEFAULT 'RIGHT' CHECK (dominant_hand IN ('RIGHT', 'LEFT', 'BOTH')),
    play_style VARCHAR(30) DEFAULT 'ALL_ROUND' CHECK (
        play_style IN ('SINGLES', 'DOUBLES_FRONT', 'DOUBLES_BACK', 'ALL_ROUND')
    ),
    bio TEXT,
    district_code VARCHAR(10) REFERENCES public.districts(code) ON DELETE SET NULL,
    
    -- Phân quyền RBAC
    role VARCHAR(20) DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'HOST', 'ADMIN')),
    is_verified_host BOOLEAN DEFAULT FALSE,
    
    -- Chỉ số uy tín
    reliability_score NUMERIC(5,2) DEFAULT 100.00 CHECK (reliability_score >= 0 AND reliability_score <= 100.00),
    total_matches_played INT DEFAULT 0 CHECK (total_matches_played >= 0),
    total_no_shows INT DEFAULT 0 CHECK (total_no_shows >= 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Venues (Danh mục sân cầu lông)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    district_code VARCHAR(10) NOT NULL REFERENCES public.districts(code) ON DELETE RESTRICT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    maps_url TEXT,
    image_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_venue_name_address UNIQUE (name, address)
);

-- 5. Bảng Events (Các buổi đánh cầu do Host tổ chức, hỗ trợ lặp lại định kỳ)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE RESTRICT,
    court_numbers VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
    
    shuttlecock_type VARCHAR(100),
    fee_per_player NUMERIC(12,2) DEFAULT 0 CHECK (fee_per_player >= 0),
    female_fee_per_player NUMERIC(12,2) CHECK (female_fee_per_player >= 0),
    payment_qr_url TEXT,
    payment_note TEXT,
    
    max_players SMALLINT NOT NULL CHECK (max_players > 0),
    min_players SMALLINT DEFAULT 2 CHECK (min_players > 0 AND min_players <= max_players),
    min_skill_level VARCHAR(20) DEFAULT 'BEGINNER',
    max_skill_level VARCHAR(20) DEFAULT 'PRO',
    
    requires_approval BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (
        status IN ('DRAFT', 'OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ),
    cancellation_reason TEXT,
    
    -- Hỗ trợ chuỗi sự kiện định kỳ (Recurring events)
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_frequency VARCHAR(20),
    recurrence_group_id UUID,
    recurrence_index SMALLINT,
    recurrence_count SMALLINT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_recurrence_group_id ON public.events(recurrence_group_id);

-- 6. Bảng Event Registrations (Đăng ký tham gia)
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guest_count SMALLINT DEFAULT 0 CHECK (guest_count >= 0),
    
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'WAITLIST', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW')
    ),
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (
        payment_status IN ('UNPAID', 'PENDING_CONFIRMATION', 'PAID', 'REFUNDED')
    ),
    
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    host_notes TEXT,
    
    CONSTRAINT uq_event_player UNIQUE (event_id, player_id)
);

-- 7. Bảng Reviews (Đánh giá 2 chiều: Host <-> Player)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('HOST_TO_PLAYER', 'PLAYER_TO_HOST')),
    
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    skill_accuracy_rating SMALLINT CHECK (skill_accuracy_rating >= 1 AND skill_accuracy_rating <= 5),
    punctuality_rating SMALLINT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    comment TEXT,
    is_no_show BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_event_reviewer_reviewee UNIQUE (event_id, reviewer_id, reviewee_id),
    CONSTRAINT chk_different_user CHECK (reviewer_id <> reviewee_id)
);

-- 8. Bảng Event Comments (Bình luận & Thảo luận)
CREATE TABLE IF NOT EXISTS public.event_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.event_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bảng Notifications (Thông báo)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dữ liệu hạt giống cơ bản cho Tỉnh / Thành phố
INSERT INTO public.provinces (code, name) VALUES 
('HN', 'Hà Nội'),
('HCM', 'Hồ Chí Minh'),
('DN', 'Đà Nẵng')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.districts (code, province_code, name) VALUES
('HN_CG', 'HN', 'Quận Cầu Giấy'),
('HN_TX', 'HN', 'Quận Thanh Xuân'),
('HN_BD', 'HN', 'Quận Ba Đình'),
('HCM_Q1', 'HCM', 'Quận 1'),
('HCM_TB', 'HCM', 'Quận Tân Bình'),
('HCM_BTH', 'HCM', 'Quận Bình Thạnh'),
('DN_HC', 'DN', 'Quận Hải Châu')
ON CONFLICT (code) DO NOTHING;
