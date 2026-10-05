import React, { useState, useEffect } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@astryxdesign/core/Table';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Event } from '../types/database';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

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
  const { t, language, formatCurrency } = useLanguage();

  const isHost =
    currentUser?.role === 'HOST' ||
    (currentUser?.email || '').toLowerCase() === 'nidhong99@gmail.com';

  const [subTab, setSubTab] = useState<'hosting' | 'joining'>(() => (isHost ? 'hosting' : 'joining'));
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'CANCELLED'>('ALL');

  // Pagination states
  const [hostedPage, setHostedPage] = useState(1);
  const [hostedPageSize, setHostedPageSize] = useState(10);
  const [joinedPage, setJoinedPage] = useState(1);
  const [joinedPageSize, setJoinedPageSize] = useState(10);

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

  // Paginated slices
  const hostedTotal = hostedEvents.length;
  const safeHostedPage = Math.min(hostedPage, Math.max(1, Math.ceil(hostedTotal / hostedPageSize)));
  const hostedStartIdx = (safeHostedPage - 1) * hostedPageSize;
  const paginatedHostedEvents = hostedEvents.slice(hostedStartIdx, hostedStartIdx + hostedPageSize);

  const joinedTotal = filteredJoinedEvents.length;
  const safeJoinedPage = Math.min(joinedPage, Math.max(1, Math.ceil(joinedTotal / joinedPageSize)));
  const joinedStartIdx = (safeJoinedPage - 1) * joinedPageSize;
  const paginatedJoinedEvents = filteredJoinedEvents.slice(joinedStartIdx, joinedStartIdx + joinedPageSize);

  const handleCancel = async (ev: Event) => {
    const confirmMsg = language === 'vi'
      ? `Bạn có chắc chắn muốn hủy đăng ký kèo "${ev.title}" không?`
      : `Are you sure you want to cancel your registration for "${ev.title}"?`;
    const reasonMsg = language === 'vi' ? 'Người chơi chủ động hủy đăng ký' : 'Player cancelled registration';
    if (window.confirm(confirmMsg)) {
      await cancelRegistration(ev.id, reasonMsg);
    }
  };

  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <VStack gap={4} style={{ width: '100%' }}>
      {/* Header */}
      <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <VStack gap={0}>
          <Heading level={2}>
            {isHost ? t('myEvents.title') : (language === 'vi' ? 'Kèo Bạn Tham Gia' : 'Sessions You Joined')}
          </Heading>
          <Text color="secondary">
            {isHost
              ? (language === 'vi'
                  ? 'Quản lý các buổi chơi do bạn tổ chức và theo dõi kèo tham gia'
                  : 'Manage your hosted badminton sessions and track joined games')
              : (language === 'vi'
                  ? 'Theo dõi lịch thi đấu, trạng thái duyệt đơn và quản lý các buổi chơi của bạn'
                  : 'Track your match schedule, application status, and check-ins')}
          </Text>
        </VStack>

        {/* For Host: show tab switch between Hosting and Joining */}
        {isHost && (
          <HStack gap={2}>
            <Button
              size="md"
              variant={subTab === 'hosting' ? 'primary' : 'secondary'}
              label={`👑 ${t('myEvents.tabHosted')} (${hostedEvents.length})`}
              onClick={() => setSubTab('hosting')}
            />
            <Button
              size="md"
              variant={subTab === 'joining' ? 'primary' : 'secondary'}
              label={`🏸 ${t('myEvents.tabJoined')} (${joinedEvents.length})`}
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
              <Text type="large" weight="semibold">{t('myEvents.noHosted')}</Text>
              <Text color="secondary">{t('myEvents.noHostedDesc')}</Text>
              <Button
                variant="primary"
                size="md"
                label={`+ ${t('explorer.createNow')}`}
                onClick={onOpenCreateEvent}
              />
            </VStack>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>{language === 'vi' ? 'Tên buổi chơi & Thời gian' : 'Session & Time'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Sân & Địa chỉ' : 'Venue & Address'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Người đăng ký' : 'Registrations'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Trạng thái' : 'Status'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHostedEvents.map((ev) => {
                  const regs = ev.registrations || [];
                  const evPendingCount = regs.filter((r) => r.status === 'PENDING').length;
                  const evApprovedCount = regs.filter((r) => r.status === 'APPROVED' || r.status === 'CHECKED_IN').length;

                  const startDate = new Date(ev.start_time);
                  const timeDisplay = `${startDate.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' })} • ${startDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`;

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
                            <Badge
                              variant="yellow"
                              label={language === 'vi' ? `${evPendingCount} chờ duyệt` : `${evPendingCount} pending`}
                            />
                          )}
                        </HStack>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={ev.status === 'OPEN' ? 'green' : ev.status === 'CANCELLED' ? 'red' : 'neutral'}
                          label={
                            ev.status === 'OPEN'
                              ? (language === 'vi' ? 'Đang mở' : 'Open')
                              : ev.status === 'CANCELLED'
                              ? (language === 'vi' ? 'Đã hủy' : 'Cancelled')
                              : (language === 'vi' ? 'Hoàn thành' : 'Completed')
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          label={language === 'vi' ? 'Quản lý / Điểm danh' : 'Manage / Check-in'}
                          onClick={() => onSelectEvent(ev)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Hosted Events Pagination */}
            {hostedTotal > 0 && (
              <HStack
                gap={2}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) 0',
                  flexWrap: 'wrap',
                }}
              >
                <Text type="supporting" color="secondary" style={{ fontSize: '13px' }}>
                  {language === 'vi'
                    ? `Hiển thị ${hostedStartIdx + 1} - ${Math.min(hostedStartIdx + hostedPageSize, hostedTotal)} trong ${hostedTotal} kèo`
                    : `Showing ${hostedStartIdx + 1} - ${Math.min(hostedStartIdx + hostedPageSize, hostedTotal)} of ${hostedTotal} events`}
                </Text>
                <Pagination
                  page={safeHostedPage}
                  onChange={setHostedPage}
                  totalItems={hostedTotal}
                  pageSize={hostedPageSize}
                  onPageSizeChange={(newSize) => {
                    setHostedPageSize(newSize);
                    setHostedPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  variant="pages"
                  size="sm"
                />
              </HStack>
            )}
          </>
        )}
        </VStack>
      )}

      {/* JOINED EVENTS CONTENT */}
      {(!isHost || subTab === 'joining') && (
        <VStack gap={3}>
          {/* Status Filter Bar for Player */}
          {joinedEvents.length > 0 && (
            <HStack gap={1} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                size="sm"
                variant={statusFilter === 'ALL' ? 'primary' : 'secondary'}
                label={`${t('myEvents.filterAll')} (${joinedEvents.length})`}
                onClick={() => setStatusFilter('ALL')}
              />
              <Button
                size="sm"
                variant={statusFilter === 'PENDING' ? 'primary' : 'secondary'}
                label={`⏳ ${t('myEvents.filterPending')} (${pendingCount})`}
                onClick={() => setStatusFilter('PENDING')}
              />
              <Button
                size="sm"
                variant={statusFilter === 'APPROVED' ? 'primary' : 'secondary'}
                label={`✅ ${t('myEvents.filterApproved')} (${approvedCount})`}
                onClick={() => setStatusFilter('APPROVED')}
              />
              <Button
                size="sm"
                variant={statusFilter === 'CHECKED_IN' ? 'primary' : 'secondary'}
                label={`🏸 ${t('myEvents.filterCheckedIn')} (${checkedInCount})`}
                onClick={() => setStatusFilter('CHECKED_IN')}
              />
              {cancelledCount > 0 && (
                <Button
                  size="sm"
                  variant={statusFilter === 'CANCELLED' ? 'primary' : 'secondary'}
                  label={`🚫 ${t('myEvents.filterCancelled')} (${cancelledCount})`}
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
                  ? t('myEvents.noJoined')
                  : (language === 'vi' ? 'Không có kèo nào trong danh mục này' : 'No sessions in this category')}
              </Text>
              <Text color="secondary" style={{ maxWidth: '480px' }}>
                {joinedEvents.length === 0
                  ? t('myEvents.noJoinedDesc')
                  : (language === 'vi' ? 'Hãy chọn bộ lọc "Tất cả" để xem toàn bộ lịch sử đăng ký của bạn.' : 'Select "All" to view your complete registration history.')}
              </Text>
              {joinedEvents.length === 0 && onExplore && (
                <Button
                  variant="primary"
                  size="md"
                  label={`🏸 ${t('myEvents.exploreNow')}`}
                  onClick={onExplore}
                />
              )}
            </VStack>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>{language === 'vi' ? 'Sự kiện & Thời gian' : 'Session & Time'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Địa điểm' : 'Venue'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Host' : 'Host'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Chi phí' : 'Fee'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Trạng thái đơn' : 'Application Status'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Thanh toán' : 'Payment'}</TableHeaderCell>
                  <TableHeaderCell>{language === 'vi' ? 'Thao tác' : 'Actions'}</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJoinedEvents.map((ev) => {
                  const reg = (ev.registrations || []).find((r) => r.player_id === currentUser?.id);
                  const startDate = new Date(ev.start_time);
                  const timeDisplay = `${startDate.toLocaleDateString(dateLocale, { weekday: 'short', day: '2-digit', month: '2-digit' })} • ${startDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`;

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
                              label={`${language === 'vi' ? 'Uy tín' : 'Reliability'} ${ev.host?.reliability_score ?? 100}%`}
                            />
                          </HStack>
                        </VStack>
                      </TableCell>

                      {/* Fee */}
                      <TableCell>
                        <Text weight="semibold" style={{ color: 'var(--color-primary)' }}>
                          {formatCurrency(ev.fee_per_player)}
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
                              ? (language === 'vi' ? '🏸 Đã check-in sân' : '🏸 Checked in')
                              : isApproved
                              ? (language === 'vi' ? '✅ Đã duyệt (Giữ chỗ)' : '✅ Approved (Reserved)')
                              : isPending
                              ? (language === 'vi' ? '⏳ Đang chờ duyệt' : '⏳ Pending approval')
                              : isRejected
                              ? (language === 'vi' ? '❌ Host từ chối' : '❌ Host rejected')
                              : isNoShow
                              ? (language === 'vi' ? '⚠️ Vắng mặt' : '⚠️ No-show')
                              : (language === 'vi' ? '🚫 Đã hủy' : '🚫 Cancelled')
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
                              ? (language === 'vi' ? 'Đã thanh toán' : 'Paid')
                              : reg?.payment_status === 'PENDING_CONFIRMATION'
                              ? (language === 'vi' ? 'Chờ đối soát' : 'Awaiting confirmation')
                              : (language === 'vi' ? 'Chưa thanh toán' : 'Unpaid')
                          }
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <HStack gap={1} style={{ alignItems: 'center' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            label={language === 'vi' ? 'Chi tiết' : 'Details'}
                            onClick={() => onSelectEvent(ev)}
                          />

                          {/* Allow cancel if pending or approved */}
                          {(isPending || isApproved) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              label={language === 'vi' ? 'Hủy đăng ký' : 'Cancel'}
                              onClick={() => handleCancel(ev)}
                            />
                          )}

                          {/* If checked in and completed, allow rating the host */}
                          {isCheckedIn && ev.status === 'COMPLETED' && onOpenReview && (
                            <Button
                              size="sm"
                              variant="secondary"
                              label={language === 'vi' ? 'Đánh giá Host' : 'Rate Host'}
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

            {/* Joined Events Pagination */}
            {joinedTotal > 0 && (
              <HStack
                gap={2}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) 0',
                  flexWrap: 'wrap',
                }}
              >
                <Text type="supporting" color="secondary" style={{ fontSize: '13px' }}>
                  {language === 'vi'
                    ? `Hiển thị ${joinedStartIdx + 1} - ${Math.min(joinedStartIdx + joinedPageSize, joinedTotal)} trong ${joinedTotal} lượt tham gia`
                    : `Showing ${joinedStartIdx + 1} - ${Math.min(joinedStartIdx + joinedPageSize, joinedTotal)} of ${joinedTotal} registrations`}
                </Text>
                <Pagination
                  page={safeJoinedPage}
                  onChange={setJoinedPage}
                  totalItems={joinedTotal}
                  pageSize={joinedPageSize}
                  onPageSizeChange={(newSize) => {
                    setJoinedPageSize(newSize);
                    setJoinedPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  variant="pages"
                  size="sm"
                />
              </HStack>
            )}
          </>
        )}
        </VStack>
      )}
    </VStack>
  );
};
