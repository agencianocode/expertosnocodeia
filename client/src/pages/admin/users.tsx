import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Download, 
  Filter,
  Mail,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserWithSubscription {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  subscription?: {
    id: string;
    status: string;
    startDate: string;
    endDate: string | null;
    plan?: {
      id: string;
      name: string;
      displayName: string;
      price: number;
      billingInterval: string;
    };
  };
  subscriptionCount?: number;
}

export default function AdminUsers() {
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [search, setSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: users, isLoading, refetch } = useQuery<UserWithSubscription[]>({
    queryKey: ["/api/admin/users", search, subscriptionFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        ...(search && { search }),
        ...(subscriptionFilter !== "all" && { subscriptionStatus: subscriptionFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Error al cargar usuarios");
      return response.json();
    },
  });

  const exportToCSV = () => {
    if (!users) return;

    const headers = ["Email", "Nombre", "Fecha Registro", "Último Login", "Plan", "Estado", "Precio"];
    const rows = users.map(user => [
      user.email,
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A",
      new Date(user.createdAt).toLocaleDateString("es-ES"),
      user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("es-ES") : "Nunca",
      user.subscription?.plan?.displayName || "Sin plan",
      user.subscription?.status || "Sin suscripción",
      user.subscription?.plan?.price ? `$${(user.subscription.plan.price / 100).toFixed(2)}` : "$0.00",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (user: UserWithSubscription) => {
    if (!user.subscription) {
      return <Badge variant="outline">Sin suscripción</Badge>;
    }

    const status = user.subscription.status;
    if (status === "active") {
      return <Badge className="bg-green-500">Activo</Badge>;
    } else if (status === "trial") {
      return <Badge className="bg-blue-500">Trial</Badge>;
    } else if (status === "cancelled") {
      return <Badge variant="destructive">Cancelado</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="text-gray-400">No tienes privilegios de administrador.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                <p className="text-gray-400">Administra usuarios y suscripciones</p>
              </div>
              <Button onClick={exportToCSV} className="bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {/* Filters */}
            <Card className="bg-slate-900/50 border-slate-700 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Email, nombre..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Estado de Suscripción</label>
                    <Select
                      value={subscriptionFilter}
                      onValueChange={(value) => {
                        setSubscriptionFilter(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Activos</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="cancelled">Cancelados</SelectItem>
                        <SelectItem value="none">Sin suscripción</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios ({users?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !users || users.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron usuarios</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Usuario</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Plan</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Estado</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Registro</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Último Login</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-white">
                                    {user.firstName || user.lastName 
                                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                      : "Sin nombre"}
                                  </div>
                                  <div className="text-sm text-gray-400 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {user.subscription?.plan ? (
                                  <div>
                                    <div className="text-white font-medium">
                                      {user.subscription.plan.displayName}
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      ${(user.subscription.plan.price / 100).toFixed(2)}/{user.subscription.plan.billingInterval === 'year' ? 'año' : 'mes'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Sin plan</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {getStatusBadge(user)}
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-300 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(user.createdAt).toLocaleDateString("es-ES")}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-300">
                                  {user.lastLoginAt 
                                    ? new Date(user.lastLoginAt).toLocaleDateString("es-ES")
                                    : <span className="text-gray-500">Nunca</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-400">
                        Página {currentPage}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => p + 1)}
                          disabled={!users || users.length < pageSize}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

