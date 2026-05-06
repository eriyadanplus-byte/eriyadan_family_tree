-- Secure RLS Policies for Supabase
-- Replace the current permissive policies with proper role-based access control

-- Members table policies
-- Public read access for all authenticated users
CREATE OR REPLACE POLICY "members_authenticated_select"
    ON members FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admin users can insert, update, delete
CREATE OR REPLACE POLICY "members_admin_insert"
    ON members FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE OR REPLACE POLICY "members_admin_update"
    ON members FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE OR REPLACE POLICY "members_admin_delete"
    ON members FOR DELETE
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Users table policies
-- Users can view their own profile
CREATE OR REPLACE POLICY "users_own_select"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Admins can manage all users
CREATE OR REPLACE POLICY "users_admin_manage"
    ON users FOR ALL
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Permissions table policies
-- Users can view their own permissions
CREATE OR REPLACE POLICY "permissions_own_select"
    ON permissions FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can manage all permissions
CREATE OR REPLACE POLICY "permissions_admin_manage"
    ON permissions FOR ALL
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Audit log policies
-- Admins can view all audit logs
CREATE OR REPLACE POLICY "audit_log_admin_select"
    ON audit_log FOR SELECT
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- System can insert audit logs (app-level)
CREATE OR REPLACE POLICY "audit_log_system_insert"
    ON audit_log FOR INSERT
    WITH CHECK (true);

-- Relationships and spouses policies
-- All authenticated users can view relationships
CREATE OR REPLACE POLICY "relationships_authenticated_select"
    ON relationships FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE OR REPLACE POLICY "spouses_authenticated_select"
    ON spouses FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admins can manage relationships and spouses
CREATE OR REPLACE POLICY "relationships_admin_manage"
    ON relationships FOR ALL
    USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE OR REPLACE POLICY "spouses_admin_manage"
    ON spouses FOR ALL
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Approval scopes policies
-- Users can view their own approval scopes
CREATE OR REPLACE POLICY "approval_scopes_own_select"
    ON approval_scopes FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can manage all approval scopes
CREATE OR REPLACE POLICY "approval_scopes_admin_manage"
    ON approval_scopes FOR ALL
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Help threads and messages policies
-- All authenticated users can view help threads
CREATE OR REPLACE POLICY "help_threads_authenticated_select"
    ON help_threads FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can insert their own help threads
CREATE OR REPLACE POLICY "help_threads_own_insert"
    ON help_threads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can manage help threads
CREATE OR REPLACE POLICY "help_threads_admin_manage"
    ON help_threads FOR UPDATE, DELETE
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Help messages policies
-- All authenticated users can view help messages
CREATE OR REPLACE POLICY "help_messages_authenticated_select"
    ON help_messages FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can insert messages in help threads
CREATE OR REPLACE POLICY "help_messages_own_insert"
    ON help_messages FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Admins can manage help messages
CREATE OR REPLACE POLICY "help_messages_admin_manage"
    ON help_messages FOR UPDATE, DELETE
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Messaging handler grants policies
-- Admins can manage messaging handler grants
CREATE OR REPLACE POLICY "messaging_handler_grants_admin_manage"
    ON messaging_handler_grants FOR ALL
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- App config policies
-- Admins can manage app configuration
CREATE OR REPLACE POLICY "app_config_admin_manage"
    ON app_config FOR ALL
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Grant exec_sql to authenticated users only (more restrictive)
REVOKE EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO authenticated;

-- Grant table access to authenticated users only
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Revoke public access from exec_sql function
REVOKE ALL ON FUNCTION exec_sql(TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO authenticated;