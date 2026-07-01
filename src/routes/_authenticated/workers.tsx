import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/workers")({
  component: WorkersPage,
});

type WageType = "daily" | "monthly";

const emptyForm = { name: "", phone: "", wage_type: "daily" as WageType, daily_wage: "", monthly_wage: "" };


function WorkersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    wage_type: WageType;
    daily_wage: string;
    monthly_wage: string;
  }>({ name: "", phone: "", wage_type: "daily", daily_wage: "", monthly_wage: "" });

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: totals = {} } = useQuery({
    queryKey: ["worker-totals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("worker_id, amount, status");
      if (error) throw error;
      const map: Record<string, { earned: number; days: number }> = {};
      for (const r of data) {
        const key = r.worker_id;
        if (!map[key]) map[key] = { earned: 0, days: 0 };
        map[key].earned += Number(r.amount);
        if (r.status !== "absent") map[key].days += r.status === "half_day" ? 0.5 : 1;
      }
      return map;
    },
  });

  const addWorker = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const daily = form.wage_type === "daily" ? Number(form.daily_wage) : 0;
      const monthly = form.wage_type === "monthly" ? Number(form.monthly_wage) : 0;
      const { error } = await supabase.from("workers").insert({
        owner_id: userData.user!.id,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        wage_type: form.wage_type,
        daily_wage: daily,
        monthly_wage: monthly,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Worker added");
      qc.invalidateQueries({ queryKey: ["workers"] });
      setOpen(false);
      setForm({ name: "", phone: "", wage_type: "daily", daily_wage: "", monthly_wage: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteWorker = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Worker deleted");
      qc.invalidateQueries({ queryKey: ["workers"] });
      qc.invalidateQueries({ queryKey: ["worker-totals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground mt-1">Manage workers with daily or monthly wages and track their total earnings.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Worker</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New worker</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); addWorker.mutate(); }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Wage type</Label>
                <Select value={form.wage_type} onValueChange={(v) => setForm({ ...form, wage_type: v as WageType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily wage</SelectItem>
                    <SelectItem value="monthly">Monthly salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.wage_type === "daily" ? (
                <div className="space-y-2">
                  <Label>Daily wage (PKR)</Label>
                  <Input type="number" min="0" step="0.01" required value={form.daily_wage} onChange={(e) => setForm({ ...form, daily_wage: e.target.value })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Monthly salary (PKR)</Label>
                  <Input type="number" min="0" step="0.01" required value={form.monthly_wage} onChange={(e) => setForm({ ...form, monthly_wage: e.target.value })} />
                  <p className="text-xs text-muted-foreground">Per-day rate is calculated as monthly salary ÷ 30.</p>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={addWorker.isPending}>Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All workers</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : workers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No workers yet. Add one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Wage</TableHead>
                  <TableHead className="text-right">Days worked</TableHead>
                  <TableHead className="text-right">Total earned</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((w) => {
                  const t = totals[w.id] ?? { earned: 0, days: 0 };
                  const isMonthly = w.wage_type === "monthly";
                  const wage = isMonthly ? Number(w.monthly_wage) : Number(w.daily_wage);
                  return (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell>{w.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={isMonthly ? "secondary" : "default"}>
                          {isMonthly ? "Monthly" : "Daily"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        PKR {wage.toLocaleString()}{isMonthly ? " /mo" : " /day"}
                      </TableCell>
                      <TableCell className="text-right">{t.days}</TableCell>
                      <TableCell className="text-right font-medium">PKR {t.earned.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteWorker.mutate(w.id)}>
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
