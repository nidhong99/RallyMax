import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Button } from '@astryxdesign/core/Button';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@astryxdesign/core/Table';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Event, SKILL_LABELS, PLAY_STYLE_LABELS } from '../types/database';
import { useApp } from '../context/AppContext';
import { MapPin, Clock, Users, Shield, DollarSign, AlertTriangle, CheckCircle2, QrCode, ExternalLink } from 'lucide-react';

const DEFAULT_EVENT_COVER =
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReview?: (event: Event) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    registerForEvent,
    cancelRegistration,
    updateRegistrationStatus,
    checkInPlayer,
    markPaymentStatus,
    cancelEvent,
    deleteEvent,
  } = useApp();

  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [guestCount] = useState<number>(0);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setIsCancelling(false);
      setCancelReason('');
    }
  }, [isOpen, event?.id]);

  if (!event) return null;

  const isCurrentUserHost = currentUser ? (currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com') : false;
  const isHost = currentUser
    ? event.host_id === currentUser.id ||
      Boolean(event.host?.email && currentUser.email && event.host.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (isCurrentUserHost && (event.host_id === 'user-host-1' || !event.host_id))
    : false;
  const registrations = event.registrations || [];
  const userRegistration = currentUser
    ? registrations.find(
        (r) =>
          r.player_id === currentUser.id ||
          Boolean(r.player?.email && currentUser.email && r.player.email.toLowerCase() === currentUser.email.toLowerCase())
      )
    : null;

  const approvedList = registrations.filter((r) => r.status === 'APPROVED' || r.status === 'CHECKED_IN');
  const totalSlotsTaken = approvedList.reduce((acc, cur) => acc + 1 + (cur.guest_count || 0), 0);
  const isFull = totalSlotsTaken >= event.max_players;

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const timeStr = `${startDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })} • ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

  const minSkill = SKILL_LABELS[event.min_skill_level] || SKILL_LABELS.BEGINNER;
  const maxSkill = SKILL_LABELS[event.max_skill_level] || SKILL_LABELS.BEGINNER;

  const handleConfirmJoin = async () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để tham gia sự kiện');
      return;
    }
    await registerForEvent(event.id, guestCount);
    setStep('confirm');
  };

  const handleConfirmPaid = async () => {
    if (userRegistration) {
      await markPaymentStatus(event.id, userRegistration.id, 'PAID');
    }
    alert('Cảm ơn bạn! Thông tin chuyển khoản đã được ghi nhận. Hẹn gặp bạn tại sân nhé!');
    onClose();
  };

  const handleCancelRegistration = async () => {
    if (confirm('Bạn có chắc chắn muốn hủy tham gia buổi chơi này không?')) {
      await cancelRegistration(event.id);
      setStep('details');
    }
  };

  const handleHostCancelEvent = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy sự kiện.');
      return;
    }
    await cancelEvent(event.id, cancelReason);
    setIsCancelling(false);
  };

  const handleDeletePermanent = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn kèo "${event.title}" không?`)) {
      await deleteEvent(event.id);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={740}
      maxHeight="85dvh"
    >
      <Layout
        height="fill"
        header={
          <DialogHeader
            title={step === 'confirm' ? 'Xác nhận đăng ký & Thanh toán' : event.title}
            subtitle={timeStr}
            hasDivider={true}
            onOpenChange={(open) => {
              if (!open) onClose();
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
            {step === 'details' && (
              <VStack gap={4}>
                {event.status === 'CANCELLED' && (
                  <HStack
                    gap={2}
                    style={{
                      padding: 'var(--spacing-3)',
                      background: 'var(--color-background-red)',
                      borderRadius: 'var(--radius-element)',
                      alignItems: 'center',
                    }}
                  >
                    <AlertTriangle size={20} color="var(--color-destructive)" />
                    <VStack gap={0}>
                      <Text weight="bold" color="accent">Kèo này đã bị Host hủy</Text>
                      <Text type="supporting" color="secondary">Lý do: {event.cancellation_reason || 'Lý do cá nhân'}</Text>
                    </VStack>
                  </HStack>
                )}

                <VStack
                  gap={0}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '190px',
                    borderRadius: 'var(--radius-container)',
                    overflow: 'hidden',
                    background: 'var(--color-background-surface)',
                    boxShadow: 'var(--shadow-low)',
                  }}
                >
                  <img
                    src={event.cover_image_url || DEFAULT_EVENT_COVER}
                    alt={event.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: event.cover_image_position || 'center center',
                      display: 'block',
                    }}
                  />
                  <VStack
                    gap={0}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.75) 100%)',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                    }}
                  >
                    <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <HStack gap={1} style={{ alignItems: 'center' }}>
                        <StatusDot
                          label={isFull ? 'Đã đủ slot' : event.status === 'OPEN' ? 'Đang mở tuyển' : 'Đã kết thúc'}
                          variant={isFull ? 'warning' : event.status === 'OPEN' ? 'success' : 'error'}
                        />
                        <Badge
                          variant={minSkill.badgeVariant}
                          label={`${minSkill.label.split(' ')[0]}${minSkill.label !== maxSkill.label ? ` → ${maxSkill.label.split(' ')[0]}` : ''}`}
                        />
                      </HStack>
                      <Badge variant={isFull ? 'red' : 'green'} label={`Đã tham gia: ${totalSlotsTaken}/${event.max_players} người`} />
                    </HStack>
                    <VStack gap={0}>
                      <Heading level={3} style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{event.title}</Heading>
                      <Text type="supporting" style={{ color: '#e5e7eb', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{timeStr}</Text>
                    </VStack>
                  </VStack>
                </VStack>

                <HStack
                  gap={3}
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    background: 'var(--color-background-surface)',
                    borderRadius: 'var(--radius-element)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <HStack gap={2} style={{ alignItems: 'center' }}>
                    <Avatar size="sm" src={event.host?.avatar_url} name={event.host?.full_name || 'Host'} />
                    <VStack gap={0}>
                      <HStack gap={1} style={{ alignItems: 'center' }}>
                        <Text weight="semibold">{event.host?.full_name || 'Host'}</Text>
                        <Badge variant="purple" label="Host" />
                      </HStack>
                      <Text type="supporting" color="secondary">
                        Điểm uy tín: <Text weight="bold" color="accent">{event.host?.reliability_score ?? 100}%</Text> • Đã tổ chức {event.host?.total_matches_played ?? 15}+ trận
                      </Text>
                    </VStack>
                  </HStack>
                  {!isHost && userRegistration && (
                    <Badge
                      variant={userRegistration.status === 'APPROVED' ? 'green' : userRegistration.status === 'PENDING' ? 'yellow' : 'neutral'}
                      label={userRegistration.status === 'APPROVED' ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
                    />
                  )}
                </HStack>

                <HStack
                  gap={2}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', width: '100%' }}
                >
                  <VStack gap={1} style={{ padding: 'var(--spacing-3)', background: 'var(--color-background-muted)', borderRadius: 'var(--radius-element)', border: '1px solid var(--color-border)' }}>
                    <HStack gap={1} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <HStack gap={1} style={{ alignItems: 'center' }}>
                        <MapPin size={15} color="var(--color-icon-accent)" />
                        <Text weight="semibold" style={{ fontSize: '12px' }}>Sân thi đấu</Text>
                      </HStack>
                      {event.location_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          label="Bản đồ ↗"
                          onClick={() => window.open(event.location_url, '_blank')}
                          style={{
                            height: '20px',
                            padding: '0 var(--spacing-1)',
                            fontSize: '11px',
                            color: 'var(--color-text-accent)',
                          }}
                        />
                      )}
                    </HStack>
                    <Text weight="medium" style={{ fontSize: '13px' }}>
                      {event.venue_name || event.venue?.name || 'Sân cầu lông'} ({event.court_numbers || 'Sân 1'})
                    </Text>
                  </VStack>

                  <VStack gap={1} style={{ padding: 'var(--spacing-3)', background: 'var(--color-background-muted)', borderRadius: 'var(--radius-element)', border: '1px solid var(--color-border)' }}>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <Clock size={15} color="var(--color-icon-accent)" />
                      <Text weight="semibold" style={{ fontSize: '12px' }}>Khung giờ</Text>
                    </HStack>
                    <Text weight="medium" style={{ fontSize: '13px' }}>
                      {startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </VStack>

                  <VStack gap={1} style={{ padding: 'var(--spacing-3)', background: 'var(--color-background-muted)', borderRadius: 'var(--radius-element)', border: '1px solid var(--color-border)' }}>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <Users size={15} color="var(--color-icon-accent)" />
                      <Text weight="semibold" style={{ fontSize: '12px' }}>Slot tham gia</Text>
                    </HStack>
                    <Text weight="medium" style={{ fontSize: '13px' }}>
                      {totalSlotsTaken}/{event.max_players} slot (tối thiểu {event.min_players})
                    </Text>
                  </VStack>

                  <VStack gap={1} style={{ padding: 'var(--spacing-3)', background: 'var(--color-background-muted)', borderRadius: 'var(--radius-element)', border: '1px solid var(--color-border)' }}>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <DollarSign size={15} color="var(--color-icon-accent)" />
                      <Text weight="semibold" style={{ fontSize: '12px' }}>Phí tham gia</Text>
                    </HStack>
                    <Text weight="bold" color="accent" style={{ fontSize: '15px' }}>
                      {event.fee_per_player.toLocaleString('vi-VN')} đ
                    </Text>
                  </VStack>
                </HStack>

                {event.description && (
                  <VStack gap={1} style={{ padding: 'var(--spacing-3)', background: 'var(--color-background-muted)', borderRadius: 'var(--radius-element)', border: '1px solid var(--color-border)' }}>
                    <Text weight="semibold" type="supporting" color="secondary">📋 Ghi chú từ Host:</Text>
                    <Text style={{ fontSize: '13px', lineHeight: 1.5 }}>{event.description}</Text>
                  </VStack>
                )}

                {/* Participants Table */}
                <VStack gap={2}>
                  <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Heading level={4}>
                      Danh sách tham gia ({totalSlotsTaken}/{event.max_players} người)
                    </Heading>
                    <Text type="supporting" color="secondary">
                      Tối thiểu để chốt kèo: {event.min_players} người
                    </Text>
                  </HStack>

                  {registrations.length === 0 ? (
                    <VStack
                      gap={2}
                      style={{
                        padding: 'var(--spacing-4)',
                        alignItems: 'center',
                        background: 'var(--color-background-muted)',
                        borderRadius: 'var(--radius-element)',
                      }}
                    >
                      <Text color="secondary">Chưa có ai đăng ký kèo này. Hãy là người đầu tiên tham gia!</Text>
                    </VStack>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Vận động viên</TableHeaderCell>
                          <TableHeaderCell>Trình độ</TableHeaderCell>
                          <TableHeaderCell>Điểm uy tín</TableHeaderCell>
                          <TableHeaderCell>Trạng thái</TableHeaderCell>
                          <TableHeaderCell>Thanh toán</TableHeaderCell>
                          {isHost && <TableHeaderCell>Thao tác của Host</TableHeaderCell>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((reg) => {
                          const p = reg.player;
                          const skill = p ? SKILL_LABELS[p.skill_level] : SKILL_LABELS.BEGINNER;

                          return (
                            <TableRow key={reg.id}>
                              <TableCell>
                                <VStack gap={0}>
                                  <Text weight="semibold">{p?.full_name || 'Người chơi'}</Text>
                                  <Text type="supporting" color="secondary">
                                    {p?.gender === 'FEMALE' ? 'Nữ' : 'Nam'} • {p ? PLAY_STYLE_LABELS[p.play_style] : ''}
                                    {reg.guest_count > 0 ? ` (+${reg.guest_count} bạn)` : ''}
                                  </Text>
                                </VStack>
                              </TableCell>

                              <TableCell>
                                <Badge variant={skill?.badgeVariant || 'neutral'} label={skill?.label.split(' ')[0] || 'TB'} />
                              </TableCell>

                              <TableCell>
                                <HStack gap={1} style={{ alignItems: 'center' }}>
                                  <StatusDot
                                    label={`${p?.reliability_score || 100}%`}
                                    variant={(p?.reliability_score || 100) >= 90 ? 'success' : 'warning'}
                                  />
                                  <Text type="supporting">{p?.reliability_score || 100}%</Text>
                                </HStack>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant={
                                    reg.status === 'CHECKED_IN'
                                      ? 'green'
                                      : reg.status === 'APPROVED'
                                      ? 'blue'
                                      : reg.status === 'PENDING'
                                      ? 'yellow'
                                      : reg.status === 'NO_SHOW'
                                      ? 'red'
                                      : 'neutral'
                                  }
                                  label={
                                    reg.status === 'CHECKED_IN'
                                      ? 'Đã có mặt'
                                      : reg.status === 'APPROVED'
                                      ? 'Đã duyệt'
                                      : reg.status === 'PENDING'
                                      ? 'Chờ duyệt'
                                      : reg.status === 'NO_SHOW'
                                      ? 'Bùng kèo'
                                      : 'Từ chối'
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant={reg.payment_status === 'PAID' ? 'green' : 'neutral'}
                                  label={reg.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thu'}
                                />
                              </TableCell>

                              {isHost && (
                                <TableCell>
                                  <HStack gap={1} style={{ flexWrap: 'wrap' }}>
                                    {reg.status === 'PENDING' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          label="Duyệt"
                                          onClick={() => updateRegistrationStatus(event.id, reg.id, 'APPROVED')}
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          label="Từ chối"
                                          onClick={() => updateRegistrationStatus(event.id, reg.id, 'REJECTED')}
                                        />
                                      </>
                                    )}

                                    {reg.status === 'APPROVED' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          label="Có mặt"
                                          onClick={() => checkInPlayer(event.id, reg.id, false)}
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          label="Bùng"
                                          onClick={() => checkInPlayer(event.id, reg.id, true)}
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          label={reg.payment_status === 'PAID' ? 'Hủy thu' : 'Đã thu'}
                                          onClick={() =>
                                            markPaymentStatus(
                                              event.id,
                                              reg.id,
                                              reg.payment_status === 'PAID' ? 'UNPAID' : 'PAID'
                                            )
                                          }
                                        />
                                      </>
                                    )}
                                  </HStack>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </VStack>
              </VStack>
            )}

            {/* STEP 2: CONFIRMATION & PAYMENT / QR CODE */}
            {step === 'confirm' && (
              <VStack gap={4}>
                {/* Success Status Banner */}
                <VStack
                  gap={2}
                  style={{
                    padding: 'var(--spacing-4)',
                    background: 'var(--color-background-green)',
                    borderRadius: 'var(--radius-container)',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <CheckCircle2 size={36} color="var(--color-success)" />
                  <Heading level={3}>Đăng ký giữ chỗ thành công!</Heading>
                  <Text color="secondary">
                    Bạn đã được ghi danh vào buổi chơi "{event.title}". Hãy quét mã QR thanh toán hoặc thanh toán sau tại sân nhé!
                  </Text>
                </VStack>

                {/* QR Payment Box */}
                <VStack
                  gap={3}
                  style={{
                    padding: 'var(--spacing-4)',
                    background: 'var(--color-background-surface)',
                    borderRadius: 'var(--radius-container)',
                    border: '1px solid var(--color-border)',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <HStack gap={1} style={{ alignItems: 'center' }}>
                    <QrCode size={18} color="var(--color-icon-accent)" />
                    <Text weight="bold" style={{ fontSize: '15px' }}>
                      Mã QR chuyển khoản giữ chỗ (VietQR)
                    </Text>
                  </HStack>

                  {/* VietQR Image */}
                  <img
                    src={
                      event.payment_qr_url ||
                      `https://api.vietqr.io/image/970422-0912345678-compact2.jpg?amount=${event.fee_per_player}&addInfo=RallyMax%20${encodeURIComponent(event.title.slice(0, 15))}`
                    }
                    alt="VietQR Payment"
                    style={{
                      width: '230px',
                      height: '230px',
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      background: '#ffffff',
                      padding: 'var(--spacing-2)',
                    }}
                  />

                  {/* Amount & Bank Note */}
                  <VStack gap={1} style={{ alignItems: 'center', textAlign: 'center' }}>
                    <Text type="supporting" color="secondary">Số tiền thanh toán:</Text>
                    <Text weight="bold" color="accent" style={{ fontSize: '22px' }}>
                      {event.fee_per_player.toLocaleString('vi-VN')} đ
                    </Text>
                    <Text type="supporting" color="secondary" style={{ maxWidth: '440px' }}>
                      {event.payment_note || 'MB Bank: 0912345678 - Nguyễn Hoàng Nam (ND: Tên bạn - SĐT)'}
                    </Text>
                  </VStack>

                  {/* Flexible payment notice: Pay now or pay later at court */}
                  <HStack
                    gap={2}
                    style={{
                      padding: 'var(--spacing-3)',
                      background: 'var(--color-background-muted)',
                      borderRadius: 'var(--radius-element)',
                      alignItems: 'flex-start',
                      width: '100%',
                    }}
                  >
                    <Text style={{ fontSize: '18px' }}>💡</Text>
                    <VStack gap={0}>
                      <Text weight="semibold" style={{ fontSize: '13px' }}>
                        Thanh toán linh hoạt theo ý bạn:
                      </Text>
                      <Text type="supporting" color="secondary" style={{ fontSize: '12px', lineHeight: 1.5 }}>
                        Bạn có thể quét mã QR chuyển khoản ngay để Host chốt danh sách, hoặc hoàn toàn có thể chọn <Text weight="bold">Thanh toán sau tại sân</Text> bằng tiền mặt hoặc chuyển khoản khi đến tham gia buổi chơi!
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>
            )}
          </LayoutContent>
        }
        footer={
          <LayoutFooter
            hasDivider
            style={{
              background: 'var(--color-background-surface)',
            }}
          >
            {step === 'details' && (
              <>
                {/* 1. PLAYER NOT REGISTERED: CTA "Xác nhận tham gia" PINNED IN FOOTER */}
                {!isHost && !userRegistration && event.status === 'OPEN' && (
                  <VStack gap={1} style={{ width: '100%', alignItems: 'center' }}>
                    <Button
                      variant="primary"
                      size="lg"
                      label={isFull ? 'Xác nhận tham gia (Vào hàng chờ)' : 'Xác nhận tham gia'}
                      onClick={handleConfirmJoin}
                      style={{ width: '100%' }}
                    />
                    <Text type="supporting" color="secondary" style={{ textAlign: 'center', fontSize: '12px' }}>
                      💡 Nhấn xác nhận để giữ chỗ. Ở bước tiếp theo bạn có thể quét mã QR thanh toán hoặc chọn thanh toán sau tại sân!
                    </Text>
                  </VStack>
                )}

                {/* 2. PLAYER ALREADY REGISTERED */}
                {!isHost && userRegistration && (
                  <HStack
                    gap={2}
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <Badge
                      variant={userRegistration.status === 'APPROVED' ? 'green' : userRegistration.status === 'PENDING' ? 'yellow' : 'neutral'}
                      label={userRegistration.status === 'APPROVED' ? '✅ Đã duyệt giữ chỗ' : '⏳ Chờ duyệt giữ chỗ'}
                    />
                    <HStack gap={2}>
                      <Button
                        variant="secondary"
                        size="md"
                        label="Mã QR thanh toán"
                        onClick={() => setStep('confirm')}
                      />
                      <Button
                        variant="destructive"
                        size="md"
                        label="Hủy tham gia (Rút slot)"
                        onClick={handleCancelRegistration}
                      />
                    </HStack>
                  </HStack>
                )}

                {/* 3. HOST ACTIONS */}
                {isHost && (
                  <VStack gap={2} style={{ width: '100%' }}>
                    {!isCancelling ? (
                      <HStack gap={2} style={{ justifyContent: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
                        {event.status !== 'CANCELLED' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            label="Hủy sự kiện (Báo hoãn)"
                            onClick={() => setIsCancelling(true)}
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          label="Xóa vĩnh viễn sự kiện"
                          onClick={handleDeletePermanent}
                        />
                      </HStack>
                    ) : (
                      <VStack gap={2} style={{ width: '100%' }}>
                        <Text weight="semibold" color="accent">Lý do hủy sự kiện (sẽ thông báo cho mọi người):</Text>
                        <input
                          type="text"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Ví dụ: Mưa to sân dột, bận đột xuất..."
                          style={{
                            padding: 'var(--spacing-2)',
                            borderRadius: 'var(--radius-inner)',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                        <HStack gap={2} style={{ justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="sm" label="Quay lại" onClick={() => setIsCancelling(false)} />
                          <Button variant="destructive" size="sm" label="Xác nhận hủy kèo" onClick={handleHostCancelEvent} />
                        </HStack>
                      </VStack>
                    )}
                  </VStack>
                )}

                {/* 4. CANCELLED / CLOSED EVENT */}
                {!isHost && !userRegistration && event.status !== 'OPEN' && (
                  <HStack gap={2} style={{ justifyContent: 'flex-end', width: '100%' }}>
                    <Button variant="secondary" size="md" label="Đóng" onClick={onClose} />
                  </HStack>
                )}
              </>
            )}

            {step === 'confirm' && (
              <HStack
                gap={2}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  label="← Xem lại chi tiết kèo"
                  onClick={() => setStep('details')}
                />

                <HStack gap={2}>
                  <Button
                    variant="secondary"
                    size="md"
                    label="🏸 Thanh toán sau tại sân"
                    onClick={onClose}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    label="✅ Tôi đã chuyển khoản xong"
                    onClick={handleConfirmPaid}
                  />
                </HStack>
              </HStack>
            )}
          </LayoutFooter>
        }
      />
    </Dialog>
  );
};
