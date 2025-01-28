import { Workflow } from '@kinde-oss/infrastructure';
import zxcvbn from 'zxcvbn';

const passwordStrengthWorkflow: Workflow = {
  id: 'password-strength-check', // Unique identifier for the workflow
  trigger: 'user:new_password_provided', // Triggered when a user creates or resets their password
  steps: [
    {
      name: 'Check Password Strength',
      action: async (context) => {
        const password = context.user.password;

        // Validate if password exists
        if (!password) {
          throw new Error('Password is required.');
        }

        // Use zxcvbn to evaluate the password strength
        const result = zxcvbn(password);

        // Enforce custom password rules
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        // Check password strength using zxcvbn score and custom rules
        if (result.score < 3) {
          throw new Error('Password is too weak. Please choose a stronger password.');
        }

        if (!hasUpperCase) {
          throw new Error('Password must contain at least one uppercase letter.');
        }

        if (!hasNumber) {
          throw new Error('Password must contain at least one number.');
        }

        if (!hasSpecialChar) {
          throw new Error('Password must contain at least one special character.');
        }

        // Log success for debugging purposes
        console.log(`Password strength validated successfully for user: ${context.user.id}`);
      },
    },
  ],
};

export default passwordStrengthWorkflow;