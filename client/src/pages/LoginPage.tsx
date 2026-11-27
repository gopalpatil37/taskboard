// Renders the login form and establishes the authenticated user session.
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthOutletContext } from "@/services/authService";
import { login } from "@/services/authService";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [formMessage, setFormMessage] = useState("");
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useOutletContext<AuthOutletContext>();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  async function onSubmit(values: LoginFormValues) {
    setFormMessage("");

    try {
      const { user } = await login(values.email, values.password);
      setAuthenticatedUser(user);
      navigate("/projects", { replace: true });
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 text-sm font-bold tracking-[0.2em] text-primary">
            TASKBOARD
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to your workspace.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <Form {...form}>
            <form
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={Boolean(fieldState.error)}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-destructive" role="alert">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      aria-invalid={Boolean(fieldState.error)}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-destructive" role="alert">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Button
                type="submit"
                className="h-10 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>

              {formMessage && (
                <p className="text-center text-sm text-destructive" role="alert">
                  {formMessage}
                </p>
              )}
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
