import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { ForwardableEmailMessage } from '@cloudflare/workers-types';
import { insertEmail } from 'database/dao';
import { getD1DB } from 'database/db';
import { InsertEmail, insertEmailSchema } from 'database/schema';
import { nanoid } from 'nanoid/non-secure';
import PostalMime from 'postal-mime';

// 定义环境绑定
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

// 静态资源服务
app.get('*', serveStatic({ root: './' }));

export default {
  // 邮件处理
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      const messageFrom = message.from;
      const messageTo = message.to;
      const rawText = await new Response(message.raw).text();
      const mail = await new PostalMime().parse(rawText);
      const now = new Date();
      // 使用 D1 数据库
      const db = getD1DB(env.DB);
      const newEmail: InsertEmail = {
        id: nanoid(),
        messageFrom,
        messageTo,
        ...mail,
        createdAt: now,
        updatedAt: now,
      };
      const email = insertEmailSchema.parse(newEmail);
      await insertEmail(db, email);
    } catch (e) {
      console.log(e);
    }
  },
  // HTTP 请求处理
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 静态资源处理
    const url = new URL(request.url);
    if (url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }
    // API 和页面路由
    return app.fetch(request, env, ctx);
  },
};