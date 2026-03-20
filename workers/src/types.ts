export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  FETCH_QUEUE: Queue;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  BUILD_API_KEY: string;
  ENVIRONMENT: string;
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  GOOGLE_PLACES_API_KEY: string;
  ADMIN_CHAT_ID: string;
}

export interface Client {
  id: string;
  business_name: string;
  telegram_chat_id: string;
  timezone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  instagram_user_id: string | null;
  google_place_id: string | null;
  facebook_page_id: string | null;
  pages_project_name: string;
  r2_bucket_prefix: string;
  auto_approve_5_star: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  client_id: string;
  source: 'google' | 'facebook';
  author_name: string | null;
  rating: number | null;
  text: string | null;
  review_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstagramPost {
  id: string;
  client_id: string;
  instagram_id: string;
  caption: string | null;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string | null;
  posted_at: string | null;
  synced_at: string;
}

export interface BlogPost {
  id: string;
  client_id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  tags: string | null;
  status: 'draft' | 'pending_approval' | 'published';
  image_url: string | null;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface GalleryImage {
  id: string;
  client_id: string;
  r2_key: string;
  alt_text: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  srcset: string | null;
  display_order: number;
  source: 'upload' | 'instagram';
  instagram_post_id: string | null;
  created_at: string;
}

export interface FetchClientInfo {
  id: string;
  google_place_id: string | null;
  instagram_user_id: string | null;
  facebook_page_id: string | null;
}

export interface FetchQueueMessage {
  client_id: string;
  client: FetchClientInfo;
  tasks: ('instagram' | 'google' | 'facebook')[];
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message?: {
      message_id: number;
      chat: { id: number };
    };
    data?: string;
  };
}

export interface WizardState {
  type: 'addclient' | 'onboarding';
  step: string;
  data: Record<string, string>;
  clientId?: string;
  updatedAt: string;
}

export interface InviteToken {
  token: string;
  client_id: string;
  created_at: string;
  expires_at: string;
  claimed_by: string | null;
}
