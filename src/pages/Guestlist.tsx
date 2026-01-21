import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
  CalendarPlus,
  Share2,
  Heart,
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

// Simple device fingerprint (basic browser info)
const getDeviceFingerprint = () => {
  const nav = window.navigator;
  const screen = window.screen;
  return btoa(
    [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
    ].join("|")
  ).slice(0, 64);
};

type RegistrationState = "form" | "already-registered" | "success";

export default function Guestlist() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("event");
  const { toast } = useToast();
  
  const [registrationState, setRegistrationState] = useState<RegistrationState>("form");
  const [existingRegistration, setExistingRegistration] = useState<any>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");

  // Determine if this is a promoter link or generic BLS link
  const isPromoterLink = !!code;
  const isGenericLink = !code && !!eventIdParam;

  // Fetch promoter event QR data (for promoter links)
  const { data: qrData, isLoading: qrLoading } = useQuery({
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
          scans_count,
          registrations_count,
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
    enabled: isPromoterLink,
  });

  // Fetch event data directly (for generic BLS links)
  const { data: directEvent, isLoading: eventLoading } = useQuery({
    queryKey: ["guestlist-event", eventIdParam],
    queryFn: async () => {
      if (!eventIdParam) return null;

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventIdParam)
        .eq("status", "upcoming")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isGenericLink,
  });

  // Derived event data
  const event = isPromoterLink ? (qrData?.events as any) : directEvent;
  const promoter = isPromoterLink ? (qrData?.promoters as any) : null;
  const eventId = event?.id;
  const promoterId = isPromoterLink ? qrData?.promoter_id : null;

  // Track QR scan (only for promoter links)
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
          // Update scan count
          supabase
            .from("promoter_event_qr")
            .update({ scans_count: (qrData.scans_count || 0) + 1 })
            .eq("id", qrData.id);
        });
    }
  }, [qrData]);

  // Check for duplicate registration
  const checkDuplicate = async (emailVal: string, whatsappVal: string) => {
    if (!eventId) return null;

    const normalizedEmail = emailVal.trim().toLowerCase();
    const normalizedWhatsapp = whatsappVal.trim().replace(/\D/g, "");

    // Check by email
    const { data: byEmail } = await supabase
      .from("guests")
      .select("id, full_name, promoter_id, promoters(name)")
      .eq("event_id", eventId)
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (byEmail) return byEmail;

    // Check by WhatsApp (normalize to digits only for comparison)
    const { data: allGuests } = await supabase
      .from("guests")
      .select("id, full_name, whatsapp_number, promoter_id, promoters(name)")
      .eq("event_id", eventId);

    const byWhatsapp = allGuests?.find((g) => {
      const guestWa = g.whatsapp_number?.replace(/\D/g, "") || "";
      return guestWa === normalizedWhatsapp || 
             guestWa.endsWith(normalizedWhatsapp) || 
             normalizedWhatsapp.endsWith(guestWa);
    });

    return byWhatsapp || null;
  };

  // Submit registration
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Invalid guestlist link");

      // Anti-duplicate check
      const duplicate = await checkDuplicate(email, whatsapp);
      if (duplicate) {
        setExistingRegistration(duplicate);
        setRegistrationState("already-registered");
        return { duplicate: true };
      }

      const deviceFingerprint = getDeviceFingerprint();

      const { error } = await supabase.from("guests").insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        whatsapp_number: whatsapp.trim(),
        date_of_birth: dateOfBirth || null,
        nationality: nationality || null,
        event_id: eventId,
        promoter_id: promoterId, // null for generic links, promoter ID for promoter links
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("You're already registered for this event!");
        }
        throw error;
      }

      // Update registration count (only for promoter links)
      if (qrData) {
        await supabase
          .from("promoter_event_qr")
          .update({ registrations_count: (qrData.registrations_count || 0) + 1 })
          .eq("id", qrData.id);
      }

      return { duplicate: false };
    },
    onSuccess: (result) => {
      if (!result?.duplicate) {
        setRegistrationState("success");
        toast({
          title: "You're on the list! 🎉",
          description: "See you at the event!",
        });
      }
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

  // Calendar event generation
  const addToCalendar = () => {
    if (!event) return;
    
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours
    
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");
    
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&location=${encodeURIComponent(event.venue)}&details=${encodeURIComponent(`You're on the guestlist for ${event.name}!`)}`;
    
    window.open(calUrl, "_blank");
  };

  // Share generic link (no promoter hijack)
  const shareEvent = async () => {
    if (!event) return;
    
    const shareUrl = `${window.location.origin}/guestlist?event=${event.id}`;
    const shareText = `Join me at ${event.name}! 🎶\n${format(new Date(event.date), "EEEE, MMMM d")} at ${event.venue}\n\nGet on the free guestlist: ${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Link copied!", description: "Share it with your friends." });
    }
  };

  // Loading state
  const isLoading = qrLoading || eventLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid or expired link
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center bg-card/80 backdrop-blur-xl border-border/50">
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

  // Event is not upcoming
  if (event?.status !== "upcoming") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center bg-card/80 backdrop-blur-xl border-border/50">
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

  // Already registered state
  if (registrationState === "already-registered") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md text-center relative z-10 bg-card/80 backdrop-blur-xl border-border/50">
          <CardContent className="pt-8 pb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're already on the guestlist! 🙌</h2>
            <p className="text-muted-foreground mb-6">
              We can't wait to see you at <span className="font-semibold text-foreground">{event?.name}</span>
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 mb-6">
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
            <div className="flex gap-3">
              <Button onClick={addToCalendar} variant="outline" className="flex-1 gap-2">
                <CalendarPlus className="w-4 h-4" />
                Save to Calendar
              </Button>
              <Button onClick={shareEvent} variant="outline" className="flex-1 gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (registrationState === "success") {
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
            <h2 className="text-2xl font-bold mb-2">You're on the list! 🎶</h2>
            <p className="text-muted-foreground mb-2">
              Doors open at <span className="font-semibold text-foreground">{event?.time?.slice(0, 5)}</span>
            </p>
            <p className="text-lg font-medium text-foreground mb-6">
              See you at Bali Live Sessions.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 mb-6">
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
            <div className="flex gap-3">
              <Button onClick={addToCalendar} variant="outline" className="flex-1 gap-2">
                <CalendarPlus className="w-4 h-4" />
                Save to Calendar
              </Button>
              <Button onClick={shareEvent} variant="outline" className="flex-1 gap-2">
                <Share2 className="w-4 h-4" />
                Share with a Friend
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
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

              {/* Attribution display */}
              <p className="text-xs text-muted-foreground mt-3">
                {promoter?.name ? (
                  <>Invited by <span className="text-foreground font-medium">{promoter.name}</span></>
                ) : (
                  <>Presented by <span className="text-foreground font-medium">Bali Live Sessions</span></>
                )}
              </p>
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
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="bg-input/50 border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Select value={nationality} onValueChange={setNationality} required>
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
                  disabled={registerMutation.isPending || !nationality}
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