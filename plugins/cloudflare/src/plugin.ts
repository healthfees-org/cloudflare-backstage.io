import {
  createPlugin,
  createApiFactory,
  discoveryApiRef,
  identityApiRef,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { cloudflareApiRef, CloudflareClient } from './api/CloudflareClient';

export const cloudflarePlugin = createPlugin({
  id: 'cloudflare',
  apis: [
    createApiFactory({
      api: cloudflareApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, identityApi }) =>
        new CloudflareClient({ discoveryApi, identityApi }),
    }),
  ],
});

export const CloudflareOverviewPage = cloudflarePlugin.provide(
  createRoutableExtension({
    name: 'CloudflareOverviewPage',
    component: () =>
      import('./components/CloudflareOverviewPage').then(m => m.CloudflareOverviewPage),
    mountPoint: import('./routes').then(m => m.rootRouteRef),
  }),
);

export const EntityCloudflareContent = cloudflarePlugin.provide(
  createRoutableExtension({
    name: 'EntityCloudflareContent',
    component: () =>
      import('./components/CloudflareEntityContent').then(m => m.CloudflareEntityContent),
    mountPoint: import('./routes').then(m => m.entityContentRouteRef),
  }),
);
