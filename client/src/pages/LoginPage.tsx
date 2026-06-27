import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "../lib/auth-client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (!isPending && session) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setServerError(error.message ?? "Invalid email or password.");
    } else {
      navigate("/");
    }
  };

  const inputBase =
    "w-full border rounded-md px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2";
  const inputNormal = "border-gray-300 focus:border-blue-600 focus:ring-blue-500/10";
  const inputError = "border-red-500 focus:border-red-500 focus:ring-red-500/10";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-md w-full max-w-sm px-8 py-9">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Sign in to Helpdesk
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-[0.8125rem] font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="xyz@gmail.com"
              className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[0.8125rem] text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-[0.8125rem] font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`${inputBase} ${errors.password ? inputError : inputNormal}`}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[0.8125rem] text-red-600">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-[0.8125rem] text-red-600">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 px-4 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
