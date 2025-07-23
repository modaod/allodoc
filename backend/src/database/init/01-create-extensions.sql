-- Required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Index for full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Function to generate patient numbers
CREATE OR REPLACE FUNCTION generate_patient_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    org_code TEXT;
BEGIN
    -- Get organization code (first 3 letters of name in uppercase)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3)) 
    INTO org_code 
    FROM organizations 
    WHERE id = org_id;
    
    -- If not found, use 'MED'
    IF org_code IS NULL OR org_code = '' THEN
        org_code := 'MED';
    END IF;
    
    -- Count existing patients for this organization
    SELECT COUNT(*) + 1 
    INTO next_number 
    FROM patients 
    WHERE organization_id = org_id;
    
    -- Return formatted number
    RETURN org_code || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function for automatic audit
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            entity_type, entity_id, action, new_values, 
            user_id, organization_id, timestamp, ip_address
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'CREATE', row_to_json(NEW),
            COALESCE(current_setting('audit.user_id', true)::UUID, NEW.created_by),
            COALESCE(current_setting('audit.organization_id', true)::UUID, NEW.organization_id),
            NOW(),
            current_setting('audit.ip_address', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            entity_type, entity_id, action, old_values, new_values,
            user_id, organization_id, timestamp, ip_address
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
            COALESCE(current_setting('audit.user_id', true)::UUID, NEW.updated_by),
            COALESCE(current_setting('audit.organization_id', true)::UUID, NEW.organization_id),
            NOW(),
            current_setting('audit.ip_address', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            entity_type, entity_id, action, old_values,
            user_id, organization_id, timestamp, ip_address
        ) VALUES (
            TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD),
            current_setting('audit.user_id', true)::UUID,
            COALESCE(current_setting('audit.organization_id', true)::UUID, OLD.organization_id),
            NOW(),
            current_setting('audit.ip_address', true)
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;