import { ProdutoRepository } from "./produto.repository";
import { PlanoService } from "../../shared/services/plano.service";

export class ProdutoService {
  private repository = new ProdutoRepository();
  private planoService = new PlanoService();

  private calcularStatus(estoqueAtual: number, estoqueMinimo: number) {
    if (estoqueAtual <= estoqueMinimo) return "Repor";
    if (estoqueAtual <= estoqueMinimo + 5) return "Atencao";
    return "OK";
  }

  async create(estabelecimentoId: string, data: any) {
    // Valida limite de produtos antes de criar
    await this.planoService.checkLimite(estabelecimentoId, "produto");

    const estoqueAtual = data.estoqueAtual ?? 0;
    const estoqueMinimo = data.estoqueMinimo ?? 5;

    const status = this.calcularStatus(estoqueAtual, estoqueMinimo);

    return this.repository.create({
      ...data,
      estabelecimentoId,
      status,
    });
  }

  async findAll(estabelecimentoId: string, cursor?: string, limit?: number) {
    return this.repository.findAll(estabelecimentoId, cursor, limit);
  }

  async update(id: string, estabelecimentoId: string, data: any) {
    if (data.estoqueAtual !== undefined && data.estoqueMinimo !== undefined) {
      data.status = this.calcularStatus(data.estoqueAtual, data.estoqueMinimo);
    }

    return this.repository.update(id, estabelecimentoId, data);
  }

  async delete(id: string, estabelecimentoId: string) {
    return this.repository.delete(id, estabelecimentoId);
  }
}
