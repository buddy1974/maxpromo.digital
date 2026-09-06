/**
 * lib/auth/password.ts
 *
 * Password hashing and verification using argon2id.
 * WHY argon2id: recommended over bcrypt by OWASP for new systems; memory-hard,
 * resistant to GPU / side-channel attacks. Native bindings compile on Vercel
 * (Linux x64) and local Windows builds via node-gyp prebuilds.
 *
 * NEVER call these from the client — server-only module.
 */
import argon2 from "argon2";

/**
 * Hash a plaintext password.
 * Returns an argon2id encoded string suitable for storing in `password_hash`.
 * argon2.hash() defaults to argon2id type.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verify a plaintext password against a stored argon2id hash.
 * Returns true on match; false on mismatch or malformed hash.
 * Never throws — caller gets false on any error.
 */
export async function verifyPassword(
  hash: string,
  plaintext: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    // Malformed hash or empty input — treat as invalid
    return false;
  }
}
