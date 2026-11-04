import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "@/lib/api";
import { WidgetView } from "@/components/widget/WidgetView";

export default function PublicWidget() {
  const { profileId } = useParams();
  const [data, setData] = useState(null);
  const [missing, setMissing] = useState(false);

  // Iframe embed: keep the page transparent so the host site's background shows through.
  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
  }, []);

  // Public fetch: approved testimonials (already filtered/sorted by the owner's settings), summary and tier.
  useEffect(() => {
    publicApi.get(`/widget/${profileId}`).then((r) => setData(r.data)).catch(() => setMissing(true));
  }, [profileId]);

  if (missing) return <p className="p-6 text-center text-sm text-slate-500" data-testid="widget-not-found">Widget not found.</p>;
  if (!data) return null;
  return (
    <div className={data.settings.transparent_bg ? "" : "min-h-screen"}>
      <WidgetView settings={data.settings} testimonials={data.testimonials} summary={data.summary} tier={data.tier} />
    </div>
  );
}
