/**
 * Tests for Ghost Admin API Pages tools.
 */

import { GhostClient } from '../../../src/client/ghost-client.js';
import { GhostApiError } from '../../../src/client/errors.js';
import {
  AdminBrowsePagesInputSchema,
  AdminReadPageInputSchema,
  AdminCreatePageInputSchema,
  AdminUpdatePageInputSchema,
  AdminDeletePageInputSchema,
  AdminCopyPageInputSchema,
} from '../../../src/tools/admin-pages/schemas.js';
import { executeAdminBrowsePages } from '../../../src/tools/admin-pages/browse-pages.js';
import { executeAdminReadPage } from '../../../src/tools/admin-pages/read-page.js';
import { executeAdminCreatePage } from '../../../src/tools/admin-pages/create-page.js';
import { executeAdminUpdatePage } from '../../../src/tools/admin-pages/update-page.js';
import { executeAdminDeletePage } from '../../../src/tools/admin-pages/delete-page.js';
import { executeAdminCopyPage } from '../../../src/tools/admin-pages/copy-page.js';

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

describe('AdminBrowsePagesInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({
      include: 'tags,authors',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept filter for drafts', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({
      filter: 'status:draft',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('status:draft');
    }
  });

  it('should accept formats parameter', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({
      formats: 'html,lexical',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,lexical');
    }
  });

  it('should accept numeric limit', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({
      order: 'title ASC',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('title ASC');
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = AdminBrowsePagesInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AdminReadPageInputSchema', () => {
  it('should accept id parameter', () => {
    const result = AdminReadPageInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = AdminReadPageInputSchema.safeParse({ slug: 'my-page' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('my-page');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = AdminReadPageInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = AdminReadPageInputSchema.safeParse({
      id: '123',
      slug: 'my-page',
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
    const result = AdminReadPageInputSchema.safeParse({
      id: '123',
      include: 'tags,authors',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept formats parameter', () => {
    const result = AdminReadPageInputSchema.safeParse({
      id: '123',
      formats: 'html,lexical',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,lexical');
    }
  });
});

describe('AdminCreatePageInputSchema', () => {
  it('should require title', () => {
    const result = AdminCreatePageInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept title only', () => {
    const result = AdminCreatePageInputSchema.safeParse({ title: 'My Page' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Page');
    }
  });

  it('should accept full page data', () => {
    const result = AdminCreatePageInputSchema.safeParse({
      title: 'My Page',
      slug: 'my-page',
      status: 'draft',
      visibility: 'public',
      featured: true,
      tags: [{ name: 'Info' }],
      authors: [{ email: 'author@example.com' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Page');
      expect(result.data.status).toBe('draft');
      expect(result.data.tags).toHaveLength(1);
      expect(result.data.authors).toHaveLength(1);
    }
  });

  it('should accept valid status values', () => {
    const statuses = ['published', 'draft', 'scheduled'] as const;
    for (const status of statuses) {
      const result = AdminCreatePageInputSchema.safeParse({
        title: 'Test',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const result = AdminCreatePageInputSchema.safeParse({
      title: 'Test',
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should reject sent status (pages do not support sent)', () => {
    const result = AdminCreatePageInputSchema.safeParse({
      title: 'Test',
      status: 'sent',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid visibility values', () => {
    const visibilities = ['public', 'members', 'paid', 'tiers'] as const;
    for (const visibility of visibilities) {
      const result = AdminCreatePageInputSchema.safeParse({
        title: 'Test',
        visibility,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept nullable fields', () => {
    const result = AdminCreatePageInputSchema.safeParse({
      title: 'Test',
      feature_image: null,
      custom_excerpt: null,
      canonical_url: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.feature_image).toBeNull();
    }
  });

  it('should validate tag references', () => {
    // Tag with at least one identifier should pass
    const validResult = AdminCreatePageInputSchema.safeParse({
      title: 'Test',
      tags: [{ id: '123' }],
    });
    expect(validResult.success).toBe(true);

    // Tag with no identifiers should fail
    const invalidResult = AdminCreatePageInputSchema.safeParse({
      title: 'Test',
      tags: [{}],
    });
    expect(invalidResult.success).toBe(false);
  });

  it('should validate author references', () => {
    // Author with at least one identifier should pass
    const validResult = AdminCreatePageInputSchema.safeParse({
      title: 'Test',
      authors: [{ email: 'test@example.com' }],
    });
    expect(validResult.success).toBe(true);

    // Author with no identifiers should fail
    const invalidResult = AdminCreatePageInputSchema.safeParse({
      title: 'Test',
      authors: [{}],
    });
    expect(invalidResult.success).toBe(false);
  });
});

describe('AdminUpdatePageInputSchema', () => {
  it('should require id and updated_at', () => {
    const result = AdminUpdatePageInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('should accept id and updated_at', () => {
    const result = AdminUpdatePageInputSchema.safeParse({
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
    const result = AdminUpdatePageInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      title: 'Updated Title',
      status: 'published',
      tags: [{ name: 'Updated' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Updated Title');
    }
  });
});

describe('AdminDeletePageInputSchema', () => {
  it('should require id', () => {
    const result = AdminDeletePageInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept id', () => {
    const result = AdminDeletePageInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });
});

describe('AdminCopyPageInputSchema', () => {
  it('should require id', () => {
    const result = AdminCopyPageInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept id', () => {
    const result = AdminCopyPageInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminBrowsePages', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      expect(url).toContain('/ghost/api/admin/pages/');
    });

    await executeAdminBrowsePages(client, {});
  });

  it('should pass filter parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('status:draft');
    });

    await executeAdminBrowsePages(client, { filter: 'status:draft' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeAdminBrowsePages(client, { include: 'tags,authors' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeAdminBrowsePages(client, { limit: 10 });
  });

  it('should return pages response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      pages: [{ id: '1', title: 'Test Page', slug: 'test-page', status: 'draft' }],
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

    const result = await executeAdminBrowsePages(client, {});
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('Test Page');
    expect(result.pages[0].status).toBe('draft');
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

    await expect(executeAdminBrowsePages(client, {})).rejects.toThrow(
      GhostApiError
    );
  });
});

describe('executeAdminReadPage', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ id: '123' }] } }, (url) => {
      expect(url).toContain('/pages/123/');
    });

    await executeAdminReadPage(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ slug: 'my-page' }] } }, (url) => {
      expect(url).toContain('/pages/slug/my-page/');
    });

    await executeAdminReadPage(client, { slug: 'my-page' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { pages: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeAdminReadPage(client, { id: '123', include: 'tags,authors' });
  });

  it('should return page response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      pages: [
        {
          id: '123',
          title: 'Test Page',
          slug: 'test-page',
          status: 'draft',
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadPage(client, { id: '123' });
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('Test Page');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Page not found', type: 'NotFoundError' }] },
    });

    await expect(
      executeAdminReadPage(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminCreatePage', () => {
  it('should POST with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { pages: [{ id: '1', title: 'Test' }] } },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/pages/');
        const body = JSON.parse(options?.body as string);
        expect(body.pages).toHaveLength(1);
        expect(body.pages[0].title).toBe('Test');
      }
    );

    await executeAdminCreatePage(client, { title: 'Test' });
  });

  it('should include all provided fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { pages: [{ id: '1', title: 'Test', status: 'published' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.pages[0].title).toBe('Test');
        expect(body.pages[0].status).toBe('published');
        expect(body.pages[0].featured).toBe(true);
      }
    );

    await executeAdminCreatePage(client, {
      title: 'Test',
      status: 'published',
      featured: true,
    });
  });

  it('should return created page', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        pages: [
          {
            id: '1',
            title: 'Test',
            slug: 'test',
            status: 'draft',
          },
        ],
      },
    });

    const result = await executeAdminCreatePage(client, { title: 'Test' });
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].id).toBe('1');
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
      executeAdminCreatePage(client, { title: 'Test' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminUpdatePage', () => {
  it('should PUT with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { pages: [{ id: '123', title: 'Updated' }] } },
      (url, options) => {
        expect(options?.method).toBe('PUT');
        expect(url).toContain('/pages/123/');
        const body = JSON.parse(options?.body as string);
        expect(body.pages[0].updated_at).toBe('2024-01-15T10:00:00.000Z');
        expect(body.pages[0].title).toBe('Updated');
      }
    );

    await executeAdminUpdatePage(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      title: 'Updated',
    });
  });

  it('should not include id in body', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { pages: [{ id: '123' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        // id should not be in the body, only in the URL
        expect(body.pages[0].id).toBeUndefined();
      }
    );

    await executeAdminUpdatePage(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
  });

  it('should return updated page', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 200,
      body: {
        pages: [
          {
            id: '123',
            title: 'Updated Title',
            updated_at: '2024-01-15T11:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminUpdatePage(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      title: 'Updated Title',
    });
    expect(result.pages[0].title).toBe('Updated Title');
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
      executeAdminUpdatePage(client, {
        id: '123',
        updated_at: '2024-01-15T10:00:00.000Z',
      })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminDeletePage', () => {
  it('should DELETE correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 }, (url, options) => {
      expect(options?.method).toBe('DELETE');
      expect(url).toContain('/pages/123/');
    });

    await executeAdminDeletePage(client, { id: '123' });
  });

  it('should return success response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 });

    const result = await executeAdminDeletePage(client, { id: '123' });
    expect(result.success).toBe(true);
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Page not found' }] },
    });

    await expect(
      executeAdminDeletePage(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminCopyPage', () => {
  it('should POST to copy endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { pages: [{ id: '456', title: 'Test (Copy)' }] } },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/pages/123/copy/');
      }
    );

    await executeAdminCopyPage(client, { id: '123' });
  });

  it('should return copied page', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        pages: [
          {
            id: '456',
            title: 'Original Title (Copy)',
            slug: 'original-title-copy',
            status: 'draft',
          },
        ],
      },
    });

    const result = await executeAdminCopyPage(client, { id: '123' });
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].id).toBe('456');
    expect(result.pages[0].title).toBe('Original Title (Copy)');
    expect(result.pages[0].status).toBe('draft');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Page not found' }] },
    });

    await expect(
      executeAdminCopyPage(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});
