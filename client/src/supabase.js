import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fqfaummknkfnnevhrdnc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZmF1bW1rbmtmbm5ldmhyZG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzAwMDAsImV4cCI6MjA2ODQ0NjAwMH0.-oicSWGsKS3BRBmnf9WJEPq758R-t9tIfPqvakgkfB8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);