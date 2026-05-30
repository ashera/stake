import { randomBytes, scryptSync } from "node:crypto";

// scrypt password hashing for the Node scripts. Mirrors hashPassword() in
// lib/auth.ts (the app runtime keeps its own copy so it has no script import).
// Format: "scrypt$<saltHex>$<hashHex>".
export function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}
