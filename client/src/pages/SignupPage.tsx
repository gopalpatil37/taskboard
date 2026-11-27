import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthOutletContext } from "@/services/authService";
import { signup } from "@/services/authService";

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [formMessage, setFormMessage] = useState("");
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useOutletContext<AuthOutletContext>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setFormMessage("");

    try {
      const { user } = await signup(values.name, values.email, values.password);
      setAuthenticatedUser(user);
      navigate("/projects", { replace: true });
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again.",
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
          <h1 className="text-3xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start organizing your work in one place.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>

            {formMessage && (
              <p className="text-center text-sm text-destructive" role="alert">
                {formMessage}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
