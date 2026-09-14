# HƯỚNG DẪN THIẾT LẬP SUPABASE CHO DỰ ÁN RALLYMAX

Tài liệu này hướng dẫn chi tiết từng bước (step-by-step) để bạn thiết lập dự án Supabase hoàn chỉnh phục vụ cho nền tảng kết nối cầu lông **RallyMax**.

---

## MỤC LỤC
1. [Bước 1: Tạo dự án Supabase mới](#bước-1-tạo-dự-án-supabase-mới)
2. [Bước 2: Cấu hình Authentication (Google & Facebook)](#bước-2-cấu-hình-authentication-google--facebook)
   - [2.1 Cấu hình Google OAuth](#21-cấu-hình-google-oauth)
   - [2.2 Cấu hình Facebook Login](#22-cấu-hình-facebook-login)
   - [2.3 Cấu hình URL Redirect trên Supabase](#23-cấu-hình-url-redirect-trên-supabase)
3. [Bước 3: Chạy SQL DDL Schema (Chuẩn BCNF)](#bước-3-chạy-sql-ddl-schema-chuẩn-bcnf)
4. [Bước 4: Cấu hình Trigger tự động đồng bộ Profile](#bước-4-cấu-hình-trigger-tự-động-đồng-bộ-profile)
5. [Bước 5: Cấu hình Storage Bucket (Avatar & Event Covers)](#bước-5-cấu-hình-storage-bucket-avatar--event-covers)
6. [Bước 6: Lấy API Keys và cấu hình biến môi trường (.env)](#bước-6-lấy-api-keys-và-cấu-hình-biến-môi-trường-env)

---

## BƯỚC 1: TẠO DỰ ÁN SUPABASE MỚI

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập (hoặc đăng ký bằng GitHub).
2. Tại trang Dashboard, nhấn nút **"New project"**.
3. Chọn Organization của bạn.
4. Điền các thông tin dự án:
   - **Name**: `rallymax` (hoặc tên bạn muốn)
   - **Database Password**: Nhập mật khẩu mạnh (hãy lưu lại mật khẩu này ở nơi an toàn).
   - **Region**: Chọn vùng gần Việt Nam nhất để tối ưu tốc độ kết nối:
     - Khuyên dùng: `Singapore (ap-southeast-1)`.
   - **Pricing Plan**: Chọn `Free plan`.
5. Nhấn **"Create new project"** và đợi khoảng 1 - 2 phút để hệ thống khởi tạo Database.

---

## BƯỚC 2: CẤU HÌNH AUTHENTICATION (GOOGLE & FACEBOOK)

### 2.1 Cấu hình Google OAuth

#### Bước 2.1.1: Tạo OAuth Client trên Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới (ví dụ: `RallyMax Badminton`).
3. Vào menu **APIs & Services** > **OAuth consent screen**:
   - Chọn User Type: **External** > Nhấn **Create**.
   - Điền **App name** (`RallyMax`), **User support email**, và **Developer contact email**.
   - Nhấn **Save and Continue** qua các bước Scopes (để mặc định: `email`, `profile`, `openid`).
4. Vào menu **APIs & Services** > **Credentials**:
   - Nhấn **+ CREATE CREDENTIALS** > Chọn **OAuth client ID**.
   - Application type: Chọn **Web application**.
   - Name: `RallyMax Web Client`.
   - Tại mục **Authorized redirect URIs**, nhấn **+ ADD URI** và điền URL Callback từ Supabase:
     ```
     https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
     *(Lấy `<YOUR_SUPABASE_PROJECT_REF>` từ thanh địa chỉ Supabase của bạn hoặc trong Supabase Dashboard > Project Settings > General).*
   - Nhấn **Create**.
   - Hộp thoại hiện ra: Copy lại **Client ID** và **Client Secret**.

#### Bước 2.1.2: Bật Google Provider trên Supabase
1. Trên Supabase Dashboard, vào **Authentication** (biểu tượng chìa khóa ở menu trái) > **Providers**.
2. Tìm **Google**, gạt nút toggle sang **Enabled**.
3. Dán **Client ID** và **Client Secret** vừa lấy từ Google Console vào.
4. Nhấn **Save**.

---

### 2.2 Cấu hình Facebook Login

#### Bước 2.2.1: Tạo App trên Meta for Developers
1. Truy cập [Meta for Developers](https://developers.facebook.com/) và đăng nhập tài khoản Facebook.
2. Nhấn **My Apps** > **Create App**.
3. Chọn Use Case: **Authenticate and request data from users with Facebook Login** > Nhấn **Next**.
4. Chọn app type hoặc điền **App Name** (`RallyMax`), nhập email liên hệ > Nhấn **Create app**.
5. Trong Dashboard của App:
   - Tìm mục **Facebook Login** > Nhấn **Set up** (hoặc vào **Use cases** > **Authentication and account creation** > **Customize**).
   - Vào **Facebook Login** > **Settings** (Cài đặt):
     - Tại mục **Valid OAuth Redirect URIs**, dán URI Callback từ Supabase:
       ```
       https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
       ```
     - Nhấn **Save Changes**.
6. Vào **App settings** > **Basic**:
   - Copy **App ID**.
   - Nhấn **Show** tại **App Secret** rồi copy mã bí mật này.

#### Bước 2.2.2: Bật Facebook Provider trên Supabase
1. Trên Supabase Dashboard > **Authentication** > **Providers**.
2. Tìm **Facebook**, gạt nút toggle sang **Enabled**.
3. Dán **Client ID (App ID)** và **Client Secret (App Secret)** từ Facebook.
4. Nhấn **Save**.

---

### 2.3 Cấu hình URL Redirect trên Supabase
1. Vào **Authentication** > **URL Configuration**.
2. Tại **Site URL**: Nhập URL chạy local của ứng dụng:
   ```
   http://localhost:5173
   ```
   *(Hoặc `http://localhost:3000` nếu bạn dùng Next.js).*
3. Tại **Redirect URLs**, nhấn **Add URL**:
   - Thêm `http://localhost:5173/**`
   - Thêm `http://localhost:3000/**`
   - Thêm domain production sau này (ví dụ `https://rallymax.vn/**`).
4. Nhấn **Save**.

---

## BƯỚC 3: CHẠY SQL DDL SCHEMA (CHUẨN BCNF)

1. Trên menu bên trái của Supabase Dashboard, chọn **SQL Editor** (biểu tượng `>_`).
2. Nhấn **+ New query**.
3. Dán toàn bộ đoạn mã SQL dưới đây vào cửa sổ soạn thảo:

```sql
-- =================================================================
-- RALLYMAX DATABASE SCHEMA (CHUẨN BCNF)
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

-- 3. Bảng Profiles (Hồ sơ người dùng - Host & Player)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    birth_year SMALLINT CHECK (birth_year >= 1940 AND birth_year <= 2025),
    
    -- Thuộc tính chuyên biệt cầu lông
    skill_level VARCHAR(20) DEFAULT 'BEGINNER' CHECK (
        skill_level IN ('BEGINNER', 'LOW_INTERMEDIATE', 'INTERMEDIATE', 'HIGH_INTERMEDIATE', 'ADVANCED', 'PRO')
    ),
    dominant_hand VARCHAR(10) DEFAULT 'RIGHT' CHECK (dominant_hand IN ('RIGHT', 'LEFT', 'BOTH')),
    play_style VARCHAR(30) DEFAULT 'ALL_ROUND' CHECK (
        play_style IN ('SINGLES', 'DOUBLES_FRONT', 'DOUBLES_BACK', 'ALL_ROUND')
    ),
    bio TEXT,
    district_code VARCHAR(10) REFERENCES public.districts(code) ON DELETE SET NULL,
    
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
    total_courts SMALLINT DEFAULT 1 CHECK (total_courts > 0),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_venue_name_address UNIQUE (name, address)
);

-- 5. Bảng Events (Các buổi đánh cầu do Host tổ chức)
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
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Event Registrations (Đăng ký tham gia sự kiện)
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

-- 8. Bảng Event Comments (Bình luận / Hỏi đáp trong buổi chơi)
CREATE TABLE IF NOT EXISTS public.event_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.event_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bảng Notifications (Hệ thống thông báo cho User)
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

-- Dữ liệu mẫu ban đầu cho Tỉnh/Huyện (Hà Nội, TP.HCM, Đà Nẵng)
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
```
4. Nhấn **"RUN"** (hoặc `Cmd + Enter` trên Mac). Kiểm tra thông báo **"Success. No rows returned"**.

---

## BƯỚC 4: CẤU HÌNH TRIGGER TỰ ĐỘNG ĐỒNG BỘ PROFILE

Khi một user đăng nhập lần đầu qua Google hoặc Facebook, Supabase Auth sẽ tạo 1 dòng trong bảng ẩn `auth.users`. Chúng ta cần một Database Trigger để tự động trích xuất Tên, Email, Avatar từ Google/Facebook và tạo bản ghi tương ứng trong `public.profiles`.

1. Vẫn trong **SQL Editor**, nhấn **+ New query**.
2. Dán đoạn mã SQL sau:

```sql
-- Hàm xử lý tạo profile tự động khi user đăng nhập lần đầu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    raw_avatar TEXT;
    raw_phone TEXT;
BEGIN
    -- Lấy thông tin từ raw_user_meta_data của Google / Facebook OAuth
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
        reliability_score
    ) VALUES (
        NEW.id,
        NEW.email,
        raw_name,
        raw_avatar,
        raw_phone,
        'OTHER',
        'BEGINNER',
        100.00
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger gắn vào bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
3. Nhấn **"RUN"**.

---

## BƯỚC 5: CẤU HÌNH STORAGE BUCKET (AVATAR & EVENT COVERS)

1. Trên menu Supabase bên trái, chọn **Storage** (biểu tượng thùng chứa / xô).
2. Nhấn **"New bucket"**:
   - **Name**: `avatars`
   - **Public bucket**: **Bật ON** (để ảnh avatar có thể hiển thị công khai).
   - Nhấn **Save**.
3. Tiếp tục nhấn **"New bucket"** lần 2:
   - **Name**: `event-covers`
   - **Public bucket**: **Bật ON** (để ảnh sân / poster sự kiện hiển thị công khai).
   - Nhấn **Save**.
4. Thiết lập chính sách bảo mật (Storage Policies):
   - Chạy lệnh SQL sau trong **SQL Editor** để cho phép user upload avatar của chính họ:
   ```sql
   -- Chính sách cho phép xem ảnh công khai
   CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'event-covers'));

   -- Cho phép user đã đăng nhập upload file vào bucket avatars
   CREATE POLICY "Authenticated users can upload avatar" ON storage.objects 
   FOR INSERT WITH CHECK (
       bucket_id = 'avatars' AND auth.role() = 'authenticated'
   );

   -- Cho phép user đã đăng nhập upload file vào bucket event-covers
   CREATE POLICY "Authenticated users can upload event covers" ON storage.objects 
   FOR INSERT WITH CHECK (
       bucket_id = 'event-covers' AND auth.role() = 'authenticated'
   );
   ```

---

## BƯỚC 6: LẤY API KEYS VÀ CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)

1. Trên Supabase Dashboard, chọn biểu tượng bánh răng **Project Settings** (ở góc dưới cùng bên trái).
2. Chọn mục **API**.
3. Tìm và sao chép 2 giá trị sau:
   - **Project URL**: Ví dụ `https://abcdefghijk.supabase.co`
   - **Project API keys**: Sao chép khóa **`anon` / `public`** (Lưu ý: KHÔNG dùng `service_role` trên frontend).
4. Tạo file `.env` trong thư mục dự án của bạn:
   ```env
   VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## TỔNG KẾT
Sau khi hoàn thành 6 bước trên, bạn đã có:
1. Dự án Supabase với cơ sở dữ liệu PostgreSQL chuẩn BCNF.
2. Đăng nhập qua Google và Facebook hoàn tất.
3. Cơ chế tự động lấy Tên/Avatar từ Google/Facebook lưu vào `profiles`.
4. Hai Storage Bucket sẵn sàng lưu trữ hình ảnh.
5. Biến môi trường sẵn sàng tích hợp vào giao diện ứng dụng!
