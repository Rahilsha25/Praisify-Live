// Same rules the backend applies to the public widget, used for the live dashboard preview.
export function applyWidgetRules(items, s) {
  const shown = items.filter((t) => t.rating >= s.min_rating);
  if (s.sort === "highest") shown.sort((a, b) => b.rating - a.rating);
  return shown.slice(0, s.max_items);
}

export function summarize(items) {
  if (!items.length) return { count: 0, average: 0 };
  const avg = items.reduce((n, t) => n + t.rating, 0) / items.length;
  return { count: items.length, average: Math.round(avg * 10) / 10 };
}

export const EMBED_HEIGHT = { masonry: 600, list: 600, carousel: 420, marquee: 520, spotlight: 400 };

export const embedCode = (url, layout) =>
  `<iframe src="${url}" width="100%" height="${EMBED_HEIGHT[layout] || 600}px" frameborder="0"></iframe>`;

const day = (n) => new Date(Date.now() - n * 86400000).toISOString();

export const SAMPLE_TESTIMONIALS = [
  { id: "sample-1", client_name: "Maya Chen", client_role: "Founder, Loomwork", rating: 5, created_at: day(2), content: "We had reviews scattered across emails. Now they live on our homepage and actually convert visitors." },
  { id: "sample-2", client_name: "Daniel Ortiz", client_role: "Ops Lead, Fieldnote", rating: 5, created_at: day(5), content: "Set up in five minutes. Our clients enjoy leaving feedback." },
  { id: "sample-3", client_name: "Priya Raman", client_role: "Studio Kin", rating: 4, created_at: day(9), content: "The widget looks native to our site. Nobody can tell it's embedded, which is exactly what we wanted." },
  { id: "sample-4", client_name: "Jonas Weber", client_role: "Coach", rating: 5, created_at: day(14), content: "Social proof without the busywork." },
  { id: "sample-5", client_name: "Aisha Bello", client_role: "Marketing, Northpine", rating: 5, created_at: day(20), content: "Approving reviews takes one click and the wall updates instantly. Our conversion rate on the pricing page went up noticeably." },
  { id: "sample-6", client_name: "Tom Hughes", client_role: "Freelance designer", rating: 4, created_at: day(31), content: "Clean, fast and my clients love how simple the form is." },
];
