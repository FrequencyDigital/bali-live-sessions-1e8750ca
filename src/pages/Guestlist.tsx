import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { format } from "date-fns";
import blsLogo from "@/assets/bls-logo.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common nationalities for Bali
const NATIONALITIES = [
  "Indonesian",
  "Australian",
  "British",
  "American",
  "Dutch",
  "German",
  "French",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Indian",
  "Singaporean",
  "Malaysian",
  "Canadian",
  "New Zealander",
  "Brazilian",
  "Italian",
  "Spanish",
  "Other",
];

export default function Guestlist() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");

  // Fetch promoter event QR data
  const { data: qrData, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ["guestlist-qr", code],
    queryFn: async () => {
      if (!code) return null;

      const { data, error } = await supabase
        .from("promoter_event_qr")
        .select(`
          id,
          promoter_id,
          event_id,
          qr_code_identifier,
          promoters (
            id,
            name,
            logo_url
          ),
          events (
            id,
            name,
            date,
            time,
            venue,
            description,
            image_url,
            status
          )
        `)
        .eq("qr_code_identifier", code)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  // Track QR scan
  useEffect(() => {
    if (qrData?.promoter_id && qrData?.event_id) {
      // Record the scan (fire and forget)
      supabase
        .from("qr_scans")
        .insert({
          promoter_id: qrData.promoter_id,
          event_id: qrData.event_id,
        })
        .then(() => {
          // Update scan count on promoter_event_qr
          supabase
            .from("promoter_event_qr")
            .update({ scans_count: (qrData as any).scans_count + 1 })
            .eq("id", qrData.id);
        });
    }
  }, [qrData]);

  // Submit registration
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!qrData) throw new Error("Invalid guestlist link");

      const { error } = await supabase.from("guests").insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        whatsapp_number: whatsapp.trim(),
        date_of_birth: dateOfBirth || null,
        nationality: nationality || null,
        event_id: qrData.event_id,
        promoter_id: qrData.promoter_id,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("You're already registered for this event!");
        }
        throw error;
      }

      // Update registration count
      await supabase
        .from("promoter_event_qr")
        .update({ registrations_count: ((qrData as any).registrations_count || 0) + 1 })
        .eq("id", qrData.id);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "You're on the list! 🎉",
        description: "See you at the event!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  // Loading state
  if (qrLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid or expired link
  if (!qrData || qrError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-3xl">😕</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">
              This guestlist link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const event = qrData.events as any;
  const promoter = qrData.promoters as any;

  // Event is not upcoming
  if (event?.status !== "upcoming") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Registration Closed</h2>
            <p className="text-muted-foreground">
              Registration for this event has ended.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md text-center relative z-10 bg-card/80 backdrop-blur-xl border-border/50">
          <CardContent className="pt-8 pb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <PartyPopper className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
            <p className="text-muted-foreground mb-6">
              We'll see you at <span className="font-semibold text-foreground">{event?.name}</span>
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{event?.date && format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>{event?.time?.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{event?.venue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex justify-center">
          <img src={blsLogo} alt="Bali Live Sessions" className="h-10 w-auto invert" />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-card/80 backdrop-blur-xl border-border/50">
            <CardHeader className="text-center pb-2">
              {/* FREE Badge */}
              <div className="flex justify-center mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  FREE Guestlist
                </div>
              </div>

              <CardTitle className="text-2xl">{event?.name}</CardTitle>

              <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {event?.date && format(new Date(event.date), "EEE, MMM d")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event?.time?.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event?.venue}
                </span>
              </div>

              {event?.description && (
                <CardDescription className="mt-3">{event.description}</CardDescription>
              )}

              {promoter?.name && (
                <p className="text-xs text-muted-foreground mt-3">
                  Invited by <span className="text-foreground font-medium">{promoter.name}</span>
                </p>
              )}
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+62 812 345 6789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="bg-input/50 border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select value={nationality} onValueChange={setNationality}>
                      <SelectTrigger className="bg-input/50 border-border/50">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map((nat) => (
                          <SelectItem key={nat} value={nat}>
                            {nat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-purple text-primary-foreground font-semibold text-lg py-6"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Join the Guestlist
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By registering, you agree to receive event updates via WhatsApp and email.
                </p>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}