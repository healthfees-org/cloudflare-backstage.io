import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'cloudflare',
});

export const entityContentRouteRef = createRouteRef({
  id: 'cloudflare-entity-content',
});
