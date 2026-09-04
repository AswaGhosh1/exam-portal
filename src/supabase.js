import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwcoajjaygxwpwycvvmv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Y29hampheWd4d3B3eWN2dm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjUyOTUsImV4cCI6MjEwNDAwMTI5NX0.5PSFu4OYz2TEXwqXIb8wZfTQL-RSLiK4RdjYqEkcl6U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
