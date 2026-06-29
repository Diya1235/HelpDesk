import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, FileText, RefreshCw, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";
import { TicketDetail } from "../components/TicketDetail";
import { ReplyThread } from "../components/ReplyThread";
import { UpdateTicket } from "../components/UpdateTicket";
import { createReplySchema, type CreateReply, type Reply, type Ticket } from "@helpdesk/core";

const LABEL_CLS = "text-xs font-medium text-muted-foreground mb-1";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: ticket, isLoading, isError } = useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<Ticket>(`/api/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CreateReply>({
    resolver: zodResolver(createReplySchema),
    mode: "onChange",
  });

  const replyBody = watch("body", "");

  const summarizeMutation = useMutation({
    mutationFn: () =>
      axios
        .post<{ summary: string }>(`/api/tickets/${id}/summarize`)
        .then((r) => r.data),
  });

  const polishMutation = useMutation({
    mutationFn: (body: string) =>
      axios
        .post<{ body: string }>(`/api/tickets/${id}/polish-reply`, { body })
        .then((r) => r.data),
    onSuccess: (data) => setValue("body", data.body),
  });

  const replyMutation = useMutation({
    mutationFn: (data: CreateReply) =>
      axios.post<Reply>(`/api/tickets/${id}/replies`, data).then((r) => r.data),
    onSuccess: (newReply) => {
      qc.setQueryData<Ticket>(["ticket", id], (old) =>
        old ? { ...old, replies: [...old.replies, newReply] } : old,
      );
      reset();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to tickets
        </Link>

        {isLoading ? (
          <div className="flex gap-5 items-start">
            <div className="flex-1 min-w-0 bg-card border border-border rounded-lg shadow-sm p-6 space-y-4">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-full mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="w-40 shrink-0 bg-card border border-border rounded-lg shadow-sm p-3 space-y-3">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-full rounded-md" />
            </div>
          </div>
        ) : isError ? (
          <div className="bg-card border border-border rounded-lg shadow-sm p-10 text-center text-sm text-red-500">
            Ticket not found or failed to load.
          </div>
        ) : ticket ? (
          <div className="flex gap-5 items-start">
            <div className="flex-1 min-w-0 bg-card border border-border rounded-lg shadow-sm">
              <TicketDetail
                subject={ticket.subject}
                fromName={ticket.fromName}
                fromEmail={ticket.fromEmail}
                createdAt={ticket.createdAt}
                updatedAt={ticket.updatedAt}
                body={ticket.body}
                bodyHtml={ticket.bodyHtml}
              />

              {/* Summary section */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className={LABEL_CLS}>Conversation Summary</p>
                  {summarizeMutation.data && (
                    <button
                      type="button"
                      onClick={() => summarizeMutation.mutate()}
                      disabled={summarizeMutation.isPending}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </button>
                  )}
                </div>
                {summarizeMutation.data ? (
                  <p className="text-sm text-foreground leading-relaxed bg-muted border border-border rounded-lg px-4 py-3">
                    {summarizeMutation.data.summary}
                  </p>
                ) : ticket.replies.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No replies yet — nothing to summarize.</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => summarizeMutation.mutate()}
                    disabled={summarizeMutation.isPending}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="h-4 w-4" />
                    {summarizeMutation.isPending ? "Summarizing…" : "Summarize conversation"}
                  </button>
                )}
              </div>

              <ReplyThread replies={ticket.replies} />

              {/* Reply form */}
              <div className="px-6 py-5">
                <p className={`${LABEL_CLS} mb-2`}>Reply</p>
                <form
                  onSubmit={handleSubmit((data) => replyMutation.mutate(data))}
                  className="space-y-2"
                >
                  <textarea
                    {...register("body")}
                    rows={4}
                    placeholder="Write a reply..."
                    className="w-full text-sm border border-input rounded-lg px-3 py-2.5 text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none disabled:opacity-50"
                    disabled={replyMutation.isPending}
                  />
                  {errors.body && (
                    <p className="text-xs text-destructive">{errors.body.message}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => polishMutation.mutate(getValues("body"))}
                      disabled={!replyBody.trim() || polishMutation.isPending || replyMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {polishMutation.isPending ? "Polishing…" : "Polish"}
                    </button>
                    <button
                      type="submit"
                      disabled={!replyBody.trim() || replyMutation.isPending || polishMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {replyMutation.isPending ? "Sending…" : "Send Reply"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <UpdateTicket
              ticketId={id!}
              status={ticket.status}
              category={ticket.category}
              assignee={ticket.assignee}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
