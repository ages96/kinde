import {
  denyAccess,
  WorkflowSettings,
  WorkflowTrigger,
} from "@kinde/infrastructure";
import type { onPostAuthenticationEvent } from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "impossibleTravelCheck",
  name: "ImpossibleTravelCheck (TrustPath)",
  trigger: WorkflowTrigger.PostAuthentication,
  failurePolicy: { action: "stop" },
  bindings: {
    "kinde.auth": {},
    "kinde.secureFetch": {},
    "kinde.env": {},
    url: {}
  }
};

export default async function impossibleTravelWorkflow(
  event: onPostAuthenticationEvent
) {
  const kindeAPI = await event.kinde.auth.createKindeAPI(event);
  const { data: user } = await kindeAPI.get({
    endpoint: `user?id=${event.context.user.id}`,
  });

  const payload = {
    ip: event.request.ip.split(",")[0].trim(),
    email: user.preferred_email,
    user: {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name
    },
    event_type: event.context.auth.isNewUserRecordCreated
      ? "account_register"
      : "account_login"
  };

  const resp = await event.kinde.secureFetch(
    "https://api.trustpath.io/v1/risk/evaluate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${
          event.kinde.env.getEnvironmentVariable("TRUSTPATH_API_KEY")?.value
        }`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const { state } = (await resp.json()).data.score;
  if (state === "decline") {
    denyAccess("Access blocked due to impossible travel risk.");
  }
}
