/**
 * Tests for Ghost Admin API Images tools.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { GhostClient } from '../../client/ghost-client.js';
import { GhostApiError } from '../../client/errors.js';
import { AdminUploadImageInputSchema } from './schemas.js';
import { executeAdminUploadImage } from './upload-image.js';

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

// Helper to create a temporary test image file
function createTempImageFile(ext: string = '.png'): string {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `test-image-${Date.now()}${ext}`);
  // Create a minimal valid PNG (1x1 pixel)
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
    0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f, 0x00, 0x05, 0xfe, 0x02,
    0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
    0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  fs.writeFileSync(tempFile, minimalPng);
  return tempFile;
}

// Restore fetch and cleanup after each test
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// =============================================================================
// Schema Tests
// =============================================================================

describe('AdminUploadImageInputSchema', () => {
  it('should require file_path', () => {
    const result = AdminUploadImageInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty file_path', () => {
    const result = AdminUploadImageInputSchema.safeParse({ file_path: '' });
    expect(result.success).toBe(false);
  });

  it('should accept file_path only', () => {
    const result = AdminUploadImageInputSchema.safeParse({
      file_path: '/path/to/image.png',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purpose).toBe('image'); // default value
    }
  });

  it('should accept all valid parameters', () => {
    const result = AdminUploadImageInputSchema.safeParse({
      file_path: '/path/to/image.png',
      purpose: 'profile_image',
      ref: 'my-reference',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.file_path).toBe('/path/to/image.png');
      expect(result.data.purpose).toBe('profile_image');
      expect(result.data.ref).toBe('my-reference');
    }
  });

  it('should validate purpose enum', () => {
    const result = AdminUploadImageInputSchema.safeParse({
      file_path: '/path/to/image.png',
      purpose: 'invalid_purpose',
    });
    expect(result.success).toBe(false);
  });

  it('should accept icon purpose', () => {
    const result = AdminUploadImageInputSchema.safeParse({
      file_path: '/path/to/icon.ico',
      purpose: 'icon',
    });
    expect(result.success).toBe(true);
  });

  it('should accept image purpose', () => {
    const result = AdminUploadImageInputSchema.safeParse({
      file_path: '/path/to/photo.jpg',
      purpose: 'image',
    });
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminUploadImage', () => {
  it('should throw error for non-existent file', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    await expect(
      executeAdminUploadImage(client, {
        file_path: '/non/existent/file.png',
        purpose: 'image',
      })
    ).rejects.toThrow('File not found');
  });

  it('should throw error for unsupported file type', async () => {
    const tempFile = path.join(os.tmpdir(), `test-file-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, 'test content');

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    try {
      await expect(
        executeAdminUploadImage(client, {
          file_path: tempFile,
          purpose: 'image',
        })
      ).rejects.toThrow('Unsupported file type');
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
        executeAdminUploadImage(client, {
          file_path: tempDir,
          purpose: 'image',
        })
      ).rejects.toThrow('Path is not a file');
    } finally {
      fs.rmdirSync(tempDir);
    }
  });

  it('should upload image successfully', async () => {
    const tempFile = createTempImageFile('.png');

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      images: [
        {
          url: 'https://example.ghost.io/content/images/2024/01/test-image.png',
          ref: null,
        },
      ],
    };

    mockFetch({ status: 201, body: expectedResponse }, (url, options) => {
      expect(url).toContain('/ghost/api/admin/images/upload/');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBeInstanceOf(FormData);
    });

    try {
      const result = await executeAdminUploadImage(client, {
        file_path: tempFile,
        purpose: 'image',
      });

      expect(result.images).toBeDefined();
      expect(result.images[0].url).toBe(expectedResponse.images[0].url);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should include ref when provided', async () => {
    const tempFile = createTempImageFile('.png');

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      images: [
        {
          url: 'https://example.ghost.io/content/images/2024/01/test-image.png',
          ref: 'my-custom-ref',
        },
      ],
    };

    mockFetch({ status: 201, body: expectedResponse });

    try {
      const result = await executeAdminUploadImage(client, {
        file_path: tempFile,
        purpose: 'image',
        ref: 'my-custom-ref',
      });

      expect(result.images[0].ref).toBe('my-custom-ref');
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should handle API errors', async () => {
    const tempFile = createTempImageFile('.png');

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 415,
      body: { errors: [{ message: 'Unsupported Media Type' }] },
    });

    try {
      await expect(
        executeAdminUploadImage(client, {
          file_path: tempFile,
          purpose: 'image',
        })
      ).rejects.toThrow(GhostApiError);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should accept .ico files for icon purpose', async () => {
    const tempFile = path.join(os.tmpdir(), `test-icon-${Date.now()}.ico`);
    // Create a minimal ICO file (just a header)
    fs.writeFileSync(
      tempFile,
      Buffer.from([0x00, 0x00, 0x01, 0x00, 0x00, 0x00])
    );

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        images: [
          {
            url: 'https://example.ghost.io/content/images/icon.ico',
            ref: null,
          },
        ],
      },
    });

    try {
      const result = await executeAdminUploadImage(client, {
        file_path: tempFile,
        purpose: 'icon',
      });

      expect(result.images[0].url).toContain('icon.ico');
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should reject .ico files for image purpose', async () => {
    const tempFile = path.join(os.tmpdir(), `test-icon-${Date.now()}.ico`);
    fs.writeFileSync(
      tempFile,
      Buffer.from([0x00, 0x00, 0x01, 0x00, 0x00, 0x00])
    );

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    try {
      await expect(
        executeAdminUploadImage(client, {
          file_path: tempFile,
          purpose: 'image',
        })
      ).rejects.toThrow('Unsupported file type');
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should handle authentication errors', async () => {
    const tempFile = createTempImageFile('.png');

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
        executeAdminUploadImage(client, {
          file_path: tempFile,
          purpose: 'image',
        })
      ).rejects.toThrow(GhostApiError);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should upload JPEG image', async () => {
    const tempFile = path.join(os.tmpdir(), `test-image-${Date.now()}.jpg`);
    // Create a minimal JPEG (just header bytes for testing)
    fs.writeFileSync(tempFile, Buffer.from([0xff, 0xd8, 0xff, 0xe0]));

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        images: [
          {
            url: 'https://example.ghost.io/content/images/test.jpg',
            ref: null,
          },
        ],
      },
    });

    try {
      const result = await executeAdminUploadImage(client, {
        file_path: tempFile,
        purpose: 'image',
      });

      expect(result.images[0].url).toContain('.jpg');
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('should upload profile image', async () => {
    const tempFile = createTempImageFile('.png');

    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 201,
      body: {
        images: [
          {
            url: 'https://example.ghost.io/content/images/profile.png',
            ref: null,
          },
        ],
      },
    });

    try {
      const result = await executeAdminUploadImage(client, {
        file_path: tempFile,
        purpose: 'profile_image',
      });

      expect(result.images).toBeDefined();
      expect(result.images.length).toBe(1);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });
});
