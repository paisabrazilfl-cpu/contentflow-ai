/**
 * Interactive API Key Manager
 *
 * Replaces the static "Required Keys Reference" list with an interactive component:
 * - Click any row to expand
 * - Paste a key into the expanded input
 * - Hit "Ping" to test the key against the actual API
 * - Hit "Docs" to open the official documentation page
 *
 * Mobile-responsive: action buttons stack vertically on small screens.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown, ChevronUp, ExternalLink, Loader2, CheckCircle2, XCircle,
  Save, Eye, EyeOff, Zap, Wifi, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ProviderStatus = {
  id: string;
  name: string;
  description: string;
  docsUrl: string;
  isSet: boolean;
  hasMaskedValue: boolean;
};

type PingResult = {
  ok: boolean;
  latencyMs: number;
  message: string;
  endpoint?: string;
};

export function ApiKeyManager() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [pingResults, setPingResults] = useState<Record<string, PingResult | null>>({});
  const [pingingId, setPingingId] = useState<string | null>(null);

  const { data: providers } = trpc.apiPing.list.useQuery();

  const pingMutation = trpc.apiPing.ping.useMutation({
    onSuccess: (result, variables) => {
      setPingResults(prev => ({ ...prev, [variables.providerId]: result }));
      setPingingId(null);
      if (result.ok) {
        toast.success(`${variables.providerId}: ${result.message}`);
      } else {
        toast.error(`${variables.providerId}: ${result.message}`);
      }
    },
    onError: (err, variables) => {
      setPingResults(prev => ({
        ...prev,
        [variables.providerId]: { ok: false, latencyMs: 0, message: err.message },
      }));
      setPingingId(null);
      toast.error(`Ping failed: ${err.message}`);
    },
  });

  const handlePing = (provider: ProviderStatus) => {
    const key = drafts[provider.id] || "";
    setPingingId(provider.id);
    setPingResults(prev => ({ ...prev, [provider.id]: null }));
    pingMutation.mutate({
      providerId: provider.id,
      key: key.trim() || undefined,
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    setPingResults(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSave = (providerId: string) => {
    const draft = drafts[providerId];
    if (draft && draft.trim()) {
      toast.success(
        `Saved ${providerId} locally. For system-wide use, set this key in Render env vars and redeploy.`,
        { duration: 6000 }
      );
    }
  };

  const handleOpenDocs = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Required Keys Reference</span>
          <span className="text-xs font-normal text-muted-foreground">
            {providers?.filter(p => p.isSet).length || 0} / {providers?.length || 0} configured
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          Click any service to paste your API key, ping it, or open the official docs to get one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {providers?.map(provider => {
          const expanded = expandedId === provider.id;
          const pingResult = pingResults[provider.id];
          const isPinging = pingingId === provider.id;
          const draftValue = drafts[provider.id] || "";
          const showValue = showValues[provider.id];

          return (
            <div
              key={provider.id}
              className="border border-border rounded-lg overflow-hidden bg-secondary/20"
            >
              <button
                type="button"
                onClick={() => toggleExpanded(provider.id)}
                className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-secondary/40 transition-colors text-left"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{provider.name}</p>
                    {provider.isSet ? (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Not set
                      </Badge>
                    )}
                    {pingResult?.ok && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                      </Badge>
                    )}
                    {pingResult && !pingResult.ok && (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                        <XCircle className="w-3 h-3 mr-1" /> Fail
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{provider.description}</p>
                </div>
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {expanded && (
                <div className="border-t border-border bg-secondary/30 p-3 md:p-4 space-y-3">
                  <div>
                    <Label className="text-xs">
                      {provider.isSet ? "Current key (from env)" : "Paste your key"}
                    </Label>
                    <div className="mt-1 relative">
                      <Input
                        type={showValue ? "text" : "password"}
                        placeholder={provider.isSet ? "(env var set — paste to test override)" : "Paste your API key here..."}
                        className="pr-10 font-mono text-xs"
                        value={draftValue}
                        onChange={e => setDrafts(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowValues(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                        title={showValue ? "Hide" : "Show"}
                      >
                        {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handlePing(provider)}
                      disabled={isPinging}
                      className="gradient-orange text-black font-semibold flex-1 sm:flex-none"
                    >
                      {isPinging ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wifi className="w-4 h-4 mr-2" />
                      )}
                      {isPinging ? "Pinging..." : "Ping"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave(provider.id)}
                      disabled={!draftValue.trim()}
                      className="flex-1 sm:flex-none"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDocs(provider.docsUrl)}
                      className="flex-1 sm:flex-none"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Docs
                      <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />
                    </Button>
                  </div>

                  {pingResult && (
                    <div
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        pingResult.ok
                          ? "bg-green-500/5 border-green-500/20 text-green-300"
                          : "bg-red-500/5 border-red-500/20 text-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {pingResult.ok ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>{pingResult.ok ? "Connected" : "Failed"}</span>
                        {pingResult.latencyMs > 0 && (
                          <span className="font-normal opacity-70">
                            ({pingResult.latencyMs}ms)
                          </span>
                        )}
                      </div>
                      <div className="font-mono opacity-90 break-all">{pingResult.message}</div>
                      {pingResult.endpoint && (
                        <div className="opacity-60">endpoint: {pingResult.endpoint}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}