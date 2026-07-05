import express from "express";

const router = express.Router();

const apiDocumentation = {
  title: "Karta API Documentation",
  version: "1.0.0",
  baseUrl: "/api",
  categories: [
    // ═══════════════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: "Authentication",
      description: "User registration, login, email verification, password management",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/register",
          description: "Register a new user account",
          access: "Public",
          request: {
            body: {
              name: "John Doe",
              email: "john@example.com",
              password: "password123",
              accountRole: "Company",
              plan: "free",
            },
          },
          response: {
            status: 201,
            body: {
              token: "eyJhbGciOiJIUzI1NiIs...",
              user: {
                _id: "664a1b2c3d4e5f6a7b8c9d0e",
                name: "John Doe",
                email: "john@example.com",
                role: "member",
                accountRole: "Company",
                plan: "free",
                isVerified: false,
                isActive: true,
                createdAt: "2026-04-29T07:00:00.000Z",
              },
              requiresVerification: true,
              message: "Registration successful. Please verify your email.",
            },
          },
        },
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Login with email and password",
          access: "Public",
          request: {
            body: {
              email: "john@example.com",
              password: "password123",
            },
          },
          response: {
            status: 200,
            body: {
              token: "eyJhbGciOiJIUzI1NiIs...",
              user: {
                _id: "664a1b2c3d4e5f6a7b8c9d0e",
                name: "John Doe",
                email: "john@example.com",
                role: "member",
                accountRole: "Company",
                plan: "free",
                isVerified: true,
                isActive: true,
                lastLogin: "2026-04-29T07:00:00.000Z",
              },
            },
          },
        },
        {
          method: "POST",
          path: "/api/auth/verify-email",
          description: "Verify email with OTP code",
          access: "Public",
          request: {
            body: {
              email: "john@example.com",
              code: "123456",
            },
          },
          response: {
            status: 200,
            body: { message: "Email verified successfully." },
          },
        },
        {
          method: "POST",
          path: "/api/auth/resend-otp",
          description: "Resend OTP verification code",
          access: "Public",
          request: {
            body: {
              email: "john@example.com",
              type: "email_verification",
            },
          },
          response: {
            status: 200,
            body: { message: "Verification code sent." },
          },
        },
        {
          method: "POST",
          path: "/api/auth/forgot-password",
          description: "Request password reset OTP",
          access: "Public",
          request: {
            body: { email: "john@example.com" },
          },
          response: {
            status: 200,
            body: { message: "If that email is registered, a reset code has been sent." },
          },
        },
        {
          method: "POST",
          path: "/api/auth/reset-password",
          description: "Reset password with OTP code",
          access: "Public",
          request: {
            body: {
              email: "john@example.com",
              code: "123456",
              newPassword: "newPassword123",
            },
          },
          response: {
            status: 200,
            body: { message: "Password reset successfully." },
          },
        },
        {
          method: "GET",
          path: "/api/auth/google",
          description: "Initiate Google OAuth login",
          access: "Public",
          request: { body: null },
          response: { status: 302, body: "Redirects to Google OAuth consent screen" },
        },
        {
          method: "GET",
          path: "/api/auth/me",
          description: "Get current authenticated user",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
          },
          response: {
            status: 200,
            body: {
              user: {
                _id: "664a1b2c3d4e5f6a7b8c9d0e",
                name: "John Doe",
                email: "john@example.com",
                role: "member",
                accountRole: "Company",
              },
            },
          },
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          description: "Logout (client-side token removal)",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
          },
          response: {
            status: 200,
            body: { message: "Logged out successfully" },
          },
        },
        {
          method: "POST",
          path: "/api/auth/change-password",
          description: "Change password (authenticated)",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
            body: {
              currentPassword: "oldPassword123",
              newPassword: "newPassword123",
            },
          },
          response: {
            status: 200,
            body: { message: "Password changed successfully." },
          },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: "Users",
      description: "User profile management",
      endpoints: [
        {
          method: "GET",
          path: "/api/users/profile",
          description: "Get user profile",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
          },
          response: {
            status: 200,
            body: {
              user: {
                _id: "664a1b2c3d4e5f6a7b8c9d0e",
                name: "John Doe",
                email: "john@example.com",
                avatar: "",
                role: "member",
                accountRole: "Company",
              },
            },
          },
        },
        {
          method: "PUT",
          path: "/api/users/profile",
          description: "Update user profile",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
            body: {
              name: "John Updated",
              avatar: "https://example.com/avatar.jpg",
            },
          },
          response: {
            status: 200,
            body: {
              user: {
                _id: "664a1b2c3d4e5f6a7b8c9d0e",
                name: "John Updated",
                email: "john@example.com",
                avatar: "https://example.com/avatar.jpg",
              },
            },
          },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DIMENSIONS
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: "Dimensions",
      description: "Maturity assessment dimensions (Technology, Pipeline, Data, etc.)",
      endpoints: [
        {
          method: "GET",
          path: "/api/dimensions",
          description: "Get all dimensions with subdimensions, levels, and criteria",
          access: "Public",
          request: { body: null },
          response: {
            status: 200,
            body: {
              dimensions: [
                {
                  _id: "664a...",
                  name: "Technology",
                  detail: "Technology dimension for PM maturity assessment",
                  subdimensions: [
                    {
                      _id: "664b...",
                      name: "Information Capability",
                      detail: "...",
                      levels: [
                        {
                          _id: "664c...",
                          name: "Level 1 - Initial / PM Initiated",
                          detail: "...",
                          criteria: [
                            { _id: "664d...", name: "Basic data extraction", detail: "..." },
                          ],
                        },
                      ],
                    },
                  ],
                  createdAt: "2026-04-29T07:00:00.000Z",
                  updatedAt: "2026-04-29T07:00:00.000Z",
                },
              ],
            },
          },
        },
        {
          method: "GET",
          path: "/api/dimensions/:id",
          description: "Get a single dimension by ID",
          access: "Public",
          request: { body: null },
          response: {
            status: 200,
            body: {
              dimension: {
                _id: "664a...",
                name: "Technology",
                detail: "...",
                subdimensions: ["..."],
              },
            },
          },
        },
        {
          method: "POST",
          path: "/api/dimensions",
          description: "Create a new dimension",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: {
              name: "Technology",
              detail: "Technology dimension for PM maturity assessment",
              subdimensions: [
                {
                  name: "Information Capability",
                  detail: "...",
                  levels: [
                    {
                      name: "Level 1 - Initial",
                      detail: "...",
                      criteria: [{ name: "Basic extraction", detail: "..." }],
                    },
                  ],
                },
              ],
            },
          },
          response: {
            status: 201,
            body: { dimension: { _id: "664a...", name: "Technology", "...": "..." } },
          },
        },
        {
          method: "PUT",
          path: "/api/dimensions/:id",
          description: "Update dimension name/detail",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: { name: "Technology Updated", detail: "Updated detail" },
          },
          response: {
            status: 200,
            body: { dimension: { _id: "664a...", name: "Technology Updated", "...": "..." } },
          },
        },
        {
          method: "DELETE",
          path: "/api/dimensions/:id",
          description: "Delete a dimension",
          access: "superAdmin",
          request: { headers: { Authorization: "Bearer <superAdmin_token>" } },
          response: {
            status: 200,
            body: { message: "Dimension deleted successfully" },
          },
        },
        {
          method: "POST",
          path: "/api/dimensions/:id/subdimensions",
          description: "Add a subdimension to a dimension",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: { name: "New Subdimension", detail: "Description" },
          },
          response: {
            status: 201,
            body: {
              subdimension: { _id: "664b...", name: "New Subdimension", detail: "Description", levels: [] },
              dimension: "...",
            },
          },
        },
        {
          method: "PUT",
          path: "/api/dimensions/:dimId/subdimensions/:subId",
          description: "Update a subdimension",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: { name: "Updated Name", detail: "Updated detail" },
          },
          response: {
            status: 200,
            body: { subdimension: "...", dimension: "..." },
          },
        },
        {
          method: "DELETE",
          path: "/api/dimensions/:dimId/subdimensions/:subId",
          description: "Delete a subdimension",
          access: "superAdmin",
          request: { headers: { Authorization: "Bearer <superAdmin_token>" } },
          response: {
            status: 200,
            body: { message: "Subdimension deleted successfully", dimension: "..." },
          },
        },
        {
          method: "POST",
          path: "/api/dimensions/:dimId/subdimensions/:subId/levels",
          description: "Add a level to a subdimension",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: {
              name: "Level 1 - Initial",
              detail: "Description",
              criteria: [{ name: "Criteria 1", detail: "..." }],
            },
          },
          response: {
            status: 201,
            body: { level: "...", dimension: "..." },
          },
        },
        {
          method: "PUT",
          path: "/api/dimensions/:dimId/subdimensions/:subId/levels/:levelId",
          description: "Update a level",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: { name: "Updated Level", detail: "Updated detail" },
          },
          response: { status: 200, body: { level: "...", dimension: "..." } },
        },
        {
          method: "DELETE",
          path: "/api/dimensions/:dimId/subdimensions/:subId/levels/:levelId",
          description: "Delete a level",
          access: "superAdmin",
          request: { headers: { Authorization: "Bearer <superAdmin_token>" } },
          response: { status: 200, body: { message: "Level deleted successfully", dimension: "..." } },
        },
        {
          method: "POST",
          path: "/api/dimensions/:dimId/subdimensions/:subId/levels/:levelId/criteria",
          description: "Add criteria to a level",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: { name: "New Criteria", detail: "Description" },
          },
          response: { status: 201, body: { criteria: "...", dimension: "..." } },
        },
        {
          method: "PUT",
          path: "/api/dimensions/:dimId/subdimensions/:subId/levels/:levelId/criteria/:criteriaId",
          description: "Update a criteria",
          access: "superAdmin",
          request: {
            headers: { Authorization: "Bearer <superAdmin_token>" },
            body: { name: "Updated Criteria", detail: "Updated detail" },
          },
          response: { status: 200, body: { criteria: "...", dimension: "..." } },
        },
        {
          method: "DELETE",
          path: "/api/dimensions/:dimId/subdimensions/:subId/levels/:levelId/criteria/:criteriaId",
          description: "Delete a criteria",
          access: "superAdmin",
          request: { headers: { Authorization: "Bearer <superAdmin_token>" } },
          response: { status: 200, body: { message: "Criteria deleted successfully", dimension: "..." } },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PM MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: "PM Management",
      description: "Company accounts can create and manage PM (Project Manager) sub-accounts",
      endpoints: [
        {
          method: "POST",
          path: "/api/pm/create",
          description: "Create a new PM account (linked to company)",
          access: "Company",
          request: {
            headers: { Authorization: "Bearer <company_token>" },
            body: {
              name: "PM User",
              email: "pm@company.com",
              password: "pmPassword123",
            },
          },
          response: {
            status: 201,
            body: {
              message: "PM account created successfully",
              user: {
                _id: "664e...",
                name: "PM User",
                email: "pm@company.com",
                role: "member",
                accountRole: "PM",
                createdBy: "664a...",
                isVerified: true,
                isActive: true,
              },
            },
          },
        },
        {
          method: "GET",
          path: "/api/pm/list",
          description: "List all PM accounts created by this company",
          access: "Company",
          request: {
            headers: { Authorization: "Bearer <company_token>" },
          },
          response: {
            status: 200,
            body: {
              users: [
                {
                  _id: "664e...",
                  name: "PM User",
                  email: "pm@company.com",
                  accountRole: "PM",
                  isActive: true,
                },
              ],
            },
          },
        },
        {
          method: "GET",
          path: "/api/pm/:id",
          description: "Get a single PM account",
          access: "Company",
          request: {
            headers: { Authorization: "Bearer <company_token>" },
          },
          response: {
            status: 200,
            body: { user: { _id: "664e...", name: "PM User", "...": "..." } },
          },
        },
        {
          method: "PUT",
          path: "/api/pm/:id",
          description: "Update PM account details",
          access: "Company",
          request: {
            headers: { Authorization: "Bearer <company_token>" },
            body: { name: "Updated PM", email: "newpm@company.com" },
          },
          response: {
            status: 200,
            body: { message: "PM account updated successfully", user: "..." },
          },
        },
        {
          method: "DELETE",
          path: "/api/pm/:id",
          description: "Deactivate a PM account",
          access: "Company",
          request: {
            headers: { Authorization: "Bearer <company_token>" },
          },
          response: {
            status: 200,
            body: { message: "PM account deactivated successfully", user: "..." },
          },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PROJECTS
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: "Projects",
      description: "Project management",
      endpoints: [
        {
          method: "GET",
          path: "/api/projects",
          description: "Get all projects for the authenticated user",
          access: "Authenticated",
          request: { headers: { Authorization: "Bearer <token>" } },
          response: {
            status: 200,
            body: {
              projects: [
                {
                  _id: "664f...",
                  name: "My Project",
                  description: "Project description",
                  owner: { _id: "664a...", name: "John Doe", email: "john@example.com" },
                  status: "active",
                  tags: ["procurement", "p2p"],
                },
              ],
            },
          },
        },
        {
          method: "POST",
          path: "/api/projects",
          description: "Create a new project",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
            body: {
              name: "New Project",
              description: "Project description",
              tags: ["tag1", "tag2"],
            },
          },
          response: {
            status: 201,
            body: { project: { _id: "664f...", name: "New Project", "...": "..." } },
          },
        },
        {
          method: "GET",
          path: "/api/projects/:id",
          description: "Get a single project by ID",
          access: "Authenticated",
          request: { headers: { Authorization: "Bearer <token>" } },
          response: {
            status: 200,
            body: { project: { _id: "664f...", name: "My Project", "...": "..." } },
          },
        },
        {
          method: "PUT",
          path: "/api/projects/:id",
          description: "Update a project",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
            body: { name: "Updated Name", description: "Updated description" },
          },
          response: {
            status: 200,
            body: { project: { _id: "664f...", name: "Updated Name", "...": "..." } },
          },
        },
        {
          method: "DELETE",
          path: "/api/projects/:id",
          description: "Archive a project (soft delete)",
          access: "Authenticated",
          request: { headers: { Authorization: "Bearer <token>" } },
          response: {
            status: 200,
            body: { message: "Project archived successfully" },
          },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT LOGS
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: "Event Logs",
      description: "Event log upload and management for process mining",
      endpoints: [
        {
          method: "POST",
          path: "/api/event-logs/upload",
          description: "Upload an event log file (XES, CSV, XLSX)",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
            body: "multipart/form-data with file field",
          },
          response: {
            status: 202,
            body: { message: "Upload received, processing started" },
          },
        },
        {
          method: "GET",
          path: "/api/event-logs/:id",
          description: "Get event log by ID",
          access: "Authenticated",
          request: { headers: { Authorization: "Bearer <token>" } },
          response: {
            status: 200,
            body: { message: "Get event log by id — TODO" },
          },
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MINING
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: "Mining",
      description: "Process mining operations",
      endpoints: [
        {
          method: "POST",
          path: "/api/mining/run",
          description: "Trigger a mining job (Alpha Miner / Inductive Miner)",
          access: "Authenticated",
          request: {
            headers: { Authorization: "Bearer <token>" },
            body: { eventLogId: "664g...", algorithm: "alpha" },
          },
          response: {
            status: 202,
            body: { message: "Mining job queued" },
          },
        },
        {
          method: "GET",
          path: "/api/mining/results/:eventLogId",
          description: "Get mining results for an event log",
          access: "Authenticated",
          request: { headers: { Authorization: "Bearer <token>" } },
          response: {
            status: 200,
            body: { message: "Get mining results — TODO" },
          },
        },
      ],
    },
  ],
};

// GET /api/docs — Return full API documentation as JSON
router.get("/", (req, res) => {
  res.json(apiDocumentation);
});

export default router;
export { apiDocumentation };
