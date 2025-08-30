# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **complete SEO Assistant** with AI-powered chat capabilities and comprehensive SEO analysis tools. The system includes advanced SEO scoring, comparison, keyword analysis, actionable recommendations, and AI tool calling for expert SEO guidance. All core functionality is implemented (~99% complete).

## Development Commands

```bash
npm run dev         # Development server (port 3000)
npm run build       # Production build
npm run start       # Production server
npm run lint        # ESLint linting
npm run type-check  # TypeScript type checking
```

**Important**: Always run both `npm run lint` and `npm run type-check` before committing changes to ensure code quality.

## Architecture Overview

This is a **Next.js 14 application** using the Vercel AI SDK that:
1. Scrapes web content using Cheerio with SEO data extraction
2. Chunks and embeds content using OpenAI embeddings (text-embedding-ada-002, 1536 dimensions)
3. Stores vectors in Neon PostgreSQL with pgvector extension
4. Provides AI-powered chat with SEO tool calling capabilities
5. Performs comprehensive SEO analysis with scoring and recommendations

### Core Data Flow
- **Ingestion**: URL → Web Scraping (+ SEO Data) → Text Chunking → Embedding Generation → Vector Storage
- **SEO Analysis**: URL → Comprehensive Scraping → SEO Scoring → Recommendations Generation
- **AI Chat**: User Query → Tool Selection → SEO Analysis Execution → Expert Recommendations → Streaming Response
- **Tool Integration**: 6 SEO tools accessible via AI chat

## Required Environment Variables

```bash
OPENAI_API_KEY=sk-...           # OpenAI API key for embeddings and chat
DATABASE_URL=postgresql://...   # Neon PostgreSQL connection string
```

## Database Schema

The system uses PostgreSQL with pgvector extension:

**Core Tables**:
- `documents` table: Stores scraped content with SEO metadata and content quality metrics
- `document_chunks` table: Stores text chunks with vector embeddings (VECTOR(1536))

**SEO Analysis Tables**:
- `meta_tags` table: All meta tags from scraped pages
- `headings` table: H1-H6 heading hierarchy with order
- `links` table: Internal/external links with anchor text
- `images` table: Image metadata with alt text and dimensions

**Indexes**: HNSW indexes for efficient cosine similarity search

**Setup**: 
1. Run `database/schema.sql` for base schema
2. Run `database/migration-seo-schema.sql` to add SEO functionality  
3. Run `database/migration-content-quality-metrics.sql` for content analysis

## Key Implementation Patterns

### Multi-Step AI Tool Calling
The chat system implements sophisticated AI tool orchestration:
- Uses `stepCountIs(5)` to enable multi-step tool calls
- GPT-4o model with expert SEO system prompt tailored for Concentrix
- **Tools Available**: `getHomepage`, `searchContent` (vector search), `analyzePage` (SEO analysis), `listPages` (discovery), `analyzeContentQuality`, `checkReadability`, `analyzeContentDepth`
- `onStepFinish` callback for debugging tool execution
- **Critical**: Homepage queries must use `getHomepage` tool, not `searchContent`

### Web Scraping Strategy
- Cheerio-based HTML parsing with robust error handling
- Removes unwanted elements (script, style, nav, footer, header, aside)
- Multiple fallback strategies for title extraction
- Comprehensive content cleaning and normalization

### API Endpoints
- **POST /api/scrape**: Scrapes URL and stores embeddings with SEO metadata
- **POST /api/chat**: Multi-step AI tool calling with streaming responses  
- **POST /api/seo/analyze**: Comprehensive SEO analysis with scoring
- **POST /api/seo/compare**: Compare SEO performance between two URLs
- **POST /api/seo/keywords**: Extract and analyze keyword density
- **POST /api/seo/suggestions**: Generate prioritized actionable recommendations

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # AI chat with tool calling
│   │   ├── scrape/route.ts    # Web scraping endpoint
│   │   └── seo/               # SEO analysis endpoints
│   ├── page.tsx               # Landing page with sidebar navigation
│   ├── scraper/page.tsx       # Scraper interface
│   └── seo-analysis/page.tsx  # SEO analysis dashboard
├── components/
│   ├── chat-interface.tsx     # Chat UI with streaming
│   ├── scrape-form.tsx        # URL input form
│   ├── sidebar.tsx            # Navigation sidebar
│   ├── main-layout.tsx        # Layout wrapper
│   ├── seo/                   # SEO UI components
│   └── ui/                    # Reusable base components
└── lib/
    ├── scraper.ts             # Web scraping logic
    ├── chunking.ts            # Text segmentation
    ├── vector-store.ts        # Vector database operations
    ├── seo-analyzer.ts        # SEO analysis functions
    ├── seo-scoring.ts         # Scoring algorithms
    ├── seo-tools.ts           # AI tool implementations
    └── db.ts                  # Database client

```

## Working with This Codebase

### Code Quality Standards
- TypeScript compilation must pass (`npm run type-check`)
- ESLint rules must pass (`npm run lint`)
- Components use comprehensive error handling and loading states
- Responsive design required (mobile + desktop)

### AI SDK Implementation
- Multi-step tool calling with `stepCountIs(5)` 
- Streaming responses with `streamText()` and `toTextStreamResponse()`
- Tools use Zod validation for type safety
- Expert SEO system prompt for Concentrix website analysis
- **Important**: All tools return structured data with success/error handling

### Database Operations
- Vector operations use cosine similarity (`<=>` operator)
- HNSW indexing for performance
- Cascade deletion configured for data integrity

## Current Implementation Status

**~99% Complete**:
- ✅ Database setup with pgvector
- ✅ Core library functions (scraper, chunking, vector-store)
- ✅ API endpoints with error handling
- ✅ UI components with streaming support
- ✅ Multi-step AI tool calling
- ✅ SEO analysis and scoring
- ✅ Sidebar navigation and page routing

**Remaining**: Testing, deployment configuration

## Content Quality Analysis Features

The system includes advanced content analysis capabilities beyond basic SEO:

**Metrics Tracked**:
- Word count, sentence count, paragraph count
- Average sentence length and words per paragraph  
- Flesch Reading Ease scores (0-100, higher = easier to read)
- Content depth scores (0-100, based on comprehensiveness)
- Topic keyword extraction and semantic keyword identification
- Content type classification (informational, commercial, navigational, mixed)
- Reading time estimation and target audience identification

**Analysis Functions** (`src/lib/seo-tools.ts`):
- `analyzeContentQuality()`: Complete content metrics analysis
- `checkReadability()`: Readability and target audience analysis
- `analyzeContentDepth()`: Topic coverage and semantic richness
- `compareContentQuality()`: Content quality comparison between URLs

## Database Migration Sequence

When setting up the database, run migrations in this order:
1. `database/schema.sql` - Base schema with documents and document_chunks
2. `database/migration-seo-schema.sql` - SEO metadata tables (meta_tags, headings, links, images)  
3. `database/migration-content-quality-metrics.sql` - Content analysis metrics columns

## AI Chat System Architecture

The chat system at `/api/chat/route.ts` implements a sophisticated tool calling pattern:
- **Model**: GPT-4o with specialized SEO prompt for Concentrix
- **Tools**: 7 specialized tools for different SEO analysis tasks
- **Homepage Handling**: Special logic to prioritize homepage in search results
- **Streaming**: Real-time response streaming with step-by-step tool execution
- **Error Handling**: Comprehensive error handling for each tool