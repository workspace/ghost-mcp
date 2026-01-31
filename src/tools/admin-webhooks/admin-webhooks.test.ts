/**
 * Tests for Ghost Admin API Webhooks tools.
 */

import { GhostClient } from '../../client/ghost-client.js';
import { GhostApiError } from '../../client/errors.js';
import {
  AdminCreateWebhookInputSchema,
  AdminUpdateWebhookInputSchema,
  AdminDeleteWebhookInputSchema,
} from './schemas.js';
import { executeAdminCreateWebhook } from './create-webhook.js';
import { executeAdminUpdateWebhook } from './update-webhook.js';
import { executeAdminDeleteWebhook } from './delete-webhook.js';

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

describe('AdminCreateWebhookInputSchema', () => {
  it('should require event and target_url', () => {
    const result = AdminCreateWebhookInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept event and target_url only', () => {
    const result = AdminCreateWebhookInputSchema.safeParse({
      event: 'post.published',
      target_url: 'https://example.com/webhook',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.event).toBe('post.published');
      expect(result.data.target_url).toBe('https://example.com/webhook');
    }
  });

  it('should accept full webhook data', () => {
    const result = AdminCreateWebhookInputSchema.safeParse({
      event: 'member.added',
      target_url: 'https://example.com/webhook',
      name: 'My Webhook',
      secret: 'mysecret123',
      api_version: 'v5',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.event).toBe('member.added');
      expect(result.data.name).toBe('My Webhook');
      expect(result.data.secret).toBe('mysecret123');
      expect(result.data.api_version).toBe('v5');
    }
  });

  it('should reject invalid target_url', () => {
    const result = AdminCreateWebhookInputSchema.safeParse({
      event: 'post.published',
      target_url: 'not-a-valid-url',
    });
    expect(result.success).toBe(false);
  });

  it('should accept various event types', () => {
    const events = [
      'site.changed',
      'post.added',
      'post.deleted',
      'post.published',
      'page.added',
      'tag.added',
      'member.added',
    ];
    for (const event of events) {
      const result = AdminCreateWebhookInputSchema.safeParse({
        event,
        target_url: 'https://example.com/webhook',
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('AdminUpdateWebhookInputSchema', () => {
  it('should require id', () => {
    const result = AdminUpdateWebhookInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept id only', () => {
    const result = AdminUpdateWebhookInputSchema.safeParse({
      id: '123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });

  it('should accept all update fields', () => {
    const result = AdminUpdateWebhookInputSchema.safeParse({
      id: '123',
      event: 'post.deleted',
      target_url: 'https://new-url.com/webhook',
      name: 'Updated Webhook',
      api_version: 'v6',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
      expect(result.data.event).toBe('post.deleted');
      expect(result.data.target_url).toBe('https://new-url.com/webhook');
      expect(result.data.name).toBe('Updated Webhook');
      expect(result.data.api_version).toBe('v6');
    }
  });

  it('should reject invalid target_url', () => {
    const result = AdminUpdateWebhookInputSchema.safeParse({
      id: '123',
      target_url: 'not-a-valid-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('AdminDeleteWebhookInputSchema', () => {
  it('should require id', () => {
    const result = AdminDeleteWebhookInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept id', () => {
    const result = AdminDeleteWebhookInputSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('123');
    }
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminCreateWebhook', () => {
  it('should POST with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 201,
        body: {
          webhooks: [
            {
              id: '1',
              event: 'post.published',
              target_url: 'https://example.com/webhook',
            },
          ],
        },
      },
      (url, options) => {
        expect(options?.method).toBe('POST');
        expect(url).toContain('/webhooks/');
        const body = JSON.parse(options?.body as string);
        expect(body.webhooks).toHaveLength(1);
        expect(body.webhooks[0].event).toBe('post.published');
        expect(body.webhooks[0].target_url).toBe('https://example.com/webhook');
      }
    );

    await executeAdminCreateWebhook(client, {
      event: 'post.published',
      target_url: 'https://example.com/webhook',
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
        body: {
          webhooks: [
            {
              id: '1',
              event: 'member.added',
              target_url: 'https://example.com/webhook',
              name: 'My Webhook',
              secret: 'mysecret',
            },
          ],
        },
      },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        expect(body.webhooks[0].event).toBe('member.added');
        expect(body.webhooks[0].target_url).toBe('https://example.com/webhook');
        expect(body.webhooks[0].name).toBe('My Webhook');
        expect(body.webhooks[0].secret).toBe('mysecret');
        expect(body.webhooks[0].api_version).toBe('v5');
      }
    );

    await executeAdminCreateWebhook(client, {
      event: 'member.added',
      target_url: 'https://example.com/webhook',
      name: 'My Webhook',
      secret: 'mysecret',
      api_version: 'v5',
    });
  });

  it('should return created webhook', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        webhooks: [
          {
            id: '1',
            event: 'post.published',
            target_url: 'https://example.com/webhook',
            name: 'My Webhook',
            status: 'available',
            created_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminCreateWebhook(client, {
      event: 'post.published',
      target_url: 'https://example.com/webhook',
    });
    expect(result.webhooks).toHaveLength(1);
    expect(result.webhooks[0].id).toBe('1');
    expect(result.webhooks[0].status).toBe('available');
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
      executeAdminCreateWebhook(client, {
        event: 'invalid.event',
        target_url: 'https://example.com/webhook',
      })
    ).rejects.toThrow(GhostApiError);
  });

  it('should throw GhostApiError on auth failure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 401,
      body: { errors: [{ message: 'Invalid token' }] },
    });

    await expect(
      executeAdminCreateWebhook(client, {
        event: 'post.published',
        target_url: 'https://example.com/webhook',
      })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminUpdateWebhook', () => {
  it('should PUT with correct body structure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 200,
        body: {
          webhooks: [
            {
              id: '123',
              event: 'post.deleted',
              target_url: 'https://example.com/webhook',
            },
          ],
        },
      },
      (url, options) => {
        expect(options?.method).toBe('PUT');
        expect(url).toContain('/webhooks/123/');
        const body = JSON.parse(options?.body as string);
        expect(body.webhooks).toHaveLength(1);
        expect(body.webhooks[0].event).toBe('post.deleted');
      }
    );

    await executeAdminUpdateWebhook(client, {
      id: '123',
      event: 'post.deleted',
    });
  });

  it('should not include id in body', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 200,
        body: { webhooks: [{ id: '123', event: 'post.deleted' }] },
      },
      (url, options) => {
        const body = JSON.parse(options?.body as string);
        // id should not be in the body, only in the URL
        expect(body.webhooks[0].id).toBeUndefined();
      }
    );

    await executeAdminUpdateWebhook(client, {
      id: '123',
      event: 'post.deleted',
    });
  });

  it('should return updated webhook', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 200,
      body: {
        webhooks: [
          {
            id: '123',
            event: 'post.deleted',
            target_url: 'https://new-url.com/webhook',
            name: 'Updated Webhook',
            updated_at: '2024-01-15T11:00:00.000Z',
          },
        ],
      },
    });

    const result = await executeAdminUpdateWebhook(client, {
      id: '123',
      event: 'post.deleted',
      name: 'Updated Webhook',
    });
    expect(result.webhooks[0].name).toBe('Updated Webhook');
    expect(result.webhooks[0].event).toBe('post.deleted');
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Webhook not found' }] },
    });

    await expect(
      executeAdminUpdateWebhook(client, {
        id: 'nonexistent',
        event: 'post.deleted',
      })
    ).rejects.toThrow(GhostApiError);
  });
});

describe('executeAdminDeleteWebhook', () => {
  it('should DELETE correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 }, (url, options) => {
      expect(options?.method).toBe('DELETE');
      expect(url).toContain('/webhooks/123/');
    });

    await executeAdminDeleteWebhook(client, { id: '123' });
  });

  it('should return success response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({ status: 204 });

    const result = await executeAdminDeleteWebhook(client, { id: '123' });
    expect(result.success).toBe(true);
  });

  it('should throw GhostApiError on 404', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Webhook not found' }] },
    });

    await expect(
      executeAdminDeleteWebhook(client, { id: 'nonexistent' })
    ).rejects.toThrow(GhostApiError);
  });

  it('should throw GhostApiError on auth failure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 401,
      body: { errors: [{ message: 'Invalid token' }] },
    });

    await expect(
      executeAdminDeleteWebhook(client, { id: '123' })
    ).rejects.toThrow(GhostApiError);
  });
});
