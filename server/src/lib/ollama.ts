import { Ollama } from 'ollama';
import { config } from '../config.js';

const ollama = new Ollama({ host: config.ollamaUrl });

export async function generate(
  system: string,
  user: string,
  model: string = config.ollamaModel,
): Promise<string> {
  const response = await ollama.chat({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return response.message.content;
}
