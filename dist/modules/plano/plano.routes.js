"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plano_controller_1 = require("./plano.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new plano_controller_1.PlanoController();
router.use(auth_middleware_1.authMiddleware);
/**
 * GET /plano/limites
 * Retorna apenas os limites do plano
 */
router.get("/limites", (req, res) => controller.getLimites(req, res));
/**
 * GET /plano/uso
 * Retorna apenas o uso atual de recursos
 */
router.get("/uso", (req, res) => controller.getUso(req, res));
/**
 * GET /plano/status
 * Retorna status completo: limites + uso + percentuais + alertas
 */
router.get("/status", (req, res) => controller.getStatus(req, res));
exports.default = router;
