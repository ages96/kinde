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

  let kindeAPI;
  try {
    kindeAPI = await createKindeAPI(event);
  } catch (err) {
    console.error('❌ Failed to create Kinde API client:', err);
    throw err;
  }

  const clientId = event?.context?.application?.clientId;
  if (!clientId) {
    console.error('❌ clientId is missing from event context.');
    throw new Error('Missing clientId in event context.');
  }

  let data;
  try {
    const response = await kindeAPI.get({ endpoint: `applications/${clientId}/properties` });
    data = response.data;
    console.log('✅ Retrieved application properties:', data);
  } catch (err) {
    console.error(`❌ Failed to fetch properties for clientId ${clientId}:`, err);
    throw err;
  }

  if (!Array.isArray(data?.properties)) {
    console.warn('⚠️ No properties found in response.');
  }

  const externalOrganizationId = data.properties?.find(
    (prop) => prop.key === 'external_organization_id'
  );

  console.log('externalOrganizationId:', externalOrganizationId);

  const m2mToken = m2mTokenClaims<{ external_organization_id?: string }>();
  if (externalOrganizationId?.value) {
    m2mToken.external_organization_id = externalOrganizationId.value;
    console.log(`✅ Set external_organization_id: ${externalOrganizationId.value}`);
  } else {
    console.warn('⚠️ external_organization_id not found in application properties.');
  }
}
