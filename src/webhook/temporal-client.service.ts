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

      // Old: Uses the hello world worker (called as terraform-worker in the docker-compose.yaml)
      // const handle = await client.workflow.start('example', {
      //   taskQueue: 'hello-world',
      //   args: ['Temporal'],
      //   workflowId: 'workflow-' + nanoid(),
      // });     
      
      const workflowId = 'tf-plan-' + nanoid();
      const handle = await client.workflow.start('planWorkflow', {
        taskQueue: 'temporal-terraform',
        args: [args, workflowId],
        workflowId: workflowId,
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
      
      const workflowId = 'tf-apply-' + nanoid();
      const handle = await client.workflow.start('applyWorkflow', {
        taskQueue: 'temporal-terraform',
        args: [args, workflowId],
        workflowId: workflowId,
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

