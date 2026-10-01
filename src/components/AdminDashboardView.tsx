import React, { useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import {
  Shield,
  ShieldCheck,
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Venue, Event, Profile, UserRole } from '../types/database';
import { MOCK_DISTRICTS } from '../data/mockData';

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

  // Venue Add / Edit Modal state
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueDistrictCode, setVenueDistrictCode] = useState('HN_BD');
  const [venueTotalCourts, setVenueTotalCourts] = useState<number>(4);
  const [venueMapsUrl, setVenueMapsUrl] = useState('');
  const [venuePhone, setVenuePhone] = useState('');
  const [venuePriceRange, setVenuePriceRange] = useState('');

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
    setVenueTotalCourts(6);
    setVenueMapsUrl('');
    setVenuePhone('');
    setVenuePriceRange('70.000đ - 120.000đ/giờ');
    setIsVenueModalOpen(true);
  };

  const handleOpenEditVenue = (v: Venue) => {
    setEditingVenue(v);
    setVenueName(v.name);
    setVenueAddress(v.address);
    setVenueDistrictCode(v.district_code || 'HN_BD');
    setVenueTotalCourts(v.total_courts);
    setVenueMapsUrl(v.maps_url || '');
    setVenuePhone(v.contact_phone || '');
    setVenuePriceRange(v.price_range || '');
    setIsVenueModalOpen(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim() || !venueAddress.trim()) {
      alert('Vui lòng nhập tên sân và địa chỉ');
      return;
    }

    try {
      if (editingVenue) {
        await updateVenue(editingVenue.id, {
          name: venueName.trim(),
          address: venueAddress.trim(),
          district_code: venueDistrictCode,
          total_courts: Number(venueTotalCourts) || 1,
          maps_url: venueMapsUrl.trim(),
          contact_phone: venuePhone.trim(),
          price_range: venuePriceRange.trim(),
        });
        showSuccess(`Đã cập nhật thông tin sân "${venueName}" thành công!`);
      } else {
        await createVenue({
          name: venueName.trim(),
          address: venueAddress.trim(),
          district_code: venueDistrictCode,
          total_courts: Number(venueTotalCourts) || 1,
          maps_url: venueMapsUrl.trim(),
          contact_phone: venuePhone.trim(),
          price_range: venuePriceRange.trim(),
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
    const d = MOCK_DISTRICTS.find(item => item.code === v.district_code);
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

  const disputedUsers = allUsers.filter(u => (u.reliability_score ?? 100) < 95 || (u.no_show_count ?? 0) > 0);

  return (
    <VStack gap={5} style={{ width: '100%' }}>
      {/* 1. Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          padding: 'var(--spacing-5)',
          borderRadius: 'var(--radius-container)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <HStack gap={3} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <HStack gap={3} style={{ alignItems: 'center' }}>
            <VStack
              gap={0}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-element)',
                background: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={28} color="#a5b4fc" />
            </VStack>
            <VStack gap={0}>
              <HStack gap={2} style={{ alignItems: 'center' }}>
                <Heading level={2} style={{ color: '#ffffff', margin: 0 }}>
                  Trung Tâm Quản Trị Hệ Thống (Admin Control)
                </Heading>
                <Badge variant="purple" label="Super Admin" />
              </HStack>
              <Text style={{ color: '#c7d2fe', fontSize: '13px' }}>
                Quản lý trực quan cơ sở dữ liệu Supabase: Sân bãi, Người dùng, Kèo đấu & Uy tín
              </Text>
            </VStack>
          </HStack>

          <HStack gap={2} style={{ alignItems: 'center' }}>
            <Badge
              variant={isRealSupabase ? 'green' : 'yellow'}
              label={isRealSupabase ? '🟢 Supabase Realtime' : '🟡 Local Storage'}
            />
            <Button
              variant="primary"
              size="sm"
              label="+ Tạo Kèo Mới (Quyền Host/Admin)"
              onClick={onOpenCreateEvent}
              style={{
                background: 'var(--color-primary)',
                fontWeight: 600,
              }}
            />
          </HStack>
        </HStack>

        {/* Action toast */}
        {actionSuccessMsg && (
          <HStack
            gap={2}
            style={{
              marginTop: 'var(--spacing-3)',
              padding: 'var(--spacing-2) var(--spacing-3)',
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: 'var(--radius-element)',
              alignItems: 'center',
            }}
          >
            <CheckCircle2 size={16} color="#34d399" />
            <Text style={{ color: '#ecfdf5', fontSize: '13px', fontWeight: 500 }}>
              {actionSuccessMsg}
            </Text>
          </HStack>
        )}
      </Card>

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
      <HStack
        gap={2}
        style={{
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--spacing-2)',
          width: '100%',
          overflowX: 'auto',
        }}
      >
        <Button
          variant={activeSubTab === 'venues' ? 'primary' : 'ghost'}
          size="sm"
          label={`Quản lý Sân bãi (${venues.length})`}
          onClick={() => setActiveSubTab('venues')}
        />
        <Button
          variant={activeSubTab === 'users' ? 'primary' : 'ghost'}
          size="sm"
          label={`Phân quyền Người dùng (${allUsers.length})`}
          onClick={() => setActiveSubTab('users')}
        />
        <Button
          variant={activeSubTab === 'events' ? 'primary' : 'ghost'}
          size="sm"
          label={`Kèo toàn hệ thống (${events.length})`}
          onClick={() => setActiveSubTab('events')}
        />
        <Button
          variant={activeSubTab === 'reliability' ? 'primary' : 'ghost'}
          size="sm"
          label={`Giám sát Uy tín & Khiếu nại (${disputedUsers.length})`}
          onClick={() => setActiveSubTab('reliability')}
        />
      </HStack>

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
                onChange={(e) => setVenueSearch(e.target.value)}
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
              <Button
                variant="secondary"
                size="sm"
                label="Đồng bộ Supabase"
                onClick={async () => {
                  await refreshVenues();
                  showSuccess('Đã đồng bộ lại danh sách sân từ Supabase!');
                }}
              />
              <Button
                variant="primary"
                size="md"
                label="Thêm mới"
                onClick={handleOpenAddVenue}
              />
            </HStack>
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
                    <th style={{ padding: 'var(--spacing-3)' }}>Tên sân</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Địa chỉ & Maps</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Quy mô</th>
                    <th style={{ padding: 'var(--spacing-3)' }}>Giá tham khảo</th>
                    <th style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map((v) => (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <VStack gap={0}>
                          <Text weight="bold">{v.name}</Text>
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            {(() => {
                              const d = MOCK_DISTRICTS.find(item => item.code === v.district_code);
                              if (d) {
                                const cityName = d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'TP.HCM' : 'Đà Nẵng';
                                return `${d.name}, ${cityName}`;
                              }
                              return v.district ? `${v.district}, ${v.city || ''}` : v.district_code;
                            })()}
                          </Text>
                        </VStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <VStack gap={0}>
                          <Text>{v.address}</Text>
                          {v.maps_url ? (
                            <HStack
                              gap={1}
                              style={{
                                alignItems: 'center',
                                cursor: 'pointer',
                                color: 'var(--color-text-accent)',
                              }}
                              onClick={() => window.open(v.maps_url, '_blank')}
                            >
                              <ExternalLink size={12} />
                              <Text style={{ fontSize: '11px', color: 'inherit' }}>
                                Xem vị trí trên Google Maps
                              </Text>
                            </HStack>
                          ) : (
                            <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                              Chưa có link Maps
                            </Text>
                          )}
                        </VStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <Badge variant="blue" label={`${v.total_courts} sân cầu`} />
                      </td>
                      <td style={{ padding: 'var(--spacing-3)' }}>
                        <VStack gap={0}>
                          <Text weight="medium">{v.price_range || '60.000đ - 100.000đ/h'}</Text>
                          {v.contact_phone && (
                            <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                              📞 {v.contact_phone}
                            </Text>
                          )}
                        </VStack>
                      </td>
                      <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                        <HStack gap={1} style={{ justifyContent: 'flex-end' }}>
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
                onChange={(e) => setUserSearch(e.target.value)}
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
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                style={{
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background-surface)',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">🛡️ Admin</option>
                <option value="HOST">👑 Host</option>
                <option value="PLAYER">🏸 Player</option>
              </select>

              <Button
                size="sm"
                variant="secondary"
                label="🔄 Đồng bộ từ Supabase"
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
                {filteredUsers.map((u) => {
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
                        <select
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
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-element)',
                            border: '1px solid var(--color-border)',
                            backgroundColor:
                              displayRole === 'ADMIN'
                                ? 'rgba(99, 102, 241, 0.1)'
                                : displayRole === 'HOST'
                                  ? 'rgba(234, 179, 8, 0.1)'
                                  : 'var(--color-background-surface)',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="PLAYER">🏸 PLAYER</option>
                          <option value="HOST">👑 HOST</option>
                          <option value="ADMIN">🛡️ ADMIN</option>
                        </select>
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
                          <Text>{u.matches_played ?? 0} trận tham gia</Text>
                          {(u.no_show_count ?? 0) > 0 && (
                            <Text style={{ fontSize: '11px', color: 'var(--color-destructive)', fontWeight: 600 }}>
                              ⚠️ {u.no_show_count} lần bùng kèo
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
                onChange={(e) => setEventSearch(e.target.value)}
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
              <select
                value={eventStatusFilter}
                onChange={(e) => setEventStatusFilter(e.target.value)}
                style={{
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background-surface)',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">Tất cả kèo</option>
                <option value="OPEN">Mở đăng ký</option>
                <option value="FULL">Đã đủ người</option>
                <option value="COMPLETED">Đã kết thúc</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
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
                {filteredEvents.map((evt) => {
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
                          <Text weight="medium">{evt.start_time?.slice(0, 5)} · {evt.start_date}</Text>
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
                  {disputedUsers.map((u) => (
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
                          {u.no_show_count ?? 0} lần
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
        width={580}
        maxHeight="90dvh"
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
                      <select
                        value={venueDistrictCode}
                        onChange={(e) => setVenueDistrictCode(e.target.value)}
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          borderRadius: 'var(--radius-element)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-background-surface)',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          height: '38px',
                          width: '100%',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                        }}
                      >
                        {MOCK_DISTRICTS.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name} ({d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'TP.HCM' : 'Đà Nẵng'})
                          </option>
                        ))}
                      </select>
                    </VStack>
                  </HStack>

                  {/* Row 3: Quy mô sân & Giá tham khảo */}
                  <HStack gap={3} style={{ width: '100%' }}>
                    <VStack gap={1} style={{ flex: 1 }}>
                      <Text weight="semibold" style={{ fontSize: '13px' }}>
                        Tổng số thảm / sân <span style={{ color: 'var(--color-destructive, #ef4444)' }}>*</span>
                      </Text>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={venueTotalCourts}
                        onChange={(e) => setVenueTotalCourts(Number(e.target.value))}
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

                    <VStack gap={1} style={{ flex: 1 }}>
                      <Text weight="semibold" style={{ fontSize: '13px' }}>
                        Giá thuê tham khảo / giờ
                      </Text>
                      <input
                        type="text"
                        value={venuePriceRange}
                        onChange={(e) => setVenuePriceRange(e.target.value)}
                        placeholder="Ví dụ: 80.000đ - 120.000đ / giờ"
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
                  </HStack>

                  {/* Row 4: Hotline & Link Google Maps */}
                  <HStack gap={3} style={{ width: '100%' }}>
                    <VStack gap={1} style={{ flex: 1 }}>
                      <Text weight="semibold" style={{ fontSize: '13px' }}>
                        Số điện thoại đặt sân
                      </Text>
                      <input
                        type="tel"
                        value={venuePhone}
                        onChange={(e) => setVenuePhone(e.target.value)}
                        placeholder="0912 345 678"
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

                    <VStack gap={1} style={{ flex: 1 }}>
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
                  </HStack>

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
                  label={editingVenue ? 'Lưu thay đổi' : 'Lưu thay đổi'}
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
    </VStack>
  );
};
