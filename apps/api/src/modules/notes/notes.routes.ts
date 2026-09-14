import { Elysia } from "elysia";
import { requireAuth } from "../../lib/middleware";
import { createNoteSchema, updateNoteSchema, noteQuerySchema } from "./notes.schema";
import { NotesService } from "./notes.service";

const notesService = new NotesService();

export const notesRoutes = new Elysia({ prefix: "/api/notes" })
  .use(requireAuth)
  .get(
    "/",
    async ({ user, query }) => {
      return await notesService.getNotes(user.id, {
        status: query.status,
        tagId: query.tagId,
        search: query.search,
        limit: query.limit ? Number(query.limit) : 50,
        offset: query.offset ? Number(query.offset) : 0,
      });
    },
    { query: noteQuerySchema }
  )
  .post(
    "/",
    async ({ user, body }) => {
      return await notesService.createNote(user.id, body);
    },
    { body: createNoteSchema }
  )
  .get("/:id", async ({ user, params }) => {
    return await notesService.getNote(user.id, params.id);
  })
  .patch(
    "/:id",
    async ({ user, params, body }) => {
      return await notesService.updateNote(user.id, params.id, body);
    },
    { body: updateNoteSchema }
  )
  .delete("/:id", async ({ user, params }) => {
    return await notesService.trashNote(user.id, params.id);
  })
  .delete("/:id/permanent", async ({ user, params }) => {
    return await notesService.deletePermanent(user.id, params.id);
  })
  .post("/:id/archive", async ({ user, params }) => {
    return await notesService.archiveNote(user.id, params.id);
  })
  .post("/:id/unarchive", async ({ user, params }) => {
    return await notesService.unarchiveNote(user.id, params.id);
  })
  .post("/:id/restore", async ({ user, params }) => {
    return await notesService.restoreNote(user.id, params.id);
  });
