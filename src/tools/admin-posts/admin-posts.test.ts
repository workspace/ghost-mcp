/**
 * Tests for Ghost Admin API Posts tools.
 */

import { GhostClient } from '../../client/ghost-client.js';
import { GhostApiError } from '../../client/errors.js';
import {
  AdminBrowsePostsInputSchema,
  AdminReadPostInputSchema,
  AdminCreatePostInputSchema,
  AdminUpdatePostInputSchema,
  AdminDeletePostInputSchema,
  AdminCopyPostInputSchema,
} from './schemas.js';
import { executeAdminBrowsePosts } from './browse-posts.js';
import { executeAdminReadPost } from './read-post.js';
import { executeAdminCreatePost } from './create-post.js';
import { executeAdminUpdatePost } from './update-post.js';
import { executeAdminDeletePost } from './delete-post.js';
import { executeAdminCopyPost } from './copy-post.js';

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

describe('AdminBrowsePostsInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({
      include: 'tags,authors',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept filter for drafts', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({
      filter: 'status:draft',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('status:draft');
    }
  });

  it('should accept formats parameter', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({
      formats: 'html,lexical',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,lexical');
    }
  });

  it('should accept numeric limit', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({
      order: 'published_at DESC',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('published_at DESC');
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = AdminBrowsePostsInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AdminReadPostInputSchema', () => {
  it('should accept id parameter', () => {
    const result = AdminReadPostInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = AdminReadPostInputSchema.safeParse({ slug: 'my-post' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('my-post');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = AdminReadPostInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = AdminReadPostInputSchema.safeParse({
      id: '123',
      slug: 'my-post',
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
    const result = AdminReadPostInputSchema.safeParse({
      id: '123',
      include: 'tags,authors',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('tags,authors');
    }
  });

  it('should accept formats parameter', () => {
    const result = AdminReadPostInputSchema.safeParse({
      id: '123',
      formats: 'html,lexical',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formats).toBe('html,lexical');
    }
  });
});

describe('AdminCreatePostInputSchema', () => {
  it('should require title', () => {
    const result = AdminCreatePostInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept title only', () => {
    const result = AdminCreatePostInputSchema.safeParse({ title: 'My Post' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Post');
    }
  });

  it('should accept full post data', () => {
    const result = AdminCreatePostInputSchema.safeParse({
      title: 'My Post',
      slug: 'my-post',
      status: 'draft',
      visibility: 'public',
      featured: true,
      tags: [{ name: 'News' }],
      authors: [{ email: 'author@example.com' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Post');
      expect(result.data.status).toBe('draft');
      expect(result.data.tags).toHaveLength(1);
      expect(result.data.authors).toHaveLength(1);
    }
  });

  it('should accept valid status values', () => {
    const statuses = ['published', 'draft', 'scheduled', 'sent'] as const;
    for (const status of statuses) {
      const result = AdminCreatePostInputSchema.safeParse({
        title: 'Test',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const result = AdminCreatePostInputSchema.safeParse({
      title: 'Test',
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid visibility values', () => {
    const visibilities = ['public', 'members', 'paid', 'tiers'] as const;
    for (const visibility of visibilities) {
      const result = AdminCreatePostInputSchema.safeParse({
        title: 'Test',
        visibility,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept nullable fields', () => {
    const result = AdminCreatePostInputSchema.safeParse({
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
    const validResult = AdminCreatePostInputSchema.safeParse({
      title: 'Test',
      tags: [{ id: '123' }],
    });
    expect(validResult.success).toBe(true);

    // Tag with no identifiers should fail
    const invalidResult = AdminCreatePostInputSchema.safeParse({
      title: 'Test',
      tags: [{}],
    });
    expect(invalidResult.success).toBe(false);
  });

  it('should validate author references', () => {
    // Author with at least one identifier should pass
    const validResult = AdminCreatePostInputSchema.safeParse({
      title: 'Test',
      authors: [{ email: 'test@example.com' }],
    });
    expect(validResult.success).toBe(true);

    // Author with no identifiers should fail
    const invalidResult = AdminCreatePostInputSchema.safeParse({
      title: 'Test',
      authors: [{}],
    });
    expect(invalidResult.success).toBe(false);
  });
});

describe('AdminUpdatePostInputSchema', () => {
  it('should require id and updated_at', () => {
    const result = AdminUpdatePostInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('should accept id and updated_at', () => {
    const result = AdminUpdatePostInputSchema.safeParse({
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
    const result = AdminUpdatePostInputSchema.safeParse({
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

describe('AdminDeletePostInputSchema', () => {
  it('should require id', () => {
    const result = AdminDeletePostInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept id', () => {
    const result = AdminDeletePostInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });
});

describe('AdminCopyPostInputSchema', () => {
  it('should require id', () => {
    const result = AdminCopyPostInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept id', () => {
    const result = AdminCopyPostInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminBrowsePosts', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      expect(url).toContain('/ghost/api/admin/posts/');
    });

    await executeAdminBrowsePosts(client, {});
  });

  it('should pass filter parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('status:draft');
    });

    await executeAdminBrowsePosts(client, { filter: 'status:draft' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeAdminBrowsePosts(client, { include: 'tags,authors' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeAdminBrowsePosts(client, { limit: 10 });
  });

  it('should return posts response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      posts: [{ id: '1', title: 'Test Post', slug: 'test-post', status: 'draft' }],
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

    const result = await executeAdminBrowsePosts(client, {});
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].title).toBe('Test Post');
    expect(result.posts[0].status).toBe('draft');
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

    await expect(executeAdminBrowsePosts(client, {})).rejects.toThrow(
      GhostApiError
    );
  });
});

describe('executeAdminReadPost', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ id: '123' }] } }, (url) => {
      expect(url).toContain('/posts/123/');
    });

    await executeAdminReadPost(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ slug: 'my-post' }] } }, (url) => {
      expect(url).toContain('/posts/slug/my-post/');
    });

    await executeAdminReadPost(client, { slug: 'my-post' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { posts: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('tags,authors');
    });

    await executeAdminReadPost(client, { id: '123', include: 'tags,authors' });
  });

  it('should return post response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      posts: [
        {
          id: '123',
          title: 'Test Post',
          slug: 'test-post',
          status: 'draft',
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadPost(client, { id: '123' });
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].title).toBe('Test Post');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Post not found', type: 'NotFoundError' }] },
    });

    await expect(
      executeAdminReadPost(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminCreatePost', () => {
  it('should POST with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { posts: [{ id: '1', title: 'Test' }] } },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/posts/');
        const body = JSON.parse(options?.body as string);
        expect(body.posts).toHaveLength(1);
        expect(body.posts[0].title).toBe('Test');
      }
    );

    await executeAdminCreatePost(client, { title: 'Test' });
  });

  it('should include all provided fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { posts: [{ id: '1', title: 'Test', status: 'published' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.posts[0].title).toBe('Test');
        expect(body.posts[0].status).toBe('published');
        expect(body.posts[0].featured).toBe(true);
      }
    );

    await executeAdminCreatePost(client, {
      title: 'Test',
      status: 'published',
      featured: true,
    });
  });

  it('should return created post', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        posts: [
          {
            id: '1',
            title: 'Test',
            slug: 'test',
            status: 'draft',
          },
        ],
      },
    });

    const result = await executeAdminCreatePost(client, { title: 'Test' });
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].id).toBe('1');
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
      executeAdminCreatePost(client, { title: 'Test' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminUpdatePost', () => {
  it('should PUT with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { posts: [{ id: '123', title: 'Updated' }] } },
      (url, options) => {
        expect(options?.method).toBe('PUT');
        expect(url).toContain('/posts/123/');
        const body = JSON.parse(options?.body as string);
        expect(body.posts[0].updated_at).toBe('2024-01-15T10:00:00.000Z');
        expect(body.posts[0].title).toBe('Updated');
      }
    );

    await executeAdminUpdatePost(client, {
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
      { status: 200, body: { posts: [{ id: '123' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        // id should not be in the body, only in the URL
        expect(body.posts[0].id).toBeUndefined();
      }
    );

    await executeAdminUpdatePost(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
  });

  it('should return updated post', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 200,
      body: {
        posts: [
          {
            id: '123',
            title: 'Updated Title',
            updated_at: '2024-01-15T11:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminUpdatePost(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      title: 'Updated Title',
    });
    expect(result.posts[0].title).toBe('Updated Title');
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
      executeAdminUpdatePost(client, {
        id: '123',
        updated_at: '2024-01-15T10:00:00.000Z',
      })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminDeletePost', () => {
  it('should DELETE correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 }, (url, options) => {
      expect(options?.method).toBe('DELETE');
      expect(url).toContain('/posts/123/');
    });

    await executeAdminDeletePost(client, { id: '123' });
  });

  it('should return success response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 });

    const result = await executeAdminDeletePost(client, { id: '123' });
    expect(result.success).toBe(true);
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Post not found' }] },
    });

    await expect(
      executeAdminDeletePost(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminCopyPost', () => {
  it('should POST to copy endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { posts: [{ id: '456', title: 'Test (Copy)' }] } },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/posts/123/copy/');
      }
    );

    await executeAdminCopyPost(client, { id: '123' });
  });

  it('should return copied post', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        posts: [
          {
            id: '456',
            title: 'Original Title (Copy)',
            slug: 'original-title-copy',
            status: 'draft',
          },
        ],
      },
    });

    const result = await executeAdminCopyPost(client, { id: '123' });
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].id).toBe('456');
    expect(result.posts[0].title).toBe('Original Title (Copy)');
    expect(result.posts[0].status).toBe('draft');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Post not found' }] },
    });

    await expect(
      executeAdminCopyPost(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});
