import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { checkAndMigrateData } from '@/lib/migration-helper';
import { storageCache } from '@/lib/storage-cache';
import { executeWithPool } from '@/lib/services/request-pool-service';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  trialStatus?: string;
  trialEnd?: string;
  trialAIUsage?: number;
}

type UserRole = 'admin' | 'free' | 'pro' | 'max' | 'starter' | 'business' | 'enterprise' | 'max_ai';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionData | null;
  userRole: UserRole | null;
  subscriptionTier: UserRole | null; // Alias for userRole for backward compatibility
  organizationId: string | null;
  isAdmin: boolean;
  isProTier: boolean;
  isBusinessTier: boolean;
  isEnterpriseTier: boolean;
  isMaxAITier: boolean;
  isDevAccount: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkUserRole: (sessionToUse?: Session | null) => Promise<void>;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();

  const isInitializing = useRef(false);
  const roleCheckInProgress = useRef(false);

  const isAdmin = userRole === 'admin';
  const isDevAccount = user?.email === 'hello@sellegance.com' || isAdmin;
  const isProTier = userRole === 'pro' || userRole === 'business' || userRole === 'enterprise' || userRole === 'max_ai' || userRole === 'max' || userRole === 'admin' || subscription?.subscribed === true || isDevAccount;
  const isBusinessTier = userRole === 'business' || userRole === 'enterprise' || userRole === 'max_ai' || userRole === 'max' || userRole === 'admin' || (subscription?.subscribed === true && subscription?.product_id?.includes('business')) || isDevAccount;
  const isEnterpriseTier = userRole === 'enterprise' || userRole === 'max_ai' || userRole === 'max' || userRole === 'admin' || (subscription?.subscribed === true && subscription?.product_id?.includes('enterprise')) || isDevAccount;
  const isMaxAITier = userRole === 'max_ai' || userRole === 'max' || userRole === 'admin' || (subscription?.subscribed === true && (subscription?.product_id?.includes('max') || subscription?.product_id?.includes('ai'))) || isDevAccount;

  const checkUserRole = async (sessionToUse?: Session | null) => {
    if (roleCheckInProgress.current) {
      console.log('[AuthContext] Role check already in progress, skipping');
      return;
    }

    const activeSession = sessionToUse ?? session;

    if (!activeSession) {
      console.log('[AuthContext] No session, setting role to null');
      setUserRole(null);
      return;
    }

    console.log('[AuthContext] Checking role for user:', activeSession.user.id);
    roleCheckInProgress.current = true;

    try {
      // 1. Fetch user role and organization from the profiles table
      const { data: profile, error: profileError } = await executeWithPool(
        (signal) => (supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', activeSession.user.id)
          .maybeSingle() as any).abortSignal(signal),
        10000,
        'check-user-role'
      ) as any;

      if (profileError) {
        // 🚀 HARDENING: If we fail to fetch profile (e.g. connection drop), don't immediately revert to 'free'
        // if we already had a role or if we have a valid Stripe subscription.
        console.error('[AuthContext] Error fetching profile:', profileError);
        if (!userRole && !subscription?.subscribed) {
          setUserRole('free');
        }
        return;
      }

      if (profile) {
        console.log('[AuthContext] Profile fetched:', profile);
        setUserRole(profile.role as UserRole);
        setOrganizationId(profile.organization_id);
      } else {
        // Fallback for new users without profiles yet (trigger should create it, but just in case)
        console.log('[AuthContext] No profile found, using legacy role check or default');
        const { data: legacyRole } = await executeWithPool(
          (signal) => (supabase.rpc('get_user_role', {
            _user_id: activeSession.user.id,
          }) as any).abortSignal(signal),
          5000,
          'get-legacy-role'
        ) as any;
        setUserRole((legacyRole as UserRole) || 'free');
      }
    } catch (error) {
      console.error('[AuthContext] Error checking user role:', error);
      // 🚀 HARDENING: If we have a timeout or network error, don't revert to 'free' if we already have a role.
      // This prevents "locking out" users from Pro features during transient issues.
      if (!userRole && !subscription?.subscribed) {
        setUserRole('free');
      }
    } finally {
      roleCheckInProgress.current = false;
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log('[AuthContext] Updating user role via direct database access...');

      // Use direct database update instead of Edge Function
      const { error: dbError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (dbError) {
        console.error('[AuthContext] Direct database update failed:', dbError);
        throw new Error('Failed to update user role');
      }

      console.log('[AuthContext] ✓ Role updated via direct database access');
      await checkUserRole();
    } catch (error) {
      console.error('[AuthContext] Error updating user role:', error);
      throw error;
    }
  };

  const loadSubscription = async (userId: string) => {
    // Subscription checking is optional - don't fail auth if it doesn't work
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('[AuthContext] No valid session for subscription check');
        setSubscription(null);
        return;
      }

      const expiresAt = sessionData.session.expires_at;
      if (expiresAt && (expiresAt * 1000 - Date.now()) < 300000) {
        console.log('[AuthContext] Session expiring soon, refreshing...');
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          console.error('[AuthContext] Session refresh failed');
          setSubscription(null);
          return;
        }
      }

      // 🚀 CROSS-TAB CACHE: Check if another tab recently verified subscription
      const cacheKey = `sb_subscription_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Cache valid for 5 minutes
          if (Date.now() - timestamp < 300000) {
            console.log('[AuthContext] ♻️ Using cross-tab subscription cache');
            setSubscription(data);
            return;
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      try {
        const { data, error } = await executeWithPool(
          (signal) => supabase.functions.invoke('check-subscription', { signal }),
          15000,
          'check-subscription'
        ) as any;

        if (error) {
          // Log as warning only - this is non-critical for core app function
          console.warn('[AuthContext] Subscription check unavailable (Edge Function error):', error);
          if (error.context) {
            try {
              // Try to get response body if available
              const body = await error.context.text();
              try {
                const parsedBody = JSON.parse(body);
                console.warn('[AuthContext] Function error details:', parsedBody);
              } catch {
                console.warn('[AuthContext] Function error response body:', body);
              }
            } catch (e) {
              console.warn('[AuthContext] Could not read error response body');
            }
          }
        } else {
          setSubscription(data);
          // Update cross-tab cache
          localStorage.setItem(`sb_subscription_${userId}`, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }
      } catch (invokeError) {
        console.warn('[AuthContext] Exception calling check-subscription:', invokeError);
        // Retain previous state if it was "pro" to avoid UI jitter
        if (subscription?.subscribed) {
          console.log('[AuthContext] Retaining previous subscription state after exception');
        }
      }

      // Also fetch trial metadata directly from organizations table
      const { data: orgData } = await executeWithPool(
        (signal) => (supabase
          .from('organizations' as any)
          .select('subscription_status, trial_end_date, trial_ai_usage')
          .eq('owner_id', userId)
          .maybeSingle() as any as Promise<any>),
        5000,
        'fetch-org-metadata'
      ) as any;

      if (orgData) {
        setSubscription(prev => ({
          ...(prev || { subscribed: false, product_id: null, subscription_end: null }),
          trialStatus: (orgData as any).subscription_status,
          trialEnd: (orgData as any).trial_end_date,
          trialAIUsage: (orgData as any).trial_ai_usage
        }));
      }
    } catch (error) {
      console.warn('[AuthContext] Subscription check error (non-critical):', error);
      // HARDENING: Do NOT clear existing subscription on transient errors
      // Only clear if we really have no data yet
      setSubscription(prev => prev ? prev : null);
    }
  };

  useEffect(() => {
    if (isInitializing.current) {
      console.log('[AUTH DEBUG] Auth already initializing, skipping');
      return;
    }

    isInitializing.current = true;

    const initializeAuth = async (signal: AbortSignal) => {
      try {
        // 🚀 HARDENING: Wrap getSession in a short timeout race.
        // If the library is deadlocked, we don't want to block the entire app initialization forever.
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3000)
        );

        const { data: { session: existingSession } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (signal.aborted) return;

        const timeoutDuration = existingSession ? 300 : 800;

        const maxLoadingTimeout: NodeJS.Timeout = setTimeout(() => {
          if (!signal.aborted) {
            console.warn('[AUTH DEBUG] Auth timeout reached - forcing loading to false');
            setLoading(false);
            isInitializing.current = false;
          }
        }, timeoutDuration);

        return maxLoadingTimeout;
      } catch (error) {
        console.error('[AUTH DEBUG] Auth initializing error:', error);
        if (!signal.aborted) {
          setLoading(false);
          isInitializing.current = false;
        }
      }
    };

    const abortController = new AbortController();
    let maxLoadingTimeout: NodeJS.Timeout | undefined;

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (maxLoadingTimeout) clearTimeout(maxLoadingTimeout);
        console.log('[AUTH DEBUG] Auth state change:', event, 'Session:', !!currentSession);

        if (event === 'INITIAL_SESSION') {
          isInitializing.current = false;
        }

        if (currentSession?.refresh_token) {
          try {
            if (currentSession.refresh_token.length < 10) {
              console.error('[AUTH DEBUG] Invalid refresh token detected');
              throw new Error('Invalid refresh token');
            }
          } catch (validationError) {
            console.error('[AUTH DEBUG] Session validation failed:', validationError);
            storageCache.clear();
            toast.error('Your session expired. Please sign in again.');
            setSession(null);
            setUser(null);
            setSubscription(null);
            setUserRole(null);
            setLoading(false);
            isInitializing.current = false;
            return;
          }
        }

        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          console.error('[AUTH DEBUG] Token refresh failed - clearing corrupted data');
          storageCache.clear();
          toast.error('Your session expired. Please sign in again.');
          setSession(null);
          setUser(null);
          setSubscription(null);
          setUserRole(null);
          setLoading(false);
          isInitializing.current = false;
          return;
        }

        if (event === 'SIGNED_OUT') {
          console.log('[AUTH DEBUG] Signed out event');
          storageCache.clear();
          setSession(null);
          setUser(null);
          setSubscription(null);
          setUserRole(null);
          setLoading(false);
          isInitializing.current = false;
          return;
        }

        if (!currentSession) {
          console.log('[AUTH DEBUG] No session');
          setSession(null);
          setUser(null);
          setSubscription(null);
          setUserRole(null);
          setLoading(false);
          isInitializing.current = false;
          return;
        }

        setSession(currentSession);
        setUser(currentSession.user);

        // 🚀 INSTANT HYDRATION: Restore subscription from cache IMMEDIATELY
        // This prevents "Upgrade to Pro" flash while waiting for network calls
        if (currentSession.user?.id) {
          const cacheKey = `sb_subscription_${currentSession.user.id}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const { data, timestamp } = JSON.parse(cached);
              // Cache valid for 30 minutes (extended for stability)
              if (Date.now() - timestamp < 30 * 60 * 1000) {
                console.log('[AuthContext] ⚡ Instant subscription hydration from cache');
                setSubscription(data);
              }
            } catch (e) { console.warn('Cache parse error', e); }
          }
        }

        // Run role check and subscription load in parallel
        // This ensures both are ready before we lower the loading flag
        try {
          const promises: Promise<any>[] = [checkUserRole(currentSession)];

          if (currentSession.user?.id) {
            promises.push(loadSubscription(currentSession.user.id));
            // Run migration in background (don't await)
            checkAndMigrateData(currentSession.user.id).catch(console.error);
          }

          await Promise.allSettled(promises);
        } catch (error) {
          console.error('[AUTH DEBUG] Auth initialization failed:', error);
        } finally {
          console.log('[AUTH DEBUG] Setting loading to false after parallel init');
          setLoading(false);
          isInitializing.current = false;
        }
      }
    );

    // Safety timeout to prevent permanent hang during initialization
    const initSafetyTimeout = setTimeout(() => {
      if (isInitializing.current) {
        console.warn('[AUTH DEBUG] Hub initialization timed out - clearing isInitializing');
        isInitializing.current = false;
        setLoading(false);
      }
    }, 10000);

    initializeAuth(abortController.signal).then(timeout => {
      maxLoadingTimeout = timeout;
    });

    return () => {
      console.log('[AuthContext] Effect cleanup - cleaning up listeners');
      abortController.abort();
      if (maxLoadingTimeout) clearTimeout(maxLoadingTimeout);
      clearTimeout(initSafetyTimeout);
      authSubscription.unsubscribe();
      isInitializing.current = false;
    };
  }, []);

  const refreshSubscription = async () => {
    if (!session) return;
    await loadSubscription(session.user.id);
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('[AuthContext] Sign up error:', error);
        return { error };
      }

      if (!data.user) {
        return { error: new Error('No user returned from sign up') as AuthError };
      }

      toast.success('Account created! You can now sign in.');

      /* 
      // DISABLED AUTO-SEEDING to prevent ghost data issues
      // Generate sample data in background (non-blocking)
      setTimeout(async () => {
        try {
          const { generateSampleData } = await import('@/lib/sample-data');
          await generateSampleData(data.user!.id, true);
          console.log('[AuthContext] Sample data generated for new user');
          toast.success('Sample data has been added to help you get started!');
        } catch (sampleError) {
          console.error('[AuthContext] Failed to generate sample data:', sampleError);
        }
      }, 2000);
      */

      return { error: null };
    } catch (err) {
      console.error('[AuthContext] Sign up exception:', err);
      return { error: err as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    setSigningIn(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setSigningIn(false);
        return { error };
      }

      if (!data.session) {
        setSigningIn(false);
        return { error: new Error('No session returned') as AuthError };
      }

      // Use flushSync to ensure state updates are applied immediately
      const { flushSync } = await import('react-dom');

      // Set session and user synchronously
      flushSync(() => {
        setSession(data.session);
        setUser(data.session.user);
      });

      // Wait for role check to complete
      await checkUserRole(data.session);

      // Set loading states to false
      flushSync(() => {
        setLoading(false);
        setSigningIn(false);
      });

      // Load subscription in background
      loadSubscription(data.session.user.id).catch(console.error);

      // toast.success('Signed in successfully!'); // Removed to prevent duplicate with Auth.tsx

      // Navigate to dashboard immediately - React will handle the rest
      navigate('/dashboard');

      return { error: null };
    } catch (err) {
      setSigningIn(false);
      console.error('[AuthContext] Sign in error:', err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    try {
      // Add a timeout to sign out to ensure we clear local state even if the network is flaky
      const signOutPromise = supabase.auth.signOut();
      await Promise.race([
        signOutPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSession(null);
      setUser(null);
      setSubscription(null);
      toast.success('Signed out successfully');
      navigate('/auth', { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        subscription,
        userRole,
        subscriptionTier: userRole,
        organizationId,
        isAdmin,
        isProTier,
        isBusinessTier,
        isEnterpriseTier,
        isMaxAITier,
        isDevAccount,
        loading,
        signUp,
        signIn,
        signOut,
        refreshSubscription,
        checkUserRole,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}