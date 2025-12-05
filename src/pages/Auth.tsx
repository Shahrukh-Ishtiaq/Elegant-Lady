import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

// Common disposable email domains to block
const DISPOSABLE_DOMAINS = [
  'tempmail', 'throwaway', 'guerrillamail', 'mailinator', 'temp-mail',
  'fakeinbox', 'sharklasers', '10minutemail', 'yopmail', 'trashmail'
];

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

  const validateEmail = (email: string): { valid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, message: "Please enter a valid email address" };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    
    // Check for disposable email domains
    if (DISPOSABLE_DOMAINS.some(d => domain.includes(d))) {
      return { valid: false, message: "Please use a real email address, not a temporary one" };
    }

    // Check for common typos in popular domains
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const typoPatterns = [
      { pattern: /gmai[l]?\.(com|co)$/i, correct: 'gmail.com' },
      { pattern: /gmial\.com$/i, correct: 'gmail.com' },
      { pattern: /gamil\.com$/i, correct: 'gmail.com' },
      { pattern: /yaho[o]?\.(com|co)$/i, correct: 'yahoo.com' },
      { pattern: /hotmai[l]?\.(com|co)$/i, correct: 'hotmail.com' },
    ];

    for (const { pattern, correct } of typoPatterns) {
      if (pattern.test(domain) && domain !== correct) {
        return { valid: false, message: `Did you mean ${email.split('@')[0]}@${correct}?` };
      }
    }

    return { valid: true };
  };

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
        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          toast.error(emailValidation.message);
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }

        if (!name.trim()) {
          toast.error("Please enter your name");
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
    <motion.div 
      className="min-h-screen bg-gradient-soft flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-md">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link to="/">
            <h1 className="text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent mb-2">
              Elegant Lady
            </h1>
          </Link>
          <p className="text-muted-foreground">Seamless comfort anytime</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
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
                    {mode === "signup" && (
                      <p className="text-xs text-muted-foreground">
                        Please use your real email address for account verification
                      </p>
                    )}
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
        </motion.div>

        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link to="/">
            <Button variant="ghost">
              ← Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Auth;