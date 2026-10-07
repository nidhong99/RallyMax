import { Select } from './Select';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Switch } from '@astryxdesign/core/Switch';
import { useApp } from '../context/AppContext';
import { SkillLevel, SKILL_LABELS, SKILL_LEVEL_ORDER } from '../types/database';
import { Image, MapPin, Upload, Trash2, CheckCircle2, Move, Clock, Calendar, Sparkles } from 'lucide-react';

const DEFAULT_COVER_PRESET =
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80';

const DURATION_OPTIONS = [
  { label: '1 giờ', minutes: 60 },
  { label: '1 giờ 30 phút', minutes: 90 },
  { label: '2 giờ', minutes: 120 },
  { label: '2 giờ 30 phút', minutes: 150 },
  { label: '3 giờ', minutes: 180 },
];

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateEndTime(start: string, durationMin: number): string {
  if (!start || !start.includes(':')) return '21:30';
  const [h, m] = start.split(':').map(Number);
  const totalMin = (h || 0) * 60 + (m || 0) + durationMin;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function formatDayOfWeekAndDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[d.getDay()] || '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${dayName} (${day}/${month})`;
}

function getSkillShortLabel(skill: SkillLevel): string {
  switch (skill) {
    case 'BEGINNER': return 'Yếu/Mới';
    case 'LOW_INTERMEDIATE': return 'TB-';
    case 'INTERMEDIATE': return 'TB';
    case 'HIGH_INTERMEDIATE': return 'TB+';
    case 'ADVANCED': return 'Khá';
    case 'PRO': return 'Bán chuyên';
    default: return '';
  }
}

function generateAutoTitle(min: SkillLevel, max: SkillLevel, start: string, end: string, dateStr: string): string {
  const skillPart = min === max ? `Trình ${getSkillShortLabel(min)}` : `Trình ${getSkillShortLabel(min)} - ${getSkillShortLabel(max)}`;
  const timePart = `${start} - ${end}`;
  const datePart = formatDayOfWeekAndDate(dateStr);
  return `Kèo giao lưu ${skillPart} · ${timePart} · ${datePart}`;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createEvent, venues } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSelectingFileRef = useRef(false);
  const resetSelectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Venue & Location states
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [venueName, setVenueName] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [courtNumbers, setCourtNumbers] = useState('Sân 1');

  // Selected venue object (from database)
  const currentVenue = useMemo(() => {
    return venues.find(v => (selectedVenueId && v.id === selectedVenueId) || v.name === venueName);
  }, [venues, selectedVenueId, venueName]);

  // 2. Cover Image states: "default" (from database) vs "custom" (user upload)
  const [coverMode, setCoverMode] = useState<'default' | 'custom'>('default');
  const [customCoverUrl, setCustomCoverUrl] = useState<string>('');
  const [coverPosition, setCoverPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const frameDragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 3. Date & Time states
  const [startDate, setStartDate] = useState(formatLocalDate(new Date()));
  const [startTime, setStartTime] = useState('19:30');
  const [durationMinutes, setDurationMinutes] = useState(120); // 2 hours default
  const endTime = useMemo(() => calculateEndTime(startTime, durationMinutes), [startTime, durationMinutes]);

  // 4. Slots (Slot tối thiểu trước, Slot tối đa sau)
  const [minPlayers, setMinPlayers] = useState('4');
  const [maxPlayers, setMaxPlayers] = useState('8');

  // 5. Skill
  const [minSkill, setMinSkill] = useState<SkillLevel>('LOW_INTERMEDIATE');
  const [maxSkill, setMaxSkill] = useState<SkillLevel>('HIGH_INTERMEDIATE');

  // 6. Host approval toggle
  const [requiresApproval, setRequiresApproval] = useState(true);

  // 7. Title & Description
  const [title, setTitle] = useState('');
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');

  // Quick date options
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }, []);
  const dayAfterStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return formatLocalDate(d);
  }, []);

  // Set default venue from database if available on first open
  useEffect(() => {
    if (venues && venues.length > 0 && !selectedVenueId) {
      const defaultV = venues.find(v => v.name.includes('Quần Ngựa')) || venues[0];
      if (defaultV) {
        setSelectedVenueId(defaultV.id);
        setVenueName(defaultV.name);
        setLocationUrl(defaultV.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultV.name + ' ' + (defaultV.address || ''))}`);
      }
    }
  }, [venues, selectedVenueId]);

  // Update auto-title when inputs change if not manually edited
  useEffect(() => {
    if (!isTitleManuallyEdited) {
      const autoTitle = generateAutoTitle(minSkill, maxSkill, startTime, endTime, startDate);
      setTitle(autoTitle);
    }
  }, [minSkill, maxSkill, startTime, endTime, startDate, isTitleManuallyEdited]);

  const markSelectingFile = () => {
    isSelectingFileRef.current = true;
    if (resetSelectingTimeoutRef.current) {
      clearTimeout(resetSelectingTimeoutRef.current);
      resetSelectingTimeoutRef.current = null;
    }
  };

  const finishSelectingFile = () => {
    if (resetSelectingTimeoutRef.current) {
      clearTimeout(resetSelectingTimeoutRef.current);
    }
    resetSelectingTimeoutRef.current = setTimeout(() => {
      isSelectingFileRef.current = false;
    }, 600);
  };

  const openFilePicker = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    markSelectingFile();
    fileInputRef.current?.click();
  };

  // Intercept Escape key when closing the OS file picker, and listen for window focus
  useEffect(() => {
    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectingFileRef.current) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        finishSelectingFile();
      }
    };

    const handleWindowFocus = () => {
      if (isSelectingFileRef.current) {
        finishSelectingFile();
      }
    };

    const handleFileCancel = () => {
      finishSelectingFile();
    };

    const fileInput = fileInputRef.current;
    if (fileInput) {
      fileInput.addEventListener('cancel', handleFileCancel);
    }

    window.addEventListener('keydown', handleKeyDownCapture, true);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (fileInput) {
        fileInput.removeEventListener('cancel', handleFileCancel);
      }
      window.removeEventListener('keydown', handleKeyDownCapture, true);
      window.removeEventListener('focus', handleWindowFocus);
      if (resetSelectingTimeoutRef.current) {
        clearTimeout(resetSelectingTimeoutRef.current);
      }
    };
  }, []);

  // Handle Cover Image Upload
  const processFile = (file: File) => {
    finishSelectingFile();
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa là 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomCoverUrl(event.target.result as string);
        setCoverPosition({ x: 50, y: 50 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFramePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDraggingFrame(true);
    frameDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: coverPosition.x,
      startY: coverPosition.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleFramePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingFrame || !frameDragStartRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const deltaY = e.clientY - frameDragStartRef.current.clientY;
    const deltaX = e.clientX - frameDragStartRef.current.clientX;

    const newY = Math.min(100, Math.max(0, frameDragStartRef.current.startY - (deltaY / rect.height) * 100));
    const newX = Math.min(100, Math.max(0, frameDragStartRef.current.startX - (deltaX / rect.width) * 100));

    setCoverPosition({
      x: Math.round(newX),
      y: Math.round(newY),
    });
  };

  const handleFramePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingFrame(false);
    frameDragStartRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
      finishSelectingFile();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleMinSkillChange = (newMinSkill: SkillLevel) => {
    setMinSkill(newMinSkill);
    const minIndex = SKILL_LEVEL_ORDER.indexOf(newMinSkill);
    const maxIndex = SKILL_LEVEL_ORDER.indexOf(maxSkill);
    if (maxIndex < minIndex) {
      setMaxSkill(newMinSkill);
    }
  };

  const minSkillIndex = SKILL_LEVEL_ORDER.indexOf(minSkill);
  const allowedMaxSkillLevels = SKILL_LEVEL_ORDER.filter(
    (level) => SKILL_LEVEL_ORDER.indexOf(level) >= minSkillIndex
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề sự kiện');
      return;
    }
    if (!venueName.trim()) {
      alert('Vui lòng nhập tên địa điểm sân');
      return;
    }

    const startIso = `${startDate}T${startTime}:00+07:00`;
    const endIso = `${startDate}T${endTime}:00+07:00`;

    // Determine final cover image
    const finalCoverUrl =
      coverMode === 'custom' && customCoverUrl
        ? customCoverUrl
        : (currentVenue?.image_url || DEFAULT_COVER_PRESET);

    await createEvent({
      venue_id: currentVenue?.id || selectedVenueId || undefined,
      venue_name: venueName,
      location_url: locationUrl,
      court_numbers: courtNumbers,
      cover_image_url: finalCoverUrl,
      cover_image_position: `${coverPosition.x}% ${coverPosition.y}%`,
      start_time: startIso,
      end_time: endIso,
      fee_per_player: 0,
      max_players: Number(maxPlayers) || 8,
      min_players: Number(minPlayers) || 4,
      min_skill_level: minSkill,
      max_skill_level: maxSkill,
      requires_approval: requiresApproval,
      title: title.trim(),
      description: description.trim(),
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (isSelectingFileRef.current) return;
          onClose();
        }
      }}
      purpose="form"
      width={680}
      maxHeight="88dvh"
    >
      <Layout
        height="fill"
        header={
          <DialogHeader
            title="Tổ chức Kèo Cầu Lông mới"
            subtitle="Tạo sự kiện giao lưu, tìm bạn cùng trình độ và quản lý trận cầu"
            hasDivider={true}
            onOpenChange={(open) => {
              if (!open) {
                if (isSelectingFileRef.current) return;
                onClose();
              }
            }}
          />
        }
        content={
          <LayoutContent
            isScrollable={true}
            padding={4}
            style={{
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)',
            }}
          >
            <form id="create-event-form" onSubmit={handleSubmit}>
              <VStack gap={4}>
                {/* 1. Venue & Location via Google Maps */}
                <VStack
                  gap={2}
                  style={{
                    padding: 'var(--spacing-3)',
                    background: 'var(--color-background-surface)',
                    borderRadius: 'var(--radius-container)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <HStack gap={1} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <MapPin size={16} color="var(--color-icon-accent)" />
                      <Text weight="semibold">Địa điểm sân thi đấu *</Text>
                    </HStack>
                    {venues && venues.length > 0 && (
                      <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                        ⚡ Chọn từ database để tự động điền thông tin & ảnh sân
                      </Text>
                    )}
                  </HStack>

                  {/* Quick Select Venue from Database */}
                  {venues && venues.length > 0 && (
                    <VStack gap={1}>
                      <Text type="supporting" weight="medium" style={{ fontSize: '12px' }}>
                        🏟️ Chọn sân có sẵn trong cơ sở dữ liệu:
                      </Text>
                      <Select
                        value={selectedVenueId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedVenueId(val);
                          if (!val) return;
                          const selected = venues.find(v => v.id === val);
                          if (selected) {
                            setVenueName(selected.name);
                            if (selected.maps_url) {
                              setLocationUrl(selected.maps_url);
                            } else {
                              setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + (selected.address || ''))}`);
                            }
                          }
                        }}
                        style={{
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-element)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-background-muted)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        <option value="">-- Chọn nhanh sân trong database (hoặc tự nhập bên dưới) --</option>
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            🏸 {v.name} ({v.district || 'Hà Nội'}) {v.price_range ? `· ${v.price_range}` : ''}
                          </option>
                        ))}
                      </Select>
                    </VStack>
                  )}

                  <HStack gap={2} style={{ width: '100%', flexWrap: 'wrap' }}>
                    <VStack gap={1} style={{ flex: 2, minWidth: '240px' }}>
                      <Text type="supporting" weight="medium">Tên sân / Địa điểm *</Text>
                      <input
                        type="text"
                        required
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="Ví dụ: Sân Cầu Lông Cung Thể Thao Quần Ngựa"
                        style={{
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-element)',
                          border: '1px solid var(--color-border)',
                          width: '100%',
                        }}
                      />
                    </VStack>

                    <VStack gap={1} style={{ flex: 1, minWidth: '120px' }}>
                      <Text type="supporting" weight="medium">Số sân</Text>
                      <input
                        type="text"
                        value={courtNumbers}
                        onChange={(e) => setCourtNumbers(e.target.value)}
                        placeholder="Sân 1, Sân 2"
                        style={{
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-element)',
                          border: '1px solid var(--color-border)',
                          width: '100%',
                        }}
                      />
                    </VStack>
                  </HStack>

                  <VStack gap={1}>
                    <Text type="supporting" weight="medium">Link vị trí Google Maps (URL) *</Text>
                    <input
                      type="url"
                      required
                      value={locationUrl}
                      onChange={(e) => setLocationUrl(e.target.value)}
                      placeholder="Dán link từ Google Maps: https://maps.app.goo.gl/... hoặc https://google.com/maps/..."
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                    <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                      💡 Mở Google Maps, tìm sân, nhấn <b>Chia sẻ</b> và sao chép liên kết dán vào đây để người chơi bấm vào chỉ đường chính xác.
                    </Text>
                  </VStack>
                </VStack>

                {/* 2. Cover Image Section (Directly below Venue section) */}
                <VStack
                  gap={2}
                  style={{
                    padding: 'var(--spacing-3)',
                    background: 'var(--color-background-surface)',
                    borderRadius: 'var(--radius-container)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <HStack gap={1} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <Image size={16} color="var(--color-icon-accent)" />
                      <Text weight="semibold">Ảnh bìa sự kiện</Text>
                    </HStack>
                    <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                      Không bắt buộc tải ảnh
                    </Text>
                  </HStack>

                  {/* Mode Selector: Mặc định vs Tuỳ chọn */}
                  <HStack
                    gap={1}
                    style={{
                      background: 'var(--color-background-muted)',
                      padding: '3px',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCoverMode('default')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-element)',
                        fontSize: '13px',
                        fontWeight: coverMode === 'default' ? 600 : 500,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: coverMode === 'default' ? 'var(--color-background-surface)' : 'transparent',
                        color: coverMode === 'default' ? 'var(--color-foreground)' : 'var(--color-foreground-secondary)',
                        boxShadow: coverMode === 'default' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Mặc định (Từ dữ liệu sân)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverMode('custom')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-element)',
                        fontSize: '13px',
                        fontWeight: coverMode === 'custom' ? 600 : 500,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: coverMode === 'custom' ? 'var(--color-background-surface)' : 'transparent',
                        color: coverMode === 'custom' ? 'var(--color-foreground)' : 'var(--color-foreground-secondary)',
                        boxShadow: coverMode === 'custom' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Tuỳ chọn (Tự tải ảnh)
                    </button>
                  </HStack>

                  {/* Hidden File Input for Custom Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  {coverMode === 'default' ? (
                    /* Default Mode: Uses venue cover image from database or default preset */
                    <VStack
                      gap={0}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '165px',
                        borderRadius: 'var(--radius-container)',
                        overflow: 'hidden',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-background-muted)',
                        boxShadow: 'var(--shadow-low)',
                      }}
                    >
                      <img
                        src={currentVenue?.image_url || DEFAULT_COVER_PRESET}
                        alt="Ảnh sân mặc định"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center center',
                          display: 'block',
                        }}
                      />
                      <HStack
                        gap={1}
                        style={{
                          position: 'absolute',
                          bottom: 'var(--spacing-2)',
                          left: 'var(--spacing-2)',
                          background: 'rgba(0, 0, 0, 0.72)',
                          backdropFilter: 'blur(6px)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-element)',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: '11px', color: '#ffffff', fontWeight: 500 }}>
                          {currentVenue?.image_url
                            ? `🏸 Đang dùng ảnh bìa sân: ${currentVenue.name}`
                            : '🏸 Sân chưa có ảnh bìa - Sử dụng ảnh đại diện mặc định của hệ thống'}
                        </Text>
                      </HStack>
                    </VStack>
                  ) : (
                    /* Custom Mode: User can upload or remove image */
                    customCoverUrl ? (
                      <VStack
                        ref={previewContainerRef}
                        gap={0}
                        onPointerDown={handleFramePointerDown}
                        onPointerMove={handleFramePointerMove}
                        onPointerUp={handleFramePointerUp}
                        onPointerCancel={handleFramePointerUp}
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '175px',
                          borderRadius: 'var(--radius-container)',
                          overflow: 'hidden',
                          border: isDraggingFrame
                            ? '2px solid var(--color-icon-accent)'
                            : '1px solid var(--color-border)',
                          background: 'var(--color-background-muted)',
                          boxShadow: 'var(--shadow-low)',
                          cursor: isDraggingFrame ? 'grabbing' : 'grab',
                          userSelect: 'none',
                          touchAction: 'none',
                        }}
                      >
                        <img
                          src={customCoverUrl}
                          alt="Cover Preview"
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: `${coverPosition.x}% ${coverPosition.y}%`,
                            display: 'block',
                            pointerEvents: 'none',
                            transition: isDraggingFrame ? 'none' : 'object-position 0.15s ease',
                          }}
                        />

                        {/* Top-left Reposition Guide Badge */}
                        <HStack
                          gap={1}
                          style={{
                            position: 'absolute',
                            top: 'var(--spacing-2)',
                            left: 'var(--spacing-2)',
                            background: 'rgba(0, 0, 0, 0.65)',
                            backdropFilter: 'blur(6px)',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-element)',
                            alignItems: 'center',
                            pointerEvents: 'none',
                          }}
                        >
                          <Move size={13} color="#ffffff" />
                          <Text style={{ fontSize: '11px', color: '#ffffff', fontWeight: 500 }}>
                            {isDraggingFrame
                              ? `Đang căn chỉnh: ${coverPosition.y}%`
                              : 'Nhấp & kéo ảnh để chỉnh khung hình'}
                          </Text>
                        </HStack>

                        {/* Bottom-right High-Contrast CTA Toolbar */}
                        <HStack
                          gap={2}
                          style={{
                            position: 'absolute',
                            bottom: 'var(--spacing-2)',
                            right: 'var(--spacing-2)',
                            background: 'rgba(255, 255, 255, 0.96)',
                            backdropFilter: 'blur(10px)',
                            padding: '4px 6px',
                            borderRadius: 'var(--radius-element)',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            alignItems: 'center',
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="secondary"
                            label="Đổi ảnh khác"
                            onClick={(e) => openFilePicker(e)}
                            style={{
                              color: '#111827',
                              fontWeight: 600,
                              background: '#ffffff',
                              border: '1px solid var(--color-border)',
                            }}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            label="Xóa ảnh"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCustomCoverUrl('');
                              setCoverPosition({ x: 50, y: 50 });
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          />
                        </HStack>
                      </VStack>
                    ) : (
                      /* Drag & Drop / Click to Upload Box */
                      <VStack
                        gap={2}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={(e) => openFilePicker(e)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-4) var(--spacing-3)',
                          border: isDragging ? '2px dashed var(--color-icon-accent)' : '2px dashed var(--color-border)',
                          borderRadius: 'var(--radius-container)',
                          background: isDragging ? 'var(--color-background-muted)' : 'var(--color-background-surface)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <VStack
                          gap={0}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--color-background-muted)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Upload size={20} color="var(--color-icon-accent)" />
                        </VStack>

                        <VStack gap={0} style={{ alignItems: 'center' }}>
                          <Text weight="semibold" style={{ fontSize: '13px' }}>
                            Nhấn để tải ảnh bìa riêng từ thiết bị (không bắt buộc)
                          </Text>
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            Kéo và thả file ảnh vào đây (Hỗ trợ PNG, JPG, WebP - Tối đa 5MB)
                          </Text>
                        </VStack>

                        <Button
                          size="sm"
                          variant="secondary"
                          label="Chọn file từ máy tính"
                          onClick={(e) => openFilePicker(e)}
                        />
                      </VStack>
                    )
                  )}
                </VStack>

                {/* 3. Date & Time */}
                <VStack
                  gap={2}
                  style={{
                    padding: 'var(--spacing-3)',
                    background: 'var(--color-background-surface)',
                    borderRadius: 'var(--radius-container)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <VStack gap={1}>
                    <HStack gap={1} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <HStack gap={1} style={{ alignItems: 'center' }}>
                        <Calendar size={16} color="var(--color-icon-accent)" />
                        <Text weight="semibold">Ngày diễn ra *</Text>
                      </HStack>

                      {/* Quick Date Chips: Hôm nay, Ngày mai, Ngày kia */}
                      <HStack gap={1}>
                        <button
                          type="button"
                          onClick={() => setStartDate(todayStr)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-pill, 9999px)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: startDate === todayStr ? '1px solid var(--color-interactive-primary)' : '1px solid var(--color-border)',
                            backgroundColor: startDate === todayStr ? 'var(--color-interactive-subtle, rgba(239, 68, 68, 0.1))' : 'var(--color-surface)',
                            color: startDate === todayStr ? 'var(--color-interactive-primary)' : 'var(--color-foreground)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Hôm nay
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartDate(tomorrowStr)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-pill, 9999px)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: startDate === tomorrowStr ? '1px solid var(--color-interactive-primary)' : '1px solid var(--color-border)',
                            backgroundColor: startDate === tomorrowStr ? 'var(--color-interactive-subtle, rgba(239, 68, 68, 0.1))' : 'var(--color-surface)',
                            color: startDate === tomorrowStr ? 'var(--color-interactive-primary)' : 'var(--color-foreground)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Ngày mai
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartDate(dayAfterStr)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-pill, 9999px)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: startDate === dayAfterStr ? '1px solid var(--color-interactive-primary)' : '1px solid var(--color-border)',
                            backgroundColor: startDate === dayAfterStr ? 'var(--color-interactive-subtle, rgba(239, 68, 68, 0.1))' : 'var(--color-surface)',
                            color: startDate === dayAfterStr ? 'var(--color-interactive-primary)' : 'var(--color-foreground)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Ngày kia
                        </button>
                      </HStack>
                    </HStack>

                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                  </VStack>

                  {/* Bắt đầu & Số giờ chơi */}
                  <HStack gap={3} style={{ width: '100%', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <VStack gap={1} style={{ width: '140px' }}>
                      <Text weight="semibold">Bắt đầu *</Text>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-element)',
                          border: '1px solid var(--color-border)',
                          width: '100%',
                        }}
                      />
                    </VStack>

                    <VStack gap={1} style={{ flex: 1, minWidth: '240px' }}>
                      <Text weight="semibold">Số giờ chơi</Text>
                      <HStack gap={1} style={{ flexWrap: 'wrap' }}>
                        {DURATION_OPTIONS.map((d) => {
                          const isSelected = durationMinutes === d.minutes;
                          return (
                            <button
                              key={d.minutes}
                              type="button"
                              onClick={() => setDurationMinutes(d.minutes)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-pill, 9999px)',
                                fontSize: '12px',
                                fontWeight: isSelected ? 600 : 500,
                                cursor: 'pointer',
                                border: isSelected ? '1px solid var(--color-interactive-primary)' : '1px solid var(--color-border)',
                                backgroundColor: isSelected ? 'var(--color-interactive-subtle, rgba(239, 68, 68, 0.1))' : 'var(--color-surface)',
                                color: isSelected ? 'var(--color-interactive-primary)' : 'var(--color-foreground)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </HStack>
                    </VStack>
                  </HStack>

                  {/* Giờ Kết Thúc: Dòng text tính tự động không thể sửa */}
                  <HStack
                    gap={1}
                    style={{
                      alignItems: 'center',
                      padding: '6px 12px',
                      background: 'var(--color-background-muted)',
                      borderRadius: 'var(--radius-element)',
                      width: 'fit-content',
                    }}
                  >
                    <Clock size={15} color="var(--color-icon-accent)" />
                    <Text style={{ fontSize: '13px' }}>
                      Kết thúc lúc:{' '}
                      <Text as="span" weight="bold" color="primary">
                        {endTime}
                      </Text>
                      {' '}(Thời lượng:{' '}
                      <Text as="span" weight="medium">
                        {DURATION_OPTIONS.find(d => d.minutes === durationMinutes)?.label || `${durationMinutes} phút`}
                      </Text>
                      )
                    </Text>
                  </HStack>
                </VStack>

                {/* 4. Slot tối thiểu đứng trước Slot tối đa (tính từ trái qua phải) */}
                <HStack gap={3} style={{ width: '100%', flexWrap: 'wrap' }}>
                  <VStack gap={1} style={{ flex: 1, minWidth: '140px' }}>
                    <Text weight="semibold">Slot tối thiểu</Text>
                    <input
                      type="number"
                      min="2"
                      value={minPlayers}
                      onChange={(e) => setMinPlayers(e.target.value)}
                      placeholder="4"
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                  </VStack>

                  <VStack gap={1} style={{ flex: 1, minWidth: '140px' }}>
                    <Text weight="semibold">Slot tối đa *</Text>
                    <input
                      type="number"
                      required
                      min="2"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(e.target.value)}
                      placeholder="8"
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                  </VStack>
                </HStack>

                {/* 5. Skill Requirement */}
                <HStack gap={3} style={{ width: '100%', flexWrap: 'wrap' }}>
                  <VStack gap={1} style={{ flex: 1, minWidth: '200px' }}>
                    <Text weight="semibold">Trình độ tối thiểu *</Text>
                    <Select
                      value={minSkill}
                      onChange={(e) => handleMinSkillChange(e.target.value as SkillLevel)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    >
                      {SKILL_LEVEL_ORDER.map((k) => (
                        <option key={k} value={k}>
                          {SKILL_LABELS[k].label}
                        </option>
                      ))}
                    </Select>
                  </VStack>

                  <VStack gap={1} style={{ flex: 1, minWidth: '200px' }}>
                    <Text weight="semibold">Trình độ tối đa *</Text>
                    <Select
                      value={maxSkill}
                      onChange={(e) => setMaxSkill(e.target.value as SkillLevel)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    >
                      {allowedMaxSkillLevels.map((k) => (
                        <option key={k} value={k}>
                          {SKILL_LABELS[k].label}
                        </option>
                      ))}
                    </Select>
                  </VStack>
                </HStack>

                {/* 6. Host Approval Toggle (Astryx Switch) */}
                <VStack
                  gap={1}
                  style={{
                    padding: 'var(--spacing-3)',
                    background: 'var(--color-background-surface)',
                    borderRadius: 'var(--radius-container)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Switch
                    label="Yêu cầu Host duyệt thủ công"
                    description="Khuyên dùng để kiểm tra trình độ & uy tín người chơi trước khi duyệt vào danh sách thi đấu"
                    value={requiresApproval}
                    onChange={(checked) => setRequiresApproval(checked)}
                  />
                </VStack>

                {/* 7. Tiêu đề buổi chơi (Pre-filled format trích trực tiếp từ input, nằm trên Mô tả) */}
                <VStack gap={1}>
                  <HStack gap={1} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text weight="semibold">Tiêu đề buổi chơi *</Text>
                    {isTitleManuallyEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsTitleManuallyEdited(false);
                          setTitle(generateAutoTitle(minSkill, maxSkill, startTime, endTime, startDate));
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: 'var(--color-interactive-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0,
                        }}
                      >
                        <Sparkles size={13} />
                        Làm mới theo mẫu tự động
                      </button>
                    )}
                  </HStack>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setIsTitleManuallyEdited(true);
                    }}
                    placeholder="Ví dụ: Kèo giao lưu Trình TB - TB+ · 19:30 - 21:30 · Thứ Tư (07/10)"
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                      fontWeight: 500,
                    }}
                  />
                  <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                    💡 Tiêu đề được định dạng tự động từ trình độ, khung giờ và ngày thi đấu bạn đã chọn. Bạn có thể chỉnh sửa lại tuỳ thích.
                  </Text>
                </VStack>

                {/* 8. Mô tả & Lưu ý thêm */}
                <VStack gap={1}>
                  <Text weight="semibold">Mô tả & Lưu ý thêm</Text>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ghi chú về nước uống, chỗ gửi xe, cách ghép cặp..."
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  />
                </VStack>
              </VStack>
            </form>
          </LayoutContent>
        }
        footer={
          <LayoutFooter
            hasDivider={true}
            style={{
              background: 'var(--color-background-surface)',
            }}
          >
            <HStack gap={2} style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button size="md" variant="ghost" label="Hủy bỏ" onClick={onClose} />
              <Button
                size="md"
                variant="primary"
                label="Đăng sự kiện"
                onClick={() => {
                  const form = document.getElementById('create-event-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
};
