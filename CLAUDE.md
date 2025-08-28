# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **partially-implemented project** for an AI-powered RAG (Retrieval-Augmented Generation) system with SEO assistant capabilities. The project setup and basic Next.js structure are complete (~20%), but core functionality remains to be implemented. Comprehensive specifications and development checklists exist in `Specs/`.

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
├── lib/                   # Core utilities (to be implemented)
│   ├── scraper.ts            # Cheerio-based web scraping
│   ├── chunking.ts           # Text segmentation logic
│   ├── vector-store.ts       # Neon database operations
│   └── db.ts                # Database client setup
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

### Web Scraping Strategy
- Cheerio for HTML parsing and content extraction
- Removes unwanted elements (script, style, nav, footer)
- Extracts clean text content and page titles
- Sentence-based chunking with ~1000 character limits

### API Design
- **POST /api/scrape**: Accepts `{url}`, returns `{document_id, chunks_created, success}`
- **POST /api/chat**: Uses AI SDK streaming with vector search tool calling

## Development Workflow

Based on `Specs/CHECKLIST.md`, the recommended implementation order is:
1. **Database Setup**: Create Neon database, enable pgvector, run schema
2. **Core Libraries**: Implement `lib/` functions (scraper, chunking, vector-store, db)
3. **API Endpoints**: Build scrape and chat routes with error handling  
4. **UI Components**: Create form and chat interface using AI SDK React hooks
5. **Type Definitions**: Add TypeScript interfaces and validation
6. **Testing**: Manual testing of full scrape → chat flow

## Current Implementation Status

From `Specs/CHECKLIST.md`:
- ✅ **Project Setup**: Complete (Next.js, dependencies, config)
- ✅ **Project Structure**: Complete (directories created)
- 🔄 **Landing Page**: Basic version (75% - needs component integration)
- ❌ **Database Setup**: Not started
- ❌ **Core Library Functions**: Not started  
- ❌ **API Endpoints**: Not started
- ❌ **UI Components**: Not started (except basic landing)
- ❌ **Type Definitions**: Not started

**Overall Progress: ~20% Complete**

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

1. **Vector Search**: Use cosine similarity (`<=>` operator) with pgvector
2. **Embedding Model**: OpenAI `text-embedding-ada-002` (1536 dimensions)
3. **Chunking Strategy**: Sentence-based splitting, max 1000 chars per chunk
4. **Error Handling**: Basic validation, no advanced error recovery
5. **Streaming**: AI SDK handles streaming for chat responses
6. **Database Connection**: Use Neon serverless for edge compatibility

## Next Steps

Start with database setup and core library implementation. Reference `Specs/SPECS.md` for detailed implementation examples and `Specs/CHECKLIST.md` for task tracking.