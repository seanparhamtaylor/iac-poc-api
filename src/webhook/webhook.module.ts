import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { TemporalClient } from './temporal-client.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, TemporalClient],
})
export class WebhookModule {} 