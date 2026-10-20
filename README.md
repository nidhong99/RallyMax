# 🏸 RallyMax - Nền Tảng Kết Nối & Tổ Chức Kèo Cầu Lông Phong Trào

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astryx UI](https://img.shields.io/badge/Astryx_UI-0.7.0-10B981)](https://astryx.design)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

**RallyMax** là giải pháp số hóa toàn diện dành cho cộng đồng cầu lông phong trào: giúp người chơi (**Player**) dễ dàng tìm kiếm buổi đánh phù hợp theo khu vực/trình độ, hỗ trợ người tổ chức (**Host**) quản lý đơn đăng ký, duyệt thành viên, điểm danh, thu phí sân và theo dõi chuỗi kèo định kỳ; đồng thời cung cấp công cụ quản trị dành cho **Admin**.

---

## ✨ Cập Nhật Mới Nhất (Recent Highlights)

- 🛡️ **Phân quyền Role-Based hoàn toàn qua Database**: Không còn hardcode email; quyền hạn tự động phân định theo `currentUser.role` (`ADMIN`, `HOST`, `PLAYER`) lưu tại Supabase `profiles`.
- 🔁 **Tổ chức Kèo định kỳ (Recurring Events)**: Tự động nhân bản chuỗi kèo theo tuần (`WEEKLY`) hoặc ngày (`DAILY`) lên tới 12 buổi kèm huy hiệu chuỗi và bộ chuyển ngày nhanh.
- 🏸 **Bảo vệ trải nghiệm người chơi (Early UX Guard)**: Ẩn các nút tạo/sao chép kèo đối với tài khoản `PLAYER` và cảnh báo ngay tại bước mở modal để tránh lãng phí thời gian điền form.

👉 *Xem chi tiết toàn bộ lịch sử thay đổi tại [CHANGELOG.md](CHANGELOG.md).*

---

## 📑 MỤC LỤC
1. [⚡ Bắt đầu nhanh (Quickstart cho Developer)](#-bắt-đầu-nhanh-quickstart-cho-developer)
2. [📁 Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
3. [🗄️ Hướng dẫn thiết lập Supabase Database & Auth](#️-hướng-dẫn-thiết-lập-supabase-database--auth)
   - [Bước 1: Tạo dự án Supabase](#bước-1-tạo-dự-án-supabase)
   - [Bước 2: Cấu hình OAuth (Google & Facebook)](#bước-2-cấu-hình-oauth-google--facebook)
   - [Bước 3: Chạy SQL DDL Schema (Chuẩn BCNF + RBAC + Kèo định kỳ)](#bước-3-chạy-sql-ddl-schema-chuẩn-bcnf--rbac--kèo-định-kỳ)
   - [Bước 4: Cấu hình Trigger tự động đồng bộ Profile](#bước-4-cấu-hình-trigger-tự-động-đồng-bộ-profile)
   - [Bước 5: Cấu hình Storage Bucket (Avatar & Event Covers)](#bước-5-cấu-hình-storage-bucket-avatar--event-covers)
   - [Bước 6: Cấu hình biến môi trường (.env)](#bước-6-cấu-hình-biến-môi-trường-env)
   - [Bước 7: Import danh mục sân đấu mẫu](#bước-7-import-danh-mục-sân-đấu-mẫu)
4. [🛡️ Kiến trúc phân quyền & bảo mật (RBAC & RLS)](#️-kiến-trúc-phân-quyền--bảo-mật-rbac--rls)
   - [Mô hình quyền hạn](#mô-hình-quyền-hạn)
   - [Ma trận phân quyền (Permission Matrix)](#ma-trận-phân-quyền-permission-matrix)
   - [Chính sách Row Level Security (RLS)](#chính-sách-row-level-security-rls)
   - [Kiểm soát quyền trên Frontend](#kiểm-soát-quyền-trên-frontend)
   - [Cơ chế Chống bùng kèo & Điểm uy tín](#cơ-chế-chống-bùng-kèo--điểm-uy-tín)
5. [🎨 Tiêu chuẩn thiết kế & Quy ước code (Astryx UI)](#-tiêu-chuẩn-thiết-kế--quy-ước-code-astryx-ui)
6. [📚 Tài liệu liên quan & Lịch sử thay đổi](#-tài-liệu-liên-quan--lịch-sử-thay-đổi)

---

## ⚡ Bắt Đầu Nhanh (Quickstart cho Developer)

### 1. Yêu cầu môi trường
- **Node.js**: $\ge 18.x$
- **Package Manager**: **`pnpm`** $\ge 9.x$ *(Bắt buộc dùng `pnpm` theo cấu hình workspace)*

### 2. Cài đặt và khởi chạy

```bash
# 1. Clone repository
git clone https://github.com/nidhong99/RallyMax.git
cd RallyMax

# 2. Cài đặt các gói phụ thuộc
pnpm install

# 3. Tạo file biến môi trường từ template
cp .env.example .env

# 4. Cập nhật thông tin Supabase vào .env (xem mục Thiết lập Supabase bên dưới)
# VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# 5. Khởi chạy ứng dụng ở chế độ phát triển
pnpm dev
```
Ứng dụng sẽ khả dụng tại: `http://localhost:5173`

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
RallyMax/
├── .env.example             # Template biến môi trường Supabase
├── AGENTS.md                # Hướng dẫn quy tắc code cho AI / Astryx UI CLI
├── CHANGELOG.md             # Lịch sử cập nhật tính năng
├── README.md                # Tài liệu onboarding tổng hợp (Tệp hiện tại)
├── package.json             # Cấu hình scripts & dependencies
├── pnpm-workspace.yaml      # Cấu hình build dependencies Astryx
├── scripts/
│   └── import_venues.cjs    # Script import dữ liệu sân hàng loạt vào Supabase
├── supabase/
│   └── migrations/          # Các tệp SQL migration
└── src/
    ├── App.tsx              # Component gốc, tab routing & state tổng thể
    ├── main.tsx             # Entry point (nạp CSS Astryx core & reset)
    ├── components/          # Giao diện thành phần (Design System Astryx)
    │   ├── Navigation.tsx   # Top navbar, switch role & profile menu
    │   ├── EventCard.tsx    # Card hiển thị kèo, badges trạng thái
    │   ├── EventExplorer.tsx# Bộ lọc & danh sách tìm kèo
    │   ├── CreateEventModal.tsx # Modal tạo kèo đơn / lặp lại định kỳ
    │   ├── EventDetailModal.tsx # Chi tiết buổi chơi, duyệt thành viên, QR thanh toán
    │   ├── MyEventsView.tsx # Quản lý kèo tôi tham gia & kèo tôi tổ chức
    │   ├── AdminDashboardView.tsx # Dashboard quản trị Sân & Người dùng
    │   └── ...
    ├── context/
    │   └── AppContext.tsx   # Quản lý phiên đăng nhập, vai trò active, guards
    ├── constants/
    │   └── locations.ts     # Danh mục tỉnh thành / quận huyện Việt Nam
    ├── i18n/                # Hệ thống đa ngôn ngữ (Tiếng Việt & English)
    ├── lib/
    │   └── supabase.ts      # Supabase Client SDK instance
    └── types/
        └── database.ts      # Khai báo TypeScript types chuẩn cho DB
```

---

## 🗄️ Hướng Dẫn Thiết Lập Supabase Database & Auth

### Bước 1: Tạo dự án Supabase
1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập bằng GitHub.
2. Nhấn **"New project"**, chọn Organization.
3. Nhập tên dự án: `RallyMax`.
4. Đặt mật khẩu database an toàn và lưu lại.
5. **Region**: Khuyên chọn `Singapore (ap-southeast-1)` để có độ trễ thấp nhất về Việt Nam.
6. Chọn gói `Free plan` > Nhấn **"Create new project"** (chờ 1-2 phút để khởi tạo).

---

### Bước 2: Cấu hình OAuth (Google & Facebook)

#### 2.1 Google OAuth
1. Vào [Google Cloud Console](https://console.cloud.google.com/) > Tạo Project mới (ví dụ: `RallyMax Badminton`).
2. Vào **APIs & Services** > **OAuth consent screen** > Chọn **External** > Điền thông tin App.
3. Vào **Credentials** > **+ CREATE CREDENTIALS** > **OAuth client ID** > Loại **Web application**.
4. Tại **Authorized redirect URIs**, thêm callback từ Supabase:
   ```text
   https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
5. Lưu lại **Client ID** và **Client Secret**.
6. Tại **Supabase Dashboard** > **Authentication** > **Providers** > Bật **Google** > Dán Client ID & Secret > Nhấn **Save**.

#### 2.2 Cấu hình URL Redirect trên Supabase
1. Tại Supabase Dashboard, vào **Authentication** > **URL Configuration**.
2. **Site URL**: `http://localhost:5173`
3. **Redirect URLs**: Thêm các URL được phép callback:
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
   - Domain production sau này (ví dụ: `https://rallymax.vn/**`).

---

### Bước 3: Chạy SQL DDL Schema (Chuẩn BCNF + RBAC + Kèo định kỳ)

Mở **Supabase Dashboard** > **SQL Editor** (`>_`) > **+ New query**, dán và chạy đoạn SQL sau:

```sql
-- =================================================================
-- RALLYMAX MASTER DATABASE SCHEMA
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
```

---

### Bước 4: Cấu hình Trigger tự động đồng bộ Profile

Chạy script sau trong SQL Editor để tự động tạo profile khi người dùng đăng nhập lần đầu qua Google/Facebook OAuth:

```sql
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
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Bước 5: Cấu hình Storage Bucket (Avatar & Event Covers)

1. Vào menu **Storage** trên Supabase Dashboard > Nhấn **"New bucket"**:
   - Bucket 1: `avatars` (Bật **Public bucket** = ON).
   - Bucket 2: `event-covers` (Bật **Public bucket** = ON).
2. Chạy SQL cấp quyền upload trong SQL Editor:

```sql
-- Cho phép đọc công khai
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id IN ('avatars', 'event-covers'));

-- Cho phép upload khi đã đăng nhập
CREATE POLICY "Authenticated users can upload avatar" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload event covers" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'event-covers' AND auth.role() = 'authenticated');
```

---

### Bước 6: Cấu hình biến môi trường (.env)

Lấy thông tin từ **Project Settings** > **API**:
- **Project URL**
- **Project API Keys**: Copy khóa **`anon` / `public`**

Tạo file `.env` tại thư mục gốc dự án:
```env
VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

### Bước 7: Import danh mục Sân đấu mẫu

Hệ thống cung cấp sẵn script tự động nạp dữ liệu sân đấu chuẩn vào Supabase:

```bash
# Quét và import toàn bộ danh mục sân các quận tại Hà Nội / TP.HCM
node scripts/import_venues.cjs all
```

---

## 🛡️ Kiến Trúc Phân Quyền & Bảo Mật (RBAC & RLS)

### Mô hình quyền hạn
RallyMax áp dụng mô hình phân quyền **Contextual Role & Hybrid Verification**:
- **PLAYER (Mặc định)**: Tìm kiếm kèo, đăng ký slot, chat, quản lý đơn của mình.
- **HOST (Chủ xị)**: Được kích hoạt khi hồ sơ có SĐT và điểm uy tín $\ge 80\%$. Có quyền tạo kèo, duyệt/từ chối người chơi, điểm danh, xác nhận chuyển khoản.
- **ADMIN**: Ban quản trị có toàn quyền quản lý sân bãi, duyệt danh mục, và quản lý người dùng.

```mermaid
graph TD
    User([Người dùng đăng nhập OAuth]) --> PlayerRole[Vai trò Player mặc định]
    PlayerRole -->|Tìm kèo & Đăng ký slot| JoinEvent[Tham gia sự kiện]
    PlayerRole -->|Cập nhật SĐT + Điểm uy tín >= 80%| HostCapability[Kích hoạt năng lực Host]
    HostCapability -->|Tạo sự kiện & Thuê sân| CreateEvent[Tổ chức sự kiện]
    CreateEvent --> HostRole[Host của Sự kiện cụ thể này]
    HostRole -->|Quyền quản trị buổi đấu| ManageEvent[Duyệt đơn / Điểm danh / Thu phí]
```

---

### Ma Trận Phân Quyền (Permission Matrix)

| Thực thể / Tính năng | Player (Người chơi) | Host (Chủ xị của Event) | Admin (Quản trị viên) | Khách vãng lai |
| :--- | :--- | :--- | :--- | :--- |
| **Hồ sơ cá nhân (Profiles)** | Xem tất cả, chỉ sửa của mình | Xem tất cả, chỉ sửa của mình | Xem và quản trị tất cả | Chỉ xem thông tin công khai |
| **Khám phá kèo (Events)** | Xem tất cả kèo mở | Xem tất cả các kèo | Toàn quyền kiểm duyệt | Xem danh sách công khai |
| **Tạo kèo mới (Create Event)** | Bị chặn (chuyển hướng kích hoạt Host) | **Có quyền** | **Có quyền** | Không |
| **Sửa / Hủy kèo** | Không | **Chỉ Host tạo kèo đó** | Có quyền can thiệp | Không |
| **Đăng ký tham gia** | **Đăng ký slot, vào waitlist** | Không tự đăng ký kèo của mình | Có thể đăng ký | Cần đăng nhập |
| **Duyệt / Từ chối đơn** | Không | **Có toàn quyền trên kèo của mình** | Có quyền | Không |
| **Điểm danh ("Có mặt" / "Báo bùng")** | Không | **Có toàn quyền** | Có quyền | Không |
| **Xác nhận thanh toán** | Báo "Đã chuyển khoản" | **Xác nhận "Đã thu"** | Xem trạng thái | Không |
| **Quản trị Sân đấu (Venues)** | Xem danh sách sân | Xem danh sách sân | Thêm / Sửa / Đồng bộ sân | Xem danh mục |

---

### Chính Sách Row Level Security (RLS)

Chạy script sau trong Supabase SQL Editor để kích hoạt bảo vệ dữ liệu ở tầng PostgreSQL:

```sql
-- 1. Bật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Events Policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (status != 'DRAFT' OR host_id = auth.uid());

DROP POLICY IF EXISTS "Hosts can create events" ON public.events;
CREATE POLICY "Hosts can create events" ON public.events FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = host_id
);

DROP POLICY IF EXISTS "Host can update their own event" ON public.events;
CREATE POLICY "Host can update their own event" ON public.events FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Host can delete their own event" ON public.events;
CREATE POLICY "Host can delete their own event" ON public.events FOR DELETE USING (auth.uid() = host_id);

-- 4. Event Registrations Policies
DROP POLICY IF EXISTS "View registrations policy" ON public.event_registrations;
CREATE POLICY "View registrations policy" ON public.event_registrations FOR SELECT USING (
    player_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_registrations.event_id AND e.host_id = auth.uid())
);

DROP POLICY IF EXISTS "Player can register for event" ON public.event_registrations;
CREATE POLICY "Player can register for event" ON public.event_registrations FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    player_id = auth.uid() AND
    NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid())
);

DROP POLICY IF EXISTS "Update registrations policy" ON public.event_registrations;
CREATE POLICY "Update registrations policy" ON public.event_registrations FOR UPDATE USING (
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_registrations.event_id AND e.host_id = auth.uid())
);
```

---

### Kiểm Soát Quyền Trên Frontend

Frontend kiểm soát quyền hạn theo thời gian thực dựa trên trạng thái `currentUser.role` từ Supabase Database:
- **`src/context/AppContext.tsx`**: Cung cấp các helper methods `canCreateEvent()`, `isHostOfEvent()`, `isCurrentUserAdmin`.
- **`src/components/Navigation.tsx`**: Ẩn nút "+ Tạo kèo" đối với tài khoản `PLAYER`; chỉ hiện bảng điều khiển Admin đối với `ADMIN`.
- **`src/components/CreateEventModal.tsx`**: Chặn sớm (Early Guard) bằng thông báo cảnh báo và ẩn form nếu tài khoản là `PLAYER`.
- **`src/components/EventDetailModal.tsx`**: Phân chia giao diện rạch ròi: Host xem nút Duyệt/Hủy/Điểm danh; Player xem nút Đăng ký/Rút lui.

---

### Cơ Chế Chống Bùng Kèo & Điểm Uy Tín

1. **Điểm uy tín mặc định**: Mọi tài khoản khởi tạo với **100%**.
2. **Xử phạt bùng kèo (`NO_SHOW`)**:
   - Khi Host đánh dấu Player là `NO_SHOW`, hệ thống tự động trừ $5\%$ điểm uy tín.
   - Khi điểm uy tín $< 70\%$, Player sẽ bị hạn chế quyền đăng ký các kèo duyệt tự động.
3. **Khen thưởng tham gia**: Đánh giá 5 sao từ Host và hoàn thành buổi chơi nâng dần điểm uy tín và huy hiệu thành viên tích cực.

---

## 🎨 Tiêu Chuẩn Thiết Kế & Quy Ước Code (Astryx UI)

Dự án áp dụng hệ thống thiết kế **Astryx UI Design System (v0.7.0)**:
- **Không dùng thẻ `<div>` hoặc `<span>` thô**: Sử dụng các thành phần bố cục chuẩn như `VStack`, `HStack`, `Grid`, `Card`, `Box`, `Section`.
- **Quy tắc Style**: Sử dụng token màu sắc và khoảng cách (`var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`). Không dùng hardcoded hex color hoặc utility class ad-hoc.
- **Đa ngôn ngữ (i18n)**: Tất cả chuỗi hiển thị đều được cấu hình song ngữ tại `src/i18n/translations.ts` với hàm dịch `t('key')`.

---

## 📚 Tài Liệu Liên Quan & Lịch Sử Thay Đổi

- [CHANGELOG.md](CHANGELOG.md): Chi tiết các thay đổi gần đây (RBAC database-driven, recurring events, UX improvements).
- [ROLE_BASED_ACCESS_CONTROL_GUIDE.md](ROLE_BASED_ACCESS_CONTROL_GUIDE.md): Tài liệu chuyên sâu về kiến trúc phân quyền RBAC & RLS.
- [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md): Bản hướng dẫn cài đặt cơ sở dữ liệu Supabase gốc.
- [AGENTS.md](AGENTS.md): Hướng dẫn phát triển và quy tắc tích hợp dành cho AI Agent.
- [supabase/migrations/](supabase/migrations/): Thư mục chứa các bản nâng cấp cấu trúc cơ sở dữ liệu.
