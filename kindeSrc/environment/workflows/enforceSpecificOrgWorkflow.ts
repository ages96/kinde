import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  createKindeAPI,
  getEnvironmentVariable,
  denyAccess,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "enforceSpecificOrgWorkflow",
  name: "Enforce Specific Org Membership (via metadata + env)",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.fetch": {},
    "kinde.env": {},
    "url": {},
  },
};

export default async function handlePostAuth(event: onPostAuthenticationEvent) {
  const userId = event.context.user.id;
  const allowedOrgCode = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;

  if (!allowedOrgCode) {
    console.error("Missing environment variable: ALLOWED_ORG_CODE");
    denyAccess("Server misconfigured — contact support.");
    return;
  }

  console.log("Org Enforcement Started", { userId, allowedOrgCode });

  const kindeAPI = await createKindeAPI(event);

  // Fetch full user record including metadata
  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${userId}`,
  });

  if (!user) {
    console.error("Failed to fetch user details from Kinde API");
    denyAccess("Unable to verify user.");
    return;
  }

  const userOrgCode = user.user_metadata?.org_code;

  console.log("User details:", {
    email: user.preferred_email,
    userOrgCode,
  });

  const isMember = userOrgCode === allowedOrgCode;

  if (!isMember) {
    console.warn(`Access denied: user is not in org: ${allowedOrgCode}`);
    denyAccess(`Access denied. You must belong to: ${allowedOrgCode}`);
    return;
  }

  console.log("Access granted — user is in the correct organization.");
}
