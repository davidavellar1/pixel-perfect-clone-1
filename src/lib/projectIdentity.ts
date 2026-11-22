import { z } from 'zod';
export const projectIdentitySchema=z.object({title:z.string(),city:z.string(),country:z.string(),developer:z.object({name:z.string().nullable(),contactName:z.string().nullable(),position:z.string().nullable()})});
export type ProjectIdentity=z.infer<typeof projectIdentitySchema>;
export function parseProjectIdentity(value:unknown):ProjectIdentity|null{const parsed=projectIdentitySchema.safeParse(value);return parsed.success?parsed.data:null;}
