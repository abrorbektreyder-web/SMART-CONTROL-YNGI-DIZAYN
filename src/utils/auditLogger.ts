import { query } from '../config/db';

export const logAction = async (
  userId: string,
  action: string,
  tableName: string,
  recordId: string,
  details: object
) => {
  const queryText = `
    INSERT INTO audit_logs (id, user_id, action, table_name, record_id, details, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
  `;
  try {
    await query(queryText, [userId, action, tableName, recordId, JSON.stringify(details)]);
  } catch (error) {
    console.error('Audit Log Xatosi:', error);
  }
};
