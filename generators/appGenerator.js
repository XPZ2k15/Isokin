// generators/appGenerator.js
function generateAppJs(ast) {
    const code = [];
    code.push(`const express = require('express');`);
    if (ast.envFile) {
      code.push(`require('dotenv').config({ path: '${ast.envFile}' });`);
    }
    code.push(`const app = express();`);
  
    if (ast.db && ast.db.url) {
      code.push(`const db = require('./db');`);
    }
  
    code.push(`const indexRoutes = require('./routes');`);
    code.push(``);
  
    if (ast.middlewares.length > 0) {
      code.push(...ast.middlewares);
    }
  
    code.push(`app.use('/', indexRoutes);`);
  
    code.push(`app.use((err, req, res, next) => {`);
    code.push(`  console.error(err.stack);`);
    code.push(`  res.status(500).send({error: err.message});`);
    code.push(`});`);
  
    const port = ast.server && ast.server.port ? ast.server.port : 3000;
    code.push(`app.listen(${port}, () => console.log('Server running on port ${port}'));`);
    return code.join('\n');
  }
  
  module.exports = generateAppJs;
  