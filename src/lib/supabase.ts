import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'super_admin' | 'admin' | 'intern' | 'mentor' | 'volunteer';
export const isAdminRole = (role: unknown): role is 'super_admin' | 'admin' =>
  role === 'super_admin' || role === 'admin';

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export type VolunteerStatus = 'pending' | 'approved' | 'rejected';

export type ProgramCategory = string;

export type ResourceType = 'pdf' | 'video' | 'article';

export type ResourceCategory =
  | 'Career Development'
  | 'Entrepreneurship'
  | 'Leadership'
  | 'Employability'
  | 'CV Writing'
  | 'Interview Preparation';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  is_suspended: boolean;
  created_at: string;
}

export interface Program {
  id: string;
  title: string;
  category: ProgramCategory;
  description: string;
  benefits: string[];
  requirements: string[];
  duration: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CCCEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string | null;
  capacity: number | null;
  is_virtual: boolean;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  event?: CCCEvent;
}

export interface Application {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  institution: string;
  occupation: string;
  program_id: string;
  motivation: string;
  status: ApplicationStatus;
  created_at: string;
  program?: Program;
  logs?: ApplicationStatusLog[];
}

export interface ApplicationStatusLog {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  note: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface Volunteer {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  availability: string;
  location: string;
  motivation: string;
  status: VolunteerStatus;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author: string;
  category: string;
  published: boolean;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_draft: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  image_url: string | null;
  rating: number;
  approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  type: ResourceType;
  url: string;
  cover_image_url: string | null;
  duration: string | null;
  downloads: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_name: string;
  donor_email: string | null;
  donor_phone: string | null;
  organization: string | null;
  amount: number;
  currency: string;
  frequency: 'one_time' | 'monthly' | 'yearly';
  message: string | null;
  status: 'pending' | 'completed' | 'failed';
  is_anonymous: boolean;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  organization: string;
  partnership_type: string;
  message: string;
  logo_url: string | null;
  website: string | null;
  category: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: 'unread' | 'read' | 'archived' | 'replied';
  admin_reply: string | null;
  reply_message_id: string | null;
  reply_delivery_status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | null;
  reply_sent_at: string | null;
  reply_delivered_at: string | null;
  replied_by: string | null;
  created_at: string;
}

export interface ContactMessageReply {
  id: string;
  contact_message_id: string;
  direction: 'outbound' | 'inbound';
  provider_message_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string | null;
  body_text: string;
  received_at: string | null;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export interface AdminNote {
  id: string;
  application_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  expertise: string[];
  industry: string;
  bio: string;
  availability: string;
  is_available: boolean;
  created_at: string;
}

export interface MentorSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  topic: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
  meeting_url: string | null;
  created_at: string;
}
