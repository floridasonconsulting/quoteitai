import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export interface AuthenticatedUser {
  user: any;
  role: string;
}

export async function requireAuth(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized: Invalid token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const { data: roleData, error: roleError } = await supabase
    .rpc("get_user_role", { _user_id: user.id });

  if (roleError) {
    console.error("Failed to get user role:", roleError);
    throw new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const role = roleData || "free";

  return { user, role };
}

export async function requireRole(
  req: Request,
  allowedRoles: string[]
): Promise<AuthenticatedUser> {
  const { user, role } = await requireAuth(req);

  if (!allowedRoles.includes(role)) {
    throw new Response(
      JSON.stringify({
        error: `Forbidden: This feature requires ${allowedRoles.join(" or ")} tier`,
        requiredRoles: allowedRoles,
        currentRole: role
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  return { user, role };
}

export async function requireAdmin(req: Request): Promise<AuthenticatedUser> {
  return requireRole(req, ["admin"]);
}

export async function requirePaidTier(req: Request): Promise<AuthenticatedUser> {
  return requireRole(req, ["pro", "business", "max", "admin"]);
}

export function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE"
  };
}