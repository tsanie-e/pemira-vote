import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  dbPool?: mysql.Pool;
};

const pool =
  globalForDb.dbPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "pemira_voting",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = pool;
}

export default pool;
