import {
  denyAccess,
  WorkflowSettings,
  WorkflowTrigger,
} from "@kinde/infrastructure";
import type { onPostAuthenticationEvent } from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "impossibleTravelWorkflow",
  name: "ImpossibleTravel Check",
  trigger: WorkflowTrigger.PostAuthentication,
  failurePolicy: { action: "stop" },
  bindings: {
    "kinde.auth": {},
    "kinde.secureFetch": {},
    "kinde.env": {},
    "kinde.url": {}  
  }
};

export default async function impossibleTravelWorkflow(
  event: onPostAuthenticationEvent
) {
  console.log("🛠️ Workflow started", {
    userId: event.context.user.id,
    ip: event.request.ip,
    isNewUser: event.context.auth.isNewUserRecordCreated
  });

  // Ensure these properties are now defined
  const kindeAPI = await event.kinde.auth.createKindeAPI(event);
  console.log("✅ event.kinde.auth is available");

  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${event.context.user.id}`,
  });
  console.log("🏷️ Fetched user", { id: user.id, email: user.preferred_email });

  const payload = {
    ip: event.request.ip.split(",")[0].trim(),
    email: user.preferred_email,
    user: {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    event_type: event.context.auth.isNewUserRecordCreated
      ? "account_register"
      : "account_login"
  };
  console.log("📨 Payload prepared", payload);

  const resp = await event.kinde.secureFetch(
    "https://api.trustpath.io/v1/risk/evaluate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${event.kinde.env
          .getEnvironmentVariable("TRUSTPATH_API_KEY")
          ?.value}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const trustData = await resp.json();
  console.log("📥 TrustPath response", trustData);

  const state = trustData.data.score.state;
  console.log("🔍 Decision state:", state);

  if (state === "decline") {
    console.log("❌ Declined — denying access");
    denyAccess("Access blocked due to impossible travel risk.");
  } else {
    console.log("✅ Approved — allowing access");
  }
}
