# Alzawaj Project Coding Guidelines and Best Practices

## Table of Contents

1. [General Principles](#general-principles)
2. [Project Structure](#project-structure)
3. [TypeScript Standards](#typescript-standards)
4. [Backend Development Guidelines](#backend-development-guidelines)
5. [Frontend Development Guidelines](#frontend-development-guidelines)
6. [Code Formatting and Style](#code-formatting-and-style)
7. [Testing Standards](#testing-standards)
8. [Git Workflow](#git-workflow)
9. [Security Best Practices](#security-best-practices)
10. [Documentation Standards](#documentation-standards)
11. [Performance Considerations](#performance-considerations)
12. [Internationalization (i18n)](#internationalization-i18n)

## General Principles

### 1. Islamic Values and Cultural Sensitivity

- Respect Islamic principles in all code and content
- Ensure privacy and modesty in user interactions
- Avoid content or functionality that contradicts Islamic teachings
- Implement proper gender segregation where appropriate

### 2. Code Quality

- Write clean, maintainable, and self-documenting code
- Follow the DRY (Don't Repeat Yourself) principle
- Keep functions small and focused on single responsibilities
- Use meaningful names for variables, functions, and components

### 3. Consistency

- Follow existing code patterns and conventions
- Maintain consistency across the entire codebase
- When in doubt, follow the prevalent style in the specific module

## Project Structure

### Backend Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # Business logic
├── middleware/      # Express middleware
├── validation/      # Input validation
├── utils/           # Utility functions
├── types/           # TypeScript types
└── tests/           # Test files
```

### Frontend Structure

```
app/                 # Next.js app router
├── auth/            # Authentication pages
├── dashboard/       # User dashboard
├── profile/         # User profiles
├── admin/           # Admin interface
└── [other routes]/

components/          # Reusable UI components
lib/                 # Library functions
providers/           # React context providers
public/              # Static assets
```

## TypeScript Standards

### Type Safety

- Use TypeScript interfaces and types for all data structures
- Avoid using `any` type - use proper type definitions
- Use generics when appropriate for reusable components
- Define custom types for complex data structures

### Type Definitions

```typescript
// Good: Specific type definition
interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  religiousPreferences: ReligiousPreferences;
  privacySettings: PrivacySettings;
}

// Bad: Using any
const user: any = getUser();
```

## Backend Development Guidelines

### API Design

- Follow RESTful principles for API endpoints
- Use consistent naming conventions (`/users`, `/users/:id`)
- Implement proper HTTP methods (GET, POST, PUT, DELETE)
- Use query parameters for filtering and pagination

### Error Handling

- Implement comprehensive error handling
- Use appropriate HTTP status codes
- Provide meaningful error messages (without exposing sensitive data)
- Log errors for debugging and monitoring

### Database Operations

- Use Mongoose for MongoDB operations
- Implement proper data validation at both API and database levels
- Use transactions for critical operations
- Implement proper indexing for performance

### Security

- Always validate and sanitize user input
- Use parameterized queries to prevent injection attacks
- Implement proper authentication and authorization
- Use rate limiting to prevent abuse

## Frontend Development Guidelines

### Component Structure

- Use functional components with React Hooks
- Keep components small and focused
- Use TypeScript interfaces for component props
- Implement proper error boundaries

### State Management

- Use React Query for server state management
- Use React context for global state when appropriate
- Avoid prop drilling - use composition or context
- Implement proper state initialization and cleanup

### Styling

- Use Tailwind CSS for utility-first styling
- Follow the existing design system and color palette
- Implement responsive design principles
- Ensure RTL (Right-to-Left) support for Arabic

### Forms and Validation

- Use React Hook Form for form management
- Implement Zod for form validation
- Provide clear error messages for form validation
- Implement proper form submission handling

## Code Formatting and Style

### Formatting Rules

- Use Prettier for consistent code formatting
- 2-space indentation
- Single quotes for strings
- Semicolons at the end of statements
- Consistent brace style

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Use UPPER_CASE for constants
- Use meaningful, descriptive names

### File Organization

- Keep files focused on single responsibilities
- Use clear and consistent file naming
- Group related files in appropriate directories
- Keep file sizes manageable

## Testing Standards

### Testing Approach

- Write unit tests for individual functions and components
- Write integration tests for API endpoints and component interactions
- Write end-to-end tests for critical user flows
- Aim for high test coverage (80%+)

### Testing Tools

- **Backend**: Jest with Supertest
- **Frontend**: Jest, React Testing Library, Playwright
- **E2E**: Playwright

### Test Structure

```typescript
describe("User Service", () => {
  beforeEach(() => {
    // Setup test data
  });

  it("should create a new user", async () => {
    // Test implementation
  });

  it("should validate user input", async () => {
    // Test validation
  });
});
```

## Git Workflow

### Branching Strategy

- Use feature branches for new development (`feature/[feature-name]`)
- Use bugfix branches for fixes (`bugfix/[issue-description]`)
- Use main branch for production-ready code
- Use develop branch for integration

### Commit Messages

- Use clear, descriptive commit messages
- Follow conventional commits format when possible
- Reference issue numbers when applicable
- Keep commits focused on single changes

### Pull Request Process

- Create PRs from feature branches to develop
- Include clear description of changes
- Reference related issues
- Request reviews from team members
- Address all review comments before merging

## Security Best Practices

### Authentication

- Always use JWT for authentication
- Implement proper token expiration and refresh
- Store tokens securely
- Implement proper session management

### Data Protection

- Never store sensitive data in plain text
- Use proper encryption for sensitive data
- Implement proper access controls
- Follow principle of least privilege

### Input Validation

- Validate all user input on both client and server
- Sanitize input to prevent XSS and injection attacks
- Use proper data types and validation libraries
- Implement proper error handling

## Documentation Standards

### Code Documentation

- Use JSDoc comments for functions and classes
- Document complex logic and algorithms
- Keep documentation up to date
- Use clear and concise language

### API Documentation

- Use Swagger/OpenAPI for API documentation
- Keep API documentation current
- Include examples where helpful
- Document all endpoints and parameters

### Project Documentation

- Keep README files up to date
- Document setup and configuration
- Include deployment instructions
- Document architectural decisions

## Performance Considerations

### Backend Performance

- Implement proper database indexing
- Use caching where appropriate (Redis)
- Optimize database queries
- Implement proper pagination

### Frontend Performance

- Use code splitting and lazy loading
- Optimize images and assets
- Implement proper caching strategies
- Minimize re-renders in React components

### General Performance

- Monitor and optimize API response times
- Implement proper error handling to prevent crashes
- Use efficient algorithms and data structures
- Profile and optimize performance bottlenecks

## Internationalization (i18n)

### Language Support

- Primary support for Arabic (RTL)
- Secondary support for English (LTR)
- Ensure proper RTL layout support
- Use appropriate date and number formatting

### Cultural Considerations

- Respect Islamic cultural norms
- Implement proper gender segregation where needed
- Use appropriate imagery and content
- Follow Islamic guidelines for user interactions

## Getting Started Checklist

1. **Setup Development Environment**

   - Install Node.js (v20+ for backend, v18+ for frontend)
   - Install PNPM for package management
   - Set up MongoDB database
   - Configure Redis for session management

2. **Install Dependencies**

   ```bash
   # Backend
   cd alzawaj-project-backend
   pnpm install

   # Frontend
   cd ../alzawaj-project-frontend
   pnpm install
   ```

3. **Configure Environment**

   - Copy environment template files
   - Set up proper environment variables
   - Configure database connections

4. **Run Development Servers**

   ```bash
   # Backend (in one terminal)
   cd alzawaj-project-backend
   pnpm run dev

   # Frontend (in another terminal)
   cd alzawaj-project-frontend
   pnpm run dev
   ```

5. **Follow Coding Standards**

   - Run ESLint for code quality checks
   - Use Prettier for consistent formatting
   - Follow TypeScript best practices
   - Write comprehensive tests

6. **Submit Changes**
   - Create feature branch
   - Write clear commit messages
   - Create pull request
   - Address review feedback

By following these guidelines, you'll contribute effectively to the Alzawaj project while maintaining code quality, security, and consistency throughout the codebase.
