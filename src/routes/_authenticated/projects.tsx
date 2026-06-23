import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = {} } = useQuery({
    queryKey: ["project-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("project_id, amount");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data) map[r.project_id] = (map[r.project_id] ?? 0) + Number(r.amount);
      return map;
    },
  });

  const addProject = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("projects").insert({
        owner_id: userData.user!.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project added");
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setForm({ name: "", description: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Open a project, mark attendance, and expenses are calculated automatically.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addProject.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addProject.isPending}>Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}>
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  {p.description && <CardDescription className="line-clamp-2">{p.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Total expense</div>
                  <div className="text-2xl font-bold">PKR {(expenses[p.id] ?? 0).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-2">Started {new Date(p.start_date).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
