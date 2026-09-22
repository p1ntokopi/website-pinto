import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSiteUrl, PRODUCTION_SITE_URL, DEVELOPMENT_SITE_URL } from './site';

describe('Site URL Configuration & Localhost Protection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Production mode (NODE_ENV=production)', () => {
    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.VERCEL_ENV;
    });

    it('returns canonical production URL when NEXT_PUBLIC_APP_URL is localhost', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      expect(getSiteUrl()).toBe(PRODUCTION_SITE_URL);
    });

    it('returns canonical production URL when NEXT_PUBLIC_SITE_URL is 127.0.0.1', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3000';
      expect(getSiteUrl()).toBe(PRODUCTION_SITE_URL);
    });

    it('normalizes www subdomain to canonical apex domain', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://www.pintokupi.my.id';
      expect(getSiteUrl()).toBe(PRODUCTION_SITE_URL);
    });

    it('returns canonical production URL when no env vars are defined', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      expect(getSiteUrl()).toBe(PRODUCTION_SITE_URL);
    });

    it('accepts valid custom domain if configured in production', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://custom-domain.com/';
      expect(getSiteUrl()).toBe('https://custom-domain.com');
    });
  });

  describe('Development mode (NODE_ENV=development)', () => {
    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      delete process.env.VERCEL_ENV;
    });

    it('allows localhost URL in development', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      expect(getSiteUrl()).toBe('http://localhost:3000');
    });

    it('falls back to default development URL if unset', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      expect(getSiteUrl()).toBe(DEVELOPMENT_SITE_URL);
    });
  });
});
