"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
/**
 * Endpoint para criar usuario ADMIN
 * GET /seed/create-admin
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/create-admin", async (req, res) => {
    try {
        const nomeEstabelecimento = "Bar Stock Pro";
        const nome = "Administrador";
        const email = "admin@barstock.com.br";
        const senha = "Admin@123456";
        const senhaHash = await bcrypt_1.default.hash(senha, 10);
        const estabelecimento = await prisma_1.default.estabelecimento.create({
            data: {
                nome: nomeEstabelecimento,
                usuarios: {
                    create: {
                        nome,
                        email,
                        senhaHash,
                        role: "ADMIN",
                    },
                },
            },
            include: { usuarios: true },
        });
        res.json({
            success: true,
            message: "✅ Usuário ADMIN criado com sucesso!",
            data: {
                email: email,
                senha: senha,
                estabelecimento: nomeEstabelecimento,
            },
        });
    }
    catch (error) {
        console.error("❌ Erro ao criar admin:", error.message);
        res.status(400).json({
            success: false,
            message: "Erro ao criar admin",
            error: error.message,
        });
    }
});
exports.default = router;
