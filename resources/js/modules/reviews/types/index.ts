/**
 * Reviews Module Types
 */

export interface Review {
  id: number;
  user_id: number;
  client_id: number | null;
  appointment_id: number | null;
  author_name: string;
  author_email: string | null;
  author_phone: string | null;
  rating: number;
  text: string | null;
  response: string | null;
  response_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  is_featured: boolean;
  source: 'manual' | 'auto_request' | 'public_page';
  meta: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
  };
  appointment?: {
    id: number;
    start_time: string;
    service_name: string;
  };
  display_name: string;
  stars: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  pending_count: number;
}

export interface ReviewFormData {
  author_name: string;
  author_email?: string;
  author_phone?: string;
  rating: number;
  text?: string;
  client_id?: number;
  appointment_id?: number;
}

export interface ReviewSettings {
  auto_request: boolean;
  request_delay_hours: number;
  show_on_public_page: boolean;
  require_moderation: boolean;
  min_rating_to_show: number;
  display_mode: 'grid' | 'list' | 'carousel';
}
