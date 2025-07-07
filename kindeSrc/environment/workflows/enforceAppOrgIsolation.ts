import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  denyAccess,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "enforceAppOrgIsolation",
  name: "Enforce App-to-Org Restriction",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
  },
};

export default async function handlePostAuth(event: onPostAuthenticationEvent) {
  const user = event.context.user;
  const userId = user?.id;
  const email = user?.preferred_email || user?.email || "unknown";
  const clientId = event.client_id;
  const orgCodeParam = event.request?.authUrlParams?.orgCode;

  // Define allowed orgs per app by client_id
  const allowedOrgByClientId: Record<string, string> = {
    // Replace with your real client IDs and org codes
    "356594637d424f898f233fa903510550": "org_8641d01cc9d",
    "85a80df21ff34367a5891535b931b877": "org_98bd6219909a0",
  };

  // Validate input
  if (!clientId) {
    console.error("Missing client_id in event.");
    denyAccess("App misconfiguration.");
    return;
  }

  if (!orgCodeParam) {
    console.warn("No orgCode provided in login params.");
    denyAccess("Missing organization context.");
    return;
  }

  const expectedOrgCode = allowedOrgByClientId[clientId];

  if (!expectedOrgCode) {
    console.error(`Unknown client_id '${clientId}' — not mapped to any org.`);
    denyAccess("Unauthorized app.");
    return;
  }

  const isValidOrg = orgCodeParam === expectedOrgCode;

  console.log("App Org Enforcement", {
    userId,
    email,
    clientId,
    orgCodeParam,
    expectedOrgCode,
    isValidOrg,
  });

  if (!isValidOrg) {
    console.warn(`Access denied: org '${orgCodeParam}' does not match expected '${expectedOrgCode}'`);
    denyAccess("Access denied. This app is restricted to a specific organization.");
    return;
  }

  console.log("Access granted — Org matches allowed org for this app.");
}
