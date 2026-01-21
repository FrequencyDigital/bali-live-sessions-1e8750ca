import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import blsLogo from "@/assets/bls-logo.png";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthStep = "email" | "otp" | "success";

export default function PromoterLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("email");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/promoter/dashboard`,
        },
      });

      if (error) throw error;

      setStep("otp");
      toast({
        title: "Code sent!",
        description: "Check your email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      // Check if user is a promoter
      const { data: promoter, error: promoterError } = await supabase
        .from("promoters")
        .select("id, is_active, user_id")
        .eq("email", email)
        .maybeSingle();

      if (promoterError) throw promoterError;

      if (!promoter) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "No promoter account found for this email.",
          variant: "destructive",
        });
        setStep("email");
        setOtp("");
        return;
      }

      if (!promoter.is_active) {
        await supabase.auth.signOut();
        toast({
          title: "Account Disabled",
          description: "Your promoter account has been disabled. Contact admin.",
          variant: "destructive",
        });
        setStep("email");
        setOtp("");
        return;
      }

      // Link user_id if not already linked
      if (!promoter.user_id && data.user) {
        await supabase
          .from("promoters")
          .update({ user_id: data.user.id })
          .eq("id", promoter.id);
      }

      // Add promoter role if not exists
      if (data.user) {
        await supabase.from("user_roles").upsert(
          { user_id: data.user.id, role: "promoter" as any },
          { onConflict: "user_id,role" }
        );
      }

      toast({
        title: "Welcome!",
        description: "You're now logged in.",
      });
      
      navigate("/promoter/dashboard");
    } catch (error: any) {
      toast({
        title: "Invalid Code",
        description: error.message || "Please check the code and try again.",
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img src={blsLogo} alt="Bali Live Sessions" className="h-16 w-auto invert" />
          </div>
          <CardDescription className="text-muted-foreground">
            Promoter Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input/50 border-border/50 focus:border-primary"
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Login Code
                  </>
                )}
              </Button>
              <div className="text-center pt-4">
                <a
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin Login →
                </a>
              </div>
            </form>
          )}

          {step === "otp" && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-medium text-foreground">{email}</p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  onComplete={handleVerifyOTP}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyOTP}
                className="w-full gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify & Login"
                )}
              </Button>

              <button
                type="button"
                onClick={handleSendOTP}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={isLoading}
              >
                Resend code
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
