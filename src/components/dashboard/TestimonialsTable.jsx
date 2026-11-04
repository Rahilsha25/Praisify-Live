import { Trash2, Inbox, ArrowUpRight, MessageSquareQuote } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Stars } from "@/components/Stars";
import { TestimonialDetail } from "./TestimonialDetail";
import { FREE_REVIEW_LIMIT } from "@/lib/plans";

const StatusBadge = ({ approved, id }) => (
  <span
    data-testid={`status-${id}`}
    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
  >
    {approved ? "Approved" : "Pending"}
  </span>
);

const DeleteButton = ({ t, onDelete }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button size="icon" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50" data-testid={`delete-btn-${t.id}`}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
        <AlertDialogDescription>{t.client_name}'s review will be removed permanently.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel data-testid="delete-cancel-btn">Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => onDelete(t)} className="bg-red-600 hover:bg-red-700" data-testid="delete-confirm-btn">Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const Row = ({ t, onToggle, onDelete }) => (
  <TableRow data-testid={`testimonial-row-${t.id}`} className="transition-colors hover:bg-indigo-50/30">
    <TableCell>
      <p className="font-medium text-slate-900">{t.client_name}</p>
      {t.client_role && <p className="text-xs text-slate-500">{t.client_role}</p>}
    </TableCell>
    <TableCell><Stars rating={t.rating} size={14} /></TableCell>
    <TableCell className="max-w-[16rem] min-w-[10rem]"><p className="truncate text-slate-600" title={t.content}>{t.content}</p>
      {t.answers?.length > 0 && <p className="mt-1 text-xs font-medium text-indigo-600">+{t.answers.length} answer{t.answers.length > 1 ? "s" : ""}</p>}
    </TableCell>
    <TableCell className="whitespace-nowrap text-slate-500">{new Date(t.created_at).toLocaleDateString()}</TableCell>
    <TableCell><StatusBadge approved={t.is_approved} id={t.id} /></TableCell>
    <TableCell>
      <div className="flex items-center justify-end gap-3">
        <Switch checked={t.is_approved} onCheckedChange={() => onToggle(t)} data-testid={`approve-toggle-${t.id}`} aria-label="Approve or hide" />
        <TestimonialDetail t={t} />
        <DeleteButton t={t} onDelete={onDelete} />
      </div>
    </TableCell>
  </TableRow>
);

export const TestimonialsTable = ({ items, loading, onToggle, onDelete, tier, onUpgrade }) => (
  <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(15,23,42,0.28)]" data-testid="testimonials-table">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><MessageSquareQuote className="h-4 w-4" /></span>
        <div>
          <h2 className="font-display text-base font-bold text-slate-950 md:text-lg">Testimonials</h2>
          <p className="mt-0.5 text-xs text-slate-500">Review, approve, and manage your customer stories.</p>
        </div>
      </div>
      {tier === "free" ? (
        <div className="flex items-center gap-3 rounded-xl bg-[#fbfaf7] px-3 py-2 text-sm">
          <span className={items.length >= FREE_REVIEW_LIMIT ? "font-semibold text-red-600" : "font-medium text-slate-600"} data-testid="testimonials-count">
            {items.length} / {FREE_REVIEW_LIMIT} <span className="text-slate-400">reviews</span>
          </span>
          <button type="button" onClick={onUpgrade} className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800" data-testid="table-upgrade-link">Go unlimited <ArrowUpRight className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <span className="rounded-xl bg-[#fbfaf7] px-3 py-2 text-sm font-medium text-slate-600" data-testid="testimonials-count">{items.length} total</span>
      )}
    </div>
    {!loading && items.length === 0 ? (
      <div className="px-6 py-16 text-center" data-testid="testimonials-empty">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-300"><Inbox className="h-6 w-6" /></span>
        <p className="mt-4 font-display text-base font-bold text-slate-900">Your first review is just around the corner.</p>
        <p className="mt-2 text-sm text-slate-500">Share your review link above to collect a testimonial.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#fbfaf7]/80 hover:bg-[#fbfaf7]/80">
              <TableHead>Name</TableHead><TableHead>Rating</TableHead><TableHead>Review</TableHead>
              <TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Approve / View / Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((t) => <Row key={t.id} t={t} onToggle={onToggle} onDelete={onDelete} />)}
          </TableBody>
        </Table>
      </div>
    )}
  </section>
);
