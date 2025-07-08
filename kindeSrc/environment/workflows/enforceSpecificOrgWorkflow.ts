import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  denyAccess,
} from "@kinde/infrastructure";

import https from "node:https";

export const workflowSettings: WorkflowSettings = {
  id: "enforceSpecificOrgWorkflow",
  name: "Enforce Whitelisted Org Membership",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.env": {},
  },
};

// Helper function using native HTTPS module
function getUserOrganizations(subdomain: string, userId: string, token: string): Promise<string[]> {
  const url = `https://${subdomain}.kinde.com/api/v1/user?id=${userId}&expand=organizations`;

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const orgs = parsed.organizations || [];
            const codes = orgs.map((org: any) => org.code);
            resolve(codes);
          } catch (err) {
            console.error("[Kinde API] Failed to parse response:", err);
            reject(err);
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error("[Kinde API] HTTPS request failed:", err);
      reject(err);
    });
  });
}

export default async function handlePostAuth(event: onPostAuthenticationEvent) {
  const user = event.context.user;
  const userId = user.id;
  const email = user.preferred_email || user.email;

  const orgCodeParam = event.request?.authUrlParams?.orgCode;
  const allowedOrgCodesStr = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;
  const kindeSubdomain = getEnvironmentVariable("KINDE_SUBDOMAIN")?.value;
  const secretToken = getEnvironmentVariable("KINDE_SECRET_TOKEN")?.value;

  if (!allowedOrgCodesStr || !kindeSubdomain || !secretToken) {
    console.error("Missing required environment variables.");
    denyAccess("Server misconfigured — contact support.");
    return;
  }

  const allowedOrgCodes = allowedOrgCodesStr.split(",").map(code => code.trim());

  let userOrgCodes: string[] = [];

  try {
    userOrgCodes = await getUserOrganizations(kindeSubdomain, userId, secretToken);
  } catch (err) {
    console.warn("Could not fetch user organizations. Proceeding without them.");
  }

  const effectiveOrgCode = orgCodeParam || userOrgCodes[0];

  console.log("Org Enforcement Started", {
    userId,
    allowedOrgCodes,
    effectiveOrgCode,
  });

  console.log("User info", {
    email,
    userOrgCodes,
  });

  const isWhitelisted = allowedOrgCodes.includes(effectiveOrgCode);

  if (!isWhitelisted) {
    console.warn(`Access denied: org ${effectiveOrgCode} is not in ALLOWED_ORG_CODE`);
    denyAccess("Access denied. Organization is not permitted.");
    return;
  }

  console.log("✅ Access granted — This is in a whitelisted organization.");
}
