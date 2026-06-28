import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { UserPlus, Trash2, ArrowLeftRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { authClient } from "../lib/auth-client";

type Role = "admin" | "agent";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

const createSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be 100 characters or fewer"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type CreateForm = z.infer<typeof createSchema>;

export function UsersPage() {
  const { data: session } = authClient.useSession();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema), mode: "onChange" });

  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => axios.get<User[]>("/api/users").then((r) => r.data),
  });

  const createUser = useMutation({
    mutationFn: (data: CreateForm) =>
      axios.post<User>("/api/users", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      closeForm();
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.error ?? "Failed to create user");
      }
    },
  });

  const toggleRole = useMutation({
    mutationFn: (user: User) => {
      const newRole: Role = user.role === "admin" ? "agent" : "admin";
      return axios.patch<User>(`/api/users/${user.id}/role`, { role: newRole }).then((r) => r.data);
    },
    onSuccess: (updated) => {
      qc.setQueryData<User[]>(["users"], (prev) =>
        prev?.map((u) => (u.id === updated.id ? updated : u))
      );
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/users/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData<User[]>(["users"], (prev) => prev?.filter((u) => u.id !== id));
    },
  });

  function openForm() {
    reset();
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    reset();
    setFormError(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    deleteUser.mutate(id);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            {!isLoading && (
              <p className="mt-0.5 text-sm text-gray-400">
                {users.length} member{users.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button onClick={openForm}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Agent
          </Button>
        </div>

        <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm(); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Agent</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((data) => createUser.mutate(data))}
              className="flex flex-col gap-4 pt-2"
            >
              <div className="flex flex-col gap-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Jane Smith" autoFocus maxLength={100} {...register("name")} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" {...register("password")} />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || createUser.isPending}>
                  {createUser.isPending ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))}
              </tbody>
            </table>
          ) : isError ? (
            <div className="p-10 text-center text-sm text-red-500">Failed to load users.</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No users yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.name}
                      {user.id === session?.user.id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {user.id !== session?.user.id && (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => toggleRole.mutate(user)}
                            disabled={toggleRole.isPending && toggleRole.variables?.id === user.id}
                            title={`Make ${user.role === "admin" ? "agent" : "admin"}`}
                            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteUser.isPending && deleteUser.variables === user.id}
                            title="Delete user"
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
