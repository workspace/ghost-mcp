/**
 * Tests for Ghost Admin API Tiers tools.
 */

import { GhostClient } from '../../client/ghost-client.js';
import { GhostApiError } from '../../client/errors.js';
import {
  AdminBrowseTiersInputSchema,
  AdminReadTierInputSchema,
  AdminCreateTierInputSchema,
  AdminUpdateTierInputSchema,
} from './schemas.js';
import { executeAdminBrowseTiers } from './browse-tiers.js';
import { executeAdminReadTier } from './read-tier.js';
import { executeAdminCreateTier } from './create-tier.js';
import { executeAdminUpdateTier } from './update-tier.js';

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

describe('AdminBrowseTiersInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept include parameter', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({
      include: 'monthly_price,yearly_price,benefits',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('monthly_price,yearly_price,benefits');
    }
  });

  it('should accept filter for type', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({
      filter: 'type:paid',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('type:paid');
    }
  });

  it('should accept filter for visibility', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({
      filter: 'visibility:public',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('visibility:public');
    }
  });

  it('should accept filter for active', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({
      filter: 'active:true',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('active:true');
    }
  });

  it('should accept numeric limit', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({
      order: 'name ASC',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('name ASC');
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = AdminBrowseTiersInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AdminReadTierInputSchema', () => {
  it('should accept id parameter', () => {
    const result = AdminReadTierInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept slug parameter', () => {
    const result = AdminReadTierInputSchema.safeParse({ slug: 'premium' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('premium');
    }
  });

  it('should reject if neither id nor slug provided', () => {
    const result = AdminReadTierInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      expect(errorMessage).toContain('Either id or slug must be provided');
    }
  });

  it('should reject if both id and slug provided', () => {
    const result = AdminReadTierInputSchema.safeParse({
      id: '123',
      slug: 'premium',
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
    const result = AdminReadTierInputSchema.safeParse({
      id: '123',
      include: 'benefits',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('benefits');
    }
  });
});

describe('AdminCreateTierInputSchema', () => {
  it('should require name', () => {
    const result = AdminCreateTierInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept name only', () => {
    const result = AdminCreateTierInputSchema.safeParse({ name: 'Premium' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Premium');
    }
  });

  it('should accept full tier data', () => {
    const result = AdminCreateTierInputSchema.safeParse({
      name: 'Premium',
      slug: 'premium',
      description: 'Premium membership tier',
      type: 'paid',
      visibility: 'public',
      monthly_price: 999,
      yearly_price: 9999,
      currency: 'usd',
      benefits: ['Benefit 1', 'Benefit 2'],
      trial_days: 14,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Premium');
      expect(result.data.type).toBe('paid');
      expect(result.data.monthly_price).toBe(999);
      expect(result.data.benefits).toEqual(['Benefit 1', 'Benefit 2']);
    }
  });

  it('should accept valid type values', () => {
    const types = ['free', 'paid'] as const;
    for (const type of types) {
      const result = AdminCreateTierInputSchema.safeParse({
        name: 'Test',
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid type', () => {
    const result = AdminCreateTierInputSchema.safeParse({
      name: 'Test',
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid visibility values', () => {
    const visibilities = ['public', 'none'] as const;
    for (const visibility of visibilities) {
      const result = AdminCreateTierInputSchema.safeParse({
        name: 'Test',
        visibility,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid visibility', () => {
    const result = AdminCreateTierInputSchema.safeParse({
      name: 'Test',
      visibility: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept nullable fields', () => {
    const result = AdminCreateTierInputSchema.safeParse({
      name: 'Test',
      description: null,
      welcome_page_url: null,
      monthly_price: null,
      yearly_price: null,
      currency: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
      expect(result.data.monthly_price).toBeNull();
    }
  });

  it('should accept benefits array', () => {
    const result = AdminCreateTierInputSchema.safeParse({
      name: 'Test',
      benefits: ['Access to all posts', 'Early access', 'Exclusive content'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.benefits).toHaveLength(3);
      expect(result.data.benefits?.[0]).toBe('Access to all posts');
    }
  });

  it('should reject negative prices', () => {
    const result = AdminCreateTierInputSchema.safeParse({
      name: 'Test',
      monthly_price: -100,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative trial_days', () => {
    const result = AdminCreateTierInputSchema.safeParse({
      name: 'Test',
      trial_days: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe('AdminUpdateTierInputSchema', () => {
  it('should require id and updated_at', () => {
    const result = AdminUpdateTierInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('should accept id and updated_at', () => {
    const result = AdminUpdateTierInputSchema.safeParse({
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
    const result = AdminUpdateTierInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Tier',
      visibility: 'none',
      monthly_price: 1299,
      benefits: ['New benefit'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Updated Tier');
      expect(result.data.visibility).toBe('none');
      expect(result.data.monthly_price).toBe(1299);
    }
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminBrowseTiers', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tiers: [], meta: {} } }, (url) => {
      expect(url).toContain('/ghost/api/admin/tiers/');
    });

    await executeAdminBrowseTiers(client, {});
  });

  it('should pass filter parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tiers: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('type:paid');
    });

    await executeAdminBrowseTiers(client, { filter: 'type:paid' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tiers: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('benefits');
    });

    await executeAdminBrowseTiers(client, { include: 'benefits' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tiers: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeAdminBrowseTiers(client, { limit: 10 });
  });

  it('should return tiers response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      tiers: [
        {
          id: '1',
          name: 'Premium',
          slug: 'premium',
          type: 'paid',
          visibility: 'public',
          active: true,
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

    const result = await executeAdminBrowseTiers(client, {});
    expect(result.tiers).toHaveLength(1);
    expect(result.tiers[0].name).toBe('Premium');
    expect(result.tiers[0].type).toBe('paid');
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

    await expect(executeAdminBrowseTiers(client, {})).rejects.toThrow(
      GhostApiError
    );
  });
});

describe('executeAdminReadTier', () => {
  it('should call client.get with id endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tiers: [{ id: '123' }] } }, (url) => {
      expect(url).toContain('/tiers/123/');
    });

    await executeAdminReadTier(client, { id: '123' });
  });

  it('should call client.get with slug endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tiers: [{ slug: 'premium' }] } }, (url) => {
      expect(url).toContain('/tiers/slug/premium/');
    });

    await executeAdminReadTier(client, { slug: 'premium' });
  });

  it('should pass include parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { tiers: [{ id: '123' }] } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('include')).toBe('benefits');
    });

    await executeAdminReadTier(client, { id: '123', include: 'benefits' });
  });

  it('should return tier response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      tiers: [
        {
          id: '123',
          name: 'Premium',
          slug: 'premium',
          type: 'paid',
          visibility: 'public',
          monthly_price: 999,
          yearly_price: 9999,
          currency: 'usd',
          benefits: ['Benefit 1', 'Benefit 2'],
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadTier(client, { id: '123' });
    expect(result.tiers).toHaveLength(1);
    expect(result.tiers[0].name).toBe('Premium');
    expect(result.tiers[0].benefits).toHaveLength(2);
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Tier not found', type: 'NotFoundError' }] },
    });

    await expect(
      executeAdminReadTier(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminCreateTier', () => {
  it('should POST with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { tiers: [{ id: '1', name: 'Premium' }] } },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/tiers/');
        const body = JSON.parse(options?.body as string);
        expect(body.tiers).toHaveLength(1);
        expect(body.tiers[0].name).toBe('Premium');
      }
    );

    await executeAdminCreateTier(client, { name: 'Premium' });
  });

  it('should include all provided fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 201,
        body: { tiers: [{ id: '1', name: 'Premium', type: 'paid' }] },
      },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.tiers[0].name).toBe('Premium');
        expect(body.tiers[0].type).toBe('paid');
        expect(body.tiers[0].monthly_price).toBe(999);
        expect(body.tiers[0].currency).toBe('usd');
        expect(body.tiers[0].benefits).toEqual(['Benefit 1']);
      }
    );

    await executeAdminCreateTier(client, {
      name: 'Premium',
      type: 'paid',
      monthly_price: 999,
      currency: 'usd',
      benefits: ['Benefit 1'],
    });
  });

  it('should return created tier', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        tiers: [
          {
            id: '1',
            name: 'Premium',
            slug: 'premium',
            type: 'paid',
            visibility: 'public',
          },
        ],
      },
    });

    const result = await executeAdminCreateTier(client, { name: 'Premium' });
    expect(result.tiers).toHaveLength(1);
    expect(result.tiers[0].id).toBe('1');
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
      executeAdminCreateTier(client, { name: 'Test' })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminUpdateTier', () => {
  it('should PUT with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { tiers: [{ id: '123', name: 'Updated' }] } },
      (url, options) => {
        expect(options?.method).toBe('PUT');
        expect(url).toContain('/tiers/123/');
        const body = JSON.parse(options?.body as string);
        expect(body.tiers[0].updated_at).toBe('2024-01-15T10:00:00.000Z');
        expect(body.tiers[0].name).toBe('Updated');
      }
    );

    await executeAdminUpdateTier(client, {
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
      { status: 200, body: { tiers: [{ id: '123' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        // id should not be in the body, only in the URL
        expect(body.tiers[0].id).toBeUndefined();
      }
    );

    await executeAdminUpdateTier(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
  });

  it('should return updated tier', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 200,
      body: {
        tiers: [
          {
            id: '123',
            name: 'Updated Name',
            updated_at: '2024-01-15T11:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminUpdateTier(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Name',
    });
    expect(result.tiers[0].name).toBe('Updated Name');
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
      executeAdminUpdateTier(client, {
        id: '123',
        updated_at: '2024-01-15T10:00:00.000Z',
      })
    ).rejects.toThrow(GhostApiError);
  });
});
