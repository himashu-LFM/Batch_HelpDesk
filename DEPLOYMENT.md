# AWS Lambda Serverless Deployment

This project is deployable to AWS Lambda as a scheduled batch using Serverless Framework.

## 1) Prerequisites

- Node.js 20+.
- AWS account and IAM user/role with permissions for CloudFormation, Lambda, IAM, EventBridge, CloudWatch Logs, and S3.

## 2) Required environment variables

### AWS auth and region

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (only if using temporary STS creds)
- `AWS_REGION` (for example `ap-south-1`)

### App configuration

- `DATABASE_URL`
- `EMAIL_PROVIDER` (`smtp` or `mock`)
- `EMAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `FACILITIES_ESCALATION_DURATION`
- `CARE_ESCALATION_DURATION`
- `DRY_RUN`
- `SCHEDULE_EXPRESSION` (for example `rate(5 minutes)` or `cron(0/10 * * * ? *)`)

You can copy `.env.example` and fill values.

## 3) Deploy

```bash
npm ci
npm run build:lambda
npm run sls:deploy
```

For production stage:

```bash
npm run build:lambda
npm run sls:deploy:prod
```

## 4) Apply database migrations

Run this from CI/CD or a trusted runner that has DB access:

```bash
npm run migrate:deploy
```

## Notes

- Escalation DB updates run in a transaction, and email sending runs outside that transaction for better Lambda resilience.
- If Lambda runs in a VPC, ensure route access to PostgreSQL and SMTP host.
- `template.yaml` is also included if you prefer AWS SAM deployment.
