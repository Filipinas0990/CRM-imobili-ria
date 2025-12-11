export type CreateVisitaInput = {
    lead_id: string;
    imovel_id: string;
    data: string;
    anotacoes?: string;
};

export type UpdateVisitaInput = {
    lead_id?: string;
    imovel_id?: string;
    data?: string;
    anotacoes?: string;
};
