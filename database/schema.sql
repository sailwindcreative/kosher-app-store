-- Kosher App Store Database Schema
-- For Supabase/PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Apps table: stores core app metadata
CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_name TEXT NOT NULL UNIQUE,
    play_url TEXT,
    display_name TEXT NOT NULL,
    short_description TEXT,
    full_description TEXT,
    icon_url TEXT,
    current_version_name TEXT,
    current_version_code INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_package_name ON apps(package_name);
CREATE INDEX idx_apps_updated_at ON apps(updated_at DESC);

-- App versions: tracks all versions of each app
CREATE TABLE app_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    version_name TEXT NOT NULL,
    version_code INTEGER NOT NULL,
    checksum_sha256 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(app_id, version_code)
);

CREATE INDEX idx_app_versions_app_id ON app_versions(app_id);
CREATE INDEX idx_app_versions_version_code ON app_versions(app_id, version_code DESC);

-- APK sources: configured sources for downloading APKs
CREATE TABLE app_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('apkmirror', 'apkpure', 'custom')),
    base_url TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_sources_enabled_priority ON app_sources(enabled, priority);

-- App source versions: links versions to sources with download URLs
CREATE TABLE app_source_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_version_id UUID NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
    app_source_id UUID NOT NULL REFERENCES app_sources(id) ON DELETE CASCADE,
    download_url TEXT NOT NULL,
    last_checked_at TIMESTAMPTZ,
    last_status TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(app_version_id, app_source_id)
);

CREATE INDEX idx_app_source_versions_app_version ON app_source_versions(app_version_id);
CREATE INDEX idx_app_source_versions_source ON app_source_versions(app_source_id);

-- Devices: tracks each device that connects to the system
CREATE TABLE devices (
    id UUID PRIMARY KEY,  -- client-generated device_id
    friendly_name TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_last_seen ON devices(last_seen_at DESC);

-- Installs: tracks app installations per device
CREATE TABLE installs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    app_version_id UUID REFERENCES app_versions(id),
    status TEXT NOT NULL DEFAULT 'requested',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installs_device_id ON installs(device_id);
CREATE INDEX idx_installs_app_id ON installs(app_id);
CREATE INDEX idx_installs_created_at ON installs(created_at DESC);

-- Download events: detailed logging of all download attempts
CREATE TABLE download_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    app_version_id UUID REFERENCES app_versions(id),
    app_source_id UUID REFERENCES app_sources(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('start', 'success', 'failure')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_download_events_device_id ON download_events(device_id);
CREATE INDEX idx_download_events_app_id ON download_events(app_id);
CREATE INDEX idx_download_events_created_at ON download_events(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_sources_updated_at BEFORE UPDATE ON app_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installs_updated_at BEFORE UPDATE ON installs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default APK sources
INSERT INTO app_sources (name, type, base_url, enabled, priority) VALUES
    ('APKMirror', 'apkmirror', 'https://www.apkmirror.com', true, 10),
    ('APKPure', 'apkpure', 'https://apkpure.com', true, 20),
    ('Custom Mirror', 'custom', 'https://mirror.example.com', false, 30)
ON CONFLICT (name) DO NOTHING;

