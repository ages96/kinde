import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  denyAccess,
} from "@kinde/infrastructure";

// Workflow settings
export const workflowSettings: WorkflowSettings = {
  id: "enforceSpecificOrgWorkflow",
  name: "Enforce Specific Org Membership (ENV-based)",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.env": {},
  },
};

// Workflow logic
export default async function handlePostAuth(event: onPostAuthenticationEvent) {
  const user = event.context.user;
  const userId = user?.id;

  const allowedOrgCode = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;

  if (!allowedOrgCode) {
    console.error("Missing environment variable: ALLOWED_ORG_CODE");
    denyAccess("Server misconfigured — contact support.");
    return;
  }

  console.log("Org Enforcement Started", { userId, allowedOrgCode });

  const orgs = Array.isArray(user?.organizations) ? user.organizations : [];
  const userOrgCodes = orgs.map((org: any) => org.code);

  console.log("User info", {
    email: user?.preferred_email,
    orgs,
    userOrgCodes,
  });

  if (!userOrgCodes.includes(allowedOrgCode)) {
    console.warn(`Access denied: user not in org ${allowedOrgCode}`);
    denyAccess(`Access denied. You must belong to organization: ${allowedOrgCode}`);
    return;
  }

  console.log("✅ Access granted — user is in the correct organization.");
}
