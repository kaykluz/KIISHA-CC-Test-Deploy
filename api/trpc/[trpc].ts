import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Enable CORS
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  setCorsHeaders(res);

  // Handle tRPC requests
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: req as any,
    router: appRouter,
    createContext: async ({ req, resHeaders }) => {
      return createContext({
        req: req as any,
        res: res as any,
      });
    },
    onError({ error, type, path, input, ctx, req }) {
      console.error("tRPC Error:", { error: error.message, type, path });
    },
  }).then((response) => {
    // Convert fetch Response to Vercel response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(response.status);

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        pump();
      };
      pump();
    } else {
      res.end();
    }
  });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};