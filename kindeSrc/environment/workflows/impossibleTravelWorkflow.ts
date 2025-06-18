import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  denyAccess,
  getEnvironmentVariable,
  fetch,
} from "@kinde/infrastructure";

// Workflow settings
export const workflowSettings: WorkflowSettings = {
  id: "impossibleTravelWorkflow",
  name: "ImpossibleTravelCheck (TrustPath)",
  failurePolicy: { action: "stop" },
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.auth": {},
    "kinde.env": {},
    "kinde.fetch": {},
    "url": {},
  },
};

// Workflow logic
export default onPostAuthenticationEvent(async (event) => {
  const user = event.context.user;
  const isNew = event.context.auth?.isNewUserRecordCreated ?? false;

  const ip =
    typeof event.request.ip === "string" && event.request.ip.length
      ? event.request.ip.split(",")[0].trim()
      : "0.0.0.0"; // fallback IP

  console.log("Workflow started", { userId: user.id, ip, isNewUser: isNew });

  const payload = {
    ip,
    email: user.preferred_email,
    user: {
      user_id: user.id,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
    },
    event_type: isNew ? "account_register" : "account_login",
  };

  console.log("Payload prepared", payload);

  const apiKey = getEnvironmentVariable("TRUSTPATH_API_KEY")?.value;
  if (!apiKey) {
    console.error("TRUSTPATH_API_KEY is missing");
    throw new Error("Missing TRUSTPATH_API_KEY environment variable");
  }

  const response = await fetch("https://api.trustpath.io/v1/risk/evaluate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: payload,
    responseFormat: "json",
  });

  if (!response.ok) {
    console.error("TrustPath returned non-2xx response", response.status);
    denyAccess(`TrustPath responded with HTTP ${response.status}`);
    return;
  }

  let state: string | undefined;
  try {
    state = response?.data?.data?.score?.state;
  } catch (error) {
    console.error("Failed to parse TrustPath response", error);
    denyAccess("Unable to parse TrustPath response");
    return;
  }

  console.log("Decision state:", state);

  if (state === "decline") {
    console.warn("Access declined due to risk score");
    denyAccess("Access blocked due to impossible travel risk.");
  } else {
    console.log("Access approved by TrustPath");
  }
});