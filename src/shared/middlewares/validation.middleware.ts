import { Request, Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from "express-validator";

/**
 * Middleware para processar resultados de validação
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: errors.array(),
    });
  }

  next();
};

/**
 * Validações para registro
 */
export const validateRegister: ValidationChain[] = [
  body("nomeEstabelecimento")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome do estabelecimento deve ter entre 2 e 100 caracteres")
    .escape(),

  body("nome")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres")
    .escape(),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email muito longo"),

  body("senha")
    .isLength({ min: 6, max: 100 })
    .withMessage("Senha deve ter entre 6 e 100 caracteres")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Senha deve conter letras e números"),
];

/**
 * Validações para login
 */
export const validateLogin: ValidationChain[] = [
  body("email").trim().isEmail().withMessage("Email inválido").normalizeEmail(),

  body("password").isLength({ min: 1 }).withMessage("Senha é obrigatória"),
];

/**
 * Validações para criação de produto
 */
export const validateProduct: ValidationChain[] = [
  body("nome")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome do produto deve ter entre 2 e 100 caracteres")
    .escape(),

  body("categoria")
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

  body("estoqueAtual")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Estoque deve ser número inteiro positivo"),

  body("estoqueMinimo")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Estoque mínimo deve ser número inteiro positivo"),

  body("precoCompra")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Preço de compra inválido"),

  body("precoVenda")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Preço de venda inválido"),
];

/**
 * Validações para movimentação
 */
export const validateMovimentacao: ValidationChain[] = [
  body("tipo")
    .isIn(["Entrada", "Saida"])
    .withMessage("Tipo deve ser 'Entrada' ou 'Saida'"),

  body("quantidade")
    .isInt({ min: 1 })
    .withMessage("Quantidade deve ser maior que zero"),

  body("produtoId").isUUID().withMessage("ID do produto inválido"),

  body("valorUnitario")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Valor unitário inválido"),

  body("observacao")
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
export const sanitizeInput = (input: any): any => {
  if (typeof input === "string") {
    return input
      .replace(/[<>]/g, "") // Remove < e >
      .trim()
      .substring(0, 1000); // Limite de 1000 caracteres
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    Object.keys(input).forEach((key) => {
      sanitized[key] = sanitizeInput(input[key]);
    });
    return sanitized;
  }

  return input;
};

/**
 * Middleware de sanitização genérica
 */
export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};
