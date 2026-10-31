-- ==============================================================================
-- RALLYMAX DATABASE MIGRATION: SECURITY HARDENING & RBAC RLS ENFORCEMENT
-- Date: 2026-10-31
-- Target: public.profiles, public.events, public.event_registrations, auth.users
-- ==============================================================================

-- 1. Fix handle_new_user() trigger: Preserve custom in-app display name on subsequent logins
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

-- Re-attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Prevent Privilege Escalation on public.profiles:
-- Non-ADMIN users must NOT be able to change their own role, reliability_score, or is_verified_host
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Determine role of the user performing the update
    SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

    -- If not an ADMIN, block changes to sensitive/privileged columns
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

-- Update profiles RLS policy to allow user or ADMIN to update
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


-- 3. Enforce HOST / ADMIN role for creating events on public.events
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


-- 4. Lock down event_registrations updates:
-- Players can only cancel their own registration (status = 'CANCELLED').
-- Only the Event Host or an ADMIN can approve, check in, mark no-show, or confirm payments.
CREATE OR REPLACE FUNCTION public.protect_registration_updates()
RETURNS TRIGGER AS $$
DECLARE
    v_event_host_id UUID;
    v_user_role TEXT;
BEGIN
    -- Query the event's host_id
    SELECT host_id INTO v_event_host_id FROM public.events WHERE id = OLD.event_id;
    -- Query the calling user's role
    SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();

    -- Allow event host or ADMIN to update any registration column
    IF v_user_role = 'ADMIN' OR auth.uid() = v_event_host_id THEN
        RETURN NEW;
    END IF;

    -- If the calling user is the registered player
    IF auth.uid() = OLD.player_id THEN
        -- Prevent changing immutable association keys
        IF NEW.event_id <> OLD.event_id OR NEW.player_id <> OLD.player_id THEN
            RAISE EXCEPTION 'Không thể thay đổi mã sự kiện hoặc mã người chơi của đơn đăng ký.';
        END IF;

        -- Players cannot alter payment_status, host_notes, or reviewed_at
        IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
            RAISE EXCEPTION 'Người chơi không có quyền tự xác nhận trạng thái thanh toán (payment_status).';
        END IF;

        IF NEW.host_notes IS DISTINCT FROM OLD.host_notes THEN
            RAISE EXCEPTION 'Người chơi không có quyền chỉnh sửa ghi chú của Host (host_notes).';
        END IF;

        -- Players can ONLY transition status to CANCELLED
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NEW.status <> 'CANCELLED' THEN
                RAISE EXCEPTION 'Người chơi chỉ có thể hủy đăng ký (CANCELLED), không thể tự duyệt đơn hoặc điểm danh.';
            END IF;
            NEW.cancelled_at := NOW();
        END IF;

        -- Players cannot increase or change guest_count once approved/checked-in
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

-- Update event_registrations RLS policy
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
