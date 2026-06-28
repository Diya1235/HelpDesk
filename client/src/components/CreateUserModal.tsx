import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUserSchema, type CreateUserInput } from "@helpdesk/core";
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

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateUserModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange",
  });

  const createUser = useMutation({
    mutationFn: (data: CreateUserInput) =>
      axios.post("/api/users", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      handleClose();
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.error ?? "Failed to create user");
      }
    },
  });

  function handleClose() {
    reset();
    setFormError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
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
            <Input id="name" placeholder="Jane Smith" autoFocus maxLength={100} aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jane@example.com" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Min 8 characters" aria-invalid={!!errors.password} {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
