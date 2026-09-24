import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthSession, Customer, Runner, UserRole, CustomerCreate, RunnerCreate } from '../api/types';
import { STORAGE_KEYS } from '../constants/config';
import { createCustomer, getCustomers, getCustomer } from '../api/customers';
import { createRunner, getRunners, getRunner } from '../api/runners';

interface AuthContextType {
  user: AuthSession | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, role: UserRole, password?: string) => Promise<AuthSession>;
  signupCustomerAccount: (data: CustomerCreate) => Promise<AuthSession>;
  signupRunnerAccount: (data: RunnerCreate) => Promise<AuthSession>;
  switchRole: (newRole: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  login: async () => { throw new Error('AuthContext not initialized'); },
  signupCustomerAccount: async () => { throw new Error('AuthContext not initialized'); },
  signupRunnerAccount: async () => { throw new Error('AuthContext not initialized'); },
  switchRole: async () => {},
  refreshProfile: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from SecureStore on app startup
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedSession = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION_USER);
        const savedRole = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);

        if (savedSession) {
          const parsedSession: AuthSession = JSON.parse(savedSession);
          setUser(parsedSession);
          setRole((savedRole as UserRole) || parsedSession.role || 'customer');
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to restore session from SecureStore:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Save session helper
  async function persistSession(session: AuthSession) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.SESSION_USER, JSON.stringify(session));
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, session.role);
    } catch (err) {
      console.warn('[AuthContext] Failed to persist session:', err);
    }
    setUser(session);
    setRole(session.role);
  }

  /**
   * Login method
   * Since the backend has no dedicated /auth/login endpoint, we search the customer/runner list
   * by email and match.
   */
  async function login(email: string, selectedRole: UserRole): Promise<AuthSession> {
    const trimmedEmail = email.trim().toLowerCase();

    if (selectedRole === 'customer') {
      const customers = await getCustomers(0, 100);
      const match = customers.find((c) => c.email.toLowerCase() === trimmedEmail);

      if (!match) {
        throw new Error(`No customer account found with email: ${trimmedEmail}. Please check spelling or create an account.`);
      }

      const session: AuthSession = {
        id: match.id,
        full_name: match.full_name,
        email: match.email,
        phone: match.phone,
        role: 'customer',
      };

      await persistSession(session);
      return session;
    } else {
      const runners = await getRunners(0, 100);
      const match = runners.find((r) => r.email.toLowerCase() === trimmedEmail);

      if (!match) {
        throw new Error(`No runner account found with email: ${trimmedEmail}. Please check spelling or create an account.`);
      }

      const session: AuthSession = {
        id: match.id,
        full_name: match.full_name,
        email: match.email,
        phone: match.phone,
        role: 'runner',
        bike_plate_number: match.bike_plate_number,
        trust_tier: match.trust_tier,
        trust_score: match.trust_score,
        completed_tasks_count: match.completed_tasks_count,
      };

      await persistSession(session);
      return session;
    }
  }

  /**
   * Sign up customer account
   */
  async function signupCustomerAccount(data: CustomerCreate): Promise<AuthSession> {
    const newCustomer = await createCustomer(data);
    const session: AuthSession = {
      id: newCustomer.id,
      full_name: newCustomer.full_name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      role: 'customer',
    };
    await persistSession(session);
    return session;
  }

  /**
   * Sign up runner account
   */
  async function signupRunnerAccount(data: RunnerCreate): Promise<AuthSession> {
    const newRunner = await createRunner(data);
    const session: AuthSession = {
      id: newRunner.id,
      full_name: newRunner.full_name,
      email: newRunner.email,
      phone: newRunner.phone,
      role: 'runner',
      bike_plate_number: newRunner.bike_plate_number,
      trust_tier: newRunner.trust_tier,
      trust_score: newRunner.trust_score,
      completed_tasks_count: newRunner.completed_tasks_count,
    };
    await persistSession(session);
    return session;
  }

  /**
   * Switch active role
   */
  async function switchRole(newRole: UserRole) {
    if (!user) return;
    const updated = { ...user, role: newRole };
    await persistSession(updated);
  }

  /**
   * Refresh profile data from backend
   */
  async function refreshProfile() {
    if (!user) return;
    try {
      if (user.role === 'customer') {
        const profile = await getCustomer(user.id);
        const updated: AuthSession = {
          ...user,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
        };
        await persistSession(updated);
      } else {
        const profile = await getRunner(user.id);
        const updated: AuthSession = {
          ...user,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          bike_plate_number: profile.bike_plate_number,
          trust_tier: profile.trust_tier,
          trust_score: profile.trust_score,
          completed_tasks_count: profile.completed_tasks_count,
        };
        await persistSession(updated);
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh profile:', err);
    }
  }

  /**
   * Logout and clear storage
   */
  async function logout() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION_USER);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (err) {
      console.warn('[AuthContext] Error during logout storage cleanup:', err);
    }
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        signupCustomerAccount,
        signupRunnerAccount,
        switchRole,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
