import { z } from "zod";

const theme = z.enum(["clean", "paper", "ocean", "forest", "rose"]);
const appearance = z.enum(["light", "dark", "auto"]);
const font = z.enum(["sans", "serif", "display"]);
const questionTypes = z.enum([
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "yes_no",
  "scale",
]);
const choices = new Set(["single_choice", "multi_choice"]);

export const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

export const formSettingsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().max(300),
  content_label: z.string().trim().min(1).max(100),
  content_placeholder: z.string().max(200),
  show_role: z.boolean(),
  role_label: z.string().trim().min(1).max(80),
  button_text: z.string().trim().min(1).max(40),
  thank_you_title: z.string().trim().min(1).max(120),
  thank_you_message: z.string().max(300),
  theme,
  appearance,
  accent: z.string().regex(/^$|^#[0-9a-fA-F]{6}$/),
  font,
  questions: z.array(z.object({
    id: z.string().min(1).max(50),
    type: questionTypes,
    label: z.string().trim().min(1).max(200),
    required: z.boolean(),
    options: z.array(z.string().trim().min(1).max(100)).max(12),
  })).max(15),
});

export const widgetSettingsSchema = z.object({
  layout: z.enum(["masonry", "carousel", "marquee", "spotlight", "list"]),
  theme,
  appearance,
  accent: z.string().regex(/^$|^#[0-9a-fA-F]{6}$/),
  card_style: z.enum(["bordered", "elevated", "minimal"]),
  font,
  transparent_bg: z.boolean(),
  heading: z.string().max(120),
  show_summary: z.boolean(),
  show_rating: z.boolean(),
  show_avatar: z.boolean(),
  show_role: z.boolean(),
  show_date: z.boolean(),
  min_rating: z.number().int().min(1).max(5),
  sort: z.enum(["newest", "highest"]),
  max_items: z.number().int().min(1).max(100),
});

export const testimonialSchema = z.object({
  client_name: z.string().trim().min(1).max(100),
  client_role: z.string().trim().max(120).optional().default(""),
  content: z.string().trim().min(1).max(2000),
  rating: z.number().int().min(1).max(5),
  answers: z.record(z.string(), z.unknown()).optional().default({}),
});

export function validateAnswer(question, value) {
  if (question.type === "short_text") {
    return typeof value === "string" && value.length <= 500;
  }
  if (question.type === "long_text") {
    return typeof value === "string" && value.length <= 2000;
  }
  if (question.type === "single_choice") {
    return typeof value === "string" && question.options.includes(value);
  }
  if (question.type === "multi_choice") {
    return Array.isArray(value) && value.length <= question.options.length
      && value.every((option) => question.options.includes(option));
  }
  if (question.type === "yes_no") {
    return value === "Yes" || value === "No";
  }
  return question.type === "scale" && Number.isInteger(value) && value >= 0 && value <= 10;
}

export function isEmptyAnswer(value) {
  return value === undefined || value === null || value === ""
    || (Array.isArray(value) && value.length === 0);
}

export function questionUsesProFeatures(settings) {
  return settings.questions.length > 0
    || settings.theme !== "clean"
    || settings.appearance !== "light"
    || Boolean(settings.accent)
    || settings.font !== "sans";
}

export function widgetUsesProFeatures(settings) {
  return ["carousel", "marquee", "spotlight"].includes(settings.layout)
    || settings.theme !== "clean"
    || settings.appearance !== "light"
    || Boolean(settings.accent)
    || settings.font !== "sans";
}

export function validateQuestionOptions(question) {
  return !choices.has(question.type) || question.options.length >= 2;
}
