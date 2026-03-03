/**
 * Encrypted in-memory credential store for Ghost configuration.
 *
 * Stores Ghost URL and API keys encrypted with AES-256-GCM.
 * Credentials are held in memory only and lost on server restart.
 */

import { encrypt, decrypt } from './crypto.js';
import type { GhostOAuthConfig } from './oauth-types.js';

export class CredentialStore {
  private readonly secretKey: string;
  private encryptedData: string | null = null;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Encrypts and stores Ghost credentials.
   */
  save(config: GhostOAuthConfig): void {
    const json = JSON.stringify(config);
    this.encryptedData = encrypt(json, this.secretKey);
  }

  /**
   * Decrypts and returns stored Ghost credentials, or null if none saved.
   */
  get(): GhostOAuthConfig | null {
    if (!this.encryptedData) return null;
    const json = decrypt(this.encryptedData, this.secretKey);
    return JSON.parse(json) as GhostOAuthConfig;
  }

  /**
   * Returns true if credentials have been stored.
   */
  has(): boolean {
    return this.encryptedData !== null;
  }
}
