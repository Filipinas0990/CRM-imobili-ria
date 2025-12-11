import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const servicesData = [
    { id: 1, name: "Avaliação de Imóveis", type: "Consultoria", status: "ativo", price: "R$ 150,00" },
    { id: 2, name: "Captação de Clientes", type: "Marketing", status: "ativo", price: "R$ 300,00" },
    { id: 3, name: "Visita Guiada", type: "Serviço", status: "inativo", price: "R$ 50,00" },
];

const Servicos = () => {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
                        <p className="text-muted-foreground mt-2">Gerencie seus serviços e consultorias</p>
                    </div>

                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Novo Serviço
                    </Button>
                </div>

                {/* Card de Serviços */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Buscar serviços..." className="pl-10" />
                            </div>
                            <Button variant="outline" className="gap-2">
                                <Filter className="w-4 h-4" />
                                Filtros
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {servicesData.map((service) => (
                                <div
                                    key={service.id}
                                    className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <span>{service.type}</span>
                                            <Badge variant={service.status === "ativo" ? "default" : "secondary"}>
                                                {service.status === "ativo" ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium text-foreground">{service.price}</span>
                                        <Button variant="outline" size="sm">
                                            Ver Detalhes
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default Servicos;
