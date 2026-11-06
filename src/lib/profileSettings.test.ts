import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { avatarError, passwordSchema, profileSchema } from "./profileSettings";
const profile = { first_name: 'David', last_name: 'Avellar', job_title: '', phone: '', linkedin_url: '', bio: '' };
describe('Profile settings validation', () => {
  test('biography accepts 600 characters but rejects 601', () => {
    assert.equal(profileSchema.safeParse({ ...profile, bio: 'x'.repeat(600) }).success, true);
    assert.equal(profileSchema.safeParse({ ...profile, bio: 'x'.repeat(601) }).success, false);
  });
  test('avatar maximum is 2 MB', () => {
    assert.equal(avatarError({ type: 'image/png', size: 2097152 }), null);
    assert.notEqual(avatarError({ type: 'image/png', size: 2097153 }), null);
  });
  test('avatar must be an image', () => assert.notEqual(avatarError({ type: 'application/pdf', size: 100 }), null));
  test('password minimum is eight characters', () => {
    assert.equal(passwordSchema.safeParse({ password: 'abcdefgh', confirm: 'abcdefgh' }).success, true);
    assert.equal(passwordSchema.safeParse({ password: 'abcdefg', confirm: 'abcdefg' }).success, false);
  });
  test('password confirmation must match', () => assert.equal(passwordSchema.safeParse({ password: 'abcdefgh', confirm: 'abcdefgi' }).success, false));
  test('LinkedIn rejects other websites', () => {
    assert.equal(profileSchema.safeParse({ ...profile, linkedin_url: 'https://www.linkedin.com/in/example' }).success, true);
    assert.equal(profileSchema.safeParse({ ...profile, linkedin_url: 'https://linkedin.com.evil.example/in/example' }).success, false);
  });
});