import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/services/authService";
import LoginPage from "./pages/LoginPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectsPage from "./pages/ProjectsPage";
import SignupPage from "./pages/SignupPage";

type SessionStatus = "checking" | "authenticated" | "unauthenticated" | "error";

let sessionCheckPromise: Promise<void> | null = null;

function checkSession(): Promise<void> {
  if (!sessionCheckPromise) {
    sessionCheckPromise = getCurrentUser()
      .then(() => undefined)
      .finally(() => {
        sessionCheckPromise = null;
      });
  }

  return sessionCheckPromise;
}

function AuthenticationRoutes() {
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const { pathname } = useLocation();
  const isProtectedRoute =
    pathname === "/projects" || pathname.startsWith("/projects/");
  const isGuestRoute = pathname === "/login" || pathname === "/signup";
  const skipNextCheck = useRef(false);
  const hasCheckedInitialRoute = useRef(false);

  useEffect(() => {
    if (hasCheckedInitialRoute.current && skipNextCheck.current) {
      skipNextCheck.current = false;
      return;
    }

    hasCheckedInitialRoute.current = true;
    let active = true;

    setStatus("checking");
    checkSession()
      .then(() => {
        if (active) {
          if (!isProtectedRoute) {
            skipNextCheck.current = true;
          }
          setStatus("authenticated");
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 404)
        ) {
          if (isProtectedRoute) {
            skipNextCheck.current = true;
          }
          setStatus("unauthenticated");
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify your session. Please try again.",
        );
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [isProtectedRoute, retryCount]);

  if (status === "checking") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-muted/30"
        aria-live="polite"
      >
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </main>
    );
  }

  if (status === "unauthenticated" && isProtectedRoute) {
    return <Navigate to="/login" replace />;
  }

  if (status === "authenticated" && isGuestRoute) {
    return <Navigate to="/projects" replace />;
  }

  if (status === "error" && isProtectedRoute) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <section className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => {
              setErrorMessage("");
              setStatus("checking");
              setRetryCount((count) => count + 1);
            }}
          >
            Try again
          </Button>
        </section>
      </main>
    );
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthenticationRoutes />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route
            path="/projects/:projectId"
            element={<ProjectDetailsPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
