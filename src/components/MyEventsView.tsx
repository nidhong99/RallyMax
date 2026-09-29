import React, { useState, useEffect } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@astryxdesign/core/Table';
import { Event } from '../types/database';
import { useApp } from '../context/AppContext';

interface MyEventsViewProps {
  onSelectEvent: (event: Event) => void;
  onOpenCreateEvent: () => void;
  onExplore?: () => void;
  onOpenReview?: (event: Event) => void;
}

export const MyEventsView: React.FC<MyEventsViewProps> = ({
  onSelectEvent,
  onOpenCreateEvent,
  onExplore,
  onOpenReview,
}) => {
  const { events, currentUser, cancelRegistration } = useApp();

  const isHost =
    currentUser?.role === 'HOST' ||
    (currentUser?.email || '').toLowerCase() === 'nidhong99@gmail.com';

  const [subTab, setSubTab] = useState<'hosting' | 'joining'>(() => (isHost ? 'hosting' : 'joining'));
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'CANCELLED'>('ALL');

  // Automatically switch subTab when user logs in/out or switches roles
  useEffect(() => {
    setSubTab(isHost ? 'hosting' : 'joining');
  }, [isHost, currentUser?.id]);

  // Events hosted by current user (match by host_id or email)
  const hostedEvents = currentUser
    ? events.filter(
        (e) =>
          e.host_id === currentUser.id ||
          Boolean(e.host?.email && currentUser.email && e.host.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (isHost && (e.host_id === 'user-host-1' || !e.host_id))
      )
    : [];

  // Events registered by current user (match by player_id or email)
  const joinedEvents = currentUser
    ? events.filter((e) =>
        (e.registrations || []).some(
          (r) =>
            r.player_id === currentUser.id ||
            Boolean(r.player?.email && currentUser.email && r.player.email.toLowerCase() === currentUser.email.toLowerCase())
        )
      )
    : [];

  const filteredJoinedEvents = joinedEvents.filter((e) => {
    if (statusFilter === 'ALL') return true;
    const reg = (e.registrations || []).find((r) => r.player_id === currentUser?.id);
    if (!reg) return false;
    if (statusFilter === 'CANCELLED') {
      return reg.status === 'CANCELLED' || reg.status === 'REJECTED' || reg.status === 'NO_SHOW';
    }
    return reg.status === statusFilter;
  });

  const pendingCount = joinedEvents.filter((e) =>
    (e.registrations || []).some((r) => r.player_id === currentUser?.id && r.status === 'PENDING')
  ).length;

  const approvedCount = joinedEvents.filter((e) =>
    (e.registrations || []).some((r) => r.player_id === currentUser?.id && r.status === 'APPROVED')
  ).length;

  const checkedInCount = joinedEvents.filter((e) =>
    (e.registrations || []).some((r) => r.player_id === currentUser?.id && r.status === 'CHECKED_IN')
  ).length;

  const cancelledCount = joinedEvents.filter((e) =>
    (e.registrations || []).some(
      (r) =>
        r.player_id === currentUser?.id &&
        (r.status === 'CANCELLED' || r.status === 'REJECTED' || r.status === 'NO_SHOW')
    )
  ).length;

  const handleCancel = async (ev: Event) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đăng ký kèo "${ev.title}" không?`)) {
      await cancelRegistration(ev.id, 'Người chơi chủ động hủy đăng ký');
    }
  };

  const formatFee = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <VStack gap={4} style={{ width: '100%' }}>
      {/* Header */}
      <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <VStack gap={0}>
          <Heading level={2}>
            {isHost ? 'Kèo Của Tôi' : 'Kèo Bạn Tham Gia'}
          </Heading>
          <Text color="secondary">
            {isHost
              ? 'Quản lý các buổi chơi do bạn tổ chức và theo dõi kèo tham gia'
              : 'Theo dõi lịch thi đấu, trạng thái duyệt đơn và quản lý các buổi chơi của bạn'}
          </Text>
        </VStack>

        {/* For Host: show tab switch between Hosting and Joining */}
        {isHost && (
          <HStack gap={2}>
            <Button
              size="md"
              variant={subTab === 'hosting' ? 'primary' : 'secondary'}
              label={`👑 Kèo tôi tổ chức (${hostedEvents.length})`}
              onClick={() => setSubTab('hosting')}
            />
            <Button
              size="md"
              variant={subTab === 'joining' ? 'primary' : 'secondary'}
              label={`🏸 Kèo tôi tham gia (${joinedEvents.length})`}
              onClick={() => setSubTab('joining')}
            />
          </HStack>
        )}
      </HStack>

      {/* HOST TAB CONTENT (Only visible to Host) */}
      {isHost && subTab === 'hosting' && (
        <VStack gap={3}>
          {hostedEvents.length === 0 ? (
            <VStack
              gap={2}
              style={{
                padding: 'var(--spacing-8)',
                alignItems: 'center',
                background: 'var(--color-background-surface)',
                borderRadius: 'var(--radius-container)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Text type="large" weight="semibold">Bạn chưa tổ chức kèo cầu lông nào</Text>
              <Text color="secondary">Hãy tạo kèo mới để kết nối các vận động viên tham gia giao lưu!</Text>
              <Button
                variant="primary"
                size="md"
                label="+ Tạo Kèo Mới Ngay"
                onClick={onOpenCreateEvent}
              />
            </VStack>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Tên buổi chơi & Thời gian</TableHeaderCell>
                  <TableHeaderCell>Sân & Địa chỉ</TableHeaderCell>
                  <TableHeaderCell>Người đăng ký</TableHeaderCell>
                  <TableHeaderCell>Trạng thái</TableHeaderCell>
                  <TableHeaderCell>Thao tác</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostedEvents.map((ev) => {
                  const regs = ev.registrations || [];
                  const evPendingCount = regs.filter((r) => r.status === 'PENDING').length;
                  const evApprovedCount = regs.filter((r) => r.status === 'APPROVED' || r.status === 'CHECKED_IN').length;

                  const startDate = new Date(ev.start_time);
                  const timeDisplay = `${startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} • ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

                  return (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <VStack gap={0}>
                          <Text weight="semibold">{ev.title}</Text>
                          <Text type="supporting" color="secondary">{timeDisplay}</Text>
                        </VStack>
                      </TableCell>

                      <TableCell>
                        <VStack gap={0}>
                          <Text>{ev.venue?.name}</Text>
                          <Text type="supporting" color="secondary">{ev.court_numbers}</Text>
                        </VStack>
                      </TableCell>

                      <TableCell>
                        <HStack gap={1} style={{ alignItems: 'center' }}>
                          <Text weight="bold">
                            {evApprovedCount}/{ev.max_players}
                          </Text>
                          {evPendingCount > 0 && (
                            <Badge variant="yellow" label={`${evPendingCount} chờ duyệt`} />
                          )}
                        </HStack>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={ev.status === 'OPEN' ? 'green' : ev.status === 'CANCELLED' ? 'red' : 'neutral'}
                          label={ev.status === 'OPEN' ? 'Đang mở' : ev.status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn thành'}
                        />
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          label="Quản lý / Điểm danh"
                          onClick={() => onSelectEvent(ev)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </VStack>
      )}

      {/* JOINED EVENTS CONTENT (For Player, this is the main focus; for Host, it's when tab is joining) */}
      {(!isHost || subTab === 'joining') && (
        <VStack gap={3}>
          {/* Status Filter Bar for Player */}
          {joinedEvents.length > 0 && (
            <HStack gap={1} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                size="sm"
                variant={statusFilter === 'ALL' ? 'primary' : 'secondary'}
                label={`Tất cả (${joinedEvents.length})`}
                onClick={() => setStatusFilter('ALL')}
              />
              <Button
                size="sm"
                variant={statusFilter === 'PENDING' ? 'primary' : 'secondary'}
                label={`⏳ Chờ duyệt (${pendingCount})`}
                onClick={() => setStatusFilter('PENDING')}
              />
              <Button
                size="sm"
                variant={statusFilter === 'APPROVED' ? 'primary' : 'secondary'}
                label={`✅ Đã duyệt (${approvedCount})`}
                onClick={() => setStatusFilter('APPROVED')}
              />
              <Button
                size="sm"
                variant={statusFilter === 'CHECKED_IN' ? 'primary' : 'secondary'}
                label={`🏸 Đã check-in (${checkedInCount})`}
                onClick={() => setStatusFilter('CHECKED_IN')}
              />
              {cancelledCount > 0 && (
                <Button
                  size="sm"
                  variant={statusFilter === 'CANCELLED' ? 'primary' : 'secondary'}
                  label={`🚫 Đã hủy / Từ chối (${cancelledCount})`}
                  onClick={() => setStatusFilter('CANCELLED')}
                />
              )}
            </HStack>
          )}

          {/* Table or Empty State */}
          {filteredJoinedEvents.length === 0 ? (
            <VStack
              gap={3}
              style={{
                padding: 'var(--spacing-8)',
                alignItems: 'center',
                background: 'var(--color-background-surface)',
                borderRadius: 'var(--radius-container)',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
              }}
            >
              <Text type="large" weight="semibold">
                {joinedEvents.length === 0
                  ? 'Bạn chưa đăng ký tham gia kèo cầu lông nào'
                  : 'Không có kèo nào trong danh mục này'}
              </Text>
              <Text color="secondary" style={{ maxWidth: '480px' }}>
                {joinedEvents.length === 0
                  ? 'Hãy truy cập mục "Khám phá kèo" để tìm kiếm các buổi chơi phù hợp với trình độ và khu vực của bạn!'
                  : 'Hãy chọn bộ lọc "Tất cả" để xem toàn bộ lịch sử đăng ký của bạn.'}
              </Text>
              {joinedEvents.length === 0 && onExplore && (
                <Button
                  variant="primary"
                  size="md"
                  label="🏸 Khám phá kèo ngay"
                  onClick={onExplore}
                />
              )}
            </VStack>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Sự kiện & Thời gian</TableHeaderCell>
                  <TableHeaderCell>Địa điểm</TableHeaderCell>
                  <TableHeaderCell>Host</TableHeaderCell>
                  <TableHeaderCell>Chi phí</TableHeaderCell>
                  <TableHeaderCell>Trạng thái đơn</TableHeaderCell>
                  <TableHeaderCell>Thanh toán</TableHeaderCell>
                  <TableHeaderCell>Thao tác</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJoinedEvents.map((ev) => {
                  const reg = (ev.registrations || []).find((r) => r.player_id === currentUser?.id);
                  const startDate = new Date(ev.start_time);
                  const timeDisplay = `${startDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })} • ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

                  const isPending = reg?.status === 'PENDING';
                  const isApproved = reg?.status === 'APPROVED';
                  const isCheckedIn = reg?.status === 'CHECKED_IN';
                  const isCancelled = reg?.status === 'CANCELLED';
                  const isRejected = reg?.status === 'REJECTED';
                  const isNoShow = reg?.status === 'NO_SHOW';

                  return (
                    <TableRow key={ev.id}>
                      {/* Title & Time */}
                      <TableCell>
                        <VStack gap={0}>
                          <Text weight="semibold">{ev.title}</Text>
                          <Text type="supporting" color="secondary">{timeDisplay}</Text>
                        </VStack>
                      </TableCell>

                      {/* Venue */}
                      <TableCell>
                        <VStack gap={0}>
                          <Text weight="medium">{ev.venue?.name}</Text>
                          <Text type="supporting" color="secondary">{ev.court_numbers || ev.venue?.address}</Text>
                        </VStack>
                      </TableCell>

                      {/* Host */}
                      <TableCell>
                        <VStack gap={0}>
                          <Text weight="medium">{ev.host?.full_name || 'Host'}</Text>
                          <HStack gap={1} style={{ alignItems: 'center' }}>
                            <Badge
                              variant={(ev.host?.reliability_score ?? 100) >= 90 ? 'green' : 'yellow'}
                              label={`Uy tín ${ev.host?.reliability_score ?? 100}%`}
                            />
                          </HStack>
                        </VStack>
                      </TableCell>

                      {/* Fee */}
                      <TableCell>
                        <Text weight="semibold" style={{ color: 'var(--color-primary)' }}>
                          {formatFee(ev.fee_per_player)}
                        </Text>
                      </TableCell>

                      {/* Registration Status */}
                      <TableCell>
                        <Badge
                          variant={
                            isCheckedIn
                              ? 'green'
                              : isApproved
                              ? 'blue'
                              : isPending
                              ? 'yellow'
                              : isNoShow || isRejected
                              ? 'red'
                              : 'neutral'
                          }
                          label={
                            isCheckedIn
                              ? '🏸 Đã check-in sân'
                              : isApproved
                              ? '✅ Đã duyệt (Giữ chỗ)'
                              : isPending
                              ? '⏳ Đang chờ duyệt'
                              : isRejected
                              ? '❌ Host từ chối'
                              : isNoShow
                              ? '⚠️ Vắng mặt'
                              : '🚫 Đã hủy'
                          }
                        />
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell>
                        <Badge
                          variant={
                            reg?.payment_status === 'PAID'
                              ? 'green'
                              : reg?.payment_status === 'PENDING_CONFIRMATION'
                              ? 'yellow'
                              : 'neutral'
                          }
                          label={
                            reg?.payment_status === 'PAID'
                              ? 'Đã thanh toán'
                              : reg?.payment_status === 'PENDING_CONFIRMATION'
                              ? 'Chờ đối soát'
                              : 'Chưa thanh toán'
                          }
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <HStack gap={1} style={{ alignItems: 'center' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            label="Chi tiết"
                            onClick={() => onSelectEvent(ev)}
                          />

                          {/* Allow cancel if pending or approved */}
                          {(isPending || isApproved) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              label="Hủy đăng ký"
                              onClick={() => handleCancel(ev)}
                            />
                          )}

                          {/* If checked in and completed, allow rating the host */}
                          {isCheckedIn && ev.status === 'COMPLETED' && onOpenReview && (
                            <Button
                              size="sm"
                              variant="secondary"
                              label="Đánh giá Host"
                              onClick={() => onOpenReview(ev)}
                            />
                          )}
                        </HStack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </VStack>
      )}
    </VStack>
  );
};
