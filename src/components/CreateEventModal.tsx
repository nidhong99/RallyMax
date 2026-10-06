import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { useApp } from '../context/AppContext';
import { SkillLevel, SKILL_LABELS, SKILL_LEVEL_ORDER } from '../types/database';
import { Image, MapPin, Upload, Trash2, CheckCircle2, Move, RefreshCw } from 'lucide-react';

const DEFAULT_COVER_PRESETS = [
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1613918431703-9b6e1531e24a?w=1200&auto=format&fit=crop&q=80',
];

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

  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [coverPosition, setCoverPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const frameDragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [venueName, setVenueName] = useState('Sân Cầu Lông Cung Thể Thao Quần Ngựa');
  const [locationUrl, setLocationUrl] = useState('https://maps.app.goo.gl/8v3M4N1pZ5rLq8w78');
  const [courtNumbers, setCourtNumbers] = useState('Sân 1');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('19:30');
  const [endTime, setEndTime] = useState('21:30');
  const [fee, setFee] = useState('65000');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [minPlayers, setMinPlayers] = useState('4');
  const [minSkill, setMinSkill] = useState<SkillLevel>('LOW_INTERMEDIATE');
  const [maxSkill, setMaxSkill] = useState<SkillLevel>('HIGH_INTERMEDIATE');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [description, setDescription] = useState('');

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
    // Hold the flag true for 600ms so any buffered window events (Escape, blur, focus) don't close the modal
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
        setCoverImageUrl(event.target.result as string);
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

  // Filter max skill level options to only those >= minSkill
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

    await createEvent({
      title,
      cover_image_url: coverImageUrl || DEFAULT_COVER_PRESETS[0],
      cover_image_position: `${coverPosition.x}% ${coverPosition.y}%`,
      venue_name: venueName,
      location_url: locationUrl,
      court_numbers: courtNumbers,
      start_time: startIso,
      end_time: endIso,
      fee_per_player: Number(fee) || 0,
      max_players: Number(maxPlayers) || 6,
      min_players: Number(minPlayers) || 4,
      min_skill_level: minSkill,
      max_skill_level: maxSkill,
      requires_approval: requiresApproval,
      payment_qr_url: qrUrl || (fee ? `https://api.vietqr.io/image/970422-0912345678-compact2.jpg?amount=${fee}&addInfo=RallyMax` : undefined),
      payment_note: paymentNote || 'MB Bank: 0912345678 (Tên người tham gia)',
      description,
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
                {/* 1. Cover Image Upload (Pure File Upload, No URL input) */}
                <VStack gap={2}>
                  <HStack gap={1} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <Image size={16} color="var(--color-icon-accent)" />
                      <Text weight="semibold">Ảnh bìa sự kiện</Text>
                    </HStack>
                    {coverImageUrl && (
                      <HStack gap={1} style={{ alignItems: 'center' }}>
                        <CheckCircle2 size={14} color="var(--color-success)" />
                        <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                          Đã chọn ảnh
                        </Text>
                      </HStack>
                    )}
                  </HStack>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  {coverImageUrl ? (
                    /* Image Uploaded Preview State with Direct Drag to Reposition */
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
                        height: '180px',
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
                        src={coverImageUrl}
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
                            setCoverImageUrl('');
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
                        padding: 'var(--spacing-5) var(--spacing-4)',
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
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: 'var(--color-background-muted)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Upload size={22} color="var(--color-icon-accent)" />
                      </VStack>

                      <VStack gap={0} style={{ alignItems: 'center' }}>
                        <Text weight="semibold" style={{ fontSize: '14px' }}>
                          Nhấn để tải ảnh bìa lên từ thiết bị
                        </Text>
                        <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                          Kéo và thả file ảnh vào đây (Hỗ trợ PNG, JPG, JPEG, WebP - Tối đa 5MB)
                        </Text>
                      </VStack>

                      <Button
                        size="sm"
                        variant="secondary"
                        label="Chọn file từ máy tính"
                        onClick={(e) => openFilePicker(e)}
                      />
                    </VStack>
                  )}
                </VStack>

                {/* 2. Event Title */}
                <VStack gap={1}>
                  <Text weight="semibold">Tiêu đề buổi chơi *</Text>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Giao lưu tối T5 sân Quần Ngựa - Tuyển 2 bạn TB/TB+"
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  />
                </VStack>

                {/* 3. Venue & Location via Google Maps */}
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
                        ⚡ Chọn từ database để tự động điền thông tin
                      </Text>
                    )}
                  </HStack>

                  {/* Quick Select Venue from Database */}
                  {venues && venues.length > 0 && (
                    <VStack gap={1}>
                      <Text type="supporting" weight="medium" style={{ fontSize: '12px' }}>
                        🏟️ Chọn sân có sẵn trong cơ sở dữ liệu:
                      </Text>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const selected = venues.find(v => v.id === val);
                          if (selected) {
                            setVenueName(selected.name);
                            if (selected.maps_url) {
                              setLocationUrl(selected.maps_url);
                            } else {
                              setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + (selected.address || ''))}`);
                            }
                            if (selected.image_url) {
                              setCoverImageUrl(selected.image_url);
                            }
                          }
                        }}
                        defaultValue=""
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
                        <option value="">-- Chọn nhanh sân trong database (hoặc nhập bên dưới) --</option>
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            🏸 {v.name} ({v.district || 'Hà Nội'}) {v.price_range ? `· ${v.price_range}` : ''}
                          </option>
                        ))}
                      </select>
                    </VStack>
                  )}

                  <HStack gap={2} style={{ width: '100%' }}>
                    <VStack gap={1} style={{ flex: 2 }}>
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

                    <VStack gap={1} style={{ flex: 1 }}>
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

                {/* 4. Date & Time */}
                <HStack gap={2} style={{ width: '100%' }}>
                  <VStack gap={1} style={{ flex: 1 }}>
                    <Text weight="semibold">Ngày diễn ra *</Text>
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

                  <VStack gap={1} style={{ width: '140px' }}>
                    <Text weight="semibold">Kết thúc *</Text>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                  </VStack>
                </HStack>

                {/* 5. Unified Fee & Player Capacity */}
                <HStack gap={2} style={{ width: '100%' }}>
                  <VStack gap={1} style={{ flex: 1 }}>
                    <Text weight="semibold">Phí tham gia (VNĐ) *</Text>
                    <input
                      type="number"
                      required
                      min="0"
                      step="5000"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      placeholder="65000"
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                  </VStack>

                  <VStack gap={1} style={{ width: '140px' }}>
                    <Text weight="semibold">Slot tối đa *</Text>
                    <input
                      type="number"
                      required
                      min="2"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(e.target.value)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                  </VStack>

                  <VStack gap={1} style={{ width: '140px' }}>
                    <Text weight="semibold">Slot tối thiểu</Text>
                    <input
                      type="number"
                      min="2"
                      value={minPlayers}
                      onChange={(e) => setMinPlayers(e.target.value)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                      }}
                    />
                  </VStack>
                </HStack>

                {/* 6. Skill Requirement (Enforcing max skill >= min skill) */}
                <HStack gap={2} style={{ width: '100%' }}>
                  <VStack gap={1} style={{ flex: 1 }}>
                    <Text weight="semibold">Trình độ tối thiểu *</Text>
                    <select
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
                    </select>
                  </VStack>

                  <VStack gap={1} style={{ flex: 1 }}>
                    <Text weight="semibold">Trình độ tối đa *</Text>
                    <select
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
                    </select>
                  </VStack>
                </HStack>

                {/* 7. Auto Approval Toggle */}
                <HStack gap={2} style={{ alignItems: 'center', padding: 'var(--spacing-1) 0' }}>
                  <input
                    type="checkbox"
                    id="autoApproval"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="autoApproval" style={{ cursor: 'pointer' }}>
                    <Text weight="medium">
                      Yêu cầu Host duyệt thủ công (Khuyên dùng để kiểm tra trình độ & uy tín người chơi)
                    </Text>
                  </label>
                </HStack>

                {/* 8. Description */}
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
