import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with scrypt from `node:crypto`.
 *
 * scrypt is a memory-hard KDF, which is what a password needs — it stays
 * expensive to brute-force on a GPU. It ships with Node, so there is no native
 * module to rebuild every time the container changes.
 */

/**
 * `scrypt` is overloaded — with and without an options object — and promisify
 * resolves to the first overload, which takes no options. Naming the signature
 * here keeps the work factors type-checked instead of silently dropped.
 */
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Work factors. `N` is the expensive one: memory used is roughly
 * `128 * N * r` bytes, so 16384 costs about 16 MB per hash.
 *
 * These are stored inside every hash rather than read from here at verify
 * time, so raising them later keeps existing passwords working — old hashes
 * verify with the parameters they were made with.
 */
const N = 16384;
const R = 8;
const P = 1;
const KEY_BYTES = 64;
const SALT_BYTES = 16;

/** scrypt refuses to run when `N * r` exceeds this. Raising N means raising it. */
const MAX_MEMORY = 64 * 1024 * 1024;

/** `scrypt$N$r$p$salt$key`, all base64. */
const SEPARATOR = "$";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEY_BYTES, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64"),
    key.toString("base64"),
  ].join(SEPARATOR);
}

/**
 * True when `password` produced `stored`.
 *
 * Returns false rather than throwing on a malformed hash: a corrupt row should
 * fail that one login, not 500 the endpoint.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(SEPARATOR);

  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, rawN, rawR, rawP, rawSalt, rawKey] = parts;
  const cost = Number(rawN);
  const blockSize = Number(rawR);
  const parallelism = Number(rawP);

  if (!cost || !blockSize || !parallelism) return false;

  const salt = Buffer.from(rawSalt!, "base64");
  const expected = Buffer.from(rawKey!, "base64");

  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await scrypt(password, salt, expected.length, {
    N: cost,
    r: blockSize,
    p: parallelism,
    maxmem: MAX_MEMORY,
  });

  // timingSafeEqual throws on a length mismatch, and the lengths match by
  // construction above — `actual` is derived at `expected.length`.
  return timingSafeEqual(actual, expected);
}

/**
 * A real hash of a throwaway password, used when login cannot find the account.
 *
 * Without this, "no such user" returns in microseconds while a wrong password
 * takes the full scrypt cost, and the difference tells an attacker which email
 * addresses are registered. Verifying against this instead spends the same
 * time, so both answers look alike from outside.
 *
 * Computed once, lazily, so it costs nothing until the first failed login.
 */
let decoyHash: Promise<string> | null = null;

export async function burnVerifyTime(password: string): Promise<false> {
  decoyHash ??= hashPassword(randomBytes(32).toString("base64"));
  await verifyPassword(password, await decoyHash);

  return false;
}
