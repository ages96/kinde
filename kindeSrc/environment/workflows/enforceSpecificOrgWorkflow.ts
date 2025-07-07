import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  denyAccess,
} from "@kinde/infrastructure";

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

export default async function handlePostAuth(event: onPostAuthenticationEvent) {
  const user = event.context.user;
  const userId = user.id;
  const email = user.preferred_email || user.email;

  const allowedOrgCode = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;

  console.log("Event",event)

  if (!allowedOrgCode) {
    console.error("Missing environment variable: ALLOWED_ORG_CODE");
    denyAccess("Server misconfigured — contact support.");
    return;
  }

  const organizations = Array.isArray(user.organizations) ? user.organizations : [];
  const userOrgCodes = organizations.map((org: any) => org.code);

  console.log("Org Enforcement Started", { userId, allowedOrgCode });
  console.log("User info", {
    orgs: organizations,
    email,
    userOrgCodes,
  });

  const isMember = userOrgCodes.includes(allowedOrgCode);

  if (!isMember) {
    console.warn(`Access denied: user not in org ${allowedOrgCode}`);
    denyAccess(`Access denied. You must belong to organization: ${allowedOrgCode}`);
    return;
  }

  console.log("✅ Access granted — user is in the correct organization.");
}
