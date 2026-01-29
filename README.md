This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Auth0 + SAP Setup

Create a `.env.local` file with the following variables:

```bash
AUTH0_SECRET=replace-with-long-random-string
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=YOUR_DOMAIN
AUTH0_CLIENT_ID=YOUR_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET

# SAP API integration
# Provide just the host base; the app appends the fixed OData paths and filters.
SAP_BASE_API_URL=https://my419914-api.s4hana.cloud.sap
# Optional: override OData filter field for product lookup (default: ProductStandardID)
SAP_PRODUCT_FILTER_FIELD=ProductStandardID

# Auth options (pick one)
SAP_BASIC_AUTH_USER=optional-user
SAP_BASIC_AUTH_PASS=optional-pass
# or SAP_BASIC_AUTH=base64token (with or without "Basic ")
SAP_API_TOKEN=optional-bearer-token

SAP_API_KEY_HEADER=optional-api-key-header
SAP_API_KEY_VALUE=optional-api-key-value
```

Auth0 callback URLs should include:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000`

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Google fonts.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
