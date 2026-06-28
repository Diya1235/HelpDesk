import type { Reply } from "@helpdesk/core";

export function ReplyThread({ replies }: { replies: Reply[] }) {
  if (replies.length === 0) return null;

  return (
    <div className="px-6 py-5 border-b border-gray-100 space-y-3">
      <p className="text-xs font-medium text-gray-500 mb-1">Replies</p>
      {replies.map((reply) => {
        const isAgent = reply.senderType === "Agent";
        const roleLabel = isAgent
          ? reply.author.role === "admin"
            ? "Admin"
            : "Agent"
          : "Customer";
        return (
          <div key={reply.id} className="flex gap-3">
            <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm bg-white border border-gray-200 text-gray-800 shadow-sm">
              <p className="text-xs font-semibold text-gray-800 mb-0.5">{roleLabel}</p>
              <p className="text-xs text-gray-500 mb-1.5">
                {reply.author.name} · {new Date(reply.createdAt).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{reply.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
