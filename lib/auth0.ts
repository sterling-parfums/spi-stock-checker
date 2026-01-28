import { Auth0Client } from "@auth0/nextjs-auth0/server";

const resolveDomain = () => {
  if (process.env.AUTH0_DOMAIN) return process.env.AUTH0_DOMAIN;
  const issuer = process.env.AUTH0_ISSUER_BASE_URL;
  if (!issuer) return undefined;
  try {
    return new URL(issuer).host;
  } catch {
    return issuer;
  }
};

const resolveAppBaseUrl = () => {
  return process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL;
};

export const auth0 = new Auth0Client({
  domain: resolveDomain(),
  appBaseUrl: resolveAppBaseUrl(),
});
