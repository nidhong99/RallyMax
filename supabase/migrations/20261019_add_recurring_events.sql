-- ==============================================================================
-- RALLYMAX DATABASE MIGRATION: ADD RECURRING EVENT SUPPORT
-- Date: 2026-10-19
-- Target Table: public.events
-- ==============================================================================

-- 1. Thêm các cột metadata hỗ trợ kèo định kỳ / lặp lại
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_frequency VARCHAR(20),
  ADD COLUMN IF NOT EXISTS recurrence_group_id UUID,
  ADD COLUMN IF NOT EXISTS recurrence_index SMALLINT,
  ADD COLUMN IF NOT EXISTS recurrence_count SMALLINT;

-- 2. Đánh index để truy vấn nhanh danh sách các buổi trong cùng chuỗi định kỳ
CREATE INDEX IF NOT EXISTS idx_events_recurrence_group_id ON public.events(recurrence_group_id);

-- 3. Cập nhật comment giải thích ý nghĩa các cột
COMMENT ON COLUMN public.events.is_recurring IS 'Đánh dấu sự kiện có thuộc chuỗi lặp lại / định kỳ hay không';
COMMENT ON COLUMN public.events.recurrence_frequency IS 'Tần suất lặp: WEEKLY (Hàng tuần) hoặc DAILY (Hàng ngày)';
COMMENT ON COLUMN public.events.recurrence_group_id IS 'Mã UUID chung kết nối tất cả các buổi thi đấu trong cùng một đợt tạo định kỳ';
COMMENT ON COLUMN public.events.recurrence_index IS 'Thứ tự buổi hiện tại trong chuỗi (ví dụ: buổi 1, 2, ...)';
COMMENT ON COLUMN public.events.recurrence_count IS 'Tổng số buổi thi đấu dự kiến trong chuỗi định kỳ (ví dụ: 4 buổi)';
