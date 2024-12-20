# Isokin

![Isokin Logo](https://github.com/XPZ2k15/Isokin/blob/main/assets/logo.png?raw=true)

**Isokin** is a powerful project generator that simplifies the creation of Node.js/Express applications. By leveraging a custom Domain-Specific Language (DSL), Isokin allows developers to define project structures, database configurations, authentication mechanisms, and frontend integrations effortlessly. Whether you're building a simple API or a full-stack application with React, Isokin streamlines the setup process, enabling you to focus on developing your application's core functionalities.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [DSL Syntax](#dsl-syntax)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **Express.js Integration:** Quickly set up an Express server with customizable middlewares.
- **Database Support:** Seamlessly integrate with MySQL or MSSQL databases.
- **Authentication:** Implement JWT-based authentication with routes for registration and login.
- **Frontend Setup:** Optionally generate a React frontend with routing and Axios configuration.
- **Database Migrations:** Automate the creation of database tables based on defined migrations.
- **Customizable Routes:** Define RESTful API routes with ease, including protected routes requiring authentication.
- **Environment Configuration:** Manage environment variables effortlessly with `.env` support.
- **Middleware Configuration:** Add essential middlewares like CORS, JSON parsing, and request logging.

## Installation

1. **Clone the Repository**

```bash
git clone https://github.com/XPZ2k15/Isokin.git
cd Isokin
```

2. **Install Dependencies**

Ensure you have [Node.js](https://nodejs.org/) installed. Then, install the necessary packages:

```bash
npm install
```

3. **Make the Script Executable (Optional)**

If you want to use Isokin globally, you can link it:

```bash
npm link
```

## Usage

Isokin operates by parsing a DSL file that defines your project's specifications and generating the corresponding project structure.

### 1. Define Your Project DSL

Create a `.isokine` file (e.g., `project.isokine`) with your project definitions. Here's an example:

```plaintext
essence: express
speak at port 4000
whisper: parse incoming as json
whisper: load environment from '.env'
whisper: enable cors
whisper: db type mysql
whisper: connect to 'mysql://user:password@localhost:3306/database'
whisper: use collection 'users'
whisper: use collection 'posts'
whisper: log requests
whisper: serve static from 'public'
whisper: auth enable
whisper: auth strategy jwt
whisper: auth route '/posts' requires login
whisper: frontend framework react
whisper: npm install axios
whisper: npm install react-router-dom

when asked for '/users', offer all items from 'users'
when asked for '/users/:id', retrieve item by id from 'users'
when posted to '/users' with body {username, password}, insert into 'users', return inserted document
```

### 2. Generate the Project

Run the generator script with your DSL file and specify the output directory:

```bash
node app.js project.isokine ./MyGeneratedApp
```

This command will create a new directory named `MyGeneratedApp` with the structured project based on your DSL definitions.

### 3. Navigate to Your Project and Install Dependencies

```bash
cd MyGeneratedApp
npm install
```

If you opted to generate a frontend with React, navigate to the `client` directory and install frontend dependencies:

```bash
cd client
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the root of your project and define necessary environment variables:

```dotenv
PORT=4000
MYSQL_URL=mysql://user:password@localhost:3306/database
JWT_SECRET=your_jwt_secret
```

### 5. Run the Application

- **Backend:**

```bash
npm start
```

- **Frontend (if generated):**

```bash
cd client
npm start
```

Your application should now be running with the backend server on the specified port and the frontend (if generated) accessible via `http://localhost:3000`.

## DSL Syntax

Isokin uses a straightforward DSL to define project specifications. Below are the supported commands and their descriptions:

- `essence: express`  
Defines the project as an Express.js application.

- `speak at port <number>`  
Sets the server port.

- `whisper: parse incoming as json`  
Adds middleware to parse JSON requests.

- `whisper: load environment from '<file>'`  
Loads environment variables from the specified `.env` file.

- `whisper: enable cors`  
Enables CORS (Cross-Origin Resource Sharing).

- `whisper: db type <mysql|mssql>`  
Specifies the database type.

- `whisper: connect to '<connection_string>'`  
Defines the database connection string.

- `whisper: use collection '<collection_name>'`  
Creates a database collection/table.

- `whisper: log requests`  
Adds middleware to log incoming requests.

- `whisper: serve static from '<directory>'`  
Serves static files from the specified directory.

- `whisper: auth enable`  
Enables authentication.

- `whisper: auth strategy <jwt>`  
Sets the authentication strategy (currently supports JWT).

- `whisper: auth route '<route>' requires login`  
Protects the specified route, requiring authentication.

- `whisper: frontend framework <react>`  
Specifies the frontend framework to generate (currently supports React).

- `whisper: npm install <package>`  
Installs additional npm packages in the frontend.

- `when asked for '<route>', offer all items from '<collection>'`  
Defines a GET route to retrieve all items from a collection.

- `when asked for '<route>:id', retrieve item by id from '<collection>'`  
Defines a GET route to retrieve a specific item by ID from a collection.

- `when posted to '<route>' with body {fields}, insert into '<collection>', return inserted document`  
Defines a POST route to insert a new document into a collection.

## Project Structure

After generation, your project will have the following structure:

```
MyGeneratedApp/
├── app.js
├── db.js
├── auth.js
├── package.json
├── .gitignore
├── .env
├── routes/
│   ├── index.js
│   ├── auth.js
│   └── users.js
├── migrations/
│   └── create_users_table.sql
├── public/
│   └── ...static files...
└── client/ (if frontend is enabled)
    ├── package.json
    ├── src/
    │   ├── App.js
    │   ├── axiosInstance.js
    │   ├── Login.js
    │   └── Register.js
    └── ...React project files...
```

### Key Files

- **app.js:** Entry point for the Express server.
- **db.js:** Database connection and migration scripts.
- **auth.js:** Authentication middleware.
- **routes/**: Contains route definitions.
- **migrations/**: Database migration files.
- **public/**: Serves static files.
- **client/**: React frontend application (if generated).

## Contributing

Contributions are welcome! To contribute to **Isokin**, follow these steps:

1. **Fork the Repository**

Click the [Fork](https://github.com/XPZ2k15/Isokin/fork) button at the top-right corner of this page.

2. **Clone Your Fork**

```bash
git clone https://github.com/YourUsername/Isokin.git
cd Isokin
```

3. **Create a New Branch**

```bash
git checkout -b feature/YourFeatureName
```

4. **Make Your Changes**

Implement your feature or bug fix.

5. **Commit Your Changes**

```bash
git commit -m "Add feature: YourFeatureName"
```

6. **Push to Your Fork**

```bash
git push origin feature/YourFeatureName
```

7. **Open a Pull Request**

Navigate to the original [Isokin repository](https://github.com/XPZ2k15/Isokin) and click the **Compare & pull request** button.

## License

Distributed under the [MIT License](LICENSE).

## Contact

**Project Link:** [https://github.com/XPZ2k15/Isokin](https://github.com/XPZ2k15/Isokin)

---

## Additional Recommendations

1. **Include Screenshots or GIFs:**
   Adding visual aids can help users understand what your project does and how it looks.

2. **Add a `LICENSE` File:**
   Clearly specify the licensing terms for your project.

3. **Provide Examples:**
   Offer sample DSL files or command usages to help users get started quickly.

4. **Documentation:**
   Consider adding more detailed documentation, possibly in a `/docs` directory, for advanced configurations and features.

5. **Contribution Guidelines:**
   Include a `CONTRIBUTING.md` file to outline how others can contribute to your project.

6. **Changelog:**
   Maintain a `CHANGELOG.md` to document the history of changes and updates to your project.

---

Feel free to customize the `README.md` further to better fit your project's specifics and to include any additional information you find pertinent. If you have any specific sections you'd like to add or modify, let me know!
