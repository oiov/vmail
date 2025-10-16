import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";

// 修改 getWebTursoDB 为 getD1DB，并适配 D1 数据库
export function getD1DB(db: D1Database): DrizzleD1Database {
  return drizzle(db);
}