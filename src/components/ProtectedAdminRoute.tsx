import { useState, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

/**
 * ProtectedAdminRoute - Server-side verified admin route protection
 * 
 * This component provides defense-in-depth by:
 * 1. Checking client-side auth state (fast UX)
 * 2. Verifying admin role server-side via database query (security)
 * 
 * Even if an attacker manipulates client-side state, the server-side
 * verification ensures only actual admins can view admin components.
 * Database operations are already protected by RLS policies.
 */
export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyAdminRole = async () => {
      if (!user) {
        setIsVerifiedAdmin(false);
        setVerifying(false);
        return;
      }

      try {
        // Server-side verification: Query the database to confirm admin role
        // This query is protected by RLS and returns data only if the user has the role
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error("Error verifying admin role:", error);
          setIsVerifiedAdmin(false);
        } else {
          setIsVerifiedAdmin(!!data);
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        setIsVerifiedAdmin(false);
      } finally {
        setVerifying(false);
      }
    };

    if (!authLoading) {
      verifyAdminRole();
    }
  }, [user, authLoading]);

  // Show loading while auth or verification is in progress
  if (authLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to home if not verified admin
  if (!isVerifiedAdmin) {
    toast.error("Access denied. Admin privileges required.");
    return <Navigate to="/" replace />;
  }

  // Render admin content only after server-side verification
  return <>{children}</>;
};
