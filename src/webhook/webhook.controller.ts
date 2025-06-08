import { Controller, Post, Headers, Body, HttpCode } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Body() payload: any,
  ) {
    console.log(`Received GitHub webhook event: ${event}`);
    console.log(`Delivery ID: ${deliveryId}`);
    console.log('Payload:', payload);

    // TODO: Add webhook signature verification
    // TODO: Add event-specific processing logic

    return { received: true };
  }
} 