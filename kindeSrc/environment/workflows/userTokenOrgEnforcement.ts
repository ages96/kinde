import {
  onUserTokenGeneratedEvent,
  WorkflowSettings,
  WorkflowTrigger,
  createKindeAPI,
  userTokenClaims,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "userTokenOrgEnforcement",
  name: "Enforce Org Per App (User Token)",
  failurePolicy: {
    action: "stop",
  },
  trigger: WorkflowTrigger.UserTokenGenerated,
  bindings: {
    "kinde.auth": {},       // Required for user + org info
    "kinde.fetch": {},      // Required for API calls
    "kinde.env": {},        // Optional for env-specific config
  },
};

export default async function Workflow(event: onUserTokenGeneratedEvent) {
  const kindeAPI = await createKindeAPI(event);

  const clientId = event.client_id;
  const user = event.context.user;
  const org = event.context.organization;

  if (!clientId) {
    console.error("❌ Missing client_id.");
    return event.denyAccess("Invalid client context.");
  }

  if (!org?.code) {
    console.error("❌ Missing organization code.");
    return event.denyAccess("Missing organization context.");
  }

  // Step 1: Get application properties (from Dashboard > Applications > Properties)
  const { data } = await kindeAPI.get({
    endpoint: `applications/${clientId}/properties`,
  });

  const appProperties = data?.appProperties || [];

  // Step 2: Get the expected org_code from the app properties
  const expectedOrgProp = appProperties.find((p: any) => p.key === "org_code");

  if (!expectedOrgProp) {
    console.warn(`⚠️ App '${clientId}' does not define an 'org_code' property.`);
    return event.denyAccess("App not configured with org restriction.");
  }

  const expectedOrgCode = expectedOrgProp.value;
  const actualOrgCode = org.code;

  // Step 3: Enforce org match
  if (expectedOrgCode !== actualOrgCode) {
    console.warn(`❌ Access denied: org '${actualOrgCode}' ≠ expected '${expectedOrgCode}'`);
    return event.denyAccess("You are not authorized for this application/org combination.");
  }

  // Step 4: Optional — enrich the user token with custom claims
  const token = userTokenClaims<{
    orgName: string;
    orgCode: string;
    clientId: string;
  }>();

  token.orgName = org.name;
  token.orgCode = org.code;
  token.clientId = clientId;

  console.log("✅ Access granted and claims added.", {
    userId: user.id,
    email: user.email,
    orgCode: org.code,
    clientId,
  });
}
