import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  createKindeAPI,
  denyAccess,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "enforceAppOrgMapping",
  name: "Enforce Org Per App (PostAuth)",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.fetch": {}, // Required for API calls
  },
};

export default async function handlePostAuth(event: onPostAuthenticationEvent) {
  const user = event.context.user;
  const clientId = event.client_id;
  const orgCodeParam = event.request?.authUrlParams?.orgCode;

  if (!clientId) {
    console.error("Missing client_id");
    denyAccess("Invalid client context.");
    return;
  }

  if (!orgCodeParam) {
    console.warn("Missing orgCode in request params.");
    denyAccess("Missing organization context.");
    return;
  }

  // Use Kinde Management API to fetch app properties
  const kindeAPI = await createKindeAPI(event);
  const { data } = await kindeAPI.get({
    endpoint: `applications/${clientId}/properties`,
  });

  const appProperties = data?.appProperties || [];
  const orgCodeProp = appProperties.find(p => p.key === "org_code");

  if (!orgCodeProp) {
    console.warn(`No 'org_code' property set for app ${clientId}`);
    denyAccess("App not configured with organization restriction.");
    return;
  }

  const expectedOrgCode = orgCodeProp.value;

  console.log("Org Enforcement Check", {
    userId: user.id,
    email: user.email,
    clientId,
    orgCodeParam,
    expectedOrgCode,
  });

  if (orgCodeParam !== expectedOrgCode) {
    console.warn(`Access denied: org '${orgCodeParam}' ≠ expected '${expectedOrgCode}'`);
    denyAccess("Access denied. Organization mismatch.");
    return;
  }

  console.log("✅ Access granted — org matches expected for this app.");
}
