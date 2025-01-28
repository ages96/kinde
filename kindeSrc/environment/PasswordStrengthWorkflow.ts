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

        if (result.score < 3) {
          throw new Error('Password is too weak. Please choose a stronger password.');
        }
      },
    },
  ],
};

export default passwordStrengthWorkflow;