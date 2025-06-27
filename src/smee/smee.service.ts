import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmeeService implements OnModuleInit, OnModuleDestroy {
  private smee: any;
  private events: any;

  constructor(private configService: ConfigService) {
    const SmeeClient = require('smee-client');
    this.smee = new SmeeClient({
      source: this.configService.get<string>('SMEE_SOURCE_URL'),
      target: this.configService.get<string>('SMEE_TARGET_URL') || 'http://localhost:3000/webhook',
      logger: console,
    });
  }

  onModuleInit() {
    this.events = this.smee.start();
    console.log('Smee client started');
  }

  onModuleDestroy() {
    if (this.events) {
      this.events.close();
      console.log('Smee client stopped');
    }
  }
}

// OLD
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// @Injectable()
// export class SmeeService implements OnModuleInit, OnModuleDestroy {
//   private smee: any;
//   private events: any;

//   constructor() {
//     const SmeeClient = require('smee-client');
//     this.smee = new SmeeClient({
//       source: 'https://smee.io/PFfOuGcmr5rarif',
//       target: 'http://localhost:3000/webhook',
//       logger: console,
//     });
//   }

//   onModuleInit() {
//     this.events = this.smee.start();
//     console.log('Smee client started');
//   }

//   onModuleDestroy() {
//     if (this.events) {
//       this.events.close();
//       console.log('Smee client stopped');
//     }
//   }
// } 