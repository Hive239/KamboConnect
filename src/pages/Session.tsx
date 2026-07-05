import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Video, ArrowLeft } from "@/lib/icons";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

/** Video session portal for online bookings/consultations (LiveKit). */
export default function Session() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = new URLSearchParams(location.search).get("booking");
  const [state, setState] = useState<"loading" | "ready" | "not_configured" | "error">("loading");
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!bookingId) { setState("error"); setMsg("No session specified."); return; }
      try {
        const at = (await supabase?.auth.getSession())?.data?.session?.access_token;
        const r = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(at ? { Authorization: `Bearer ${at}` } : {}) },
          body: JSON.stringify({ bookingId }),
        });
        const j = await r.json().catch(() => ({}));
        if (!active) return;
        if (j?.configured === false) { setState("not_configured"); return; }
        if (!r.ok || !j?.token) { setState("error"); setMsg(j?.error === "not_a_participant" ? "You're not a participant in this session." : "Couldn't start the video session."); return; }
        const url = (import.meta.env.VITE_LIVEKIT_URL as string) || j.url;
        if (!url) { setState("not_configured"); return; }
        setToken(j.token); setServerUrl(url); setState("ready");
      } catch { if (active) { setState("error"); setMsg("Couldn't reach the video service."); } }
    })();
    return () => { active = false; };
  }, [bookingId]);

  if (state === "loading") return <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0f0d]"><Loader2 className="h-8 w-8 animate-spin text-white/70" /></div>;

  if (state === "ready" && token && serverUrl) {
    return (
      <div style={{ height: "100dvh" }} className="bg-[#0b0f0d]">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect
          video
          audio
          onDisconnected={() => navigate(createPageUrl("Bookings"))}
          style={{ height: "100%" }}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    );
  }

  // not_configured or error
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Video className="h-8 w-8 text-primary" weight="duotone" /></div>
      <h1 className="text-xl font-semibold">{state === "not_configured" ? "Video sessions aren't enabled yet" : "Can't join this session"}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {state === "not_configured"
          ? "The platform hasn't finished configuring video calling. Please check back soon, or contact your practitioner to arrange the session."
          : msg}
      </p>
      <Button variant="outline" className="gap-2" onClick={() => navigate(createPageUrl("Bookings"))}><ArrowLeft className="h-4 w-4" /> Back to bookings</Button>
    </div>
  );
}
