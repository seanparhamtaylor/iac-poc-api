import { Module } from '@nestjs/common';
import { WebhookController } from './webhook/webhook.controller';
import { SmeeModule } from './smee/smee.module';

@Module({
  imports: [SmeeModule],
  controllers: [WebhookController],
  providers: [],
})
export class AppModule {} 