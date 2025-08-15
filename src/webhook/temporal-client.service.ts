import { Connection, Client } from '@temporalio/client';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TemporalClient {
  private readonly configService: ConfigService;
  private readonly temporalAddress: string;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.temporalAddress = this.configService.get<string>('TEMPORAL_ADDRESS') || 'localhost:7233';
  }

  async runPlanWorkflow(args: any) {
    try {
      const connection = await Connection.connect({ address: this.temporalAddress });

      const client = new Client({
        connection
      });

      const workflowId = `tf-plan-${args.owner}-${args.repository}-${args.pullRequestNumber}-` + nanoid(6);
      const handle = await client.workflow.start('planWorkflow', {
        taskQueue: 'temporal-terraform',
        args: [args, workflowId],
        workflowId: workflowId,
        memo: {
          "github-org": args.owner,
          "github-repository": args.repository,
          "github-pr-number": args.pullRequestNumber,
          "github-ref": args.ref,
          "github-path": args.terraformPath
        }
      });

      console.log(`Started workflow ${handle.workflowId}`);
      handle.result().then((result) => {
        console.log(JSON.stringify(result, null, 2));
      });
    } catch (error) {
      console.error('Failed to trigger Temporal workflow', error);
    }
  }

  async runApplyWorkflow(args: any) {
    try {
      const connection = await Connection.connect({ address: this.temporalAddress });

      const client = new Client({
        connection
      });

      // Old: Uses the hello world worker (called as terraform-worker in the docker-compose.yaml)
      // const handle = await client.workflow.start('example', {
      //   taskQueue: 'hello-world',
      //   args: ['Temporal'],
      //   workflowId: 'workflow-' + nanoid(),
      // });     
      
      const workflowId = `tf-apply-${args.owner}-${args.repository}-${args.pullRequestNumber}-` + nanoid(6);
      const handle = await client.workflow.start('applyWorkflow', {
        taskQueue: 'temporal-terraform',
        args: [args, workflowId],
        workflowId: workflowId,
        memo: {
          "github-org": args.owner,
          "github-repository": args.repository,
          "github-pr-number": args.pullRequestNumber,
          "github-path": args.terraformPath
        }
      });

      console.log(`Started workflow ${handle.workflowId}`);
      handle.result().then((result) => {
        console.log(JSON.stringify(result, null, 2));
      });

      // optional: wait for client result
      // console.log(await handle.result());
    } catch (error) {
      console.error('Failed to trigger Temporal workflow', error);
    }
  }

  async runPostBuildSimulationWorkflow(args: any) {
    try {
      const connection = await Connection.connect({ address: this.temporalAddress });

      const client = new Client({
        connection
      });

      const workflowId = `post-build-simulation-${args.owner}-${args.repository}-${args.pullRequestNumber}-` + nanoid(6);
      const handle = await client.workflow.start('postBuildSimulationWorkflow', {
        taskQueue: 'temporal-terraform',
        args: [args, workflowId],
        workflowId: workflowId,
        memo: {
          "github-org": args.owner,
          "github-repository": args.repository,
          "github-pr-number": args.pullRequestNumber,
          "github-path": args.terraformPath
        }
      });

      console.log(`Started workflow ${handle.workflowId}`);
      handle.result().then((result) => {
        console.log(JSON.stringify(result, null, 2));
      });

      // optional: wait for client result
      // console.log(await handle.result());
    } catch (error) {
      console.error('Failed to trigger Temporal workflow', error);
    }
  }

}

