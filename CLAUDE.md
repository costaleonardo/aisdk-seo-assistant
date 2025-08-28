# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **partially-implemented project** for an AI-powered RAG (Retrieval-Augmented Generation) system with SEO assistant capabilities. The project setup, database schema, basic Next.js structure, and **all core library functions are complete (~65%)**. The main remaining work is API endpoints and UI components. Comprehensive specifications and development checklists exist in `Specs/`.

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

This is a **Next.js 14 application** using the Vercel AI SDK to create a RAG system that:
1. Scrapes web content using Cheerio
2. Chunks and embeds content using OpenAI embeddings  
3. Stores vectors in Neon PostgreSQL with pgvector
4. Provides a chat interface with contextual retrieval

### Core Data Flow
- **Ingestion**: URL → Web Scraping → Text Chunking → Embedding Generation → Vector Storage
- **Retrieval**: User Query → Query Embedding → Vector Similarity Search → Context Retrieval
- **Generation**: Retrieved Context + User Query → OpenAI GPT-4 → Streaming Response

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
│   ├── api/               # API routes (to be implemented)
│   │   ├── scrape/route.ts    # Web scraping endpoint
│   │   └── chat/route.ts      # RAG chat endpoint
├── components/            # React components (to be implemented)
│   ├── scrape-form.tsx        # URL input and processing
│   ├── chat-interface.tsx     # Chat UI using useChat hook
│   └── ui/                    # Base components (button, input, card)
├── lib/                   # Core utilities (✅ IMPLEMENTED)
│   ├── scraper.ts            # Cheerio-based web scraping with robust error handling
│   ├── chunking.ts           # Advanced text segmentation with overlap support
│   ├── vector-store.ts       # Complete Neon database operations with vector search
│   └── db.ts                # Database client setup with type definitions
└── types/                 # TypeScript definitions (to be implemented)
    └── index.ts              # Type definitions
```

## Database Schema

The system requires two main tables:
```sql
-- Store original scraped documents
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title VARCHAR(512),
    content TEXT NOT NULL,
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

### RAG Implementation
- Uses Vercel AI SDK's `streamText()` with tool calling
- Implements `searchKnowledge` tool for vector similarity search
- Vector search threshold set to 0.7 similarity for relevance filtering
- Streaming responses for real-time chat experience

### Web Scraping Strategy (✅ IMPLEMENTED)
- Advanced Cheerio-based HTML parsing with robust error handling
- Removes unwanted elements (script, style, nav, footer, header, aside)
- Prioritizes article content over general body text
- Multiple fallback strategies for title extraction (title tag, h1, og:title)
- Comprehensive content cleaning and normalization

### API Design
- **POST /api/scrape**: Accepts `{url}`, returns `{document_id, chunks_created, success}`
- **POST /api/chat**: Uses AI SDK streaming with vector search tool calling

## Development Workflow

Based on `Specs/CHECKLIST.md`, the recommended implementation order is:
1. ✅ **Database Setup**: Create Neon database, enable pgvector, run schema
2. ✅ **Core Libraries**: All `lib/` functions implemented (scraper, chunking, vector-store, db)
3. **API Endpoints**: Build scrape and chat routes with error handling  
4. **UI Components**: Create form and chat interface using AI SDK React hooks
5. **Type Definitions**: TypeScript interfaces (partially complete - integrated in lib files)
6. **Testing**: Manual testing of full scrape → chat flow

### Database Setup Instructions
The database is already configured. See `database/setup.md` for connection details. Schema includes:
- `documents` table for scraped content
- `document_chunks` table with vector embeddings (VECTOR(1536))
- HNSW indexes for efficient similarity search

## Current Implementation Status

Updated based on actual codebase analysis:
- ✅ **Project Setup**: Complete (Next.js, dependencies, config)
- ✅ **Project Structure**: Complete (directories created)
- 🔄 **Landing Page**: Basic version (75% - needs component integration)
- ✅ **Database Setup**: Complete (schema created, pgvector enabled)
- ✅ **Core Library Functions**: All complete (scraper, chunking, vector-store, db with full type definitions)
- ❌ **API Endpoints**: Not started
- ❌ **UI Components**: Not started (except basic landing)
- 🔄 **Type Definitions**: Partially complete (comprehensive types in lib files)

**Overall Progress: ~65% Complete**

## MVP Limitations

This is intentionally scoped as an MVP without:
- Authentication system
- Advanced error handling beyond basics
- Rate limiting
- SEO analysis features (despite repo name)
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

The core foundation is complete. Next priorities are:
1. **API Endpoints**: Implement `/api/scrape` and `/api/chat` routes using completed lib functions
2. **UI Components**: Build `ScrapeForm` and `ChatInterface` components using Vercel AI SDK React hooks  
3. **Integration**: Connect components to landing page for full user flow
4. **Testing**: Manual testing of complete scrape → chat workflow

Reference `Specs/SPECS.md` for detailed implementation examples and `Specs/CHECKLIST.md` for task tracking.

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

### db.ts
- Database client with type definitions for `Document` and `DocumentChunk`
- Proper environment variable validation