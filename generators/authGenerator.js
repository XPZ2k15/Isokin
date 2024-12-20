// generators/authGenerator.js
function generateAuthJs() {
    return `
  const jwt = require('jsonwebtoken');
  
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }
  
  module.exports = { authenticateToken };
  `;
  }
  
  function generateAuthRoutes(dbType) {
    let findUserQuery, insertUserQuery;
    if (dbType === 'mysql') {
      findUserQuery = "SELECT * FROM users WHERE username=? LIMIT 1";
      insertUserQuery = "INSERT INTO users (username, password) VALUES (?,?)";
    } else {
      // MSSQL
      findUserQuery = "SELECT * FROM users WHERE username=@username";
      insertUserQuery = "INSERT INTO users (username, password) VALUES (@username,@password)";
    }
  
    return `
  const express = require('express');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcrypt'); // Added bcrypt
  const router = express.Router();
  const { getDB } = require('../db');
  
  const SALT_ROUNDS = 10; // Define salt rounds for bcrypt
  
  // Register route
  router.post('/register', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if(!username || !password) return res.status(400).send({error: 'Username and password required'});
  
      ${
        dbType === 'mysql'
        ? `const [existing] = await getDB().query('${findUserQuery}', [username]);`
        : `const existing = await getDB().request().input('username', username).query('${findUserQuery}');`
      }
  
      ${
        dbType === 'mysql'
        ? `if (existing && existing.length && existing[0]) { if (existing[0].length > 0) return res.status(400).send({error: 'User already exists'}); }`
        : `if (existing.recordset && existing.recordset.length > 0) return res.status(400).send({error: 'User already exists'});`
      }
  
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  
      ${
        dbType === 'mysql'
        ? `await getDB().query('${insertUserQuery}', [username, hashedPassword]);`
        : `await getDB().request().input('username', username).input('password', hashedPassword).query('${insertUserQuery}');`
      }
  
      res.send({message: 'User registered successfully'});
    } catch(err) {
      next(err);
    }
  });
  
  // Login route
  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if(!username || !password) return res.status(400).send({error: 'Username and password required'});
  
      ${
        dbType === 'mysql'
        ? `const [rows] = await getDB().query('${findUserQuery}', [username]);`
        : `const result = await getDB().request().input('username', username).query('${findUserQuery}');`
      }
  
      let userRecord = ${
        dbType === 'mysql'
        ? `rows && rows.length && rows[0].length ? rows[0][0] : null;`
        : `result.recordset && result.recordset.length ? result.recordset[0] : null;`
      }
  
      if(!userRecord) return res.status(400).send({error: 'Invalid credentials'});
  
      // Compare hashed password
      const isMatch = await bcrypt.compare(password, userRecord.password);
      if(!isMatch) return res.status(400).send({error: 'Invalid credentials'});
  
      const user = { name: userRecord.username };
      const accessToken = jwt.sign(user, process.env.JWT_SECRET || 'secret');
      res.send({ accessToken });
    } catch(err) {
      next(err);
    }
  });
  
  module.exports = router;
  `;
  }
  
  module.exports = {
    generateAuthJs,
    generateAuthRoutes
  };
  