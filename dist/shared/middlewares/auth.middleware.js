"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforcePlanLimit = exports.requireProPlan = exports.requireSystemAdmin = exports.requireAdmin = void 0;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../database/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const MY_ADMIN_EMAIL = process.env.MY_ADMIN_EMAIL;
/**
 * Middleware de autenticação básica
 * Verifica JWT token
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Token não fornecido",
        });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            error: "INVALID_TOKEN",
            message: "Token inválido ou expirado",
        });
    }
}
/**
 * Middleware: Requer que o usuário seja ADMIN do estabelecimento
 */
const requireAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Autenticação necessária",
        });
    }
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "FORBIDDEN",
            message: "Acesso negado. Apenas administradores.",
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware: Requer que o usuário seja ADMIN do sistema (via MY_ADMIN_EMAIL)
 * Para dashboard administrativo global
 */
const requireSystemAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Autenticação necessária",
        });
    }
    try {
        const user = await prisma_1.default.usuario.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            return res.status(404).json({
                error: "USER_NOT_FOUND",
                message: "Usuário não encontrado",
            });
        }
        // Verifica se é o admin do sistema via email
        const isSystemAdmin = MY_ADMIN_EMAIL && user.email === MY_ADMIN_EMAIL;
        if (!isSystemAdmin) {
            return res.status(403).json({
                error: "FORBIDDEN",
                message: "Acesso negado. Apenas administrador do sistema.",
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.requireSystemAdmin = requireSystemAdmin;
/**
 * Middleware: Requer plano PRO
 */
const requireProPlan = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Autenticação necessária",
        });
    }
    try {
        const estabelecimento = await prisma_1.default.estabelecimento.findUnique({
            where: { id: req.user.estabelecimentoId },
        });
        if (!estabelecimento) {
            return res.status(404).json({
                error: "ESTABLISHMENT_NOT_FOUND",
                message: "Estabelecimento não encontrado",
            });
        }
        if (estabelecimento.plano !== "PRO") {
            return res.status(403).json({
                error: "PLAN_UPGRADE_REQUIRED",
                message: "Esta funcionalidade requer plano PRO",
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.requireProPlan = requireProPlan;
/**
 * Middleware: Verificar limite do plano
 * Usado antes de criar recursos (produtos, usuários, etc)
 */
const enforcePlanLimit = (resourceType) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: "UNAUTHORIZED",
                message: "Autenticação necessária",
            });
        }
        try {
            const planoService = (await Promise.resolve().then(() => __importStar(require("../services/plano.service"))))
                .PlanoService;
            const service = new planoService();
            await service.checkLimite(req.user.estabelecimentoId, resourceType);
            next();
        }
        catch (error) {
            // Se é erro de limite, retorna com código específico
            if (error.message.includes("Limite do plano")) {
                return res.status(403).json({
                    error: "PLAN_LIMIT_REACHED",
                    message: error.message,
                    upgradeRequired: true,
                });
            }
            return res.status(500).json({
                error: "INTERNAL_ERROR",
                message: error.message,
            });
        }
    };
};
exports.enforcePlanLimit = enforcePlanLimit;
