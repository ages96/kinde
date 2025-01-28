import { Workflow } from '@kinde-oss/infrastructure';

const passwordStrengthWorkflow: Workflow = {
  // Define the trigger for the workflow
  trigger: 'user_signup', // Adjust this based on your specific trigger

  // Define the workflow steps
  steps: [
    {
      name: 'Check Password Strength',
      action: async (context) => {
        const password = context.user.password;
        const result = zxcvbn(password);

        // Check for length, uppercase, numeric, and special character
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        // Check if password strength is weak or does not meet the rules
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
      },
    },
  ],
};

export default passwordStrengthWorkflow;
