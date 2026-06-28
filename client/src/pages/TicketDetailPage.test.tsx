import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import { TicketDetailPage } from "./TicketDetailPage";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

vi.mock("../components/Navbar", () => ({
  Navbar: () => <nav />,
}));

const AGENTS = [
  { id: "agent-1", name: "Alice Agent" },
  { id: "agent-2", name: "Bob Agent" },
];

const TICKET = {
  id: 1,
  subject: "Can't log in",
  body: "I've been unable to log into my account.",
  bodyHtml: null,
  fromEmail: "user@example.com",
  fromName: "Test User",
  status: "Open",
  category: "TechnicalQuestion",
  assignee: null,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

function renderPage(ticketId = "1") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function mockGetSuccess(ticketOverride = {}) {
  vi.mocked(axios.get).mockImplementation((url: string) => {
    if (url === "/api/tickets/1")
      return Promise.resolve({ data: { ...TICKET, ...ticketOverride } });
    if (url === "/api/tickets/agents")
      return Promise.resolve({ data: AGENTS });
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketDetailPage", () => {
  describe("loading state", () => {
    it("shows skeletons and no ticket data while fetching", () => {
      vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
      renderPage();

      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
      expect(screen.queryByText(TICKET.subject)).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows an error message when the ticket fetch fails", async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error("Network error"));
      renderPage();

      await screen.findByText("Ticket not found or failed to load.");
    });
  });

  describe("ticket details", () => {
    beforeEach(() => {
      mockGetSuccess();
    });

    it("renders the ticket subject as a heading", async () => {
      renderPage();

      await screen.findByText("Can't log in");
    });

    it("renders the status badge", async () => {
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByText("Open")).toBeInTheDocument();
    });

    it("renders the sender name and email", async () => {
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("renders the plain-text message body", async () => {
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByText("I've been unable to log into my account.")).toBeInTheDocument();
    });

    it("renders bodyHtml as HTML when present", async () => {
      mockGetSuccess({ bodyHtml: "<p>HTML <strong>body</strong></p>" });
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByText("body")).toBeInTheDocument();
    });

    it("shows a 'Back to tickets' link", async () => {
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByRole("link", { name: /back to tickets/i })).toBeInTheDocument();
    });
  });

  describe("assignment dropdown", () => {
    beforeEach(() => {
      mockGetSuccess();
    });

    it("populates the dropdown with fetched agents", async () => {
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByRole("option", { name: "Alice Agent" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Bob Agent" })).toBeInTheDocument();
    });

    it("selects 'Unassigned' when the ticket has no assignee", async () => {
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByRole("combobox")).toHaveValue("");
    });

    it("selects the current assignee in the dropdown", async () => {
      mockGetSuccess({ assignee: AGENTS[0] });
      renderPage();
      await screen.findByText("Can't log in");

      expect(screen.getByRole("combobox")).toHaveValue("agent-1");
    });

    it("calls PATCH /api/tickets/1/assign with the selected agent id", async () => {
      vi.mocked(axios.patch).mockResolvedValue({
        data: { ...TICKET, assignee: AGENTS[0] },
      });
      renderPage();
      await screen.findByText("Can't log in");

      await userEvent.selectOptions(screen.getByRole("combobox"), "agent-1");

      await waitFor(() =>
        expect(axios.patch).toHaveBeenCalledWith("/api/tickets/1/assign", {
          assigneeId: "agent-1",
        })
      );
    });

    it("calls PATCH with null when 'Unassigned' is selected", async () => {
      mockGetSuccess({ assignee: AGENTS[0] });
      vi.mocked(axios.patch).mockResolvedValue({
        data: { ...TICKET, assignee: null },
      });
      renderPage();
      await screen.findByText("Can't log in");

      await userEvent.selectOptions(screen.getByRole("combobox"), "");

      await waitFor(() =>
        expect(axios.patch).toHaveBeenCalledWith("/api/tickets/1/assign", {
          assigneeId: null,
        })
      );
    });

    it("disables the dropdown while the assignment mutation is pending", async () => {
      vi.mocked(axios.patch).mockReturnValue(new Promise(() => {}));
      renderPage();
      await screen.findByText("Can't log in");

      const select = screen.getByRole("combobox");
      await userEvent.selectOptions(select, "agent-1");

      expect(select).toBeDisabled();
    });

    it("updates the selected value after a successful assignment", async () => {
      vi.mocked(axios.patch).mockResolvedValue({
        data: { ...TICKET, assignee: AGENTS[1] },
      });
      renderPage();
      await screen.findByText("Can't log in");

      await userEvent.selectOptions(screen.getByRole("combobox"), "agent-2");

      await waitFor(() =>
        expect(screen.getByRole("combobox")).toHaveValue("agent-2")
      );
    });
  });
});
