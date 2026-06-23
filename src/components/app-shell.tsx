import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FolderKanban, LogOut } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const navItem =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";
  const activeProps = { className: "bg-accent text-foreground" };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link to="/dashboard" className="font-bold text-lg mr-4">
              WorkTrack
            </Link>
            <Link to="/dashboard" className={navItem} activeProps={activeProps}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link to="/projects" className={navItem} activeProps={activeProps}>
              <FolderKanban className="h-4 w-4" /> Projects
            </Link>
            <Link to="/workers" className={navItem} activeProps={activeProps}>
              <Users className="h-4 w-4" /> Workers
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
