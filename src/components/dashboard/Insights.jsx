import { useState } from "react";
import axios from "axios";
import { BarChart3, Download, Link2, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API, useAuthedApi } from "@/lib/api";

const FilterSelect = ({ label, value, onValueChange, children }) => (
  <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
    {label}
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  </label>
);

const StatCard = ({ label, value, hint }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-2 font-display text-3xl font-bold text-slate-950">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </article>
);

function collectionUrl(profileId, sourceId) {
  const url = new URL(`/submit/${profileId}`, window.location.origin);
  url.searchParams.set("source", sourceId);
  return url.toString();
}

export const Insights = ({ items, sources, profileId, filters, setFilters, onSourceCreated }) => {
  const api = useAuthedApi();
  const [sourceName, setSourceName] = useState("");
  const [exportScope, setExportScope] = useState("filtered");
  const [creatingSource, setCreatingSource] = useState(false);
  const [exporting, setExporting] = useState("");
  const average = items.length
    ? (items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1)
    : "—";
  const approvedCount = items.filter((item) => item.is_approved).length;
  const pendingCount = items.length - approvedCount;
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: items.filter((item) => item.rating === rating).length,
  }));
  const sourceCounts = items.reduce((counts, item) => {
    const name = item.source_name || "Legacy / untagged";
    counts.set(name, (counts.get(name) || 0) + 1);
    return counts;
  }, new Map());
  const maxRatingCount = Math.max(1, ...ratingCounts.map((entry) => entry.count));
  const maxSourceCount = Math.max(1, ...sourceCounts.values());
  const hasActiveFilters = Boolean(filters.from || filters.to || filters.rating !== "all"
    || filters.sourceId !== "all" || filters.status !== "all");

  const updateFilter = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters({ from: "", to: "", rating: "all", sourceId: "all", status: "all" });

  const createSource = async (event) => {
    event.preventDefault();
    const name = sourceName.trim();
    if (!name) return;
    setCreatingSource(true);
    try {
      const source = await api("post", "/sources", { name });
      onSourceCreated(source);
      setSourceName("");
      toast.success("Collection link created");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Could not create collection link");
    } finally {
      setCreatingSource(false);
    }
  };

  const downloadReport = async (format) => {
    setExporting(format);
    const params = { format, scope: exportScope };
    if (exportScope === "filtered") {
      if (filters.from) params.from = new Date(`${filters.from}T00:00:00`).toISOString();
      if (filters.to) {
        const end = new Date(`${filters.to}T00:00:00`);
        end.setDate(end.getDate() + 1);
        params.to = end.toISOString();
      }
      if (filters.rating !== "all") params.rating = filters.rating;
      if (filters.sourceId !== "all") params.source_id = filters.sourceId;
      if (filters.status !== "all") params.status = filters.status;
    }
    try {
      const response = await axios.get(`${API}/testimonials/export`, {
        params,
        responseType: "blob",
        withCredentials: true,
      });
      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `praisify-feedback-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch {
      toast.error("Could not download the report. Please try again.");
    } finally {
      setExporting("");
    }
  };

  const copyLink = async (sourceId) => {
    try {
      await navigator.clipboard.writeText(collectionUrl(profileId, sourceId));
      toast.success("Collection link copied");
    } catch {
      toast.error("Could not copy the collection link");
    }
  };

  return (
    <div className="space-y-6" data-testid="insights-dashboard">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">Feedback insights</h2>
            <p className="mt-1 text-sm text-slate-500">Filter submissions to understand review volume, ratings, and collection channels.</p>
          </div>
          {hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
            From
            <Input type="date" value={filters.from} max={filters.to || undefined}
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="h-10 rounded-xl border-slate-200" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
            To
            <Input type="date" value={filters.to} min={filters.from || undefined}
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="h-10 rounded-xl border-slate-200" />
          </label>
          <FilterSelect label="Rating" value={filters.rating} onValueChange={updateFilter("rating")}>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating} stars</SelectItem>)}
          </FilterSelect>
          <FilterSelect label="Collection link" value={filters.sourceId} onValueChange={updateFilter("sourceId")}>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((source) => <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>)}
            <SelectItem value="legacy">Legacy / untagged</SelectItem>
          </FilterSelect>
          <FilterSelect label="Status" value={filters.status} onValueChange={updateFilter("status")}>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </FilterSelect>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Feedback summary">
        <StatCard label="Matching reviews" value={items.length} hint={hasActiveFilters ? "For the selected filters" : "Across all time"} />
        <StatCard label="Average rating" value={average} hint={items.length ? "Out of 5 stars" : "No ratings yet"} />
        <StatCard label="Approved" value={approvedCount} hint="Ready to show in your widget" />
        <StatCard label="Pending" value={pendingCount} hint="Waiting for your review" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><h3 className="font-display font-bold text-slate-950">Rating breakdown</h3></div>
          <div className="mt-5 space-y-3">
            {ratingCounts.map(({ rating, count }) => (
              <div key={rating} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="text-slate-600">{rating} star{rating === 1 ? "" : "s"}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / maxRatingCount) * 100}%` }} /></div>
                <span className="text-right font-semibold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-600" /><h3 className="font-display font-bold text-slate-950">Reviews by source</h3></div>
          {sourceCounts.size ? (
            <div className="mt-5 space-y-3">
              {[...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                <div key={name} className="grid grid-cols-[minmax(5rem,8rem)_1fr_2rem] items-center gap-3 text-sm">
                  <span className="truncate text-slate-600" title={name}>{name}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(count / maxSourceCount) * 100}%` }} /></div>
                  <span className="text-right font-semibold text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 text-sm text-slate-500">No reviews match these filters yet.</p>}
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-2"><Download className="h-4 w-4 text-indigo-600" /><h3 className="font-display font-bold text-slate-950">Download a report</h3></div>
        <p className="mt-1 text-sm text-slate-500">Export customer names, ratings, reviews, status, collection source, and custom answers.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <FilterSelect label="Include" value={exportScope} onValueChange={setExportScope}>
            <SelectItem value="filtered">Filtered results</SelectItem>
            <SelectItem value="all">All feedback (ignore filters)</SelectItem>
          </FilterSelect>
          <Button onClick={() => downloadReport("csv")} disabled={Boolean(exporting)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
            <Download className="mr-2 h-4 w-4" />{exporting === "csv" ? "Preparing CSV…" : "Download CSV"}
          </Button>
          <Button variant="outline" onClick={() => downloadReport("xlsx")} disabled={Boolean(exporting)} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" />{exporting === "xlsx" ? "Preparing Excel…" : "Download Excel"}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-indigo-600" /><h3 className="font-display font-bold text-slate-950">Collection links</h3></div>
            <p className="mt-1 text-sm text-slate-500">Create a separate link for each channel or campaign to compare where reviews come from.</p>
          </div>
          <form onSubmit={createSource} className="flex w-full gap-2 sm:w-auto">
            <Input aria-label="Collection link name" maxLength={50} value={sourceName} onChange={(event) => setSourceName(event.target.value)}
              placeholder="e.g. Instagram" className="min-w-0 rounded-xl sm:w-52" />
            <Button type="submit" disabled={!profileId || creatingSource || !sourceName.trim() || sources.length >= 30} className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-1 h-4 w-4" />Create link
            </Button>
          </form>
        </div>
        <div className="mt-5 divide-y divide-slate-100">
          {sources.map((source) => (
            <div key={source.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{source.name}</p>
                <p className="text-xs text-slate-500">{source.review_count} review{source.review_count === 1 ? "" : "s"}</p>
              </div>
              <div className="flex max-w-full items-center gap-2">
                <code className="max-w-[min(55vw,28rem)] truncate rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600">{collectionUrl(profileId, source.id)}</code>
                <Button type="button" size="sm" variant="outline" onClick={() => copyLink(source.id)} className="shrink-0 rounded-lg">Copy link</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
