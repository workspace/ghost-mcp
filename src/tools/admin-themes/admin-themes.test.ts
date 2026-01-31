/**
 * Tests for Ghost Admin API Themes tools.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { GhostClient } from '../../client/ghost-client.js';
import { GhostApiError } from '../../client/errors.js';
import {
  AdminUploadThemeInputSchema,
  AdminActivateThemeInputSchema,
} from './schemas.js';
import { executeAdminUploadTheme } from './upload-theme.js';
import { executeAdminActivateTheme } from './activate-theme.js';

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

// Helper to create a temporary test .zip file
function createTempZipFile(): string {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `test-theme-${Date.now()}.zip`);
  // Create a minimal ZIP file (just the signature for testing)
  // ZIP files start with PK\x03\x04 signature
  const minimalZip = Buffer.from([
    0x50, 0x4b, 0x03, 0x04, // Local file header signature
    0x14, 0x00, // Version needed to extract
    0x00, 0x00, // General purpose bit flag
    0x00, 0x00, // Compression method
    0x00, 0x00, // File last modification time
    0x00, 0x00, // File last modification date
    0x00, 0x00, 0x00, 0x00, // CRC-32
    0x00, 0x00, 0x00, 0x00, // Compressed size
    0x00, 0x00, 0x00, 0x00, // Uncompressed size
    0x00, 0x00, // File name length
    0x00, 0x00, // Extra field length
  ]);
  fs.writeFileSync(tempFile, minimalZip);
  return tempFile;
}

// Restore fetch and cleanup after each test
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// =============================================================================
// Schema Tests - AdminUploadThemeInputSchema
// =============================================================================

describe('AdminUploadThemeInputSchema', () => {
  it('should require file_path', () => {
    const result = AdminUploadThemeInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty file_path', () => {
    const result = AdminUploadThemeInputSchema.safeParse({ file_path: '' });
    expect(result.success).toBe(false);
  });

  it('should accept valid file_path', () => {
    const result = AdminUploadThemeInputSchema.safeParse({
      file_path: '/path/to/theme.zip',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.file_path).toBe('/path/to/theme.zip');
    }
  });
});

// =============================================================================
// Schema Tests - AdminActivateThemeInputSchema
// =============================================================================

describe('AdminActivateThemeInputSchema', () => {
  it('should require name', () => {
    const result = AdminActivateThemeInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = AdminActivateThemeInputSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should accept valid name', () => {
    const result = AdminActivateThemeInputSchema.safeParse({
      name: 'casper',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('casper');
    }
  });

  it('should accept theme name with special characters', () => {
    const result = AdminActivateThemeInputSchema.safeParse({
      name: 'Alto-master',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Alto-master');
    }
  });
});

// =============================================================================
// Execute Function Tests - executeAdminUploadTheme
// =============================================================================

describe('executeAdminUploadTheme', () => {
  it('should throw error for non-existent file', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    await expect(
      executeAdminUploadTheme(client, {
        file_path: '/non/existent/file.zip',
      })
    ).rejects.toThrow('File not found');
  });

  it('should throw error for non-.zip file', async () => {
    const tempFile = path.join(os.tmpdir(), `test-file-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, 'test content');

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    try {
      await expect(
        executeAdminUploadTheme(client, {
          file_path: tempFile,
        })
      ).rejects.toThrow('Invalid file type');
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should throw error for directory path', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dir-'));

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    try {
      await expect(
        executeAdminUploadTheme(client, {
          file_path: tempDir,
        })
      ).rejects.toThrow('Path is not a file');
    } finally {
      fs.rmdirSync(tempDir);
    }
  });

  it('should upload theme successfully', async () => {
    const tempFile = createTempZipFile();

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      themes: [
        {
          name: 'my-theme',
          package: { name: 'my-theme', version: '1.0.0' },
          active: false,
          templates: [],
        },
      ],
    };

    mockFetch({ status: 201, body: expectedResponse }, (url, options) => {
      expect(url).toContain('/ghost/api/admin/themes/upload/');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBeInstanceOf(FormData);
    });

    try {
      const result = await executeAdminUploadTheme(client, {
        file_path: tempFile,
      });

      expect(result.themes).toBeDefined();
      expect(result.themes[0].name).toBe('my-theme');
      expect(result.themes[0].active).toBe(false);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should handle API errors for invalid theme', async () => {
    const tempFile = createTempZipFile();

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 422,
      body: { errors: [{ message: 'Theme is not a valid zip file' }] },
    });

    try {
      await expect(
        executeAdminUploadTheme(client, {
          file_path: tempFile,
        })
      ).rejects.toThrow(GhostApiError);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should handle authentication errors', async () => {
    const tempFile = createTempZipFile();

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 401,
      body: { errors: [{ message: 'Invalid token' }] },
    });

    try {
      await expect(
        executeAdminUploadTheme(client, {
          file_path: tempFile,
        })
      ).rejects.toThrow(GhostApiError);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });
});

// =============================================================================
// Execute Function Tests - executeAdminActivateTheme
// =============================================================================

describe('executeAdminActivateTheme', () => {
  it('should activate theme successfully', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      themes: [
        {
          name: 'casper',
          package: { name: 'casper', version: '5.0.0' },
          active: true,
          templates: [
            {
              filename: 'custom-full-feature-image',
              name: 'Full Feature Image',
              for: ['page', 'post'],
              slug: null,
            },
          ],
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse }, (url, options) => {
      expect(url).toContain('/ghost/api/admin/themes/casper/activate/');
      expect(options?.method).toBe('PUT');
    });

    const result = await executeAdminActivateTheme(client, {
      name: 'casper',
    });

    expect(result.themes).toBeDefined();
    expect(result.themes[0].name).toBe('casper');
    expect(result.themes[0].active).toBe(true);
  });

  it('should handle non-existent theme', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 404,
      body: { errors: [{ message: 'Theme not found' }] },
    });

    await expect(
      executeAdminActivateTheme(client, {
        name: 'non-existent-theme',
      })
    ).rejects.toThrow(GhostApiError);
  });

  it('should handle authentication errors', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 401,
      body: { errors: [{ message: 'Invalid token' }] },
    });

    await expect(
      executeAdminActivateTheme(client, {
        name: 'casper',
      })
    ).rejects.toThrow(GhostApiError);
  });

  it('should handle theme name with special characters', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      themes: [
        {
          name: 'Alto-master',
          package: { name: 'Alto', version: '1.0.0' },
          active: true,
          templates: [],
        },
      ],
    };

    mockFetch({ status: 200, body: expectedResponse }, (url) => {
      expect(url).toContain('/ghost/api/admin/themes/Alto-master/activate/');
    });

    const result = await executeAdminActivateTheme(client, {
      name: 'Alto-master',
    });

    expect(result.themes[0].name).toBe('Alto-master');
    expect(result.themes[0].active).toBe(true);
  });
});
