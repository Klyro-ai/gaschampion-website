export class TelegramBot {
  private baseUrl: string;

  constructor(
    private token: string,
    private fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = (...args) => fetch(...args)
  ) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(
    chatId: number | string,
    text: string,
    replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> }
  ): Promise<{ message_id: number }> {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    return this.call('sendMessage', body);
  }

  async answerCallback(callbackQueryId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  async editMessage(
    chatId: number | string,
    messageId: number,
    text: string,
    replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> }
  ): Promise<void> {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await this.call('editMessageText', body);
  }

  async getFile(fileId: string): Promise<string> {
    const data = await this.call('getFile', { file_id: fileId });
    return data.file_path;
  }

  getFileUrl(filePath: string): string {
    return `https://api.telegram.org/file/bot${this.token}/${filePath}`;
  }

  async sendPhoto(
    chatId: number | string,
    photo: string,
    caption?: string,
    replyMarkup?: Record<string, unknown>
  ): Promise<{ message_id: number }> {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      photo,
      parse_mode: 'HTML',
    };
    if (caption) body.caption = caption;
    if (replyMarkup) body.reply_markup = replyMarkup;
    const data = await this.call('sendPhoto', body);
    return { message_id: data.message_id };
  }

  async deleteMessage(chatId: number | string, messageId: number): Promise<void> {
    await this.call('deleteMessage', { chat_id: chatId, message_id: messageId });
  }

  private async call(method: string, body: Record<string, unknown>): Promise<any> {
    const response = await this.fetchFn(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json() as { ok: boolean; result?: any; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    return data.result;
  }
}
