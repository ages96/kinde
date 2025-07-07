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

export default async function handlePostAuth(
  event: onPostAuthenticationEvent
) {
  const userId = event.context.user.id;
  const allowedOrgCode = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;

  if (!allowedOrgCode) {
    console.error("Missing ALLOWED_ORG_CODE");
    denyAccess("Server misconfigured — contact support.");
    return;
  }

  const kindeAPI = await createKindeAPI(event);

  const { data: memberships } = await kindeAPI.get({
    endpoint: `organization/memberships?user_id=${userId}`,
  });

  const userOrgCodes = memberships?.map((m: any) => m.organization.code) || [];

  console.log("User org codes:", userOrgCodes);

  const isMember = userOrgCodes.includes(allowedOrgCode);

  if (!isMember) {
    denyAccess(`Access denied. You must belong to: ${allowedOrgCode}`);
    return;
  }

  console.log("Access granted.");
}
