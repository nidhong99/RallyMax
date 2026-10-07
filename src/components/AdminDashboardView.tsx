import React, { useState } from 'react';
import { Select } from './Select';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import {
  Shield,
  Users,
  MapPin,
  Calendar,
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Phone,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Image as ImageIcon,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Venue, Event, Profile, UserRole } from '../types/database';
import { DISTRICTS } from '../constants/locations';

interface AdminDashboardViewProps {
  onSelectEvent: (event: Event) => void;
  onOpenCreateEvent: () => void;
}

type AdminSubTab = 'venues' | 'users' | 'events' | 'reliability';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onSelectEvent,
  onOpenCreateEvent,
}) => {
  const {
    currentUser,
    isAdmin,
    venues,
    allUsers,
    events,
    createVenue,
    updateVenue,
    deleteVenue,
    updateUserRole,
    resetUserReliability,
    deleteUser,
    refreshProfiles,
    refreshVenues,
    cancelEvent,
    deleteEvent,
    isRealSupabase,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('venues');

  // Search & Filters
  const [venueSearch, setVenueSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('ALL');

  // Pagination states
  const [venuePage, setVenuePage] = useState(1);
  const [venuePageSize, setVenuePageSize] = useState(10);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [eventPage, setEventPage] = useState(1);
  const [eventPageSize, setEventPageSize] = useState(10);
  const [disputePage, setDisputePage] = useState(1);
  const [disputePageSize, setDisputePageSize] = useState(10);

  // Venue Add / Edit Modal state
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueDistrictCode, setVenueDistrictCode] = useState('HN_BD');
  const [venueMapsUrl, setVenueMapsUrl] = useState('');
  const [venueImageUrl, setVenueImageUrl] = useState('');
  const [venueGalleryImages, setVenueGalleryImages] = useState<string[]>([]);
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState('');
  const [coverImageError, setCoverImageError] = useState(false);
  const [previewCoverModalUrl, setPreviewCoverModalUrl] = useState<string | null>(null);
  const [previewVenue, setPreviewVenue] = useState<Venue | null>(null);
  const [previewVenueActiveIndex, setPreviewVenueActiveIndex] = useState(0);

  // Status feedback toast / alert
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Guard: Must be ADMIN
  if (!isAdmin) {
    return (
      <Card style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
        <VStack gap={4} style={{ alignItems: 'center' }}>
          <Lock size={48} color="var(--color-destructive)" />
          <Heading level={2}>Không có quyền truy cập</Heading>
          <Text color="secondary">
            Bạn cần tài khoản có vai trò <b>ADMIN</b> (ví dụ: nidhong99@gmail.com) để truy cập Bảng Quản Trị Hệ Thống.
          </Text>
        </VStack>
      </Card>
    );
  }

  // KPI Calculations
  const totalVenuesCount = venues.length;
  const totalUsersCount = allUsers.length;
  const adminCount = allUsers.filter(u => u.role === 'ADMIN' || (u.email || '').toLowerCase() === 'nidhong99@gmail.com').length;
  const hostCount = allUsers.filter(u => u.role === 'HOST').length;
  const playerCount = allUsers.filter(u => u.role === 'PLAYER').length;
  const totalEventsCount = events.length;
  const activeEventsCount = events.filter(e => e.status === 'OPEN' || e.status === 'FULL').length;
  const avgReliability = allUsers.length > 0
    ? Math.round(allUsers.reduce((acc, u) => acc + (u.reliability_score ?? 100), 0) / allUsers.length)
    : 100;

  // Handlers for Venue Modal
  const handleOpenAddVenue = () => {
    setEditingVenue(null);
    setVenueName('');
    setVenueAddress('');
    setVenueDistrictCode('HN_BD');
    setVenueMapsUrl('');
    setVenueImageUrl('');
    setVenueGalleryImages([]);
    setNewGalleryUrlInput('');
    setCoverImageError(false);
    setIsVenueModalOpen(true);
  };

  const handleOpenEditVenue = (v: Venue) => {
    setEditingVenue(v);
    setVenueName(v.name);
    setVenueAddress(v.address);
    setVenueDistrictCode(v.district_code || 'HN_BD');
    setVenueMapsUrl(v.maps_url || '');
    setVenueImageUrl(v.image_url || '');
    
    // Nạp tối đa 10 ảnh hiện có từ gallery_images hoặc fallback từ image_url
    const rawGallery = (v.gallery_images && v.gallery_images.length > 0)
      ? v.gallery_images
      : (v.image_url ? [v.image_url] : []);
    setVenueGalleryImages(rawGallery.slice(0, 10));
    setNewGalleryUrlInput('');
    setCoverImageError(false);
    setIsVenueModalOpen(true);
  };

  const handleSetAsCover = (url: string) => {
    setVenueImageUrl(url);
    setCoverImageError(false);
  };

  const handleAddGalleryImage = () => {
    const trimmed = newGalleryUrlInput.trim();
    if (!trimmed) return;
    if (venueGalleryImages.length >= 10) {
      alert('Mỗi sân chỉ lưu trữ tối đa 10 ảnh mới nhất!');
      return;
    }
    if (venueGalleryImages.includes(trimmed)) {
      alert('Link ảnh này đã có trong bộ sưu tập sân.');
      return;
    }
    const updated = [...venueGalleryImages, trimmed].slice(0, 10);
    setVenueGalleryImages(updated);
    setNewGalleryUrlInput('');
    // Nếu chưa có ảnh bìa thì tự động chọn ảnh này làm bìa
    if (!venueImageUrl.trim()) {
      setVenueImageUrl(trimmed);
      setCoverImageError(false);
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const removedUrl = venueGalleryImages[indexToRemove];
    const updated = venueGalleryImages.filter((_, idx) => idx !== indexToRemove);
    setVenueGalleryImages(updated);

    // Nếu ảnh vừa xóa trùng với ảnh bìa thì cập nhật sang ảnh đầu tiên còn lại
    if (venueImageUrl.trim() === removedUrl) {
      setVenueImageUrl(updated[0] || '');
      setCoverImageError(false);
    }
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim() || !venueAddress.trim()) {
      alert('Vui lòng nhập tên sân và địa chỉ');
      return;
    }

    try {
      // Chuẩn hóa danh sách tối đa 10 ảnh
      let finalGallery = [...venueGalleryImages];
      const currentCover = venueImageUrl.trim();
      if (currentCover && !finalGallery.includes(currentCover)) {
        finalGallery.unshift(currentCover);
      }
      finalGallery = finalGallery.slice(0, 10);

      const payloadCover = currentCover || (finalGallery[0] || undefined);

      if (editingVenue) {
        await updateVenue(editingVenue.id, {
          name: venueName.trim(),
          address: venueAddress.trim(),
          district_code: venueDistrictCode,
          maps_url: venueMapsUrl.trim(),
          image_url: payloadCover,
          gallery_images: finalGallery,
        });
        showSuccess(`Đã cập nhật thông tin sân "${venueName}" thành công!`);
      } else {
        await createVenue({
          name: venueName.trim(),
          address: venueAddress.trim(),
          district_code: venueDistrictCode,
          maps_url: venueMapsUrl.trim(),
          image_url: payloadCover,
          gallery_images: finalGallery,
        });
        showSuccess(`Đã thêm sân "${venueName}" vào cơ sở dữ liệu!`);
      }
      setIsVenueModalOpen(false);
    } catch (err) {
      console.error('Save venue error:', err);
      alert('Lưu sân bãi thất bại: ' + (err as Error).message);
    }
  };

  const handleDeleteVenue = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sân "${name}" khỏi cơ sở dữ liệu?`)) {
      try {
        await deleteVenue(id);
        showSuccess(`Đã xóa sân "${name}" thành công!`);
      } catch (err) {
        alert('Lỗi khi xóa sân: ' + (err as Error).message);
      }
    }
  };

  // Filtered lists
  const filteredVenues = venues.filter(v => {
    const d = DISTRICTS.find(item => item.code === v.district_code);
    const dName = d ? d.name : (v.district || '');
    const cityName = d ? (d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'Hồ Chí Minh' : 'Đà Nẵng') : (v.city || '');
    return (
      v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.address.toLowerCase().includes(venueSearch.toLowerCase()) ||
      dName.toLowerCase().includes(venueSearch.toLowerCase()) ||
      cityName.toLowerCase().includes(venueSearch.toLowerCase())
    );
  });

  const filteredUsers = allUsers.filter(u => {
    const matchesQuery = (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
    if (!matchesQuery) return false;
    if (userRoleFilter === 'ALL') return true;
    if (userRoleFilter === 'ADMIN') return u.role === 'ADMIN' || (u.email || '').toLowerCase() === 'nidhong99@gmail.com';
    return u.role === userRoleFilter;
  });

  const filteredEvents = events.filter(e => {
    const matchesQuery = e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.venue_name.toLowerCase().includes(eventSearch.toLowerCase());
    if (!matchesQuery) return false;
    if (eventStatusFilter === 'ALL') return true;
    return e.status === eventStatusFilter;
  });

  const disputedUsers = allUsers.filter(u => (u.reliability_score ?? 100) < 95 || (u.total_no_shows ?? 0) > 0);

  // Paginated slices
  const venueTotal = filteredVenues.length;
  const safeVenuePage = Math.min(venuePage, Math.max(1, Math.ceil(venueTotal / venuePageSize)));
  const venueStartIdx = (safeVenuePage - 1) * venuePageSize;
  const paginatedVenues = filteredVenues.slice(venueStartIdx, venueStartIdx + venuePageSize);

  const userTotal = filteredUsers.length;
  const safeUserPage = Math.min(userPage, Math.max(1, Math.ceil(userTotal / userPageSize)));
  const userStartIdx = (safeUserPage - 1) * userPageSize;
  const paginatedUsers = filteredUsers.slice(userStartIdx, userStartIdx + userPageSize);

  const eventTotal = filteredEvents.length;
  const safeEventPage = Math.min(eventPage, Math.max(1, Math.ceil(eventTotal / eventPageSize)));
  const eventStartIdx = (safeEventPage - 1) * eventPageSize;
  const paginatedEvents = filteredEvents.slice(eventStartIdx, eventStartIdx + eventPageSize);

  const disputeTotal = disputedUsers.length;
  const safeDisputePage = Math.min(disputePage, Math.max(1, Math.ceil(disputeTotal / disputePageSize)));
  const disputeStartIdx = (safeDisputePage - 1) * disputePageSize;
  const paginatedDisputes = disputedUsers.slice(disputeStartIdx, disputeStartIdx + disputePageSize);

  return (
    <VStack gap={5} style={{ width: '100%' }}>
      {/* Action toast */}
      {actionSuccessMsg && (
        <Card
          style={{
            padding: 'var(--spacing-3) var(--spacing-4)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-element)',
          }}
        >
          <HStack gap={2} style={{ alignItems: 'center' }}>
            <CheckCircle2 size={16} color="var(--color-success)" />
            <Text style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {actionSuccessMsg}
            </Text>
          </HStack>
        </Card>
      )}

      {/* 2. Top KPI Cards */}
      <HStack gap={3} style={{ width: '100%', flexWrap: 'wrap' }}>
        {/* KPI 1: Venues */}
        <Card style={{ flex: '1 1 200px', padding: 'var(--spacing-4)' }}>
          <VStack gap={1}>
            <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="supporting" color="secondary" weight="semibold">
                SÂN BÃI (DATABASE)
              </Text>
              <MapPin size={18} color="var(--color-icon-accent)" />
            </HStack>
            <Heading level={2} style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {totalVenuesCount}
            </Heading>
            <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
              Sân có sẵn trong bộ chọn tạo kèo
            </Text>
          </VStack>
        </Card>

        {/* KPI 2: Users */}
        <Card style={{ flex: '1 1 200px', padding: 'var(--spacing-4)' }}>
          <VStack gap={1}>
            <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="supporting" color="secondary" weight="semibold">
                NGƯỜI DÙNG HỆ THỐNG
              </Text>
              <Users size={18} color="var(--color-icon-accent)" />
            </HStack>
            <Heading level={2} style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {totalUsersCount}
            </Heading>
            <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
              {adminCount} Admin · {hostCount} Host · {playerCount} Player
            </Text>
          </VStack>
        </Card>

        {/* KPI 3: Events */}
        <Card style={{ flex: '1 1 200px', padding: 'var(--spacing-4)' }}>
          <VStack gap={1}>
            <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="supporting" color="secondary" weight="semibold">
                KÈO ĐẤU TOÀN MẠNG
              </Text>
              <Calendar size={18} color="var(--color-icon-accent)" />
            </HStack>
            <Heading level={2} style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {totalEventsCount}
            </Heading>
            <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
              {activeEventsCount} kèo đang mở đăng ký
            </Text>
          </VStack>
        </Card>

        {/* KPI 4: Reliability */}
        <Card style={{ flex: '1 1 200px', padding: 'var(--spacing-4)' }}>
          <VStack gap={1}>
            <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="supporting" color="secondary" weight="semibold">
                ĐỘ UY TÍN BÌNH QUÂN
              </Text>
              <Award size={18} color="var(--color-icon-accent)" />
            </HStack>
            <Heading level={2} style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {avgReliability}%
            </Heading>
            <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
              {disputedUsers.length} thành viên có cảnh báo
            </Text>
          </VStack>
        </Card>
      </HStack>

      {/* 3. Sub-Tab Navigation */}
      <TabList
        value={activeSubTab}
        onChange={(val) => setActiveSubTab(val as AdminSubTab)}
        hasDivider
        size="md"
      >
        <Tab
          value="venues"
          label="Quản lý Sân bãi"
          endContent={<Badge variant="neutral" label={String(venues.length)} />}
        />
        <Tab
          value="users"
          label="Phân quyền Người dùng"
          endContent={<Badge variant="neutral" label={String(allUsers.length)} />}
        />
        <Tab
          value="events"
          label="Kèo toàn hệ thống"
          endContent={<Badge variant="neutral" label={String(events.length)} />}
        />
        <Tab
          value="reliability"
          label="Giám sát Uy tín & Khiếu nại"
          endContent={<Badge variant="neutral" label={String(disputedUsers.length)} />}
        />
      </TabList>

      {/* 4. Tab 1: VENUES MANAGEMENT */}
      {activeSubTab === 'venues' && (
        <VStack gap={4} style={{ width: '100%' }}>
          {/* Toolbar */}
          <HStack gap={3} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <HStack
              gap={2}
              style={{
                alignItems: 'center',
                padding: 'var(--spacing-2) var(--spacing-3)',
                background: 'var(--color-background-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-element)',
                minWidth: '280px',
              }}
            >
              <Search size={16} color="var(--color-icon-secondary)" />
              <input
                type="text"
                placeholder="Tìm kiếm sân theo tên, quận, địa chỉ..."
                value={venueSearch}
                onChange={(e) => {
                  setVenueSearch(e.target.value);
                  setVenuePage(1);
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '13px',
                }}
              />
            </HStack>

            <Button
              variant="primary"
              size="md"
              label="Thêm mới"
              onClick={handleOpenAddVenue}
            />
          </HStack>

          {/* Venues Table Card */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {filteredVenues.length === 0 ? (
              <VStack gap={2} style={{ padding: 'var(--spacing-6)', alignItems: 'center' }}>
                <Text color="secondary">Không tìm thấy sân bãi nào phù hợp.</Text>
                <Button size="sm" variant="secondary" label="Thêm sân mới ngay" onClick={handleOpenAddVenue} />
              </VStack>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-background-muted)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: 'var(--spacing-3)', width: '90px', minWidth: '90px', whiteSpace: 'nowrap' }}>Ảnh bìa</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Tên sân</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Địa chỉ</th>
                    <th style={{ padding: 'var(--spacing-3)', whiteSpace: 'nowrap', width: '130px' }}>Link vị trí</th>
                    <th style={{ padding: 'var(--spacing-3)', textAlign: 'right', whiteSpace: 'nowrap', width: '130px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVenues.map((v) => (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: 'var(--spacing-3)', width: '100px', minWidth: '100px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {v.image_url ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewVenue(v);
                              setPreviewVenueActiveIndex(0);
                            }}
                            title="Bấm để xem toàn bộ ảnh thực tế của sân"
                            style={{
                              background: 'var(--color-surface-sunken)',
                              border: '1px solid var(--color-border)',
                              padding: 0,
                              margin: 0,
                              cursor: 'pointer',
                              position: 'relative',
                              display: 'block',
                              width: '60px',
                              height: '60px',
                              borderRadius: 'var(--radius-container, 12px)',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={v.image_url}
                              alt={v.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                borderRadius: 'var(--radius-container, 12px)',
                              }}
                            />
                            {((v.gallery_images?.length ?? 0) > 1) && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '3px',
                                  right: '3px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 'var(--radius-full)',
                                  lineHeight: '1.2',
                                  pointerEvents: 'none',
                                }}
                              >
                                +{v.gallery_images?.length}
                              </span>
                            )}
                          </button>
                        ) : (
                          <HStack
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: 'var(--radius-container, 12px)',
                              backgroundColor: 'var(--color-surface-sunken)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--color-border)',
                              flexShrink: 0,
                            }}
                          >
                            <MapPin size={22} color="var(--color-icon-tertiary)" />
                          </HStack>
                        )}
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <VStack gap={0}>
                          <Text weight="bold">{v.name}</Text>
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            {(() => {
                              const d = DISTRICTS.find(item => item.code === v.district_code);
                              if (d) {
                                const cityName = d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'TP.HCM' : 'Đà Nẵng';
                                return `${d.name}, ${cityName}`;
                              }
                              return v.district ? `${v.district}, ${v.city || ''}` : v.district_code;
                            })()}
                          </Text>
                          {v.images_count !== undefined && v.images_count !== null && (
                            <HStack style={{ marginTop: '2px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-inner, 4px)',
                                  backgroundColor: 'var(--color-surface-sunken)',
                                  color: 'var(--color-text-secondary)',
                                  border: '1px solid var(--color-border)',
                                  fontWeight: 500,
                                }}
                              >
                                {v.images_count > 10
                                  ? `Google: ${v.images_count} ảnh • Quản lý 10 ảnh`
                                  : `Google: ${v.images_count} ảnh • Lấy toàn bộ`}
                              </span>
                            </HStack>
                          )}
                        </VStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Text>{v.address}</Text>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)', whiteSpace: 'nowrap', width: '130px' }}>
                        {v.maps_url ? (
                          <HStack
                            gap={1}
                            style={{
                              alignItems: 'center',
                              cursor: 'pointer',
                              color: 'var(--color-text-accent)',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                            }}
                            onClick={() => window.open(v.maps_url, '_blank')}
                          >
                            <ExternalLink size={13} style={{ flexShrink: 0 }} />
                            <Text style={{ fontSize: '13px', color: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                              Xem vị trí
                            </Text>
                          </HStack>
                        ) : (
                          <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                            —
                          </Text>
                        )}
                      </td>
                      <td style={{ padding: 'var(--spacing-3)', textAlign: 'right', whiteSpace: 'nowrap', width: '130px' }}>
                        <HStack gap={1} style={{ justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            label="Sửa"
                            onClick={() => handleOpenEditVenue(v)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            label="Xóa"
                            onClick={() => handleDeleteVenue(v.id, v.name)}
                          />
                        </HStack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination footer */}
            {venueTotal > 0 && (
              <HStack
                gap={2}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-background-surface)',
                  flexWrap: 'wrap',
                }}
              >
                <Text type="supporting" color="secondary" style={{ fontSize: '13px' }}>
                  Hiển thị {venueStartIdx + 1} - {Math.min(venueStartIdx + venuePageSize, venueTotal)} trong {venueTotal} sân
                </Text>
                <Pagination
                  page={safeVenuePage}
                  onChange={setVenuePage}
                  totalItems={venueTotal}
                  pageSize={venuePageSize}
                  onPageSizeChange={(newSize) => {
                    setVenuePageSize(newSize);
                    setVenuePage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  variant="pages"
                  size="sm"
                />
              </HStack>
            )}
          </Card>
        </VStack>
      )}

      {/* 5. Tab 2: USERS & ROLES MANAGEMENT */}
      {activeSubTab === 'users' && (
        <VStack gap={4} style={{ width: '100%' }}>
          {/* User Toolbar */}
          <HStack gap={3} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <HStack
              gap={2}
              style={{
                alignItems: 'center',
                padding: 'var(--spacing-2) var(--spacing-3)',
                background: 'var(--color-background-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-element)',
                minWidth: '280px',
              }}
            >
              <Search size={16} color="var(--color-icon-secondary)" />
              <input
                type="text"
                placeholder="Tìm người dùng theo tên hoặc email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '13px',
                }}
              />
            </HStack>

            <HStack gap={2} style={{ alignItems: 'center' }}>
              <Text type="supporting" weight="medium">Lọc vai trò:</Text>
              <Select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value as any);
                  setUserPage(1);
                }}
                style={{
                  fontSize: '13px',
                }}
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="HOST">Host</option>
                <option value="PLAYER">Player</option>
              </Select>

              <Button
                size="sm"
                variant="secondary"
                label="Đồng bộ từ Supabase"
                onClick={async () => {
                  await refreshProfiles();
                  showSuccess('Đã đồng bộ vai trò mới nhất từ cơ sở dữ liệu Supabase!');
                }}
              />
            </HStack>
          </HStack>

          {/* Users Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-background-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--spacing-3)' }}>Thành viên</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Email</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Phân quyền vai trò</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Huy hiệu Host</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Trận đấu</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Điểm uy tín</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => {
                  const isCurrentAdmin = (u.email || '').toLowerCase() === 'nidhong99@gmail.com';
                  const displayRole: UserRole = u.role || (isCurrentAdmin ? 'ADMIN' : 'PLAYER');
                  const score = u.reliability_score ?? 100;
                  const isLowScore = score < 90;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: isLowScore ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <HStack gap={2} style={{ alignItems: 'center' }}>
                          <Avatar size="sm" src={u.avatar_url} name={u.full_name || 'User'} />
                          <VStack gap={0}>
                            <Text weight="bold">{u.full_name || 'Vận động viên'}</Text>
                            <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                              ID: {u.id.slice(0, 8)}...
                            </Text>
                          </VStack>
                        </HStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>{u.email}</Text>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        {/* Interactive Role Switcher Dropdown */}
                        <Select
                          value={displayRole}
                          onChange={async (e) => {
                            const newRole = e.target.value as UserRole;
                            try {
                              await updateUserRole(u.id, newRole, u.is_verified_host);
                              showSuccess(`Đã lưu vai trò ${newRole} cho ${u.full_name || u.email}!`);
                            } catch (err) {
                              alert('Lỗi cập nhật quyền: ' + (err as Error).message);
                            }
                          }}
                          style={{
                            backgroundColor:
                              displayRole === 'ADMIN'
                                ? 'rgba(99, 102, 241, 0.1)'
                                : displayRole === 'HOST'
                                  ? 'rgba(234, 179, 8, 0.1)'
                                  : 'var(--color-background-surface)',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="HOST">HOST</option>
                          <option value="ADMIN">ADMIN</option>
                        </Select>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        {/* Verified Host Badge Toggle */}
                        {displayRole === 'HOST' || displayRole === 'ADMIN' ? (
                          <HStack
                            gap={1}
                            style={{
                              alignItems: 'center',
                              cursor: 'pointer',
                            }}
                            onClick={async () => {
                              try {
                                await updateUserRole(u.id, displayRole, !u.is_verified_host);
                                showSuccess(`Đã cập nhật tích xanh cho ${u.full_name}!`);
                              } catch (err) {
                                alert('Lỗi: ' + (err as Error).message);
                              }
                            }}
                          >
                            <Badge
                              variant={u.is_verified_host ? 'green' : 'neutral'}
                              label={u.is_verified_host ? '✓ Tích xanh Host' : '⚪ Chưa kích hoạt'}
                            />
                          </HStack>
                        ) : (
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            Chỉ dành cho Host
                          </Text>
                        )}
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <VStack gap={0}>
                          <Text>{u.total_matches_played ?? 0} trận tham gia</Text>
                          {(u.total_no_shows ?? 0) > 0 && (
                            <Text style={{ fontSize: '11px', color: 'var(--color-destructive)', fontWeight: 600 }}>
                              ⚠️ {u.total_no_shows} lần bùng kèo
                            </Text>
                          )}
                        </VStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Badge
                          variant={score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red'}
                          label={`${score}%`}
                        />
                      </td>
                      <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                        <HStack gap={1} style={{ justifyContent: 'flex-end' }}>
                          {score < 100 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              label="Khôi phục 100%"
                              onClick={async () => {
                                if (confirm(`Khôi phục 100% điểm uy tín cho ${u.full_name || u.email}?`)) {
                                  try {
                                    await resetUserReliability(u.id);
                                    showSuccess(`Đã khôi phục 100% uy tín cho ${u.full_name}!`);
                                  } catch (err) {
                                    alert('Lỗi: ' + (err as Error).message);
                                  }
                                }
                              }}
                            />
                          )}
                          {!isCurrentAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              label="Xóa"
                              onClick={async () => {
                                if (confirm(`Bạn có chắc chắn muốn xóa hoàn toàn tài khoản "${u.full_name || u.email}"?`)) {
                                  try {
                                    await deleteUser(u.id);
                                    showSuccess(`Đã xóa vĩnh viễn tài khoản ${u.full_name || u.email}!`);
                                  } catch (err) {
                                    alert('Lỗi khi xóa tài khoản: ' + (err as Error).message);
                                  }
                                }
                              }}
                            />
                          )}
                        </HStack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Users Pagination footer */}
            {userTotal > 0 && (
              <HStack
                gap={2}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-background-surface)',
                  flexWrap: 'wrap',
                }}
              >
                <Text type="supporting" color="secondary" style={{ fontSize: '13px' }}>
                  Hiển thị {userStartIdx + 1} - {Math.min(userStartIdx + userPageSize, userTotal)} trong {userTotal} người dùng
                </Text>
                <Pagination
                  page={safeUserPage}
                  onChange={setUserPage}
                  totalItems={userTotal}
                  pageSize={userPageSize}
                  onPageSizeChange={(newSize) => {
                    setUserPageSize(newSize);
                    setUserPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  variant="pages"
                  size="sm"
                />
              </HStack>
            )}
          </Card>
        </VStack>
      )}

      {/* 6. Tab 3: GLOBAL EVENTS MANAGEMENT */}
      {activeSubTab === 'events' && (
        <VStack gap={4} style={{ width: '100%' }}>
          <HStack gap={3} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <HStack
              gap={2}
              style={{
                alignItems: 'center',
                padding: 'var(--spacing-2) var(--spacing-3)',
                background: 'var(--color-background-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-element)',
                minWidth: '280px',
              }}
            >
              <Search size={16} color="var(--color-icon-secondary)" />
              <input
                type="text"
                placeholder="Tìm kèo theo tên hoặc sân..."
                value={eventSearch}
                onChange={(e) => {
                  setEventSearch(e.target.value);
                  setEventPage(1);
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '13px',
                }}
              />
            </HStack>

            <HStack gap={2} style={{ alignItems: 'center' }}>
              <Text type="supporting" weight="medium">Trạng thái:</Text>
              <Select
                value={eventStatusFilter}
                onChange={(e) => {
                  setEventStatusFilter(e.target.value);
                  setEventPage(1);
                }}
                style={{
                  fontSize: '13px',
                }}
              >
                <option value="ALL">Tất cả kèo</option>
                <option value="OPEN">Mở đăng ký</option>
                <option value="FULL">Đã đủ người</option>
                <option value="COMPLETED">Đã kết thúc</option>
                <option value="CANCELLED">Đã hủy</option>
              </Select>
            </HStack>
          </HStack>

          {/* Events Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-background-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--spacing-3)' }}>Tên kèo & Cấp độ</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Host tổ chức</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Thời gian & Sân</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Số lượng</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Trạng thái</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>Thao tác Admin</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((evt) => {
                  const regCount = evt.registrations?.filter(r => r.status === 'APPROVED').length ?? 0;
                  return (
                    <tr key={evt.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <VStack gap={0}>
                          <Text weight="bold">{evt.title}</Text>
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            {evt.min_skill_level} - {evt.max_skill_level}
                          </Text>
                        </VStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <HStack gap={1} style={{ alignItems: 'center' }}>
                          <Avatar size="sm" src={evt.host?.avatar_url} name={evt.host?.full_name || 'Host'} />
                          <Text>{evt.host?.full_name || evt.host?.email || 'Chủ kèo'}</Text>
                        </HStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <VStack gap={0}>
                          <Text weight="medium">
                            {new Date(evt.start_time).toLocaleDateString('vi-VN')} · {new Date(evt.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            {evt.venue_name} ({evt.court_numbers || 'Sân'})
                          </Text>
                        </VStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Badge
                          variant={regCount >= evt.max_players ? 'red' : 'blue'}
                          label={`${regCount}/${evt.max_players} slot`}
                        />
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Badge
                          variant={
                            evt.status === 'OPEN'
                              ? 'green'
                              : evt.status === 'FULL'
                                ? 'purple'
                                : evt.status === 'CANCELLED'
                                  ? 'red'
                                  : 'neutral'
                          }
                          label={
                            evt.status === 'OPEN'
                              ? 'Mở đăng ký'
                              : evt.status === 'FULL'
                                ? 'Đã full'
                                : evt.status === 'CANCELLED'
                                  ? 'Đã hủy'
                                  : 'Kết thúc'
                          }
                        />
                      </td>
                      <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                        <HStack gap={1} style={{ justifyContent: 'flex-end' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            label="Xem chi tiết"
                            onClick={() => onSelectEvent(evt)}
                          />
                          {evt.status !== 'CANCELLED' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              label="Hủy kèo"
                              onClick={async () => {
                                const reason = prompt('Nhập lý do Admin hủy kèo này:');
                                if (reason) {
                                  try {
                                    await cancelEvent(evt.id, `[Admin]: ${reason}`);
                                    showSuccess('Đã hủy kèo thành công!');
                                  } catch (err) {
                                    alert('Lỗi: ' + (err as Error).message);
                                  }
                                }
                              }}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            label="Xóa"
                            onClick={async () => {
                              if (confirm(`Xóa hoàn toàn kèo "${evt.title}" khỏi hệ thống?`)) {
                                try {
                                  await deleteEvent(evt.id);
                                  showSuccess('Đã xóa kèo thành công!');
                                } catch (err) {
                                  alert('Lỗi: ' + (err as Error).message);
                                }
                              }
                            }}
                          />
                        </HStack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Events Pagination footer */}
            {eventTotal > 0 && (
              <HStack
                gap={2}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-background-surface)',
                  flexWrap: 'wrap',
                }}
              >
                <Text type="supporting" color="secondary" style={{ fontSize: '13px' }}>
                  Hiển thị {eventStartIdx + 1} - {Math.min(eventStartIdx + eventPageSize, eventTotal)} trong {eventTotal} kèo
                </Text>
                <Pagination
                  page={safeEventPage}
                  onChange={setEventPage}
                  totalItems={eventTotal}
                  pageSize={eventPageSize}
                  onPageSizeChange={(newSize) => {
                    setEventPageSize(newSize);
                    setEventPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  variant="pages"
                  size="sm"
                />
              </HStack>
            )}
          </Card>
        </VStack>
      )}

      {/* 7. Tab 4: RELIABILITY & DISPUTES */}
      {activeSubTab === 'reliability' && (
        <VStack gap={4} style={{ width: '100%' }}>
          <Card
            style={{
              padding: 'var(--spacing-4)',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <HStack gap={2} style={{ alignItems: 'center' }}>
              <AlertTriangle size={20} color="var(--color-destructive)" />
              <VStack gap={0}>
                <Text weight="bold">Cơ chế bảo vệ sự uy tín của RallyMax</Text>
                <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                  Hệ thống tự động trừ 10 điểm uy tín khi bùng kèo (No-show) hoặc hủy sát giờ (&lt;2 tiếng).
                  Admin có toàn quyền kiểm tra bằng chứng và khôi phục điểm cho thành viên.
                </Text>
              </VStack>
            </HStack>
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {disputedUsers.length === 0 ? (
              <VStack gap={2} style={{ padding: 'var(--spacing-6)', alignItems: 'center' }}>
                <CheckCircle2 size={32} color="#10b981" />
                <Text weight="bold">Tất cả người chơi đều có điểm uy tín rất tốt!</Text>
                <Text color="secondary" style={{ fontSize: '13px' }}>
                  Hiện không có khiếu nại hay vi phạm nào cần giải quyết.
                </Text>
              </VStack>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-background-muted)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: 'var(--spacing-3)' }}>Thành viên</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Email liên hệ</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Điểm hiện tại</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Số lần No-show</th>
                    <th style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>Giải quyết khiếu nại</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDisputes.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <HStack gap={2} style={{ alignItems: 'center' }}>
                          <Avatar size="sm" src={u.avatar_url} name={u.full_name || 'User'} />
                          <Text weight="bold">{u.full_name || 'Vận động viên'}</Text>
                        </HStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Text style={{ fontFamily: 'monospace' }}>{u.email}</Text>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Badge
                          variant={(u.reliability_score ?? 100) >= 90 ? 'yellow' : 'red'}
                          label={`${u.reliability_score ?? 100}%`}
                        />
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Text style={{ color: 'var(--color-destructive)', fontWeight: 600 }}>
                          {u.total_no_shows ?? 0} lần
                        </Text>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="primary"
                          label="Khôi phục 100% điểm uy tín"
                          onClick={async () => {
                            if (confirm(`Xác nhận xóa vi phạm và khôi phục 100% uy tín cho ${u.full_name}?`)) {
                              try {
                                await resetUserReliability(u.id);
                                showSuccess(`Đã khôi phục 100% uy tín cho ${u.full_name}!`);
                              } catch (err) {
                                alert('Lỗi: ' + (err as Error).message);
                              }
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Disputes Pagination footer */}
            {disputeTotal > 0 && (
              <HStack
                gap={2}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-background-surface)',
                  flexWrap: 'wrap',
                }}
              >
                <Text type="supporting" color="secondary" style={{ fontSize: '13px' }}>
                  Hiển thị {disputeStartIdx + 1} - {Math.min(disputeStartIdx + disputePageSize, disputeTotal)} trong {disputeTotal} tài khoản
                </Text>
                <Pagination
                  page={safeDisputePage}
                  onChange={setDisputePage}
                  totalItems={disputeTotal}
                  pageSize={disputePageSize}
                  onPageSizeChange={(newSize) => {
                    setDisputePageSize(newSize);
                    setDisputePage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  variant="pages"
                  size="sm"
                />
              </HStack>
            )}
          </Card>
        </VStack>
      )}

      {/* 8. MODAL: Add / Edit Venue */}
      <Dialog
        isOpen={isVenueModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsVenueModalOpen(false);
        }}
        purpose="form"
        width={660}
        maxHeight="92dvh"
      >
        <Layout
          height="fill"
          header={
            <DialogHeader
              title={editingVenue ? 'Chỉnh Sửa Sân Cầu Lông' : 'Thêm Sân Cầu Lông Mới'}
              subtitle="Thông tin sân sẽ được lưu vào cơ sở dữ liệu và hiển thị trên bộ chọn khi tạo kèo"
              hasDivider={true}
              onOpenChange={(open) => {
                if (!open) setIsVenueModalOpen(false);
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
              }}
            >
              <form onSubmit={handleSaveVenue} id="venue-form">
                <VStack gap={4}>
                  {/* Row 1: Tên sân */}
                  <VStack gap={1}>
                    <Text weight="semibold" style={{ fontSize: '13px' }}>
                      Tên sân cầu lông <span style={{ color: 'var(--color-destructive, #ef4444)' }}>*</span>
                    </Text>
                    <input
                      type="text"
                      required
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Ví dụ: Sân Cầu Lông Cung Thể Thao Quần Ngựa"
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-background-surface)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        height: '38px',
                        width: '100%',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </VStack>

                  {/* Row 2: Địa chỉ & Khu vực */}
                  <HStack gap={3} style={{ width: '100%' }}>
                    <VStack gap={1} style={{ flex: 3 }}>
                      <Text weight="semibold" style={{ fontSize: '13px' }}>
                        Địa chỉ chi tiết <span style={{ color: 'var(--color-destructive, #ef4444)' }}>*</span>
                      </Text>
                      <input
                        type="text"
                        required
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        placeholder="Số 30 Văn Cao, Phường Liễu Giai"
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          borderRadius: 'var(--radius-element)',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-background-surface)',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          height: '38px',
                          width: '100%',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </VStack>

                    <VStack gap={1} style={{ flex: 2 }}>
                      <Text weight="semibold" style={{ fontSize: '13px' }}>
                        Khu vực (Quận / Huyện) <span style={{ color: 'var(--color-destructive, #ef4444)' }}>*</span>
                      </Text>
                      <Select
                        value={venueDistrictCode}
                        onChange={(e) => setVenueDistrictCode(e.target.value)}
                        style={{
                          height: '38px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {DISTRICTS.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name} ({d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'TP.HCM' : 'Đà Nẵng'})
                          </option>
                        ))}
                      </Select>
                    </VStack>
                  </HStack>

                  {/* Row 3: Link Google Maps */}
                  <VStack gap={1} style={{ width: '100%' }}>
                    <Text weight="semibold" style={{ fontSize: '13px' }}>
                      Link vị trí Google Maps (URL)
                    </Text>
                    <input
                      type="url"
                      value={venueMapsUrl}
                      onChange={(e) => setVenueMapsUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-background-surface)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        height: '38px',
                        width: '100%',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </VStack>

                  {/* Row 4: Ảnh Bìa & Khung Xem Trước (Cover Image Preview) */}
                  <VStack gap={2} style={{ width: '100%' }}>
                    <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <HStack gap={2} style={{ alignItems: 'center' }}>
                        <Text weight="semibold" style={{ fontSize: '13px' }}>
                          Ảnh bìa sân (Cover Image)
                        </Text>
                        <Badge variant="blue" label="Hiển thị chính" />
                      </HStack>
                      {venueImageUrl && !coverImageError && (
                        <Button
                          size="sm"
                          variant="ghost"
                          label="Phóng to xem thử"
                          onClick={() => setPreviewCoverModalUrl(venueImageUrl)}
                        />
                      )}
                    </HStack>

                    {/* Khung Xem Trước Ảnh Bìa (Cover Banner Preview) */}
                    <HStack
                      style={{
                        width: '100%',
                        height: '180px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-sunken)',
                        overflow: 'hidden',
                        position: 'relative',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {venueImageUrl && !coverImageError ? (
                        <img
                          src={venueImageUrl}
                          alt="Xem trước ảnh bìa sân"
                          onError={() => setCoverImageError(true)}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <VStack gap={1} style={{ alignItems: 'center', padding: 'var(--spacing-4)', textAlign: 'center' }}>
                          <ImageIcon size={36} color="var(--color-icon-tertiary)" />
                          <Text weight="medium" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {coverImageError ? 'Không thể tải ảnh từ link này (lỗi URL hoặc quyền riêng tư)' : 'Chưa có ảnh bìa sân'}
                          </Text>
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            Dán link URL bên dưới hoặc chọn một ảnh từ thư viện 10 ảnh để đặt làm ảnh bìa
                          </Text>
                        </VStack>
                      )}
                    </HStack>

                    <input
                      type="url"
                      value={venueImageUrl}
                      onChange={(e) => {
                        setVenueImageUrl(e.target.value);
                        setCoverImageError(false);
                      }}
                      placeholder="https://... Link ảnh bìa hoặc chọn từ thư viện bên dưới"
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        borderRadius: 'var(--radius-element)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-background-surface)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        height: '38px',
                        width: '100%',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </VStack>

                  {/* Row 5: Thư viện ảnh sân (Gallery: Tối đa 10 ảnh) */}
                  <VStack
                    gap={3}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--color-surface-sunken)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <HStack gap={2} style={{ alignItems: 'center' }}>
                        <Text weight="semibold" style={{ fontSize: '13px' }}>
                          Thư viện ảnh sân thực tế
                        </Text>
                        <Badge
                          variant={venueGalleryImages.length >= 10 ? 'neutral' : 'blue'}
                          label={`${venueGalleryImages.length}/10 ảnh`}
                        />
                      </HStack>
                      <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                        {editingVenue?.images_count && editingVenue.images_count > 10
                          ? `Google có ${editingVenue.images_count} ảnh • Giới hạn 10 ảnh mới nhất để quản lý`
                          : editingVenue?.images_count
                          ? `Google có ${editingVenue.images_count} ảnh • Lấy toàn bộ ảnh có sẵn`
                          : 'Tối đa 10 ảnh mới nhất • Bấm vào ảnh để đặt làm ảnh bìa'}
                      </Text>
                    </HStack>

                    {/* Thanh thêm link ảnh vào thư viện */}
                    <HStack gap={2} style={{ width: '100%' }}>
                      <input
                        type="url"
                        value={newGalleryUrlInput}
                        onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGalleryImage();
                          }
                        }}
                        placeholder="Dán link URL ảnh thực tế muốn bổ sung vào thư viện..."
                        disabled={venueGalleryImages.length >= 10}
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          borderRadius: 'var(--radius-element)',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-background-surface)',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          height: '36px',
                          flex: 1,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        label="+ Thêm ảnh"
                        isDisabled={venueGalleryImages.length >= 10 || !newGalleryUrlInput.trim()}
                        onClick={handleAddGalleryImage}
                      />
                    </HStack>

                    {/* Lưới các ảnh trong thư viện */}
                    {venueGalleryImages.length === 0 ? (
                      <Text type="supporting" color="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                        Chưa có ảnh trong thư viện. Bạn có thể thêm link ảnh hoặc import từ dữ liệu để lưu tối đa 10 ảnh.
                      </Text>
                    ) : (
                      <HStack gap={2} style={{ flexWrap: 'wrap', width: '100%' }}>
                        {venueGalleryImages.map((imgUrl, idx) => {
                          const isCover = venueImageUrl.trim() === imgUrl.trim();
                          return (
                            <VStack
                              key={`${imgUrl}-${idx}`}
                              gap={1}
                              style={{
                                width: '110px',
                                padding: 'var(--spacing-1)',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-background-surface)',
                                border: isCover ? '2px solid var(--color-primary-base, #3b82f6)' : '1px solid var(--color-border)',
                                position: 'relative',
                                alignItems: 'center',
                              }}
                            >
                              {/* Container Thumbnail */}
                              <button
                                type="button"
                                onClick={() => handleSetAsCover(imgUrl)}
                                title="Bấm để đặt làm ảnh bìa"
                                style={{
                                  width: '100%',
                                  height: '68px',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  borderRadius: 'var(--radius-xs)',
                                  overflow: 'hidden',
                                  background: 'transparent',
                                }}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Ảnh sân ${idx + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              </button>

                              {/* Action buttons */}
                              <HStack gap={1} style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                {isCover ? (
                                  <Badge variant="blue" label="★ Bìa" style={{ fontSize: '10px', padding: '1px 4px' }} />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetAsCover(imgUrl)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      color: 'var(--color-primary-base, #3b82f6)',
                                      fontSize: '11px',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Chọn bìa
                                  </button>
                                )}

                                <HStack gap={1} style={{ alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewCoverModalUrl(imgUrl)}
                                    title="Xem phóng to ảnh này"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      cursor: 'pointer',
                                      color: 'var(--color-icon-secondary)',
                                    }}
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGalleryImage(idx)}
                                    title="Xóa khỏi thư viện"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      cursor: 'pointer',
                                      color: 'var(--color-destructive, #ef4444)',
                                    }}
                                  >
                                    <X size={13} />
                                  </button>
                                </HStack>
                              </HStack>
                            </VStack>
                          );
                        })}
                      </HStack>
                    )}
                  </VStack>

                  <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                    💡 Link Google Maps sẽ cho phép các vận động viên bấm trực tiếp để mở ứng dụng Bản đồ dẫn đường tới sân.
                  </Text>
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
              <HStack gap={2} hAlign="end" style={{ justifyContent: 'flex-end', width: '100%' }}>
                <Button
                  size="md"
                  variant="ghost"
                  label="Hủy bỏ"
                  onClick={() => setIsVenueModalOpen(false)}
                />
                <Button
                  size="md"
                  variant="primary"
                  label={editingVenue ? 'Lưu thay đổi' : 'Tạo sân mới'}
                  onClick={() => {
                    const form = document.getElementById('venue-form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>

      {/* 9. MODAL: Preview Toàn Bộ Ảnh Dữ Liệu Của Sân */}
      <Dialog
        isOpen={!!previewVenue}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewVenue(null);
            setPreviewVenueActiveIndex(0);
          }
        }}
        purpose="info"
        width={760}
        maxHeight="92dvh"
      >
        <Layout
          height="fill"
          header={
            <DialogHeader
              title={previewVenue?.name || 'Ảnh Sân Thực Tế'}
              subtitle={
                previewVenue
                  ? `${previewVenue.address} • ${
                      (previewVenue.images_count && previewVenue.images_count > 10) || ((previewVenue.gallery_images?.length ?? 0) > 10)
                        ? `Google Maps có ${previewVenue.images_count || 'nhiều'} ảnh (Đang hiển thị 10 ảnh mới nhất để quản lý)`
                        : `Đang hiển thị toàn bộ ${(previewVenue.gallery_images?.length || 1)} ảnh có sẵn của sân`
                    }`
                  : 'Toàn bộ hình ảnh thực tế được lưu trữ trong hệ thống'
              }
              hasDivider={true}
              onOpenChange={(open) => {
                if (!open) {
                  setPreviewVenue(null);
                  setPreviewVenueActiveIndex(0);
                }
              }}
            />
          }
          content={
            <LayoutContent isScrollable={true} padding={4} style={{ overflowY: 'auto' }}>
              {(() => {
                const rawGallery = previewVenue ? (
                  (previewVenue.gallery_images && previewVenue.gallery_images.length > 0)
                    ? previewVenue.gallery_images
                    : (previewVenue.image_url ? [previewVenue.image_url] : [])
                ) : [];

                // Sân nhiều hơn 10 ảnh: lấy 10 ảnh mới nhất để quản lý; Sân ít hơn 10 ảnh: lấy toàn bộ ảnh có sẵn
                const gallery = rawGallery.length > 10 ? rawGallery.slice(0, 10) : rawGallery;

                const currentImg = gallery[previewVenueActiveIndex] || previewVenue?.image_url;

                return (
                  <VStack gap={4} style={{ width: '100%' }}>
                    {/* Khung ảnh chính lớn */}
                    <VStack gap={2} style={{ width: '100%' }}>
                      <HStack
                        style={{
                          width: '100%',
                          height: '380px',
                          borderRadius: 'var(--radius-lg)',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: 'var(--color-surface-sunken)',
                          border: '1px solid var(--color-border)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {currentImg ? (
                          <img
                            src={currentImg}
                            alt={previewVenue?.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <VStack gap={1} style={{ alignItems: 'center' }}>
                            <ImageIcon size={48} color="var(--color-icon-tertiary)" />
                            <Text color="secondary">Không có ảnh hiển thị</Text>
                          </VStack>
                        )}

                        {/* Nút chuyển ảnh Trái / Phải nếu có nhiều ảnh */}
                        {gallery.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewVenueActiveIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))}
                              title="Ảnh trước"
                              style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0, 0, 0, 0.65)',
                                border: 'none',
                                color: '#ffffff',
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <ChevronLeft size={22} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewVenueActiveIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))}
                              title="Ảnh kế tiếp"
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0, 0, 0, 0.65)',
                                border: 'none',
                                color: '#ffffff',
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <ChevronRight size={22} />
                            </button>
                          </>
                        )}

                        {/* Badge đếm ảnh */}
                        {gallery.length > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '12px',
                              right: '12px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                            }}
                          >
                            Ảnh {previewVenueActiveIndex + 1} / {gallery.length}
                          </span>
                        )}
                      </HStack>
                    </VStack>

                    {/* Dải thumbnail bên dưới hiển thị đầy đủ tất cả các ảnh sân có */}
                    {gallery.length > 0 && (
                      <VStack gap={2} style={{ width: '100%' }}>
                        <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text weight="semibold" style={{ fontSize: '13px' }}>
                            Tất cả ảnh của sân ({gallery.length} ảnh)
                          </Text>
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            Bấm vào thumbnail bất kỳ để xem phóng to
                          </Text>
                        </HStack>

                        <HStack
                          gap={2}
                          style={{
                            width: '100%',
                            overflowX: 'auto',
                            paddingBottom: 'var(--spacing-2)',
                            scrollbarWidth: 'thin',
                          }}
                        >
                          {gallery.map((imgUrl, idx) => {
                            const isActive = idx === previewVenueActiveIndex;
                            return (
                              <button
                                key={`${imgUrl}-${idx}`}
                                type="button"
                                onClick={() => setPreviewVenueActiveIndex(idx)}
                                title={`Xem ảnh ${idx + 1}`}
                                style={{
                                  padding: 0,
                                  margin: 0,
                                  background: 'transparent',
                                  border: isActive
                                    ? '2px solid var(--color-primary-base, #3b82f6)'
                                    : '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius-sm)',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  width: '80px',
                                  height: '60px',
                                  flexShrink: 0,
                                  opacity: isActive ? 1 : 0.75,
                                }}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Ảnh ${idx + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              </button>
                            );
                          })}
                        </HStack>
                      </VStack>
                    )}
                  </VStack>
                );
              })()}
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider={true} style={{ background: 'var(--color-background-surface)' }}>
              <HStack gap={2} hAlign="end" style={{ justifyContent: 'flex-end', width: '100%' }}>
                <Button
                  size="md"
                  variant="primary"
                  label="Đóng"
                  onClick={() => {
                    setPreviewVenue(null);
                    setPreviewVenueActiveIndex(0);
                  }}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>

      {/* 10. MODAL: Preview Ảnh Bìa Đơn (Từ Form Modal Sân) */}
      <Dialog
        isOpen={!!previewCoverModalUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewCoverModalUrl(null);
        }}
        purpose="info"
        width={760}
        maxHeight="90dvh"
      >
        <Layout
          height="fill"
          header={
            <DialogHeader
              title="Xem Trước Ảnh Sân Thực Tế"
              subtitle="Hình ảnh thực tế hiển thị cho người chơi trên giao diện RallyMax"
              hasDivider={true}
              onOpenChange={(open) => {
                if (!open) setPreviewCoverModalUrl(null);
              }}
            />
          }
          content={
            <LayoutContent padding={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {previewCoverModalUrl && (
                <HStack
                  style={{
                    width: '100%',
                    maxHeight: '65dvh',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-surface-sunken)',
                  }}
                >
                  <img
                    src={previewCoverModalUrl}
                    alt="Xem ảnh sân phóng to"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '65dvh',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </HStack>
              )}
            </LayoutContent>
          }
          footer={
            <LayoutFooter
              hasDivider={true}
              style={{ background: 'var(--color-background-surface)' }}
            >
              <HStack gap={2} hAlign="end" style={{ justifyContent: 'flex-end', width: '100%' }}>
                <Button
                  size="md"
                  variant="primary"
                  label="Đóng"
                  onClick={() => setPreviewCoverModalUrl(null)}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    </VStack>
  );
};
