// generators/dbGenerator.js
const { parseFields } = require('../utils/utils');

function generateDbJs(ast) {
  if (!ast.dbType) return null;

  let code = [];
  if (ast.dbType === 'mysql') {
    // MySQL can handle the URL directly and we can run IF NOT EXISTS
    code.push(`const mysql = require('mysql2/promise');`);
    code.push(`let db;`);
    code.push(`(async () => {`);
    code.push(`  db = await mysql.createConnection(process.env.MYSQL_URL || '${ast.db.url}');`);
    code.push(`  await runMigrationsMysql(db);`);
    code.push(`})();`);
    code.push(`function getDB() { return db; }`);
    code.push(`module.exports = { getDB };`);
    code.push(`
async function runMigrationsMysql(db) {
  ${generateMigrationCodeForMysql(ast.migrations)}
}
`);
  } else if (ast.dbType === 'mssql') {
    // MSSQL: Parse the URL and create a config object
    const parsed = new URL(ast.db.url);
    const user = parsed.username;
    const password = parsed.password;
    const server = parsed.hostname || 'localhost';
    const port = parsed.port ? parseInt(parsed.port, 10) : 1433;
    const database = parsed.pathname.replace('/', '') || 'master';

    code.push(`const sql = require('mssql');`);
    code.push(`let db;`);
    code.push(`(async () => {`);
    code.push(`  db = await sql.connect({`);
    code.push(`    user: process.env.DB_USER || '${user}',`);
    code.push(`    password: process.env.DB_PASSWORD || '${password}',`);
    code.push(`    server: process.env.DB_SERVER || '${server}',`);
    code.push(`    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT,10) : ${port},`);
    code.push(`    database: process.env.DB_DATABASE || '${database}',`);
    code.push(`    options: {`);
    code.push(`      encrypt: false`);
    code.push(`    }`);
    code.push(`  });`);
    code.push(`  await runMigrationsMssql(db);`);
    code.push(`})();`);
    code.push(`function getDB() { return db; }`);
    code.push(`module.exports = { getDB };`);
    code.push(`
async function runMigrationsMssql(db) {
  ${generateMigrationCodeForMssql(ast.migrations)}
}
`);
  } else {
    throw new Error("Only mysql and mssql are supported.");
  }

  return code.join('\n');
}

function generateMigrationCodeForMysql(migrations) {
  if (!migrations || migrations.length === 0) return '';
  let code = '';
  for (const mig of migrations) {
    const tableName = mig.tableName;
    const fieldsSql = mig.fields.map(f => {
      let fieldDef = `${f.name} ${f.type}`;
      if (f.pk) fieldDef += ' PRIMARY KEY';
      if (f.identity) fieldDef += ' AUTO_INCREMENT';
      return fieldDef;
    }).join(', ');
    code += `
  await db.query("CREATE TABLE IF NOT EXISTS ${tableName} (${fieldsSql})");
`;
  }
  return code;
}

function generateMigrationCodeForMssql(migrations) {
  if (!migrations || migrations.length === 0) return '';
  let code = '';
  for (const mig of migrations) {
    const tableName = mig.tableName;
    const fieldsSql = mig.fields.map(f => {
      let fieldDef = `[${f.name}] ${f.type}`;
      if (f.pk) fieldDef += ' PRIMARY KEY';
      if (f.identity) fieldDef += ' IDENTITY(1,1)';
      return fieldDef;
    }).join(', ');

    code += `
  {
    const result = await db.request().query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'");
    if (result.recordset.length === 0) {
      await db.request().query("CREATE TABLE ${tableName} (${fieldsSql})");
    }
  }
`;
  }
  return code;
}

module.exports = generateDbJs;
