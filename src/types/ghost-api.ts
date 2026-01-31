/**
 * Type definitions for Ghost Admin API.
 *
 * Reference: https://docs.ghost.org/admin-api/
 */

/**
 * Configuration options for creating a Ghost API client.
 */
export interface GhostClientConfig {
  /**
   * The Ghost Admin API URL (e.g., "https://yourblog.ghost.io/ghost/api/admin/")
   * or just the base URL (e.g., "https://yourblog.ghost.io")
   */
  url: string;

  /**
   * The Ghost Admin API key in "id:secret" format.
   */
  apiKey: string;

  /**
   * API version to use. Defaults to "v5.0".
   */
  version?: string;
}

/**
 * Options for making API requests.
 */
export interface GhostRequestOptions {
  /**
   * HTTP method for the request.
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  /**
   * Request body data (will be JSON stringified).
   */
  body?: unknown;

  /**
   * Query parameters for the request.
   */
  params?: Record<string, string | number | boolean | undefined>;

  /**
   * Request timeout in milliseconds.
   */
  timeout?: number;
}

/**
 * Options for form data uploads.
 */
export interface FormDataUploadOptions {
  /**
   * Request timeout in milliseconds.
   */
  timeout?: number;
}

/**
 * Ghost API error response structure.
 */
export interface GhostApiErrorResponse {
  errors: GhostApiErrorDetail[];
}

/**
 * Individual error detail from Ghost API.
 */
export interface GhostApiErrorDetail {
  message: string;
  context?: string | null;
  type?: string;
  details?: unknown;
  property?: string | null;
  help?: string | null;
  code?: string | null;
  id?: string;
  ghostErrorCode?: string | null;
}

/**
 * Standard Ghost API response wrapper.
 * Resources are wrapped in arrays under their resource type key.
 */
export interface GhostApiResponse<T> {
  [key: string]: T[] | GhostApiMeta | undefined;
  meta?: GhostApiMeta;
}

/**
 * Metadata included in paginated responses.
 */
export interface GhostApiMeta {
  pagination?: GhostPagination;
}

/**
 * Pagination information.
 */
export interface GhostPagination {
  page: number;
  limit: number;
  pages: number;
  total: number;
  next: number | null;
  prev: number | null;
}

/**
 * Ghost Post resource.
 */
export interface GhostPost {
  id: string;
  uuid?: string;
  title?: string;
  slug?: string;
  html?: string;
  mobiledoc?: string;
  lexical?: string;
  feature_image?: string | null;
  featured?: boolean;
  status?: 'published' | 'draft' | 'scheduled' | 'sent';
  visibility?: 'public' | 'members' | 'paid' | 'tiers';
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  custom_excerpt?: string | null;
  codeinjection_head?: string | null;
  codeinjection_foot?: string | null;
  custom_template?: string | null;
  canonical_url?: string | null;
  tags?: GhostTag[];
  authors?: GhostAuthor[];
  primary_author?: GhostAuthor;
  primary_tag?: GhostTag | null;
  url?: string;
  excerpt?: string;
  og_image?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_image?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  email_only?: boolean;
}

/**
 * Ghost Page resource (same structure as Post).
 */
export type GhostPage = GhostPost;

/**
 * Ghost Tag resource.
 */
export interface GhostTag {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  feature_image?: string | null;
  visibility?: 'public' | 'internal';
  og_image?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_image?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  codeinjection_head?: string | null;
  codeinjection_foot?: string | null;
  canonical_url?: string | null;
  accent_color?: string | null;
  url?: string;
}

/**
 * Ghost Author/User resource.
 */
export interface GhostAuthor {
  id: string;
  name?: string;
  slug?: string;
  email?: string;
  profile_image?: string | null;
  cover_image?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  accessibility?: string | null;
  status?: 'active' | 'inactive' | 'locked';
  meta_title?: string | null;
  meta_description?: string | null;
  tour?: unknown | null;
  last_seen?: string | null;
  created_at?: string;
  updated_at?: string;
  url?: string;
  roles?: GhostRole[];
}

/**
 * Ghost Role resource.
 */
export interface GhostRole {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Ghost Member resource.
 */
export interface GhostMember {
  id: string;
  uuid?: string;
  email: string;
  name?: string | null;
  note?: string | null;
  geolocation?: string | null;
  subscribed?: boolean;
  created_at?: string;
  updated_at?: string;
  labels?: GhostLabel[];
  subscriptions?: unknown[];
  avatar_image?: string;
  comped?: boolean;
  email_count?: number;
  email_opened_count?: number;
  email_open_rate?: number | null;
  status?: 'free' | 'paid' | 'comped';
  last_seen_at?: string | null;
  tiers?: GhostTier[];
  newsletters?: GhostNewsletter[];
}

/**
 * Ghost Label resource.
 */
export interface GhostLabel {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Ghost Tier resource.
 */
export interface GhostTier {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  active?: boolean;
  type?: 'free' | 'paid';
  welcome_page_url?: string | null;
  created_at?: string;
  updated_at?: string;
  monthly_price?: number | null;
  yearly_price?: number | null;
  currency?: string | null;
  benefits?: string[];
  visibility?: 'public' | 'none';
  trial_days?: number;
}

/**
 * Ghost Newsletter resource.
 */
export interface GhostNewsletter {
  id: string;
  uuid?: string;
  name: string;
  slug?: string;
  description?: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
  sender_reply_to?: string;
  status?: 'active' | 'archived';
  visibility?: 'members' | 'paid';
  subscribe_on_signup?: boolean;
  sort_order?: number;
  header_image?: string | null;
  show_header_icon?: boolean;
  show_header_title?: boolean;
  title_font_category?: string;
  title_alignment?: string;
  show_feature_image?: boolean;
  body_font_category?: string;
  footer_content?: string | null;
  show_badge?: boolean;
  show_header_name?: boolean;
  show_post_title_section?: boolean;
  show_comment_cta?: boolean;
  show_subscription_details?: boolean;
  show_latest_posts?: boolean;
  background_color?: string;
  border_color?: string | null;
  title_color?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Ghost Site resource (returned from /site/ endpoint).
 */
export interface GhostSite {
  title: string;
  description?: string | null;
  logo?: string | null;
  icon?: string | null;
  accent_color?: string | null;
  url: string;
  version: string;
}

/**
 * Ghost Webhook resource.
 */
export interface GhostWebhook {
  id: string;
  event: string;
  target_url: string;
  name?: string | null;
  secret?: string | null;
  api_version?: string;
  integration_id?: string;
  status?: 'available' | 'unavailable';
  last_triggered_at?: string | null;
  last_triggered_status?: string | null;
  last_triggered_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Ghost Image upload response.
 */
export interface GhostImage {
  url: string;
  ref?: string | null;
}

/**
 * Ghost Offer resource.
 */
export interface GhostOffer {
  id: string;
  name: string;
  code: string;
  display_title?: string | null;
  display_description?: string | null;
  type?: 'percent' | 'fixed' | 'trial';
  cadence?: 'month' | 'year';
  amount?: number;
  duration?: 'once' | 'forever' | 'repeating' | 'trial';
  duration_in_months?: number | null;
  currency_restriction?: boolean;
  currency?: string | null;
  status?: 'active' | 'archived';
  redemption_count?: number;
  tier?: GhostTier;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// Content API Types
// =============================================================================

/**
 * Configuration options for creating a Ghost Content API client.
 */
export interface GhostContentClientConfig {
  /**
   * The Ghost site URL (e.g., "https://yourblog.ghost.io")
   */
  url: string;

  /**
   * The Ghost Content API key (simple string token).
   */
  key: string;

  /**
   * API version to use. Defaults to "v5.0".
   */
  version?: string;
}

/**
 * Query parameters for Content API posts browse endpoint.
 */
export interface ContentPostsBrowseParams {
  /**
   * Related data to include: 'tags', 'authors' (comma-separated)
   */
  include?: string;

  /**
   * Specific fields to return (comma-separated)
   */
  fields?: string;

  /**
   * Content format: 'html', 'plaintext', 'mobiledoc' (comma-separated)
   */
  formats?: string;

  /**
   * NQL filter expression (e.g., 'tag:getting-started')
   */
  filter?: string;

  /**
   * Number of posts to return (default 15)
   */
  limit?: number | 'all';

  /**
   * Page number for pagination
   */
  page?: number;

  /**
   * Sort order (e.g., 'published_at DESC')
   */
  order?: string;
}

/**
 * Query parameters for Content API posts read endpoint.
 */
export interface ContentPostsReadParams {
  /**
   * Related data to include: 'tags', 'authors' (comma-separated)
   */
  include?: string;

  /**
   * Specific fields to return (comma-separated)
   */
  fields?: string;

  /**
   * Content format: 'html', 'plaintext', 'mobiledoc' (comma-separated)
   */
  formats?: string;
}

/**
 * Response from Content API posts endpoints.
 */
export interface ContentPostsResponse {
  posts: GhostPost[];
  meta?: GhostApiMeta;
}

/**
 * Response from Content API pages endpoints.
 */
export interface ContentPagesResponse {
  pages: GhostPage[];
  meta?: GhostApiMeta;
}

/**
 * Response from Content API tags endpoints.
 */
export interface ContentTagsResponse {
  tags: GhostTag[];
  meta?: GhostApiMeta;
}

/**
 * Response from Content API authors endpoints.
 */
export interface ContentAuthorsResponse {
  authors: GhostAuthor[];
  meta?: GhostApiMeta;
}

// =============================================================================
// Admin API Types
// =============================================================================

/**
 * Response from Admin API posts endpoints.
 */
export interface AdminPostsResponse {
  posts: GhostPost[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API pages endpoints.
 */
export interface AdminPagesResponse {
  pages: GhostPage[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API tags endpoints.
 */
export interface AdminTagsResponse {
  tags: GhostTag[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API members endpoints.
 */
export interface AdminMembersResponse {
  members: GhostMember[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API tiers endpoints.
 */
export interface AdminTiersResponse {
  tiers: GhostTier[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API newsletters endpoints.
 */
export interface AdminNewslettersResponse {
  newsletters: GhostNewsletter[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API offers endpoints.
 */
export interface AdminOffersResponse {
  offers: GhostOffer[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API webhooks endpoints.
 */
export interface AdminWebhooksResponse {
  webhooks: GhostWebhook[];
  meta?: GhostApiMeta;
}

/**
 * Ghost Invite resource.
 */
export interface GhostInvite {
  id: string;
  role_id: string;
  email: string;
  status?: 'pending' | 'sent';
  token?: string;
  expires?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response from Admin API users endpoints.
 */
export interface AdminUsersResponse {
  users: GhostAuthor[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API roles endpoints.
 */
export interface AdminRolesResponse {
  roles: GhostRole[];
  meta?: GhostApiMeta;
}

/**
 * Response from Admin API invites endpoints.
 */
export interface AdminInvitesResponse {
  invites: GhostInvite[];
  meta?: GhostApiMeta;
}

/**
 * Ghost Settings resource (returned from /settings/ endpoint).
 * Note: Settings endpoint returns an unwrapped object, not an array.
 */
export interface GhostSettings {
  title: string;
  description: string;
  logo: string | null;
  icon: string | null;
  accent_color: string | null;
  cover_image: string | null;
  facebook: string | null;
  twitter: string | null;
  lang: string;
  timezone: string;
  codeinjection_head: string | null;
  codeinjection_foot: string | null;
  navigation: Array<{ label: string; url: string }>;
  secondary_navigation: Array<{ label: string; url: string }>;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  twitter_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  members_support_address: string;
  url: string;
}

/**
 * Response from Admin API site endpoint.
 * Note: Site endpoint returns an unwrapped object, not an array.
 */
export interface AdminSiteResponse {
  site: GhostSite;
}

/**
 * Response from Admin API settings endpoint.
 * Note: Settings endpoint returns an unwrapped object, not an array.
 */
export interface AdminSettingsResponse {
  settings: GhostSettings;
}

/**
 * Response from Admin API images upload endpoint.
 */
export interface AdminImagesResponse {
  images: GhostImage[];
}

// =============================================================================
// Theme Types
// =============================================================================

/**
 * Ghost Theme template resource.
 */
export interface GhostThemeTemplate {
  filename: string;
  name: string;
  for: string[];
  slug: string | null;
}

/**
 * Ghost Theme resource.
 */
export interface GhostTheme {
  name: string;
  package: Record<string, unknown>;
  active: boolean;
  templates?: GhostThemeTemplate[];
}

/**
 * Response from Admin API themes endpoints.
 */
export interface AdminThemesResponse {
  themes: GhostTheme[];
}
