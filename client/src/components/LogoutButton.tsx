import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/authService";

export default function LogoutButton() {
  const navigate = useNavigate();
  const requestInFlight = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    if (requestInFlight.current) {
      return;
    }

    requestInFlight.current = true;
    setIsLoggingOut(true);
    setErrorMessage("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.",
      );
    } finally {
      requestInFlight.current = false;
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoggingOut}
        onClick={handleLogout}
      >
        {isLoggingOut ? "Logging out..." : "Log out"}
      </Button>
      {errorMessage && (
        <p className="max-w-48 text-right text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
