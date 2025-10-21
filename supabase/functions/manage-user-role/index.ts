import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the requesting user is an admin
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (adminCheckError) {
      console.error('Admin check error:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.log('Non-admin user attempted role change:', user.id);
      return new Response(
        JSON.stringify({ error: 'Only admins can manage user roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or newRole' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['admin', 'free', 'pro', 'max'];
    if (!validRoles.includes(newRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be: admin, free, pro, or max' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} updating user ${userId} to role ${newRole}`);

    // Update or insert the user's role
    const { data, error } = await supabaseClient
      .from('user_roles')
      .upsert(
        { user_id: userId, role: newRole },
        { onConflict: 'user_id,role' }
      )
      .select()
      .single();

    if (error) {
      console.error('Role update error:', error);
      
      // Return sanitized error to client
      const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
      const clientError = isDevelopment 
        ? error.message 
        : 'Failed to update role. Please try again.';
      
      return new Response(
        JSON.stringify({ error: clientError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Role updated successfully:', data);

    return new Response(
      JSON.stringify({ success: true, role: data.role }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Return sanitized error to client
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const clientError = isDevelopment 
      ? errorMessage 
      : 'An error occurred. Please try again.';
    
    return new Response(
      JSON.stringify({ error: clientError }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
