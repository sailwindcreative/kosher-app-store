import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Environment validation
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },
  
  security: {
    apiSecret: process.env.API_SECRET || 'change-me-in-production',
    allowedSourceDomains: [
      'apkmirror.com',
      'www.apkmirror.com',
      'apkpure.com',
      'www.apkpure.com',
      'mirror.example.com',
    ],
    downloadTokenExpirySeconds: 300, // 5 minutes
  },
  
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:3000',
  },
};

// Create Supabase client with service role key for backend operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create Supabase client with anon key for client-facing operations
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

