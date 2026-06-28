import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import { CreateUserModal } from "./CreateUserModal";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

function renderModal(open = true, onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return {
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        <CreateUserModal open={open} onClose={onClose} />
      </QueryClientProvider>
    ),
  };
}

async function fillForm({ name = "Jane Smith", email = "jane@example.com", password = "password123" } = {}) {
  await userEvent.type(screen.getByLabelText("Name"), name);
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateUserModal", () => {
  describe("rendering", () => {
    it("renders the form when open", () => {
      renderModal();

      expect(screen.getByText("New Agent")).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create agent/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      renderModal(false);

      expect(screen.queryByText("New Agent")).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows 'Name is required' for an empty name on submit", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await screen.findByText("Name is required");
    });

    it("shows min-length error when name is too short", async () => {
      renderModal();

      await userEvent.type(screen.getByLabelText("Name"), "Jo");

      await screen.findByText("Name must be at least 3 characters");
    });

    it("shows invalid email error", async () => {
      renderModal();

      await userEvent.type(screen.getByLabelText("Email"), "not-an-email");

      await screen.findByText("Invalid email");
    });

    it("shows password min-length error", async () => {
      renderModal();

      await userEvent.type(screen.getByLabelText("Password"), "short");

      await screen.findByText("Password must be at least 8 characters");
    });

    it("marks name input as invalid when there is an error", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));
      await screen.findByText("Name is required");

      expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    });

    it("clears the name error once the field becomes valid", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));
      await screen.findByText("Name is required");

      await userEvent.type(screen.getByLabelText("Name"), "Jane Smith");

      await waitFor(() => expect(screen.queryByText("Name is required")).not.toBeInTheDocument());
    });
  });

  describe("submission", () => {
    it("calls POST /api/users with the form values", async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });
      renderModal();

      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith("/api/users", {
          name: "Jane Smith",
          email: "jane@example.com",
          password: "password123",
        })
      );
    });

    it("calls onClose after successful submission", async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });
      const { onClose } = renderModal();

      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it("shows a server error message when the request fails", async () => {
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(axios.post).mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: "A user with that email already exists" } },
      });
      renderModal();

      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await screen.findByText("A user with that email already exists");
    });

    it("shows a fallback error message when the server response has no error field", async () => {
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(axios.post).mockRejectedValue({ isAxiosError: true, response: { data: {} } });
      renderModal();

      await fillForm();
      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await screen.findByText("Failed to create user");
    });

    it("does not submit when the form is invalid", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));

      await screen.findByText("Name is required");
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe("cancel / reset", () => {
    it("calls onClose when Cancel is clicked", async () => {
      const { onClose } = renderModal();

      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it("resets form errors when the modal is closed and reopened", async () => {
      const { rerender, onClose } = renderModal();

      await userEvent.click(screen.getByRole("button", { name: /create agent/i }));
      await screen.findByText("Name is required");

      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

      const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
      rerender(
        <QueryClientProvider client={queryClient}>
          <CreateUserModal open={true} onClose={onClose} />
        </QueryClientProvider>
      );

      expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
    });
  });
});
