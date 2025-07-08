import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  denyAccess,
  fetch,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "enforceSpecificOrgWorkflow",
  name: "Enforce Whitelisted Org Membership (Based on User Orgs Only)",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.env": {},
    "kinde.fetch": {}
  },
};

export default async function handlePostAuth(event: onPostAuthenticationEvent) {
  const user = event.context.user;
  const userId = user.id;
  const email = user.preferred_email || user.email;

  console.log("Event",event);

  const allowedOrgCodesStr = getEnvironmentVariable("ALLOWED_ORG_CODE")?.value;
  const kindeSubdomain = getEnvironmentVariable("KINDE_SUBDOMAIN")?.value;
  const secretToken = getEnvironmentVariable("KINDE_SECRET_TOKEN")?.value;

  if (!allowedOrgCodesStr || !kindeSubdomain || !secretToken) {
    console.error("❌ Missing required environment variables.");
    denyAccess("Server misconfigured — contact support.");
    return;
  }

  const allowedOrgCodes = allowedOrgCodesStr
    .split(",")
    .map(code => code.trim().toLowerCase());

  let userOrgCodes: string[] = [];

  const url = `https://${kindeSubdomain}.kinde.com/api/v1/user?id=${userId}&expand=organizations`;
  console.log("[Kinde API] URL called:", url);

	 try {
	  const { data } = await fetch(url, {
	    method: "GET",
	    headers: {
	      Authorization: `Bearer ${secretToken}`,
	      "Content-Type": "application/json",
	    },
	  });

	  // data.organizations is an array of strings, not objects
	  userOrgCodes = data.organizations?.map((org: string) => org.toLowerCase()) || [];
	} catch (err) {
	  console.error("❌ Error fetching user organizations:", err);
	}

  console.log("Org Enforcement Started", {
    userId,
    userOrgCodes,
    allowedOrgCodes,
  });

  console.log("User info", {
    email,
    userOrgCodes,
  });

  const matchingOrg = userOrgCodes.find(code => allowedOrgCodes.includes(code));

  if (!matchingOrg) {
    console.warn("❌ Access denied: No matching org found in userOrgCodes.");
    denyAccess("Access denied. Your organization is not permitted.");
    return;
  }

  console.log(`✅ Access granted — User is in allowed org (${matchingOrg})`);
}
