# GitHub Webhook API

A NestJS application that receives and processes GitHub webhook events.

## Local Development Setup

### Prerequisites
- Node.js 20.x
- npm
- A GitHub repository with webhook events you want to test

### Installation

1. Install dependencies:
```bash
npm install
```

### Setting up Smee for Local Webhook Testing

1. Visit [Smee.io](https://smee.io) and create a new channel
2. Copy your unique Smee URL (it will look like `https://smee.io/your-channel-id`)
3. Update the Smee URL in `src/smee/smee.service.ts` with your channel URL
4. Install Smee CLI globally:
```bash
npm install -g smee-client
```

### Running the Application

1. Start the Smee client to forward webhooks to your local server:
```bash
smee --url https://smee.io/your-channel-id --path /webhook --port 3000
```

2. In a separate terminal, start the NestJS application:
```bash
npm run start:dev
```

### Configuring GitHub Webhooks

1. Go to your GitHub repository settings
2. Navigate to Webhooks > Add webhook
3. Set the Payload URL to your Smee URL
4. Set Content type to `application/json`
5. Select the events you want to receive
6. Click "Add webhook"

Now any events from your GitHub repository will be forwarded to your local application through Smee.

## Available Scripts

- `npm run start:dev` - Start the application in development mode
- `npm run build` - Build the application
- `npm run start:prod` - Start the application in production mode
- `npm run test` - Run tests
- `npm run lint` - Run linting

## Docker Image

Build docker image:
```shell
docker build -t iac-poc-api .
```


