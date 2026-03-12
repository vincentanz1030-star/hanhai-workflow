import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextResponse } from 'next/server';

export async function GET() {
  const envStatus = {
    // REMOVED: supabaseUrl: !!process.env.COZE_SUPABASE_URL,
    // REMOVED: supabaseAnonKey: !!process.env.COZE_SUPABASE_ANON_KEY,
    jwtSecret: !!process.env.JWT_SECRET,
    bucketEndpointUrl: !!process.env.COZE_BUCKET_ENDPOINT_URL,
    bucketName: !!process.env.COZE_BUCKET_NAME,
  };

  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    envStatus,
    timestamp: new Date().toISOString(),
  });
}
