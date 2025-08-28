# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **specification-only project** for an AI-powered RAG (Retrieval-Augmented Generation) system with SEO assistant capabilities. The actual implementation has not yet begun - only comprehensive specifications and development checklists exist.

## Architecture Overview

This is planned as a **Next.js 14 application** using the Vercel AI SDK to create a RAG system that:
1. Scrapes web content using Cheerio
2. Chunks and embeds content using OpenAI embeddings
3. Stores vectors in Neon PostgreSQL with pgvector
4. Provides a chat interface with contextual retrieval

### Core Data Flow
- **Ingestion**: URL → Web Scraping → Text Chunking → Embedding Generation → Vector Storage
- **Retrieval**: User Query → Query Embedding → Vector Similarity Search → Context Retrieval
- **Generation**: Retrieved Context + User Query → OpenAI GPT-4 → Streaming Response

### Key Technical Components
- **Database**: Neon PostgreSQL with pgvector extension for vector similarity search
- **AI Layer**: Vercel AI SDK with OpenAI provider for both embeddings and chat completion
- **Vector Search**: Custom similarity search using cosine distance with HNSW indexing
- **Chunking Strategy**: Sentence-based chunking with ~1000 character limits

## Project Structure (Planned)

Based on specifications in `Specs/SPECS.md`:

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main landing page with dual interface
│   ├── api/
│   │   ├── scrape/route.ts    # Web scraping endpoint
│   │   └── chat/route.ts      # RAG chat endpoint
├── components/
│   ├── scrape-form.tsx        # URL input and processing
│   ├── chat-interface.tsx     # Chat UI using useChat hook
│   └── ui/                    # Base components
├── lib/
│   ├── scraper.ts            # Cheerio-based web scraping
│   ├── chunking.ts           # Text segmentation logic
│   ├── vector-store.ts       # Neon database operations
│   └── db.ts                # Database client setup
└── types/
    └── index.ts              # TypeScript definitions
```

## Database Schema

The system uses two main tables:
- `documents`: Stores original scraped content
- `document_chunks`: Stores text chunks with vector embeddings (VECTOR(1536) for OpenAI embeddings)

Vector similarity search uses a custom RPC function `match_documents()` with cosine distance.

## Required Environment Variables

```bash
OPENAI_API_KEY=sk-...           # OpenAI API key
DATABASE_URL=postgresql://...   # Neon PostgreSQL connection string
```

## Development Commands (To Be Implemented)

Since this is a Next.js project, standard commands will be:
```bash
npm run dev         # Development server
npm run build       # Production build
npm run start       # Production server
npm run lint        # ESLint
npm run type-check  # TypeScript checking
```

## Key Implementation Notes

### RAG Implementation Pattern
- Uses Vercel AI SDK's tool calling feature for `searchKnowledge` tool
- Implements streaming responses for real-time chat experience
- Vector search threshold set to 0.7 similarity for relevance filtering

### MVP Limitations
This is intentionally scoped as an MVP without:
- Authentication system
- Advanced error handling
- Rate limiting
- SEO analysis features (despite the repo name)
- Multiple document format support
- Caching mechanisms

### API Design
- **POST /api/scrape**: Accepts `{url}` and returns `{document_id, chunks_created, success}`
- **POST /api/chat**: Uses Vercel AI SDK streaming with tool calling for context retrieval

## Development Workflow

1. **Database Setup**: Create Neon database, enable pgvector, run schema from specs
2. **Core Libraries First**: Implement `lib/` functions (scraper, chunking, vector-store)
3. **API Endpoints**: Build scrape and chat routes with proper error handling
4. **UI Components**: Create form and chat interface using AI SDK React hooks
5. **Integration Testing**: Test full flow from URL scraping to contextual chat responses

## Next Steps

The `CHECKLIST.md` file contains a comprehensive task breakdown. Start with project initialization and database setup before implementing core functionality.