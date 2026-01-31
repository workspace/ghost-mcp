/**
 * Tests for Ghost Admin API Newsletters tools.
 */

import { GhostClient } from '../../../src/client/ghost-client.js';
import { GhostApiError } from '../../../src/client/errors.js';
import {
  AdminBrowseNewslettersInputSchema,
  AdminReadNewsletterInputSchema,
  AdminCreateNewsletterInputSchema,
  AdminUpdateNewsletterInputSchema,
} from '../../../src/tools/admin-newsletters/schemas.js';
import { executeAdminBrowseNewsletters } from '../../../src/tools/admin-newsletters/browse-newsletters.js';
import { executeAdminReadNewsletter } from '../../../src/tools/admin-newsletters/read-newsletter.js';
import { executeAdminCreateNewsletter } from '../../../src/tools/admin-newsletters/create-newsletter.js';
import { executeAdminUpdateNewsletter } from '../../../src/tools/admin-newsletters/update-newsletter.js';

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

describe('AdminBrowseNewslettersInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({
      include: 'count.members',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.members');
    }
  });

  it('should accept filter for status', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({
      filter: 'status:active',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('status:active');
    }
  });

  it('should accept filter for visibility', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({
      filter: 'visibility:members',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('visibility:members');
    }
  });

  it('should accept numeric limit', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({
      order: 'sort_order ASC',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('sort_order ASC');
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = AdminBrowseNewslettersInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AdminReadNewsletterInputSchema', () => {
  it('should accept id parameter', () => {
    const result = AdminReadNewsletterInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = AdminReadNewsletterInputSchema.safeParse({
      slug: 'weekly-digest',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('weekly-digest');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = AdminReadNewsletterInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = AdminReadNewsletterInputSchema.safeParse({
      id: '123',
      slug: 'weekly-digest',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain(
        'Only one of id or slug should be provided'
      );
    }
  });

  it('should accept include parameter with id', () => {
    const result = AdminReadNewsletterInputSchema.safeParse({
      id: '123',
      include: 'count.members',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.members');
    }
  });
});

describe('AdminCreateNewsletterInputSchema', () => {
  it('should require name', () => {
    const result = AdminCreateNewsletterInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept name only', () => {
    const result = AdminCreateNewsletterInputSchema.safeParse({
      name: 'Weekly Digest',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Weekly Digest');
    }
  });

  it('should accept full newsletter data', () => {
    const result = AdminCreateNewsletterInputSchema.safeParse({
      name: 'Weekly Digest',
      slug: 'weekly-digest',
      description: 'A weekly roundup of our best content',
      status: 'active',
      visibility: 'members',
      sender_name: 'Newsletter Team',
      sender_email: 'news@example.com',
      sender_reply_to: 'newsletter',
      subscribe_on_signup: true,
      show_header_icon: true,
      show_header_title: true,
      show_feature_image: true,
      body_font_category: 'sans_serif',
      show_badge: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Weekly Digest');
      expect(result.data.status).toBe('active');
      expect(result.data.visibility).toBe('members');
      expect(result.data.show_badge).toBe(false);
    }
  });

  it('should accept valid status values', () => {
    const statuses = ['active', 'archived'] as const;
    for (const status of statuses) {
      const result = AdminCreateNewsletterInputSchema.safeParse({
        name: 'Test',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const result = AdminCreateNewsletterInputSchema.safeParse({
      name: 'Test',
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid visibility values', () => {
    const visibilities = ['members', 'paid'] as const;
    for (const visibility of visibilities) {
      const result = AdminCreateNewsletterInputSchema.safeParse({
        name: 'Test',
        visibility,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid visibility', () => {
    const result = AdminCreateNewsletterInputSchema.safeParse({
      name: 'Test',
      visibility: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid sender_reply_to values', () => {
    const replyTos = ['newsletter', 'support'] as const;
    for (const sender_reply_to of replyTos) {
      const result = AdminCreateNewsletterInputSchema.safeParse({
        name: 'Test',
        sender_reply_to,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept valid font category values', () => {
    const fonts = ['serif', 'sans_serif'] as const;
    for (const font of fonts) {
      const result = AdminCreateNewsletterInputSchema.safeParse({
        name: 'Test',
        title_font_category: font,
        body_font_category: font,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept valid title_alignment values', () => {
    const alignments = ['left', 'center'] as const;
    for (const title_alignment of alignments) {
      const result = AdminCreateNewsletterInputSchema.safeParse({
        name: 'Test',
        title_alignment,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept nullable fields', () => {
    const result = AdminCreateNewsletterInputSchema.safeParse({
      name: 'Test',
      description: null,
      sender_name: null,
      sender_email: null,
      header_image: null,
      footer_content: null,
      border_color: null,
      title_color: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
      expect(result.data.sender_name).toBeNull();
    }
  });

  it('should accept boolean display options', () => {
    const result = AdminCreateNewsletterInputSchema.safeParse({
      name: 'Test',
      show_header_icon: true,
      show_header_title: false,
      show_header_name: true,
      show_feature_image: true,
      show_badge: false,
      show_post_title_section: true,
      show_comment_cta: false,
      show_subscription_details: true,
      show_latest_posts: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('AdminUpdateNewsletterInputSchema', () => {
  it('should require id and updated_at', () => {
    const result = AdminUpdateNewsletterInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('should accept id and updated_at', () => {
    const result = AdminUpdateNewsletterInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
      expect(result.data.updated_at).toBe('2024-01-15T10:00:00.000Z');
    }
  });

  it('should accept all update fields', () => {
    const result = AdminUpdateNewsletterInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Newsletter',
      status: 'archived',
      visibility: 'paid',
      show_badge: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Updated Newsletter');
      expect(result.data.status).toBe('archived');
      expect(result.data.visibility).toBe('paid');
    }
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminBrowseNewsletters', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { newsletters: [], meta: {} } }, (url) => {
      expect(url).toContain('/ghost/api/admin/newsletters/');
    });

    await executeAdminBrowseNewsletters(client, {});
  });

  it('should pass filter parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { newsletters: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('status:active');
    });

    await executeAdminBrowseNewsletters(client, { filter: 'status:active' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { newsletters: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('count.members');
    });

    await executeAdminBrowseNewsletters(client, { include: 'count.members' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { newsletters: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeAdminBrowseNewsletters(client, { limit: 10 });
  });

  it('should return newsletters response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      newsletters: [
        {
          id: '1',
          name: 'Weekly Digest',
          slug: 'weekly-digest',
          status: 'active',
          visibility: 'members',
        },
      ],
      meta: {
        pagination: {
          page: 1,
          limit: 15,
          pages: 1,
          total: 1,
          next: null,
          prev: null,
        },
      },
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminBrowseNewsletters(client, {});
    expect(result.newsletters).toHaveLength(1);
    expect(result.newsletters[0].name).toBe('Weekly Digest');
    expect(result.newsletters[0].status).toBe('active');
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

    await expect(executeAdminBrowseNewsletters(client, {})).rejects.toThrow(
      GhostApiError
    );
  });
});

describe('executeAdminReadNewsletter', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { newsletters: [{ id: '123' }] } },
      (url) => {
        expect(url).toContain('/newsletters/123/');
      }
    );

    await executeAdminReadNewsletter(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { newsletters: [{ slug: 'weekly-digest' }] } },
      (url) => {
        expect(url).toContain('/newsletters/slug/weekly-digest/');
      }
    );

    await executeAdminReadNewsletter(client, { slug: 'weekly-digest' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { newsletters: [{ id: '123' }] } },
      (url) => {
        const parsed = new URL(url);
        expect(parsed.searchParams.get('include')).toBe('count.members');
      }
    );

    await executeAdminReadNewsletter(client, {
      id: '123',
      include: 'count.members',
    });
  });

  it('should return newsletter response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      newsletters: [
        {
          id: '123',
          name: 'Weekly Digest',
          slug: 'weekly-digest',
          status: 'active',
          visibility: 'members',
          sender_name: 'Newsletter Team',
          subscribe_on_signup: true,
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadNewsletter(client, { id: '123' });
    expect(result.newsletters).toHaveLength(1);
    expect(result.newsletters[0].name).toBe('Weekly Digest');
    expect(result.newsletters[0].subscribe_on_signup).toBe(true);
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: {
        errors: [{ message: 'Newsletter not found', type: 'NotFoundError' }],
      },
    });

    await expect(
      executeAdminReadNewsletter(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminCreateNewsletter', () => {
  it('should POST with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 201,
        body: { newsletters: [{ id: '1', name: 'Weekly Digest' }] },
      },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/newsletters/');
        const body = JSON.parse(options?.body as string);
        expect(body.newsletters).toHaveLength(1);
        expect(body.newsletters[0].name).toBe('Weekly Digest');
      }
    );

    await executeAdminCreateNewsletter(client, { name: 'Weekly Digest' });
  });

  it('should include all provided fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 201,
        body: {
          newsletters: [{ id: '1', name: 'Weekly Digest', status: 'active' }],
        },
      },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.newsletters[0].name).toBe('Weekly Digest');
        expect(body.newsletters[0].status).toBe('active');
        expect(body.newsletters[0].visibility).toBe('members');
        expect(body.newsletters[0].sender_name).toBe('Newsletter Team');
        expect(body.newsletters[0].show_badge).toBe(false);
      }
    );

    await executeAdminCreateNewsletter(client, {
      name: 'Weekly Digest',
      status: 'active',
      visibility: 'members',
      sender_name: 'Newsletter Team',
      show_badge: false,
    });
  });

  it('should return created newsletter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        newsletters: [
          {
            id: '1',
            name: 'Weekly Digest',
            slug: 'weekly-digest',
            status: 'active',
            visibility: 'members',
          },
        ],
      },
    });

    const result = await executeAdminCreateNewsletter(client, {
      name: 'Weekly Digest',
    });
    expect(result.newsletters).toHaveLength(1);
    expect(result.newsletters[0].id).toBe('1');
  });

  it('should throw GhostApiError on validation error', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 422,
      body: { errors: [{ message: 'Validation failed' }] },
    });

    await expect(
      executeAdminCreateNewsletter(client, { name: 'Test' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminUpdateNewsletter', () => {
  it('should PUT with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { newsletters: [{ id: '123', name: 'Updated' }] } },
      (url, options) => {
        expect(options?.method).toBe('PUT');
        expect(url).toContain('/newsletters/123/');
        const body = JSON.parse(options?.body as string);
        expect(body.newsletters[0].updated_at).toBe('2024-01-15T10:00:00.000Z');
        expect(body.newsletters[0].name).toBe('Updated');
      }
    );

    await executeAdminUpdateNewsletter(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated',
    });
  });

  it('should not include id in body', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { newsletters: [{ id: '123' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        // id should not be in the body, only in the URL
        expect(body.newsletters[0].id).toBeUndefined();
      }
    );

    await executeAdminUpdateNewsletter(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
  });

  it('should return updated newsletter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 200,
      body: {
        newsletters: [
          {
            id: '123',
            name: 'Updated Name',
            updated_at: '2024-01-15T11:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminUpdateNewsletter(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Name',
    });
    expect(result.newsletters[0].name).toBe('Updated Name');
  });

  it('should throw GhostApiError on conflict', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 409,
      body: {
        errors: [{ message: 'Update conflict', type: 'UpdateCollisionError' }],
      },
    });

    await expect(
      executeAdminUpdateNewsletter(client, {
        id: '123',
        updated_at: '2024-01-15T10:00:00.000Z',
      })
    ).rejects.toThrow(GhostApiError);
  });
});
