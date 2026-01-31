/**
 * Tests for Ghost Admin API Tags tools.
 */

import { GhostClient } from '../../../src/client/ghost-client.js';
import { GhostApiError } from '../../../src/client/errors.js';
import {
  AdminBrowseTagsInputSchema,
  AdminReadTagInputSchema,
  AdminCreateTagInputSchema,
  AdminUpdateTagInputSchema,
  AdminDeleteTagInputSchema,
} from '../../../src/tools/admin-tags/schemas.js';
import { executeAdminBrowseTags } from '../../../src/tools/admin-tags/browse-tags.js';
import { executeAdminReadTag } from '../../../src/tools/admin-tags/read-tag.js';
import { executeAdminCreateTag } from '../../../src/tools/admin-tags/create-tag.js';
import { executeAdminUpdateTag } from '../../../src/tools/admin-tags/update-tag.js';
import { executeAdminDeleteTag } from '../../../src/tools/admin-tags/delete-tag.js';

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

describe('AdminBrowseTagsInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({
      include: 'count.posts',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.posts');
    }
  });

  it('should accept filter for visibility', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({
      filter: 'visibility:public',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('visibility:public');
    }
  });

  it('should accept numeric limit', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({
      order: 'name ASC',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('name ASC');
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = AdminBrowseTagsInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AdminReadTagInputSchema', () => {
  it('should accept id parameter', () => {
    const result = AdminReadTagInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = AdminReadTagInputSchema.safeParse({ slug: 'my-tag' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('my-tag');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = AdminReadTagInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = AdminReadTagInputSchema.safeParse({
      id: '123',
      slug: 'my-tag',
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
    const result = AdminReadTagInputSchema.safeParse({
      id: '123',
      include: 'count.posts',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('count.posts');
    }
  });
});

describe('AdminCreateTagInputSchema', () => {
  it('should require name', () => {
    const result = AdminCreateTagInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept name only', () => {
    const result = AdminCreateTagInputSchema.safeParse({ name: 'My Tag' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Tag');
    }
  });

  it('should accept full tag data', () => {
    const result = AdminCreateTagInputSchema.safeParse({
      name: 'My Tag',
      slug: 'my-tag',
      description: 'A test tag',
      visibility: 'public',
      accent_color: '#ff0000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Tag');
      expect(result.data.visibility).toBe('public');
      expect(result.data.accent_color).toBe('#ff0000');
    }
  });

  it('should accept valid visibility values', () => {
    const visibilities = ['public', 'internal'] as const;
    for (const visibility of visibilities) {
      const result = AdminCreateTagInputSchema.safeParse({
        name: 'Test',
        visibility,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid visibility', () => {
    const result = AdminCreateTagInputSchema.safeParse({
      name: 'Test',
      visibility: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept nullable fields', () => {
    const result = AdminCreateTagInputSchema.safeParse({
      name: 'Test',
      description: null,
      feature_image: null,
      canonical_url: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it('should accept SEO fields', () => {
    const result = AdminCreateTagInputSchema.safeParse({
      name: 'Test',
      meta_title: 'SEO Title',
      meta_description: 'SEO Description',
      og_title: 'OG Title',
      og_description: 'OG Description',
      twitter_title: 'Twitter Title',
      twitter_description: 'Twitter Description',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta_title).toBe('SEO Title');
      expect(result.data.og_title).toBe('OG Title');
    }
  });
});

describe('AdminUpdateTagInputSchema', () => {
  it('should require id and updated_at', () => {
    const result = AdminUpdateTagInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('should accept id and updated_at', () => {
    const result = AdminUpdateTagInputSchema.safeParse({
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
    const result = AdminUpdateTagInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Tag',
      visibility: 'internal',
      accent_color: '#00ff00',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Updated Tag');
      expect(result.data.visibility).toBe('internal');
    }
  });
});

describe('AdminDeleteTagInputSchema', () => {
  it('should require id', () => {
    const result = AdminDeleteTagInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept id', () => {
    const result = AdminDeleteTagInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminBrowseTags', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      expect(url).toContain('/ghost/api/admin/tags/');
    });

    await executeAdminBrowseTags(client, {});
  });

  it('should pass filter parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('visibility:public');
    });

    await executeAdminBrowseTags(client, { filter: 'visibility:public' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('count.posts');
    });

    await executeAdminBrowseTags(client, { include: 'count.posts' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeAdminBrowseTags(client, { limit: 10 });
  });

  it('should return tags response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      tags: [{ id: '1', name: 'Test Tag', slug: 'test-tag', visibility: 'public' }],
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

    const result = await executeAdminBrowseTags(client, {});
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toBe('Test Tag');
    expect(result.tags[0].visibility).toBe('public');
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

    await expect(executeAdminBrowseTags(client, {})).rejects.toThrow(
      GhostApiError
    );
  });
});

describe('executeAdminReadTag', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [{ id: '123' }] } }, (url) => {
      expect(url).toContain('/tags/123/');
    });

    await executeAdminReadTag(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [{ slug: 'my-tag' }] } }, (url) => {
      expect(url).toContain('/tags/slug/my-tag/');
    });

    await executeAdminReadTag(client, { slug: 'my-tag' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tags: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('count.posts');
    });

    await executeAdminReadTag(client, { id: '123', include: 'count.posts' });
  });

  it('should return tag response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      tags: [
        {
          id: '123',
          name: 'Test Tag',
          slug: 'test-tag',
          visibility: 'public',
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadTag(client, { id: '123' });
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toBe('Test Tag');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Tag not found', type: 'NotFoundError' }] },
    });

    await expect(
      executeAdminReadTag(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminCreateTag', () => {
  it('should POST with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { tags: [{ id: '1', name: 'Test' }] } },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/tags/');
        const body = JSON.parse(options?.body as string);
        expect(body.tags).toHaveLength(1);
        expect(body.tags[0].name).toBe('Test');
      }
    );

    await executeAdminCreateTag(client, { name: 'Test' });
  });

  it('should include all provided fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { tags: [{ id: '1', name: 'Test', visibility: 'internal' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.tags[0].name).toBe('Test');
        expect(body.tags[0].visibility).toBe('internal');
        expect(body.tags[0].accent_color).toBe('#ff0000');
      }
    );

    await executeAdminCreateTag(client, {
      name: 'Test',
      visibility: 'internal',
      accent_color: '#ff0000',
    });
  });

  it('should return created tag', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        tags: [
          {
            id: '1',
            name: 'Test',
            slug: 'test',
            visibility: 'public',
          },
        ],
      },
    });

    const result = await executeAdminCreateTag(client, { name: 'Test' });
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].id).toBe('1');
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
      executeAdminCreateTag(client, { name: 'Test' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminUpdateTag', () => {
  it('should PUT with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { tags: [{ id: '123', name: 'Updated' }] } },
      (url, options) => {
        expect(options?.method).toBe('PUT');
        expect(url).toContain('/tags/123/');
        const body = JSON.parse(options?.body as string);
        expect(body.tags[0].updated_at).toBe('2024-01-15T10:00:00.000Z');
        expect(body.tags[0].name).toBe('Updated');
      }
    );

    await executeAdminUpdateTag(client, {
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
      { status: 200, body: { tags: [{ id: '123' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        // id should not be in the body, only in the URL
        expect(body.tags[0].id).toBeUndefined();
      }
    );

    await executeAdminUpdateTag(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
  });

  it('should return updated tag', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 200,
      body: {
        tags: [
          {
            id: '123',
            name: 'Updated Name',
            updated_at: '2024-01-15T11:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminUpdateTag(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Name',
    });
    expect(result.tags[0].name).toBe('Updated Name');
  });

  it('should throw GhostApiError on conflict', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 409,
      body: { errors: [{ message: 'Update conflict', type: 'UpdateCollisionError' }] },
    });

    await expect(
      executeAdminUpdateTag(client, {
        id: '123',
        updated_at: '2024-01-15T10:00:00.000Z',
      })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminDeleteTag', () => {
  it('should DELETE correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 }, (url, options) => {
      expect(options?.method).toBe('DELETE');
      expect(url).toContain('/tags/123/');
    });

    await executeAdminDeleteTag(client, { id: '123' });
  });

  it('should return success response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 });

    const result = await executeAdminDeleteTag(client, { id: '123' });
    expect(result.success).toBe(true);
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Tag not found' }] },
    });

    await expect(
      executeAdminDeleteTag(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});
