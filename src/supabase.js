import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
const supabaseUrl = process.env.https://fwcoajjaygxwpwycvvmv.supabase.co;
const supabaseAnonKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Y29hampheWd4d3B3eWN2dm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjUyOTUsImV4cCI6MjEwNDAwMTI5NX0.5PSFu4OYz2TEXwqXIb8wZfTQL-RSLiK4RdjYqEkcl6U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
-
// Helper functions for common operations
export const db = {
  // Students
  getStudents: async () => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    return data || [];
  },
  addStudent: async (student) => {
    const { data, error } = await supabase.from('students').insert(student).select();
    if (error) throw error;
    return data[0];
  },
  removeStudent: async (id) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  },

  // Exams
  getExams: async () => {
    const { data, error } = await supabase.from('exams').select('*');
    if (error) throw error;
    return data || [];
  },
  addExam: async (exam) => {
    const { data, error } = await supabase.from('exams').insert(exam).select();
    if (error) throw error;
    return data[0];
  },
  removeExam: async (id) => {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw error;
  },
  updateExam: async (id, updates) => {
    const { data, error } = await supabase.from('exams').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  // Results
  getResults: async () => {
    const { data, error } = await supabase.from('results').select('*');
    if (error) throw error;
    return data || [];
  },
  addResult: async (result) => {
    const { data, error } = await supabase.from('results').insert(result).select();
    if (error) throw error;
    return data[0];
  },

  // Faculty
  getFaculty: async () => {
    const { data, error } = await supabase.from('faculty_accounts').select('*');
    if (error) throw error;
    return data || [];
  },
  addFaculty: async (faculty) => {
    const { data, error } = await supabase.from('faculty_accounts').insert(faculty).select();
    if (error) throw error;
    return data[0];
  },
  removeFaculty: async (id) => {
    const { error } = await supabase.from('faculty_accounts').delete().eq('id', id);
    if (error) throw error;
  },

  // Notes
  getNotes: async () => {
    const { data, error } = await supabase.from('notes').select('*');
    if (error) throw error;
    return data || [];
  },
  addNote: async (note) => {
    const { data, error } = await supabase.from('notes').insert(note).select();
    if (error) throw error;
    return data[0];
  },
  removeNote: async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },

  // Attendance
  getAttendance: async () => {
    const { data, error } = await supabase.from('attendance').select('*');
    if (error) throw error;
    return data || [];
  },
  setAttendance: async (attendance) => {
    const { error } = await supabase.from('attendance').upsert(attendance);
    if (error) throw error;
  },

  // Admin
  getAdminCreds: async () => {
    const { data, error } = await supabase.from('admin_creds').select('*').eq('id', 'admin');
    if (error) throw error;
    return data[0] || { username: 'admin', password: 'admin123' };
  },
  updateAdminCreds: async (creds) => {
    const { error } = await supabase.from('admin_creds').update(creds).eq('id', 'admin');
    if (error) throw error;
  },

  // Settings
  getSettings: async () => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', '1');
    if (error) throw error;
    return data[0] || { title: 'Exam Place', subtitle: 'Mock Tests & Attendance' };
  },
  updateSettings: async (settings) => {
    const { error } = await supabase.from('settings').update(settings).eq('id', '1');
    if (error) throw error;
  }
};
