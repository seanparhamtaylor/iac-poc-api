import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { StoreService } from '../store/store.service';
import { TemporalClient } from './temporal-client.service';

@Injectable()
export class WebhookService {
    private readonly octokit: Octokit;

    constructor(private readonly configService: ConfigService,
        private readonly checkRunStore: StoreService,
        private readonly temporalClient: TemporalClient) {
        const appId = this.configService.get<string>('GITHUB_APP_ID');
        let privateKey = this.configService.get<string>('GITHUB_APP_PRIVATE_KEY');

        if (!appId || !privateKey) {
            const missingVars = [];
            if (!appId) missingVars.push('GITHUB_APP_ID');
            if (!privateKey) missingVars.push('GITHUB_APP_PRIVATE_KEY');
            throw new Error(`GitHub App credentials are not properly configured. Missing: ${missingVars.join(', ')}`);
        }

        // Format the private key
        privateKey = privateKey.replace(/\\n/g, '\n');
        if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
            privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`;
        }

        try {
            this.octokit = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    appId,
                    privateKey,
                },
            });
        } catch (error) {
            console.error('Error initializing Octokit:', error);
            throw new Error('Failed to initialize GitHub App authentication');
        }
    }

    verifySignature(payload: string, signature: string): boolean {
        const webhookSecret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
        if (!webhookSecret) {
            console.error('GITHUB_WEBHOOK_SECRET is not configured');
            throw new UnauthorizedException('GITHUB_WEBHOOK_SECRET is not configured');
        }

        console.log('Verifying webhook signature:');
        console.log('Received signature:', signature);

        const hmac = createHmac('sha256', webhookSecret);
        const calculatedSignature = `sha256=${hmac.update(payload).digest('hex')}`;
        console.log('Calculated signature:', calculatedSignature);

        const isValid = calculatedSignature === signature;
        console.log('Signature valid:', isValid);

        return isValid;
    }

    async handlePullRequestEvent(payload: any) {
        const { action, pull_request, repository } = payload;

        if (action !== 'opened' && action !== 'synchronize') {
            return;
        }

        // Create an authenticated client for this installation
        const installationOctokit = new Octokit({
            auth: (await this.octokit.auth({
                type: 'installation',
                installationId: process.env.GITHUB_APP_INSTALLATION_ID,
            }) as { token: string }).token,
        });

        // Get installation ID for the repository
        // const installation = await this.octokit.apps.getRepoInstallation({
        //   owner: repository.owner.login,
        //   repo: repository.name,
        // });

        const preFlightCheckRun = await installationOctokit.checks.create({
            owner: repository.owner.login,
            repo: repository.name,
            name: 'Pre-Flight Check',
            head_sha: pull_request.head.sha,
            status: 'in_progress',
            output: {
                title: 'Pre-Flight Check',
                summary: 'Preparing strategy',
            },
        });

        // add a comment to the pull request
        await installationOctokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: pull_request.number,
            body: 'Request received. Let\'s do this!',
        });

        const args = {
            repository: repository.name,
            owner: repository.owner.login,
            pullRequestNumber: pull_request.number.toString(),
            ref: pull_request.head.ref,
            terraformPath: './'
        };

        console.log('Temporal workflow args:', JSON.stringify(args, null, 2));

        await this.temporalClient.runPlanWorkflow(args);

        // Create a check run
        const terraformPlanGhaCheckRun = await installationOctokit.checks.create({
            owner: repository.owner.login,
            repo: repository.name,
            name: 'Terraform Plan (GitHub Actions)',
            head_sha: pull_request.head.sha,
            status: 'queued',
            output: {
                title: 'Terraform Plan',
                summary: 'Queued for execution',
            },
        });

        await installationOctokit.checks.update({
            owner: repository.owner.login,
            repo: repository.name,
            check_run_id: preFlightCheckRun.data.id,
            status: 'completed',
            conclusion: 'success',
            output: {
                title: 'Pre-Flight Check',
                summary: 'Strategy prepared',
            },
        });

        const details = {
            checkRun: terraformPlanGhaCheckRun.data,
            pullRequest: pull_request,
            repository: repository
        };

        this.checkRunStore.set(terraformPlanGhaCheckRun.data.id.toString(), details);

        // Dispatch workflow in iac-poc-workflow repository
        const result = await installationOctokit.repos.createDispatchEvent({
            owner: repository.owner.login,
            repo: 'iac-poc-workflow',
            event_type: 'terraform-plan',
            client_payload: {
                repository: repository.full_name,
                ref: pull_request.head.ref,
                check_run_id: terraformPlanGhaCheckRun.data.id.toString(),
                pr_number: pull_request.number.toString(),
                correlation_id: terraformPlanGhaCheckRun.data.id.toString()
            }
        });

        console.log('Dispatch workflow result:', result);

        return terraformPlanGhaCheckRun.data;
    }

    async handleApplyEvent(payload: any) {
        const { issue, repository } = payload;

        const args = {
            repository: repository.name,
            owner: repository.owner.login,
            pullRequestNumber: issue.number.toString(),
            terraformPath: './'
        };

        console.log('Temporal TF Apply workflow args:', JSON.stringify(args, null, 2));

        await this.temporalClient.runApplyWorkflow(args);
    }

    async handleWorkflowJobEvent(payload: any) {
        const { action, workflow_job } = payload;

        if (action === 'queued' || action === 'in_progress') {
            // update the check run created in the pull request event
            const correlationId = workflow_job.workflow_name.split('CID: ')[1];
            console.log('Correlation ID:', correlationId);
            const details = this.checkRunStore.get(correlationId);
            if (details) {
                console.log('Check run found for correlation ID (queued/in_progress):', correlationId);
                console.log('Check run:', JSON.stringify(details, null, 2));
                const checkRun = details.checkRun;
                checkRun.status = 'in_progress';
                checkRun.output.summary = 'In progress';
                details.checkRun = checkRun;
                this.checkRunStore.set(correlationId, details);

                const installationOctokit = new Octokit({
                    auth: (await this.octokit.auth({
                        type: 'installation',
                        installationId: process.env.GITHUB_APP_INSTALLATION_ID,
                    }) as { token: string }).token,
                });

                const result = await installationOctokit.checks.update({
                    owner: details.repository.owner.login,
                    repo: details.repository.name,
                    check_run_id: checkRun.id,
                    status: 'in_progress',
                    details_url: workflow_job.html_url,
                    output: {
                        title: 'Terraform Plan',
                        summary: 'In progress',
                        text: 'Terraform plan in progress',
                    },
                });

                console.log('Update check run result:', result);
            } else {
                console.log('No check run found for correlation ID:', correlationId);
            }
        }

        if (action === 'completed') {
            const correlationId = workflow_job.workflow_name.split('CID: ')[1];
            console.log('Correlation ID:', correlationId);
            const details = this.checkRunStore.get(correlationId);
            if (details) {
                console.log('Check run found for correlation ID (completed):', correlationId);
                console.log('Check run:', JSON.stringify(details, null, 2));
                const checkRun = details.checkRun;
                checkRun.status = 'completed';
                checkRun.output.summary = 'Completed';
                details.checkRun = checkRun;
                this.checkRunStore.set(correlationId, details);

                const installationOctokit = new Octokit({
                    auth: (await this.octokit.auth({
                        type: 'installation',
                        installationId: process.env.GITHUB_APP_INSTALLATION_ID,
                    }) as { token: string }).token,
                });

                const result = await installationOctokit.checks.update({
                    owner: details.repository.owner.login,
                    repo: details.repository.name,
                    check_run_id: checkRun.id,
                    status: 'completed',
                    conclusion: 'success',
                    output: {
                        title: 'Terraform Plan',
                        summary: 'Completed',
                        text: 'Terraform plan completed',
                    },
                });

                console.log('Update check run result:', result);
            } else {
                console.log('No check run found for correlation ID:', correlationId);
            }
        }
    }
} 