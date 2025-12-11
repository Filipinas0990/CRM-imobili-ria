// integrations/supabase/clientes/deleteCliente.ts
import { supabase } from "@/integrations/supabase/client";

export async function deleteCliente(id: string) {
    try {
        const { error } = await supabase
            .from("clientes")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return true;
    } catch (err: any) {
        console.error("Erro ao excluir cliente:", err.message || err);
        throw new Error("Erro ao excluir cliente.");
    }
}
