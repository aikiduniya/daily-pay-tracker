import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, Wallet, CalendarCheck } from "lucide-react";

export default function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [workers, projects, attendance] = await Promise.all([
        supabase.from("workers").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("amount, status, work_date"),
      ]);
      const rows = attendance.data ?? [];
      const totalExpense = rows.reduce((s, r) => s + Number(r.amount), 0);
      const today = new Date().toISOString().slice(0, 10);
      const todayCount = rows.filter((r) => r.work_date === today && r.status !== "absent").length;
      return {
        workers: workers.count ?? 0,
        projects: projects.count ?? 0,
        totalExpense,
        todayCount,
      };
    },
  });

  const stats = [
    { label: "Total Projects", value: data?.projects ?? 0, icon: FolderKanban },
    { label: "Total Workers", value: data?.workers ?? 0, icon: Users },
    { label: "Today's Attendance", value: data?.todayCount ?? 0, icon: CalendarCheck },
    { label: "Total Expense (PKR)", value: (data?.totalExpense ?? 0).toLocaleString(), icon: Wallet },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your projects and labor expenses.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/projects" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FolderKanban className="h-5 w-5" /> Manage Projects</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Add projects, mark daily attendance, and see total expenses.
            </CardContent>
          </Card>
        </Link>
        <Link to="/workers" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Manage Workers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Add workers with daily or monthly wages and track earnings automatically.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
