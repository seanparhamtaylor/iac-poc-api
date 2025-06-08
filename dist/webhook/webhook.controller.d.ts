export declare class WebhookController {
    handleWebhook(event: string, deliveryId: string, payload: any): Promise<{
        received: boolean;
    }>;
}
