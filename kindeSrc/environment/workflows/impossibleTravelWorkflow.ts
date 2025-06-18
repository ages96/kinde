import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  createKindeAPI,
  fetch,
  denyAccess,
} from "@kinde/infrastructure";

// Workflow settings
export const workflowSettings: WorkflowSettings = {
  id: "impossibleTravelWorkflow",
  name: "ImpossibleTravelCheck (TrustPath)",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.env": {},     // for env variables
    "kinde.fetch": {},   // for API requests
    "url": {},           // required
  },
};

// Workflow logic
export default async function handlePostAuth(
  event: onPostAuthenticationEvent
) {
  const userId = event.context.user.id;
  const isNew = event.context.auth.isNewUserRecordCreated;
  const ip = typeof event.request.ip === "string" && event.request.ip.length ? event.request.ip.split(",")[0].trim() : "0.0.0.0";

  console.log("🛠️ Workflow started", { userId, ip, isNewUser: isNew });

  // Initialize Kinde API
  const kindeAPI = await createKindeAPI(event);

  // Get user details
  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${userId}`,
  });

  console.log("Retrieved user from Kinde", {
    id: user.id,
    email: user.preferred_email,
  });

  // Build TrustPath payload
  const payload = {
    ip,
    email: user.preferred_email,
    user: {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    event_type: isNew ? "account_register" : "account_login",
  };

  console.log("Payload prepared", payload);

  // Read TrustPath API key from env
  const apiKey = getEnvironmentVariable("TRUSTPATH_API_KEY")?.value;
  if (!apiKey) {
    throw new Error("TRUSTPATH_API_KEY env var is not set");
  }

  const resp = await event.kinde.secureFetch("https://api.trustpath.io/v1/risk/evaluate",{
     method: "POST",
     headers: {
       Authorization: `Bearer ${apiKey}`,
       "Content-Type": "application/json"
     },
     body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    // Treat any TrustPath error as high risk and stop auth
    denyAccess(`TrustPath responded with HTTP ${resp.status}`);
    return;
  }

  console.log("TrustPath response", trustData);

  let state: string | undefined;
  try {
    state = (await resp.json())?.data?.score?.state;
  } catch {
    // Any parsing failure → conservative fail-close
    denyAccess("Unable to parse TrustPath response");
    return;
  }

  if (state === "decline") {
    denyAccess("Access blocked due to impossible travel risk.");
  }
}
