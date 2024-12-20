// generators/frontendGenerator.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Reads a template file and replaces placeholders.
 * @param {string} templatePath - Path to the template file.
 * @param {Object} replacements - Key-value pairs for replacements.
 * @returns {string} - Processed template content.
 */
function renderTemplate(templatePath, replacements) {
  let content = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value);
  }
  return content;
}

function setupFrontend(projectDir, ast) {
  if (ast.frontend === 'react') {
    const clientDir = path.join(projectDir, 'client');

    // Create the client directory if it doesn't exist
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir);
    }

    try {
      console.log('Setting up React frontend...');
      execSync('npx create-react-app .', { stdio: 'inherit', cwd: clientDir });

      if (ast.frontendPackages.length > 0) {
        console.log('Installing additional frontend packages...');
        execSync(`npm install ${ast.frontendPackages.join(' ')}`, { stdio: 'inherit', cwd: clientDir });
      }

      // Install react-router-dom for routing
      console.log('Installing react-router-dom...');
      execSync(`npm install react-router-dom`, { stdio: 'inherit', cwd: clientDir });

      // Determine backend URL based on ast.server.port
      const backendPort = ast.server && ast.server.port ? ast.server.port : 3000;
      const backendUrl = `http://localhost:${backendPort}`;

      // Update package.json with a proxy field
      const packageJsonPath = path.join(clientDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.proxy = backendUrl;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

      // Create an axiosInstance.js file using template
      const axiosInstanceTemplatePath = path.join(__dirname, '../templates/axiosInstance.js.template');
      const axiosInstanceContent = renderTemplate(axiosInstanceTemplatePath, { BACKEND_URL: backendUrl });
      fs.writeFileSync(path.join(clientDir, 'src', 'axiosInstance.js'), axiosInstanceContent, 'utf8');

      // Create Login.js and Register.js using templates
      const loginTemplatePath = path.join(__dirname, '../templates/Login.js.template');
      const loginContent = fs.readFileSync(loginTemplatePath, 'utf8'); // Assuming no placeholders
      fs.writeFileSync(path.join(clientDir, 'src', 'Login.js'), loginContent, 'utf8');

      const registerTemplatePath = path.join(__dirname, '../templates/Register.js.template');
      const registerContent = fs.readFileSync(registerTemplatePath, 'utf8'); // Assuming no placeholders
      fs.writeFileSync(path.join(clientDir, 'src', 'Register.js'), registerContent, 'utf8');

      // Modify App.js to include routes
      const appJsPath = path.join(clientDir, 'src', 'App.js');
      let appJsContent = fs.readFileSync(appJsPath, 'utf8');

      // Basic routing setup:
      // We'll inject BrowserRouter, Routes, Route
      // and routes to /login and /register
      const updatedAppJs = appJsContent.replace(
        "import logo from './logo.svg';",
        `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';`
      ).replace(
        /<header className="App-header">[\s\S]*?<\/header>/,
        `<Router>
          <div style={{textAlign:'center', marginTop:'50px'}}>
            <h1>Welcome</h1>
            <p><a href="/login">Login</a> | <a href="/register">Register</a></p>
          </div>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<div style={{textAlign:'center', marginTop:'50px'}}><p>Please Login or Register</p></div>} />
          </Routes>
        </Router>`
      );

      fs.writeFileSync(appJsPath, updatedAppJs, 'utf8');

      console.log('React frontend setup complete with Login and Register pages, proxy, and axiosInstance!');
      console.log(`Proxy set to ${backendUrl}`);
      console.log(`You can now start the frontend with: \n  cd ${path.relative(process.cwd(), clientDir)} && npm start`);
    } catch (error) {
      console.error('Error setting up frontend:', error);
    }
  }
}

module.exports = setupFrontend;
