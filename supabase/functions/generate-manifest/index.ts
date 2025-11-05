import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

interface Manifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  orientation: string;
  icons: ManifestIcon[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId parameter is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user is Max AI tier
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.error('Error checking user role:', roleError);
    }

    const isMaxAITier = roleData && (roleData.role === 'max' || roleData.role === 'admin');

    // Fetch company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('name, logo')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
    }

    // Build manifest with company branding or defaults
    const manifest: Manifest = {
      name: isMaxAITier && settings?.name 
        ? settings.name 
        : 'Quote-it AI - Smart Quote Management',
      short_name: isMaxAITier && settings?.name 
        ? settings.name.split(' ').slice(0, 2).join(' ')
        : 'Quote-it AI',
      description: 'Create professional quotes instantly with AI-powered assistance',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#6366f1',
      orientation: 'portrait',
      icons: []
    };

    // Use custom logo for Max AI tier, otherwise use default icons
    if (isMaxAITier && settings?.logo) {
      manifest.icons = [
        {
          src: settings.logo,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: settings.logo,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ];
    } else {
      // Default icons
      manifest.icons = [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ];
    }

    return new Response(
      JSON.stringify(manifest, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    );
  } catch (error) {
    console.error('Error generating manifest:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate manifest' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
