import React, { useState } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { AppShell } from '@astryxdesign/core/AppShell';
import { VStack } from '@astryxdesign/core/Stack';
import { neutralTheme } from './themes/neutral/neutralTheme';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { EventExplorer } from './components/EventExplorer';
import { MyEventsView } from './components/MyEventsView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { EventDetailModal } from './components/EventDetailModal';
import { CreateEventModal } from './components/CreateEventModal';
import { ProfileModal } from './components/ProfileModal';
import { ReviewModal } from './components/ReviewModal';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { AuthModal } from './components/AuthModal';
import { Event } from './types/database';

const MainLayout: React.FC = () => {
  const { currentUser, events, isAdmin } = useApp();

  const [currentTab, setCurrentTab] = useState<'explorer' | 'my-events' | 'admin-dashboard'>('explorer');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewTargetEvent, setReviewTargetEvent] = useState<Event | null>(null);
  const [isSupabaseGuideOpen, setIsSupabaseGuideOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Realtime safety: If the currently viewed event is deleted by its Host, close the modal immediately
  React.useEffect(() => {
    if (isDetailOpen && selectedEvent) {
      const stillExists = events.some((e) => e.id === selectedEvent.id);
      if (!stillExists) {
        setIsDetailOpen(false);
        setSelectedEvent(null);
      }
    }
  }, [events, selectedEvent, isDetailOpen]);

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleOpenReview = (event: Event) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setReviewTargetEvent(event);
    setIsReviewOpen(true);
  };

  const handleOpenCreateEvent = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const isHost = isAdmin || currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com';
    if (!isHost) {
      alert('Tài khoản của bạn là Player. Chỉ Host hoặc Admin mới có quyền tạo kèo giao lưu.');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleOpenProfile = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setIsProfileOpen(true);
  };

  return (
    <AppShell
      height="auto"
      variant="surface"
      contentPadding={4}
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        backgroundColor: 'var(--color-background-surface)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      topNav={
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenCreateEvent={handleOpenCreateEvent}
          onOpenProfile={handleOpenProfile}
          onOpenSupabaseGuide={() => setIsSupabaseGuideOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      }
    >
      <VStack
        gap={4}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingBottom: 'var(--spacing-8)',
          width: '100%',
          flex: 1,
        }}
      >
        {currentTab === 'explorer' && (
          <EventExplorer
            onSelectEvent={handleSelectEvent}
            onOpenCreateEvent={handleOpenCreateEvent}
          />
        )}

        {currentTab === 'my-events' && (
          <MyEventsView
            onSelectEvent={handleSelectEvent}
            onOpenCreateEvent={handleOpenCreateEvent}
            onExplore={() => setCurrentTab('explorer')}
            onOpenReview={handleOpenReview}
          />
        )}

        {currentTab === 'admin-dashboard' && (
          <AdminDashboardView
            onSelectEvent={handleSelectEvent}
            onOpenCreateEvent={handleOpenCreateEvent}
          />
        )}
      </VStack>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOpenReview={handleOpenReview}
      />

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ReviewModal
        event={reviewTargetEvent}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />

      <SupabaseGuideModal
        isOpen={isSupabaseGuideOpen}
        onClose={() => setIsSupabaseGuideOpen(false)}
      />
    </AppShell>
  );
};

export default function App() {
  return (
    <Theme theme={neutralTheme} mode="light">
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </Theme>
  );
}
