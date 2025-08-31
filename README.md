# amzs_Master Project
* This repository hosts multiple sub-projects, managed in a monorepo structure. 
* The main `index.html` file provides a dashboard to navigate to these projects.

## 🚀 Quick Start

If you just want to get up and running quickly:

```bash
# Clone and navigate to the project
git clone <REPOSITORY_URL>
cd amzs-master

# Install all dependencies
npm run install:all

# Build all projects
npm run build:all

# Serve the monorepo
npm run serve
```

Then open [http://localhost:5500/index.html](http://localhost:5500/index.html) in your browser.

## Sub-projects
- The sub-projects are located in the `subprojects` directory. Each sub-project is intended to be somewhat independent, allowing for different technologies and development workflows.

- **`subprojects/ai-tools/`**: A React application that lists and displays information about various AI tools. Data is sourced from a local JSON file.
- **`subprojects/backend-services/`**: A placeholder for backend services (e.g., APIs).
- **`subprojects/vue-ui/`**: A placeholder for a Vue.js-based user interface.

## Managing Sub-projects

The goal is to allow developers to work on individual sub-projects and to selectively build or deploy them.
 
## Installation and Running the Monorepo

Follow these steps to install and run the monorepo and its subprojects:

### 1. Clone the repository

```bash
# Clone this repository (adjust the URL if needed)
git clone <REPOSITORY_URL>
cd amzs-master
```

### 2. Install dependencies

Install all dependencies for the monorepo and its subprojects:

```bash
npm run install:all
```

Or install dependencies for specific subprojects:

```bash
npm run install:ai-tools    # Install AI Tools dependencies
npm run install:backend     # Install Backend dependencies  
npm run install:vue         # Install Vue UI dependencies
```

### 3. Development Workflow

#### Start development servers:

```bash
# Start AI Tools development server (default)
npm run dev

# Start all development servers concurrently
npm run dev:all

# Start specific subproject development servers
npm run dev:ai-tools        # Start React development server
npm run dev:backend         # Start Backend development server
npm run dev:vue             # Start Vue development server
```

#### Build projects:

```bash
# Build AI Tools (default)
npm run build

# Build all projects
npm run build:all

# Build specific projects
npm run build:ai-tools      # Build React app
npm run build:backend       # Build Backend services
npm run build:vue           # Build Vue UI
```

### 4. Serve the monorepo

For production serving (builds first, then serves):

```bash
npm run serve
```

For development serving (serves current state):

```bash
npm run serve:dev
```

This will serve the entire monorepo at [http://localhost:5500/index.html](http://localhost:5500/index.html). From there you can navigate to the subprojects, including the built React app.

### 5. Additional Commands

#### Testing:
```bash
# Run all tests
npm run test:all

# Run tests for specific projects
npm run test:ai-tools      # Test React app
npm run test:backend       # Test Backend services
npm run test:vue           # Test Vue UI
```

#### Cleaning:
```bash
# Clean all projects
npm run clean

# Clean specific projects
npm run clean:ai-tools     # Remove node_modules and build from AI Tools
npm run clean:backend      # Remove node_modules and dist from Backend
npm run clean:vue          # Remove node_modules and dist from Vue UI
```

### 6. Available npm scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install dependencies for all subprojects |
| `npm run dev` | Start AI Tools development server |
| `npm run dev:all` | Start all development servers concurrently |
| `npm run build` | Build AI Tools |
| `npm run build:all` | Build all projects |
| `npm run serve` | Build AI Tools and serve the monorepo |
| `npm run serve:dev` | Serve the monorepo without building |
| `npm run test:all` | Run tests for all projects |
| `npm run clean` | Clean all projects |

### 7. Monorepo structure

- `package.json` — Root monorepo configuration
- `index.html` — Main dashboard
- `style.css` — Global dashboard styles
- `subprojects/ai-tools/` — React App (AI Tools)
- `subprojects/backend-services/` — Backend (placeholder)
- `subprojects/vue-ui/` — Vue UI (placeholder)

---

Common issues:
- If you see `Cannot GET /subprojects/ai-tools/build/index.html`, make sure you have run `npm run build` and are serving the monorepo root.
- If you modify the React app, remember to run `npm run build` again.
- Use `npm run dev:ai-tools` for development with hot reloading.
