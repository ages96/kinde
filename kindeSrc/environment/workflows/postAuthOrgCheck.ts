import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  createKindeAPI,
  denyAccess,
} from "@kinde/infrastructure";

// Specify which org is allowed
const ALLOWED_ORG_CODE = "org_16f731167a64a";

// Workflow settings
export const workflowSettings: WorkflowSettings = {
  id: "enforceSpecificOrgWorkflow",
  name: "Enforce Specific Org Membership",
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

  console.log("Org Enforcement Workflow Started", {
    userId,
    allowedOrg: ALLOWED_ORG_CODE,
  });

  // Initialize Kinde API
  const kindeAPI = await createKindeAPI(event);

  // Fetch user details including orgs
  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${userId}`,
  });

  const userOrgCodes = user.organizations?.map((org: any) => org.code) || [];

  console.log("User organizations:", userOrgCodes);

  const isMember = userOrgCodes.includes(ALLOWED_ORG_CODE);

  if (!isMember) {
    console.warn(
      `Access denied. User ${user.preferred_email} does not belong to org: ${ALLOWED_ORG_CODE}`
    );
    denyAccess(
      `Access denied. You must be a member of the organization: ${ALLOWED_ORG_CODE}`
    );
    return;
  }

  console.log("Access granted. User is a member of the required organization.");
}
