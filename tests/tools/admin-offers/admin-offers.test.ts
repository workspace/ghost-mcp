/**
 * Tests for Ghost Admin API Offers tools.
 */

import { GhostClient } from '../../../src/client/ghost-client.js';
import { GhostApiError } from '../../../src/client/errors.js';
import {
  AdminBrowseOffersInputSchema,
  AdminCreateOfferInputSchema,
  AdminUpdateOfferInputSchema,
} from '../../../src/tools/admin-offers/schemas.js';
import { executeAdminBrowseOffers } from '../../../src/tools/admin-offers/browse-offers.js';
import { executeAdminCreateOffer } from '../../../src/tools/admin-offers/create-offer.js';
import { executeAdminUpdateOffer } from '../../../src/tools/admin-offers/update-offer.js';

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

describe('AdminBrowseOffersInputSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept filter for status', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({
      filter: 'status:active',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('status:active');
    }
  });

  it('should accept filter for cadence', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({
      filter: 'cadence:month',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('cadence:month');
    }
  });

  it('should accept numeric limit', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept "all" as limit', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({ limit: 'all' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe('all');
    }
  });

  it('should accept page parameter', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({ page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it('should accept order parameter', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({
      order: 'created_at DESC',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('created_at DESC');
    }
  });

  it('should reject invalid limit (negative)', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid page (zero)', () => {
    const result = AdminBrowseOffersInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AdminCreateOfferInputSchema', () => {
  it('should require all mandatory fields', () => {
    const result = AdminCreateOfferInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept minimal percent offer', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Black Friday',
      code: 'bf2024',
      tier: 'tier-123',
      cadence: 'year',
      type: 'percent',
      amount: 20,
      duration: 'once',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Black Friday');
      expect(result.data.type).toBe('percent');
      expect(result.data.amount).toBe(20);
    }
  });

  it('should accept fixed offer with currency', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: '$5 Off',
      code: 'fiveoff',
      tier: 'tier-123',
      cadence: 'month',
      type: 'fixed',
      amount: 500,
      duration: 'forever',
      currency: 'usd',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('fixed');
      expect(result.data.amount).toBe(500);
      expect(result.data.currency).toBe('usd');
    }
  });

  it('should accept trial offer', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Free Trial',
      code: 'trial7',
      tier: 'tier-123',
      cadence: 'month',
      type: 'trial',
      amount: 7,
      duration: 'trial',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('trial');
      expect(result.data.duration).toBe('trial');
    }
  });

  it('should accept repeating duration with duration_in_months', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: '3 Month Deal',
      code: '3month',
      tier: 'tier-123',
      cadence: 'month',
      type: 'percent',
      amount: 50,
      duration: 'repeating',
      duration_in_months: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe('repeating');
      expect(result.data.duration_in_months).toBe(3);
    }
  });

  it('should accept optional display fields', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Spring Sale',
      code: 'spring',
      tier: 'tier-123',
      cadence: 'year',
      type: 'percent',
      amount: 25,
      duration: 'once',
      display_title: 'Spring Sale - 25% Off!',
      display_description: 'Limited time offer for spring subscribers',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_title).toBe('Spring Sale - 25% Off!');
      expect(result.data.display_description).toBe(
        'Limited time offer for spring subscribers'
      );
    }
  });

  it('should accept valid cadence values', () => {
    const cadences = ['month', 'year'] as const;
    for (const cadence of cadences) {
      const result = AdminCreateOfferInputSchema.safeParse({
        name: 'Test',
        code: 'test',
        tier: 'tier-123',
        cadence,
        type: 'percent',
        amount: 10,
        duration: 'once',
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid cadence', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Test',
      code: 'test',
      tier: 'tier-123',
      cadence: 'weekly',
      type: 'percent',
      amount: 10,
      duration: 'once',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid type values', () => {
    const types = ['percent', 'fixed', 'trial'] as const;
    for (const type of types) {
      const result = AdminCreateOfferInputSchema.safeParse({
        name: 'Test',
        code: 'test',
        tier: 'tier-123',
        cadence: 'month',
        type,
        amount: 10,
        duration: 'once',
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid type', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Test',
      code: 'test',
      tier: 'tier-123',
      cadence: 'month',
      type: 'invalid',
      amount: 10,
      duration: 'once',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid duration values', () => {
    const durations = ['once', 'forever', 'repeating', 'trial'] as const;
    for (const duration of durations) {
      const result = AdminCreateOfferInputSchema.safeParse({
        name: 'Test',
        code: 'test',
        tier: 'tier-123',
        cadence: 'month',
        type: 'percent',
        amount: 10,
        duration,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid duration', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Test',
      code: 'test',
      tier: 'tier-123',
      cadence: 'month',
      type: 'percent',
      amount: 10,
      duration: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Test',
      code: 'test',
      tier: 'tier-123',
      cadence: 'month',
      type: 'percent',
      amount: -10,
      duration: 'once',
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-positive duration_in_months', () => {
    const result = AdminCreateOfferInputSchema.safeParse({
      name: 'Test',
      code: 'test',
      tier: 'tier-123',
      cadence: 'month',
      type: 'percent',
      amount: 10,
      duration: 'repeating',
      duration_in_months: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('AdminUpdateOfferInputSchema', () => {
  it('should require id and updated_at', () => {
    const result = AdminUpdateOfferInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('should accept id and updated_at only', () => {
    const result = AdminUpdateOfferInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
      expect(result.data.updated_at).toBe('2024-01-15T10:00:00.000Z');
    }
  });

  it('should accept name update', () => {
    const result = AdminUpdateOfferInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Offer Name',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Updated Offer Name');
    }
  });

  it('should accept code update', () => {
    const result = AdminUpdateOfferInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      code: 'newcode',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('newcode');
    }
  });

  it('should accept display_title update with null', () => {
    const result = AdminUpdateOfferInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      display_title: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_title).toBeNull();
    }
  });

  it('should accept status update', () => {
    const result = AdminUpdateOfferInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      status: 'archived',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('archived');
    }
  });

  it('should accept valid status values', () => {
    const statuses = ['active', 'archived'] as const;
    for (const status of statuses) {
      const result = AdminUpdateOfferInputSchema.safeParse({
        id: '123',
        updated_at: '2024-01-15T10:00:00.000Z',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const result = AdminUpdateOfferInputSchema.safeParse({
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminBrowseOffers', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { offers: [], meta: {} } }, (url) => {
      expect(url).toContain('/ghost/api/admin/offers/');
    });

    await executeAdminBrowseOffers(client, {});
  });

  it('should pass filter parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { offers: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('filter')).toBe('status:active');
    });

    await executeAdminBrowseOffers(client, { filter: 'status:active' });
  });

  it('should pass limit parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { offers: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    await executeAdminBrowseOffers(client, { limit: 10 });
  });

  it('should pass order parameter', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 200, body: { offers: [], meta: {} } }, (url) => {
      const parsed = new URL(url);
      expect(parsed.searchParams.get('order')).toBe('created_at DESC');
    });

    await executeAdminBrowseOffers(client, { order: 'created_at DESC' });
  });

  it('should return offers response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      offers: [
        {
          id: '1',
          name: 'Black Friday',
          code: 'bf2024',
          type: 'percent',
          amount: 20,
          cadence: 'year',
          duration: 'once',
          status: 'active',
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

    const result = await executeAdminBrowseOffers(client, {});
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].name).toBe('Black Friday');
    expect(result.offers[0].type).toBe('percent');
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

    await expect(executeAdminBrowseOffers(client, {})).rejects.toThrow(
      GhostApiError
    );
  });
});

describe('executeAdminCreateOffer', () => {
  it('should POST with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { offers: [{ id: '1', name: 'Black Friday' }] } },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/offers/');
        const body = JSON.parse(options?.body as string);
        expect(body.offers).toHaveLength(1);
        expect(body.offers[0].name).toBe('Black Friday');
      }
    );

    await executeAdminCreateOffer(client, {
      name: 'Black Friday',
      code: 'bf2024',
      tier: 'tier-123',
      cadence: 'year',
      type: 'percent',
      amount: 20,
      duration: 'once',
    });
  });

  it('should wrap tier as object with id', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 201, body: { offers: [{ id: '1', name: 'Test' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.offers[0].tier).toEqual({ id: 'tier-123' });
      }
    );

    await executeAdminCreateOffer(client, {
      name: 'Test',
      code: 'test',
      tier: 'tier-123',
      cadence: 'month',
      type: 'percent',
      amount: 10,
      duration: 'once',
    });
  });

  it('should include all provided fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 201,
        body: { offers: [{ id: '1', name: 'Spring Sale' }] },
      },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.offers[0].name).toBe('Spring Sale');
        expect(body.offers[0].code).toBe('spring');
        expect(body.offers[0].type).toBe('fixed');
        expect(body.offers[0].amount).toBe(500);
        expect(body.offers[0].currency).toBe('usd');
        expect(body.offers[0].display_title).toBe('$5 Off!');
        expect(body.offers[0].duration).toBe('forever');
      }
    );

    await executeAdminCreateOffer(client, {
      name: 'Spring Sale',
      code: 'spring',
      tier: 'tier-123',
      cadence: 'month',
      type: 'fixed',
      amount: 500,
      duration: 'forever',
      currency: 'usd',
      display_title: '$5 Off!',
    });
  });

  it('should return created offer', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        offers: [
          {
            id: '1',
            name: 'Black Friday',
            code: 'bf2024',
            type: 'percent',
            amount: 20,
            status: 'active',
          },
        ],
      },
    });

    const result = await executeAdminCreateOffer(client, {
      name: 'Black Friday',
      code: 'bf2024',
      tier: 'tier-123',
      cadence: 'year',
      type: 'percent',
      amount: 20,
      duration: 'once',
    });
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].id).toBe('1');
    expect(result.offers[0].status).toBe('active');
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
      executeAdminCreateOffer(client, {
        name: 'Test',
        code: 'test',
        tier: 'tier-123',
        cadence: 'month',
        type: 'percent',
        amount: 10,
        duration: 'once',
      })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminUpdateOffer', () => {
  it('should PUT with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { offers: [{ id: '123', name: 'Updated' }] } },
      (url, options) => {
        expect(options?.method).toBe('PUT');
        expect(url).toContain('/offers/123/');
        const body = JSON.parse(options?.body as string);
        expect(body.offers[0].updated_at).toBe('2024-01-15T10:00:00.000Z');
        expect(body.offers[0].name).toBe('Updated');
      }
    );

    await executeAdminUpdateOffer(client, {
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
      { status: 200, body: { offers: [{ id: '123' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        // id should not be in the body, only in the URL
        expect(body.offers[0].id).toBeUndefined();
      }
    );

    await executeAdminUpdateOffer(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
    });
  });

  it('should update status to archived', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      { status: 200, body: { offers: [{ id: '123', status: 'archived' }] } },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.offers[0].status).toBe('archived');
      }
    );

    await executeAdminUpdateOffer(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      status: 'archived',
    });
  });

  it('should return updated offer', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 200,
      body: {
        offers: [
          {
            id: '123',
            name: 'Updated Name',
            updated_at: '2024-01-15T11:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminUpdateOffer(client, {
      id: '123',
      updated_at: '2024-01-15T10:00:00.000Z',
      name: 'Updated Name',
    });
    expect(result.offers[0].name).toBe('Updated Name');
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
      executeAdminUpdateOffer(client, {
        id: '123',
        updated_at: '2024-01-15T10:00:00.000Z',
      })
    ).rejects.toThrow(GhostApiError);
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Offer not found', type: 'NotFoundError' }] },
    });

    await expect(
      executeAdminUpdateOffer(client, {
        id: 'nonexistent',
        updated_at: '2024-01-15T10:00:00.000Z',
      })
    ).rejects.toThrow(GhostApiError);
  });
});
