import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  getEnvironmentVariable,
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
    "kinde.env": {},     // Environment variables
    "kinde.fetch": {},   // External API calls
    "url": {},           // Required under the hood
  },
};

// The workflow logic
export default async function handlePostAuth(
  event: onPostAuthenticationEvent
) {
  const user = event.context.user;
  const isNew = event.context.auth.isNewUserRecordCreated;
  const ip = event.request.ip?.split(",")[0].trim() ?? "unknown";

  console.log("🛠️ Workflow started", {
    userId: user.id,
    ip,
    isNewUser: isNew,
  });

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
  console.log("📨 Payload prepared", payload);

  const apiKey = getEnvironmentVariable("TRUSTPATH_API_KEY")?.value;
  if (!apiKey) {
    console.error("❗ Missing TRUSTPATH_API_KEY in environment variables");
    throw new Error("Missing TrustPath API Key");
  }

  // ✅ Use kinde.fetch with responseFormat "json"
  const { data: trustData } = await fetch(
    "https://api.trustpath.io/v1/risk/evaluate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: payload,
      responseFormat: "json", // required for Kinde's fetch binding :contentReference[oaicite:1]{index=1}
    }
  );

  console.log("📥 TrustPath response", trustData);

  const state = trustData?.data?.score?.state;
  console.log("🔍 Decision state:", state);

  if (state === "decline") {
    console.log("❌ Declined — denying access");
    denyAccess("Access blocked due to impossible travel risk.");
  } else {
    console.log("✅ Approved — allowing access");
    // Access granted
  }
}
