import {
  WorkflowSettings,
  WorkflowTrigger,
  WorkflowContext,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "passwordStrengthCheck",
  name: "Password Strength Validation",
  failurePolicy: {
    action: "stop", // Stop workflow execution on failure
  },
  trigger: WorkflowTrigger.NewPasswordProvided, // Trigger when a user creates or resets their password
  bindings: {
    "kinde.user": {}, // Required for accessing user properties
    "kinde.widget": {}, // Required for interacting with the Kinde widget
  },
};

export default async function validatePasswordStrength(context: WorkflowContext) {
  console.log(context);
  const password = context.context.auth.firstPassword;

  // Validate if the password exists
  if (!password) {
    kinde.widget.invalidateFormField("p_password", "Password is required.");
    return;
  }

  // Enforce custom password rules
  // Minimum length of 8 characters
  if (password.length < 8) {
    kinde.widget.invalidateFormField("p_password", "Password must be at least 8 characters long.");
    return;
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    kinde.widget.invalidateFormField("p_password", "Password must contain at least one uppercase letter.");
    return;
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    kinde.widget.invalidateFormField("p_password", "Password must contain at least one number.");
    return;
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    kinde.widget.invalidateFormField("p_password", "Password must contain at least one special character.");
    return;
  }

  // Log success for debugging purposes
  console.log(
    `Password strength validated successfully for user: ${context.user.id}`
  );
}