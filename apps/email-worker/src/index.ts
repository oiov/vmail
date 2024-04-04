import { ForwardableEmailMessage } from '@cloudflare/workers-types';
import { insertEmail } from 'database/dao';
import { getWebTursoDB } from 'database/db';
import { InsertEmail, insertEmailSchema } from 'database/schema';
import { nanoid } from 'nanoid/non-secure';
import PostalMime from 'postal-mime';
export interface Env {
	DB: D1Database;
	TURSO_DB_URL: string;
	TURSO_DB_AUTH_TOKEN: string;
}

export default {
	async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
		try {
			const messageFrom = message.from;
			const messageTo = message.to;
			const rawText = await new Response(message.raw).text();
			const mail = await new PostalMime().parse(rawText);
			const now = new Date();
			const db = getWebTursoDB(env.TURSO_DB_URL, env.TURSO_DB_AUTH_TOKEN);
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
};
