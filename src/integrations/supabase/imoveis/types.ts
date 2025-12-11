export interface Imovel {
    id?: string;
    titulo: string;
    descricao?: string;
    preco?: number;
    endereco?: string;
    tipo?: string;
    quartos?: number;
    banheiros?: number;
    area?: number;
    criador_id?: string;
    criado_em?: string;
}
