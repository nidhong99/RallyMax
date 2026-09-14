import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Button } from '@astryxdesign/core/Button';
import { Event, SKILL_LABELS } from '../types/database';
import { useApp } from '../context/AppContext';
import { MapPin, Clock, Users, Shield, ExternalLink } from 'lucide-react';

const DEFAULT_EVENT_COVER =
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80';

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  const { currentUser } = useApp();

  const approvedRegistrations = (event.registrations || []).filter(
    (r) => r.status === 'APPROVED' || r.status === 'CHECKED_IN'
  );

  const totalApprovedPlayers = approvedRegistrations.reduce(
    (acc, cur) => acc + 1 + (cur.guest_count || 0),
    0
  );

  const isFull = totalApprovedPlayers >= event.max_players;
  const isHost = currentUser ? event.host_id === currentUser.id : false;
  const userRegistration = currentUser ? (event.registrations || []).find((r) => r.player_id === currentUser.id) : null;

  // Format date & time
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  const formatTimeRange = () => {
    const timeStart = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dayStr = startDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    return `${dayStr}, ${timeStart} - ${timeEnd}`;
  };

  const minSkill = SKILL_LABELS[event.min_skill_level];
  const maxSkill = SKILL_LABELS[event.max_skill_level];

  return (
    <Card
      padding={0}
      style={{
        borderRadius: 'var(--radius-container)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-low)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-background-surface)',
      }}
      onClick={() => onSelect(event)}
    >
      {/* Event Cover Image Banner */}
      <VStack
        gap={0}
        style={{
          position: 'relative',
          width: '100%',
          height: '145px',
          overflow: 'hidden',
          background: 'var(--color-background-muted)',
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

        {/* Gradient Overlay & Header Badges */}
        <VStack
          gap={0}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.65) 100%)',
            justifyContent: 'space-between',
            padding: 'var(--spacing-2) var(--spacing-3)',
          }}
        >
          <HStack gap={1} style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <HStack gap={1} style={{ alignItems: 'center' }}>
              <StatusDot
                label={isFull ? 'Đã đủ slot' : event.status === 'OPEN' ? 'Đang mở' : 'Đã kết thúc'}
                variant={isFull ? 'warning' : event.status === 'OPEN' ? 'success' : 'error'}
              />
              <Badge
                variant={minSkill.badgeVariant}
                label={`${minSkill.label.split(' ')[0]}${minSkill.label !== maxSkill.label ? ` → ${maxSkill.label.split(' ')[0]}` : ''}`}
              />
            </HStack>

            <HStack gap={1} style={{ alignItems: 'center' }}>
              {isHost && (
                <Badge variant="purple" label="👑 Kèo của bạn" />
              )}
              {!isHost && userRegistration && (
                <Badge
                  variant={userRegistration.status === 'APPROVED' ? 'green' : 'yellow'}
                  label={userRegistration.status === 'APPROVED' ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
                />
              )}
            </HStack>
          </HStack>

          <HStack gap={1} style={{ justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
            <Badge
              variant={isFull ? 'red' : 'green'}
              label={`🏸 ${totalApprovedPlayers}/${event.max_players} slot`}
            />
          </HStack>
        </VStack>
      </VStack>

      {/* Card Body Content */}
      <VStack
        gap={3}
        style={{
          padding: 'var(--spacing-3) var(--spacing-4)',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <VStack gap={2}>
          <Heading
            level={4}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
              fontSize: '15px',
              minHeight: '40px',
            }}
          >
            {event.title}
          </Heading>

          {/* Venue & Time info */}
          <VStack gap={1}>
            <HStack gap={2} style={{ alignItems: 'flex-start' }}>
              <MapPin size={15} color="var(--color-icon-accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <HStack gap={1} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Text weight="medium" style={{ fontSize: '13px' }}>
                  {event.venue_name || event.venue?.name || 'Sân cầu lông'} ({event.court_numbers || 'Sân 1'})
                </Text>
                {event.location_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    label="Bản đồ ↗"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(event.location_url, '_blank');
                    }}
                    style={{
                      height: '20px',
                      padding: '0 var(--spacing-1)',
                      fontSize: '11px',
                      color: 'var(--color-text-accent)',
                    }}
                  />
                )}
              </HStack>
            </HStack>

            <HStack gap={2} style={{ alignItems: 'center' }}>
              <Clock size={15} color="var(--color-icon-secondary)" style={{ flexShrink: 0 }} />
              <Text color="secondary" style={{ fontSize: '13px' }}>{formatTimeRange()}</Text>
            </HStack>
          </VStack>
        </VStack>

        <VStack gap={2}>
          {/* Skill Requirement & Host info */}
          <HStack gap={1} style={{ alignItems: 'center' }}>
            <Shield size={14} color="var(--color-success)" />
            <Text type="supporting" color="secondary">
              Host: <Text weight="semibold">{event.host?.full_name ? event.host.full_name.split(' ')[0] : 'Host'}</Text> ({event.host?.reliability_score ?? 100}% uy tín)
            </Text>
          </HStack>

          {/* Footer: Fee, Slots, and CTA */}
          <HStack
            gap={2}
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 'var(--spacing-2)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <VStack gap={0}>
              <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                Phí tham gia
              </Text>
              <Text weight="bold" color="accent" style={{ fontSize: '15px' }}>
                {event.fee_per_player.toLocaleString('vi-VN')} đ
              </Text>
            </VStack>

            <HStack gap={2} style={{ alignItems: 'center' }}>
              <Button
                variant={isHost ? 'secondary' : 'primary'}
                size="sm"
                label={isHost ? 'Quản lý kèo' : userRegistration ? 'Xem đơn' : 'Tham gia'}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(event);
                }}
              />
            </HStack>
          </HStack>
        </VStack>
      </VStack>
    </Card>
  );
};
