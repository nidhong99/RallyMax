import React from 'react';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { User, LogOut, Shield, ShieldCheck, Globe, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface NavigationProps {
  currentTab: 'explorer' | 'my-events' | 'admin-dashboard';
  onSelectTab: (tab: 'explorer' | 'my-events' | 'admin-dashboard') => void;
  onOpenCreateEvent: () => void;
  onOpenProfile: () => void;
  onOpenSupabaseGuide?: () => void;
  onOpenAuth: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateEvent,
  onOpenProfile,
  onOpenAuth,
}) => {
  const { currentUser, isLoggedIn, logout, isAdmin } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const isHost = isAdmin || currentUser?.role === 'HOST' || (currentUser?.email || '').toLowerCase() === 'nidhong99@gmail.com';

  return (
    <TopNav
      label="RallyMax Badminton Navigation"
      heading={
        <TopNavHeading
          heading={t('nav.brand')}
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
            label={t('nav.explore')}
            isSelected={currentTab === 'explorer'}
            onClick={() => onSelectTab('explorer')}
          />
          <TopNavItem
            label={t('nav.myEvents')}
            isSelected={currentTab === 'my-events'}
            onClick={() => onSelectTab('my-events')}
          />
          {isAdmin && (
            <TopNavItem
              label={t('nav.admin')}
              isSelected={currentTab === 'admin-dashboard'}
              onClick={() => onSelectTab('admin-dashboard')}
            />
          )}
        </HStack>
      }
      endContent={
        <HStack gap={2} style={{ alignItems: 'center' }}>
          {/* Quick Create Event only for Host & Admin */}
          {isLoggedIn && isHost && (
            <Button
              variant="primary"
              size="sm"
              label={t('nav.createEvent')}
              onClick={onOpenCreateEvent}
            />
          )}

          {/* Language Switcher */}
          <DropdownMenu
            button={{
              variant: 'ghost',
              size: 'sm',
              label: (
                <HStack gap={1} style={{ alignItems: 'center' }}>
                  <Globe size={15} color="var(--color-icon-secondary)" />
                  <Text weight="medium" style={{ fontSize: '13px' }}>
                    {language === 'vi' ? 'VI' : 'EN'}
                  </Text>
                </HStack>
              ) as any,
            }}
            hasChevron={true}
            alignment="end"
            menuWidth={170}
            items={[
              {
                label: 'Tiếng Việt',
                icon: <Text style={{ fontSize: '14px' }}>🇻🇳</Text>,
                endContent: language === 'vi' ? <Check size={14} color="var(--color-primary-base)" /> : null,
                onClick: () => setLanguage('vi'),
              },
              {
                label: 'English',
                icon: <Text style={{ fontSize: '14px' }}>🇬🇧</Text>,
                endContent: language === 'en' ? <Check size={14} color="var(--color-primary-base)" /> : null,
                onClick: () => setLanguage('en'),
              },
            ]}
          />

          {/* Profile Dropdown Menu or Sign In */}
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
                      name={currentUser.full_name || t('nav.athlete')}
                    />
                    <Text weight="semibold" style={{ fontSize: '13px' }}>
                      {currentUser.full_name?.trim() || currentUser.email.split('@')[0] || t('nav.athlete')}
                    </Text>
                    <Badge
                      variant={
                        isAdmin
                          ? 'purple'
                          : (currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com')
                          ? 'purple'
                          : 'blue'
                      }
                      label={
                        isAdmin
                          ? t('nav.roleAdminBadge')
                          : (currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com')
                          ? t('nav.roleHostBadge')
                          : t('nav.rolePlayerBadge')
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
                        {currentUser.full_name || t('nav.athlete')}
                      </Text>
                      <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                        {currentUser.email}
                      </Text>
                    </VStack>
                  ),
                  description: isAdmin
                    ? t('nav.roleSuperAdmin')
                    : (currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com')
                    ? t('nav.roleHost')
                    : t('nav.rolePlayer'),
                  icon: <Shield size={16} color="var(--color-icon-accent)" />,
                },
                ...(isAdmin
                  ? [
                      {
                        type: 'divider' as const,
                      },
                      {
                        label: t('nav.adminSystem'),
                        description: t('nav.adminSystemDesc'),
                        icon: <ShieldCheck size={16} color="var(--color-icon-accent)" />,
                        onClick: () => onSelectTab('admin-dashboard'),
                      },
                    ]
                  : []),
                {
                  type: 'divider' as const,
                },
                {
                  label: t('nav.profile'),
                  description: t('nav.profileDesc'),
                  icon: <User size={16} color="var(--color-icon-secondary)" />,
                  onClick: onOpenProfile,
                },
                {
                  type: 'divider' as const,
                },
                {
                  label: t('nav.signOut'),
                  description: t('nav.signOutDesc'),
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
              label={t('nav.signIn')}
              onClick={onOpenAuth}
            />
          )}
        </HStack>
      }
    />
  );
};
