import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Lock, Shield } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const navigate = useNavigate();

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const passwordStrength = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  useEffect(() => {
    let mounted = true;

    const validateResetToken = async () => {
      try {
        console.log("Validating reset token...");
        console.log("Current URL:", window.location.href);
        console.log("Hash:", window.location.hash);

        // Parse hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const errorCode = hashParams.get("error_code");
        const errorDescription = hashParams.get("error_description");

        console.log("Token type:", type);
        console.log("Access token exists:", !!accessToken);
        console.log("Refresh token exists:", !!refreshToken);
        console.log("Error code:", errorCode);
        console.log("Error description:", errorDescription);

        // Handle expired or invalid token error from URL
        if (errorCode || errorDescription) {
          console.error("Token error from URL:", errorCode, errorDescription);
          if (mounted) {
            if (errorDescription?.includes("expired") || errorCode === "otp_expired") {
              setTokenExpired(true);
            }
            setIsValidToken(false);
            setIsValidating(false);
          }
          return;
        }

        // Check if this is a recovery flow with tokens
        if (type === "recovery" && accessToken && refreshToken) {
          console.log("Attempting to set session with recovery tokens...");
          
          // Set the session using the tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Failed to set session:", error);
            if (mounted) {
              if (error.message.includes("expired") || error.message.includes("invalid") || error.message.includes("Refresh")) {
                setTokenExpired(true);
              }
              setIsValidToken(false);
              setIsValidating(false);
            }
            return;
          }

          if (data.session?.user) {
            console.log("Session established successfully for:", data.session.user.email);
            if (mounted) {
              setUserEmail(data.session.user.email || null);
              setIsValidToken(true);
              setIsValidating(false);
            }
            // Clear the hash from URL for cleaner appearance
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        // If no valid recovery params, check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if we're in a password recovery context
          console.log("Existing session found for:", session.user.email);
          if (mounted) {
            setUserEmail(session.user.email || null);
            setIsValidToken(true);
            setIsValidating(false);
          }
          return;
        }

        // No valid token or session found
        console.log("No valid recovery token or session found");
        if (mounted) {
          setIsValidToken(false);
          setIsValidating(false);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        if (mounted) {
          setIsValidToken(false);
          setIsValidating(false);
        }
      }
    };

    validateResetToken();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (passwordStrength < 3) {
      toast.error("Please use a stronger password with a mix of characters");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Updating password...");
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Password update error:", error);
        if (error.message.includes("expired") || error.message.includes("invalid") || error.message.includes("session")) {
          setTokenExpired(true);
          setIsValidToken(false);
          toast.error("Your session has expired. Please request a new password reset link.");
        } else if (error.message.includes("same as") || error.message.includes("different")) {
          toast.error("New password must be different from your current password");
        } else {
          toast.error(error.message || "Failed to update password");
        }
        return;
      }

      console.log("Password updated successfully!");
      setIsSuccess(true);
      toast.success("Password updated successfully!");
      
      // Auto-login is already done since user has active session
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2500);

    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-destructive";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/">
              <h1 className="text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent mb-2">
                DAISY
              </h1>
            </Link>
            <p className="text-muted-foreground">Delicate Details, Distinctive You</p>
          </motion.div>
          
          <Card className="border-none shadow-elegant p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating your reset link...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!isValidToken) {
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

          <Card className="border-none shadow-elegant">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">
                {tokenExpired ? "Link Expired" : "Invalid Reset Link"}
              </CardTitle>
              <CardDescription>
                {tokenExpired 
                  ? "This password reset link has expired for security reasons."
                  : "This password reset link is invalid or has already been used."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Password reset links expire after 1 hour and can only be used once.
                Please request a new password reset link.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full" size="lg">
                  <Link to="/auth?mode=forgot">Request New Reset Link</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Success state
  if (isSuccess) {
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

          <Card className="border-none shadow-elegant">
            <CardHeader className="text-center">
              <motion.div 
                className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <CheckCircle className="h-8 w-8 text-green-600" />
              </motion.div>
              <CardTitle className="text-2xl">Password Updated!</CardTitle>
              <CardDescription>
                Your DAISY account password has been successfully changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                You are now logged in. Redirecting to home...
              </p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Redirecting...</span>
              </div>
              <Button variant="outline" asChild className="w-full mt-4">
                <Link to="/">Go to Home Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Reset password form
  return (
    <motion.div 
      className="min-h-screen bg-gradient-soft flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </motion.div>

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
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription>
                Create a strong password for your DAISY account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Email Display (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Account Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail || ""}
                  disabled
                  className="bg-muted/50 cursor-not-allowed font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  This is the email associated with your DAISY account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength ? getStrengthColor() : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        passwordStrength <= 2 ? "text-destructive" : 
                        passwordStrength <= 3 ? "text-yellow-600" : "text-green-600"
                      }`}>
                        Password strength: {getStrengthText()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                {password.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Password must have:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-green-600" : "text-muted-foreground"}`}>
                        {hasMinLength ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpperCase ? "text-green-600" : "text-muted-foreground"}`}>
                        {hasUpperCase ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        Uppercase letter
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLowerCase ? "text-green-600" : "text-muted-foreground"}`}>
                        {hasLowerCase ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        Lowercase letter
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? "text-green-600" : "text-muted-foreground"}`}>
                        {hasNumber ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        Number
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpecialChar ? "text-green-600" : "text-muted-foreground"}`}>
                        {hasSpecialChar ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        Special character
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  {confirmPassword.length > 0 && (
                    <div className={`flex items-center gap-1.5 text-xs ${
                      passwordsMatch ? "text-green-600" : "text-destructive"
                    }`}>
                      {passwordsMatch ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading || !passwordsMatch || passwordStrength < 3}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <Button variant="link" asChild className="text-sm">
                  <Link to="/auth">Back to Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;