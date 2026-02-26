"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const plano_service_1 = require("../../shared/services/plano.service");
const email_service_1 = __importDefault(require("../../shared/services/email.service"));
const token_utils_1 = require("../../shared/utils/token.utils");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const MY_ADMIN_EMAIL = process.env.MY_ADMIN_EMAIL;
const googleClient = GOOGLE_CLIENT_ID
    ? new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID)
    : null;
class AuthService {
    planoService = new plano_service_1.PlanoService();
    /**
     * Determina role baseado no email
     * Se email for MY_ADMIN_EMAIL configura como ADMIN
     */
    determineRole(email) {
        if (MY_ADMIN_EMAIL && email === MY_ADMIN_EMAIL) {
            return "ADMIN";
        }
        return "ADMIN"; // Primeiro usuário do estabelecimento é ADMIN
    }
    /**
     * Gerar access token (1 hora)
     */
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
    }
    /**
     * Gerar refresh token (7 dias)
     */
    generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
        });
    }
    async register(nomeEstabelecimento, nome, email, senha) {
        // Validar campos obrigatórios
        if (!nomeEstabelecimento || !nome || !email || !senha) {
            throw new Error("Todos os campos são obrigatórios");
        }
        // Verificar se email já existe
        const existingUser = await prisma_1.default.usuario.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new Error("Email já cadastrado");
        }
        const senhaHash = await bcrypt_1.default.hash(senha, 12);
        const role = this.determineRole(email);
        // Gerar verificação de email token
        const emailVerificationToken = (0, token_utils_1.generateToken)();
        const hashedEmailToken = (0, token_utils_1.hashToken)(emailVerificationToken);
        const emailVerificationExpires = (0, token_utils_1.getExpirationDate)(60); // 1 hora
        const estabelecimento = await prisma_1.default.estabelecimento.create({
            data: {
                nome: nomeEstabelecimento,
                usuarios: {
                    create: {
                        nome,
                        email,
                        senhaHash,
                        role,
                        emailVerificationToken: hashedEmailToken,
                        emailVerificationExpires,
                        emailVerified: false, // Require email verification
                    },
                },
            },
            include: { usuarios: true },
        });
        const user = estabelecimento.usuarios[0];
        // Enviar email de verificação
        // Usar raw token (não hashed) no link de email
        await email_service_1.default.sendVerificationEmail(email, emailVerificationToken);
        const tokenPayload = {
            userId: user.id,
            estabelecimentoId: estabelecimento.id,
            role: user.role,
        };
        const token = this.generateAccessToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                name: user.nome,
                email: user.email,
                role: user.role,
                estabelecimento_id: estabelecimento.id,
                estabelecimento_nome: estabelecimento.nome,
                plano: estabelecimento.plano,
                emailVerified: user.emailVerified,
            },
        };
    }
    async login(email, senha) {
        const user = await prisma_1.default.usuario.findUnique({
            where: { email },
            include: {
                estabelecimento: true,
            },
        });
        if (!user) {
            // Não expor se usuário existe ou não (previne user enumeration)
            throw new Error("Credenciais inválidas");
        }
        const senhaValida = await bcrypt_1.default.compare(senha, user.senhaHash);
        if (!senhaValida) {
            throw new Error("Credenciais inválidas");
        }
        // NOVO: Verificar se email foi verificado
        if (!user.emailVerified) {
            throw new Error("Verifique seu email antes de acessar. Verifique sua caixa de correio.");
        }
        const tokenPayload = {
            userId: user.id,
            estabelecimentoId: user.estabelecimentoId,
            role: user.role,
        };
        const token = this.generateAccessToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                name: user.nome,
                email: user.email,
                role: user.role,
                estabelecimento_id: user.estabelecimentoId || null,
                estabelecimento_nome: user.estabelecimento?.nome || null,
                plano: user.estabelecimento?.plano || null,
            },
        };
    }
    /**
     * Criar um novo usuário em um estabelecimento existente
     * Valida o limite de usuários antes de criar
     */
    async createUsuario(estabelecimentoId, nome, email, senha, role = "FUNCIONARIO") {
        // Valida limite de usuários antes de criar
        await this.planoService.checkLimite(estabelecimentoId, "usuario");
        // Verificar se email já existe
        const existingUser = await prisma_1.default.usuario.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new Error("Email já cadastrado");
        }
        const senhaHash = await bcrypt_1.default.hash(senha, 12);
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
    /**
     * OAuth Google - Login/Registro
     */
    async googleAuth(googleToken) {
        if (!googleClient) {
            throw new Error("Google OAuth não configurado. Defina GOOGLE_CLIENT_ID");
        }
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: googleToken,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload)
                throw new Error("Payload inválido");
            const { email, name } = payload;
            if (!email)
                throw new Error("Email não fornecido pelo Google");
            // Verificar se usuário já existe
            let user = await prisma_1.default.usuario.findUnique({
                where: { email },
                include: { estabelecimento: true },
            });
            // Se não existe, criar novo usuário e estabelecimento
            if (!user) {
                const nomeEstabelecimento = name || email.split("@")[0];
                const senhaHash = await bcrypt_1.default.hash(Math.random().toString(), 12);
                const role = this.determineRole(email);
                const estabelecimento = await prisma_1.default.estabelecimento.create({
                    data: {
                        nome: nomeEstabelecimento,
                        usuarios: {
                            create: {
                                nome: name || email,
                                email,
                                senhaHash,
                                role,
                            },
                        },
                    },
                    include: { usuarios: true },
                });
                user = { ...estabelecimento.usuarios[0], estabelecimento };
            }
            const tokenPayload = {
                userId: user.id,
                estabelecimentoId: user.estabelecimentoId,
                role: user.role,
            };
            const token = this.generateAccessToken(tokenPayload);
            const refreshToken = this.generateRefreshToken(tokenPayload);
            return {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.nome,
                    email: user.email,
                    role: user.role,
                    estabelecimento_id: user.estabelecimentoId || null,
                    estabelecimento_nome: user.estabelecimento?.nome || null,
                    plano: user.estabelecimento?.plano || null,
                },
            };
        }
        catch (error) {
            throw new Error(`Falha na autenticação Google: ${error.message}`);
        }
    }
}
exports.AuthService = AuthService;
