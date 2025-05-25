# My Monorepo Project

This repository hosts multiple sub-projects, managed in a monorepo structure. The main `index.html` file provides a dashboard to navigate to these projects.

## Sub-projects

The sub-projects are located in the `subprojects` directory. Each sub-project is intended to be somewhat independent, allowing for different technologies and development workflows.

- **`subprojects/ai-tools/`**: A React application that lists and displays information about various AI tools. Data is sourced from a local JSON file.
- **`subprojects/backend-services/`**: A placeholder for backend services (e.g., APIs).
- **`subprojects/vue-ui/`**: A placeholder for a Vue.js-based user interface.

## Managing Sub-projects

The goal is to allow developers to work on individual sub-projects and to selectively build or deploy them.

### Current Approach (Manual)

Currently, to work with a specific sub-project, you would typically:

1.  Navigate to its directory:
    ```bash
    cd subprojects/ai-tools 
    ```
    (Or `cd subprojects/backend-services`, `cd subprojects/vue-ui` for other projects)
2.  Run its specific commands (e.g., for installing dependencies, starting a development server, or building):
    ```bash
    npm install  # Example for a Node.js based project
    npm start    # Example
    # or
    # yarn build # Example
    ```
    Each sub-project will have its own `README.md` detailing its specific setup and commands once fully developed.

### Working with the `ai-tools` (React) Subproject

The `ai-tools` project is a React application created using Create React App.

1.  **Navigate to the project directory:**
    (Assuming you are in the `my-monorepo` root directory)
    ```bash
    cd subprojects/ai-tools
    ```

2.  **Install dependencies** (if you haven't already or if `package.json` changed):
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm start
    ```
    This will typically open the application in your default web browser at `http://localhost:3000`. The page will reload if you make edits.

4.  **Build for production:**
    ```bash
    npm run build
    ```
    This creates an optimized build in the `my-monorepo/subprojects/ai-tools/build` directory. The main `index.html` in the repository root links to this build.

### Future Considerations for Build/Deployment

As the project grows, managing builds and deployments across multiple sub-projects can become complex. Here are some potential strategies and tools that could be adopted:

*   **Custom Scripts:** Develop shell scripts (Bash, Python, etc.) in the root directory to automate common tasks across sub-projects (e.g., `build_all.sh`, `start_project.sh <project-name>`). These scripts could iterate through specified project directories and execute their respective build or run commands.
*   **Configuration File for Selective Builds:** A configuration file (e.g., `projects.json` or a section in `package.json` if using Node.js-based tooling) could define which projects to include in a particular build or deployment. Scripts would then read this configuration.
*   **Monorepo Management Tools:** For more robust solutions, consider dedicated monorepo tools. These tools offer advanced features like:
    *   **Dependency Management:** Optimizing and sharing dependencies across projects.
    *   **Task Running:** Efficiently running scripts (build, test, lint) across the monorepo or only on affected projects.
    *   **Caching:** Speeding up builds by caching artifacts.
    *   **Workspace Management:**
    *   Examples:
        *   [Lerna](https://lerna.js.org/) (popular in the JavaScript ecosystem)
        *   [Nx](https://nx.dev/) (supports multiple frameworks, offers advanced features)
        *   [Turborepo](https://turborepo.org/) (fast, efficient builds for JavaScript/TypeScript monorepos)
        *   [Bazel](https://bazel.build/) (Google's build system, language-agnostic, powerful but can be complex to set up)

The choice of approach will depend on the complexity and specific needs of the sub-projects as they evolve. For now, each sub-project should be managed independently within its own directory.

## Installation and Running the Monorepo

Follow these steps to install and run the monorepo and its subprojects:

### 1. Clone the repository

```bash
# Clone this repository (adjust the URL if needed)
git clone <REPOSITORY_URL>
cd my-monorepo
```

### 2. Build the React application (AI Tools)

```bash
cd subprojects/ai-tools
npm install           # Install dependencies
npm run build         # Generate the build folder with static files
cd ../../            # Return to the monorepo root
```

> **Note:** The `package.json` file in AI Tools is already configured with the `homepage` property so the build works correctly from the main dashboard.

### 3. Serve the monorepo with a static server

To make the dashboard (`index.html`) and the builds of the subprojects accessible from the browser, use a static server from the root of the monorepo. You can use [`serve`](https://www.npmjs.com/package/serve) or any other global static server:

```bash
npm install -g serve
serve . -l 5500
```

This will serve the entire monorepo at [http://localhost:5500/index.html](http://localhost:5500/index.html). From there you can navigate to the subprojects, including the already built React app.

### 4. (Optional) Work with other subprojects

Each subproject may have its own workflow. Check the `README.md` in each subfolder for specific instructions.

- **Backend Services:**
  - Location: `subprojects/backend-services/`
  - (Add instructions here when the backend is implemented)

- **Vue UI:**
  - Location: `subprojects/vue-ui/`
  - (Add instructions here when the UI is implemented)

### 5. Monorepo structure

- `index.html` — Main dashboard
- `style.css` — Global dashboard styles
- `subprojects/ai-tools/` — React App (AI Tools)
- `subprojects/backend-services/` — Backend (placeholder)
- `subprojects/vue-ui/` — Vue UI (placeholder)

---

Common issues:
- If you see `Cannot GET /subprojects/ai-tools/build/index.html`, make sure you have run the React build and are serving the monorepo root.
- If you modify the React app, remember to run `npm run build` again in `subprojects/ai-tools`.

Done! Now anyone can install and run the monorepo by following these steps.
