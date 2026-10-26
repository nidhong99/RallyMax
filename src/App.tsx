import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useMatch,
} from 'react-router-dom';
import { Theme } from '@astryxdesign/core/theme';
import { AppShell } from '@astryxdesign/core/AppShell';
import { VStack } from '@astryxdesign/core/Stack';
import { neutralTheme } from './themes/neutral/neutralTheme';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
import { supabase } from './lib/supabase';

const MainLayout: React.FC = () => {
  const { currentUser, events, isAdmin } = useApp();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const matchDetail = useMatch('/matches/:id');
  const eventId = matchDetail?.params.id;
  const isCreateRoute = location.pathname === '/matches/new' || location.pathname === '/create-event';
  const isProfileRoute = location.pathname === '/profile';

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [clonedEvent, setClonedEvent] = useState<Event | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewTargetEvent, setReviewTargetEvent] = useState<Event | null>(null);
  const [isSupabaseGuideOpen, setIsSupabaseGuideOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Sync /matches/:id URL with selectedEvent state
  useEffect(() => {
    if (!eventId || eventId === 'new') {
      if (selectedEvent) {
        setSelectedEvent(null);
      }
      return;
    }

    // Try finding event from already loaded events
    const existing = events.find((e) => e.id === eventId);
    if (existing) {
      setSelectedEvent(existing);
      return;
    }

    // Fallback: If page was opened directly by URL or refreshed, fetch event from Supabase
    if (supabase) {
      supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          host:users!events_host_id_fkey(*),
          registrations(*, user:users(*))
        `)
        .eq('id', eventId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setSelectedEvent(data as unknown as Event);
          }
        });
    }
  }, [eventId, events]);

  // Realtime safety: If the currently viewed event is deleted, close the modal immediately
  useEffect(() => {
    if (selectedEvent && events.length > 0) {
      const stillExists = events.some((e) => e.id === selectedEvent.id);
      if (!stillExists && eventId) {
        handleCloseDetail();
      }
    }
  }, [events, selectedEvent]);

  // Handle Event Detail Modal open / close
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    navigate(`/matches/${event.id}`);
  };

  const handleCloseDetail = () => {
    setSelectedEvent(null);
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/matches');
    }
  };

  // Handle Create Event Modal open / close
  const handleOpenCreateEvent = (eventToClone?: Event) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const isHost = (isAdmin || currentUser.role === 'HOST' || currentUser.role === 'ADMIN') && currentUser.role !== 'PLAYER';
    if (!isHost) {
      alert(t('common.onlyHostCanCreate'));
      return;
    }
    setClonedEvent(eventToClone || null);
    navigate('/matches/new');
  };

  const handleCloseCreate = () => {
    setClonedEvent(null);
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/matches');
    }
  };

  // Handle Profile Modal open / close
  const handleOpenProfile = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    navigate('/profile');
  };

  const handleCloseProfile = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/matches');
    }
  };

  // Handle Review Modal
  const handleOpenReview = (event: Event) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setReviewTargetEvent(event);
    setIsReviewOpen(true);
  };

const isDetailOpen = Boolean(eventId && eventId !== 'new' && selectedEvent);

  return (
    <AppShell
      height="auto"
      variant="surface"
      contentPadding={4}
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--color-background-surface)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      topNav={
        <Navigation
          onOpenCreateEvent={() => handleOpenCreateEvent()}
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
        <Routes>
          <Route path="/" element={<Navigate to="/matches" replace />} />
          <Route
            path="/matches"
            element={
              <EventExplorer
                onSelectEvent={handleSelectEvent}
                onOpenCreateEvent={() => handleOpenCreateEvent()}
              />
            }
          />
          <Route
            path="/matches/:id"
            element={
              <EventExplorer
                onSelectEvent={handleSelectEvent}
                onOpenCreateEvent={() => handleOpenCreateEvent()}
              />
            }
          />
          <Route
            path="/matches/new"
            element={
              <EventExplorer
                onSelectEvent={handleSelectEvent}
                onOpenCreateEvent={() => handleOpenCreateEvent()}
              />
            }
          />
          <Route path="/create-event" element={<Navigate to="/matches/new" replace />} />
          <Route
            path="/my-events"
            element={
              <MyEventsView
                onSelectEvent={handleSelectEvent}
                onOpenCreateEvent={() => handleOpenCreateEvent()}
                onCloneEvent={(ev) => handleOpenCreateEvent(ev)}
                onExplore={() => navigate('/matches')}
                onOpenReview={handleOpenReview}
              />
            }
          />
          <Route
            path="/host/dashboard"
            element={
              <AdminDashboardView
                onSelectEvent={handleSelectEvent}
                onOpenCreateEvent={() => handleOpenCreateEvent()}
              />
            }
          />
          <Route path="/admin" element={<Navigate to="/host/dashboard" replace />} />
          <Route
            path="/profile"
            element={
              <EventExplorer
                onSelectEvent={handleSelectEvent}
                onOpenCreateEvent={() => handleOpenCreateEvent()}
              />
            }
          />
          <Route path="*" element={<Navigate to="/matches" replace />} />
        </Routes>
      </VStack>

      {/* Modals synced with URL state */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onOpenReview={handleOpenReview}
        onCloneEvent={(ev) => handleOpenCreateEvent(ev)}
        onSelectEvent={handleSelectEvent}
      />

      <CreateEventModal
        isOpen={isCreateRoute}
        onClose={handleCloseCreate}
        initialEvent={clonedEvent}
      />

      <ProfileModal
        isOpen={isProfileRoute && Boolean(currentUser)}
        onClose={handleCloseProfile}
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
      <LanguageProvider>
        <AppProvider>
          <BrowserRouter>
            <MainLayout />
          </BrowserRouter>
        </AppProvider>
      </LanguageProvider>
    </Theme>
  );
}
