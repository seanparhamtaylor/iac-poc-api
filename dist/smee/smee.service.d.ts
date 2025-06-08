import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class SmeeService implements OnModuleInit, OnModuleDestroy {
    private smee;
    private events;
    constructor();
    onModuleInit(): void;
    onModuleDestroy(): void;
}
