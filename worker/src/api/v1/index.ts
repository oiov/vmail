import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '../../index';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import mailboxesRouter from './routes/mailboxes';

const v1 = new Hono<{ Bindings: Env }>();

// 配置 CORS
v1.use('/*', cors());

// 所有 v1 路由都需要 API Key 认证
v1.use('/*', apiKeyAuth);

// 挂载邮箱路由
v1.route('/mailboxes', mailboxesRouter);

export default v1;
