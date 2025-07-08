import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  denyAccess,
} from "@kinde/infrastructure";

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

  const url = `https://${kindeSubdomain}.kinde.com/api/v1/user?id=${userId}&expand=organizations`;
  console.log("[Kinde API] URL called:", url);

  	try {
	  const response = await fetch(url, {
	    method: "GET",
	    headers: {
	      Authorization: `Bearer ${secretToken}`,
	    },
	  });

	  if (response.ok) {
	    const json = await response.json();
	    userOrgCodes = json.organizations || [];
	  } else {
	    const errorText = await response.text();
	    console.warn("Failed to fetch user orgs:", response.status, response.statusText, errorText);
	  }
	} catch (err) {
	  console.error("Fetch threw an exception:", err?.message || err);
	}


  const effectiveOrgCode = orgCodeParam || userOrgCodes[0];

  console.log("Org Enforcement Started", { userId, effectiveOrgCode, allowedOrgCodes });
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
