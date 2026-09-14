import { Elysia } from "elysia";
import { requireAuth } from "../../lib/middleware";
import { createTagSchema, updateTagSchema } from "./tags.schema";
import { TagsService } from "./tags.service";

const tagsService = new TagsService();

export const tagsRoutes = new Elysia({ prefix: "/api/tags" })
  .use(requireAuth)
  .get("/", async ({ user }) => {
    return await tagsService.getTags(user.id);
  })
  .post(
    "/",
    async ({ user, body }) => {
      return await tagsService.createTag(user.id, body.name, body.color);
    },
    { body: createTagSchema }
  )
  .patch(
    "/:id",
    async ({ user, params, body }) => {
      return await tagsService.updateTag(user.id, params.id, body);
    },
    { body: updateTagSchema }
  )
  .delete("/:id", async ({ user, params }) => {
    return await tagsService.deleteTag(user.id, params.id);
  });
