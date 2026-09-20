import { createClient } from "@/lib/supabase/server";
import {
  isAdminRole,
  isCashierRole,
  isOperationalRole,
  isOwnerRole,
  type UserRole,
} from "@/lib/auth/roles";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AuthenticatedProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

export type AuthorizedContext = {
  supabase: SupabaseServerClient;
  profile: AuthenticatedProfile;
};

/**
 * Server-side authorization has to survive a forged request, not just a hidden
 * button, so every mutation resolves the caller's role from the database here
 * rather than trusting a prop or a client payload. The RPC and RLS layers
 * re-check the same role independently.
 */

export type GuardMessages = {
  unauthenticated?: string;
  inactive?: string;
  forbidden?: string;
};

const DEFAULT_MESSAGES: Required<GuardMessages> = {
  unauthenticated: "Sesi berakhir. Silakan login ulang.",
  inactive: "Akun Anda tidak aktif. Hubungi Owner.",
  forbidden: "Anda tidak memiliki izin untuk tindakan ini.",
};

/**
 * Failures still carry the client so a caller can run follow-up reads or
 * revalidate without building a second connection.
 */
export type AuthResult =
  | { ok: true; context: AuthorizedContext }
  | { ok: false; error: string; supabase: SupabaseServerClient };

/** Thrown by `assertOperational`, for call sites that surface errors as exceptions. */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

async function resolveContext(
  allowed: (role: UserRole) => boolean,
  messages: GuardMessages
): Promise<AuthResult> {
  const text = { ...DEFAULT_MESSAGES, ...messages };
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: text.unauthenticated, supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { ok: false, error: text.unauthenticated, supabase };
  }
  if (!profile.is_active) {
    return { ok: false, error: text.inactive, supabase };
  }

  const role = profile.role as UserRole;
  if (!allowed(role)) {
    return { ok: false, error: text.forbidden, supabase };
  }

  return {
    ok: true,
    context: {
      supabase,
      profile: {
        id: user.id,
        full_name: profile.full_name,
        role,
        is_active: profile.is_active,
      },
    },
  };
}

/** Any signed-in, active account. Used by pages that only need identity. */
export function requireAuthenticated(messages: GuardMessages = {}) {
  return resolveContext(() => true, messages);
}

/** Admin, staff, kitchen, or owner — the operational dashboard. */
export function requireOperational(messages: GuardMessages = {}) {
  return resolveContext(isOperationalRole, messages);
}

/** Admin, staff, or owner — may take payment and build orders. */
export function requireCashier(messages: GuardMessages = {}) {
  return resolveContext(isCashierRole, messages);
}

/** Admin or owner — catalog, table, and upload administration. */
export function requireAdminRole(messages: GuardMessages = {}) {
  return resolveContext(isAdminRole, messages);
}

/** Owner only — staff management and destructive order actions. */
export function requireOwner(messages: GuardMessages = {}) {
  return resolveContext(isOwnerRole, messages);
}

/** Throwing variant for call sites that already surface failures as errors. */
export async function assertOperational(messages: GuardMessages = {}) {
  const result = await requireOperational(messages);
  if (!result.ok) throw new AuthorizationError(result.error);
  return result.context;
}

/** Throwing variant used by the storage upload actions. */
export async function assertAdminRole(messages: GuardMessages = {}) {
  const result = await requireAdminRole(messages);
  if (!result.ok) throw new AuthorizationError(result.error);
  return result.context;
}