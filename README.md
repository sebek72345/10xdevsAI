# 10x-astro-ai-training

## Table of Contents
1. [Project Name](#project-name)
2. [Project Description](#project-description)
3. [Tech Stack](#tech-stack)
4. [Getting Started Locally](#getting-started-locally)
5. [Available Scripts](#available-scripts)
6. [Project Scope](#project-scope)
7. [Project Status](#project-status)
8. [License](#license)

## 1. Project Name
`10x-astro-ai-training`

## 2. Project Description

Flashcard AI App is a web application designed to help users efficiently create and learn educational flashcards. The main goal of the application is to automate the flashcard creation process using artificial intelligence (AI), significantly reducing the time needed for their preparation compared to manual methods. The application is aimed at students and working professionals who are learning a new language and want to use the spaced repetition method for more effective memorization. The key benefit for the user is time saving and access to an effective learning method.

## 3. Tech Stack

### Frontend
*   **Astro 5:** Utilized for building fast, content-focused websites with its modern static-first architecture, minimizing JavaScript by default.
*   **React 19:** Incorporated for developing interactive user interface components where dynamic client-side rendering is necessary.
*   **TypeScript 5:** Employed for static typing throughout the project, enhancing code quality, maintainability, and developer experience with better IDE support.
*   **Tailwind CSS 4:** A utility-first CSS framework used for rapid and consistent styling of the application.
*   **Shadcn/ui:** Provides a library of accessible and well-crafted React components that serve as the foundation for the user interface.

### Backend
*   **Supabase:** A comprehensive open-source backend-as-a-service solution, providing:
    *   **PostgreSQL Database:** Robust and scalable SQL database.
    *   **Authentication:** Built-in user authentication and management.
    *   **APIs:** Instant and customizable APIs for data access.
    *   *(Other Supabase features like Realtime, Storage can be listed if used)*

### AI Integration
*   **Openrouter.ai:** Serves as the gateway to a diverse range of Large Language Models (LLMs), including those from OpenAI, Anthropic, Google, and others. This allows for flexible selection of models to balance performance, cost, and specific AI task requirements.

### Development & Deployment
*   **Node.js:** Version `22.14.0` (as specified in the `.nvmrc` file, ensuring a consistent development environment).
*   **GitHub Actions:** Used for setting up Continuous Integration and Continuous Deployment (CI/CD) pipelines to automate testing and deployment processes.
*   **DigitalOcean:** The target platform for hosting the application, likely deployed using a Docker container image.

## 4. Getting Started Locally

To set up and run the project on your local machine, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd 10x-astro-ai-training
    ```
    *(Replace `<your-repository-url>` with the actual URL of the GitHub repository.)*

2.  **Install Node.js:**
    Ensure you have Node.js version `22.14.0` installed. It is highly recommended to use a Node Version Manager like `nvm`:
    ```bash
    nvm install 22.14.0
    nvm use 22.14.0
    ```
    If you don't have `nvm`, you can install it from [here](https://github.com/nvm-sh/nvm).

3.  **Install Project Dependencies:**
    Navigate to the project root directory and run:
    ```bash
    npm install
    ```

4.  **Set Up Environment Variables:**
    Create a `.env` file in the root of the project by copying the example file if one exists (e.g., `.env.example`). Populate it with the necessary API keys and configuration details for services like Supabase and Openrouter.ai.
    ```env
    # Example .env content:
    # SUPABASE_URL=your_supabase_project_url
    # SUPABASE_ANON_KEY=your_supabase_anon_key
    # OPENROUTER_API_KEY=your_openrouter_api_key
    # OTHER_VARIABLES=...
    ```

5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application should now be accessible at `http://localhost:4321` (or another port if configured differently by Astro).

## 5. Available Scripts

The `package.json` file defines the following scripts for common development tasks:

*   `npm run dev`
    *   Starts the Astro development server with hot module reloading.
*   `npm run build`
    *   Builds the application for production, outputting to the `dist/` directory.
*   `npm run preview`
    *   Serves the production build locally to preview before deployment.
*   `npm run astro ...`
    *   Allows running Astro CLI commands directly.
*   `npm run lint`
    *   Runs ESLint to analyze the code for potential errors and style issues.
*   `npm run lint:fix`
    *   Runs ESLint and attempts to automatically fix any identified issues.
*   `npm run format`
    *   Formats the codebase using Prettier to ensure consistent code style.

## 6. Project Scope

The MVP (Minimum Viable Product) of the Flashcard AI App will include the following key functionalities:

*   **AI-Powered Flashcard Generation (FR-001):** Users can generate flashcards by providing text (via copy-paste or file upload), which the AI will process into question/answer pairs.
*   **Manual Flashcard Creation (FR-002):** Users can manually create their own flashcards with custom questions and answers.
*   **Flashcard Management:**
    *   Browse created flashcards (FR-003).
    *   Edit existing flashcards (FR-004).
    *   Delete flashcards (FR-005).
*   **User Accounts (FR-006):** Basic user authentication (registration, login, logout) and secure data storage for individual flashcard collections.
*   **Spaced Repetition System (FR-007):** Integration with a pre-built library to implement a spaced repetition learning algorithm.
*   **Flashcard Typing (FR-008):** Distinction between AI-generated (`auto_generated`) and manually created (`manual`) flashcards.
*   **AI Suggestion Workflow (FR-009, FR-010):** AI-generated flashcards will be presented as suggestions for user review, with options to accept and add them to their collection.
*   **Input Validation (FR-011):** Validation for user inputs, such as text length for AI processing and form field formats.

For a detailed list of user stories and out-of-scope features, please refer to the full Product Requirements Document (`prd.md`).

## 7. Project Status

*   **Current Version:** `0.0.1` (as per `package.json`)
*   **Development Stage:** In Development

*(This section can be updated as the project progresses, e.g., Alpha, Beta, Released.)*

## 8. License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.

*(Please ensure a `LICENSE.md` file with the MIT License text (or your chosen license) exists in the root of the project. If not, you should create one.)*
