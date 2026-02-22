"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventParameterPollution = exports.bodySizeLimiter = exports.errorHandler = exports.securityHeaders = exports.strictLimiter = exports.apiLimiter = exports.loginLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
/**
 * Rate Limiter para Login
 * Máximo 5 tentativas de login a cada 15 minutos
 * Previne brute force attacks
 */
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: {
        error: "RATE_LIMIT_EXCEEDED",
        message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting para requests sem email (não é tentativa real)
        return !req.body.email;
    },
    // Store falha em memória (em produção, use Redis)
    skipFailedRequests: false,
});
/**
 * Rate Limiter geral para API
 * Máximo 100 requisições a cada 15 minutos por IP
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: IS_PRODUCTION ? 100 : 1000, // Mais permissivo em dev
    message: {
        error: "RATE_LIMIT_EXCEEDED",
        message: "Muitas requisições. Tente novamente mais tarde.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Rate Limiter estrito para operações sensíveis
 */
exports.strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 tentativas por hora
    message: {
        error: "RATE_LIMIT_EXCEEDED",
        message: "Limite de requisições excedido. Tente novamente mais tarde.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Security Headers Middleware
 * Implementa várias proteções de segurança
 */
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Enable XSS protection (legacy browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Content Security Policy
    if (IS_PRODUCTION) {
        res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';");
    }
    // Strict Transport Security (HTTPS only)
    if (IS_PRODUCTION) {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    // Referrer Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions Policy
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
    // Remove powered-by header (don't expose tech stack)
    res.removeHeader("X-Powered-By");
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * Sanitize Error Response
 * Nunca expor stack traces em produção
 */
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    // Em produção, nunca expor detalhes internos
    if (IS_PRODUCTION) {
        const statusCode = err.statusCode || 500;
        const message = statusCode < 500 ? err.message : "Erro interno do servidor";
        return res.status(statusCode).json({
            error: err.code || "INTERNAL_ERROR",
            message,
        });
    }
    // Em desenvolvimento, pode mostrar detalhes
    res.status(err.statusCode || 500).json({
        error: err.code || "INTERNAL_ERROR",
        message: err.message,
        stack: err.stack,
    });
};
exports.errorHandler = errorHandler;
/**
 * Body Size Limiter
 * Previne ataques de payload excessivo
 */
const bodySizeLimiter = (sizeLimit = "10kb") => {
    return (req, res, next) => {
        // Express json() já tem limit, mas garantimos aqui também
        const contentLength = req.headers["content-length"];
        if (contentLength && parseInt(contentLength) > 10 * 1024) {
            return res.status(413).json({
                error: "PAYLOAD_TOO_LARGE",
                message: "Payload muito grande",
            });
        }
        next();
    };
};
exports.bodySizeLimiter = bodySizeLimiter;
/**
 * Prevent Parameter Pollution
 */
const preventParameterPollution = (req, res, next) => {
    // Garante que cada query param é uma string, não array
    Object.keys(req.query).forEach((key) => {
        if (Array.isArray(req.query[key])) {
            req.query[key] = req.query[key][0];
        }
    });
    next();
};
exports.preventParameterPollution = preventParameterPollution;
