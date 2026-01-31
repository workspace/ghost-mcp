/**
 * Tests for Ghost Admin API Settings tools.
 */

import { GhostClient } from '../../client/ghost-client.js';
import { GhostApiError } from '../../client/errors.js';
import { AdminReadSettingsInputSchema } from './schemas.js';
import { executeAdminReadSettings } from './read-settings.js';

// Test Admin API key in "id:secret" format
const TEST_ADMIN_API_KEY =
  '6470e5adf7b2e800012f0001:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
const TEST_URL = 'https://example.ghost.io';

// Store original fetch
const originalFetch = globalThis.fetch;

// Mock fetch for testing
function mockFetch(
  response: {
    status: number;
    body?: unknown;
  },
  validator?: (url: string, options?: RequestInit) => void
): void {
  globalThis.fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (validator) {
        validator(url, init);
      }

      return new Response(
        response.body !== undefined ? JSON.stringify(response.body) : null,
        {
          status: response.status,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  );
}

// Restore fetch after each test
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// =============================================================================
// Schema Tests
// =============================================================================

describe('AdminReadSettingsInputSchema', () => {
  it('should accept empty object (no parameters)', () => {
    const result = AdminReadSettingsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should ignore extra parameters', () => {
    const result = AdminReadSettingsInputSchema.safeParse({
      include: 'anything',
      fields: 'something',
    });
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminReadSettings', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 200,
        body: {
          settings: {
            title: 'Test Site',
            description: 'A test Ghost site',
            logo: null,
            icon: null,
            accent_color: '#FF5733',
            cover_image: null,
            facebook: null,
            twitter: null,
            lang: 'en',
            timezone: 'UTC',
            codeinjection_head: null,
            codeinjection_foot: null,
            navigation: [],
            secondary_navigation: [],
            meta_title: null,
            meta_description: null,
            og_image: null,
            og_title: null,
            og_description: null,
            twitter_image: null,
            twitter_title: null,
            twitter_description: null,
            members_support_address: 'noreply@example.ghost.io',
            url: 'https://example.ghost.io',
          },
        },
      },
      (url) => {
        expect(url).toContain('/ghost/api/admin/settings/');
      }
    );

    await executeAdminReadSettings(client);
  });

  it('should return settings response with all fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      settings: {
        title: 'My Ghost Site',
        description: 'A publication for testing',
        logo: 'https://example.ghost.io/content/images/logo.png',
        icon: 'https://example.ghost.io/content/images/icon.png',
        accent_color: '#15171A',
        cover_image: 'https://example.ghost.io/content/images/cover.jpg',
        facebook: 'ghost',
        twitter: '@ghost',
        lang: 'en',
        timezone: 'America/New_York',
        codeinjection_head: '<script>console.log("head")</script>',
        codeinjection_foot: '<script>console.log("foot")</script>',
        navigation: [
          { label: 'Home', url: '/' },
          { label: 'About', url: '/about/' },
        ],
        secondary_navigation: [
          { label: 'Privacy', url: '/privacy/' },
        ],
        meta_title: 'My Ghost Site - Meta',
        meta_description: 'SEO description for the site',
        og_image: 'https://example.ghost.io/content/images/og.png',
        og_title: 'My Ghost Site - OG',
        og_description: 'Open Graph description',
        twitter_image: 'https://example.ghost.io/content/images/twitter.png',
        twitter_title: 'My Ghost Site - Twitter',
        twitter_description: 'Twitter card description',
        members_support_address: 'support@example.ghost.io',
        url: 'https://example.ghost.io',
      },
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadSettings(client);
    expect(result.settings).toBeDefined();
    expect(result.settings.title).toBe('My Ghost Site');
    expect(result.settings.description).toBe('A publication for testing');
    expect(result.settings.lang).toBe('en');
    expect(result.settings.timezone).toBe('America/New_York');
    expect(result.settings.navigation).toHaveLength(2);
    expect(result.settings.navigation[0].label).toBe('Home');
    expect(result.settings.secondary_navigation).toHaveLength(1);
    expect(result.settings.members_support_address).toBe('support@example.ghost.io');
  });

  it('should handle null optional fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      settings: {
        title: 'Minimal Site',
        description: '',
        logo: null,
        icon: null,
        accent_color: null,
        cover_image: null,
        facebook: null,
        twitter: null,
        lang: 'en',
        timezone: 'UTC',
        codeinjection_head: null,
        codeinjection_foot: null,
        navigation: [],
        secondary_navigation: [],
        meta_title: null,
        meta_description: null,
        og_image: null,
        og_title: null,
        og_description: null,
        twitter_image: null,
        twitter_title: null,
        twitter_description: null,
        members_support_address: 'noreply@example.ghost.io',
        url: 'https://example.ghost.io',
      },
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadSettings(client);
    expect(result.settings.title).toBe('Minimal Site');
    expect(result.settings.logo).toBeNull();
    expect(result.settings.accent_color).toBeNull();
    expect(result.settings.navigation).toEqual([]);
    expect(result.settings.codeinjection_head).toBeNull();
  });

  it('should throw GhostApiError on API failure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 401,
      body: { errors: [{ message: 'Invalid token' }] },
    });

    await expect(executeAdminReadSettings(client)).rejects.toThrow(GhostApiError);
  });

  it('should throw GhostApiError on 403 forbidden', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 403,
      body: { errors: [{ message: 'Permission denied' }] },
    });

    await expect(executeAdminReadSettings(client)).rejects.toThrow(GhostApiError);
  });
});
