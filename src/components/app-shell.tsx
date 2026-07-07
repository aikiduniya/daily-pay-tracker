import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FolderKanban, LogOut, Phone, Mail, Globe } from "lucide-react";
import type { ReactNode } from "react";
import vertexLogo from "@/assets/vertex.jpeg.asset.json";


export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const navItem =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link to="/dashboard" className="font-bold text-lg mr-4">
              WorkTrack
            </Link>
            <Link to="/dashboard" className={navItem}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link to="/projects" className={navItem}>
              <FolderKanban className="h-4 w-4" /> Projects
            </Link>
            <Link to="/workers" className={navItem}>
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
