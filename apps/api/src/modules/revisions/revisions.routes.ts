import { Elysia } from "elysia";
import { requireAuth } from "../../lib/middleware";
import { RevisionsService } from "./revisions.service";

const revisionsService = new RevisionsService();

export const revisionsRoutes = new Elysia({ prefix: "/api/notes" })
  .use(requireAuth)
  .get("/:id/revisions", async ({ user, params }) => {
    return await revisionsService.getRevisions(user.id, params.id);
  })
  .post("/:id/revisions/:revisionId/restore", async ({ user, params }) => {
    return await revisionsService.restoreRevision(user.id, params.id, params.revisionId);
  });
