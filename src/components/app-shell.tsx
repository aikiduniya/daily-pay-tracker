import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FolderKanban, LogOut, Phone, Mail, Globe } from "lucide-react";
import type { ReactNode } from "react";



export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const navItem =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link to="/dashboard" className="mr-4">
              <img src="/vertex.jpeg" alt="Vertex Way" className="h-10 w-auto object-contain" />
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
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/vertex.jpeg" alt="Vertex Way" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <a href="tel:+971589357188" className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-4 w-4" /> +971 58 935 7188
            </a>
            <a href="mailto:info@vertexwayuae.info" className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-4 w-4" /> info@vertexwayuae.info
            </a>
            <a href="https://www.vertexwayuae.info" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
              <Globe className="h-4 w-4" /> www.vertexwayuae.info
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
