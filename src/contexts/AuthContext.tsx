import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check and profile update to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
            // Ensure email is saved to profile for admin display
            ensureProfileEmail(session.user.id, session.user.email, session.user.user_metadata?.full_name);
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        // Set loading to false after state change is handled
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        ensureProfileEmail(session.user.id, session.user.email, session.user.user_metadata?.full_name);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data && !error);
    } catch {
      setIsAdmin(false);
    }
  };

  const ensureProfileEmail = async (userId: string, email: string | undefined, fullName?: string) => {
    if (!email) return;
    
    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error checking profile:", fetchError);
        return;
      }

      if (existingProfile) {
        // Update email if it's different or missing
        if (!existingProfile.email || existingProfile.email !== email) {
          const updateData: { email: string; full_name?: string } = { email };
          if (fullName && !existingProfile.full_name) {
            updateData.full_name = fullName;
          }
          
          await supabase
            .from('profiles')
            .update(updateData)
            .eq('user_id', userId);
          console.log("Profile email updated");
        }
      } else {
        // Create profile if it doesn't exist (for OAuth users)
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email,
            full_name: fullName || null,
          });
        
        if (insertError && insertError.code !== '23505') {
          console.error("Error creating profile:", insertError);
        } else {
          console.log("Profile created for user");
        }
      }
    } catch (error) {
      console.error("Could not ensure profile email:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};