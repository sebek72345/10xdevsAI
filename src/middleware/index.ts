import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  const authHeader = context.request.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "") ||
    context.cookies.get("sb-access-token")?.value;

  if (accessToken) {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);

      if (!error && user) {
        (context.locals as any).user = user;
      }
    } catch (error) {
      console.error("Error verifying auth token:", error);
    }
  }

  return next();
});
