"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmeeService = void 0;
const common_1 = require("@nestjs/common");
let SmeeService = class SmeeService {
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
};
exports.SmeeService = SmeeService;
exports.SmeeService = SmeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmeeService);
//# sourceMappingURL=smee.service.js.map