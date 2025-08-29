# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **complete SEO Assistant** with AI-powered chat capabilities and **comprehensive SEO analysis tools**. The system includes advanced SEO scoring, comparison, keyword analysis, actionable recommendations, and **AI tool calling for expert SEO guidance**. All core functionality, API endpoints, UI components, and **Phase 3 AI-powered chat enhancement** are implemented (~99% complete). Only testing, deployment, and documentation remain. Comprehensive specifications and development checklists exist in `Specs/`.

## Development Commands

The project is configured with standard Next.js commands:
```bash
npm run dev         # Development server (Next.js)
npm run build       # Production build
npm run start       # Production server
npm run lint        # ESLint linting
npm run type-check  # TypeScript type checking
```

## Architecture Overview

This is a **Next.js 14 application** using the Vercel AI SDK to create an SEO Assistant system that:
1. Scrapes web content using Cheerio with advanced SEO data extraction
2. Chunks and embeds content using OpenAI embeddings  
3. Stores vectors in Neon PostgreSQL with pgvector
4. **Provides AI-powered chat with SEO tool calling capabilities**
5. **Performs comprehensive SEO analysis with scoring and recommendations**

### Core Data Flow
- **Ingestion**: URL → Web Scraping (+ SEO Data) → Text Chunking → Embedding Generation → Vector Storage
- **SEO Analysis**: URL → Comprehensive Scraping → SEO Scoring → Recommendations Generation
- **AI Chat**: User Query → Tool Selection → SEO Analysis Execution → Expert Recommendations → Streaming Response
- **Tool Integration**: 6 SEO tools (analyzePage, checkKeywords, comparePages, generateSuggestions, auditHeadings, checkMetaTags)

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React 18, Tailwind CSS
- **Backend**: Vercel serverless functions
- **AI/LLM**: Vercel AI SDK with OpenAI provider
- **Database**: Neon PostgreSQL with pgvector extension
- **Web Scraping**: Cheerio for HTML parsing
- **Validation**: Zod for runtime type checking

## Project Structure

Current implementation follows this structure:
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main landing page (basic version complete)
│   ├── layout.tsx         # Root layout with metadata
│   ├── globals.css        # Global styles
│   ├── api/               # API routes (✅ IMPLEMENTED)
│   │   ├── scrape/route.ts    # Web scraping endpoint
│   │   ├── chat/route.ts      # AI chat with SEO tool calling
│   │   └── seo/               # SEO analysis endpoints
│   │       ├── analyze/route.ts    # Single page SEO analysis
│   │       ├── compare/route.ts    # Compare two pages
│   │       ├── keywords/route.ts   # Keyword analysis
│   │       └── suggestions/route.ts # SEO recommendations
├── components/            # React components (✅ IMPLEMENTED)
│   ├── scrape-form.tsx        # URL input form with validation, loading states, error handling
│   ├── chat-interface.tsx     # Chat UI with streaming responses and message styling
│   └── ui/                    # Reusable base components
│       ├── button.tsx         # Button with variants (primary, secondary, outline, ghost)
│       ├── input.tsx          # Styled input with error state support  
│       └── card.tsx           # Container components (Card, CardHeader, CardContent, etc.)
├── lib/                   # Core utilities (✅ IMPLEMENTED)
│   ├── scraper.ts            # Cheerio-based web scraping with robust error handling
│   ├── chunking.ts           # Advanced text segmentation with overlap support
│   ├── vector-store.ts       # Complete Neon database operations with vector search
│   ├── seo-analyzer.ts       # Comprehensive SEO analysis functions
│   ├── seo-scoring.ts        # SEO scoring algorithms and recommendations
│   ├── seo-tools.ts          # AI tool calling functions for SEO analysis
│   └── db.ts                # Database client setup with type definitions
```

## Database Schema

The system uses these main tables:
```sql
-- Store original scraped documents with SEO metadata
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title VARCHAR(512),
    content TEXT NOT NULL,
    meta_title VARCHAR(512),
    meta_description TEXT,
    canonical_url TEXT,
    og_title VARCHAR(512),
    og_description TEXT,
    schema_markup JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Store text chunks with vector embeddings
CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536),  -- OpenAI ada-002 embedding size
    created_at TIMESTAMP DEFAULT NOW()
);

-- Additional SEO-specific tables
CREATE TABLE meta_tags, headings, links, images; -- See database/migration-seo-schema.sql

-- Essential indexes for performance
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks (document_id);
```

Vector similarity search uses cosine distance with HNSW indexing for performance.

## Required Environment Variables

```bash
OPENAI_API_KEY=sk-...           # OpenAI API key for embeddings and chat
DATABASE_URL=postgresql://...   # Neon PostgreSQL connection string
```

## Key Implementation Patterns

### Chat Implementation (✅ IMPLEMENTED)
- Uses Vercel AI SDK's `streamText()` with GPT-4o model
- Basic chat functionality without RAG integration (simplified for MVP)
- Custom fetch-based streaming in ChatInterface component
- System prompt configured for general AI assistant behavior
- Comprehensive error handling and proper request validation

### Web Scraping Strategy (✅ IMPLEMENTED)
- Advanced Cheerio-based HTML parsing with robust error handling
- Removes unwanted elements (script, style, nav, footer, header, aside)
- Prioritizes article content over general body text
- Multiple fallback strategies for title extraction (title tag, h1, og:title)
- Comprehensive content cleaning and normalization

### API Design (✅ IMPLEMENTED)
- **POST /api/scrape**: Accepts `{url}`, returns `{document_id, chunks_created, success, title}` with comprehensive error handling
- **POST /api/chat**: Uses AI SDK streaming with GPT-4o model, accepts `{messages}` array, returns streaming text responses
- **POST /api/seo/analyze**: Comprehensive SEO analysis with scoring and recommendations
- **POST /api/seo/compare**: Compare SEO performance between two URLs
- **POST /api/seo/keywords**: Extract and analyze keywords from content
- **POST /api/seo/suggestions**: Generate actionable SEO improvement suggestions

### UI Component Architecture (✅ IMPLEMENTED)
- **Landing Page**: Professional card-based layout with integrated components, responsive design
- **ScrapeForm**: URL input validation, loading states with animations, success/error feedback, form reset
- **ChatInterface**: Custom fetch-based streaming, message styling, auto-scroll, loading indicators
- **UI Library**: Reusable components (Button with variants, Input with error states, Card containers)
- **TypeScript**: Full type safety with custom interfaces, 0 compilation errors

## Development Workflow

Based on `Specs/CHECKLIST.md`, the implementation order was:
1. ✅ **Database Setup**: Neon database, pgvector enabled, schema created
2. ✅ **Core Libraries**: All `lib/` functions implemented (scraper, chunking, vector-store, db)
3. ✅ **API Endpoints**: Scrape and chat routes with comprehensive error handling  
4. ✅ **UI Components**: Complete form and chat interface with custom streaming implementation
5. ✅ **Type Definitions**: Full TypeScript interfaces throughout
6. **Remaining**: Manual testing of full scrape → chat flow, deployment configuration

### Database Setup Instructions
The database is already configured. See `database/setup.md` for connection details. Schema includes:
- `documents` table for scraped content with SEO metadata
- `document_chunks` table with vector embeddings (VECTOR(1536))
- `meta_tags`, `headings`, `links`, `images` tables for detailed SEO analysis
- HNSW indexes for efficient similarity search
- Run `database/migration-seo-schema.sql` to add SEO functionality to existing databases

## Current Implementation Status

Based on actual codebase analysis - **Project is ~99% Complete**:
- ✅ **Project Setup**: Complete (Next.js 14, dependencies, TypeScript, ESLint)
- ✅ **Project Structure**: Complete (organized directory structure)
- ✅ **Landing Page**: Complete (professional card-based design with integrated components)
- ✅ **Database Setup**: Complete (schema created, pgvector enabled, indexes configured)
- ✅ **Core Library Functions**: Complete (scraper, chunking, vector-store, db with comprehensive types)
- ✅ **API Endpoints**: Complete (scrape, chat with AI tool calling, and comprehensive SEO analysis routes)
- ✅ **UI Components**: Complete (ScrapeForm, ChatInterface, and reusable UI library)
- ✅ **Type Definitions**: Complete (comprehensive TypeScript throughout, 0 compilation errors)
- ✅ **Phase 3 AI Enhancement**: Complete (AI tool calling with 6 SEO analysis tools, expert system prompt)

**Remaining Work**: Testing, deployment configuration, documentation updates

## MVP Limitations

This is intentionally scoped as an MVP without:
- Authentication system
- Advanced error handling beyond basics
- Rate limiting
- Advanced competitive analysis features
- Multiple document format support
- Content caching mechanisms
- Performance optimizations
- Comprehensive testing suite

## Dependencies Overview

Key dependencies already installed:
- `@ai-sdk/openai` & `@ai-sdk/react`: Vercel AI SDK for LLM integration
- `@neondatabase/serverless`: Neon database client
- `cheerio`: Server-side HTML parsing
- `zod`: Runtime type validation
- `next`, `react`, `react-dom`: Core framework
- `tailwindcss`: Styling framework

## Critical Implementation Notes

1. **Vector Search**: Use cosine similarity (`<=>` operator) with pgvector - **IMPLEMENTED**
2. **Embedding Model**: OpenAI `text-embedding-ada-002` (1536 dimensions) - **IMPLEMENTED** 
3. **Chunking Strategy**: Advanced sentence-based splitting with overlap support - **IMPLEMENTED**
4. **Error Handling**: Comprehensive error handling implemented in all core functions
5. **Streaming**: AI SDK handles streaming for chat responses
6. **Database Connection**: Neon serverless client fully configured - **IMPLEMENTED**
7. **Text Processing**: Smart content prioritization and multiple extraction strategies

## Next Steps

All core development and **Phase 3 AI-powered chat enhancement** are complete. Remaining priorities are:
1. **Testing**: Manual testing of SEO tool calling and expert chat functionality
2. **Deployment**: Configure Vercel deployment with environment variables  
3. **Documentation**: Update README with proper project description and setup instructions
4. **Optional Phase 4**: Enhanced UI components for SEO dashboards and visualizations

The system now provides **expert-level SEO analysis through AI chat** with 6 specialized tools. Reference `Specs/SPECS.md` for detailed implementation examples and `Specs/CHECKLIST.md` for progress tracking.

## Core Library Functions Status

All core functions are fully implemented and ready to use:

### scraper.ts
- `scrapeWebsite(url)`: Complete with robust error handling, content prioritization
- Handles various website structures with multiple fallback strategies

### chunking.ts  
- `chunkContent(text, options)`: Advanced chunking with overlap support
- `chunkContentByTokens()`: Token-based chunking helper
- `estimateTokens()`: Token estimation utility

### vector-store.ts
- `storeDocument()`: Stores documents with vector embeddings
- `vectorSearch()`: Cosine similarity search with configurable threshold
- `getDocumentById()`, `getAllDocuments()`, `deleteDocument()`: CRUD operations
- `testVectorStore()`: Testing utility for debugging

### seo-analyzer.ts
- `performSEOAnalysis()`: Comprehensive SEO analysis including title, meta, headings, keywords, links, images, technical SEO
- `compareSEOAnalysis()`: Side-by-side comparison of two pages
- Individual analysis functions for each SEO category with scoring

### seo-scoring.ts
- `calculateSEOScore()`: Advanced scoring algorithm with weighted categories
- `getScoreInterpretation()`: Score interpretation and priority recommendations
- `getCategoryInsights()`: Detailed insights for each SEO category

### seo-tools.ts ✅ NEW IN PHASE 3
- `analyzePage()`: AI tool for comprehensive SEO analysis with scoring
- `checkKeywords()`: AI tool for keyword density and target keyword analysis
- `comparePages()`: AI tool for side-by-side SEO comparison
- `generateSuggestions()`: AI tool for prioritized SEO recommendations
- `auditHeadings()`: AI tool for heading structure analysis
- `checkMetaTags()`: AI tool for meta tag optimization validation
- All tools integrated with AI SDK for chat-based SEO expertise

### db.ts
- Database client with type definitions for `Document` and `DocumentChunk`
- Proper environment variable validation

## Working with This Codebase

### Code Quality Standards
- All TypeScript compilation must pass (`npm run type-check`)
- All ESLint rules must pass (`npm run lint`) 
- Components use comprehensive error handling and loading states
- Responsive design is required (mobile + desktop)

### AI SDK Implementation Notes
- Chat interface uses custom fetch implementation instead of `useChat` hook for better control
- Streaming responses handled with AI SDK's built-in `streamText()` and `toTextStreamResponse()`  
- **Phase 3 Complete**: AI tool calling integrated with 6 SEO analysis tools for expert guidance
- Tools use proper `inputSchema` with Zod validation and return comprehensive analysis data
- SEO specialist system prompt provides expert knowledge and actionable recommendations

### Database Operations
- All vector operations use cosine similarity (`<=>` operator)
- Embeddings are stored as VECTOR(1536) for OpenAI ada-002 model
- HNSW indexing is configured for performance