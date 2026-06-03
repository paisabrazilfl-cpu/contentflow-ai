import { trpc } from "@/lib/trpc";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Bolt, Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const [, navigate] = useLocation();
  const handled = useRef(false);
  const handleCallback = trpc.oauth.handleCallback.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected successfully${data.platformUsername ? ` as @${data.platformUsername}` : ""}!`);
      navigate("/connections");
    },
    onError: (err) => {
      toast.error(`Connection failed: ${err.message}`);
      navigate("/connections");
    },
  });

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      toast.error(`OAuth error: ${error}`);
      navigate("/connections");
      return;
    }

    if (!code) {
      toast.error("No authorization code received");
      navigate("/connections");
      return;
    }

    const platform = sessionStorage.getItem("oauth_platform") as
      | "google_youtube" | "google_business" | "meta_facebook" | "meta_instagram" | "tiktok" | "reddit"
      | null;
    const redirectUri = sessionStorage.getItem("oauth_redirect_uri") ?? `${window.location.origin}/oauth/callback`;

    if (!platform) {
      toast.error("OAuth state lost — please try again");
      navigate("/connections");
      return;
    }

    sessionStorage.removeItem("oauth_platform");
    sessionStorage.removeItem("oauth_redirect_uri");

    handleCallback.mutate({ platform, code, redirectUri });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <Bolt className="w-6 h-6 text-primary" />
        </div>
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <div>
          <p className="font-semibold text-foreground">Connecting your account...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait while we complete the authorization.</p>
        </div>
      </div>
    </div>
  );
}
