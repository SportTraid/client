"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { UserInfo } from "@/lib/api";
import {
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  login as apiLogin,
  signup as apiSignup,
} from "@/lib/api";

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (body: {
    email: string;
    password: string;
    username: string;
    first_name: string;
    last_name: string;
    gender?: string;
    age?: number;
    role?: string;
    organization?: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  const loadStored = useCallback(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token) {
      setStoredUser(null);
      setState({ user: null, token: null, isLoading: false });
      return;
    }
    setState({ user: user ?? null, token, isLoading: false });
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin({ email, password });
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      setState({ user: res.user, token: res.access_token, isLoading: false });
    },
    []
  );

  const signup = useCallback(
    async (body: {
      email: string;
      password: string;
      username: string;
      first_name: string;
      last_name: string;
      gender?: string;
      age?: number;
      role?: string;
      organization?: string;
    }) => {
      const res = await apiSignup(body);
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      setState({ user: res.user, token: res.access_token, isLoading: false });
    },
    []
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredUser(null);
    setState({ user: null, token: null, isLoading: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    isAuthenticated: !!state.token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
