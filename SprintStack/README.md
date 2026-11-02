# SprintStack

SprintStack is a task board with the same Bauhaus style, login flow, task cards, filters, progress chart, and dialogs as `../Internship_assignment`. The copied React interface keeps the same HTML DOM structure and CSS styling. Its data operations use JSON over a REST API.

## Stack

- HTML5 and DHTML through React's dynamic DOM rendering
- CSS3 and Bootstrap 5 (Bootstrap CSS CDN plus the original custom styling)
- ReactJS with Vite for development and production builds
- NodeJS and ExpressJS REST API
- MongoDB with Mongoose as the configured primary database
- JSON request and response bodies; JWT authentication
- Postman collection at `postman/SprintStack.postman_collection.json`
- Tomcat can serve the static React production build (`frontend/dist`) as a web application. The Node API remains a separate process.

**Database note:** MongoDB is the active database, matching the source project. DynamoDB and Apache Cassandra are separate database products and are not configured as additional live stores in this build. They cannot be enabled just by adding their names to the stack; doing so needs a storage adapter and database credentials/schema for the target service.

## Run locally

1. MongoDB is used whenever `MONGODB_URI` is reachable. If it is unavailable, the API starts with a persistent local development store at `backend/data/local-dev.json` so registration and the board still work locally.
2. In `backend`, optionally copy `.env.example` to `.env` and set a private `JWT_SECRET`, then run:

   ```sh
   npm install
   npm start
   ```

   The API listens on `http://localhost:5000`.

3. In another terminal, in `frontend`, run:

   ```sh
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`.

The first registered account can be used to sign in. Existing accounts and tasks from `Internship_assignment` are not copied. The local development store is for running this copy without MongoDB; set up MongoDB and `MONGODB_URI` for normal database-backed use.

## REST endpoints

- `POST /api/register`, `POST /api/login`
- `GET /api/tasks`, `POST /api/tasks`
- `PUT /api/tasks/:id`, `PATCH /api/tasks/:id/status`, `DELETE /api/tasks/:id`
- `GET /api/users`, `GET /api/health`

Except registration and login, endpoints require `Authorization: Bearer <token>`. Open the Postman collection and set `baseUrl`, then register or log in to save a token for the task requests.

## Build and Tomcat

Run `npm run build` from `frontend`. Deploy the contents of `frontend/dist` as the Tomcat web application root (or package them under a WAR's root). Configure `VITE_BACKEND_URL` at build time to point at the separately hosted Express API. Vite is for development/build only; Tomcat does not run the Node API.
