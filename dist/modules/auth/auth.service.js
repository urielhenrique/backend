"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const plano_service_1 = require("../../shared/services/plano.service");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
class AuthService {
    planoService = new plano_service_1.PlanoService();
    async register(nomeEstabelecimento, nome, email, senha) {
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
        const user = estabelecimento.usuarios[0];
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            estabelecimentoId: estabelecimento.id,
            role: user.role,
        }, JWT_SECRET, { expiresIn: "7d" });
        return { token };
    }
    async login(email, senha) {
        const user = await prisma_1.default.usuario.findUnique({
            where: { email },
            include: {
                estabelecimento: true,
            },
        });
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        const senhaValida = await bcrypt_1.default.compare(senha, user.senhaHash);
        if (!senhaValida) {
            throw new Error("Senha inválida");
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            estabelecimentoId: user.estabelecimentoId,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return {
            token,
            user: {
                id: user.id,
                name: user.nome,
                email: user.email,
                role: user.role,
                estabelecimento_id: user.estabelecimentoId,
                estabelecimento_nome: user.estabelecimento.nome,
            },
        };
    }
    /**
     * Cria um novo usuário em um estabelecimento existente
     * Valida o limite de usuários antes de criar
     */
    async createUsuario(estabelecimentoId, nome, email, senha, role = "FUNCIONARIO") {
        // Valida limite de usuários antes de criar
        await this.planoService.checkLimite(estabelecimentoId, "usuario");
        const senhaHash = await bcrypt_1.default.hash(senha, 10);
        const usuario = await prisma_1.default.usuario.create({
            data: {
                nome,
                email,
                senhaHash,
                role,
                estabelecimentoId,
            },
        });
        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
        };
    }
}
exports.AuthService = AuthService;
