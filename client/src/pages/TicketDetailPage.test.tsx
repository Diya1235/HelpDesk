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
    post: vi.fn(),
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
  replies: [],
};

const AGENT_REPLY = {
  id: 1,
  body: "Thanks for reaching out, we are looking into this.",
  senderType: "Agent",
  author: { id: "agent-1", name: "Alice Agent", role: "agent" },
  createdAt: "2024-01-15T11:00:00Z",
};

const ADMIN_REPLY = {
  id: 2,
  body: "Please reset your password via the link below.",
  senderType: "Agent",
  author: { id: "admin-1", name: "Admin User", role: "admin" },
  createdAt: "2024-01-15T12:00:00Z",
};

const CUSTOMER_REPLY = {
  id: 3,
  body: "I still can't log in after the reset.",
  senderType: "Customer",
  author: { id: "cust-1", name: "Test User", role: "customer" },
  createdAt: "2024-01-15T13:00:00Z",
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
    </QueryClientProvider>,
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

const assignedToSelect = () => screen.getByRole("combobox", { name: /assigned to/i });
const statusSelect = () => screen.getByRole("combobox", { name: /status/i });
const categorySelect = () => screen.getByRole("combobox", { name: /category/i });
const replyTextarea = () => screen.getByPlaceholderText(/write a reply/i);
const sendButton = () => screen.getByRole("button", { name: /send reply/i });

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Loading & Error ─────────────────────────────────────────────────────────

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

// ─── Ticket details ───────────────────────────────────────────────────────────

describe("ticket details", () => {
  beforeEach(() => mockGetSuccess());

  it("renders the ticket subject as a heading", async () => {
    renderPage();
    await screen.findByText("Can't log in");
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

// ─── Status dropdown ──────────────────────────────────────────────────────────

describe("status dropdown", () => {
  beforeEach(() => mockGetSuccess());

  it("shows the current status as the selected option", async () => {
    renderPage();
    await screen.findByText("Can't log in");

    expect(statusSelect()).toHaveValue("Open");
  });

  it("lists all status options", async () => {
    renderPage();
    await screen.findByText("Can't log in");

    expect(screen.getByRole("option", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Resolved" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Closed" })).toBeInTheDocument();
  });

  it("calls PATCH /api/tickets/1 with the new status", async () => {
    vi.mocked(axios.patch).mockResolvedValue({
      data: { ...TICKET, status: "Resolved" },
    });
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.selectOptions(statusSelect(), "Resolved");

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith("/api/tickets/1", { status: "Resolved" }),
    );
  });

  it("disables the dropdown while the mutation is pending", async () => {
    vi.mocked(axios.patch).mockReturnValue(new Promise(() => {}));
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.selectOptions(statusSelect(), "Closed");

    expect(statusSelect()).toBeDisabled();
  });

  it("updates the selected value after a successful status change", async () => {
    vi.mocked(axios.patch).mockResolvedValue({
      data: { ...TICKET, status: "Closed" },
    });
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.selectOptions(statusSelect(), "Closed");

    await waitFor(() => expect(statusSelect()).toHaveValue("Closed"));
  });
});

// ─── Category dropdown ────────────────────────────────────────────────────────

describe("category dropdown", () => {
  beforeEach(() => mockGetSuccess());

  it("shows the current category as the selected option", async () => {
    renderPage();
    await screen.findByText("Can't log in");

    expect(categorySelect()).toHaveValue("TechnicalQuestion");
  });

  it("lists all category options with correct labels", async () => {
    renderPage();
    await screen.findByText("Can't log in");

    expect(screen.getByRole("option", { name: "Uncategorised" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "General Question" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Technical Question" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Refund Request" })).toBeInTheDocument();
  });

  it("shows 'Uncategorised' when category is null", async () => {
    mockGetSuccess({ category: null });
    renderPage();
    await screen.findByText("Can't log in");

    expect(categorySelect()).toHaveValue("");
  });

  it("calls PATCH /api/tickets/1 with the new category", async () => {
    vi.mocked(axios.patch).mockResolvedValue({
      data: { ...TICKET, category: "RefundRequest" },
    });
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.selectOptions(categorySelect(), "RefundRequest");

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith("/api/tickets/1", { category: "RefundRequest" }),
    );
  });

  it("calls PATCH with null when 'Uncategorised' is selected", async () => {
    vi.mocked(axios.patch).mockResolvedValue({
      data: { ...TICKET, category: null },
    });
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.selectOptions(categorySelect(), "");

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith("/api/tickets/1", { category: null }),
    );
  });

  it("disables the category dropdown while the mutation is pending", async () => {
    vi.mocked(axios.patch).mockReturnValue(new Promise(() => {}));
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.selectOptions(categorySelect(), "General");

    expect(categorySelect()).toBeDisabled();
  });
});

// ─── Assignment dropdown ──────────────────────────────────────────────────────

describe("assignment dropdown", () => {
  beforeEach(() => mockGetSuccess());

  // UpdateTicket mounts only after the ticket loads, so agents are fetched later.
  // Each test waits for agent options to appear before interacting.

  it("populates the dropdown with fetched agents", async () => {
    renderPage();
    await screen.findByRole("option", { name: "Alice Agent" });

    expect(screen.getByRole("option", { name: "Bob Agent" })).toBeInTheDocument();
  });

  it("selects 'Unassigned' when the ticket has no assignee", async () => {
    renderPage();
    await screen.findByRole("option", { name: "Alice Agent" });

    expect(assignedToSelect()).toHaveValue("");
  });

  it("selects the current assignee in the dropdown", async () => {
    mockGetSuccess({ assignee: AGENTS[0] });
    renderPage();
    await screen.findByRole("option", { name: "Alice Agent" });

    expect(assignedToSelect()).toHaveValue("agent-1");
  });

  it("calls PATCH /api/tickets/1/assign with the selected agent id", async () => {
    vi.mocked(axios.patch).mockResolvedValue({
      data: { ...TICKET, assignee: AGENTS[0] },
    });
    renderPage();
    await screen.findByRole("option", { name: "Alice Agent" });

    await userEvent.selectOptions(assignedToSelect(), "agent-1");

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith("/api/tickets/1/assign", {
        assigneeId: "agent-1",
      }),
    );
  });

  it("calls PATCH with null when 'Unassigned' is selected", async () => {
    mockGetSuccess({ assignee: AGENTS[0] });
    vi.mocked(axios.patch).mockResolvedValue({
      data: { ...TICKET, assignee: null },
    });
    renderPage();
    await screen.findByRole("option", { name: "Alice Agent" });

    await userEvent.selectOptions(assignedToSelect(), "");

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith("/api/tickets/1/assign", {
        assigneeId: null,
      }),
    );
  });

  it("disables the dropdown while the assignment mutation is pending", async () => {
    vi.mocked(axios.patch).mockReturnValue(new Promise(() => {}));
    renderPage();
    await screen.findByRole("option", { name: "Alice Agent" });

    await userEvent.selectOptions(assignedToSelect(), "agent-1");

    expect(assignedToSelect()).toBeDisabled();
  });

  it("updates the selected value after a successful assignment", async () => {
    vi.mocked(axios.patch).mockResolvedValue({
      data: { ...TICKET, assignee: AGENTS[1] },
    });
    renderPage();
    await screen.findByRole("option", { name: "Alice Agent" });

    await userEvent.selectOptions(assignedToSelect(), "agent-2");

    await waitFor(() => expect(assignedToSelect()).toHaveValue("agent-2"));
  });
});

// ─── Reply thread ─────────────────────────────────────────────────────────────

describe("reply thread", () => {
  it("does not render a Replies section when there are no replies", async () => {
    mockGetSuccess({ replies: [] });
    renderPage();
    await screen.findByText("Can't log in");

    expect(screen.queryByText("Replies")).not.toBeInTheDocument();
  });

  it("renders an agent reply with 'Agent' role label on the first line", async () => {
    mockGetSuccess({ replies: [AGENT_REPLY] });
    renderPage();
    await screen.findByText("Can't log in");

    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText(AGENT_REPLY.body)).toBeInTheDocument();
  });

  it("renders an admin reply with 'Admin' role label on the first line", async () => {
    mockGetSuccess({ replies: [ADMIN_REPLY] });
    renderPage();
    await screen.findByText("Can't log in");

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText(ADMIN_REPLY.body)).toBeInTheDocument();
  });

  it("renders a customer reply with 'Customer' role label on the first line", async () => {
    mockGetSuccess({ replies: [CUSTOMER_REPLY] });
    renderPage();
    await screen.findByText("Can't log in");

    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText(CUSTOMER_REPLY.body)).toBeInTheDocument();
  });

  it("shows the author name in the second line of each reply", async () => {
    mockGetSuccess({ replies: [AGENT_REPLY] });
    renderPage();
    await screen.findByText("Can't log in");

    expect(screen.getAllByText(/Alice Agent/).length).toBeGreaterThan(0);
  });

  it("renders multiple replies in chronological order", async () => {
    mockGetSuccess({ replies: [AGENT_REPLY, CUSTOMER_REPLY, ADMIN_REPLY] });
    renderPage();
    await screen.findByText("Can't log in");

    const bodies = screen
      .getAllByText(/Thanks for reaching out|I still can't log in|Please reset/)
      .map((el) => el.textContent);

    expect(bodies[0]).toContain("Thanks for reaching out");
    expect(bodies[1]).toContain("I still can't log in");
    expect(bodies[2]).toContain("Please reset");
  });
});

// ─── Reply form ───────────────────────────────────────────────────────────────

describe("reply form", () => {
  beforeEach(() => mockGetSuccess());

  it("renders the textarea and Send Reply button", async () => {
    renderPage();
    await screen.findByText("Can't log in");

    expect(replyTextarea()).toBeInTheDocument();
    expect(sendButton()).toBeInTheDocument();
  });

  it("shows a validation error when submitting with an empty body", async () => {
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.click(sendButton());

    await screen.findByText("Reply cannot be empty");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("calls POST /api/tickets/1/replies with the typed body", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: AGENT_REPLY });
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.type(replyTextarea(), "This is a test reply");
    await userEvent.click(sendButton());

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "/api/tickets/1/replies",
        { body: "This is a test reply" },
      ),
    );
  });

  it("clears the textarea after a successful submission", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: AGENT_REPLY });
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.type(replyTextarea(), "This is a test reply");
    await userEvent.click(sendButton());

    await waitFor(() => expect(replyTextarea()).toHaveValue(""));
  });

  it("disables the textarea and button while submission is pending", async () => {
    vi.mocked(axios.post).mockReturnValue(new Promise(() => {}));
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.type(replyTextarea(), "Pending reply");
    const btn = sendButton();
    await userEvent.click(btn);

    expect(replyTextarea()).toBeDisabled();
    expect(btn).toBeDisabled();
  });

  it("shows 'Sending…' on the button while submission is pending", async () => {
    vi.mocked(axios.post).mockReturnValue(new Promise(() => {}));
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.type(replyTextarea(), "Pending reply");
    await userEvent.click(sendButton());

    expect(screen.getByRole("button", { name: /sending/i })).toBeInTheDocument();
  });

  it("appends the new reply to the thread after a successful submission", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: AGENT_REPLY });
    renderPage();
    await screen.findByText("Can't log in");

    await userEvent.type(replyTextarea(), "Thanks for reaching out, we are looking into this.");
    await userEvent.click(sendButton());

    await screen.findByText("Thanks for reaching out, we are looking into this.");
  });

});
