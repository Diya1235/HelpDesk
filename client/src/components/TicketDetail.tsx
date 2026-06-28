import DOMPurify from "dompurify";

const LABEL_CLS = "text-xs font-medium text-gray-500 mb-1";

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
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">{subject}</h1>
      </div>

      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-6 text-sm">
        <div>
          <p className={LABEL_CLS}>From</p>
          <p className="text-gray-800 font-medium">{fromName}</p>
          <p className="text-xs text-gray-500">{fromEmail}</p>
        </div>
        <div>
          <p className={LABEL_CLS}>Received</p>
          <p className="text-gray-700">{new Date(createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className={LABEL_CLS}>Last Updated</p>
          <p className="text-gray-700">{new Date(updatedAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="px-6 py-5 border-b border-gray-100">
        <p className={`${LABEL_CLS} mb-2`}>Message</p>
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
          {bodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {body}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}
