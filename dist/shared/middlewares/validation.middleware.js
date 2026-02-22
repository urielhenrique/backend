"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBody = exports.sanitizeInput = exports.validateMovimentacao = exports.validateProduct = exports.validateLogin = exports.validateRegister = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
/**
 * Middleware para processar resultados de validação
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: "Dados inválidos",
            details: errors.array(),
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
/**
 * Validações para registro
 */
exports.validateRegister = [
    (0, express_validator_1.body)("nomeEstabelecimento")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Nome do estabelecimento deve ter entre 2 e 100 caracteres")
        .escape(),
    (0, express_validator_1.body)("nome")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Nome deve ter entre 2 e 100 caracteres")
        .escape(),
    (0, express_validator_1.body)("email")
        .trim()
        .isEmail()
        .withMessage("Email inválido")
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage("Email muito longo"),
    (0, express_validator_1.body)("senha")
        .isLength({ min: 6, max: 100 })
        .withMessage("Senha deve ter entre 6 e 100 caracteres")
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage("Senha deve conter letras e números"),
];
/**
 * Validações para login
 */
exports.validateLogin = [
    (0, express_validator_1.body)("email").trim().isEmail().withMessage("Email inválido").normalizeEmail(),
    (0, express_validator_1.body)("password").isLength({ min: 1 }).withMessage("Senha é obrigatória"),
];
/**
 * Validações para criação de produto
 */
exports.validateProduct = [
    (0, express_validator_1.body)("nome")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Nome do produto deve ter entre 2 e 100 caracteres")
        .escape(),
    (0, express_validator_1.body)("categoria")
        .isIn([
        "Cerveja",
        "Refrigerante",
        "Destilado",
        "Vinho",
        "Agua",
        "Suco",
        "Energetico",
        "Outros",
    ])
        .withMessage("Categoria inválida"),
    (0, express_validator_1.body)("estoqueAtual")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Estoque deve ser número inteiro positivo"),
    (0, express_validator_1.body)("estoqueMinimo")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Estoque mínimo deve ser número inteiro positivo"),
    (0, express_validator_1.body)("precoCompra")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Preço de compra inválido"),
    (0, express_validator_1.body)("precoVenda")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Preço de venda inválido"),
];
/**
 * Validações para movimentação
 */
exports.validateMovimentacao = [
    (0, express_validator_1.body)("tipo")
        .isIn(["Entrada", "Saida"])
        .withMessage("Tipo deve ser 'Entrada' ou 'Saida'"),
    (0, express_validator_1.body)("quantidade")
        .isInt({ min: 1 })
        .withMessage("Quantidade deve ser maior que zero"),
    (0, express_validator_1.body)("produtoId").isUUID().withMessage("ID do produto inválido"),
    (0, express_validator_1.body)("valorUnitario")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Valor unitário inválido"),
    (0, express_validator_1.body)("observacao")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Observação muito longa (máximo 500 caracteres)")
        .escape(),
];
/**
 * Sanitize generic input
 * Remove tags HTML e caracteres perigosos
 */
const sanitizeInput = (input) => {
    if (typeof input === "string") {
        return input
            .replace(/[<>]/g, "") // Remove < e >
            .trim()
            .substring(0, 1000); // Limite de 1000 caracteres
    }
    if (typeof input === "object" && input !== null) {
        const sanitized = {};
        Object.keys(input).forEach((key) => {
            sanitized[key] = (0, exports.sanitizeInput)(input[key]);
        });
        return sanitized;
    }
    return input;
};
exports.sanitizeInput = sanitizeInput;
/**
 * Middleware de sanitização genérica
 */
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        req.body = (0, exports.sanitizeInput)(req.body);
    }
    next();
};
exports.sanitizeBody = sanitizeBody;
