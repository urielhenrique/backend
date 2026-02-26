import crypto from "crypto";

/**
 * Token utility functions
 * Handles generation, hashing, and validation
 */

/**
 * Gerar token aleatório de 32 bytes
 * @returns Token de 64 caracteres (hex)
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash um token usando SHA256
 * IMPORTANTE: Sempre hash tokens antes de armazenar no banco
 * @param token Token original (raw)
 * @returns Hash SHA256 do token
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validar se um token é válido (não expirado)
 * @param expiresAt Data de expiração
 * @returns true se ainda é válido, false se expirou
 */
export function isTokenValid(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() < expiresAt;
}

/**
 * Gerar data de expiração a partir de agora
 * @param minutes Minutos até expiração
 * @returns Data de expiração
 */
export function getExpirationDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
