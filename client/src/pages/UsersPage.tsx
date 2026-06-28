import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { UserPlus } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { CreateUserModal } from "../components/CreateUserModal";
import { UsersTable, type User } from "../components/UsersTable";
import { authClient } from "../lib/auth-client";

export function UsersPage() {
  const { data: session } = authClient.useSession();
  const [showModal, setShowModal] = useState(false);

  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => axios.get<User[]>("/api/users").then((r) => r.data),
  });

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
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Agent
          </Button>
        </div>

        <CreateUserModal open={showModal} onClose={() => setShowModal(false)} />

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <UsersTable
            users={users}
            isLoading={isLoading}
            isError={isError}
            currentUserId={session?.user.id}
          />
        </div>
      </main>
    </div>
  );
}
