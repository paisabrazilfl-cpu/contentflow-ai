import { z } from "zod";
import { getBrandVoice, upsertBrandVoice } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const settingsRouter = router({
  getBrandVoice: protectedProcedure.query(async ({ ctx }) => {
    return getBrandVoice(ctx.user.id);
  }),

  updateBrandVoice: protectedProcedure
    .input(
      z.object({
        businessName: z.string().max(256).optional(),
        industry: z.string().max(128).optional(),
        targetAudience: z.string().max(1000).optional(),
        toneKeywords: z.string().max(500).optional(),
        avoidKeywords: z.string().max(500).optional(),
        sampleContent: z.string().max(2000).optional(),
        websiteUrl: z.string().url().max(512).optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertBrandVoice({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
});
