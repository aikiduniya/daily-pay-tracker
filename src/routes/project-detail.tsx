import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Status = "present" | "absent" | "half_day";

function amountFor(status: Status, wage: number) {
  if (status === "present") return wage;
  if (status === "half_day") return wage / 2;
  return 0;
}

const statusLabel: Record<Status, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half-day",
};

export default function ProjectDetail() {
  const { projectId = "" } = useParams();
  const qc = useQueryClient();

  const [workerId, setWorkerId] = useState<string>("");
  const [status, setStatus] = useState<Status>("present");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workers").select("*").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const effectiveDailyWage = (w: { wage_type: string; daily_wage: number | string; monthly_wage: number | string }) =>
    w.wage_type === "monthly" ? Number(w.monthly_wage) / 30 : Number(w.daily_wage);

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, workers(name, wage_type, daily_wage, monthly_wage)")
        .eq("project_id", projectId)
        .order("work_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mark = useMutation({
    mutationFn: async () => {
      if (!workerId) throw new Error("Please select a worker");
      const worker = workers.find((w) => w.id === workerId);
      if (!worker) throw new Error("Worker not found");
      const wage = effectiveDailyWage(worker);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("attendance").upsert(
        {
          owner_id: userData.user!.id,
          project_id: projectId,
          worker_id: workerId,
          work_date: date,
          status,
          daily_wage_snapshot: wage,
          amount: amountFor(status, wage),
        },
        { onConflict: "worker_id,project_id,work_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Attendance saved");
      qc.invalidateQueries({ queryKey: ["attendance", projectId] });
      qc.invalidateQueries({ queryKey: ["project-expenses"] });
      qc.invalidateQueries({ queryKey: ["worker-totals"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["attendance", projectId] });
      qc.invalidateQueries({ queryKey: ["project-expenses"] });
      qc.invalidateQueries({ queryKey: ["worker-totals"] });
    },
  });

  const totalExpense = attendance.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> All projects
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project?.name ?? "Project"}</h1>
        {project?.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
        <p className="text-sm text-muted-foreground mt-2">Total expense: <span className="font-semibold text-foreground">PKR {totalExpense.toLocaleString()}</span></p>
      </div>

      <Card>
        <CardHeader><CardTitle>Mark attendance</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); mark.mutate(); }} className="grid gap-4 sm:grid-cols-4 items-end">
            <div className="space-y-2 sm:col-span-2">
              <Label>Worker</Label>
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                <SelectContent>
                  {workers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Add a worker first</div>
                  ) : (
                    workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} (PKR {effectiveDailyWage(w).toLocaleString()} /day{w.wage_type === "monthly" ? " · monthly" : ""})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="half_day">Half-day</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={mark.isPending}>Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Attendance log</CardTitle></CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries yet. Mark attendance above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Wage</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((a) => {
                  const s = a.status as Status;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.work_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{(a as { workers: { name: string } | null }).workers?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s === "present" ? "default" : s === "absent" ? "destructive" : "secondary"}>
                          {statusLabel[s]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">PKR {Number(a.daily_wage_snapshot).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">PKR {Number(a.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove.mutate(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
