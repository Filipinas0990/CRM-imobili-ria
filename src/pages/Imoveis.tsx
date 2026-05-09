import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MapPin, BedDouble, Bath, Maximize, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { imovelService, type Imovel } from "@/services/imovel.service";

const STALE = 1000 * 60 * 5;

const emptyForm = {
  titulo: "",
  descricao: "",
  preco: "",
  endereco: "",
  tipo: "",
  quartos: "",
  banheiros: "",
  area: "",
};

const Imoveis = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Imovel | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const queryClient = useQueryClient();

  const { data: imoveis = [], isLoading } = useQuery({
    queryKey: ["imoveis"],
    queryFn: () => imovelService.getAll(),
    staleTime: STALE,
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(imovel: Imovel) {
    setEditing(imovel);
    setForm({
      titulo: imovel.titulo ?? "",
      descricao: imovel.descricao ?? "",
      preco: imovel.preco != null ? String(imovel.preco) : "",
      endereco: imovel.endereco ?? "",
      tipo: imovel.tipo ?? "",
      quartos: imovel.quartos != null ? String(imovel.quartos) : "",
      banheiros: imovel.banheiros != null ? String(imovel.banheiros) : "",
      area: imovel.area != null ? String(imovel.area) : "",
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.titulo?.trim()) {
      alert("Título é obrigatório");
      return;
    }

    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || undefined,
      endereco: form.endereco || undefined,
      tipo: form.tipo || undefined,
      preco: form.preco ? Number(form.preco) : undefined,
      area: form.area ? Number(form.area) : undefined,
      quartos: form.quartos ? Number(form.quartos) : undefined,
      banheiros: form.banheiros ? Number(form.banheiros) : undefined,
    };

    setSalvando(true);
    try {
      if (editing) {
        await imovelService.update(editing.id, payload);
      } else {
        await imovelService.create(payload);
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      queryClient.invalidateQueries({ queryKey: ["imoveis-select"] });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Erro ao salvar imóvel");
    } finally {
      setSalvando(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Tem certeza que deseja remover este imóvel?")) return;
    try {
      await imovelService.delete(id);
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      queryClient.invalidateQueries({ queryKey: ["imoveis-select"] });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Erro ao remover imóvel");
    }
  }

  const filtered = imoveis.filter((i) =>
    (i.titulo || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-16 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Imóveis</h1>
              <p className="text-muted-foreground mt-1">Gerencie seu portfólio de imóveis</p>
            </div>
            <Button className="gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" /> Novo Imóvel
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar imóveis..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" /> Filtros
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((property) => (
                      <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">Sem imagem</p>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold line-clamp-1">{property.titulo}</h3>
                              {property.endereco && (
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{property.endereco}</span>
                                </div>
                              )}
                              {property.descricao && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {property.descricao}
                                </p>
                              )}
                            </div>
                            <Badge>{property.tipo || "—"}</Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{property.quartos || 0}</div>
                            <div className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.banheiros || 0}</div>
                            <div className="flex items-center gap-1"><Maximize className="w-4 h-4" />{property.area || 0}m²</div>
                          </div>

                          <div className="pt-3 border-t flex items-center justify-between">
                            <span className="text-xl font-bold text-primary">
                              R$ {(property.preco || 0).toLocaleString("pt-BR")}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEdit(property)}>Editar</Button>
                              <Button size="sm" variant="destructive" onClick={() => remove(property.id)}>Excluir</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <div className="mt-6 text-center text-muted-foreground">
                      Nenhum imóvel encontrado.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Imóvel" : "Novo Imóvel"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input placeholder="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <Input placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <Input placeholder="Tipo (ex: Apartamento, Casa)" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
            <Input placeholder="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            <Input placeholder="Preço (R$)" type="number" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Quartos" type="number" value={form.quartos} onChange={(e) => setForm({ ...form, quartos: e.target.value })} />
              <Input placeholder="Banheiros" type="number" value={form.banheiros} onChange={(e) => setForm({ ...form, banheiros: e.target.value })} />
              <Input placeholder="Área (m²)" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            </div>

            <Button className="w-full mt-2" onClick={save} disabled={salvando}>
              {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Imoveis;
