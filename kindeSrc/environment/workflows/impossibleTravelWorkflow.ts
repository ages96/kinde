import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
  createKindeAPI,
  fetch,
  denyAccess,
} from "@kinde/infrastructure";

// The settings for this workflow
export const workflowSettings: WorkflowSettings = {
  id: "impossibleTravelWorkflow",
  name: "ImpossibleTravelCheck (TrustPath)",
  failurePolicy: {
    action: "stop",
  },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.env": {},       // for environment variables
    "kinde.fetch": {},     // required for API requests (formerly secureFetch)
    "url": {},             // required for fetch
  },
};

// The workflow code to be executed when the event is triggered
export default async function handlePostAuth(
  event: onPostAuthenticationEvent
) {
  const isNewKindeUser = event.context.auth.isNewUserRecordCreated;
  const userId = event.context.user.id;
  const ip = event.request.ip?.split(",")[0].trim() ?? "unknown";

  console.log("🛠️ Workflow started", {
    userId,
    ip,
    isNewUser: isNewKindeUser,
  });

  // Get a token for Kinde management API
  const kindeAPI = await createKindeAPI(event);
  console.log("✅ Kinde API initialized");

  // Fetch user data
  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${userId}`,
  });
  console.log("🏷️ Fetched user", { id: user.id, email: user.preferred_email });

  // Prepare TrustPath payload
  const payload = {
    ip,
    email: user.preferred_email,
    user: {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    event_type: isNewKindeUser ? "account_register" : "account_login",
  };
  console.log("📨 Payload prepared", payload);

  // Retrieve TrustPath API key from env
  const apiKey = getEnvironmentVariable("TRUSTPATH_API_KEY")?.value;
  if (!apiKey) {
    console.error("❗ TRUSTPATH_API_KEY is missing from environment variables");
    throw new Error("Missing TrustPath API Key");
  }

  // Send POST request to TrustPath
  const resp = await fetch("https://api.trustpath.io/v1/risk/evaluate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: payload,
  });

  const trustData = await resp.json();
  console.log("📥 TrustPath response", trustData);

  const state = trustData?.data?.score?.state;
  console.log("🔍 Decision state:", state);

  if (state === "decline") {
    console.log("❌ Declined — denying access");
    denyAccess("Access blocked due to impossible travel risk.");
  } else {
    console.log("✅ Approved — allowing access");
    // Allow access, no further action needed
  }
}
