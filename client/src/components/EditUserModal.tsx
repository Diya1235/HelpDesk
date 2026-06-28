import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editUserSchema, type EditUserInput } from "@helpdesk/core";
import axios from "axios";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { User } from "./UsersTable";

interface Props {
  user: User | null;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: Props) {
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, password: "" });
      setFormError(null);
    }
  }, [user, reset]);

  const editUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserInput }) => {
      const payload = { name: data.name, email: data.email, ...(data.password ? { password: data.password } : {}) };
      return axios.patch<User>(`/api/users/${id}`, payload).then((r) => r.data);
    },
    onSuccess: (updated) => {
      qc.setQueryData<User[]>(["users"], (prev) =>
        prev?.map((u) => (u.id === updated.id ? updated : u))
      );
      handleClose();
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.error ?? "Failed to update user");
      }
    },
  });

  function handleClose() {
    reset();
    setFormError(null);
    onClose();
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => user && editUser.mutate({ id: user.id, data }))}
          className="flex flex-col gap-4 pt-2"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" placeholder="Jane Smith" maxLength={100} aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" placeholder="jane@example.com" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="edit-password">New password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></Label>
            <Input id="edit-password" type="password" placeholder="Min 8 characters" aria-invalid={!!errors.password} {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || editUser.isPending}>
              {editUser.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
