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


-- =================================================================
-- 10. TRIGGERS & BUSINESS LOGIC GUARDS
-- =================================================================

-- 10.1. Tự động đồng bộ Profile khi người dùng xác thực qua auth.users (Google/Facebook OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    raw_avatar TEXT;
    raw_phone TEXT;
BEGIN
    raw_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    raw_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );
    raw_phone := NEW.raw_user_meta_data->>'phone';

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        phone_number,
        gender,
        skill_level,
        role,
        is_verified_host,
        reliability_score
    ) VALUES (
        NEW.id,
        NEW.email,
        raw_name,
        raw_avatar,
        raw_phone,
        'OTHER',
        'BEGINNER',
        'PLAYER',
        FALSE,
        100.00
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10.2. Chống leo thang đặc quyền (Privilege Escalation) trên bảng profiles
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

    IF current_user_role IS DISTINCT FROM 'ADMIN' THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Chỉ Quản trị viên (ADMIN) mới có quyền thay đổi vai trò tài khoản (role).';
        END IF;

        IF NEW.is_verified_host IS DISTINCT FROM OLD.is_verified_host THEN
            RAISE EXCEPTION 'Chỉ Quản trị viên (ADMIN) mới có quyền xác minh Host (is_verified_host).';
        END IF;

        IF NEW.reliability_score IS DISTINCT FROM OLD.reliability_score THEN
            RAISE EXCEPTION 'Không được phép tự ý thay đổi điểm uy tín (reliability_score).';
        END IF;

        IF NEW.total_no_shows IS DISTINCT FROM OLD.total_no_shows THEN
            RAISE EXCEPTION 'Không được phép tự ý thay đổi số trận vắng mặt (total_no_shows).';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_fields();

-- 10.3. Kiểm soát quyền cập nhật đơn đăng ký event_registrations
CREATE OR REPLACE FUNCTION public.protect_registration_updates()
RETURNS TRIGGER AS $$
DECLARE
    v_event_host_id UUID;
    v_user_role TEXT;
BEGIN
    SELECT host_id INTO v_event_host_id FROM public.events WHERE id = OLD.event_id;
    SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();

    -- Host hoặc ADMIN có toàn quyền duyệt, điểm danh, thu tiền
    IF v_user_role = 'ADMIN' OR auth.uid() = v_event_host_id THEN
        RETURN NEW;
    END IF;

    -- Người chơi (Player) chỉ được hủy đăng ký của chính mình
    IF auth.uid() = OLD.player_id THEN
        IF NEW.event_id <> OLD.event_id OR NEW.player_id <> OLD.player_id THEN
            RAISE EXCEPTION 'Không thể thay đổi mã sự kiện hoặc mã người chơi của đơn đăng ký.';
        END IF;

        IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
            RAISE EXCEPTION 'Người chơi không có quyền tự xác nhận trạng thái thanh toán (payment_status).';
        END IF;

        IF NEW.host_notes IS DISTINCT FROM OLD.host_notes THEN
            RAISE EXCEPTION 'Người chơi không có quyền chỉnh sửa ghi chú của Host (host_notes).';
        END IF;

        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NEW.status <> 'CANCELLED' THEN
                RAISE EXCEPTION 'Người chơi chỉ có thể hủy đăng ký (CANCELLED), không thể tự duyệt đơn hoặc điểm danh.';
            END IF;
            NEW.cancelled_at := NOW();
        END IF;

        IF NEW.guest_count IS DISTINCT FROM OLD.guest_count AND OLD.status IN ('APPROVED', 'CHECKED_IN') THEN
            RAISE EXCEPTION 'Không thể thay đổi số lượng khách đi kèm sau khi đơn đã được duyệt.';
        END IF;

        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Bạn không có quyền cập nhật đơn đăng ký này.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_registration_updates ON public.event_registrations;
CREATE TRIGGER trg_protect_registration_updates
    BEFORE UPDATE ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_registration_updates();

-- =================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- 11.1. Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
    )
    WITH CHECK (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
    );

-- 11.2. Events
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT USING (status != 'DRAFT' OR host_id = auth.uid());

DROP POLICY IF EXISTS "Hosts can create events" ON public.events;
CREATE POLICY "Hosts can create events" ON public.events
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = host_id AND
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('HOST', 'ADMIN')
        )
    );

DROP POLICY IF EXISTS "Host can update their own event" ON public.events;
CREATE POLICY "Host can update their own event" ON public.events
    FOR UPDATE USING (auth.uid() = host_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

DROP POLICY IF EXISTS "Host can delete their own event" ON public.events;
CREATE POLICY "Host can delete their own event" ON public.events
    FOR DELETE USING (auth.uid() = host_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

-- 11.3. Event Registrations
DROP POLICY IF EXISTS "View registrations policy" ON public.event_registrations;
CREATE POLICY "View registrations policy" ON public.event_registrations
    FOR SELECT USING (
        player_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_registrations.event_id AND e.host_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Player can register for event" ON public.event_registrations;
CREATE POLICY "Player can register for event" ON public.event_registrations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        player_id = auth.uid() AND
        NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid())
    );

DROP POLICY IF EXISTS "Update registrations policy" ON public.event_registrations;
CREATE POLICY "Update registrations policy" ON public.event_registrations
    FOR UPDATE
    USING (
        player_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_registrations.event_id AND (
                e.host_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
            )
        )
    )
    WITH CHECK (
        player_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_registrations.event_id AND (
                e.host_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
            )
        )
    );

-- 11.4. Reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Participants can create reviews" ON public.reviews;
CREATE POLICY "Participants can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        reviewer_id = auth.uid()
    );

-- 11.5. Venues
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;
CREATE POLICY "Venues are viewable by everyone" ON public.venues
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create venues" ON public.venues;
CREATE POLICY "Authenticated users can create venues" ON public.venues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
