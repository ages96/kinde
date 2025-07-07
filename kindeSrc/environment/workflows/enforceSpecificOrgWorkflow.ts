import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  createKindeAPI,
  getEnvironmentVariable,
  denyAccess,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "restrictOrgAccessWorkflow",
  name: "Restrict Org per App",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.env": {},
    "kinde.fetch": {},
    "url": {},
  },
};

export default async function handlePostAuth(
  event: onPostAuthenticationEvent
) {
  const userId = event.context.user.id;
  const kindeAPI = await createKindeAPI(event);

  const allowedOrg = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;
  if (!allowedOrg) {
    console.error("Missing ALLOWED_ORG_CODE");
    denyAccess("Access misconfigured — contact support.");
    return;
  }

  const { data: user } = await kindeAPI.get({ endpoint: `user?id=${userId}` });
  const userOrgCodes = user.organizations?.map((org: any) => org.code) || [];

  if (!userOrgCodes.includes(allowedOrg)) {
    console.warn(`Access denied: ${user.preferred_email} not in ${allowedOrg}`);
    denyAccess("You do not have permission to access this app.");
  }
}
