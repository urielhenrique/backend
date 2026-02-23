"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_NAMES = exports.REFRESH_TOKEN_COOKIE_OPTIONS = exports.ACCESS_TOKEN_COOKIE_OPTIONS = void 0;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
/**
 * Configuração de cookies para tokens de acesso (1 hora)
 */
exports.ACCESS_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hora em ms
    path: "/",
};
/**
 * Configuração de cookies para refresh tokens (7 dias)
 */
exports.REFRESH_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    path: "/",
};
/**
 * Nomes dos cookies
 */
exports.COOKIE_NAMES = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
};
