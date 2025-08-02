# FridgeWise - Smart Kitchen Inventory Management

## Overview

FridgeWise is a modern web application that helps users manage their kitchen inventory and discover recipes based on available ingredients. The application features AI-powered recipe suggestions, expiration tracking, and cooking history management to reduce food waste and enhance meal planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript for type safety and developer experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API architecture with proper HTTP status codes and error handling
- **Request Processing**: JSON and URL-encoded body parsing with request/response logging middleware
- **Development**: Hot module replacement via Vite middleware integration

### Data Storage Solutions

- **Database**: PostgreSQL with Neon serverless driver for scalable cloud database
- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Connection**: Connection pooling for efficient database resource utilization

### Schema Design

- **Ingredients**: Core inventory items with categories, quantities, and expiration tracking
- **Recipes**: AI-generated recipe suggestions with difficulty levels, cooking instructions, and AI-generated images
- **Recipe Ingredients**: Many-to-many relationship between recipes and required ingredients
- **Cooking History**: Track user cooking activity and ingredient usage patterns

### AI Features

- **Recipe Generation**: GPT-4o powered recipe suggestions based on available ingredients
- **Image Generation**: Google Gemini 2.0 Flash integration for creating professional food photography of suggested dishes
- **Smart Matching**: Intelligent ingredient matching with availability checking and waste reduction suggestions

### Authentication and Authorization

- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Azure AD Integration**: ClientSecretCredential for secure Azure OpenAI API access
- **Security**: Environment-based configuration for sensitive credentials with Azure Key Vault integration

## External Dependencies

### Third-Party Services

- **Azure OpenAI**: GPT-4o integration via Azure AD authentication for intelligent recipe generation based on available ingredients
- **Google Gemini**: AI image generation for creating appetizing dish photos using the same recipe context
- **Azure Active Directory**: Authentication service for secure access to Azure OpenAI resources
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections

### UI and Styling Libraries

- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Modern icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting utilities

### Development and Build Tools

- **Vite**: Fast build tool with HMR and optimized bundling
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
-

### Form Handling and Validation

- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation with Drizzle integration
- **Hookform Resolvers**: Seamless integration between React Hook Form and Zod

The application follows a full-stack TypeScript approach with shared type definitions, ensuring type safety across the entire codebase while leveraging modern web development practices for optimal performance and developer experience.
