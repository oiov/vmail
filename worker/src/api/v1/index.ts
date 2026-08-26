import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../../env.ts";
import { apiKeyAuth } from "./middleware/apiKeyAuth.ts";
import mailboxesRouter from "./routes/mailboxes.ts";
import { requireOpenApi } from "../../openapi.ts";

const v1 = new Hono<{
  Bindings: Env;
  Variables: { apiKey: { id: string; rateLimit: number } };
}>();

// 配置 CORS
v1.use("/*", cors());

// OpenAPI 开关关闭时，统一在认证前拦截所有 v1 请求
v1.use("/*", requireOpenApi);

// 所有 v1 路由都需要 API Key 认证
v1.use("/*", apiKeyAuth);

// 挂载邮箱路由
v1.route("/mailboxes", mailboxesRouter);

export default v1;
