import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const anthropicOk = () =>
  new Response(
    JSON.stringify({ content: [{ text: 'hi' }], usage: { input_tokens: 3, output_tokens: 2 } }),
    { status: 200 }
  );

describe('AIClient retries', () => {
  beforeEach(() => {
    process.env.AGENTIC_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.resetModules();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('retries a 503 from Anthropic then returns content', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(anthropicOk());
    vi.stubGlobal('fetch', fetchMock);
    const { AIClient } = await import('./client');
    const res = await new AIClient().chat([{ role: 'user', content: 'x' }]);
    expect(res.content).toBe('hi');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 400 and surfaces the error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('bad', { status: 400, statusText: 'Bad Request' }));
    vi.stubGlobal('fetch', fetchMock);
    const { AIClient } = await import('./client');
    await expect(new AIClient().chat([{ role: 'user', content: 'x' }])).rejects.toThrow(/Anthropic API error/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('logs metadata without message content', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(anthropicOk()));
    const { AIClient } = await import('./client');
    await new AIClient().chat([{ role: 'user', content: 'SECRET-QUESTION' }]);
    const logged = info.mock.calls.map((c) => String(c[0])).join(' ');
    expect(logged).toContain('ai_call');
    expect(logged).not.toContain('SECRET-QUESTION');
    info.mockRestore();
  });
});
