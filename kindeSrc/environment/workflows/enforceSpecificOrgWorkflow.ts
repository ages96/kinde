import {
  onUserTokenGeneratedEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  denyAccess,
  fetch,
  accessTokenCustomClaims,
} from "@kinde/infrastructure";

// Workflow settings
export const workflowSettings: WorkflowSettings = {
  id: "enforceSpecificOrgWorkflow",
  name: "Enforce Whitelisted Org on Token Generation",
  trigger: WorkflowTrigger.UserTokenGeneration,
  failurePolicy: { action: "stop" },
  bindings: {
    "kinde.env": {},
    "kinde.fetch": {},
    "kinde.accessToken": {}, // required for modifying token or denying access
  },
};

// Token generation logic
export default async function handleTokenGeneration(event: onUserTokenGeneratedEvent) {
  const user = event.context.user;
  const userId = user.id;
  const clientId = event.context.application.clientId;
  const selectedOrgCode = (event.request?.authUrlParams?.orgCode ?? "").toLowerCase();

  const envVarMap: Record<string, string> = {
    "356594637d424f898f233fa903510550": "ALLOWED_ORG_CODE_APP_1",
    "85a80df21ff34367a5891535b931b877": "ALLOWED_ORG_CODE_APP_2",
  };

  const allowedOrgEnvVarKey = envVarMap[clientId];
  if (!allowedOrgEnvVarKey) {
    console.warn(`❌ No org code env var mapped for clientId: ${clientId}`);
    denyAccess("Unauthorized application client.");
    return;
  }

  const allowedOrgCodesStr = getEnvironmentVariable(allowedOrgEnvVarKey)?.value;
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
  console.log("[Header Token]",secretToken);

  try {
    const { data } = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("response API", data);

    userOrgCodes = data.organizations?.map((org: string) => org.toLowerCase()) || [];
  } catch (err) {
    console.error("❌ Error fetching user organizations:", err);
    denyAccess("Unable to verify your organization.");
    return;
  }

  console.log("🧠 Org Enforcement Details", {
    userId,
    clientId,
    selectedOrgCode,
    userOrgCodes,
    allowedOrgCodes,
  });

  if (
    !selectedOrgCode ||
    !userOrgCodes.includes(selectedOrgCode) ||
    !allowedOrgCodes.includes(selectedOrgCode)
  ) {
    console.warn("❌ Access denied: Selected org is not valid for this user/client.");
    denyAccess("Access denied: Invalid or unauthorized organization.");
    return;
  }

  console.log(`✅ Access granted — org: ${selectedOrgCode}`);
}
