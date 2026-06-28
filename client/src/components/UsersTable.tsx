import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Trash2, ArrowLeftRight, Pencil } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { EditUserModal } from "./EditUserModal";

type Role = "admin" | "agent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface Props {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  currentUserId: string | undefined;
}

export function UsersTable({ users, isLoading, isError, currentUserId }: Props) {
  const qc = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  function handleDelete(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    deleteUser.mutate(id);
  }

  const headers = (
    <tr>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
      <th className="w-20 px-4 py-3" />
    </tr>
  );

  if (isLoading) {
    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">{headers}</thead>
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
    );
  }

  if (isError) {
    return <div className="p-10 text-center text-sm text-red-500">Failed to load users.</div>;
  }

  if (users.length === 0) {
    return <div className="p-10 text-center text-sm text-gray-400">No users yet.</div>;
  }

  return (
    <>
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-100">{headers}</thead>
      <tbody className="divide-y divide-gray-50">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 font-medium text-gray-900">
              {user.name}
              {user.id === currentUserId && (
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
              {user.id !== currentUserId && (
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => setEditingUser(user)}
                    title="Edit user"
                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
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
    <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
    </>
  );
}
