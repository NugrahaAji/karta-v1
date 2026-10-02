/**
 * swagger.js
 * Converts the custom apiDocumentation object into an OpenAPI 3.0 spec
 * and returns a configured swagger-ui-express setup.
 */

import swaggerUi from "swagger-ui-express";
import { apiDocumentation } from "../routes/apiDocs.routes.js";

// ─── Map access label → security requirement ──────────────────────────────────
const ACCESS_SECURITY = {
  Authenticated: [{ bearerAuth: [] }],
  Company:       [{ bearerAuth: [] }],
  superAdmin:    [{ bearerAuth: [] }],
  Public:        [],
};

// ─── Convert custom path params (:id → {id}) ─────────────────────────────────
function toOaPath(path) {
  return path.replace(/:([a-zA-Z_]+)/g, "{$1}");
}

// ─── Extract path params from a path string ───────────────────────────────────
function extractPathParams(path) {
  const matches = path.match(/:([a-zA-Z_]+)/g) || [];
  return matches.map((m) => ({
    name: m.slice(1),
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

// ─── Build request body schema from example object ───────────────────────────
function buildRequestBody(body) {
  if (!body || typeof body !== "object") return null;
  const properties = {};
  for (const [key, val] of Object.entries(body)) {
    if (Array.isArray(val)) {
      properties[key] = { type: "array", items: { type: "object" }, example: val };
    } else if (typeof val === "object" && val !== null) {
      properties[key] = { type: "object", example: val };
    } else {
      properties[key] = { type: typeof val, example: val };
    }
  }
  return {
    required: true,
    content: {
      "application/json": {
        schema: { type: "object", properties },
      },
    },
  };
}

// ─── Convert apiDocumentation → OpenAPI 3.0 spec ────────────────────────────
function buildOpenApiSpec() {
  const paths = {};

  for (const category of apiDocumentation.categories) {
    for (const ep of category.endpoints) {
      const oaPath = toOaPath(ep.path);
      const method = ep.method.toLowerCase();

      if (!paths[oaPath]) paths[oaPath] = {};

      const operation = {
        tags: [category.name],
        summary: ep.description,
        security: ACCESS_SECURITY[ep.access] ?? [],
        parameters: extractPathParams(ep.path),
        responses: {
          [ep.response?.status ?? 200]: {
            description: "Success",
            content: {
              "application/json": {
                example: ep.response?.body ?? {},
              },
            },
          },
        },
      };

      // Attach request body for methods that have one
      const body = ep.request?.body;
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const rb = buildRequestBody(body);
        if (rb) operation.requestBody = rb;
      }

      paths[oaPath][method] = operation;
    }
  }

  return {
    openapi: "3.0.0",
    info: {
      title: apiDocumentation.title,
      version: apiDocumentation.version,
      description: "Karta — HP3M Maturity Assessment Platform API",
    },
    servers: [{ url: process.env.BACKEND_URL ?? "http://localhost:5000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths,
  };
}

export const swaggerSpec = buildOpenApiSpec();

export const swaggerMiddleware = swaggerUi.serve;
export const swaggerSetup     = swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Karta API Docs",
  customCss: `
    .swagger-ui .topbar { background: #1a1a2e; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #e94560; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: "none",
  },
});
