import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Building2, Shield, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import blsLogo from "@/assets/bls-logo.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "access">("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/dashboard");
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

  const accessTypes = [
    {
      icon: Shield,
      title: "Super Admin",
      description: "Full platform access. Invite-only by existing Super Admin.",
      action: "Contact your Super Admin for an invitation.",
      color: "text-red-400",
    },
    {
      icon: Building2,
      title: "Venue Manager",
      description: "Manage your venue details, menus, and seating.",
      action: "Request access from Super Admin to be assigned to your venue.",
      color: "text-blue-400",
    },
    {
      icon: Users,
      title: "Promoter",
      description: "Track your QR scans, registrations, and commissions.",
      action: "Promoter accounts are created by Admin.",
      link: "/promoter/login",
      linkText: "Go to Promoter Login",
      color: "text-green-400",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet/10 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-lg relative z-10 bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img 
              src={blsLogo} 
              alt="Bali Live Sessions" 
              className="h-16 w-auto invert"
            />
          </div>
          <CardDescription className="text-muted-foreground">
            Admin Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "access")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="access">Get Access</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@balilive.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    "Sign In"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <Link
                  to="/promoter/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Are you a promoter? Login here →
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="access" className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                All accounts are invite-only for security. Select your role to learn how to get access.
              </p>
              
              {accessTypes.map((type) => (
                <div
                  key={type.title}
                  className="p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <type.icon className={`w-5 h-5 mt-0.5 ${type.color}`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{type.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {type.action}
                      </p>
                      {type.link && (
                        <Link
                          to={type.link}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                        >
                          {type.linkText}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
