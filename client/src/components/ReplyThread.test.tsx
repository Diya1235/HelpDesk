import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Reply } from "@helpdesk/core";
import { ReplyThread } from "./ReplyThread";

function makeReply(overrides: Partial<Reply> = {}): Reply {
  return {
    id: 1,
    body: "This is a reply.",
    senderType: "Agent",
    author: { id: "u1", name: "Bob Jones", role: "agent" },
    createdAt: "2024-03-15T11:00:00.000Z",
    ...overrides,
  };
}

describe("ReplyThread", () => {
  describe("empty state", () => {
    it("renders nothing when replies is empty", () => {
      const { container } = render(<ReplyThread replies={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("section heading", () => {
    it("shows the Replies heading when there is at least one reply", () => {
      render(<ReplyThread replies={[makeReply()]} />);

      expect(screen.getByText("Replies")).toBeInTheDocument();
    });
  });

  describe("role labels", () => {
    it("shows 'Agent' for an agent-role sender", () => {
      render(
        <ReplyThread
          replies={[makeReply({ senderType: "Agent", author: { id: "u1", name: "Bob", role: "agent" } })]}
        />,
      );

      expect(screen.getByText("Agent")).toBeInTheDocument();
    });

    it("shows 'Admin' for an admin-role agent sender", () => {
      render(
        <ReplyThread
          replies={[makeReply({ senderType: "Agent", author: { id: "u1", name: "Bob", role: "admin" } })]}
        />,
      );

      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("shows 'Customer' for a customer sender", () => {
      render(
        <ReplyThread
          replies={[makeReply({ senderType: "Customer", author: { id: "u2", name: "Carol", role: "agent" } })]}
        />,
      );

      expect(screen.getByText("Customer")).toBeInTheDocument();
    });
  });

  describe("reply content", () => {
    it("renders the reply body", () => {
      render(<ReplyThread replies={[makeReply({ body: "We are looking into this." })]} />);

      expect(screen.getByText("We are looking into this.")).toBeInTheDocument();
    });

    it("renders the author name", () => {
      render(<ReplyThread replies={[makeReply({ author: { id: "u1", name: "Bob Jones", role: "agent" } })]} />);

      expect(screen.getByText(/Bob Jones/)).toBeInTheDocument();
    });

    it("renders the formatted creation timestamp", () => {
      const createdAt = "2024-03-15T11:00:00.000Z";
      render(<ReplyThread replies={[makeReply({ createdAt })]} />);

      expect(screen.getByText(new RegExp(new Date(createdAt).toLocaleString(), "i"))).toBeInTheDocument();
    });
  });

  describe("multiple replies", () => {
    it("renders all replies", () => {
      const replies = [
        makeReply({ id: 1, body: "First reply" }),
        makeReply({ id: 2, body: "Second reply" }),
        makeReply({ id: 3, body: "Third reply" }),
      ];

      render(<ReplyThread replies={replies} />);

      expect(screen.getByText("First reply")).toBeInTheDocument();
      expect(screen.getByText("Second reply")).toBeInTheDocument();
      expect(screen.getByText("Third reply")).toBeInTheDocument();
    });

    it("renders each reply's author name", () => {
      const replies = [
        makeReply({ id: 1, author: { id: "u1", name: "Alice", role: "agent" } }),
        makeReply({ id: 2, author: { id: "u2", name: "Bob", role: "agent" } }),
      ];

      render(<ReplyThread replies={replies} />);

      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    });
  });
});
