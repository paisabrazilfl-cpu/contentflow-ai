import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, DollarSign, Activity, Shield, Inbox
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: adminStats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: adminUsers, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: adminBusinesses } = trpc.admin.businesses.useQuery(undefined, { enabled: user?.role === "admin" });

  const processAllMutation = trpc.content.runWorkerAll.useMutation({
    onSuccess: (data) => toast.success(`Worker: ${data.processed} published, ${data.failed} failed`),
    onError: (err) => toast.error(err.message),
  });

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Shield className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-sm mt-1">You need admin privileges to view this page</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">Platform administration and monitoring</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => processAllMutation.mutate()}
              disabled={processAllMutation.isPending}>
              <Activity className="w-4 h-4 mr-2" /> Run Publishing Worker
            </Button>
            <Badge className="gradient-orange text-black font-semibold">Admin Access</Badge>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  {statsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{adminStats?.totalUsers || 0}</p>}
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  {statsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{adminStats?.totalBusinesses || 0}</p>}
                  <p className="text-xs text-muted-foreground">Total Businesses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  {statsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{adminStats?.activeSubscriptions || 0}</p>}
                  <p className="text-xs text-muted-foreground">Active Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  {statsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{adminBusinesses?.length || 0}</p>}
                  <p className="text-xs text-muted-foreground">Workspaces</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="businesses" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Activity className="w-4 h-4 mr-2" /> Businesses
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                {usersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : adminUsers && adminUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-3 px-2">ID</th>
                          <th className="text-left py-3 px-2">Name</th>
                          <th className="text-left py-3 px-2">Email</th>
                          <th className="text-left py-3 px-2">Role</th>
                          <th className="text-left py-3 px-2">Plan</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((u) => (
                          <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                            <td className="py-3 px-2">{u.id}</td>
                            <td className="py-3 px-2 font-medium">{u.name || "—"}</td>
                            <td className="py-3 px-2">{u.email || "—"}</td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className={u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : ""}>
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">{u.planTier || "free"}</td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className={
                                u.subscriptionStatus === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                u.subscriptionStatus === "trialing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                "bg-muted text-muted-foreground"
                              }>
                                {u.subscriptionStatus || "none"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Inbox className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Businesses Tab */}
          <TabsContent value="businesses">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                {adminBusinesses && adminBusinesses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-3 px-2">ID</th>
                          <th className="text-left py-3 px-2">Name</th>
                          <th className="text-left py-3 px-2">Industry</th>
                          <th className="text-left py-3 px-2">Owner ID</th>
                          <th className="text-left py-3 px-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminBusinesses.map((b) => (
                          <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                            <td className="py-3 px-2">{b.id}</td>
                            <td className="py-3 px-2 font-medium">{b.name}</td>
                            <td className="py-3 px-2">{b.industry || "—"}</td>
                            <td className="py-3 px-2">{b.userId}</td>
                            <td className="py-3 px-2 text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Inbox className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No businesses created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
