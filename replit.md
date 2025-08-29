# GreenLoop Yield (GLY) - Carbon Credit Platform

## Overview

GreenLoop Yield is a Web3 carbon credit marketplace platform focused on Africa's carbon market. The application provides a proof-first approach to carbon credits with parcel-backed verification, forward deals with escrow functionality, and comprehensive tracking through the Hedera blockchain ecosystem. The platform consists of a server-side rendered landing page and a single-page application dashboard for marketplace operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in a Vite-powered development environment
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom eco-green color scheme and dark mode support
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Design System**: Component-based architecture with consistent theming across landing and dashboard

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API structure with health check and placeholder endpoints
- **Development**: Hot reload with Vite middleware integration
- **Storage**: In-memory storage with interface for future database integration
- **Error Handling**: Centralized error middleware with structured responses

### Application Structure
- **Landing Page**: Server-side rendered marketing page with hero section, problem/solution narrative, and call-to-action flows
- **Dashboard**: Single-page application with tabbed interface including Marketplace, Orders, Project Sheets, Proof Feed, and Claims Helper
- **Shared Components**: Reusable UI components and utilities shared between landing and dashboard

### Database Schema Design
- **Carbon Lots**: Core entity storing project details, pricing, delivery windows, and proof metadata
- **Orders**: Transaction records with escrow, delivery, and payout tracking
- **Proof Entries**: Audit trail for verification data with blockchain anchoring support
- **User Management**: Basic user schema with extensible authentication framework

### Blockchain Integration Strategy
- **Hedera Services**: Mock implementations for HTS (tokens), HCS (consensus), and HFS (file storage)
- **Wallet Integration**: HashConnect wallet connector with connection state management
- **Transaction Flow**: Proof-first architecture where every user action generates verifiable blockchain evidence
- **Verification**: Hashscan integration for transaction and proof verification

## External Dependencies

### Core Dependencies
- **Database**: Drizzle ORM configured for PostgreSQL with Neon Database support
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Development Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Styling**: Tailwind CSS with PostCSS processing

### Blockchain Services
- **Hedera Network**: Native integration with HTS, HCS, and HFS services
- **Wallet**: HashConnect for Hedera wallet connectivity
- **Verification**: Hashscan and Mirror Node for transaction verification

### Development Infrastructure
- **Replit Integration**: Custom plugins for error handling and development environment
- **Font Loading**: Google Fonts integration for Inter and JetBrains Mono
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Future Integration Points
- **Payment Processing**: Escrow and payment handling for carbon credit transactions
- **Satellite Data**: NDVI and remote sensing data for carbon project verification
- **PDF Generation**: Contract and certificate generation capabilities
- **Email Services**: Notification and communication workflows