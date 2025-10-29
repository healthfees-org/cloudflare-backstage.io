import React from 'react';
import { Entity } from '@backstage/catalog-model';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import { InfoCard, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { cloudflareApiRef } from '../api/CloudflareClient';
import { useAsync } from 'react-use';

interface CloudflareEntityContentProps {
  entity: Entity;
}

/**
 * Entity tab content showing Cloudflare resource details
 */
export const CloudflareEntityContent = ({ entity }: CloudflareEntityContentProps) => {
  const api = useApi(cloudflareApiRef);

  // Extract Cloudflare annotations
  const workerName = entity.metadata.annotations?.['cloudflare.com/worker'];
  const pagesProject = entity.metadata.annotations?.['cloudflare.com/pages'];
  const r2Bucket = entity.metadata.annotations?.['cloudflare.com/r2'];

  const { value: workerDeployments, loading: workerLoading } = useAsync(async () => {
    if (!workerName) return null;
    return api.getWorkerDeployments(workerName);
  }, [workerName]);

  const { value: pagesDeployments, loading: pagesLoading } = useAsync(async () => {
    if (!pagesProject) return null;
    return api.getPagesDeployments(pagesProject);
  }, [pagesProject]);

  const { value: r2Lifecycle, loading: r2Loading } = useAsync(async () => {
    if (!r2Bucket) return null;
    return api.getR2Lifecycle(r2Bucket);
  }, [r2Bucket]);

  const isLoading = workerLoading || pagesLoading || r2Loading;

  if (isLoading) {
    return <Progress />;
  }

  if (!workerName && !pagesProject && !r2Bucket) {
    return (
      <InfoCard title="Cloudflare Resources">
        <Typography variant="body1">
          No Cloudflare resources are linked to this component.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Add annotations like <code>cloudflare.com/worker: your-worker</code> to link resources.
        </Typography>
      </InfoCard>
    );
  }

  return (
    <>
      {workerName && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title={`Worker: ${workerName}`} />
          <Divider />
          <CardContent>
            {workerDeployments && workerDeployments.length > 0 ? (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Deployments
                </Typography>
                <List dense>
                  {workerDeployments.slice(0, 5).map((deployment: any, idx: number) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={`${deployment.version || deployment.id}`}
                        secondary={
                          <>
                            {deployment.createdOn && (
                              <span>Deployed: {new Date(deployment.createdOn).toLocaleString()}</span>
                            )}
                            {deployment.commitSha && (
                              <span> | Commit: {deployment.commitSha.substring(0, 8)}</span>
                            )}
                            {deployment.ciRunUrl && (
                              <>
                                {' | '}
                                <a href={deployment.ciRunUrl} target="_blank" rel="noopener noreferrer">
                                  CI Run
                                </a>
                              </>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No deployments found
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {pagesProject && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title={`Pages: ${pagesProject}`} />
          <Divider />
          <CardContent>
            {pagesDeployments && pagesDeployments.length > 0 ? (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Deployments
                </Typography>
                <List dense>
                  {pagesDeployments.slice(0, 5).map((deployment: any, idx: number) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={deployment.id}
                        secondary={
                          <>
                            <span>Env: {deployment.environment}</span>
                            {deployment.branch && <span> | Branch: {deployment.branch}</span>}
                            {deployment.commitSha && (
                              <span> | Commit: {deployment.commitSha.substring(0, 8)}</span>
                            )}
                            {deployment.status && <span> | Status: {deployment.status}</span>}
                            {deployment.url && (
                              <>
                                {' | '}
                                <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              </>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No deployments found
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {r2Bucket && (
        <Card>
          <CardHeader title={`R2 Bucket: ${r2Bucket}`} />
          <Divider />
          <CardContent>
            {r2Lifecycle && r2Lifecycle.rules && r2Lifecycle.rules.length > 0 ? (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Lifecycle Rules
                </Typography>
                <List dense>
                  {r2Lifecycle.rules.map((rule: any, idx: number) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={rule.id || `Rule ${idx + 1}`}
                        secondary={
                          <>
                            <span>Status: {rule.status}</span>
                            {rule.expiration?.days && (
                              <span> | Expire after {rule.expiration.days} days</span>
                            )}
                            {rule.transitions?.[0]?.days && (
                              <span> | Transition to IA after {rule.transitions[0].days} days</span>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No lifecycle rules configured
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
