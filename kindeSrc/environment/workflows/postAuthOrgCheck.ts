import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  createKindeAPI,
  denyAccess,
} from "@kinde/infrastructure";

// Workflow settings
export const workflowSettings: WorkflowSettings = {
  id: "enforceOrgMembershipWorkflow",
  name: "Enforce Org Membership",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.fetch": {},
    "url": {},
  },
};

// Workflow logic
export default async function handlePostAuth(
  event: onPostAuthenticationEvent
) {
  const userId = event.context.user.id;
  const currentOrgCode = event.context.organization.code;

  console.log("Org Enforcement Workflow Started", {
    userId,
    currentOrgCode,
  });

  // Initialize Kinde API
  const kindeAPI = await createKindeAPI(event);

  // Fetch user details including orgs
  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${userId}`,
  });

  const userOrgCodes = user.organizations?.map((org: any) => org.code) || [];

  console.log("User organizations:", userOrgCodes);

  const isMember = userOrgCodes.includes(currentOrgCode);

  if (!isMember) {
    console.warn(
      `Access denied. User ${user.preferred_email} does not belong to org: ${currentOrgCode}`
    );
    denyAccess(
      `Access denied. You are not a member of the organization: ${currentOrgCode}`
    );
    return;
  }

  console.log("Access granted. User is a member of the correct organization.");
}
