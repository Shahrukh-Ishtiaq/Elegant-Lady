import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "admin" | "moderator" | "user";
}

export const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (userId: string): "admin" | "moderator" | "user" => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || "user";
  };

  const toggleAdminRole = async (userId: string, currentRole: string) => {
    try {
      if (currentRole === "admin") {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: "user" })
          .eq("user_id", userId);

        if (error) throw error;
        toast.success("Admin role removed");
      } else {
        // Check if user has a role entry
        const existingRole = userRoles.find((r) => r.user_id === userId);
        
        if (existingRole) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: "admin" })
            .eq("user_id", userId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "admin" });

          if (error) throw error;
        }
        toast.success("Admin role granted");
      }
      
      fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({profiles.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {profiles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const role = getUserRole(profile.user_id);
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {profile.full_name || "No name"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {profile.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{profile.phone || "-"}</TableCell>
                      <TableCell>{profile.city || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={role === "admin" ? "default" : "secondary"}>
                          {role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(profile.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAdminRole(profile.user_id, role)}
                        >
                          {role === "admin" ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
