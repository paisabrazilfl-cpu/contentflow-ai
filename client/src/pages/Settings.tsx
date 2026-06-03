import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { data: brandVoice, isLoading } = trpc.settings.getBrandVoice.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    targetAudience: "",
    toneKeywords: "",
    avoidKeywords: "",
    sampleContent: "",
    websiteUrl: "",
  });

  useEffect(() => {
    if (brandVoice) {
      setForm({
        businessName: brandVoice.businessName ?? "",
        industry: brandVoice.industry ?? "",
        targetAudience: brandVoice.targetAudience ?? "",
        toneKeywords: brandVoice.toneKeywords ?? "",
        avoidKeywords: brandVoice.avoidKeywords ?? "",
        sampleContent: brandVoice.sampleContent ?? "",
        websiteUrl: brandVoice.websiteUrl ?? "",
      });
    }
  }, [brandVoice]);

  const update = trpc.settings.updateBrandVoice.useMutation({
    onSuccess: () => {
      utils.settings.getBrandVoice.invalidate();
      toast.success("Brand voice saved!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    update.mutate(form);
  };

  const Field = ({
    label,
    name,
    placeholder,
    multiline = false,
    hint,
  }: {
    label: string;
    name: keyof typeof form;
    placeholder: string;
    multiline?: boolean;
    hint?: string;
  }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {multiline ? (
        <textarea
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      ) : (
        <input
          type="text"
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your brand voice and account preferences.</p>
      </div>

      {/* Account info */}
      <div className="p-5 rounded-xl border border-border bg-card mb-6">
        <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-primary" /> Account
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Name</p>
            <p className="text-sm font-medium text-foreground">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm font-medium text-foreground">{user?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Brand voice */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h2 className="font-semibold text-foreground text-sm mb-1">Brand Voice</h2>
        <p className="text-xs text-muted-foreground mb-5">
          This information is injected into every AI generation to ensure consistent, on-brand content.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business Name" name="businessName" placeholder="Acme Corp" />
              <Field label="Industry" name="industry" placeholder="SaaS, E-commerce, Restaurant..." />
            </div>
            <Field
              label="Target Audience"
              name="targetAudience"
              placeholder="Small business owners aged 25-45 who want to grow their online presence..."
              multiline
            />
            <Field
              label="Tone Keywords"
              name="toneKeywords"
              placeholder="professional, friendly, authoritative, witty..."
              hint="Comma-separated keywords describing your brand tone"
            />
            <Field
              label="Words/Topics to Avoid"
              name="avoidKeywords"
              placeholder="competitor names, controversial topics..."
              hint="Comma-separated words or topics to avoid in generated content"
            />
            <Field
              label="Sample Content"
              name="sampleContent"
              placeholder="Paste an example of your ideal content here so the AI can match your style..."
              multiline
            />
            <Field label="Website URL" name="websiteUrl" placeholder="https://yourwebsite.com" />

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={update.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {update.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Brand Voice</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
