import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Filter,
    MapPin,
    BedDouble,
    Bath,
    Maximize,
    Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "imoveis";

const Financiamentos = () => {
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [form, setForm] = useState<any>({
        titulo: "",
        descricao: "",
        endereco: "",
        preco: "",
        quartos: "",
        banheiros: "",
        area: "",
        tipo: "Financiamento",
    });

    function openNew() {
        setEditing(null);
        setSelectedFile(null);
        setForm({
            titulo: "",
            descricao: "",
            endereco: "",
            preco: "",
            quartos: "",
            banheiros: "",
            area: "",
            tipo: "Financiamento",
        });
        setModalOpen(true);
    }

    function openEdit(item: any) {
        setEditing(item);
        setSelectedFile(null);
        setForm({
            titulo: item.titulo,
            descricao: item.descricao,
            endereco: item.endereco,
            preco: item.preco,
            quartos: item.quartos,
            banheiros: item.banheiros,
            area: item.area,
            tipo: item.tipo,
        });
        setModalOpen(true);
    }

    async function load() {
        const { data } = await supabase
            .from("imoveis")
            .select("*")
            .eq("tipo", "Financiamento");

        if (!data) {
            setItems([]);
            return;
        }

        const withImages = await Promise.all(
            data.map(async (item: any) => {
                if (!item.foto_path) return item;

                const { data: url } = await supabase.storage
                    .from(BUCKET)
                    .createSignedUrl(item.foto_path, 3600);

                return { ...item, foto_url: url?.signedUrl };
            })
        );

        setItems(withImages);
    }

    async function uploadFile(id: string, file: File) {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const filePath = `${id}/${fileName}`;

        await supabase.storage.from(BUCKET).upload(filePath, file);
        return filePath;
    }

    async function save() {
        if (!form.titulo?.trim()) {
            alert("Título é obrigatório");
            return;
        }

        const payload = {
            ...form,
            tipo: "Financiamento",
            preco: form.preco ? Number(form.preco) : null,
            quartos: form.quartos ? Number(form.quartos) : null,
            banheiros: form.banheiros ? Number(form.banheiros) : null,
            area: form.area ? Number(form.area) : null,
        };

        if (editing) {
            await supabase.from("imoveis").update(payload).eq("id", editing.id);

            if (selectedFile) {
                const path = await uploadFile(editing.id, selectedFile);
                await supabase
                    .from("imoveis")
                    .update({ foto_path: path })
                    .eq("id", editing.id);
            }
        } else {
            const { data } = await supabase
                .from("imoveis")
                .insert(payload)
                .select()
                .single();

            if (data && selectedFile) {
                const path = await uploadFile(data.id, selectedFile);
                await supabase
                    .from("imoveis")
                    .update({ foto_path: path })
                    .eq("id", data.id);
            }
        }

        setModalOpen(false);
        await load();
    }

    async function remove(id: string) {
        if (!confirm("Deseja remover este financiamento?")) return;

        const item = items.find((i) => i.id === id);
        if (item?.foto_path) {
            await supabase.storage.from(BUCKET).remove([item.foto_path]);
        }

        await supabase.from("imoveis").delete().eq("id", id);
        await load();
    }

    useEffect(() => {
        load();
    }, []);

    const filtered = items.filter((i) =>
        (i.titulo || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            <main className="ml-16 overflow-y-auto">
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Financiamentos</h1>
                            <p className="text-muted-foreground">
                                Gerencie imóveis financiados
                            </p>
                        </div>

                        <Button onClick={openNew} className="gap-2">
                            <Plus className="w-4 h-4" /> Novo Financiamento
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar financiamentos..."
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
                                    <Card key={item.id}>
                                        <div className="h-48 bg-muted flex items-center justify-center">
                                            {item.foto_url ? (
                                                <img
                                                    src={item.foto_url}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Upload className="w-10 h-10 text-muted-foreground" />
                                            )}
                                        </div>

                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between">
                                                <h3 className="font-semibold">{item.titulo}</h3>
                                                <Badge>{item.tipo}</Badge>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4" /> {item.endereco}
                                            </div>

                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <BedDouble className="w-4 h-4" /> {item.quartos || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Bath className="w-4 h-4" /> {item.banheiros || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Maximize className="w-4 h-4" /> {item.area || 0}m²
                                                </span>
                                            </div>

                                            <div className="pt-3 border-t flex justify-between">
                                                <span className="font-bold text-primary">
                                                    R$ {(item.preco || 0).toLocaleString("pt-BR")}
                                                </span>

                                                <div className="flex gap-2">
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
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Editar Financiamento" : "Novo Financiamento"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
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
                            placeholder="Quartos"
                            type="number"
                            value={form.quartos}
                            onChange={(e) =>
                                setForm({ ...form, quartos: e.target.value })
                            }
                        />
                        <Input
                            placeholder="Banheiros"
                            type="number"
                            value={form.banheiros}
                            onChange={(e) =>
                                setForm({ ...form, banheiros: e.target.value })
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

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setSelectedFile(e.target.files?.[0] || null)
                            }
                        />

                        <Button className="w-full" onClick={save}>
                            Salvar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Financiamentos;
