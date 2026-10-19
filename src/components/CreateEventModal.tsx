import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Divider } from '@astryxdesign/core/Divider';
import { Button } from '@astryxdesign/core/Button';
import { Switch } from '@astryxdesign/core/Switch';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { Banner } from '@astryxdesign/core/Banner';
import { FieldStatus } from '@astryxdesign/core/FieldStatus';
import { useApp } from '../context/AppContext';
import { SkillLevel, SKILL_LABELS, SKILL_LEVEL_ORDER, Event } from '../types/database';
import { PROVINCES, DISTRICTS } from '../constants/locations';
import { Upload, Trash2, CheckCircle2, Move, Clock, Sparkles, Copy, Repeat, AlertCircle } from 'lucide-react';

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

function addDays(dateStr: string, daysToAdd: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + daysToAdd);
  return formatLocalDate(d);
}

function formatDayOfWeekOnly(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[d.getDay()] || '';
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

export const RedAsterisk: React.FC = () => (
  <Text
    as="span"
    style={{
      color: 'var(--color-text-critical, #dc2626)',
      fontWeight: 'bold',
      marginLeft: '3px',
    }}
  >
    *
  </Text>
);

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEvent?: Event | null;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  initialEvent,
}) => {
  const { createEvent, venues, events, currentUser, isAdmin } = useApp();
  const isHost =
    (isAdmin || currentUser?.role === 'HOST' || currentUser?.role === 'ADMIN') &&
    currentUser?.role !== 'PLAYER';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSelectingFileRef = useRef(false);
  const resetSelectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation & Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clone feature states
  const [clonedFromTitle, setClonedFromTitle] = useState<string | null>(null);
  const [clonedEventId, setClonedEventId] = useState<string>('');

  // Repeat event feature states
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<'WEEKLY' | 'DAILY'>('WEEKLY');
  const [repeatCount, setRepeatCount] = useState<number>(4);

  // 1. Venue & Location states with Top-Down Filters
  const [selectedCity, setSelectedCity] = useState<string>('HN'); // Default to Hà Nội
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [venueName, setVenueName] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [courtNumbers, setCourtNumbers] = useState('Sân 1');

  // Available districts based on selectedCity
  const availableDistricts = useMemo(() => {
    if (selectedCity === 'ALL') {
      return DISTRICTS;
    }
    return DISTRICTS.filter(d => d.province_code === selectedCity);
  }, [selectedCity]);

  // Filtered venues based on top-down filters (City -> District)
  const filteredVenues = useMemo(() => {
    if (!venues || venues.length === 0) return [];
    return venues.filter((v) => {
      const d = DISTRICTS.find(item => item.code === v.district_code);
      const venueProvince = d?.province_code || (v.district_code?.startsWith('HN') ? 'HN' : v.district_code?.startsWith('HCM') ? 'HCM' : v.district_code?.startsWith('DN') ? 'DN' : undefined);

      if (selectedCity !== 'ALL' && venueProvince !== selectedCity) {
        return false;
      }
      if (selectedDistrict !== 'ALL' && v.district_code !== selectedDistrict) {
        return false;
      }
      return true;
    });
  }, [venues, selectedCity, selectedDistrict]);

  // Selected venue object (from database)
  const currentVenue = useMemo(() => {
    return venues.find(v => (selectedVenueId && v.id === selectedVenueId) || v.name === venueName);
  }, [venues, selectedVenueId, venueName]);

  // Available events that can be cloned (Host's own events first, or any recent events)
  const availableEventsToClone = useMemo(() => {
    if (!events || events.length === 0) return [];
    const hostEvents = events.filter(
      (e) => e.host_id === currentUser?.id || e.host?.id === currentUser?.id || currentUser?.role === 'ADMIN'
    );
    if (hostEvents.length > 0) return hostEvents;
    return events.slice(0, 10);
  }, [events, currentUser]);

  // Memoized options for Astryx Selector components
  const cityOptions = useMemo(() => [
    ...PROVINCES.map((p) => ({ value: p.code, label: p.name })),
    { value: 'ALL', label: 'Tất cả thành phố' },
  ], []);

  const districtOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất cả quận / huyện' },
    ...availableDistricts.map((d) => ({ value: d.code, label: d.name })),
  ], [availableDistricts]);

  const venueOptions = useMemo(() => {
    if (filteredVenues.length === 0) {
      return [{ value: '', label: '-- Không có sân nào trong khu vực này --' }];
    }
    return filteredVenues.map((v) => {
      const d = DISTRICTS.find(item => item.code === v.district_code);
      return {
        value: v.id,
        label: `🏸 ${v.name}${d ? ` (${d.name})` : ''}`,
      };
    });
  }, [filteredVenues]);

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

  // Dynamic preview dates for repeat feature
  const repeatDates = useMemo(() => {
    if (!isRepeating) return [];
    const list: { dayOfWeek: string; formattedDate: string; isoDate: string }[] = [];
    const count = Math.min(Math.max(repeatCount, 2), 12);
    for (let i = 0; i < count; i++) {
      const offset = repeatFrequency === 'WEEKLY' ? i * 7 : i;
      const dStr = addDays(startDate, offset);
      const d = new Date(dStr + 'T00:00:00');
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      list.push({
        dayOfWeek: days[d.getDay()] || '',
        formattedDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        isoDate: dStr,
      });
    }
    return list;
  }, [isRepeating, repeatFrequency, repeatCount, startDate]);

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

  // Apply clone from an existing event
  const handleApplyCloneEvent = (ev: Event) => {
    if (!ev) return;
    const matchedV = venues.find(v => v.id === ev.venue_id || v.name === ev.venue_name);
    if (matchedV) {
      const d = DISTRICTS.find(item => item.code === matchedV.district_code);
      const venueProvince = d?.province_code || (matchedV.district_code?.startsWith('HN') ? 'HN' : matchedV.district_code?.startsWith('HCM') ? 'HCM' : matchedV.district_code?.startsWith('DN') ? 'DN' : undefined);
      if (venueProvince) setSelectedCity(venueProvince);
      if (matchedV.district_code) setSelectedDistrict(matchedV.district_code);
      setSelectedVenueId(matchedV.id);
      setVenueName(matchedV.name);
      setLocationUrl(matchedV.maps_url || ev.location_url || '');
    } else {
      setSelectedVenueId(ev.venue_id || '');
      setVenueName(ev.venue_name || '');
      setLocationUrl(ev.location_url || '');
    }

    setCourtNumbers(ev.court_numbers || 'Sân 1');

    if (ev.cover_image_url && !ev.cover_image_url.includes('unsplash.com')) {
      setCoverMode('custom');
      setCustomCoverUrl(ev.cover_image_url);
      if (ev.cover_image_position) {
        const parts = ev.cover_image_position.replace(/%/g, '').split(' ');
        if (parts.length >= 2) {
          setCoverPosition({ x: Number(parts[0]) || 50, y: Number(parts[1]) || 50 });
        }
      }
    } else {
      setCoverMode('default');
    }

    try {
      const sDate = new Date(ev.start_time);
      const eDate = new Date(ev.end_time);
      const diffMin = Math.round((eDate.getTime() - sDate.getTime()) / 60000);
      if (diffMin > 0) {
        setDurationMinutes(diffMin);
      }
      const h = String(sDate.getHours()).padStart(2, '0');
      const m = String(sDate.getMinutes()).padStart(2, '0');
      if (!isNaN(Number(h)) && !isNaN(Number(m))) {
        setStartTime(`${h}:${m}`);
      }
    } catch (err) {}

    setMinPlayers(String(ev.min_players || 4));
    setMaxPlayers(String(ev.max_players || 8));
    setMinSkill(ev.min_skill_level || 'LOW_INTERMEDIATE');
    setMaxSkill(ev.max_skill_level || 'HIGH_INTERMEDIATE');
    setRequiresApproval(ev.requires_approval ?? true);
    setDescription(ev.description || '');

    setIsTitleManuallyEdited(false);
    setClonedFromTitle(ev.title);
    setClonedEventId(ev.id);
    setErrors({});
  };

  // Synchronize when initialEvent is passed via props
  useEffect(() => {
    if (isOpen && initialEvent) {
      handleApplyCloneEvent(initialEvent);
    }
  }, [isOpen, initialEvent]);

  // Reset modal state upon closing
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setHasSubmitted(false);
      setClonedFromTitle(null);
      setClonedEventId('');
      setIsRepeating(false);
      setRepeatCount(4);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

  // Synchronize selected venue with filtered venues
  useEffect(() => {
    if (filteredVenues && filteredVenues.length > 0) {
      const exists = filteredVenues.some(v => v.id === selectedVenueId);
      if (!exists) {
        const defaultV = (selectedCity === 'HN' && selectedDistrict === 'ALL')
          ? (filteredVenues.find(v => v.name.includes('Quần Ngựa')) || filteredVenues[0])
          : filteredVenues[0];

        setSelectedVenueId(defaultV.id);
        setVenueName(defaultV.name);
        setLocationUrl(
          defaultV.maps_url ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultV.name + ' ' + (defaultV.address || ''))}`
        );
      }
    } else {
      setSelectedVenueId('');
      setVenueName('');
      setLocationUrl('');
    }
  }, [filteredVenues]);

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

  const minSkillOptions = useMemo(() => {
    return SKILL_LEVEL_ORDER.map((k) => ({
      value: k,
      label: SKILL_LABELS[k].label,
    }));
  }, []);

  const maxSkillOptions = useMemo(() => {
    return allowedMaxSkillLevels.map((k) => ({
      value: k,
      label: SKILL_LABELS[k].label,
    }));
  }, [allowedMaxSkillLevels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost) {
      alert('Chỉ tài khoản có vai trò Host hoặc Admin mới có quyền tạo kèo giao lưu.');
      return;
    }
    const newErrors: Record<string, string> = {};

    if (!selectedVenueId && !venueName.trim()) {
      newErrors.venue = 'Vui lòng chọn sân thi đấu trong danh sách';
    }
    if (!startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày diễn ra';
    }
    if (!startTime) {
      newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    }
    const maxP = Number(maxPlayers);
    const minP = Number(minPlayers);
    if (isNaN(maxP) || maxP < 2) {
      newErrors.maxPlayers = 'Số lượng slot tối đa phải từ 2 người trở lên';
    } else if (maxP < minP) {
      newErrors.maxPlayers = 'Slot tối đa không thể nhỏ hơn slot tối thiểu';
    }
    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề sự kiện';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setHasSubmitted(true);
      const scrollContainer = document.getElementById('create-event-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine final cover image
      const finalCoverUrl =
        coverMode === 'custom' && customCoverUrl
          ? customCoverUrl
          : (currentVenue?.image_url || DEFAULT_COVER_PRESET);

      const basePayload = {
        venue_id: currentVenue?.id || selectedVenueId || undefined,
        venue_name: venueName,
        location_url: locationUrl,
        court_numbers: courtNumbers,
        cover_image_url: finalCoverUrl,
        cover_image_position: `${coverPosition.x}% ${coverPosition.y}%`,
        fee_per_player: 0,
        max_players: Number(maxPlayers) || 8,
        min_players: Number(minPlayers) || 4,
        min_skill_level: minSkill,
        max_skill_level: maxSkill,
        requires_approval: requiresApproval,
        description: description.trim(),
      };

      if (isRepeating && repeatCount > 1) {
        const count = Math.min(Math.max(repeatCount, 2), 12);
        const datesToCreate = Array.from({ length: count }, (_, i) => {
          const offset = repeatFrequency === 'WEEKLY' ? i * 7 : i;
          return addDays(startDate, offset);
        });

        // Shared series group ID for all sessions in this recurring pattern
        const recurrenceGroupId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        for (let i = 0; i < datesToCreate.length; i++) {
          const dateItem = datesToCreate[i];
          const sIso = `${dateItem}T${startTime}:00+07:00`;
          const eIso = `${dateItem}T${endTime}:00+07:00`;
          const itemTitle = isTitleManuallyEdited
            ? title
            : generateAutoTitle(minSkill, maxSkill, startTime, endTime, dateItem);

          await createEvent({
            ...basePayload,
            title: itemTitle,
            start_time: sIso,
            end_time: eIso,
            is_recurring: true,
            recurrence_frequency: repeatFrequency,
            recurrence_group_id: recurrenceGroupId,
            recurrence_index: i + 1,
            recurrence_count: datesToCreate.length,
          });
        }
      } else {
        const startIso = `${startDate}T${startTime}:00+07:00`;
        const endIso = `${startDate}T${endTime}:00+07:00`;
        await createEvent({
          ...basePayload,
          title: title.trim(),
          start_time: startIso,
          end_time: endIso,
          is_recurring: false,
        });
      }

      onClose();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi tạo sự kiện');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHost) {
    return (
      <Dialog
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        purpose="alert"
        width={560}
      >
        <Layout
          height="auto"
          header={
            <DialogHeader
              title="Tổ chức Kèo Cầu Lông"
              subtitle="Yêu cầu vai trò Host hoặc Quản trị viên"
              hasDivider={true}
              onOpenChange={(open) => {
                if (!open) onClose();
              }}
            />
          }
          content={
            <LayoutContent
              padding={4}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-4)',
              }}
            >
              <VStack
                gap={4}
                style={{
                  padding: 'var(--spacing-6) var(--spacing-2)',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Banner
                  status="warning"
                  title="Tài khoản chưa có quyền tổ chức kèo giao lưu"
                  description="Tài khoản của bạn hiện có vai trò Người chơi (Player). Để đảm bảo tính cam kết sân bãi và điểm danh uy tín, chỉ tài khoản có vai trò Host hoặc Quản trị viên (Admin) mới có quyền tạo và tổ chức kèo giao lưu trên hệ thống RallyMax."
                  collapsible={false}
                />
                <Text color="secondary" style={{ maxWidth: '440px' }}>
                  Nếu bạn là người thường xuyên đại diện đặt sân cho nhóm cầu lông, vui lòng liên hệ Ban quản trị để được nâng cấp lên vai trò Host.
                </Text>
              </VStack>
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
                <Button size="md" variant="secondary" label="Đóng" onClick={onClose} />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    );
  }

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
            id="create-event-scroll-container"
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
              <VStack gap={5}>
                {/* Error Banner when required fields are missing */}
                {hasSubmitted && Object.keys(errors).length > 0 && (
                  <Banner
                    status="error"
                    title="Vui lòng điền đầy đủ các thông tin bắt buộc"
                    description={`Còn ${Object.keys(errors).length} mục thông tin chưa hợp lệ. Vui lòng kiểm tra các mục được viền đỏ bên dưới.`}
                    collapsible={false}
                  />
                )}

                {/* Cloned Confirmation Banner */}
                {clonedFromTitle && (
                  <Banner
                    status="info"
                    title={`Đã sao chép thông tin từ: "${clonedFromTitle}"`}
                    description="Các thông tin sân, trình độ, số slot và mô tả đã được tự động điền sẵn. Hãy chọn ngày giờ diễn ra mong muốn trước khi đăng."
                    isDismissable={true}
                    onDismiss={() => setClonedFromTitle(null)}
                  />
                )}

                {/* Quick Clone Bar */}
                {availableEventsToClone.length > 0 && (
                  <VStack
                    gap={2}
                    style={{
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-container)',
                      background: 'var(--color-background-muted)',
                      border: '1px dashed var(--color-border)',
                    }}
                  >
                    <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <HStack gap={1} style={{ alignItems: 'center' }}>
                        <Copy size={15} color="var(--color-icon-accent)" />
                        <Text weight="semibold" style={{ fontSize: '13px' }}>
                          Sao chép nhanh từ kèo cũ
                        </Text>
                      </HStack>
                      <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                        Tự động điền sân, trình độ & quy mô
                      </Text>
                    </HStack>

                    <Selector
                      label="Chọn kèo mẫu để sao chép"
                      isLabelHidden={true}
                      placeholder="-- Chọn kèo cũ để sao chép thông tin nhanh --"
                      size="md"
                      value={clonedEventId}
                      onChange={(val) => {
                        setClonedEventId(val);
                        const found = events.find((e) => e.id === val);
                        if (found) {
                          handleApplyCloneEvent(found);
                        }
                      }}
                      options={[
                        { value: '', label: '-- Chọn kèo cũ để sao chép thông tin nhanh --' },
                        ...availableEventsToClone.map((e) => ({
                          value: e.id,
                          label: `📋 ${e.title} (${e.venue?.name || e.venue_name || 'Sân'})`,
                        })),
                      ]}
                      width="100%"
                    />
                  </VStack>
                )}

                {/* 1. Venue & Location with Top-Down Filters */}
                <VStack gap={3}>
                  <Heading level={3}>
                    Địa điểm sân thi đấu <RedAsterisk />
                  </Heading>

                  {/* Top-Down Filters: Thành phố & Quận / Huyện */}
                  <HStack gap={2} style={{ width: '100%', flexWrap: 'wrap' }}>
                    <VStack gap={1} style={{ flex: 1, minWidth: '140px' }}>
                      <Text type="supporting" weight="medium" style={{ fontSize: '12px' }}>
                        Thành phố
                      </Text>
                      <Selector
                        label="Thành phố"
                        isLabelHidden={true}
                        size="md"
                        value={selectedCity}
                        onChange={(val) => {
                          setSelectedCity(val);
                          setSelectedDistrict('ALL');
                        }}
                        options={cityOptions}
                        width="100%"
                      />
                    </VStack>

                    <VStack gap={1} style={{ flex: 1, minWidth: '160px' }}>
                      <Text type="supporting" weight="medium" style={{ fontSize: '12px' }}>
                        Quận / Huyện
                      </Text>
                      <Selector
                        label="Quận / Huyện"
                        isLabelHidden={true}
                        size="md"
                        value={selectedDistrict}
                        onChange={(val) => setSelectedDistrict(val)}
                        options={districtOptions}
                        width="100%"
                      />
                    </VStack>
                  </HStack>

                  {/* Filtered Venues Dropdown using Astryx Selector */}
                  <VStack gap={1} style={{ width: '100%' }}>
                    <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="supporting" weight="medium" style={{ fontSize: '12px' }}>
                        Sân thi đấu <RedAsterisk />
                      </Text>
                      <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                        {filteredVenues.length > 0 ? `(${filteredVenues.length} sân phù hợp)` : '(Không có sân)'}
                      </Text>
                    </HStack>

                    <VStack
                      gap={0}
                      style={{
                        borderRadius: 'var(--radius-element)',
                        border: errors.venue ? '1.5px solid var(--color-border-critical, #dc2626)' : '1px solid transparent',
                        boxShadow: errors.venue ? '0 0 0 1px var(--color-border-critical, #dc2626)' : undefined,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Selector
                        label="Sân thi đấu"
                        isLabelHidden={true}
                        size="md"
                        hasSearch
                        placeholder={filteredVenues.length > 0 ? "-- Chọn sân thi đấu --" : "-- Không có sân nào trong khu vực này --"}
                        value={selectedVenueId}
                        onChange={(val) => {
                          setSelectedVenueId(val);
                          if (errors.venue) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.venue;
                              return next;
                            });
                          }
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
                        options={venueOptions}
                        width="100%"
                      />
                    </VStack>
                    {errors.venue && (
                      <FieldStatus type="error" message={errors.venue} variant="detached" />
                    )}
                  </VStack>

                  {/* Non-editable Venue Name & Editable Court Numbers using Astryx TextInput */}
                  <HStack gap={2} style={{ width: '100%', flexWrap: 'wrap' }}>
                    <VStack gap={1} style={{ flex: 2, minWidth: '240px' }}>
                      <Text type="supporting" weight="medium">
                        Tên sân / Địa điểm <RedAsterisk />
                      </Text>
                      <TextInput
                        label="Tên sân / Địa điểm"
                        isLabelHidden={true}
                        isReadOnly={true}
                        value={venueName}
                        placeholder="Tên sân tự động cập nhật khi chọn sân"
                        size="md"
                        controlStyle={{ width: '100%' }}
                      />
                      {currentVenue?.address && (
                        <Text type="supporting" color="secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                          📍 {currentVenue.address}
                        </Text>
                      )}
                    </VStack>

                    <VStack gap={1} style={{ flex: 1, minWidth: '120px' }}>
                      <Text type="supporting" weight="medium">Số sân</Text>
                      <TextInput
                        label="Số sân"
                        isLabelHidden={true}
                        value={courtNumbers}
                        onChange={(val) => setCourtNumbers(val)}
                        placeholder="Sân 1, Sân 2"
                        size="md"
                        controlStyle={{ width: '100%' }}
                      />
                    </VStack>
                  </HStack>
                </VStack>

                <Divider variant="subtle" />

                {/* 2. Cover Image Section */}
                <VStack gap={3}>
                  <HStack gap={1} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Heading level={3}>Ảnh bìa sự kiện</Heading>
                    <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                      Không bắt buộc tải ảnh
                    </Text>
                  </HStack>

                  {/* Mode Selector using Astryx SegmentedControl */}
                  <SegmentedControl
                    label="Chế độ ảnh bìa"
                    value={coverMode}
                    onChange={(val) => setCoverMode(val as 'default' | 'custom')}
                    layout="fill"
                    size="md"
                  >
                    <SegmentedControlItem value="default" label="Mặc định (Từ dữ liệu sân)" />
                    <SegmentedControlItem value="custom" label="Tuỳ chọn (Tự tải ảnh)" />
                  </SegmentedControl>

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

                <Divider variant="subtle" />

                {/* 3. Date & Time */}
                <VStack gap={3}>
                  <VStack gap={1}>
                    <HStack gap={1} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Heading level={3}>
                        Thời gian diễn ra <RedAsterisk />
                      </Heading>

                      {/* Quick Date Chips using Astryx Button */}
                      <HStack gap={1}>
                        <Button
                          size="sm"
                          variant={startDate === todayStr ? 'primary' : 'secondary'}
                          label="Hôm nay"
                          onClick={() => {
                            setStartDate(todayStr);
                            if (errors.startDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.startDate;
                                return next;
                              });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant={startDate === tomorrowStr ? 'primary' : 'secondary'}
                          label="Ngày mai"
                          onClick={() => {
                            setStartDate(tomorrowStr);
                            if (errors.startDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.startDate;
                                return next;
                              });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant={startDate === dayAfterStr ? 'primary' : 'secondary'}
                          label="Ngày kia"
                          onClick={() => {
                            setStartDate(dayAfterStr);
                            if (errors.startDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.startDate;
                                return next;
                              });
                            }
                          }}
                        />
                      </HStack>
                    </HStack>

                    <VStack
                      gap={0}
                      style={{
                        borderRadius: 'var(--radius-element)',
                        border: errors.startDate ? '1.5px solid var(--color-border-critical, #dc2626)' : '1px solid transparent',
                        boxShadow: errors.startDate ? '0 0 0 1px var(--color-border-critical, #dc2626)' : undefined,
                      }}
                    >
                      <DateInput
                        label="Ngày diễn ra"
                        isLabelHidden={true}
                        value={(startDate || undefined) as any}
                        onChange={(val) => {
                          if (val) {
                            setStartDate(val);
                            if (errors.startDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.startDate;
                                return next;
                              });
                            }
                          }
                        }}
                        size="md"
                        width="100%"
                      />
                    </VStack>
                    {errors.startDate && (
                      <FieldStatus type="error" message={errors.startDate} variant="detached" />
                    )}
                  </VStack>

                  {/* Bắt đầu & Số giờ chơi */}
                  <HStack gap={3} style={{ width: '100%', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <VStack gap={1} style={{ width: '140px' }}>
                      <Text type="supporting" weight="medium">
                        Bắt đầu <RedAsterisk />
                      </Text>
                      <VStack
                        gap={0}
                        style={{
                          borderRadius: 'var(--radius-element)',
                          border: errors.startTime ? '1.5px solid var(--color-border-critical, #dc2626)' : '1px solid transparent',
                          boxShadow: errors.startTime ? '0 0 0 1px var(--color-border-critical, #dc2626)' : undefined,
                        }}
                      >
                        <TimeInput
                          label="Bắt đầu"
                          isLabelHidden={true}
                          hourFormat="24h"
                          value={(startTime || undefined) as any}
                          onChange={(t) => {
                            if (t) {
                              setStartTime(t);
                              if (errors.startTime) {
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.startTime;
                                  return next;
                                });
                              }
                            }
                          }}
                          size="md"
                          width="100%"
                        />
                      </VStack>
                      {errors.startTime && (
                        <FieldStatus type="error" message={errors.startTime} variant="detached" />
                      )}
                    </VStack>

                    <VStack gap={1} style={{ flex: 1, minWidth: '240px' }}>
                      <Text type="supporting" weight="medium">Số giờ chơi</Text>
                      <HStack gap={1} style={{ flexWrap: 'wrap' }}>
                        {DURATION_OPTIONS.map((d) => {
                          const isSelected = durationMinutes === d.minutes;
                          return (
                            <Button
                              key={d.minutes}
                              size="sm"
                              variant={isSelected ? 'primary' : 'secondary'}
                              label={d.label}
                              onClick={() => setDurationMinutes(d.minutes)}
                            />
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

                <Divider variant="subtle" />

                {/* 4. Repeat Event Feature */}
                <VStack gap={2}>
                  <Heading level={3}>Kèo lặp lại / Định kỳ</Heading>
                  <Switch
                    label="Tạo kèo định kỳ (Lặp lại nhiều buổi)"
                    description="Tự động nhân bản các buổi giao lưu tiếp theo mà không cần tạo từng buổi một"
                    value={isRepeating}
                    onChange={(checked) => setIsRepeating(checked)}
                  />

                  {isRepeating && (
                    <VStack
                      gap={3}
                      style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-container)',
                        background: 'var(--color-background-muted)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <HStack gap={2} style={{ width: '100%', flexWrap: 'wrap' }}>
                        <VStack gap={1} style={{ flex: 1, minWidth: '180px' }}>
                          <Text type="supporting" weight="medium" style={{ fontSize: '12px' }}>
                            Tần suất lặp lại
                          </Text>
                          <Selector
                            label="Tần suất lặp lại"
                            isLabelHidden={true}
                            size="md"
                            value={repeatFrequency}
                            onChange={(val) => setRepeatFrequency(val as 'WEEKLY' | 'DAILY')}
                            options={[
                              { value: 'WEEKLY', label: `Hàng tuần (Vào ${formatDayOfWeekOnly(startDate)})` },
                              { value: 'DAILY', label: 'Hàng ngày liên tiếp' },
                            ]}
                            width="100%"
                          />
                        </VStack>

                        <VStack gap={1} style={{ flex: 1, minWidth: '160px' }}>
                          <Text type="supporting" weight="medium" style={{ fontSize: '12px' }}>
                            Số buổi cần tạo
                          </Text>
                          <Selector
                            label="Số buổi cần tạo"
                            isLabelHidden={true}
                            size="md"
                            value={String(repeatCount)}
                            onChange={(val) => setRepeatCount(Number(val) || 4)}
                            options={[
                              { value: '2', label: '2 buổi' },
                              { value: '3', label: '3 buổi' },
                              { value: '4', label: '4 buổi (~1 tháng)' },
                              { value: '6', label: '6 buổi' },
                              { value: '8', label: '8 buổi (~2 tháng)' },
                            ]}
                            width="100%"
                          />
                        </VStack>
                      </HStack>

                      {/* Dynamic Preview Dates */}
                      <VStack gap={1}>
                        <HStack gap={1} style={{ alignItems: 'center' }}>
                          <Repeat size={14} color="var(--color-icon-accent)" />
                          <Text weight="semibold" style={{ fontSize: '12px' }}>
                            Lịch các buổi sẽ được tạo ({repeatDates.length} buổi):
                          </Text>
                        </HStack>
                        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
                          {repeatDates.map((item, idx) => (
                            <HStack
                              key={idx}
                              gap={1}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-element)',
                                background: 'var(--color-background-surface)',
                                border: '1px solid var(--color-border)',
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-brand)' }}>
                                Buổi {idx + 1}:
                              </Text>
                              <Text type="supporting" style={{ fontSize: '11px' }}>
                                {item.dayOfWeek} ({item.formattedDate})
                              </Text>
                            </HStack>
                          ))}
                        </HStack>
                      </VStack>
                    </VStack>
                  )}
                </VStack>

                <Divider variant="subtle" />

                {/* 5. Slot & Skill */}
                <VStack gap={3}>
                  <Heading level={3}>Quy mô & Trình độ</Heading>

                  {/* Slot tối thiểu đứng trước Slot tối đa using Astryx NumberInput */}
                  <HStack gap={3} style={{ width: '100%', flexWrap: 'wrap' }}>
                    <VStack gap={1} style={{ flex: 1, minWidth: '140px' }}>
                      <Text type="supporting" weight="medium">Slot tối thiểu</Text>
                      <NumberInput
                        label="Slot tối thiểu"
                        isLabelHidden={true}
                        value={Number(minPlayers) || 4}
                        onChange={(val) => setMinPlayers(String(val ?? 4))}
                        min={2}
                        size="md"
                        controlStyle={{ width: '100%' }}
                      />
                    </VStack>

                    <VStack gap={1} style={{ flex: 1, minWidth: '140px' }}>
                      <Text type="supporting" weight="medium">
                        Slot tối đa <RedAsterisk />
                      </Text>
                      <VStack
                        gap={0}
                        style={{
                          borderRadius: 'var(--radius-element)',
                          border: errors.maxPlayers ? '1.5px solid var(--color-border-critical, #dc2626)' : '1px solid transparent',
                          boxShadow: errors.maxPlayers ? '0 0 0 1px var(--color-border-critical, #dc2626)' : undefined,
                        }}
                      >
                        <NumberInput
                          label="Slot tối đa"
                          isLabelHidden={true}
                          value={Number(maxPlayers) || 8}
                          onChange={(val) => {
                            setMaxPlayers(String(val ?? 8));
                            if (errors.maxPlayers) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.maxPlayers;
                                return next;
                              });
                            }
                          }}
                          min={2}
                          size="md"
                          isRequired
                          controlStyle={{ width: '100%' }}
                        />
                      </VStack>
                      {errors.maxPlayers && (
                        <FieldStatus type="error" message={errors.maxPlayers} variant="detached" />
                      )}
                    </VStack>
                  </HStack>

                  {/* Skill Requirement using Astryx Selector */}
                  <HStack gap={3} style={{ width: '100%', flexWrap: 'wrap' }}>
                    <VStack gap={1} style={{ flex: 1, minWidth: '200px' }}>
                      <Text type="supporting" weight="medium">
                        Trình độ tối thiểu <RedAsterisk />
                      </Text>
                      <Selector
                        label="Trình độ tối thiểu"
                        isLabelHidden={true}
                        size="md"
                        value={minSkill}
                        onChange={(val) => handleMinSkillChange(val as SkillLevel)}
                        options={minSkillOptions}
                        width="100%"
                      />
                    </VStack>

                    <VStack gap={1} style={{ flex: 1, minWidth: '200px' }}>
                      <Text type="supporting" weight="medium">
                        Trình độ tối đa <RedAsterisk />
                      </Text>
                      <Selector
                        label="Trình độ tối đa"
                        isLabelHidden={true}
                        size="md"
                        value={maxSkill}
                        onChange={(val) => setMaxSkill(val as SkillLevel)}
                        options={maxSkillOptions}
                        width="100%"
                      />
                    </VStack>
                  </HStack>
                </VStack>

                <Divider variant="subtle" />

                {/* 6. Host Approval Toggle */}
                <VStack gap={2}>
                  <Heading level={3}>Cài đặt tham gia</Heading>
                  <Switch
                    label="Yêu cầu Host duyệt thủ công"
                    description="Khuyên dùng để kiểm tra trình độ & uy tín người chơi trước khi duyệt vào danh sách thi đấu"
                    value={requiresApproval}
                    onChange={(checked) => setRequiresApproval(checked)}
                  />
                </VStack>

                <Divider variant="subtle" />

                {/* 7. Title & Description */}
                <VStack gap={3}>
                  <Heading level={3}>Thông tin buổi chơi</Heading>

                  {/* Tiêu đề buổi chơi */}
                  <VStack gap={1}>
                    <HStack gap={1} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="supporting" weight="medium">
                        Tiêu đề buổi chơi <RedAsterisk />
                      </Text>
                      {isTitleManuallyEdited && (
                        <Button
                          size="sm"
                          variant="ghost"
                          label="Làm mới theo mẫu tự động"
                          icon={<Sparkles size={13} />}
                          onClick={() => {
                            setIsTitleManuallyEdited(false);
                            setTitle(generateAutoTitle(minSkill, maxSkill, startTime, endTime, startDate));
                          }}
                        />
                      )}
                    </HStack>

                    <VStack
                      gap={0}
                      style={{
                        borderRadius: 'var(--radius-element)',
                        border: errors.title ? '1.5px solid var(--color-border-critical, #dc2626)' : '1px solid transparent',
                        boxShadow: errors.title ? '0 0 0 1px var(--color-border-critical, #dc2626)' : undefined,
                      }}
                    >
                      <TextInput
                        label="Tiêu đề buổi chơi"
                        isLabelHidden={true}
                        value={title}
                        onChange={(val) => {
                          setTitle(val);
                          setIsTitleManuallyEdited(true);
                          if (errors.title) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.title;
                              return next;
                            });
                          }
                        }}
                        placeholder="Ví dụ: Kèo giao lưu Trình TB - TB+ · 19:30 - 21:30 · Thứ Tư (07/10)"
                        size="md"
                        isRequired
                        controlStyle={{ width: '100%' }}
                      />
                    </VStack>
                    {errors.title && (
                      <FieldStatus type="error" message={errors.title} variant="detached" />
                    )}

                    <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                      💡 Tiêu đề được định dạng tự động từ trình độ, khung giờ và ngày thi đấu bạn đã chọn. Bạn có thể chỉnh sửa lại tuỳ thích.
                    </Text>
                  </VStack>

                  {/* Mô tả & Lưu ý thêm using Astryx TextArea */}
                  <VStack gap={1}>
                    <Text type="supporting" weight="medium">Mô tả & Lưu ý thêm</Text>
                    <TextArea
                      label="Mô tả & Lưu ý thêm"
                      isLabelHidden={true}
                      value={description}
                      onChange={(val) => setDescription(val)}
                      placeholder="Ghi chú về nước uống, chỗ gửi xe, cách ghép cặp..."
                      controlStyle={{ width: '100%' }}
                    />
                  </VStack>
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
              <Button size="md" variant="ghost" label="Hủy bỏ" onClick={onClose} isDisabled={isSubmitting} />
              <Button
                size="md"
                variant="primary"
                label={
                  isSubmitting
                    ? 'Đang đăng sự kiện...'
                    : isRepeating
                    ? `Đăng ${repeatCount} sự kiện định kỳ`
                    : 'Đăng sự kiện'
                }
                isDisabled={isSubmitting}
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
