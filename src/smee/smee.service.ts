import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class SmeeService implements OnModuleInit, OnModuleDestroy {
  private smee: any;
  private events: any;

  constructor() {
    const SmeeClient = require('smee-client');
    this.smee = new SmeeClient({
      source: 'https://smee.io/PFfOuGcmr5rarif',
      target: 'http://localhost:3000/webhook',
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