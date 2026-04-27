import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getSessionFromRequest, verifySession } from "./jwtAuth";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = getSessionFromRequest(opts.req);
    const session = await verifySession(token);
    if (session) {
      user = (await getUserById(session.userId)) ?? null;
    }
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}
