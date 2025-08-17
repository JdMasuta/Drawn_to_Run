// Core entity types
export interface User {
  id: number;
  email: string;
  name: string;
  password_hash?: string;
  strava_id?: string;
  strava_access_token?: string;
  strava_refresh_token?: string;
  profile_image?: string;
  bio?: string;
  role: 'participant' | 'organizer' | 'admin';
  email_verified: boolean;
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
  // Populated relationships
  creator?: User;
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
  // Populated relationships
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
  // Populated relationships
  user?: User;
  replies?: Comment[];
}

export interface EmailSubscriber {
  id: number;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export interface Media {
  id: number;
  event_id?: number;
  user_id?: number;
  file_path: string;
  file_type?: string;
  caption?: string;
  instagram_url?: string;
  uploaded_at: string;
  // Populated relationships
  event?: Event;
  user?: User;
}

// API request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
  tag_ids?: number[];
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: number;
}

export interface EventFilters {
  search?: string;
  distance?: string[];
  location?: string[];
  type?: string[];
  difficulty?: string[];
  date_from?: string;
  date_to?: string;
  fee_max?: number;
  page?: number;
  limit?: number;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  pages: number;
}

export interface RegisterForEventRequest {
  event_id: number;
  distance: string;
}

export interface CommentRequest {
  event_id: number;
  content: string;
  parent_id?: number;
}

export interface EmailSubscribeRequest {
  email: string;
}

// Strava integration types
export interface StravaActivity {
  id: string;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  start_latitude?: number;
  start_longitude?: number;
}

export interface StravaAuthResponse {
  access_token: string;
  refresh_token: string;
  athlete: {
    id: string;
    firstname: string;
    lastname: string;
    profile: string;
  };
}

// UI component types
export interface EventCardProps {
  event: Event;
  showRegistration?: boolean;
  onRegister?: (event: Event, distance: string) => void;
}

export interface FilterSidebarProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  tags: Tag[];
}

export interface TagChipProps {
  tag: Tag;
  selected?: boolean;
  onClick?: (tag: Tag) => void;
}

export interface RegistrationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onRegister: (distance: string) => void;
}

// Store types (Zustand)
export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface EventStore {
  events: Event[];
  currentEvent: Event | null;
  filters: EventFilters;
  loading: boolean;
  error: string | null;
  setFilters: (filters: EventFilters) => void;
  fetchEvents: () => Promise<void>;
  fetchEvent: (id: number) => Promise<void>;
  createEvent: (data: CreateEventRequest) => Promise<Event>;
  updateEvent: (data: UpdateEventRequest) => Promise<Event>;
  deleteEvent: (id: number) => Promise<void>;
}

// Utility types
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiError = {
  error: string;
  message: string;
  status: number;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Form types for React Hook Form
export interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  location: string;
  distance_options: string[];
  capacity: number;
  registration_fee: number;
  early_bird_fee: number;
  early_bird_deadline: string;
  banner_image: FileList;
  tag_ids: number[];
}

export interface ProfileFormData {
  name: string;
  email: string;
  bio: string;
  profile_image: FileList;
}

export interface PasswordChangeFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}