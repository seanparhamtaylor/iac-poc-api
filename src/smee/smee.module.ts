import { Module } from '@nestjs/common';
import { SmeeService } from './smee.service';

@Module({
  providers: [SmeeService],
  exports: [SmeeService],
})
export class SmeeModule {} 