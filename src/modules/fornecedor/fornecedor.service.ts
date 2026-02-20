import { FornecedorRepository } from "./fornecedor.repository";

export class FornecedorService {
  private repo = new FornecedorRepository();

  async findAll(estabelecimentoId: string, cursor?: string, limit?: number) {
    return this.repo.findAll(estabelecimentoId, cursor, limit);
  }

  async create(estabelecimentoId: string, data: any) {
    return this.repo.create(estabelecimentoId, data);
  }

  async update(id: string, estabelecimentoId: string, data: any) {
    return this.repo.update(id, estabelecimentoId, data);
  }

  async delete(id: string, estabelecimentoId: string) {
    return this.repo.delete(id, estabelecimentoId);
  }
}
