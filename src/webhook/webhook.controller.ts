import { Controller, Post, Headers, Body, HttpCode, UnauthorizedException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import * as fs from 'fs';
import { sign } from 'crypto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) { }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    console.log('Webhook Request Details:');
    console.log('Event:', event);
    console.log('Delivery ID:', deliveryId);
    console.log('Signature:', signature);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // const now = new Date().toDateString() + '_' + new Date().toTimeString().replace(/ /g, '_').split(':')[0] + ':' + new Date().toTimeString().replace(/ /g, '_').split(':')[1];
    // fs.mkdirSync(`event-log/${now}/${payload.repository.full_name}/${event}`, { recursive: true });
    // fs.writeFileSync(`event-log/${now}/${payload.repository.full_name}/${event}/payload-${deliveryId}.json`, JSON.stringify(payload, null, 2));

    // Verify webhook signature
    const rawBody = JSON.stringify(payload);
    if (!this.webhookService.verifySignature(rawBody, signature)) {
      console.error('Webhook signature verification failed');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Handle pull request events
    if (event === 'pull_request') {
      return this.webhookService.handlePullRequestEvent(payload);
    }

    if (event === 'workflow_job') {
      return this.webhookService.handleWorkflowJobEvent(payload);
    }

    if (event === 'issue_comment' && payload.action === 'created') {
      if (payload.comment.body.toLowerCase() === 'terraform apply') {
        return this.webhookService.handleApplyEvent(payload);
      }
    }

    return { received: true };
  }
}
