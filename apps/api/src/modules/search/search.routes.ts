import { Elysia, t } from "elysia";
import { requireAuth } from "../../lib/middleware";
import { SearchService } from "./search.service";

const searchService = new SearchService();

export const searchRoutes = new Elysia({ prefix: "/api/search" })
  .use(requireAuth)
  .get(
    "/",
    async ({ user, query }) => {
      return await searchService.search(user.id, query.q || "");
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    }
  );
