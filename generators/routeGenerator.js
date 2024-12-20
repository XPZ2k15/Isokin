// generators/routeGenerator.js
const { groupRoutesByPrefix } = require('../utils/utils');
const fs = require('fs')
const path = require('path')

function generateRouteFile(prefix, routes, dbType, ast) {
  const code = [];
  code.push(`const express = require('express');`);
  let dbAvailable = (dbType === 'mysql' || dbType === 'mssql');
  if (dbAvailable) {
    code.push(`const { getDB } = require('../db');`);
  } else {
    code.push(`// No DB configuration found`);
  }

  if (ast.auth && ast.auth.enabled && ast.auth.strategy === 'jwt') {
    code.push(`const { authenticateToken } = require('../auth');`);
  }

  code.push(`const router = express.Router();`);
  code.push(``);

  for (let route of routes) {
    const method = route.method.toLowerCase();
    const routeRequiresAuth = ast.auth && ast.auth.enabled && ast.auth.strategy === 'jwt' && ast.auth.protectedRoutes && ast.auth.protectedRoutes.includes(route.path);
    const middleware = routeRequiresAuth ? `authenticateToken, ` : '';

    if (route.action === 'listAll') {
      if (dbType === 'mysql') {
        code.push(`router.${method}('${route.path.replace('/' + prefix, '')}', ${middleware}async (req, res, next) => {`);
        code.push(`  try {`);
        code.push(`    const [rows] = await getDB().query('SELECT * FROM ${route.collection}');`);
        code.push(`    res.send(rows);`);
        code.push(`  } catch (err) { next(err); }`);
        code.push(`});`);
      } else if (dbType === 'mssql') {
        code.push(`router.${method}('${route.path.replace('/' + prefix, '')}', ${middleware}async (req, res, next) => {`);
        code.push(`  try {`);
        code.push(`    const result = await getDB().request().query('SELECT * FROM ${route.collection}');`);
        code.push(`    res.send(result.recordset);`);
        code.push(`  } catch (err) { next(err); }`);
        code.push(`});`);
      }
    } else if (route.action === 'getById') {
      if (dbType === 'mysql') {
        code.push(`router.${method}('/:id', ${middleware}async (req, res, next) => {`);
        code.push(`  try {`);
        code.push(`    const [rows] = await getDB().query('SELECT * FROM ${route.collection} WHERE id=?', [req.params.id]);`);
        code.push(`    if (!rows.length) return res.status(404).send({error: 'Not found'});`);
        code.push(`    res.send(rows[0]);`);
        code.push(`  } catch (err) { next(err); }`);
        code.push(`});`);
      } else if (dbType === 'mssql') {
        code.push(`router.${method}('/:id', ${middleware}async (req, res, next) => {`);
        code.push(`  try {`);
        code.push(`    const result = await getDB().request().input('id', req.params.id).query('SELECT * FROM ${route.collection} WHERE id=@id');`);
        code.push(`    if (!result.recordset.length) return res.status(404).send({error: 'Not found'});`);
        code.push(`    res.send(result.recordset[0]);`);
        code.push(`  } catch (err) { next(err); }`);
        code.push(`});`);
      }
    } else if (route.action === 'insert') {
      if (dbType === 'mysql') {
        const fields = route.bodyFields.map(field => `${field}: req.body.${field}`).join(', ');
        const placeholders = route.bodyFields.map(() => '?').join(', ');
        const values = route.bodyFields.map(field => `req.body.${field}`).join(', ');
        code.push(`router.${method}('${route.path.replace('/' + prefix, '')}', ${middleware}async (req, res, next) => {`);
        code.push(`  try {`);
        code.push(`    const doc = { ${fields} };`);
        code.push(`    const [result] = await getDB().query('INSERT INTO ${route.collection} (${route.bodyFields.join(', ')}) VALUES (${placeholders})', [${values}]);`);
        code.push(`    res.send({ id: result.insertId, ...doc });`);
        code.push(`  } catch (err) { next(err); }`);
        code.push(`});`);
      } else if (dbType === 'mssql') {
        const inputs = route.bodyFields.map(field => `.input('${field}', req.body.${field})`).join('');
        const columns = route.bodyFields.join(', ');
        const params = route.bodyFields.map(field => `@${field}`).join(', ');
        const docFields = route.bodyFields.map(field => `${field}: req.body.${field}`).join(', ');
        code.push(`router.${method}('${route.path.replace('/' + prefix, '')}', ${middleware}async (req, res, next) => {`);
        code.push(`  try {`);
        code.push(`    const doc = { ${docFields} };`);
        code.push(`    await getDB().request()${inputs}.query('INSERT INTO ${route.collection} (${columns}) VALUES (${params})');`);
        code.push(`    res.send({ ...doc });`);
        code.push(`  } catch (err) { next(err); }`);
        code.push(`});`);
      }
    }

    code.push('');
  }

  code.push(`module.exports = router;`);
  return code.join('\n');
}

function createIndexRoutesFile(projectDir, routeGroups, ast) {
  const code = [];
  code.push(`const express = require('express');`);
  code.push(`const router = express.Router();`);
  code.push(``);

  if (ast.auth && ast.auth.enabled && ast.auth.strategy === 'jwt') {
    code.push(`const authRouter = require('./auth');`);
    code.push(`router.use('/auth', authRouter);`);
    code.push('');
  }

  for (let prefix in routeGroups) {
    code.push(`const ${prefix}Router = require('./${prefix}');`);
    code.push(`router.use('/${prefix}', ${prefix}Router);`);
    code.push('');
  }

  code.push(`module.exports = router;`);
  fs.writeFileSync(path.join(projectDir, 'routes', 'index.js'), code.join('\n'), 'utf8');
}

module.exports = {
  generateRouteFile,
  createIndexRoutesFile
};
