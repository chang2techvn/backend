# Task Management API

A REST API built with Encore.ts for task and project management.

## Prerequisites 

**Install Encore:**
- **macOS:** `brew install encoredev/tap/encore`
- **Linux:** `curl -L https://encore.dev/install.sh | bash`
- **Windows:** `iwr https://encore.dev/install.ps1 | iex`

## Run app locally

Run this command from your application's root folder:

```bash
encore run
```

### Using the API

The API provides endpoints for user management, authentication, projects, and tasks.

### Local Development Dashboard

While `encore run` is running, open [http://localhost:9400/](http://localhost:9400/) to access Encore's local developer dashboard.

## Development

### Add a new service

To create a new microservice, add a file named encore.service.ts in a new directory.
The file should export a service definition by calling `new Service`, imported from `encore.dev/service`.

```ts
import { Service } from "encore.dev/service";

export default new Service("my-service");
```

Encore will now consider this directory and all its subdirectories as part of the service.

Learn more in the docs: https://encore.dev/docs/ts/primitives/services

### Add a new endpoint

Create a new `.ts` file in your new service directory and write a regular async function within it. Then to turn it into an API endpoint, use the `api` function from the `encore.dev/api` module. This function designates it as an API endpoint.

Learn more in the docs: https://encore.dev/docs/ts/primitives/defining-apis

### Service-to-service API calls

Calling API endpoints between services looks like regular function calls with Encore.ts.
The only thing you need to do is import the service you want to call from `~encore/clients` and then call its API endpoints like functions.

In the example below, we import the service `hello` and call the `ping` endpoint using a function call to `hello.ping`:

```ts
import { hello } from "~encore/clients"; // import 'hello' service

export const myOtherAPI = api({}, async (): Promise<void> => {
  const resp = await hello.ping({ name: "World" });
  console.log(resp.message); // "Hello World!"
});
```

Learn more in the docs: https://encore.dev/docs/ts/primitives/api-calls

### Add a database

To create a database, import `encore.dev/storage/sqldb` and call `new SQLDatabase`, assigning the result to a top-level variable. For example:

```ts
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create the todo database and assign it to the "db" variable
const db = new SQLDatabase("todo", {
  migrations: "./migrations",
});
```

Then create a directory `migrations` inside the service directory and add a migration file `0001_create_table.up.sql` to define the database schema. For example:

```sql
CREATE TABLE todo_item (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false
  -- etc...
);
```

Once you've added a migration, restart your app with `encore run` to start up the database and apply the migration. Keep in mind that you need to have [Docker](https://docker.com) installed and running to start the database.

Learn more in the docs: https://encore.dev/docs/ts/primitives/databases

### Learn more

There are many more features to explore in Encore.ts, for example:

- [Request Validation](https://encore.dev/docs/ts/primitives/validation)
- [Streaming APIs](https://encore.dev/docs/ts/primitives/streaming-apis)
- [Cron jobs](https://encore.dev/docs/ts/primitives/cron-jobs)
- [Pub/Sub](https://encore.dev/docs/ts/primitives/pubsub)
- [Object Storage](https://encore.dev/docs/ts/primitives/object-storage)
- [Secrets](https://encore.dev/docs/ts/primitives/secrets)
- [Authentication handlers](https://encore.dev/docs/ts/develop/auth)
- [Middleware](https://encore.dev/docs/ts/develop/middleware)

## Deployment

### CI/CD with GitHub Actions

This project is configured for automatic deployment to Encore Cloud using GitHub Actions. The workflow is triggered on pushes to the main branch and can also be manually triggered.

#### Setup instructions:

1. Create an Encore auth token:
   - Go to [app.encore.dev](https://app.encore.dev)
   - Navigate to Settings → Auth Tokens
   - Create a new CI/CD token

2. Add the token to your GitHub repository secrets:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add a new repository secret with name `ENCORE_AUTH_TOKEN` and paste your token as the value

3. Push changes to the main branch to trigger automatic deployment

### Manually deploying to Encore Cloud

You can manually deploy your application using the Encore CLI:

```bash
# Login to Encore Cloud (first time only)
encore auth login

# Deploy the application
encore deploy
```

## CI/CD Status

[![Deploy to Encore Cloud](https://github.com/[your-github-username]/[your-repo-name]/actions/workflows/deploy.yml/badge.svg)](https://github.com/[your-github-username]/[your-repo-name]/actions/workflows/deploy.yml)

## Database Migrations

The application uses Prisma for database management. To apply migrations in production:

```bash
# Run migrations on the production database
encore db migrations apply
```

## Environment Management

Encore Cloud provides different environments (development, staging, production). You can specify which environment to deploy to:

```bash
# Deploy to a specific environment
encore deploy --environment production
```
