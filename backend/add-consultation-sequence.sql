-- Create sequence for consultation numbers
-- Starting at 26 since we already have consultations up to 0025
CREATE SEQUENCE IF NOT EXISTS consultation_number_seq START 26;

-- Create function to get next consultation number
CREATE OR REPLACE FUNCTION get_next_consultation_number()
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    year_month TEXT;
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    -- Get next sequence value
    next_val := nextval('consultation_number_seq');
    
    -- Return formatted consultation number
    RETURN 'CONS-' || year_month || '-' || LPAD(next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Optional: Function to reset sequence at the beginning of each month
-- This would need to be called by a scheduled job
CREATE OR REPLACE FUNCTION reset_consultation_sequence_monthly()
RETURNS void AS $$
BEGIN
    -- Reset the sequence to 1
    ALTER SEQUENCE consultation_number_seq RESTART WITH 1;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE, SELECT ON SEQUENCE consultation_number_seq TO medical_user;
GRANT EXECUTE ON FUNCTION get_next_consultation_number() TO medical_user;
GRANT EXECUTE ON FUNCTION reset_consultation_sequence_monthly() TO medical_user;