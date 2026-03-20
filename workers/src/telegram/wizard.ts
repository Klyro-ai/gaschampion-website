import type { WizardState } from '../types';

const WIZARD_TTL = 3600; // 1 hour

export class WizardManager {
  constructor(private kv: KVNamespace) {}

  async start(chatId: number | string, type: WizardState['type'], step: string, clientId?: string): Promise<void> {
    const state: WizardState = {
      type,
      step,
      data: {},
      clientId,
      updatedAt: new Date().toISOString(),
    };
    await this.kv.put(`wizard:${chatId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
  }

  async get(chatId: number | string): Promise<WizardState | null> {
    const raw = await this.kv.get(`wizard:${chatId}`);
    if (!raw) return null;
    return JSON.parse(raw) as WizardState;
  }

  async update(chatId: number | string, step: string, newData?: Record<string, string>): Promise<void> {
    const current = await this.get(chatId);
    if (!current) return;
    current.step = step;
    if (newData) {
      current.data = { ...current.data, ...newData };
    }
    current.updatedAt = new Date().toISOString();
    await this.kv.put(`wizard:${chatId}`, JSON.stringify(current), { expirationTtl: WIZARD_TTL });
  }

  async clear(chatId: number | string): Promise<void> {
    await this.kv.delete(`wizard:${chatId}`);
  }
}
