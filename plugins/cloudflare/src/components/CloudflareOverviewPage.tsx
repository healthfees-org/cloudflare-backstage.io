import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  Page,
  Header,
  Content,
  InfoCard,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { cloudflareApiRef } from '../api/CloudflareClient';
import { useAsync } from 'react-use';

/**
 * Global overview page for Cloudflare resources
 */
export const CloudflareOverviewPage = () => {
  const api = useApi(cloudflareApiRef);

  const { value: r2Buckets } = useAsync(() => api.getR2Buckets(), []);
  const { value: d1Databases } = useAsync(() => api.getD1Databases(), []);
  const { value: kvNamespaces } = useAsync(() => api.getKVNamespaces(), []);
  const { value: queues } = useAsync(() => api.getQueues(), []);
  const { value: workflows } = useAsync(() => api.getWorkflows(), []);

  return (
    <Page themeId="tool">
      <Header title="Cloudflare Resources" subtitle="Overview of all Cloudflare resources" />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <InfoCard title="R2 Buckets">
              <Typography variant="h3">{r2Buckets?.length || 0}</Typography>
              <Typography variant="body2" color="textSecondary">
                Object storage buckets
              </Typography>
            </InfoCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <InfoCard title="D1 Databases">
              <Typography variant="h3">{d1Databases?.length || 0}</Typography>
              <Typography variant="body2" color="textSecondary">
                SQL databases
              </Typography>
            </InfoCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <InfoCard title="KV Namespaces">
              <Typography variant="h3">{kvNamespaces?.length || 0}</Typography>
              <Typography variant="body2" color="textSecondary">
                Key-value stores
              </Typography>
            </InfoCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <InfoCard title="Queues">
              <Typography variant="h3">{queues?.length || 0}</Typography>
              <Typography variant="body2" color="textSecondary">
                Message queues
              </Typography>
            </InfoCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <InfoCard title="Workflows">
              <Typography variant="h3">{workflows?.length || 0}</Typography>
              <Typography variant="body2" color="textSecondary">
                Workflow definitions
              </Typography>
            </InfoCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} style={{ marginTop: 24 }}>
          <Grid item xs={12}>
            <InfoCard title="Data Retention (R2)">
              {r2Buckets && r2Buckets.length > 0 ? (
                <Typography variant="body2">
                  {r2Buckets.length} R2 buckets configured. Check individual buckets for lifecycle rules.
                </Typography>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No R2 buckets found
                </Typography>
              )}
            </InfoCard>
          </Grid>

          <Grid item xs={12}>
            <InfoCard title="Database Inventory (D1)">
              {d1Databases && d1Databases.length > 0 ? (
                <Typography variant="body2">
                  {d1Databases.length} D1 databases. Refer to operational docs for backup/export guidance.
                </Typography>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No D1 databases found
                </Typography>
              )}
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
