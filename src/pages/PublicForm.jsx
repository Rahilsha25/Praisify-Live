import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { publicApi } from "@/lib/api";
import { FeedbackForm } from "@/components/form/FeedbackForm";

export default function PublicForm() {
  const { profileId } = useParams();
  const doneKey = `praisify_submitted_${profileId}`;
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | closed

  // Load the owner's custom form config (questions, theme) for this collection link.
  useEffect(() => {
    publicApi.get(`/profiles/${profileId}`)
      .then((r) => { setForm(r.data.form); setStatus(r.data.accepting ? "ready" : "closed"); })
      .catch(() => setStatus("missing"));
  }, [profileId]);

  const submit = async (payload) => {
    await publicApi.post(`/testimonials/${profileId}`, payload);
    localStorage.setItem(doneKey, "1"); // blocks duplicate submissions from this browser
  };

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (status === "missing") return <div className="flex min-h-screen items-center justify-center p-6"><p className="text-slate-600" data-testid="submit-not-found">This feedback link is not valid.</p></div>;
  if (status === "closed" && !localStorage.getItem(doneKey)) return <div className="flex min-h-screen items-center justify-center p-6"><p className="text-slate-600" data-testid="submit-closed">This page isn't accepting new reviews right now.</p></div>;
  return <FeedbackForm settings={form} onSubmit={submit} fullScreen showThanks={!!localStorage.getItem(doneKey)} />;
}
