import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Event, Venue, EventRegistration, RegistrationStatus, Review, Notification } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  activeRole: 'player' | 'host' | 'admin';
  setActiveRole: (role: 'player' | 'host' | 'admin') => void;
  login: (user: Profile) => void;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  loginByEmail: (email: string, password?: string, name?: string) => Promise<{ success: boolean; user?: Profile; error?: string }>;
  createCustomUser: (name: string, email: string) => Profile;
  switchUser: (userId: string) => void;
  allUsers: Profile[];
  events: Event[];
  venues: Venue[];
  reviews: Review[];
  notifications: Notification[];
  createEvent: (eventData: Partial<Event>) => Promise<Event>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<void>;
  cancelEvent: (eventId: string, reason: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  registerForEvent: (eventId: string, guestCount: number) => Promise<void>;
  cancelRegistration: (eventId: string, reason?: string) => Promise<void>;
  updateRegistrationStatus: (eventId: string, regId: string, status: RegistrationStatus) => Promise<void>;
  checkInPlayer: (eventId: string, regId: string, isNoShow: boolean) => Promise<void>;
  markPaymentStatus: (eventId: string, regId: string, status: 'PAID' | 'UNPAID') => Promise<void>;
  createVenue: (venueData: Partial<Venue>) => Promise<Venue>;
  updateVenue: (venueId: string, venueData: Partial<Venue>) => Promise<void>;
  deleteVenue: (venueId: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: 'PLAYER' | 'HOST' | 'ADMIN', isVerifiedHost?: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  purgeMockUsers: () => void;
  refreshProfiles: () => Promise<void>;
  refreshVenues: () => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  addReview: (reviewData: Partial<Review>) => Promise<void>;
  markNotificationRead: (id: string) => void;
  isRealSupabase: boolean;
}

const isMockEmail = (email?: string): boolean => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return (
    e === 'user.google@gmail.com' ||
    e === 'hoangnam.badminton@gmail.com' ||
    e === 'minhtuan.dev@gmail.com' ||
    e === 'lanphuong.cute@gmail.com' ||
    e === 'quanghuy.smash@gmail.com'
  );
};

const isMockId = (id?: string): boolean => {
  if (!id) return false;
  return (
    id.startsWith('user-host-') ||
    id.startsWith('user-player-') ||
    id.startsWith('google-user-')
  );
};

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
    buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant 10
    const hex = Array.from(buffer, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  return '00000000-0000-4000-8000-000000000000';
};

// ============================================================================
// Security & CodeQL Sanitized Storage Helper
// Ensures NO sensitive fields (password, token, secret, auth, pin) are stored
// in cleartext localStorage. Supabase Auth exclusively manages auth tokens.
// ============================================================================
const SENSITIVE_KEY_REGEX = /password|token|secret|auth|pin|credential|access_token|refresh_token/i;

const sanitizePublicProfile = (p: any): Profile => {
  return {
    id: String(p?.id || ''),
    email: String(p?.email || ''),
    full_name: String(p?.full_name || 'Vận động viên'),
    avatar_url: p?.avatar_url,
    phone_number: p?.phone_number,
    gender: p?.gender || 'OTHER',
    birth_year: p?.birth_year,
    skill_level: p?.skill_level || 'BEGINNER',
    dominant_hand: p?.dominant_hand || 'RIGHT',
    play_style: p?.play_style || 'ALL_ROUND',
    bio: p?.bio,
    district_code: p?.district_code || 'HN_BD',
    role: p?.role || 'PLAYER',
    is_verified_host: Boolean(p?.is_verified_host),
    reliability_score: typeof p?.reliability_score === 'number' ? p.reliability_score : 100,
    total_matches_played: typeof p?.total_matches_played === 'number' ? p.total_matches_played : 0,
    total_no_shows: typeof p?.total_no_shows === 'number' ? p.total_no_shows : 0,
    created_at: p?.created_at,
    updated_at: p?.updated_at,
  };
};

const deepSanitize = (val: any): any => {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(deepSanitize);

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (SENSITIVE_KEY_REGEX.test(k)) {
      continue;
    }
    clean[k] = deepSanitize(v);
  }
  return clean;
};

const sanitizePublicEvent = (e: any): any => {
  if (!e || typeof e !== 'object') return e;
  return {
    ...deepSanitize(e),
    host: e.host ? sanitizePublicProfile(e.host) : undefined,
    registrations: Array.isArray(e.registrations)
      ? e.registrations.map((r: any) => ({
          ...deepSanitize(r),
          player: r.player ? sanitizePublicProfile(r.player) : undefined,
        }))
      : [],
  };
};

const sanitizePublicState = (key: string, data: any): any => {
  if (key === 'rallymax_current_user') {
    return data ? sanitizePublicProfile(data) : null;
  }
  if (key === 'rallymax_users') {
    return Array.isArray(data) ? data.map(sanitizePublicProfile) : [];
  }
  if (key === 'rallymax_events') {
    return Array.isArray(data) ? data.map(sanitizePublicEvent) : [];
  }
  return deepSanitize(data);
};

export const savePublicAppState = (key: string, safeData: unknown): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (typeof safeData === 'string') {
      if (!SENSITIVE_KEY_REGEX.test(key) && !SENSITIVE_KEY_REGEX.test(safeData)) {
        window.localStorage.setItem(key, safeData);
      }
      return;
    }
    const sanitized = sanitizePublicState(key, safeData);
    window.localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (err) {
    console.warn(`[Storage] Error persisting ${key}:`, err);
  }
};

export const removePublicAppState = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {}
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('rallymax_users');
    let list: Profile[] = saved ? JSON.parse(saved) : [];
    // Permanently purge mock users
    list = list.filter(u => !isMockEmail(u.email) && !isMockId(u.id));
    savePublicAppState('rallymax_users', list);
    return list;
  });

  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    // 1. Try direct user JSON
    const savedUserJson = localStorage.getItem('rallymax_current_user');
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        console.warn('Error parsing saved user JSON:', e);
      }
    }
    // 2. Try ID lookup
    const savedUserId = localStorage.getItem('rallymax_current_user_id');
    if (savedUserId === 'guest') return null;
    if (savedUserId) {
      const savedUsersStr = localStorage.getItem('rallymax_users');
      const usersList: Profile[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
      const found = usersList.find(u => u.id === savedUserId);
      if (found) return found;
    }
    return null; // Guest by default so "🔑 Đăng nhập" button appears on navbar
  });

  const [activeRole, setActiveRole] = useState<'player' | 'host' | 'admin'>(() => {
    const saved = localStorage.getItem('rallymax_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.role === 'ADMIN') {
          return 'admin';
        }
        if (u && u.role === 'HOST') {
          return 'host';
        }
      } catch (e) {}
    }
    return 'player';
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  const [venues, setVenues] = useState<Venue[]>(() => {
    const saved = localStorage.getItem('rallymax_venues');
    if (saved) {
      try {
        const parsed: Venue[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(v => v && !v.id.startsWith('venue-'));
        }
      } catch (e) {
        console.warn('Error parsing venues:', e);
      }
    }
    return [];
  });

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('rallymax_events');
    if (saved) {
      try {
        const parsed: Event[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep all valid events, never purge user events
          return parsed.filter(e => e && e.id);
        }
      } catch (e) {
        console.warn('Error parsing saved events:', e);
      }
    }
    return [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('rallymax_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      user_id: allUsers[1]?.id || 'user-player-1',
      type: 'REGISTRATION_APPROVED',
      title: 'Đăng ký đã được duyệt!',
      body: 'Host Nam đã duyệt bạn vào buổi giao lưu tối Thứ Năm tại Sân Viettel.',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  // Sync Supabase Auth session and fetch database profiles
  useEffect(() => {
    // 0. Check URL hash for OAuth / Email Magic Link callback (#access_token=...&refresh_token=...)
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken) {
          const parts = accessToken.split('.');
          if (parts.length >= 2) {
            const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);
            const userEmail = (payload.email || '').trim().toLowerCase();
            const userMeta = payload.user_metadata || {};
            const fullName = userMeta.full_name || userMeta.name || (userEmail ? userEmail.split('@')[0] : 'Vận động viên');
            const avatarUrl = userMeta.avatar_url || userMeta.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
            const initialRole: 'ADMIN' | 'HOST' | 'PLAYER' =
              (userMeta.role === 'ADMIN' || userMeta.role === 'HOST') ? userMeta.role : 'PLAYER';

            const userFromHash: Profile = {
              id: payload.sub || 'user-' + generateUuid(),
              email: userEmail,
              full_name: fullName,
              avatar_url: avatarUrl,
              phone_number: userMeta.phone || '',
              gender: 'OTHER',
              role: initialRole,
              is_verified_host: Boolean(userMeta.is_verified_host || initialRole === 'HOST' || initialRole === 'ADMIN'),
              skill_level: 'BEGINNER',
              dominant_hand: 'RIGHT',
              play_style: 'ALL_ROUND',
              district_code: 'HN_BD',
              reliability_score: 100,
              total_matches_played: 0,
              total_no_shows: 0,
              created_at: new Date().toISOString(),
            };

            login(userFromHash);

            if (supabase && refreshToken) {
              supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {}, () => {});
            }

            // Clean up the URL hash so it doesn't linger in browser address bar
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }
      }
    } catch (e) {
      console.warn('Error extracting auth token from hash:', e);
    }

    if (!supabase) return;

    // 1. Fetch profiles from Supabase database if reachable
    supabase.from('profiles').select('*').then(({ data, error }) => {
      if (data && data.length > 0 && !error) {
        setAllUsers(() => {
          const validProfiles = data
            .filter((p: any) => !isMockEmail(p.email) && !isMockId(p.id))
            .map((p: any) => {
              const roleFromDb: 'PLAYER' | 'HOST' | 'ADMIN' =
                (p.role === 'ADMIN' || p.role === 'HOST' || p.role === 'PLAYER')
                  ? p.role
                  : 'PLAYER';
              return {
                id: p.id,
                email: p.email || '',
                full_name: p.full_name || p.email?.split('@')[0] || 'Vận động viên',
                avatar_url: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                phone_number: p.phone_number || '',
                gender: p.gender || 'OTHER',
                role: roleFromDb,
                is_verified_host: p.is_verified_host ?? (roleFromDb === 'HOST' || roleFromDb === 'ADMIN'),
                skill_level: p.skill_level || 'BEGINNER',
                dominant_hand: p.dominant_hand || 'RIGHT',
                play_style: p.play_style || 'ALL_ROUND',
                district_code: p.district_code || 'HN_BD',
                reliability_score: p.reliability_score ?? 100,
                total_matches_played: p.total_matches_played ?? 0,
                total_no_shows: p.total_no_shows ?? 0,
                created_at: p.created_at || new Date().toISOString(),
              };
            });
          savePublicAppState('rallymax_users', validProfiles);
          return validProfiles;
        });

        // Sync currentUser if updated in Supabase
        setCurrentUser(current => {
          if (!current) return null;
          const freshData = data.find((p: any) => p.id === current.id || p.email?.toLowerCase() === current.email?.toLowerCase());
          if (freshData) {
            const roleFromDb: 'PLAYER' | 'HOST' | 'ADMIN' =
              (freshData.role === 'ADMIN' || freshData.role === 'HOST' || freshData.role === 'PLAYER')
                ? freshData.role
                : 'PLAYER';
            const updated: Profile = {
              ...current,
              role: roleFromDb,
              is_verified_host: freshData.is_verified_host ?? (roleFromDb === 'HOST' || roleFromDb === 'ADMIN'),
              full_name: freshData.full_name || current.full_name,
            };
            savePublicAppState('rallymax_current_user', updated);
            setActiveRole(roleFromDb === 'ADMIN' ? 'admin' : (roleFromDb === 'HOST' ? 'host' : 'player'));
            return updated;
          }
          return current;
        });
      }
    }, err => {
      console.warn('Supabase profiles query error:', err);
    });

    // 1b. Fetch venues from Supabase database
    const fetchCloudVenues = () => {
      supabase
        .from('venues')
        .select('*')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (data && !error && data.length > 0) {
            setVenues(data);
            savePublicAppState('rallymax_venues', data);
          } else if (error) {
            console.warn('Supabase venues query error:', error.message);
          }
        }, err => {
          console.warn('Supabase venues network error:', err);
        });
    };

    fetchCloudVenues();

    // 2. Check active auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSupabaseProfile(session.user);
      }
    }, err => {
      console.warn('Supabase getSession warning:', err);
    });

    // 3. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncSupabaseProfile(session.user);
      }
    });

    // 4. Fetch live events from Supabase Cloud Database for ALL users across all devices
    const fetchCloudEvents = () => {
      supabase
        .from('events')
        .select('*, host:profiles(*), venue:venues(*), registrations:event_registrations(*, player:profiles(*))')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (data && !error) {
            setEvents(prev => {
              const map = new Map<string, Event>();
              const serverIds = new Set((data || []).map((d: any) => d.id));
              // Keep local events that are not yet on server
              const pendingLocalEvents = prev.filter(e => !serverIds.has(e.id));
              pendingLocalEvents.forEach(e => map.set(e.id, e));

              // Add live events from server (Server is single source of truth for synced events)
              data.forEach((ev: any) => {
                const matchedV = venues.find(v => v.id === ev.venue_id || v.name === ev.venue_name);
                const localMatch = prev.find(p => p.id === ev.id);
                map.set(ev.id, {
                  ...ev,
                  is_recurring: ev.is_recurring ?? localMatch?.is_recurring ?? false,
                  recurrence_frequency: ev.recurrence_frequency || localMatch?.recurrence_frequency,
                  recurrence_group_id: ev.recurrence_group_id || localMatch?.recurrence_group_id,
                  recurrence_index: ev.recurrence_index ?? localMatch?.recurrence_index,
                  recurrence_count: ev.recurrence_count ?? localMatch?.recurrence_count,
                  cover_image_url: ev.cover_image_url || ev.venue?.image_url || matchedV?.image_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
                  venue: ev.venue || matchedV || {
                    id: ev.venue_id || 'v-default',
                    name: ev.venue_name || 'Sân cầu lông',
                    address: ev.location_url || 'Đang cập nhật địa chỉ',
                    district_code: 'HN_BD',
                    image_url: matchedV?.image_url,
                  },
                  host: ev.host,
                  registrations: ev.registrations || [],
                });
              });

              const merged = Array.from(map.values());
              savePublicAppState('rallymax_events', merged);
              return merged;
            });
          }
        }, err => {
          console.warn('Supabase fetch events error:', err);
        });
    };

    fetchCloudEvents();

    // 5. Realtime listener: instant sync on INSERT, UPDATE, DELETE for all users
    const eventsChannel = supabase
      .channel('public:events_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload: any) => {
          // If a DELETE event is received, immediately evict it from local state
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            const deletedId = payload.old.id;
            setEvents(prev => {
              const filtered = prev.filter(e => e.id !== deletedId);
              savePublicAppState('rallymax_events', filtered);
              return filtered;
            });
          }
          // Fetch updated list from cloud
          fetchCloudEvents();
        }
      )
      .subscribe();

    // 5b. Realtime listener: instant 2-way sync on venues INSERT, UPDATE, DELETE
    const venuesChannel = supabase
      .channel('public:venues_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'venues' },
        (payload: any) => {
          console.log('[Supabase Realtime] Venues change detected:', payload);
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            const deletedId = payload.old.id;
            setVenues(prev => {
              const filtered = prev.filter(v => v.id !== deletedId);
              savePublicAppState('rallymax_venues', filtered);
              return filtered;
            });
          } else {
            fetchCloudVenues();
          }
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(venuesChannel);
    };
  }, []);

  const syncSupabaseProfile = (user: any) => {
    const existing = allUsers.find(u => u.id === user.id || u.email.toLowerCase() === (user.email || '').toLowerCase());
    if (existing) {
      login(existing);
    } else {
      const initialRole: 'ADMIN' | 'HOST' | 'PLAYER' =
        (user.user_metadata?.role === 'ADMIN' || user.user_metadata?.role === 'HOST')
          ? user.user_metadata.role
          : 'PLAYER';
      const newProfile: Profile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Vận động viên mới',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone_number: user.user_metadata?.phone || '',
        gender: 'OTHER',
        role: initialRole,
        is_verified_host: Boolean(user.user_metadata?.is_verified_host || initialRole === 'HOST' || initialRole === 'ADMIN'),
        skill_level: 'BEGINNER',
        dominant_hand: 'RIGHT',
        play_style: 'ALL_ROUND',
        district_code: 'HN_BD',
        reliability_score: 100,
        total_matches_played: 0,
        total_no_shows: 0,
        created_at: new Date().toISOString(),
      };
      setAllUsers(prev => {
        const next = [newProfile, ...prev];
        savePublicAppState('rallymax_users', next);
        return next;
      });
      login(newProfile);
    }
  };

  const login = (user: Profile) => {
    const email = (user.email || '').toLowerCase();
    const finalRole: 'ADMIN' | 'HOST' | 'PLAYER' =
      (user.role === 'ADMIN' || user.role === 'HOST' || user.role === 'PLAYER')
        ? user.role
        : 'PLAYER';
    const isHost = finalRole === 'HOST' || finalRole === 'ADMIN';
    const profileToStore: Profile = {
      ...user,
      role: finalRole,
      is_verified_host: Boolean(user.is_verified_host || isHost),
    };

    setCurrentUser(profileToStore);
    setActiveRole(finalRole === 'ADMIN' ? 'admin' : (finalRole === 'HOST' ? 'host' : 'player'));
    savePublicAppState('rallymax_current_user_id', profileToStore.id);
    savePublicAppState('rallymax_current_user', profileToStore);

    setAllUsers(prev => {
      const exists = prev.some(u => u.id === profileToStore.id || u.email.toLowerCase() === profileToStore.email.toLowerCase());
      const next = exists
        ? prev.map(u => (u.id === profileToStore.id || u.email.toLowerCase() === profileToStore.email.toLowerCase()) ? { ...u, ...profileToStore } : u)
        : [profileToStore, ...prev];
      savePublicAppState('rallymax_users', next);
      return next;
    });

    // Seamlessly link any previously created events to this logged-in account
    setEvents(prev => {
      let hasChange = false;
      const updated = prev.map(e => {
        const matchesEmail = Boolean(e.host?.email && email && e.host.email.toLowerCase() === email);
        const wasHostDefault = isHost && (e.host_id === 'user-host-1' || !e.host_id || e.host_id.startsWith('user-'));
        if (matchesEmail || wasHostDefault) {
          hasChange = true;
          return {
            ...e,
            host_id: profileToStore.id,
            host: { ...(e.host || {}), ...profileToStore },
          };
        }
        return e;
      });
      if (hasChange) {
        savePublicAppState('rallymax_events', updated);
        return updated;
      }
      return prev;
    });
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setCurrentUser(null);
    removePublicAppState('rallymax_current_user');
    savePublicAppState('rallymax_current_user_id', 'guest');
  };

  const loginByEmail = async (
    email: string,
    password?: string,
    name?: string
  ): Promise<{ success: boolean; user?: Profile; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Vui lòng nhập địa chỉ email' };
    }

    // 1. If password provided and Supabase is configured, try Supabase password login
    if (password && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (data?.user && !error) {
          syncSupabaseProfile(data.user);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase password login warning:', err.message);
      }
    }

    // 2. Query Supabase profiles table directly by email
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (data && !error) {
          const effectiveRole: 'PLAYER' | 'HOST' | 'ADMIN' =
            (data.role === 'ADMIN' || data.role === 'HOST' || data.role === 'PLAYER')
              ? data.role
              : 'PLAYER';
          const profile: Profile = {
            id: data.id,
            email: data.email,
            full_name: data.full_name || cleanEmail.split('@')[0],
            avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            phone_number: data.phone_number || '',
            gender: data.gender || 'OTHER',
            role: effectiveRole,
            is_verified_host: data.is_verified_host ?? (effectiveRole === 'HOST' || effectiveRole === 'ADMIN'),
            skill_level: data.skill_level || 'BEGINNER',
            dominant_hand: data.dominant_hand || 'RIGHT',
            play_style: data.play_style || 'ALL_ROUND',
            district_code: data.district_code || 'HN_BD',
            reliability_score: data.reliability_score ?? 100,
            total_matches_played: data.total_matches_played ?? 0,
            total_no_shows: data.total_no_shows ?? 0,
            created_at: data.created_at || new Date().toISOString(),
          };
          login(profile);
          return { success: true, user: profile };
        }
      } catch (err: any) {
        console.warn('Supabase email lookup warning:', err.message);
      }
    }

    // 3. Search in local allUsers
    const localFound = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (localFound) {
      login(localFound);
      return { success: true, user: localFound };
    }

    // 4. Create new profile with this email
    const finalName = name?.trim() || cleanEmail.split('@')[0];
    const newProfile: Profile = {
      id: generateUuid(),
      email: cleanEmail,
      full_name: finalName,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone_number: '',
      gender: 'OTHER',
      role: 'PLAYER',
      is_verified_host: false,
      skill_level: 'BEGINNER',
      dominant_hand: 'RIGHT',
      play_style: 'ALL_ROUND',
      district_code: 'HN_BD',
      reliability_score: 100,
      total_matches_played: 0,
      total_no_shows: 0,
      created_at: new Date().toISOString(),
    };

    // Upsert into Supabase profiles if possible
    if (supabase) {
      supabase.from('profiles').upsert([newProfile]).then(() => {}, () => {});
    }

    login(newProfile);
    return { success: true, user: newProfile };
  };

  const getRedirectUrl = () => {
    return window.location.href.split('#')[0].split('?')[0];
  };

  const signInWithGoogle = async () => {
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: getRedirectUrl() },
        });
        if (error) throw error;
        return;
      } catch (err: any) {
        console.warn('Supabase Google OAuth error:', err.message);
      }
    }
    // Fallback demo Google user
    const googleUser: Profile = {
      id: 'google-user-' + generateUuid(),
      email: 'user.google@gmail.com',
      full_name: 'Người Chơi Google (Gmail)',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      gender: 'MALE',
      skill_level: 'INTERMEDIATE',
      dominant_hand: 'RIGHT',
      play_style: 'ALL_ROUND',
      district_code: 'HN_CG',
      reliability_score: 100,
      total_matches_played: 0,
      total_no_shows: 0,
      created_at: new Date().toISOString(),
    };
    login(googleUser);
  };

  const signInWithFacebook = async () => {
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: getRedirectUrl() },
        });
        if (error) throw error;
        return;
      } catch (err: any) {
        console.warn('Supabase Facebook OAuth error:', err.message);
      }
    }
    // Fallback demo Facebook user
    const fbUser: Profile = {
      id: 'fb-user-' + generateUuid(),
      email: 'player.facebook@fb.com',
      full_name: 'Vận Động Viên Facebook',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      gender: 'MALE',
      skill_level: 'LOW_INTERMEDIATE',
      dominant_hand: 'RIGHT',
      play_style: 'DOUBLES_FRONT',
      district_code: 'HCM_Q1',
      reliability_score: 100,
      total_matches_played: 0,
      total_no_shows: 0,
      created_at: new Date().toISOString(),
    };
    login(fbUser);
  };

  const createCustomUser = (name: string, email: string): Profile => {
    const cleanEmail = email.trim().toLowerCase();
    const newUser: Profile = {
      id: generateUuid(),
      email: cleanEmail,
      full_name: name.trim() || cleanEmail.split('@')[0],
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      gender: 'OTHER',
      skill_level: 'BEGINNER',
      dominant_hand: 'RIGHT',
      play_style: 'ALL_ROUND',
      district_code: 'HN_BD',
      reliability_score: 100,
      total_matches_played: 0,
      total_no_shows: 0,
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      supabase.from('profiles').upsert([newUser]).then(() => {}, () => {});
    }
    login(newUser);
    return newUser;
  };

  // Persist local state
  useEffect(() => {
    savePublicAppState('rallymax_users', allUsers);
  }, [allUsers]);

  useEffect(() => {
    savePublicAppState('rallymax_venues', venues);
  }, [venues]);

  useEffect(() => {
    savePublicAppState('rallymax_events', events);
  }, [events]);

  useEffect(() => {
    savePublicAppState('rallymax_reviews', reviews);
  }, [reviews]);

  const switchUser = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      login(found);
    }
  };

  const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập để tạo sự kiện');
    const isHost = (isAdmin || currentUser.role === 'HOST' || currentUser.role === 'ADMIN') && currentUser.role !== 'PLAYER';
    if (!isHost) throw new Error('Chỉ tài khoản có vai trò Host hoặc Admin mới được phép tạo kèo giao lưu');

    const validHostId =
      currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)
        ? currentUser.id
        : generateUuid();

    const eventId = generateUuid();
    const matchedVenue = venues.find(v => v.id === eventData.venue_id || v.name === eventData.venue_name);
    const venueName = eventData.venue_name || matchedVenue?.name || 'Sân Cầu Lông';
    const fallbackVenue: Venue = {
      id: eventData.venue_id || matchedVenue?.id || 'custom-venue-' + generateUuid(),
      name: venueName,
      address: matchedVenue?.address || eventData.location_url || 'Đang cập nhật địa chỉ',
      district_code: matchedVenue?.district_code || 'HN_BD',
      image_url: matchedVenue?.image_url,
      maps_url: eventData.location_url || matchedVenue?.maps_url,
    };

    const newEvent: Event = {
      id: eventId,
      host_id: validHostId,
      venue_id: eventData.venue_id || fallbackVenue.id,
      venue_name: venueName,
      location_url: eventData.location_url || '',
      court_numbers: eventData.court_numbers || 'Sân 1',
      title: eventData.title || 'Buổi giao lưu cầu lông',
      description: eventData.description || '',
      start_time: eventData.start_time || new Date().toISOString(),
      end_time: eventData.end_time || new Date(Date.now() + 7200000).toISOString(),
      fee_per_player: eventData.fee_per_player || 60000,
      payment_qr_url: eventData.payment_qr_url,
      payment_note: eventData.payment_note,
      max_players: eventData.max_players || 6,
      min_players: eventData.min_players || 4,
      min_skill_level: eventData.min_skill_level || 'BEGINNER',
      max_skill_level: eventData.max_skill_level || 'PRO',
      requires_approval: eventData.requires_approval ?? true,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      is_recurring: eventData.is_recurring ?? false,
      recurrence_frequency: eventData.recurrence_frequency,
      recurrence_group_id: eventData.recurrence_group_id,
      recurrence_index: eventData.recurrence_index,
      recurrence_count: eventData.recurrence_count,
      cover_image_url:
        eventData.cover_image_url ||
        matchedVenue?.image_url ||
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      cover_image_position: eventData.cover_image_position || '50% 50%',
      venue: {
        ...fallbackVenue,
        image_url: matchedVenue?.image_url || eventData.cover_image_url,
      },
      host: { ...currentUser, id: validHostId },
      registrations: [],
    };

    setEvents(prev => [newEvent, ...prev]);

    // Push to Supabase Cloud so ALL devices and users receive it
    if (supabase && currentUser) {
      try {
        const payload: any = {
          id: eventId,
          host_id: validHostId,
          venue_name: venueName,
          location_url: newEvent.location_url,
          court_numbers: newEvent.court_numbers,
          title: newEvent.title,
          description: newEvent.description,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          fee_per_player: newEvent.fee_per_player,
          payment_qr_url: newEvent.payment_qr_url,
          payment_note: newEvent.payment_note,
          max_players: newEvent.max_players,
          min_players: newEvent.min_players,
          min_skill_level: newEvent.min_skill_level,
          max_skill_level: newEvent.max_skill_level,
          requires_approval: newEvent.requires_approval,
          status: 'OPEN',
        };
        if (newEvent.venue_id && newEvent.venue_id.includes('-') && !newEvent.venue_id.startsWith('custom-')) {
          payload.venue_id = newEvent.venue_id;
        }
        if (newEvent.is_recurring !== undefined) payload.is_recurring = newEvent.is_recurring;
        if (newEvent.recurrence_frequency) payload.recurrence_frequency = newEvent.recurrence_frequency;
        if (newEvent.recurrence_group_id) payload.recurrence_group_id = newEvent.recurrence_group_id;
        if (newEvent.recurrence_index) payload.recurrence_index = newEvent.recurrence_index;
        if (newEvent.recurrence_count) payload.recurrence_count = newEvent.recurrence_count;

        const syncSuccess = (data: any) => {
          setEvents(prev => {
            const next = prev.map(e => (e.id === newEvent.id ? {
              ...e,
              id: data.id,
              ...data,
              is_recurring: data.is_recurring ?? newEvent.is_recurring,
              recurrence_frequency: data.recurrence_frequency || newEvent.recurrence_frequency,
              recurrence_group_id: data.recurrence_group_id || newEvent.recurrence_group_id,
              recurrence_index: data.recurrence_index ?? newEvent.recurrence_index,
              recurrence_count: data.recurrence_count ?? newEvent.recurrence_count,
              cover_image_url: newEvent.cover_image_url || data.cover_image_url || data.venue?.image_url || matchedVenue?.image_url,
              cover_image_position: newEvent.cover_image_position || data.cover_image_position,
              venue: data.venue || {
                ...fallbackVenue,
                image_url: matchedVenue?.image_url || newEvent.cover_image_url,
              },
              host: currentUser,
            } : e));
            savePublicAppState('rallymax_events', next);
            return next;
          });
        };

        const attemptInsert = (dataPayload: any) => {
          supabase
            .from('events')
            .insert([dataPayload])
            .select('*, host:profiles(*), venue:venues(*)')
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                syncSuccess(data);
              } else if (error) {
                // If the remote table has not run the recurring columns migration yet (code 42703), retry without those columns
                if (error.code === '42703' || error.message?.includes('is_recurring') || error.message?.includes('recurrence_')) {
                  const fallbackPayload = { ...dataPayload };
                  delete fallbackPayload.is_recurring;
                  delete fallbackPayload.recurrence_frequency;
                  delete fallbackPayload.recurrence_group_id;
                  delete fallbackPayload.recurrence_index;
                  delete fallbackPayload.recurrence_count;
                  supabase
                    .from('events')
                    .insert([fallbackPayload])
                    .select('*, host:profiles(*), venue:venues(*)')
                    .single()
                    .then(({ data: fbData, error: fbErr }) => {
                      if (fbData && !fbErr) {
                        syncSuccess(fbData);
                      } else if (fbErr) {
                        console.warn('Supabase insert fallback warning:', fbErr.message);
                      }
                    });
                } else {
                  console.warn('Supabase insert event warning:', error.message);
                }
              }
            });
        };

        attemptInsert(payload);
      } catch (err) {
        console.warn('Supabase createEvent call error:', err);
      }
    }

    return newEvent;
  };

  const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
    setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, ...eventData, updated_at: new Date().toISOString() } : e)));
  };

  const cancelEvent = async (eventId: string, reason: string) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId
          ? {
              ...e,
              status: 'CANCELLED',
              cancellation_reason: reason,
              updated_at: new Date().toISOString(),
            }
          : e
      )
    );
  };

  const deleteEvent = async (eventId: string) => {
    // 1. Immediately remove from local state
    setEvents(prev => {
      const next = prev.filter(e => e.id !== eventId);
      savePublicAppState('rallymax_events', next);
      return next;
    });

    // 2. Delete on Supabase Cloud so all other connected devices update in realtime
    if (supabase) {
      try {
        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) {
          console.warn('Supabase delete event error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase delete event call error:', err);
      }
    }
  };

  const registerForEvent = async (eventId: string, guestCount: number) => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập');

    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    const status: RegistrationStatus = targetEvent.requires_approval ? 'PENDING' : 'APPROVED';

    const validPlayerId =
      currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)
        ? currentUser.id
        : generateUuid();

    const regId = generateUuid();
    const newReg: EventRegistration = {
      id: regId,
      event_id: eventId,
      player_id: validPlayerId,
      guest_count: guestCount,
      status,
      payment_status: 'UNPAID',
      registered_at: new Date().toISOString(),
      player: { ...currentUser, id: validPlayerId },
    };

    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== eventId) return ev;
        const currentRegs = (ev.registrations || []).filter(r => r.player_id !== validPlayerId);
        return {
          ...ev,
          registrations: [...currentRegs, newReg],
        };
      })
    );

    // Sync to Supabase Cloud
    if (supabase && currentUser) {
      try {
        supabase
          .from('event_registrations')
          .insert([
            {
              id: regId,
              event_id: eventId,
              player_id: validPlayerId,
              guest_count: guestCount,
              status,
              payment_status: 'UNPAID',
            },
          ])
          .then(() => {}, (err) => console.warn('Supabase register error:', err));
      } catch (e) {
        console.warn('Supabase registerForEvent call error:', e);
      }
    }

    if (targetEvent.host_id !== currentUser.id) {
      setNotifications(prev => [
        {
          id: 'notif-' + generateUuid(),
          user_id: targetEvent.host_id,
          event_id: eventId,
          type: 'NEW_APPLICANT',
          title: 'Có người mới đăng ký kèo!',
          body: `${currentUser.full_name} vừa đăng ký tham gia sự kiện "${targetEvent.title}".`,
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const cancelRegistration = async (eventId: string, reason?: string) => {
    if (!currentUser) return;
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          registrations: (ev.registrations || []).map(r =>
            r.player_id === currentUser.id
              ? {
                  ...r,
                  status: 'CANCELLED' as RegistrationStatus,
                  cancelled_at: new Date().toISOString(),
                  cancellation_reason: reason || 'Người chơi chủ động hủy đăng ký',
                }
              : r
          ),
        };
      })
    );
  };

  const updateRegistrationStatus = async (eventId: string, regId: string, status: RegistrationStatus) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          registrations: (ev.registrations || []).map(r => (r.id === regId ? { ...r, status, reviewed_at: new Date().toISOString() } : r)),
        };
      })
    );
  };

  const checkInPlayer = async (eventId: string, regId: string, isNoShow: boolean) => {
    const status: RegistrationStatus = isNoShow ? 'NO_SHOW' : 'CHECKED_IN';
    
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          registrations: (ev.registrations || []).map(r => {
            if (r.id === regId) {
              if (isNoShow && r.player) {
                const targetPlayerId = r.player.id;
                setAllUsers(prevUsers =>
                  prevUsers.map(u => {
                    if (u.id === targetPlayerId) {
                      const newNoShows = (u.total_no_shows || 0) + 1;
                      const newTotal = (u.total_matches_played || 0) + 1;
                      return { ...u, total_no_shows: newNoShows, total_matches_played: newTotal };
                    }
                    return u;
                  })
                );
              }
              return { ...r, status };
            }
            return r;
          }),
        };
      })
    );
  };

  const markPaymentStatus = async (eventId: string, regId: string, status: 'PAID' | 'UNPAID') => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          registrations: (ev.registrations || []).map(r => (r.id === regId ? { ...r, payment_status: status } : r)),
        };
      })
    );
  };

  const refreshVenues = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('venues').select('*').order('name', { ascending: true });
    if (error) {
      console.warn('Supabase refreshVenues error:', error);
      throw new Error(error.message);
    }
    if (data) {
      setVenues(data);
      savePublicAppState('rallymax_venues', data);
    }
  };

  const createVenue = async (venueData: Partial<Venue>): Promise<Venue> => {
    const venueId = venueData.id || generateUuid();
    const newVenue: Venue = {
      id: venueId,
      name: venueData.name || 'Sân Cầu Lông Mới',
      address: venueData.address || '',
      district_code: venueData.district_code || 'HN_BD',
      contact_phone: venueData.contact_phone,
      maps_url: venueData.maps_url,
      image_url: venueData.image_url,
      gallery_images: venueData.gallery_images || (venueData.image_url ? [venueData.image_url] : []),
      price_range: venueData.price_range,
      created_by: (currentUser?.id && currentUser.id.includes('-')) ? currentUser.id : undefined,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const payload: Record<string, any> = {
        id: venueId,
        name: newVenue.name,
        address: newVenue.address,
        district_code: newVenue.district_code,
        maps_url: newVenue.maps_url || null,
        image_url: newVenue.image_url || null,
        gallery_images: newVenue.gallery_images || [],
      };
      if (newVenue.contact_phone) payload.contact_phone = newVenue.contact_phone;
      if (newVenue.price_range) payload.price_range = newVenue.price_range;
      if (newVenue.created_by) {
        payload.created_by = newVenue.created_by;
      }
      const { data, error } = await supabase.from('venues').insert([payload]).select().single();
      if (error) {
        console.error('Supabase venue insert error:', error);
        throw new Error(error.message);
      }
      if (data) {
        newVenue.id = data.id;
      }
    }

    setVenues(prev => {
      const updated = [newVenue, ...prev.filter(v => v.id !== newVenue.id)];
      savePublicAppState('rallymax_venues', updated);
      return updated;
    });

    return newVenue;
  };

  const updateVenue = async (venueId: string, venueData: Partial<Venue>) => {
    if (supabase) {
      const updatePayload: Record<string, any> = {};
      if (venueData.name !== undefined) updatePayload.name = venueData.name;
      if (venueData.address !== undefined) updatePayload.address = venueData.address;
      if (venueData.district_code !== undefined) updatePayload.district_code = venueData.district_code;
      if (venueData.contact_phone !== undefined) updatePayload.contact_phone = venueData.contact_phone || null;
      if (venueData.maps_url !== undefined) updatePayload.maps_url = venueData.maps_url || null;
      if (venueData.image_url !== undefined) updatePayload.image_url = venueData.image_url || null;
      if (venueData.gallery_images !== undefined) updatePayload.gallery_images = venueData.gallery_images;
      if (venueData.price_range !== undefined) updatePayload.price_range = venueData.price_range || null;

      const { error } = await supabase.from('venues').update(updatePayload).eq('id', venueId);
      if (error) {
        console.error('Supabase update venue error:', error);
        throw new Error(error.message);
      }
    }

    setVenues(prev => {
      const updated = prev.map(v => (v.id === venueId ? { ...v, ...venueData } : v));
      savePublicAppState('rallymax_venues', updated);
      return updated;
    });
  };

  const deleteVenue = async (venueId: string) => {
    if (supabase) {
      const { error } = await supabase.from('venues').delete().eq('id', venueId);
      if (error) {
        console.error('Supabase delete venue error:', error);
        throw new Error(error.message);
      }
    }

    setVenues(prev => {
      const filtered = prev.filter(v => v.id !== venueId);
      savePublicAppState('rallymax_venues', filtered);
      return filtered;
    });
  };

  const updateUserRole = async (userId: string, newRole: 'PLAYER' | 'HOST' | 'ADMIN', isVerifiedHost?: boolean) => {
    const verified = isVerifiedHost !== undefined ? isVerifiedHost : (newRole === 'HOST' || newRole === 'ADMIN');

    setAllUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            role: newRole,
            is_verified_host: verified,
          };
        }
        return u;
      });
      savePublicAppState('rallymax_users', updated);
      return updated;
    });

    setCurrentUser(current => {
      if (current && current.id === userId) {
        const updatedUser: Profile = {
          ...current,
          role: newRole,
          is_verified_host: verified,
        };
        savePublicAppState('rallymax_current_user', updatedUser);
        setActiveRole(newRole === 'ADMIN' ? 'admin' : (newRole === 'HOST' ? 'host' : 'player'));
        return updatedUser;
      }
      return current;
    });

    if (supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole, is_verified_host: verified, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) console.warn('Supabase update user role warning:', error.message);
      } catch (err) {
        console.warn('Supabase update user role error:', err);
      }
    }
  };

  const deleteUser = async (userId: string) => {
    // 1. Remove from allUsers in memory and in localStorage
    setAllUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      savePublicAppState('rallymax_users', updated);
      return updated;
    });

    // 2. If deleting the currentUser, log them out
    if (currentUser?.id === userId) {
      logout();
    }

    // 3. Delete from Supabase profiles table
    if (supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (err) {
        console.warn('Supabase delete profile error:', err);
      }
    }
  };

  const purgeMockUsers = () => {
    setAllUsers(prev => {
      const cleaned = prev.filter(u => !isMockEmail(u.email) && !isMockId(u.id));
      savePublicAppState('rallymax_users', cleaned);
      return cleaned;
    });
  };

  const refreshProfiles = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data && data.length > 0 && !error) {
        const validProfiles = data
          .filter((p: any) => !isMockEmail(p.email) && !isMockId(p.id))
          .map((p: any) => {
            const roleFromDb: 'PLAYER' | 'HOST' | 'ADMIN' =
              (p.role === 'ADMIN' || p.role === 'HOST' || p.role === 'PLAYER')
                ? p.role
                : 'PLAYER';
            return {
              id: p.id,
              email: p.email || '',
              full_name: p.full_name || p.email?.split('@')[0] || 'Vận động viên',
              avatar_url: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              phone_number: p.phone_number || '',
              gender: p.gender || 'OTHER',
              role: roleFromDb,
              is_verified_host: p.is_verified_host ?? (roleFromDb === 'HOST' || roleFromDb === 'ADMIN'),
              skill_level: p.skill_level || 'BEGINNER',
              dominant_hand: p.dominant_hand || 'RIGHT',
              play_style: p.play_style || 'ALL_ROUND',
              district_code: p.district_code || 'HN_BD',
              reliability_score: p.reliability_score ?? 100,
              total_matches_played: p.total_matches_played ?? 0,
              total_no_shows: p.total_no_shows ?? 0,
              created_at: p.created_at || new Date().toISOString(),
            };
          });
        setAllUsers(validProfiles);
        savePublicAppState('rallymax_users', validProfiles);

        setCurrentUser(current => {
          if (!current) return null;
          const freshData = data.find((p: any) => p.id === current.id || p.email?.toLowerCase() === current.email?.toLowerCase());
          if (freshData) {
            const roleFromDb: 'PLAYER' | 'HOST' | 'ADMIN' =
              (freshData.role === 'ADMIN' || freshData.role === 'HOST' || freshData.role === 'PLAYER')
                ? freshData.role
                : 'PLAYER';
            const updated: Profile = {
              ...current,
              role: roleFromDb,
              is_verified_host: freshData.is_verified_host ?? (roleFromDb === 'HOST' || roleFromDb === 'ADMIN'),
              full_name: freshData.full_name || current.full_name,
            };
            savePublicAppState('rallymax_current_user', updated);
            setActiveRole(roleFromDb === 'ADMIN' ? 'admin' : (roleFromDb === 'HOST' ? 'host' : 'player'));
            return updated;
          }
          return current;
        });
      }
    } catch (err) {
      console.warn('refreshProfiles error:', err);
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...profileData, updated_at: new Date().toISOString() };
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
  };

  const addReview = async (reviewData: Partial<Review>) => {
    if (!currentUser) return;
    const newReview: Review = {
      id: 'rev-' + generateUuid(),
      event_id: reviewData.event_id || '',
      reviewer_id: currentUser.id,
      reviewee_id: reviewData.reviewee_id || '',
      review_type: reviewData.review_type || 'PLAYER_TO_HOST',
      rating: reviewData.rating || 5,
      skill_accuracy_rating: reviewData.skill_accuracy_rating,
      punctuality_rating: reviewData.punctuality_rating,
      comment: reviewData.comment,
      is_no_show: reviewData.is_no_show || false,
      created_at: new Date().toISOString(),
      reviewer: currentUser,
    };
    setReviews(prev => [newReview, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isLoggedIn: Boolean(currentUser),
        isAdmin,
        activeRole,
        setActiveRole,
        login,
        logout,
        signInWithGoogle,
        signInWithFacebook,
        loginByEmail,
        createCustomUser,
        switchUser,
        allUsers,
        events,
        venues,
        reviews,
        notifications,
        createEvent,
        updateEvent,
        cancelEvent,
        deleteEvent,
        registerForEvent,
        cancelRegistration,
        updateRegistrationStatus,
        checkInPlayer,
        markPaymentStatus,
        createVenue,
        updateVenue,
        deleteVenue,
        updateUserRole,
        deleteUser,
        purgeMockUsers,
        refreshProfiles,
        refreshVenues,
        updateProfile,
        addReview,
        markNotificationRead,
        isRealSupabase: isSupabaseConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
