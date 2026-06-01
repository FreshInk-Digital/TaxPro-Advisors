// File: src/pages/admin/ContentTranslationsTab.jsx
// Amazon/Crowdin-style content translation editor.
// Loads all content keys for a selected locale, shows completion %, lets admin
// fill values with the English default as placeholder, then publishes to site.

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Globe, CheckCircle2, AlertCircle, Loader2, Search, X,
  BookOpen, LayoutGrid, ChevronDown, Upload, Copy, Filter, Plus, Trash2,
  Zap, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { languagesApi } from "@/lib/api";
import { contentApi } from "@/lib/contentApi";
import { invalidateContentCache } from "@/lib/homePage";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_COLORS = {
  translated: "bg-emerald-100 text-emerald-700 border-emerald-200",
  missing:    "bg-amber-100  text-amber-700  border-amber-200",
  draft:      "bg-blue-100   text-blue-700   border-blue-200",
};

const NAMESPACE_LABELS = {
  home: "Landing Page",
  ui:   "Public UI",
};

function unwrapListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function ProgressBar({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const color =
    pct === 100 ? "bg-emerald-500" :
    pct >= 70   ? "bg-blue-500"    :
    pct >= 40   ? "bg-amber-500"   : "bg-rose-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{value} / {total} keys translated</span>
        <span className={cn("font-bold", pct === 100 ? "text-emerald-600" : "text-foreground")}>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const ContentTranslationsTab = ({ initialLocale = null }) => {
  const { t } = useLanguage();
  const qc = useQueryClient();

  // Locale selector state
  const [selectedLocale, setSelectedLocale] = useState(initialLocale || "");
  const [activeNamespace, setActiveNamespace] = useState("home");
  const [activeGroup, setActiveGroup] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [localValues, setLocalValues] = useState({}); // { keyId: value }
  const [isDirty, setIsDirty] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // ── Fetch languages ────────────────────────────────────────────────────────
  const { data: languagesData } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await languagesApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });
  const languages = languagesData || [];

  // Default to first language when loaded
  useEffect(() => {
    if (!selectedLocale && languages.length > 0) {
      setSelectedLocale(languages[0].code);
    }
  }, [languages, selectedLocale]);

  // ── Fetch content stats overview ───────────────────────────────────────────
  const { data: statsData } = useQuery({
    queryKey: ["content-stats"],
    queryFn: async () => {
      const res = await contentApi.stats();
      return res?.data || [];
    },
    staleTime: 30 * 1000,
  });

  // ── Fetch all keys + values for selected locale ────────────────────────────
  const {
    data: keysData,
    isLoading: keysLoading,
    refetch: refetchKeys,
  } = useQuery({
    queryKey: ["content-keys", selectedLocale],
    queryFn: async () => {
      if (!selectedLocale) return [];
      const res = await contentApi.show(selectedLocale);
      return res?.data || [];
    },
    enabled: !!selectedLocale,
    staleTime: 0, // always fresh
  });

  const stats = unwrapListPayload(statsData);
  const allKeys = unwrapListPayload(keysData);

  // Sync local edit values whenever backend data refreshes
  useEffect(() => {
    if (allKeys.length === 0) return;
    const initial = {};
    allKeys.forEach((k) => { initial[k.id] = k.value ?? ""; });
    setLocalValues(initial);
    setIsDirty(false);
  }, [keysData]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const namespaces = useMemo(() =>
    [...new Set(allKeys.map((k) => k.namespace))].sort(),
    [allKeys]
  );

  const groups = useMemo(() => {
    const inNs = allKeys.filter((k) => k.namespace === activeNamespace);
    return ["All", ...new Set(inNs.map((k) => k.group_name))];
  }, [allKeys, activeNamespace]);

  const filteredKeys = useMemo(() => {
    let keys = allKeys.filter((k) => k.namespace === activeNamespace);
    if (activeGroup !== "All") keys = keys.filter((k) => k.group_name === activeGroup);
    if (showMissingOnly) keys = keys.filter((k) => k.status === "missing" || !localValues[k.id]);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      keys = keys.filter((k) =>
        k.key.toLowerCase().includes(q) ||
        (k.default_value || "").toLowerCase().includes(q) ||
        (localValues[k.id] || "").toLowerCase().includes(q)
      );
    }
    return keys.sort((a, b) => a.sort_order - b.sort_order);
  }, [allKeys, activeNamespace, activeGroup, showMissingOnly, searchQuery, localValues]);

  const currentStats = useMemo(() => {
    if (!statsData || !selectedLocale) return null;
    return stats.find((s) => s.language_code === selectedLocale) || null;
  }, [stats, selectedLocale]);

  const missingCount = useMemo(() =>
    allKeys.filter((k) => !localValues[k.id] || localValues[k.id].trim() === "").length,
    [allKeys, localValues]
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const translations = Object.entries(localValues).map(([id, value]) => ({
        id: Number(id),
        value: value?.trim() || null,
      }));
      return contentApi.save(selectedLocale, translations);
    },
    onSuccess: () => {
      toast.success("Translations saved!");
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["content-stats"] });
      refetchKeys();
    },
    onError: (e) => toast.error(e?.message || "Failed to save translations"),
  });

  const publishMutation = useMutation({
    mutationFn: () => contentApi.publish(selectedLocale),
    onSuccess: () => {
      toast.success(`✅ Published! /content/${selectedLocale}.json is now live.`, { duration: 5000 });
      invalidateContentCache(selectedLocale);
      qc.invalidateQueries({ queryKey: ["content-stats"] });
      setShowPublishConfirm(false);
    },
    onError: (e) => toast.error(e?.message || "Publish failed"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = useCallback((keyId, value) => {
    setLocalValues((prev) => ({ ...prev, [keyId]: value }));
    setIsDirty(true);
  }, []);

  const handleCopyFromDefault = useCallback((keyId, defaultValue) => {
    setLocalValues((prev) => ({ ...prev, [keyId]: defaultValue || "" }));
    setIsDirty(true);
  }, []);

  const handleFillAllMissing = () => {
    const updates = {};
    allKeys.forEach((k) => {
      if (!localValues[k.id] || localValues[k.id].trim() === "") {
        updates[k.id] = k.default_value || "";
      }
    });
    setLocalValues((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
    toast.info("Missing keys filled with English defaults. Review and adjust as needed.");
  };

  const handleSaveAndPublish = async () => {
    await saveMutation.mutateAsync();
    setShowPublishConfirm(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <ContentHeader
          title="Content Translations"
          breadcrumbs={[{ label: "Content Translations" }, { label: selectedLocale || "Select Language" }]}
        >
          <div className="flex items-center gap-3">
            {isDirty && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 gap-1.5 animate-in fade-in">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending}
              className="rounded-xl"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : (
                "Save Draft"
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (isDirty) handleSaveAndPublish();
                else setShowPublishConfirm(true);
              }}
              disabled={publishMutation.isPending || saveMutation.isPending}
              className="rounded-xl shadow-lg shadow-primary/20"
            >
              {publishMutation.isPending ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Publishing…</>
              ) : (
                <><Upload className="mr-2 h-3.5 w-3.5" /> Publish to Site</>
              )}
            </Button>
          </div>
        </ContentHeader>

        {/* Language + Stats Bar */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Language Selector */}
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <Select value={selectedLocale} onValueChange={(v) => {
                setSelectedLocale(v);
                setActiveGroup("All");
                setSearchQuery("");
              }}>
                <SelectTrigger className="h-10 w-52 rounded-xl border-border">
                  <SelectValue placeholder="Select language…" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => {
                    const stat = stats.find((s) => s.language_code === lang.code);
                    return (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          {lang.flag && <span>{lang.flag}</span>}
                          <span>{lang.name}</span>
                          {stat && (
                            <Badge variant="secondary" className="text-[10px] ml-1">
                              {stat.percent}%
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Completion stats */}
            {currentStats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-emerald-700">{currentStats.translated} translated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-amber-700">{currentStats.total - currentStats.translated} missing</span>
                </div>
                <Badge
                  variant="outline"
                  className={currentStats.published ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-muted-foreground text-muted-foreground"}
                >
                  {currentStats.published ? "✓ Published" : "Not published"}
                </Badge>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {currentStats && (
            <ProgressBar value={currentStats.translated} total={currentStats.total} />
          )}
        </div>

        {/* Missing keys banner */}
        {missingCount > 0 && !keysLoading && selectedLocale && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {missingCount} key{missingCount > 1 ? "s" : ""} still missing translations
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Missing keys will show English text to visitors. Fill them in or use the auto-fill button.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={handleFillAllMissing}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Auto-fill missing
            </Button>
          </div>
        )}

        {/* Namespace Tabs */}
        <div className="flex gap-2 flex-wrap">
          {namespaces.map((ns) => (
            <button
              key={ns}
              onClick={() => { setActiveNamespace(ns); setActiveGroup("All"); }}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                activeNamespace === ns
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <BookOpen className="inline h-3.5 w-3.5 mr-1.5" />
              {NAMESPACE_LABELS[ns] || ns}
            </button>
          ))}
        </div>

        {/* Editor Panel */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Group filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    activeGroup === g
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-background border border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keys…"
                  className="h-9 w-52 rounded-xl pl-9 text-sm"
                />
                {searchQuery && (
                  <button
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Missing only toggle */}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-xl h-9",
                  showMissingOnly && "border-amber-300 bg-amber-50 text-amber-800"
                )}
                onClick={() => setShowMissingOnly((v) => !v)}
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                {showMissingOnly ? "All keys" : "Missing only"}
              </Button>
            </div>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_100px] gap-4 border-b border-border bg-muted/30 px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>English (source)</span>
            <span>Translation — {selectedLocale || "select language"}</span>
            <span className="text-right">Status</span>
          </div>

          {/* Keys list */}
          {keysLoading ? (
            <div className="flex h-48 items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading translations…</span>
            </div>
          ) : !selectedLocale ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Globe className="h-8 w-8 opacity-40" />
              <p className="text-sm">Select a language to start editing</p>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Search className="h-6 w-6 opacity-40" />
              <p className="text-sm">No keys match your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Group separator + key rows */}
              {(() => {
                let lastGroup = null;
                return filteredKeys.map((key) => {
                  const showGroupHeader = key.group_name !== lastGroup;
                  lastGroup = key.group_name;
                  const currentValue = localValues[key.id] ?? "";
                  const hasValue = currentValue.trim().length > 0;
                  const status = hasValue ? "translated" : "missing";

                  return (
                    <div key={key.id}>
                      {showGroupHeader && activeGroup === "All" && (
                        <div className="flex items-center gap-3 bg-muted/40 px-6 py-2">
                          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {key.group_name}
                          </span>
                        </div>
                      )}
                      <KeyRow
                        keyItem={key}
                        value={currentValue}
                        status={status}
                        onChange={(v) => handleChange(key.id, v)}
                        onCopyDefault={() => handleCopyFromDefault(key.id, key.default_value)}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Footer with total count */}
          {filteredKeys.length > 0 && (
            <div className="border-t border-border bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredKeys.length}</span> keys
              {showMissingOnly && " (missing only)"}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </div>

        {/* Bottom sticky save bar */}
        {isDirty && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-2xl">
              <span className="text-sm text-muted-foreground">You have unsaved changes</span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  // Reset to last saved values
                  const reset = {};
                  allKeys.forEach((k) => { reset[k.id] = k.value ?? ""; });
                  setLocalValues(reset);
                  setIsDirty(false);
                }}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                  : <><CheckCircle2 className="mr-2 h-3.5 w-3.5" />Save Draft</>
                }
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Publish Confirm Dialog */}
      {showPublishConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Publish to Live Site?</h3>
                <p className="text-xs text-muted-foreground">Locale: <code className="font-mono">{selectedLocale}</code></p>
              </div>
            </div>

            {missingCount > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>{missingCount} key{missingCount > 1 ? "s" : ""} are still missing.</strong> They will show English fallback text to visitors.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              This will write <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">/content/{selectedLocale}.json</code> and visitors will immediately see the updated translations.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowPublishConfirm(false)}
                disabled={publishMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing…</>
                  : <><Upload className="mr-2 h-4 w-4" />Publish Now</>
                }
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// KeyRow — single translation row
// ---------------------------------------------------------------------------
const KeyRow = ({ keyItem, value, status, onChange, onCopyDefault }) => {
  const isJson = keyItem.type === "json";
  const isTextarea = keyItem.type === "textarea" || isJson;

  // For JSON type, pretty-print the default
  const displayDefault = useMemo(() => {
    if (!keyItem.default_value) return "";
    if (isJson) {
      try {
        return JSON.stringify(JSON.parse(keyItem.default_value), null, 2);
      } catch {
        return keyItem.default_value;
      }
    }
    return keyItem.default_value;
  }, [keyItem.default_value, isJson]);

  return (
    <div className={cn(
      "grid gap-4 px-6 py-4 transition-colors sm:grid-cols-[1fr_1fr_100px]",
      status === "missing" && "bg-amber-50/30"
    )}>
      {/* English source */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {keyItem.namespace}.{keyItem.key}
          </span>
          {keyItem.type === "json" && (
            <Badge variant="secondary" className="text-[9px] px-1">JSON</Badge>
          )}
        </div>
        {isTextarea ? (
          isJson ? (
            <JsonStructuredBlock value={displayDefault} editable={false} className="max-h-64 overflow-auto" />
          ) : (
            <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground font-sans leading-relaxed">
              {displayDefault || <em className="text-muted-foreground/50">No default</em>}
            </pre>
          )
        ) : (
          <p className="rounded-lg bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground leading-relaxed min-h-[2rem]">
            {displayDefault || <em className="opacity-50">No default</em>}
          </p>
        )}
      </div>

      {/* Translation input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Your translation
          </span>
          <button
            type="button"
            onClick={onCopyDefault}
            className="flex items-center gap-1 rounded text-[10px] text-muted-foreground hover:text-primary transition-colors"
            title="Copy English as starting point"
          >
            <Copy className="h-2.5 w-2.5" /> Use English
          </button>
        </div>
        {isTextarea ? (
          isJson ? (
            <JsonStructuredBlock
              value={value}
              defaultValue={keyItem.default_value}
              editable
              onChange={onChange}
            />
          ) : (
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={displayDefault || "Enter translation…"}
              rows={3}
              className={cn(
                "rounded-xl resize-y text-sm font-mono",
                status === "missing" && !value && "border-amber-300 focus:border-amber-400"
              )}
            />
          )
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={displayDefault || "Enter translation…"}
            className={cn(
              "rounded-xl text-sm",
              status === "missing" && !value && "border-amber-300 focus:border-amber-400"
            )}
          />
        )}
      </div>

      {/* Status badge */}
      <div className="flex sm:justify-end items-start pt-7 sm:pt-7">
        <span className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
          STATUS_COLORS[status]
        )}>
          {status === "translated"
            ? <CheckCircle2 className="h-2.5 w-2.5" />
            : <AlertCircle className="h-2.5 w-2.5" />
          }
          {status}
        </span>
      </div>
    </div>
  );
};

function parseJsonValue(raw) {
  if (raw == null || raw === "") return null;

  if (typeof raw === "object") return raw;

  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeJsonEntries(raw, emptyAsTemplate = false) {
  const parsed = parseJsonValue(raw);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    return parsed.map((entry) => {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        return { ...entry };
      }
      return { value: emptyAsTemplate ? "" : (entry ?? "") };
    });
  }

  if (typeof parsed === "object") {
    return Object.entries(parsed).map(([key, value]) => ({ key, value }));
  }

  return [];
}

function cloneBlankJsonEntries(templateEntries) {
  if (!templateEntries.length) return [{ value: "" }];

  return templateEntries.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { value: "" };
    }

    return Object.keys(entry).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
  });
}

function collectJsonFieldNames(entries) {
  const fields = [];
  const seen = new Set();

  entries.forEach((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
    Object.keys(entry).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        fields.push(key);
      }
    });
  });

  return fields;
}

function inferJsonFieldTypes(entries, templateEntries) {
  const fieldTypes = {};

  [...templateEntries, ...entries].forEach((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
    Object.entries(entry).forEach(([key, value]) => {
      if (typeof value === "number") {
        fieldTypes[key] = "number";
      } else if (!fieldTypes[key]) {
        fieldTypes[key] = "text";
      }
    });
  });

  return fieldTypes;
}

function prettifyJsonFieldName(field) {
  return field
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function JsonStructuredBlock({ value, defaultValue = null, editable = false, onChange = null, className = "" }) {
  const templateEntries = useMemo(() => normalizeJsonEntries(defaultValue), [defaultValue]);
  const currentEntries = useMemo(() => normalizeJsonEntries(value), [value]);

  const [draftEntries, setDraftEntries] = useState(() => {
    if (editable) {
      return currentEntries.length > 0 ? currentEntries : cloneBlankJsonEntries(templateEntries);
    }
    return currentEntries.length > 0 ? currentEntries : templateEntries;
  });

  useEffect(() => {
    if (editable) {
      setDraftEntries(currentEntries.length > 0 ? currentEntries : cloneBlankJsonEntries(templateEntries));
      return;
    }

    setDraftEntries(currentEntries.length > 0 ? currentEntries : templateEntries);
  }, [editable, currentEntries, templateEntries]);

  const fieldNames = useMemo(() => {
    const names = collectJsonFieldNames([...templateEntries, ...draftEntries]);
    return names.length > 0 ? names : ["value"];
  }, [draftEntries, templateEntries]);

  const fieldTypes = useMemo(() => inferJsonFieldTypes(draftEntries, templateEntries), [draftEntries, templateEntries]);

  const emitChange = useCallback((nextEntries) => {
    setDraftEntries(nextEntries);
    if (onChange) {
      onChange(JSON.stringify(nextEntries, null, 2));
    }
  }, [onChange]);

  const updateEntry = (index, field, nextValue) => {
    const nextEntries = draftEntries.map((entry, entryIndex) => {
      if (entryIndex !== index) return entry;
      return { ...entry, [field]: nextValue };
    });
    emitChange(nextEntries);
  };

  const addEntry = () => {
    emitChange([...draftEntries, ...cloneBlankJsonEntries(templateEntries).slice(0, 1)]);
  };

  const removeEntry = (index) => {
    emitChange(draftEntries.filter((_, entryIndex) => entryIndex !== index));
  };

  if (!draftEntries.length) {
    return editable ? (
      <div className={cn("space-y-3", className)}>
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
          No items yet. Add a row to start translating this structured value.
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={addEntry}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Row
        </Button>
      </div>
    ) : (
      <div className={cn("rounded-xl border border-border bg-muted/10 p-4 text-sm text-muted-foreground", className)}>
        No structured data
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {draftEntries.map((entry, index) => (
        <div key={`${index}-${Object.keys(entry || {}).join("-")}`} className="rounded-xl border border-border bg-muted/10 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Item {index + 1}
            </p>
            {editable && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={() => removeEntry(index)}
                disabled={draftEntries.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fieldNames.map((field) => {
              const isNumeric = fieldTypes[field] === "number";
              const displayValue = entry?.[field] ?? "";

              return (
                <div key={field} className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {prettifyJsonFieldName(field)}
                  </label>
                  {editable ? (
                    <Input
                      type={isNumeric ? "number" : "text"}
                      value={displayValue}
                      onChange={(e) => updateEntry(index, field, isNumeric && e.target.value !== "" ? Number(e.target.value) : e.target.value)}
                      className="rounded-lg text-sm"
                      placeholder={`Enter ${prettifyJsonFieldName(field).toLowerCase()}`}
                    />
                  ) : (
                    <div className="min-h-10 rounded-lg bg-background px-3 py-2 text-sm text-foreground">
                      {displayValue !== "" ? String(displayValue) : <span className="text-muted-foreground/60">—</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {editable && (
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={addEntry}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Row
        </Button>
      )}
    </div>
  );
}
