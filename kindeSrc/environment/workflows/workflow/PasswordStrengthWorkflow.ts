import { Workflow } from '@kinde-oss/infrastructure';

const passwordStrengthWorkflow: Workflow = {
  id: 'passwordStrengthCheck', // Ensure this is correctly configured in your system
  trigger: 'user:new_password_provided', // Trigger when a user creates or resets their password
  steps: [
    {
      name: 'Check Password Strength',
      action: async (context) => {
        const password = context.user.password;

        // Validate if password exists
        if (!password) {
          throw new Error('Password is required.');
        }

        // Enforce custom password rules

        // Minimum length of 8 characters
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }

        // Check for at least one uppercase letter
        const hasUpperCase = /[A-Z]/.test(password);
        if (!hasUpperCase) {
          throw new Error('Password must contain at least one uppercase letter.');
        }

        // Check for at least one number
        const hasNumber = /[0-9]/.test(password);
        if (!hasNumber) {
          throw new Error('Password must contain at least one number.');
        }

        // Check for at least one special character
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
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