import { renderHook } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { Session, AuthChangeEvent, PostgrestSingleResponse } from "@supabase/supabase-js";

// Type-safe declaration for our global test helper
declare global {
  var triggerAuthStateChange: (event: AuthChangeEvent, session: Session | null) => void;
}

// Helper to create a mock session
const createMockSession = (user: { id: string; email: string }): Session => ({
  user: {
    id: user.id,
    email: user.email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  },
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("AuthContext - Tier-Based Access", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the onAuthStateChange to be controllable in a type-safe way
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(
      (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
        globalThis.triggerAuthStateChange = (event: AuthChangeEvent, session: Session | null) => {
          callback(event, session);
        };
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }
    );
    
    // Mock getSession for initial load state
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
  });

  const testUserRole = async (role: "admin" | "max" | "pro" | "free", expectedIsMaxTier: boolean) => {
    const user = { id: `${role}-user`, email: `${role}@example.com` };
    const mockSession = createMockSession(user);

    // Mock role check to return the specified role
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: role,
      error: null,
    } as unknown as PostgrestSingleResponse<string>);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially, expect no user
    expect(result.current.userRole).toBeNull();
    expect(result.current.isMaxAITier).toBe(false);

    // Trigger the sign-in event via the global helper
    globalThis.triggerAuthStateChange("SIGNED_IN", mockSession);

    // Wait for all state updates to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user?.id).toBe(user.id);
      expect(result.current.userRole).toBe(role);
      expect(result.current.isMaxAITier).toBe(expectedIsMaxTier);
    }, { timeout: 3000 });
  };

  describe("isMaxAITier flag", () => {
    it("should return true for admin tier users", async () => {
      await testUserRole("admin", true);
    });

    it("should return true for max tier users", async () => {
      await testUserRole("max", true);
    });

    it("should return false for pro tier users", async () => {
      await testUserRole("pro", false);
    });

    it("should return false for free tier users", async () => {
      await testUserRole("free", false);
    });
  });

  describe("White-label feature access validation", () => {
    it("should allow access for Max AI tier", async () => {
      await testUserRole("max", true);
    });

    it("should deny access for Pro tier", async () => {
      await testUserRole("pro", false);
    });
  });
});
