import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Failed to sign in with Google");
    } finally {
      setIsGoogleLoading(false);
    }
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
            <CardContent className="space-y-6">
              {/* Google Sign In Button - Only show for login/signup */}
              {(mode === "login" || mode === "signup") && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </>
              )}

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

              <div className="text-center">
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