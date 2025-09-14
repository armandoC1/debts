import mysql from "mysql2/promise";
import type { User, Client, Debt, Payment } from "./types";

// Conexión a la base de datos
const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST ,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME || "debt_tracker",
    decimalNumbers: true,
  });
};

export class Database {
  // === USERS ===
  static async getUsers(): Promise<User[]> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM users ORDER BY createdAt DESC"
    );
    await connection.end();
    return rows as User[];
  }

  static async getUserById(id: string): Promise<User | undefined> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    await connection.end();
    const users = rows as User[];
    return users[0];
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    await connection.end();
    const users = rows as User[];
    return users[0];
  }

  static async createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const connection = await createConnection();
    const id = Date.now().toString();

    await connection.execute(
      `INSERT INTO users (id, name, email, password, phone, roles, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        userData.name,
        userData.email,
        userData.password,
        userData.phone,
        JSON.stringify(userData.roles),
      ]
    );

    await connection.end();
    const now = new Date().toISOString();
    return { ...userData, id, createdAt: now, updatedAt: now };
  }

  // === CLIENTS ===
  static async getClients(): Promise<Client[]> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM clients ORDER BY createdAt DESC"
    );
    await connection.end();
    return rows as Client[];
  }

  static async getClientById(id: string): Promise<Client | undefined> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM clients WHERE id = ?",
      [id]
    );
    await connection.end();
    const clients = rows as Client[];
    return clients[0];
  }

  static async createClient(
    clientData: Omit<Client, "id" | "totalDebt" | "createdAt" | "updatedAt">
  ): Promise<Client> {
    const connection = await createConnection();
    const id = Date.now().toString();

    await connection.execute(
      `INSERT INTO clients (id, name, email, phone, address, totalDebt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [
        id,
        clientData.name,
        clientData.email || null,
        clientData.phone || null,
        clientData.address || null,
      ]
    );

    await connection.end();
    const now = new Date().toISOString();
    return { ...clientData, id, totalDebt: 0, createdAt: now, updatedAt: now };
  }

  static async updateClient(
    id: string,
    updates: Partial<Client>
  ): Promise<Client | undefined> {
    const connection = await createConnection();

    const allowed = ["name", "email", "phone", "address", "totalDebt"] as const;
    const entries = Object.entries(updates).filter(([k]) =>
      (allowed as readonly string[]).includes(k)
    );
    if (entries.length > 0) {
      const setClause = entries.map(([k]) => `${k} = ?`).join(", ");
      const values = [...entries.map(([, v]) => v), id];
      await connection.execute(
        `UPDATE clients SET ${setClause}, updatedAt = NOW() WHERE id = ?`,
        values
      );
    } else {
      await connection.execute(
        `UPDATE clients SET updatedAt = NOW() WHERE id = ?`,
        [id]
      );
    }

    const updated = await this.getClientById(id);
    await connection.end();
    return updated;
  }

  // === DEBTS ===
  static async getDebts(): Promise<Debt[]> {
    const connection = await createConnection();
    const [rows] = await connection.execute(`
      SELECT d.*, c.name as clientName 
      FROM debts d 
      JOIN clients c ON d.clientId = c.id 
      ORDER BY d.createdAt DESC
    `);
    await connection.end();
    return rows as Debt[];
  }

  static async getDebtsByClientId(clientId: string): Promise<Debt[]> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM debts WHERE clientId = ? ORDER BY createdAt DESC",
      [clientId]
    );
    await connection.end();
    return rows as Debt[];
  }

  static async createDebt(
    debtData: Omit<Debt, "id" | "createdAt" | "isPaid">
  ): Promise<Debt> {
    const connection = await createConnection();
    const id = Date.now().toString();

    await connection.execute(
      `INSERT INTO debts (id, clientId, title, amount, description, createdBy, createdAt, isPaid)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 0)`,
      [
        id,
        debtData.clientId,
        debtData.title,
        debtData.amount,
        debtData.description || null,
        debtData.createdBy,
      ]
    );

    await connection.execute(
      `UPDATE clients SET totalDebt = totalDebt + ?, updatedAt = NOW() WHERE id = ?`,
      [debtData.amount, debtData.clientId]
    );

    await connection.end();
    const now = new Date().toISOString();
    return { ...debtData, id, createdAt: now, isPaid: 0 as any };
  }

  // === PAYMENTS ===
  static async getPayments(): Promise<Payment[]> {
    const connection = await createConnection();
    const [rows] = await connection.execute(`
      SELECT p.*, c.name as clientName, u.name as receivedByName
      FROM payments p 
      JOIN clients c ON p.clientId = c.id 
      JOIN users u ON p.receivedBy = u.id
      ORDER BY p.createdAt DESC
    `);
    await connection.end();
    return rows as Payment[];
  }

  static async getPaymentsByClientId(clientId: string): Promise<Payment[]> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      `
      SELECT p.*, u.name as receivedByName
      FROM payments p 
      JOIN users u ON p.receivedBy = u.id
      WHERE p.clientId = ? 
      ORDER BY p.createdAt DESC
    `,
      [clientId]
    );
    await connection.end();
    return rows as Payment[];
  }

  static async getPaymentsByDate(date: string): Promise<Payment[]> {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      `
      SELECT p.*, c.name as clientName, u.name as receivedByName
      FROM payments p 
      JOIN clients c ON p.clientId = c.id 
      JOIN users u ON p.receivedBy = u.id
      WHERE DATE(p.createdAt) = ? 
      ORDER BY p.createdAt DESC
    `,
      [date]
    );
    await connection.end();
    return rows as Payment[];
  }

  static async createPayment(
    paymentData: Omit<Payment, "id" | "createdAt">
  ): Promise<Payment> {
    const connection = await createConnection();
    const id = Date.now().toString();

    await connection.execute(
      `INSERT INTO payments (id, clientId, amount, description, receivedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        paymentData.clientId,
        paymentData.amount,
        paymentData.description || null,
        paymentData.receivedBy,
      ]
    );

    await connection.execute(
      `UPDATE clients
         SET totalDebt = GREATEST(0, totalDebt - ?), updatedAt = NOW()
       WHERE id = ?`,
      [paymentData.amount, paymentData.clientId]
    );

    await connection.end();
    const now = new Date().toISOString();
    return { ...paymentData, id, createdAt: now };
  }

  // === DASHBOARD ===
  static async getDashboardStats(date?: string): Promise<{
    totalClients: number;
    totalDebt: number;
    totalPaid: number;
    paymentsToday: number;
    recentPayments: Payment[];
  }> {
    const connection = await createConnection();

    const [clientsCount] = await connection.execute(
      `SELECT COUNT(*) AS count FROM clients`
    );
    const [totalDebtResult] = await connection.execute(
      `SELECT COALESCE(SUM(totalDebt),0) AS total FROM clients`
    );
    const [totalPaidResult] = await connection.execute(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments`
    );

    const [paymentsTodayResult] = date
      ? await connection.execute(
          `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE DATE(createdAt) = ?`,
          [date]
        )
      : await connection.execute(
          `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE DATE(createdAt) = CURDATE()`
        );

    const [recentPayments] = await connection.execute(`
      SELECT p.*, c.name as clientName, u.name as receivedByName
      FROM payments p 
      JOIN clients c ON p.clientId = c.id 
      JOIN users u ON p.receivedBy = u.id
      ORDER BY p.createdAt DESC 
      LIMIT 10
    `);

    await connection.end();

    return {
      totalClients: (clientsCount as any)[0].count ?? 0,
      totalDebt: (totalDebtResult as any)[0].total ?? 0,
      totalPaid: (totalPaidResult as any)[0].total ?? 0,
      paymentsToday: (paymentsTodayResult as any)[0].total ?? 0,
      recentPayments: recentPayments as Payment[],
    };
  }
}
