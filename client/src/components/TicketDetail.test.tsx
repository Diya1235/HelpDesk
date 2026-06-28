import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketDetail } from "./TicketDetail";

const BASE_PROPS = {
  subject: "Cannot log in",
  fromName: "Alice Smith",
  fromEmail: "alice@example.com",
  createdAt: "2024-03-15T10:30:00.000Z",
  updatedAt: "2024-03-15T14:00:00.000Z",
  body: "I have been unable to log in since yesterday.",
  bodyHtml: null,
};

function renderTicketDetail(overrides: Partial<typeof BASE_PROPS> = {}) {
  return render(<TicketDetail {...BASE_PROPS} {...overrides} />);
}

describe("TicketDetail", () => {
  describe("header", () => {
    it("renders the subject as a heading", () => {
      renderTicketDetail();

      expect(screen.getByRole("heading", { name: "Cannot log in" })).toBeInTheDocument();
    });
  });

  describe("sender info", () => {
    it("renders the sender name", () => {
      renderTicketDetail();

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    it("renders the sender email", () => {
      renderTicketDetail();

      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });
  });

  describe("timestamps", () => {
    it("renders the received date", () => {
      renderTicketDetail();

      expect(
        screen.getByText(new Date(BASE_PROPS.createdAt).toLocaleString()),
      ).toBeInTheDocument();
    });

    it("renders the last updated date", () => {
      renderTicketDetail();

      expect(
        screen.getByText(new Date(BASE_PROPS.updatedAt).toLocaleString()),
      ).toBeInTheDocument();
    });
  });

  describe("message body", () => {
    it("renders plain text body in a <pre> when bodyHtml is null", () => {
      renderTicketDetail({ bodyHtml: null });

      const pre = screen.getByText(BASE_PROPS.body);
      expect(pre.tagName).toBe("PRE");
    });

    it("renders HTML content via innerHTML when bodyHtml is provided", () => {
      renderTicketDetail({ bodyHtml: "<p>Hello <strong>world</strong></p>" });

      expect(screen.getByText("world")).toBeInTheDocument();
      expect(screen.queryByText(BASE_PROPS.body)).not.toBeInTheDocument();
    });

    it("does not render a <pre> when bodyHtml is provided", () => {
      const { container } = renderTicketDetail({
        bodyHtml: "<p>Hello</p>",
      });

      expect(container.querySelector("pre")).toBeNull();
    });
  });
});
