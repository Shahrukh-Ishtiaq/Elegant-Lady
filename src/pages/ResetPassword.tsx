import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
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
    const validateResetToken = async () => {
      try {
        // Check URL hash for recovery token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        const errorDescription = hashParams.get("error_description");

        // Handle expired or invalid token error from Supabase
        if (errorDescription) {
          console.error("Token error:", errorDescription);
          if (errorDescription.includes("expired") || errorDescription.includes("invalid")) {
            setTokenExpired(true);
          }
          setIsValidToken(false);
          return;
        }

        // Check if this is a recovery flow
        if (type === "recovery" && accessToken) {
          // Get the current session to verify the token is valid
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Session error:", error);
            if (error.message.includes("expired") || error.message.includes("invalid")) {
              setTokenExpired(true);
            }
            setIsValidToken(false);
            return;
          }

          if (session?.user) {
            setUserEmail(session.user.email || null);
            setIsValidToken(true);
          } else {
            // Try to set session from URL tokens
            const refreshToken = hashParams.get("refresh_token");
            if (accessToken && refreshToken) {
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error("Set session error:", sessionError);
                if (sessionError.message.includes("expired") || sessionError.message.includes("invalid")) {
                  setTokenExpired(true);
                }
                setIsValidToken(false);
                return;
              }

              if (data.user) {
                setUserEmail(data.user.email || null);
                setIsValidToken(true);
              } else {
                setIsValidToken(false);
              }
            } else {
              setIsValidToken(false);
            }
          }
        } else {
          // No recovery token found
          setIsValidToken(false);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setIsValidToken(false);
      }
    };

    validateResetToken();
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
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Password update error:", error);
        if (error.message.includes("expired") || error.message.includes("invalid")) {
          setTokenExpired(true);
          setIsValidToken(false);
          toast.error("This reset link has expired. Please request a new one.");
        } else if (error.message.includes("same as")) {
          toast.error("New password must be different from your current password");
        } else {
          toast.error(error.message || "Failed to update password");
        }
        return;
      }

      // Success!
      setIsSuccess(true);
      toast.success("Password updated successfully!");
      
      // Sign out and redirect to login after a short delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
      }, 3000);

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
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="border-none shadow-elegant p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating reset link...</p>
          </div>
        </Card>
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
                  <Link to="/auth">Request New Reset Link</Link>
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
                Your password has been successfully changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                You will be redirected to the login page in a moment...
              </p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Redirecting...</span>
              </div>
              <Button variant="outline" asChild className="w-full mt-4">
                <Link to="/auth">Go to Login Now</Link>
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
                Create a strong password for your account
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
                  className="bg-muted/50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  This is the email associated with your account
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
                    <p className={`text-xs flex items-center gap-1.5 ${passwordsMatch ? "text-green-600" : "text-destructive"}`}>
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Passwords do not match
                        </>
                      )}
                    </p>
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
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>

              {/* Security Note */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  <Shield className="inline h-3.5 w-3.5 mr-1" />
                  Your password is securely encrypted and never stored in plain text
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p 
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Remember your password?{" "}
          <Link to="/auth" className="underline hover:text-primary font-medium">
            Sign In
          </Link>
        </motion.p>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
