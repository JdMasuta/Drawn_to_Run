// API request and response types

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'participant' | 'organizer' | 'admin';
  email_verified: boolean;
  profile_image?: string;
  bio?: string;
  strava_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distance_options: string[];
  capacity?: number;
  registration_fee?: number;
  early_bird_fee?: number;
  early_bird_deadline?: string;
  banner_image?: string;
  created_by: number;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  organizer?: User;
  tags?: Tag[];
  registration_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  category: 'distance' | 'location' | 'type' | 'difficulty';
  color: string;
}

export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  distance: string;
  status: 'registered' | 'completed' | 'dns' | 'dnf';
  bib_number?: number;
  finish_time?: string;
  strava_activity_id?: string;
  registered_at: string;
  completed_at?: string;
  user?: User;
  event?: Event;
}

export interface Comment {
  id: number;
  event_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

export interface EmailSubscriber {
  id: number;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

// Request types
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role?: 'participant' | 'organizer' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_date: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distance_options: string[];
  capacity?: number;
  registration_fee?: number;
  early_bird_fee?: number;
  early_bird_deadline?: string;
  banner_image?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: 'active' | 'cancelled' | 'completed';
}

export interface EventRegistrationRequest {
  distance: string;
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: number;
}

export interface EmailSubscriptionRequest {
  email: string;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface EventListResponse {
  events: Event[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query parameter types
export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  distance?: string;
  date_from?: string;
  date_to?: string;
  tags?: string; // comma-separated tag IDs
  sort?: 'date' | 'title' | 'location' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface UserRegistrationsQueryParams {
  page?: number;
  limit?: number;
  status?: 'registered' | 'completed' | 'dns' | 'dnf';
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}