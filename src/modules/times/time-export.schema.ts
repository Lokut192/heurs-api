import { z } from 'zod/v4';

export const timeExportAcceptSchema = z.enum([
  'application/json',
  'text/csv',
  'application/pdf',
]);
