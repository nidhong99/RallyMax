import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Event, Venue, EventRegistration, RegistrationStatus, Review, Notification } from '../types/database';
import { MOCK_PROFILES, MOCK_EVENTS, MOCK_VENUES, MOCK_REVIEWS } from '../data/mockData';
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
  resetUserReliability: (userId: string) => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  addReview: (reviewData: Partial<Review>) => Promise<void>;
  markNotificationRead: (id: string) => void;
  isRealSupabase: boolean;
}

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('rallymax_users');
    return saved ? JSON.parse(saved) : MOCK_PROFILES;
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
      const usersList: Profile[] = savedUsersStr ? JSON.parse(savedUsersStr) : MOCK_PROFILES;
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
        if (u && (u.role === 'ADMIN' || (u.email || '').toLowerCase() === 'nidhong99@gmail.com')) {
          return 'admin';
        }
        if (u && u.role === 'HOST') {
          return 'host';
        }
      } catch (e) {}
    }
    return 'player';
  });

  const isAdmin = currentUser?.role === 'ADMIN' || (currentUser?.email || '').toLowerCase() === 'nidhong99@gmail.com';

  const [venues, setVenues] = useState<Venue[]>(() => {
    const saved = localStorage.getItem('rallymax_venues');
    return saved ? JSON.parse(saved) : MOCK_VENUES;
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
    return saved ? JSON.parse(saved) : MOCK_REVIEWS;
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

            const isHostEmail = userEmail === 'nidhong99@gmail.com';
            const userFromHash: Profile = {
              id: payload.sub || 'user-' + Date.now(),
              email: userEmail,
              full_name: fullName,
              avatar_url: avatarUrl,
              phone_number: userMeta.phone || '',
              gender: 'OTHER',
              role: isHostEmail ? 'HOST' : (userMeta.role || 'PLAYER'),
              is_verified_host: isHostEmail,
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
        setAllUsers(prev => {
          const map = new Map<string, Profile>();
          prev.forEach(u => map.set(u.id, u));
          data.forEach((p: any) => {
            const isHost = p.role === 'HOST' || (p.email || '').toLowerCase() === 'nidhong99@gmail.com';
            map.set(p.id, {
              id: p.id,
              email: p.email || '',
              full_name: p.full_name || p.email?.split('@')[0] || 'Vận động viên',
              avatar_url: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              phone_number: p.phone_number || '',
              gender: p.gender || 'OTHER',
              role: isHost ? 'HOST' : (p.role || 'PLAYER'),
              is_verified_host: p.is_verified_host ?? isHost,
              skill_level: p.skill_level || 'BEGINNER',
              dominant_hand: p.dominant_hand || 'RIGHT',
              play_style: p.play_style || 'ALL_ROUND',
              district_code: p.district_code || 'HN_BD',
              reliability_score: p.reliability_score ?? 100,
              total_matches_played: p.total_matches_played ?? 0,
              total_no_shows: p.total_no_shows ?? 0,
              created_at: p.created_at || new Date().toISOString(),
            });
          });
          const merged = Array.from(map.values());
          localStorage.setItem('rallymax_users', JSON.stringify(merged));
          return merged;
        });

        // Sync currentUser if updated in Supabase
        setCurrentUser(current => {
          if (!current) return null;
          const freshData = data.find((p: any) => p.id === current.id || p.email?.toLowerCase() === current.email?.toLowerCase());
          if (freshData) {
            const isHost = freshData.role === 'HOST' || (freshData.email || '').toLowerCase() === 'nidhong99@gmail.com';
            const updated: Profile = {
              ...current,
              role: isHost ? 'HOST' : (freshData.role || 'PLAYER'),
              is_verified_host: freshData.is_verified_host ?? isHost,
              full_name: freshData.full_name || current.full_name,
            };
            localStorage.setItem('rallymax_current_user', JSON.stringify(updated));
            setActiveRole(isHost ? 'host' : 'player');
            return updated;
          }
          return current;
        });
      }
    }, err => {
      console.warn('Supabase profiles query error:', err);
    });

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
                map.set(ev.id, {
                  ...ev,
                  venue: ev.venue || {
                    id: ev.venue_id || 'v-default',
                    name: ev.venue_name || 'Sân cầu lông',
                    address: ev.location_url || 'Đang cập nhật địa chỉ',
                    district_code: 'HN_BD',
                    total_courts: 4,
                  },
                  host: ev.host,
                  registrations: ev.registrations || [],
                });
              });

              const merged = Array.from(map.values());
              localStorage.setItem('rallymax_events', JSON.stringify(merged));
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
              localStorage.setItem('rallymax_events', JSON.stringify(filtered));
              return filtered;
            });
          }
          // Fetch updated list from cloud
          fetchCloudEvents();
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const syncSupabaseProfile = (user: any) => {
    const existing = allUsers.find(u => u.id === user.id || u.email.toLowerCase() === (user.email || '').toLowerCase());
    if (existing) {
      login(existing);
    } else {
      const isHostEmail = (user.email || '').toLowerCase() === 'nidhong99@gmail.com';
      const newProfile: Profile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Vận động viên mới',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone_number: user.user_metadata?.phone || '',
        gender: 'OTHER',
        role: isHostEmail ? 'HOST' : (user.user_metadata?.role || 'PLAYER'),
        is_verified_host: isHostEmail,
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
        localStorage.setItem('rallymax_users', JSON.stringify(next));
        return next;
      });
      login(newProfile);
    }
  };

  const login = (user: Profile) => {
    const email = (user.email || '').toLowerCase();
    const isOwner = email === 'nidhong99@gmail.com';
    const isDbAdmin = user.role === 'ADMIN';
    const isAdminUser = isOwner || isDbAdmin;
    const isHost = isAdminUser || (user.role === 'HOST' && email !== '75dangtheanh@gmail.com') || user.id === 'user-host-1';
    const finalRole: 'ADMIN' | 'HOST' | 'PLAYER' = isAdminUser ? 'ADMIN' : (isHost ? 'HOST' : 'PLAYER');
    const profileToStore: Profile = {
      ...user,
      role: finalRole,
      is_verified_host: isHost,
    };

    setCurrentUser(profileToStore);
    setActiveRole(isAdminUser ? 'admin' : (isHost ? 'host' : 'player'));
    localStorage.setItem('rallymax_current_user_id', profileToStore.id);
    localStorage.setItem('rallymax_current_user', JSON.stringify(profileToStore));

    setAllUsers(prev => {
      const exists = prev.some(u => u.id === profileToStore.id || u.email.toLowerCase() === profileToStore.email.toLowerCase());
      const next = exists
        ? prev.map(u => (u.id === profileToStore.id || u.email.toLowerCase() === profileToStore.email.toLowerCase()) ? { ...u, ...profileToStore } : u)
        : [profileToStore, ...prev];
      localStorage.setItem('rallymax_users', JSON.stringify(next));
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
        localStorage.setItem('rallymax_events', JSON.stringify(updated));
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
    localStorage.removeItem('rallymax_current_user');
    localStorage.setItem('rallymax_current_user_id', 'guest');
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
          const isHost = data.role === 'HOST' || cleanEmail === 'nidhong99@gmail.com';
          const profile: Profile = {
            id: data.id,
            email: data.email,
            full_name: data.full_name || cleanEmail.split('@')[0],
            avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            phone_number: data.phone_number || '',
            gender: data.gender || 'OTHER',
            role: isHost ? 'HOST' : (data.role || 'PLAYER'),
            is_verified_host: data.is_verified_host ?? isHost,
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
    const isHost = cleanEmail === 'nidhong99@gmail.com';
    const newProfile: Profile = {
      id: generateUuid(),
      email: cleanEmail,
      full_name: finalName,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone_number: '',
      gender: 'OTHER',
      role: isHost ? 'HOST' : 'PLAYER',
      is_verified_host: isHost,
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
      id: 'google-user-' + Date.now(),
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
      id: 'fb-user-' + Date.now(),
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
    localStorage.setItem('rallymax_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('rallymax_venues', JSON.stringify(venues));
  }, [venues]);

  useEffect(() => {
    localStorage.setItem('rallymax_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('rallymax_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const switchUser = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      login(found);
    }
  };

  const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập để tạo sự kiện');
    const isHost = currentUser.role === 'HOST' || (currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com';
    if (!isHost) throw new Error('Chỉ tài khoản có vai trò Host mới được phép tạo kèo giao lưu');

    const validHostId =
      currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)
        ? currentUser.id
        : ((currentUser.email || '').toLowerCase() === 'nidhong99@gmail.com' ? 'f4e7c76e-217a-46ed-8de8-daf349bbb020' : generateUuid());

    const eventId = generateUuid();
    const venueName = eventData.venue_name || (eventData.venue_id ? venues.find(v => v.id === eventData.venue_id)?.name : 'Sân Cầu Lông');
    const fallbackVenue: Venue = {
      id: eventData.venue_id || 'custom-venue-' + Date.now(),
      name: venueName,
      address: eventData.location_url || 'Đang cập nhật địa chỉ',
      district_code: 'HN_BD',
      total_courts: 4,
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
      cover_image_url:
        eventData.cover_image_url ||
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      cover_image_position: eventData.cover_image_position || '50% 50%',
      venue: fallbackVenue,
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
        supabase
          .from('events')
          .insert([payload])
          .select('*, host:profiles(*), venue:venues(*)')
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              setEvents(prev =>
                prev.map(e => (e.id === newEvent.id ? { ...e, id: data.id, ...data, host: currentUser, venue: fallbackVenue } : e))
              );
            } else if (error) {
              console.warn('Supabase insert event warning:', error.message);
            }
          });
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
      localStorage.setItem('rallymax_events', JSON.stringify(next));
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
          id: 'notif-' + Date.now(),
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
                      const score = Math.max(0, Math.round(((newTotal - newNoShows) / newTotal) * 100));
                      return { ...u, total_no_shows: newNoShows, total_matches_played: newTotal, reliability_score: score };
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

  const createVenue = async (venueData: Partial<Venue>): Promise<Venue> => {
    const venueId = generateUuid();
    const newVenue: Venue = {
      id: venueId,
      name: venueData.name || 'Sân Cầu Lông Mới',
      address: venueData.address || '',
      district_code: venueData.district_code || 'HN_BD',
      total_courts: venueData.total_courts || 4,
      contact_phone: venueData.contact_phone,
      maps_url: venueData.maps_url,
      price_range: venueData.price_range,
      created_by: currentUser?.id,
      created_at: new Date().toISOString(),
    };
    setVenues(prev => {
      const updated = [newVenue, ...prev];
      localStorage.setItem('rallymax_venues', JSON.stringify(updated));
      return updated;
    });

    if (supabase) {
      try {
        const { error } = await supabase.from('venues').insert([newVenue]);
        if (error) console.warn('Supabase venue insert warning:', error.message);
      } catch (err) {
        console.warn('Supabase venue insert error:', err);
      }
    }

    return newVenue;
  };

  const updateVenue = async (venueId: string, venueData: Partial<Venue>) => {
    setVenues(prev => {
      const updated = prev.map(v => (v.id === venueId ? { ...v, ...venueData } : v));
      localStorage.setItem('rallymax_venues', JSON.stringify(updated));
      return updated;
    });

    if (supabase) {
      try {
        const { error } = await supabase.from('venues').update(venueData).eq('id', venueId);
        if (error) console.warn('Supabase update venue warning:', error.message);
      } catch (err) {
        console.warn('Supabase update venue error:', err);
      }
    }
  };

  const deleteVenue = async (venueId: string) => {
    setVenues(prev => {
      const filtered = prev.filter(v => v.id !== venueId);
      localStorage.setItem('rallymax_venues', JSON.stringify(filtered));
      return filtered;
    });

    if (supabase) {
      try {
        const { error } = await supabase.from('venues').delete().eq('id', venueId);
        if (error) console.warn('Supabase delete venue warning:', error.message);
      } catch (err) {
        console.warn('Supabase delete venue error:', err);
      }
    }
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
      localStorage.setItem('rallymax_users', JSON.stringify(updated));
      return updated;
    });

    setCurrentUser(current => {
      if (current && current.id === userId) {
        const updatedUser: Profile = {
          ...current,
          role: newRole,
          is_verified_host: verified,
        };
        localStorage.setItem('rallymax_current_user', JSON.stringify(updatedUser));
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

  const resetUserReliability = async (userId: string) => {
    setAllUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            reliability_score: 100,
            total_no_shows: 0,
          };
        }
        return u;
      });
      localStorage.setItem('rallymax_users', JSON.stringify(updated));
      return updated;
    });

    setCurrentUser(current => {
      if (current && current.id === userId) {
        const updated = { ...current, reliability_score: 100, total_no_shows: 0 };
        localStorage.setItem('rallymax_current_user', JSON.stringify(updated));
        return updated;
      }
      return current;
    });

    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({ reliability_score: 100, total_no_shows: 0, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (e) {}
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
      id: 'rev-' + Date.now(),
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
        resetUserReliability,
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
