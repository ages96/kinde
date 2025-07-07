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
  name: "Enforce Specific Org Membership (ENV-based)",
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
  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${userId}`,
  });

  const organizations = Array.isArray(user.organizations)
    ? user.organizations
    : [];

  const userOrgCodes = organizations.map((org: any) => org.code);

  console.log("User details:", {
    email: user.preferred_email,
    userOrgCodes,
  });

  const isMember = userOrgCodes.includes(allowedOrgCode);

  if (!isMember) {
    console.warn(`Access denied: user is not in org: ${allowedOrgCode}`);
    denyAccess(`Access denied. You must belong to: ${allowedOrgCode}`);
    return;
  }

  console.log("Access granted — user is in the correct organization.");
}
