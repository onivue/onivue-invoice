import { db } from "@onivue-invoice/db";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type ActiveSession = {
  user: SessionUser;
  session: {
    id: string;
    userId: string;
    activeOrganizationId?: string | null;
  };
};

export function createContext({
  session,
}: {
  session: ActiveSession | null;
}) {
  return {
    session,
    db,
  };
}

export type Context = ReturnType<typeof createContext>;
