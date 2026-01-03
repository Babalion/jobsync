import { z } from "zod";

export const AddCompanyFormSchema = z.object({
  id: z.string().optional(),
  createdBy: z.string().optional(),
  company: z
    .string({
      required_error: "Company name is required.",
    })
    .min(1),
  companyUrl: z.string().default("").optional(),
  careerSite: z.string().default("").optional(),
  locations: z.array(z.string()).default([]).optional(),
  archetype: z.string().default("").optional(),
  ownership: z.string().default("").optional(),
  industryRole: z.string().default("").optional(),
  innovationLevel: z.string().default("").optional(),
  cultureTag: z.string().default("").optional(),
  country: z.string().default("").optional(),
  summary: z.string().default("").optional(),
  fitNotes: z.string().default("").optional(),
  hasWorksCouncil: z.boolean().default(false).optional(),
  hasCollectiveAgreement: z.boolean().default(false).optional(),
});
