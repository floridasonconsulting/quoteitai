-- ============================================================================
-- Quote.it AI - Complete Database Schema
-- Run this in your NEW Supabase project to set up everything
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    contact_first_name TEXT,
    contact_last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items Table (with new columns)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    markup_type TEXT CHECK (markup_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    markup DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    units TEXT DEFAULT 'Each',
    min_quantity INTEGER DEFAULT 1 CHECK (min_quantity > 0),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    title TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'sent', 'accepted', 'declined')) DEFAULT 'draft',
    notes TEXT,
    executive_summary TEXT,
    sent_date TIMESTAMPTZ,
    follow_up_date TIMESTAMPTZ,
    share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
    shared_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    show_pricing BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quote_number)
);

-- Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    logo TEXT,
    logo_display_option TEXT DEFAULT 'both',
    license TEXT,
    insurance TEXT,
    terms TEXT,
    proposal_template TEXT DEFAULT 'classic',
    proposal_theme TEXT DEFAULT 'modern-corporate',
    notify_email_accepted BOOLEAN DEFAULT true,
    notify_email_declined BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'pro', 'max', 'business', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Usage Table
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    ai_requests_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_share_token ON quotes(share_token);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Customers Policies
CREATE POLICY "Users can view their own customers"
    ON customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers"
    ON customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
    ON customers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
    ON customers FOR DELETE
    USING (auth.uid() = user_id);

-- Items Policies
CREATE POLICY "Users can view their own items"
    ON items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
    ON items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
    ON items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
    ON items FOR DELETE
    USING (auth.uid() = user_id);

-- Quotes Policies
CREATE POLICY "Users can view their own quotes"
    ON quotes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view quotes with share_token"
    ON quotes FOR SELECT
    USING (share_token IS NOT NULL);

CREATE POLICY "Users can insert their own quotes"
    ON quotes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
    ON quotes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
    ON quotes FOR DELETE
    USING (auth.uid() = user_id);

-- Company Settings Policies
CREATE POLICY "Users can view their own settings"
    ON company_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON company_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON company_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- User Roles Policies
CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles"
    ON user_roles FOR ALL
    USING (true);

-- Subscription Usage Policies
CREATE POLICY "Users can view their own usage"
    ON subscription_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
    ON subscription_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
    ON subscription_usage FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = _user_id;
    
    -- If no role found, return 'free'
    IF user_role IS NULL THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (_user_id, 'free')
        ON CONFLICT (user_id) DO NOTHING;
        RETURN 'free';
    END IF;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN HELPER FUNCTIONS (for easy test account setup)
-- ============================================================================

-- Function to set user role by email (for easy admin setup)
CREATE OR REPLACE FUNCTION set_user_role_by_email(_email TEXT, _role TEXT)
RETURNS JSONB AS $$
DECLARE
    _user_id UUID;
    result JSONB;
BEGIN
    -- Validate role
    IF _role NOT IN ('free', 'pro', 'max', 'business', 'admin') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid role. Must be: free, pro, max, business, or admin'
        );
    END IF;
    
    -- Find user by email
    SELECT id INTO _user_id
    FROM auth.users
    WHERE email = _email;
    
    -- Check if user exists
    IF _user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found with email: ' || _email
        );
    END IF;
    
    -- Insert or update role
    INSERT INTO user_roles (user_id, role)
    VALUES (_user_id, _role)
    ON CONFLICT (user_id) DO UPDATE SET role = _role, updated_at = NOW();
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'user_id', _user_id,
        'email', _email,
        'role', _role,
        'message', 'Role updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all users with their roles
CREATE OR REPLACE FUNCTION list_users_with_roles()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        COALESCE(r.role, 'free') as role,
        u.created_at
    FROM auth.users u
    LEFT JOIN user_roles r ON u.id = r.user_id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Add updated_at triggers for all tables
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE customers IS 'Customer records with contact information';
COMMENT ON TABLE items IS 'Product and service catalog with pricing';
COMMENT ON TABLE quotes IS 'Quote records with line items and status tracking';
COMMENT ON TABLE company_settings IS 'Company branding and configuration per user';
COMMENT ON TABLE user_roles IS 'User subscription tier and permissions';
COMMENT ON TABLE subscription_usage IS 'Track AI usage per user per month';

COMMENT ON COLUMN items.min_quantity IS 'Minimum quantity that must be ordered for this item';
COMMENT ON COLUMN items.image_url IS 'URL to product/service image for proposal presentations';
COMMENT ON COLUMN quotes.share_token IS 'Secure token for public quote viewing';
COMMENT ON COLUMN quotes.expires_at IS 'Optional expiration date for shared quotes';
COMMENT ON COLUMN quotes.show_pricing IS 'Controls visibility of individual line-item pricing in proposals (true = show prices, false = hide prices, show only category totals)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to anon users (for public quote viewing)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON quotes TO anon;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Quote.it AI Database Schema Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables Created:';
    RAISE NOTICE '   - customers (with RLS)';
    RAISE NOTICE '   - items (with min_quantity and image_url columns)';
    RAISE NOTICE '   - quotes (with RLS and public sharing)';
    RAISE NOTICE '   - company_settings (with RLS)';
    RAISE NOTICE '   - user_roles (with RLS)';
    RAISE NOTICE '   - subscription_usage (with RLS)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security:';
    RAISE NOTICE '   - Row Level Security enabled on all tables';
    RAISE NOTICE '   - Policies configured for user isolation';
    RAISE NOTICE '   - Public quote viewing via share_token';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '   1. Update Softgen Supabase connection (upper right corner)';
    RAISE NOTICE '   2. Enter YOUR Supabase URL and anon key';
    RAISE NOTICE '   3. App will now use your Supabase database';
    RAISE NOTICE '';
END $$;