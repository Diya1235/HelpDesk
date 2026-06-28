import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithQuery } from "../test/renderWithQuery";
import axios from "axios";
import { authClient } from "../lib/auth-client";
import { UsersPage } from "./UsersPage";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

vi.mock("../components/Navbar", () => ({
  Navbar: () => <nav />,
}));

vi.mock("../lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

const ADMIN_SESSION = {
  data: { user: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "admin" } },
  isPending: false,
};

const USERS = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin" as const, createdAt: "2024-01-01T00:00:00Z" },
  { id: "2", name: "Bob", email: "bob@example.com", role: "agent" as const, createdAt: "2024-02-01T00:00:00Z" },
];

function renderPage() {
  return renderWithQuery(<UsersPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authClient.useSession).mockReturnValue(ADMIN_SESSION as any);
});

describe("UsersPage", () => {
  describe("loading state", () => {
    it("shows skeleton rows and no user data while fetching", () => {
      vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
      renderPage();

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("shows error message when the fetch fails", async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error("Network error"));
      renderPage();

      await screen.findByText("Failed to load users.");
    });
  });

  describe("empty state", () => {
    it("shows empty message when no users exist", async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [] });
      renderPage();

      await screen.findByText("No users yet.");
    });
  });

  describe("user list", () => {
    beforeEach(() => {
      vi.mocked(axios.get).mockResolvedValue({ data: USERS });
    });

    it("renders all user rows with name, email, and role", async () => {
      renderPage();
      await screen.findByText("Alice");

      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
      expect(screen.getByText("agent")).toBeInTheDocument();
    });

    it("shows the correct member count", async () => {
      renderPage();
      await screen.findByText("2 members");
    });

    it("marks the logged-in user with (you) and hides their action buttons", async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: [
          { id: "admin-1", name: "Admin", email: "admin@example.com", role: "admin", createdAt: "2024-01-01T00:00:00Z" },
          ...USERS,
        ],
      });
      renderPage();

      await screen.findByText("(you)");
      expect(screen.getAllByTitle(/Make/)).toHaveLength(2);
    });
  });

  describe("Add Agent form", () => {
    beforeEach(() => {
      vi.mocked(axios.get).mockResolvedValue({ data: USERS });
    });

    it("opens and closes the form", async () => {
      renderPage();
      await screen.findByText("Alice");

      expect(screen.queryByText("New Agent")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /add agent/i }));
      expect(screen.getByText("New Agent")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByText("New Agent")).not.toBeInTheDocument();
    });

    it("shows validation errors when submitting empty", async () => {
      renderPage();
      await screen.findByText("Alice");

      await userEvent.click(screen.getByRole("button", { name: /add agent/i }));
      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await screen.findByText("Name is required");
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });

    it("submits the form and closes it on success", async () => {
      const created = { id: "3", name: "Jane", email: "jane@example.com", role: "agent", createdAt: "2024-03-01T00:00:00Z" };
      vi.mocked(axios.post).mockResolvedValue({ data: created });

      renderPage();
      await screen.findByText("Alice");

      await userEvent.click(screen.getByRole("button", { name: /add agent/i }));
      await userEvent.type(screen.getByLabelText("Name"), "Jane");
      await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");
      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await waitFor(() => expect(screen.queryByText("New Agent")).not.toBeInTheDocument());
      expect(axios.post).toHaveBeenCalledWith("/api/users", {
        name: "Jane",
        email: "jane@example.com",
        password: "password123",
      });
    });

    it("shows the server error message when creation fails", async () => {
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(axios.post).mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: "A user with that email already exists" } },
      });

      renderPage();
      await screen.findByText("Alice");

      await userEvent.click(screen.getByRole("button", { name: /add agent/i }));
      await userEvent.type(screen.getByLabelText("Name"), "Alice");
      await userEvent.type(screen.getByLabelText("Email"), "alice@example.com");
      await userEvent.type(screen.getByLabelText("Password"), "password123");
      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await screen.findByText("A user with that email already exists");
    });
  });

  describe("role toggle", () => {
    it("calls PATCH with the toggled role", async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: USERS });
      vi.mocked(axios.patch).mockResolvedValue({ data: { ...USERS[1], role: "admin" } });

      renderPage();
      await screen.findByText("Bob");

      const roleButtons = screen.getAllByTitle(/Make/);
      await userEvent.click(roleButtons[1]);

      expect(axios.patch).toHaveBeenCalledWith("/api/users/2/role", { role: "admin" });
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      vi.mocked(axios.get).mockResolvedValue({ data: USERS });
    });

    it("removes the row after a confirmed delete", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      vi.mocked(axios.delete).mockResolvedValue({});

      renderPage();
      await screen.findByText("Alice");

      await userEvent.click(screen.getAllByTitle("Delete user")[0]);

      expect(axios.delete).toHaveBeenCalledWith("/api/users/1");
      await waitFor(() => expect(screen.queryByText("Alice")).not.toBeInTheDocument());
    });

    it("does nothing when the confirm dialog is cancelled", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      renderPage();
      await screen.findByText("Alice");

      await userEvent.click(screen.getAllByTitle("Delete user")[0]);

      expect(axios.delete).not.toHaveBeenCalled();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });
});
