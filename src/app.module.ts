import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmeeModule } from './smee/smee.module';
import { WebhookModule } from './webhook/webhook.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    StoreModule,
    SmeeModule,
    WebhookModule,
  ],
})
export class AppModule {} 