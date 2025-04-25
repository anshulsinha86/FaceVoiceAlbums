'use server';

/**
 * @fileOverview A flow to summarize the content of an album using AI.
 *
 * - summarizeAlbumContent - A function that summarizes the content of an album.
 * - SummarizeAlbumContentInput - The input type for the summarizeAlbumContent function.
 * - SummarizeAlbumContentOutput - The return type for the summarizeAlbumContent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeAlbumContentInputSchema = z.object({
  albumDescription: z.string().describe('A description of the album content.'),
});

export type SummarizeAlbumContentInput = z.infer<typeof SummarizeAlbumContentInputSchema>;

const SummarizeAlbumContentOutputSchema = z.object({
  summary: z.string().describe('A summary of the album content.'),
});

export type SummarizeAlbumContentOutput = z.infer<typeof SummarizeAlbumContentOutputSchema>;

export async function summarizeAlbumContent(
  input: SummarizeAlbumContentInput
): Promise<SummarizeAlbumContentOutput> {
  return summarizeAlbumContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAlbumContentPrompt',
  input: {
    schema: z.object({
      albumDescription: z
        .string()
        .describe('A description of the album content that needs to be summarized.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the album content.'),
    }),
  },
  prompt: `Summarize the content of the following album description in a concise manner:\n\n{{{albumDescription}}}`,
});

const summarizeAlbumContentFlow = ai.defineFlow<
  typeof SummarizeAlbumContentInputSchema,
  typeof SummarizeAlbumContentOutputSchema
>({
  name: 'summarizeAlbumContentFlow',
  inputSchema: SummarizeAlbumContentInputSchema,
  outputSchema: SummarizeAlbumContentOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
