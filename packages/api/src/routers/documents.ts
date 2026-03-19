// ============================================================================
// Documents Router - Document intelligence and RAG
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";

import { protectedProcedure } from "../index";
import { document, documentChunk } from "@my-ai-stack/db/schema";
import { eq, desc, and } from "drizzle-orm";

// Create document input
const createDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  originalName: z.string().optional(),
  mimeType: z.string(),
  size: z.number().int().positive(),
  storageKey: z.string(),
  storageUrl: z.string().url().optional(),
  extractedText: z.string().optional(),
  extractedMetadata: z.record(z.unknown()).optional(),
  folder: z.string().default("/"),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

// Update document input
const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Search documents input
const searchDocumentsSchema = z.object({
  query: z.string(),
  folder: z.string().optional(),
  mimeType: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

export const documentsRouter = {
  // Create a new document
  create: protectedProcedure
    .input(createDocumentSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const newDocument = {
        id: nanoid(),
        userId,
        ...input,
        status: "pending",
        isIndexed: false,
        chunkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(document).values(newDocument).returning();
      return created;
    }),

  // List documents
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      folder: z.string().optional(),
      status: z.enum(["pending", "processing", "indexed", "error"]).optional(),
      isIndexed: z.boolean().optional(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      let conditions = [eq(document.userId, userId)];
      
      if (input.folder) {
        conditions.push(eq(document.folder, input.folder));
      }
      
      if (input.status) {
        conditions.push(eq(document.status, input.status));
      }
      
      if (input.isIndexed !== undefined) {
        conditions.push(eq(document.isIndexed, input.isIndexed));
      }
      
      const documents = await db
        .select()
        .from(document)
        .where(and(...conditions))
        .orderBy(desc(document.createdAt))
        .limit(input.limit);
      
      return documents;
    }),

  // Get a single document
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [doc] = await db
        .select()
        .from(document)
        .where(and(eq(document.id, input.id), eq(document.userId, userId)))
        .limit(1);
      
      if (!doc) {
        throw new Error("Document not found");
      }
      
      return doc;
    }),

  // Update a document
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateDocumentSchema,
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [updated] = await db
        .update(document)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(document.id, input.id), eq(document.userId, userId)))
        .returning();
      
      if (!updated) {
        throw new Error("Document not found");
      }
      
      return updated;
    }),

  // Delete a document
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [deleted] = await db
        .delete(document)
        .where(and(eq(document.id, input.id), eq(document.userId, userId)))
        .returning();
      
      if (!deleted) {
        throw new Error("Document not found");
      }
      
      // Also delete chunks
      await db
        .delete(documentChunk)
        .where(eq(documentChunk.documentId, input.id));
      
      return { success: true };
    }),

  // Search documents
  search: protectedProcedure
    .input(searchDocumentsSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Simple text search for now
      // In production, this would use vector similarity search
      let conditions = [
        eq(document.userId, userId),
        eq(document.isIndexed, true),
      ];
      
      if (input.folder) {
        conditions.push(eq(document.folder, input.folder));
      }
      
      if (input.mimeType) {
        conditions.push(eq(document.mimeType, input.mimeType));
      }
      
      const documents = await db
        .select()
        .from(document)
        .where(and(...conditions))
        .limit(input.limit);
      
      // Filter by text content match
      const filtered = documents.filter((doc: { extractedText: string | null; name: string; tags: string[] | null }) => {
        const searchLower = input.query.toLowerCase();
        return (
          (doc.extractedText?.toLowerCase().includes(searchLower)) ||
          (doc.name.toLowerCase().includes(searchLower)) ||
          (doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)))
        );
      });
      
      return filtered;
    }),

  // Get document chunks
  getChunks: protectedProcedure
    .input(z.object({
      documentId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Verify ownership
      const [doc] = await db
        .select()
        .from(document)
        .where(and(eq(document.id, input.documentId), eq(document.userId, userId)))
        .limit(1);
      
      if (!doc) {
        throw new Error("Document not found");
      }
      
      const chunks = await db
        .select()
        .from(documentChunk)
        .where(eq(documentChunk.documentId, input.documentId))
        .orderBy(documentChunk.chunkIndex)
        .limit(input.limit);
      
      return chunks;
    }),

  // Reindex a document
  reindex: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [updated] = await db
        .update(document)
        .set({
          status: "pending",
          isIndexed: false,
          updatedAt: new Date(),
        })
        .where(and(eq(document.id, input.id), eq(document.userId, userId)))
        .returning();
      
      if (!updated) {
        throw new Error("Document not found");
      }
      
      // Delete old chunks
      await db
        .delete(documentChunk)
        .where(eq(documentChunk.documentId, input.id));
      
      return updated;
    }),
};
