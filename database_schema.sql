
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE booking_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE ambulance_status AS ENUM ('available', 'assigned', 'maintenance', 'out_of_service');
CREATE TYPE driver_status AS ENUM ('available', 'assigned', 'off_duty', 'on_leave');

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ambulances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status ambulance_status DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    status driver_status DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    health_condition TEXT,
    pickup_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    drop_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    from_date TIMESTAMP WITH TIME ZONE NOT NULL,
    to_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status DEFAULT 'pending',
    assigned_ambulance_id UUID REFERENCES ambulances(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_date_range CHECK (to_date > from_date),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^\+?[1-9]\d{1,14}$')
);

CREATE TABLE driver_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    ambulance_id UUID NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(driver_id, assignment_date),
    UNIQUE(ambulance_id, assignment_date)
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_otp_phone_expires (phone, expires_at)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(50),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_phone ON bookings(phone);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_from_date ON bookings(from_date);
CREATE INDEX idx_bookings_to_date ON bookings(to_date);
CREATE INDEX idx_bookings_assigned_ambulance ON bookings(assigned_ambulance_id);

CREATE INDEX idx_ambulances_license_plate ON ambulances(license_plate);
CREATE INDEX idx_ambulances_status ON ambulances(status);

CREATE INDEX idx_drivers_phone ON drivers(phone);
CREATE INDEX idx_drivers_license_number ON drivers(license_number);
CREATE INDEX idx_drivers_status ON drivers(status);

CREATE INDEX idx_driver_assignments_date ON driver_assignments(assignment_date);
CREATE INDEX idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX idx_driver_assignments_ambulance ON driver_assignments(ambulance_id);

CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ambulances_updated_at BEFORE UPDATE ON ambulances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_assignments_updated_at BEFORE UPDATE ON driver_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO admin_users (username, password_hash, email) VALUES 
('admin', 'e3afed0047b08059d0fada10f400c1e5', 'admin@diginitymov.com'),
('manager', '1c142b2d01aa34e9a36bde480645a57fd69e14155dacfab5a3f9257b77fdc8d8', 'manager@diginitymov.com');

CREATE VIEW active_bookings AS
SELECT 
    b.*,
    pl.address as pickup_address,
    pl.latitude as pickup_latitude,
    pl.longitude as pickup_longitude,
    dl.address as drop_address,
    dl.latitude as drop_latitude,
    dl.longitude as drop_longitude,
    a.license_plate as ambulance_license_plate,
    a.model as ambulance_model
FROM bookings b
LEFT JOIN locations pl ON b.pickup_location_id = pl.id
LEFT JOIN locations dl ON b.drop_location_id = dl.id
LEFT JOIN ambulances a ON b.assigned_ambulance_id = a.id
WHERE b.status IN ('pending', 'assigned', 'in_progress');

CREATE VIEW daily_assignments AS
SELECT 
    da.*,
    d.name as driver_name,
    d.phone as driver_phone,
    d.license_number as driver_license,
    a.license_plate as ambulance_license_plate,
    a.model as ambulance_model,
    a.capacity as ambulance_capacity
FROM driver_assignments da
JOIN drivers d ON da.driver_id = d.id
JOIN ambulances a ON da.ambulance_id = a.id
WHERE da.assignment_date >= CURRENT_DATE;

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM otp_verifications 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_ambulances(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
    ambulance_id UUID,
    license_plate VARCHAR(20),
    model VARCHAR(100),
    capacity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.license_plate, a.model, a.capacity
    FROM ambulances a
    WHERE a.status = 'available'
    AND a.id NOT IN (
        SELECT DISTINCT b.assigned_ambulance_id
        FROM bookings b
        WHERE b.assigned_ambulance_id IS NOT NULL
        AND b.status IN ('assigned', 'in_progress')
        AND (
            (b.from_date <= start_date AND b.to_date > start_date) OR
            (b.from_date < end_date AND b.to_date >= end_date) OR
            (b.from_date >= start_date AND b.to_date <= end_date)
        )
    );
END;
$$ LANGUAGE plpgsql;


COMMENT ON TABLE bookings IS 'Customer ambulette booking requests with pickup/drop locations and dates';
COMMENT ON TABLE ambulances IS 'Fleet of ambulettes available for booking assignments';
COMMENT ON TABLE drivers IS 'Licensed drivers who can be assigned to ambulettes';
COMMENT ON TABLE driver_assignments IS 'Daily assignments of drivers to specific ambulettes';
COMMENT ON TABLE locations IS 'Geographic locations for pickup and drop-off points';
COMMENT ON TABLE admin_users IS 'Administrative users with access to the management system';
COMMENT ON TABLE otp_verifications IS 'One-time password verifications for phone number validation';
COMMENT ON TABLE audit_logs IS 'Audit trail for tracking changes to critical data';

COMMENT ON FUNCTION cleanup_expired_otps() IS 'Removes expired OTP verification records';
COMMENT ON FUNCTION get_available_ambulances(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns ambulettes available for booking in the specified date range';
