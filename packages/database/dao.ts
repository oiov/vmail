import { desc, eq, and } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { emails, InsertEmail } from "./schema";

export async function insertEmail(db: LibSQLDatabase, email: InsertEmail) {
  try {
    await db.insert(emails).values(email).execute();
  } catch (e) {
    console.error(e);
  }
}

export async function getEmails(db: LibSQLDatabase) {
  try {
    return await db.select().from(emails).execute();
  } catch (e) {
    return [];
  }
}

export async function getEmail(db: LibSQLDatabase, id: string) {
  try {
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, id)))
      .execute();
    if (result.length != 1) {
      return null;
    }
    return result[0];
  } catch (e) {
    return null;
  }
}

export async function getEmailsByMessageTo(
  db: LibSQLDatabase,
  messageTo: string,
) {
  try {
    return await db
      .select()
      .from(emails)
      .where(eq(emails.messageTo, messageTo))
      .orderBy(desc(emails.createdAt))
      .execute();
  } catch (e) {
    return [];
  }
}
