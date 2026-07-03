import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RootRedirect() {
  const [dest, setDest] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setDest(data.user ? "/dashboard" : "/auth");
    });
  }, []);
  if (!dest) return null;
  return <Navigate to={dest} replace />;
}
