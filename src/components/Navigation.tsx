import React from 'react';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { User, LogOut, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavigationProps {
  currentTab: 'explorer' | 'my-events';
  onSelectTab: (tab: 'explorer' | 'my-events') => void;
  onOpenCreateEvent: () => void;
  onOpenProfile: () => void;
  onOpenSupabaseGuide: () => void;
  onOpenAuth: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateEvent,
  onOpenProfile,
  onOpenSupabaseGuide,
  onOpenAuth,
}) => {
  const { currentUser, isLoggedIn, logout, isRealSupabase } = useApp();
  const isHost = currentUser?.role === 'HOST' || (currentUser?.email || '').toLowerCase() === 'nidhong99@gmail.com';

  return (
    <TopNav
      label="RallyMax Badminton Navigation"
      heading={
        <TopNavHeading
          heading="RallyMax"
          logo={
            <HStack
              gap={1}
              style={{
                background: 'var(--color-background-green)',
                padding: 'var(--spacing-1) var(--spacing-2)',
                borderRadius: 'var(--radius-element)',
                alignItems: 'center',
              }}
            >
              <Text weight="bold" color="accent">
                🏸
              </Text>
            </HStack>
          }
        />
      }
      startContent={
        <HStack gap={2}>
          <TopNavItem
            label="Khám phá kèo"
            isSelected={currentTab === 'explorer'}
            onClick={() => onSelectTab('explorer')}
          />
          <TopNavItem
            label="Kèo của tôi"
            isSelected={currentTab === 'my-events'}
            onClick={() => onSelectTab('my-events')}
          />
        </HStack>
      }
      endContent={
        <HStack gap={2} style={{ alignItems: 'center' }}>
          {/* Quick Create Event only for Host */}
          {isLoggedIn && isHost && (
            <Button
              variant="primary"
              size="sm"
              label="Tạo kèo mới"
              onClick={onOpenCreateEvent}
            />
          )}


          {/* Supabase Status Button */}
          <Button
            variant="ghost"
            size="sm"
            label={isRealSupabase ? 'Supabase Live' : 'Supabase Guide'}
            onClick={onOpenSupabaseGuide}
          />

          {/* Profile Dropdown Menu */}
          {isLoggedIn && currentUser ? (
            <DropdownMenu
              button={{
                variant: 'secondary',
                size: 'sm',
                label: (
                  <HStack gap={2} style={{ alignItems: 'center' }}>
                    <Avatar
                      size="sm"
                      src={currentUser.avatar_url}
                      name={currentUser.full_name || 'Vận động viên'}
                    />
                    <Text weight="semibold" style={{ fontSize: '13px' }}>
                      {currentUser.full_name?.trim() || currentUser.email.split('@')[0] || 'Vận động viên'}
                    </Text>
                    <Badge
                      variant={
                        (currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com')
                          ? 'purple'
                          : 'blue'
                      }
                      label={
                        (currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com')
                          ? '👑 Host'
                          : '🏸 Player'
                      }
                    />
                    <Badge
                      variant={(currentUser.reliability_score ?? 100) >= 90 ? 'green' : 'yellow'}
                      label={`${currentUser.reliability_score ?? 100}%`}
                    />
                  </HStack>
                ) as any,
              }}
              hasChevron={true}
              alignment="end"
              menuWidth={250}
              items={[
                {
                  label: (
                    <VStack gap={0}>
                      <Text weight="bold" style={{ fontSize: '13px' }}>
                        {currentUser.full_name || 'Vận động viên'}
                      </Text>
                      <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                        {currentUser.email}
                      </Text>
                    </VStack>
                  ),
                  description: (currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com')
                    ? '👑 Vai trò Host (Tổ chức kèo)'
                    : '🏸 Vai trò Player (Tham gia kèo)',
                  icon: <Shield size={16} color="var(--color-icon-accent)" />,
                },
                {
                  type: 'divider',
                },
                {
                  label: 'Thông tin cá nhân',
                  description: 'Xem & chỉnh sửa hồ sơ',
                  icon: <User size={16} color="var(--color-icon-secondary)" />,
                  onClick: onOpenProfile,
                },
                {
                  type: 'divider',
                },
                {
                  label: 'Đăng xuất',
                  description: 'Thoát khỏi phiên đăng nhập',
                  icon: <LogOut size={16} color="var(--color-destructive)" />,
                  variant: 'destructive',
                  onClick: logout,
                },
              ]}
            />
          ) : (
            <Button
              variant="primary"
              size="sm"
              label="🔑 Đăng nhập"
              onClick={onOpenAuth}
            />
          )}
        </HStack>
      }
    />
  );
};
