import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        estabelecimentoId: string;
        role: "ADMIN" | "FUNCIONARIO";
      };
      rawBody?: Buffer;
      csrfToken?: () => string;
    }
  }
}
