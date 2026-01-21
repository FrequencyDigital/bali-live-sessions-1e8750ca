import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, MessageCircle, QrCode, Check } from "lucide-react";
import QRCode from "qrcode";
import { useEffect } from "react";

interface ShareInviteDialogProps {
  eventName: string;
  eventDate: string;
  venue: string;
  guestlistUrl: string;
  promoterName: string;
  trigger?: React.ReactNode;
}

export function ShareInviteDialog({
  eventName,
  eventDate,
  venue,
  guestlistUrl,
  promoterName,
  trigger,
}: ShareInviteDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (guestlistUrl) {
      QRCode.toDataURL(guestlistUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl);
    }
  }, [guestlistUrl]);

  const inviteMessage = `🎉 You're invited to ${eventName}!

📅 ${eventDate}
📍 ${venue}

🎟️ Join my guestlist:
${guestlistUrl}

See you there! 🎶`;

  const copyLink = () => {
    navigator.clipboard.writeText(guestlistUrl);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteMessage);
    toast({ title: "Invite copied!", description: "Ready to paste anywhere" });
  };

  const shareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(whatsappUrl, "_blank");
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `guestlist-${eventName.replace(/\s+/g, "-")}.png`;
    link.href = qrDataUrl;
    link.click();
    toast({ title: "QR code downloaded!" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Invite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Guestlist Invite
          </DialogTitle>
          <DialogDescription>
            Invite friends to {eventName}. Anyone who registers through your link is added to your guestlist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Link Copy */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Guestlist Link</label>
            <div className="flex gap-2">
              <Input
                value={guestlistUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={copyLink}
                variant="outline"
                size="icon"
                className={copied ? "bg-green-500/10 border-green-500" : ""}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shareWhatsApp}
              variant="outline"
              className="gap-2 h-auto py-3 flex-col"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              onClick={copyInvite}
              variant="outline"
              className="gap-2 h-auto py-3 flex-col"
            >
              <Copy className="w-5 h-5" />
              <span className="text-xs">Copy Message</span>
            </Button>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
              <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 mb-3" />
              <Button onClick={downloadQR} variant="ghost" size="sm" className="gap-2">
                <QrCode className="w-4 h-4" />
                Download QR
              </Button>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">Message Preview</label>
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap text-muted-foreground">
              {inviteMessage}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
