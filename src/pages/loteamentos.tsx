import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MapPin, BedDouble, Bath, Maximize } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { supabase } from "@/integrations/supabase/client";

import { Sidebar } from "@/components/Sidebar";
import { Landmark } from "lucide-react";



// 👉 TEMPORÁRIO: reutilizando as funções de imóveis
// Depois, se quiser, você cria getLoteamentos / createLoteamento etc
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import { createImovel } from "@/integrations/supabase/imoveis/createImovel";
import { updateImovel } from "@/integrations/supabase/imoveis/updateImovel";
import { deleteImovel } from "@/integrations/supabase/imoveis/deleteImovel";

const BUCKET = "imoveis";

const Loteamentos = () => {
    const [loteamentos, setLoteamentos] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [form, setForm] = useState<any>({
        titulo: "",
        descricao: "",
        preco: "",
        endereco: "",
        tipo: "Loteamento",
        quartos: "",
        banheiros: "",
        area: "",
    });

    function openNew() {
        setEditing(null);
        setSelectedFile(null);
        setForm({
            titulo: "",
            descricao: "",
            preco: "",
            endereco: "",
            tipo: "Loteamento",
            quartos: "",
            banheiros: "",
            area: "",
        });
        setModalOpen(true);
    }

    function openEdit(item: any) {
        setEditing(item);
        setSelectedFile(null);
        setForm({
            titulo: item.titulo,
            descricao: item.descricao,
            preco: item.preco,
            endereco: item.endereco,
            tipo: item.tipo,
            quartos: item.quartos,
            banheiros: item.banheiros,
            area: item.area,
        });
        setModalOpen(true);
    }

    async function load() {
        let res: any = await getImoveis();
        if (res?.data && Array.isArray(res.data)) res = res.data;
        if (!Array.isArray(res)) {
            setLoteamentos([]);
            return;
        }

        // 👉 filtra apenas loteamentos
        const onlyLoteamentos = res.filter(
            (i: any) => i.tipo === "Loteamento"
        );

        const withUrls = await Promise.all(
            onlyLoteamentos.map(async (p: any) => {
                if (p.foto_path) {
                    const result = await supabase
                        .storage
                        .from(BUCKET)
                        .createSignedUrl(p.foto_path, 3600);

                    return { ...p, foto_url: result.data?.signedUrl ?? null };
                }
                return { ...p, foto_url: null };
            })
        );

        setLoteamentos(withUrls);
    }

    async function uploadFile(id: string, file: File) {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const filePath = `${id}/${fileName}`;

        const { error } = await supabase.storage.from(BUCKET).upload(filePath, file);
        if (error) throw error;

        return filePath;
    }

    async function save() {
        if (!form.titulo?.trim()) {
            alert("Título é obrigatório");
            return;
        }

        const payload = {
            ...form,
            preco: form.preco ? Number(form.preco) : null,
            area: form.area ? Number(form.area) : null,
            quartos: form.quartos ? Number(form.quartos) : null,
            banheiros: form.banheiros ? Number(form.banheiros) : null,
        };

        try {
            if (editing) {
                await updateImovel(editing.id, payload);

                if (selectedFile) {
                    const path = await uploadFile(editing.id, selectedFile);
                    await updateImovel(editing.id, { foto_path: path });
                }
            } else {
                const created = await createImovel(payload);
                const createdId =
                    created?.id ?? created?.data?.[0]?.id ?? null;

                if (createdId && selectedFile) {
                    const path = await uploadFile(createdId, selectedFile);
                    await updateImovel(createdId, { foto_path: path });
                }
            }

            setModalOpen(false);
            setSelectedFile(null);
            await load();
        } catch (err: any) {
            alert(err?.message ?? "Erro ao salvar loteamento");
        }
    }

    async function remove(id: string) {
        if (!confirm("Deseja remover este loteamento?")) return;

        const item = loteamentos.find((i) => i.id === id);
        if (item?.foto_path) {
            await supabase.storage.from(BUCKET).remove([item.foto_path]);
        }

        await deleteImovel(id);
        await load();
    }

    useEffect(() => {
        load();
    }, []);

    const filtered = loteamentos.filter((i) =>
        (i.titulo || "").toLowerCase().includes(search.toLowerCase())
    );


    return (

        <div className="min-h-screen bg-background">
            <Sidebar />
            {/* coteudo ajustado*/}
            <main className="ml-16 overflow-y-auto">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Loteamentos</h1>
                            <p className="text-muted-foreground mt-1">Gerencie seus loteamentos cadastrados</p>
                        </div>
                        <Button className="gap-2" onClick={openNew}>
                            <Plus className="w-4 h-4" />Novo Loteamento
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar loteamentos..."
                                        className="pl-10"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                <Button variant="outline" className="gap-2">
                                    <Filter className="w-4 h-4" /> Filtros
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filtered.map((item) => (
                                    <Card
                                        key={item.id}
                                        className="overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                            {item.foto_url ? (
                                                <img
                                                    src={item.foto_url}
                                                    alt={item.titulo}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <p className="text-muted-foreground">
                                                    Imagem do loteamento
                                                </p>
                                            )}
                                        </div>


                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold line-clamp-1">
                                                        {item.titulo}
                                                    </h3>

                                                    <div className="flex items-center gap-2 mt-1">
                                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {item.endereco}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {item.descricao}
                                                    </p>
                                                </div>

                                                <Badge>{item.tipo}</Badge>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <BedDouble className="w-4 h-4" /> {item.quartos || 0}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Bath className="w-4 h-4" /> {item.banheiros || 0}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Maximize className="w-4 h-4" /> {item.area || 0}m²
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t flex items-center justify-between">
                                                <span className="text-xl font-bold text-primary">
                                                    R$ {(item.preco || 0).toLocaleString("pt-BR")}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEdit(item)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => remove(item.id)}
                                                    >
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>


                            {filtered.length === 0 && (
                                <div className="mt-6 text-center text-muted-foreground">
                                    Nenhum loteamento encontrado.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>


            </main>



            {/* MODAL */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Editar Loteamento" : "Novo Loteamento"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Input
                            placeholder="Título"
                            value={form.titulo}
                            onChange={(e) =>
                                setForm({ ...form, titulo: e.target.value })
                            }
                        />

                        <Input
                            placeholder="Descrição"
                            value={form.descricao}
                            onChange={(e) =>
                                setForm({ ...form, descricao: e.target.value })
                            }
                        />

                        <Input
                            placeholder="Endereço"
                            value={form.endereco}
                            onChange={(e) =>
                                setForm({ ...form, endereco: e.target.value })
                            }
                        />

                        <Input
                            placeholder="Preço"
                            type="number"
                            value={form.preco}
                            onChange={(e) =>
                                setForm({ ...form, preco: e.target.value })
                            }
                        />

                        <Input
                            placeholder="Área (m²)"
                            type="number"
                            value={form.area}
                            onChange={(e) =>
                                setForm({ ...form, area: e.target.value })
                            }
                        />

                        <div>
                            <label className="block text-sm mb-2">
                                Foto do loteamento
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setSelectedFile(e.target.files?.[0] || null)
                                }
                            />
                        </div>

                        <Button className="w-full mt-4" onClick={save}>
                            Salvar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Loteamentos;
