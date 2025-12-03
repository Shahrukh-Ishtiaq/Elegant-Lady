import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

type AuthMode = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && mode !== "reset") {
      navigate("/");
    }
  }, [user, navigate, mode]);

  // Check for password reset token in URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setMode("reset");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          navigate("/");
        }
      } else if (mode === "signup") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully! Welcome to Elegant Lady.");
          navigate("/");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth#type=recovery`,
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password reset link sent to your email!");
          setMode("login");
        }
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password updated successfully!");
          navigate("/");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome Back";
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      case "reset": return "Set New Password";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login": return "Sign in to your account to continue";
      case "signup": return "Join Elegant Lady for exclusive access";
      case "forgot": return "Enter your email to receive a reset link";
      case "reset": return "Enter your new password";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent mb-2">
              Elegant Lady
            </h1>
          </Link>
          <p className="text-muted-foreground">Seamless comfort anytime</p>
        </div>

        <Card className="border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl">{getTitle()}</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}
              
              {mode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {(mode === "login" || mode === "signup" || mode === "reset") && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {mode === "reset" ? "New Password" : "Password"}
                  </Label>
                  <PasswordInput 
                    id="password" 
                    placeholder={mode === "reset" ? "Enter new password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              )}

              {mode === "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput 
                    id="confirmPassword" 
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <Button 
                    type="button"
                    variant="link" 
                    className="px-0 text-sm"
                    onClick={() => setMode("forgot")}
                    disabled={isLoading}
                  >
                    Forgot Password?
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Signing In..." : 
                     mode === "signup" ? "Creating Account..." :
                     mode === "forgot" ? "Sending..." : "Updating..."}
                  </>
                ) : (
                  mode === "login" ? "Sign In" : 
                  mode === "signup" ? "Create Account" :
                  mode === "forgot" ? "Send Reset Link" : "Update Password"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {mode === "login" && (
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Button 
                    variant="link" 
                    className="px-0"
                    onClick={() => setMode("signup")}
                    disabled={isLoading}
                  >
                    Sign Up
                  </Button>
                </p>
              )}
              {mode === "signup" && (
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button 
                    variant="link" 
                    className="px-0"
                    onClick={() => setMode("login")}
                    disabled={isLoading}
                  >
                    Sign In
                  </Button>
                </p>
              )}
              {(mode === "forgot" || mode === "reset") && (
                <p className="text-sm text-muted-foreground">
                  <Button 
                    variant="link" 
                    className="px-0"
                    onClick={() => setMode("login")}
                    disabled={isLoading}
                  >
                    Back to Sign In
                  </Button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/">
            <Button variant="ghost">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;