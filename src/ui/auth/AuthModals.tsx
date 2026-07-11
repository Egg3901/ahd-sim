import { useAuthStore } from "@store/authStore";
import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";
import { ActivationModal } from "./ActivationModal";
import { AccountModal } from "./AccountModal";

/** Mount once at the app root: renders whichever auth modal is open. */
export function AuthModals() {
  const modal = useAuthStore((s) => s.modal);
  if (modal === "login") return <LoginModal />;
  if (modal === "register") return <RegisterModal />;
  if (modal === "activate") return <ActivationModal />;
  if (modal === "account") return <AccountModal />;
  return null;
}
