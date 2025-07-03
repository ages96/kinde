import {
  createKindeAPI,
  m2mTokenClaims,
  onM2MTokenGeneratedEvent,
  WorkflowSettings,
  WorkflowTrigger,
} from '@kinde/infrastructure';

export const workflowSettings: WorkflowSettings = {
  id: 'm2mTokenGeneration',
  name: 'M2M custom claims',
  failurePolicy: {
    action: 'stop',
  },
  trigger: WorkflowTrigger.M2MTokenGeneration,
  bindings: {
    'kinde.m2mToken': {},
    'kinde.fetch': {},
    'kinde.env': {},
    url: {},
  },
};

export default async function Workflow(event: onM2MTokenGeneratedEvent) {
  console.log('event:', event);
  const kindeAPI = await createKindeAPI(event);
  const { clientId } = event.context.application;
  const { data } = await kindeAPI.get({ endpoint: `applications/${clientId}/properties` });
  console.log('data:', data);
  const externalOrganizationId = data.properties?.find((prop) => prop.key === 'external_organization_id');
  console.log('externalOrganizationId:', externalOrganizationId);
  const m2mToken = m2mTokenClaims<{ external_organization_id?: string }>();
  m2mToken.external_organization_id = externalOrganizationId?.value;
}