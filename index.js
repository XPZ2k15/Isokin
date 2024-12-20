// index.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { IsokineLexer, IsokineParser } = require('./parser');
const { parseFields, groupRoutesByPrefix } = require('./utils/utils');
const {
  generateAppJs,
  generateDbJs,
  generateRouteFile,
  createIndexRoutesFile,
  generateAuthJs,
  generateAuthRoutes,
  setupFrontend
} = require('./generators');

/**
 * Parses the Isokine DSL text and returns an AST.
 * @param {string} text - The DSL text.
 * @returns {Object} - The AST representing the project structure.
 */
function parseIsokine(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const ast = {
    server: { port: 3000 },
    middlewares: [],
    db: null,
    dbType: null,
    routes: [],
    auth: { enabled: false, strategy: null, protectedRoutes: [] },
    frontend: null, // 'react' or null
    frontendPackages: [],
    migrations: [] // new field for migrations
  };

  for (let line of lines) {
    if (line.startsWith("essence: express")) {
      // server defined
    } else if (line.startsWith("speak at port ")) {
      ast.server.port = parseInt(line.split(' ')[3], 10);
    } else if (line.startsWith("whisper: parse incoming as json")) {
      ast.middlewares.push("app.use(express.json());");
    } else if (line.startsWith("whisper: load environment from ")) {
      const match = line.match(/whisper:\s*load environment from '([^']+)'/);
      if (match) {
        const envFile = match[1];
        ast.envFile = envFile;
      }
    } else if (line.startsWith("whisper: enable cors")) {
      ast.middlewares.push("const cors = require('cors');");
      ast.middlewares.push("app.use(cors());");
    } else if (line.startsWith("whisper: db type ")) {
      const match = line.match(/whisper:\s*db type (\w+)/);
      if (match) {
        ast.dbType = match[1].toLowerCase();
        if (ast.dbType !== 'mysql' && ast.dbType !== 'mssql') {
          throw new Error("Only mysql and mssql are supported. Please specify 'whisper: db type mysql' or 'mssql'.");
        }
      }
    } else if (line.startsWith("whisper: connect to '")) {
      const match = line.match(/connect to '([^']+)'/);
      if (match) {
        if (!ast.db) ast.db = {};
        ast.db.url = match[1];
      }
    } else if (line.startsWith("whisper: use collection '")) {
      const match = line.match(/use collection '(\w+)'/);
      if (match) {
        if (!ast.db) ast.db = {};
        // Initialize collections as an array if not already
        if (!ast.db.collections) ast.db.collections = [];
        ast.db.collections.push(match[1]);
      }
    } else if (line.startsWith("whisper: log requests")) {
      ast.middlewares.push(`app.use((req, res, next) => { console.log(\`\${req.method} \${req.url}\`); next(); });`);
    } else if (line.startsWith("whisper: serve static from ")) {
      const match = line.match(/whisper:\s*serve static from '([^']+)'/);
      if (match) {
        const staticDir = match[1];
        ast.middlewares.push(`app.use(express.static('${staticDir}'));`);
      }
    } else if (line.startsWith("whisper: auth enable")) {
      ast.auth.enabled = true;
    } else if (line.startsWith("whisper: auth strategy ")) {
      const match = line.match(/whisper:\s*auth strategy (\w+)/);
      if (match) {
        ast.auth.strategy = match[1].toLowerCase();
        if (ast.auth.strategy !== 'jwt') {
          throw new Error("Only JWT auth strategy supported.");
        }
      }
    } else if (line.startsWith("whisper: auth route ")) {
      const match = line.match(/whisper:\s*auth route (\/[\w\/:]+) requires login/);
      if (match) {
        ast.auth.protectedRoutes.push(match[1]);
      }
    } else if (line.startsWith("whisper: frontend framework ")) {
      const match = line.match(/whisper:\s*frontend framework (\w+)/);
      if (match) {
        ast.frontend = match[1].toLowerCase();
        if (ast.frontend !== 'react') {
          throw new Error("Only 'react' frontend framework supported.");
        }
      }
    } else if (line.startsWith("whisper: npm install ")) {
      const match = line.match(/whisper:\s*npm install (\w+)/);
      if (match) {
        ast.frontendPackages.push(match[1]);
      }
    } else if (line.startsWith("when asked for ") && line.includes("offer all items from")) {
      const routeMatch = line.match(/when asked for (\/[\w\/:]+), offer all items from '(\w+)'/);
      if (routeMatch) {
        ast.routes.push({ method: 'GET', path: routeMatch[1], action: 'listAll', collection: routeMatch[2] });
      }
    } else if (line.startsWith("when asked for ") && line.includes("retrieve item by id from")) {
      const routeMatch = line.match(/when asked for (\/[\w\/:]+), retrieve item by id from '(\w+)'/);
      if (routeMatch) {
        ast.routes.push({ method: 'GET', path: routeMatch[1], action: 'getById', collection: routeMatch[2] });
      }
    } else if (line.startsWith("when posted to ") && line.includes("insert into")) {
      const routeMatch = line.match(/when posted to (\/[\w\/:]+) with body \{([\w\s,]+)\}, insert into '(\w+)', return inserted document/);
      if (routeMatch) {
        const fields = routeMatch[2].split(',').map(f => f.trim());
        ast.routes.push({ 
          method: 'POST', 
          path: routeMatch[1], 
          action: 'insert', 
          collection: routeMatch[3], 
          bodyFields: fields 
        });
      }
    } else if (line.startsWith("whisper: db migration ")) {
      const migMatch = line.match(/whisper:\s*db migration '([^']+)' with fields {([^}]+)}/);
      if (migMatch) {
        let tableName = migMatch[1];
        const fieldsStr = migMatch[2].trim();
        const fieldDefs = parseFields(fieldsStr);
        const fields = fieldDefs.map(def => {
          const parts = def.split(/\s+/).map(p => p.trim());
          const name = parts[0].replace(':', '');
          let type = parts[1];
          let pk = parts.includes('pk');
          let identity = parts.includes('identity');
          return { name, type, pk, identity };
        });

        // Rename 'create_users_table' to 'users', if following that pattern
        if (tableName.startsWith('create_') && tableName.endsWith('_table')) {
          tableName = tableName.replace(/^create_/, '').replace(/_table$/, '');
        }

        ast.migrations.push({ tableName, fields });
      }
    }
  }

  return ast;
}

function createProjectStructure(projectDir, ast, options = {}) {
  const {
    generateAppJs,
    generateDbJs,
    generateRouteFile,
    createIndexRoutesFile,
    generateAuthJs,
    generateAuthRoutes,
    setupFrontend
  } = require('./generators');

  // Ensure base project directory exists
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const routesDir = path.join(projectDir, 'routes');
  if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir);
  }

  if (!options.noViews) {
    const viewsDir = path.join(projectDir, 'views');
    if (!fs.existsSync(viewsDir)) {
      fs.mkdirSync(viewsDir);
    }
  }

  const publicDir = path.join(projectDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // Generate app.js
  const appJsContent = generateAppJs(ast);
  fs.writeFileSync(path.join(projectDir, 'app.js'), appJsContent, 'utf8');

  // Generate db.js
  const dbCode = generateDbJs(ast);
  if (dbCode) {
    fs.writeFileSync(path.join(projectDir, 'db.js'), dbCode, 'utf8');
  }

  // Generate auth.js and auth routes if auth is enabled
  if (ast.auth && ast.auth.enabled && ast.auth.strategy === 'jwt') {
    const authJsCode = generateAuthJs();
    fs.writeFileSync(path.join(projectDir, 'auth.js'), authJsCode, 'utf8');

    const authRoutesCode = generateAuthRoutes(ast.dbType);
    fs.writeFileSync(path.join(routesDir, 'auth.js'), authRoutesCode, 'utf8');
  }

  // Generate individual route files
  const routeGroups = groupRoutesByPrefix(ast.routes);
  for (let prefix in routeGroups) {
    const routeFile = generateRouteFile(prefix, routeGroups[prefix], ast.dbType, ast);
    fs.writeFileSync(path.join(routesDir, `${prefix}.js`), routeFile, 'utf8');
  }

  // Generate index.js in routes
  createIndexRoutesFile(projectDir, routeGroups, ast);

  // Setup frontend
  setupFrontend(projectDir, ast);

  console.log(`Project structure created at ${projectDir}`);
}

module.exports = { parseIsokine, createProjectStructure };
