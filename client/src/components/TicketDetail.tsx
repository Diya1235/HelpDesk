import DOMPurify from "dompurify";

const LABEL_CLS = "text-xs font-medium text-muted-foreground mb-1";

interface Props {
  subject: string;
  fromName: string;
  fromEmail: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  bodyHtml: string | null;
}

export function TicketDetail({ subject, fromName, fromEmail, createdAt, updatedAt, body, bodyHtml }: Props) {
  return (
    <>
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">{subject}</h1>
      </div>

      <div className="px-6 py-4 border-b border-border flex flex-wrap gap-6 text-sm">
        <div>
          <p className={LABEL_CLS}>From</p>
          <p className="text-foreground font-medium">{fromName}</p>
          <p className="text-xs text-muted-foreground">{fromEmail}</p>
        </div>
        <div>
          <p className={LABEL_CLS}>Received</p>
          <p className="text-foreground">{new Date(createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className={LABEL_CLS}>Last Updated</p>
          <p className="text-foreground">{new Date(updatedAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="px-6 py-5 border-b border-border">
        <p className={`${LABEL_CLS} mb-2`}>Message</p>
        <div className="border border-border rounded-lg bg-muted p-4">
          {bodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
              {body}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}
