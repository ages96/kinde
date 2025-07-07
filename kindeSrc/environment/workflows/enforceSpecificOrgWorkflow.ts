import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  denyAccess,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "enforceSpecificOrgWorkflow.ts",
  name: "Enforce Whitelisted Org Membership",
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

  const orgCodeParam = event.request?.authUrlParams?.orgCode;

  const allowedOrgCodesStr = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;

  if (!allowedOrgCodesStr) {
    console.error("Missing environment variable: ALLOWED_ORG_CODE");
    denyAccess("Server misconfigured — contact support.");
    return;
  }

  const allowedOrgCodes = allowedOrgCodesStr.split(",").map(code => code.trim());

  if (!orgCodeParam) {
    console.warn("No orgCode provided in login params.");
    denyAccess("Missing organization context.");
    return;
  }

  const organizations = Array.isArray(user.organizations) ? user.organizations : [];
  const userOrgCodes = organizations.map((org: any) => org.code);

  console.log("Org Enforcement Started", { userId, orgCodeParam, allowedOrgCodes });
  console.log("User info", {
    orgs: organizations,
    email,
    userOrgCodes,
  });

  const isWhitelisted = allowedOrgCodes.includes(orgCodeParam);
  const isMember = userOrgCodes.includes(orgCodeParam);

  if (!isWhitelisted) {
    console.warn(`Access denied: org ${orgCodeParam} is not in ALLOWED_ORG_CODE`);
    denyAccess("Access denied. Organization is not permitted.");
    return;
  }

  if (!isMember) {
    console.warn(`Access denied: user not a member of org ${orgCodeParam}`);
    denyAccess(`Access denied. You must belong to organization: ${orgCodeParam}`);
    return;
  }

  console.log("✅ Access granted — user is in a whitelisted organization and a valid member.");
}
