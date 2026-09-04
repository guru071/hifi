import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/lib/email-validation';

describe('validateEmail', () => {
  it('accepts a normal valid email', () => {
    expect(validateEmail('person@example.com')).toBeNull();
  });

  it('rejects missing/empty email', () => {
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail(null)).not.toBeNull();
    expect(validateEmail(undefined)).not.toBeNull();
  });

  it('rejects malformed addresses', () => {
    expect(validateEmail('not-an-email')).not.toBeNull();
    expect(validateEmail('a@b')).not.toBeNull();
    expect(validateEmail('a b@c.com')).not.toBeNull();
  });

  it('rejects disposable domains', () => {
    expect(validateEmail('test@mailinator.com')).not.toBeNull();
    expect(validateEmail('x@yopmail.com')).not.toBeNull();
    expect(validateEmail('x@10minutemail.com')).not.toBeNull();
    expect(validateEmail('x@getnada.com')).not.toBeNull();
  });

  it('rejects disposable domains case-insensitively', () => {
    expect(validateEmail('x@gmail.COM')).toBeNull();
    expect(validateEmail('x@MAILINATOR.com')).not.toBeNull();
  });
});
