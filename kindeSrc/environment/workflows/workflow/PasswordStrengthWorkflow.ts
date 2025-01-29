import {
  WorkflowSettings,
  WorkflowTrigger,
  WorkflowStep,
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
  },
};

export default async function validatePasswordStrength(context: WorkflowContext) {
console.log(context)
  const password = context.user.password;

  // Validate if the password exists
  if (!password) {
    throw new Error("Password is required.");
  }

  // Enforce custom password rules
  // Minimum length of 8 characters
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain at least one uppercase letter.");
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    throw new Error("Password must contain at least one number.");
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new Error("Password must contain at least one special character.");
  }

  // Log success for debugging purposes
  console.log(
    `Password strength validated successfully for user: ${context.user.id}`
  );
}
