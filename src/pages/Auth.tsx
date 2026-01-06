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
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Handle OAuth callback and hash parameters
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      const errorDescription = hashParams.get("error_description");

      // Handle error from OAuth
      if (errorDescription) {
        toast.error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      // Check for password reset token
      if (type === "recovery") {
        setMode("reset");
        return;
      }

      // If there's an access token in the URL, we're returning from OAuth
      if (accessToken) {
        setIsProcessingOAuth(true);
        try {
          // Let Supabase handle the session from the URL
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('OAuth callback error:', error);
            toast.error("Authentication failed. Please try again.");
            setIsProcessingOAuth(false);
            return;
          }

          if (data.session) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            toast.success("Welcome to DAISY!");
            // Navigate to home
            navigate("/", { replace: true });
          }
        } catch (error) {
          console.error('OAuth processing error:', error);
          toast.error("Something went wrong. Please try again.");
        } finally {
          setIsProcessingOAuth(false);
        }
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && !isProcessingOAuth && user && mode !== "reset") {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate, mode, isProcessingOAuth]);

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
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        toast.error(error.message || "Failed to sign in with Google");
        setIsGoogleLoading(false);
      }
      // Don't set loading to false here as we're redirecting
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          navigate("/", { replace: true });
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
        
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: name },
          },
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully! Welcome to DAISY.");
          navigate("/", { replace: true });
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
          navigate("/", { replace: true });
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
      case "signup": return "Join DAISY for exclusive access";
      case "forgot": return "Enter your email to receive a reset link";
      case "reset": return "Enter your new password";
    }
  };

  // Show loading state while processing OAuth
  if (isProcessingOAuth || (authLoading && window.location.hash.includes('access_token'))) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="border-none shadow-elegant p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </div>
        </Card>
      </div>
    );
  }

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
              DAISY
            </h1>
          </Link>
          <p className="text-muted-foreground">Delicate Details, Distinctive You</p>
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

              {/* Toggle between login and signup */}
              {(mode === "login" || mode === "signup") && (
                <div className="text-center text-sm">
                  {mode === "login" ? (
                    <p>
                      Don't have an account?{" "}
                      <Button 
                        variant="link" 
                        className="px-0 font-semibold"
                        onClick={() => setMode("signup")}
                        disabled={isLoading}
                      >
                        Sign Up
                      </Button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="px-0 font-semibold"
                        onClick={() => setMode("login")}
                        disabled={isLoading}
                      >
                        Sign In
                      </Button>
                    </p>
                  )}
                </div>
              )}

              {mode === "forgot" && (
                <div className="text-center">
                  <Button 
                    variant="link" 
                    className="text-sm"
                    onClick={() => setMode("login")}
                    disabled={isLoading}
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.p 
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          By continuing, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Auth;