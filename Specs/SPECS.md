# RAG Agent MVP Technical Specifications

## Core MVP Architecture

The MVP focuses on three essential components:
1. **Simple Web Scraping**: Basic URL content extraction
2. **Vector Storage**: Text embedding and similarity search  
3. **RAG Chat**: Query with retrieved context

```typescript
// Simplified system architecture
class RAGSystemMVP {
  constructor() {
    this.scraper = new BasicScraper();
    this.vectorStore = new SimpleVectorStore();
    this.embeddings = new OpenAIEmbeddings();
    this.chat = new RAGChat();
  }
}
```

## Technology Stack (Minimal)

- **Frontend**: Next.js 14 with App Router
- **Backend**: Vercel serverless functions
- **AI/LLM**: Vercel AI SDK with OpenAI
- **Database**: Neon (PostgreSQL + pgvector)
- **Web Scraping**: Simple Cheerio-based extraction
- **Authentication**: None (public demo)

## Database Schema (MVP)

```sql
-- Simplified tables for MVP
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title VARCHAR(512),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Essential indexes only
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks (document_id);
```

## API Endpoints (MVP)

### 1. Scrape Endpoint
```typescript
// app/api/scrape/route.ts
export async function POST(req: Request) {
  const { url } = await req.json();
  
  // Basic scraping with Cheerio
  const content = await scrapeWebsite(url);
  const chunks = chunkContent(content.text);
  const embeddings = await generateEmbeddings(chunks);
  
  // Store in database
  const document = await storeDocument(content, embeddings);
  
  return NextResponse.json({
    document_id: document.id,
    chunks_created: chunks.length,
    success: true
  });
}
```

### 2. Chat Endpoint
```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant. Use the provided context to answer questions.',
    messages,
    tools: {
      searchKnowledge: tool({
        description: 'Search the knowledge base',
        parameters: z.object({
          query: z.string()
        }),
        execute: async ({ query }) => {
          return await vectorSearch(query);
        }
      })
    }
  });

  return result.toUIMessageStreamResponse();
}
```

## Project Structure (Minimal)

```
src/
├── app/
│   ├── page.tsx                    # Landing page with demo
│   ├── api/
│   │   ├── scrape/
│   │   │   └── route.ts           # Web scraping
│   │   └── chat/
│   │       └── route.ts           # RAG chat
│   └── globals.css
├── components/
│   ├── scrape-form.tsx            # URL input form
│   ├── chat-interface.tsx         # Simple chat UI
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/
│   ├── scraper.ts                 # Basic web scraping
│   ├── embeddings.ts              # OpenAI embeddings
│   ├── vector-store.ts            # Supabase vector ops
│   ├── chunking.ts                # Simple text chunking
│   └── db.ts                      # Database client
└── types/
    └── index.ts                   # Type definitions
```

## Core Implementation Files

### Basic Web Scraper
```typescript
// lib/scraper.ts
import * as cheerio from 'cheerio';

export async function scrapeWebsite(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, nav, footer').remove();
  
  return {
    title: $('title').text() || '',
    content: $('body').text().replace(/\s+/g, ' ').trim(),
    url
  };
}
```

### Simple Text Chunking
```typescript
// lib/chunking.ts
export function chunkContent(text: string, maxLength: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += sentence + '. ';
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
```

### Vector Store Operations
```typescript
// lib/vector-store.ts
import { neon } from '@neondatabase/serverless';
import { openai } from '@ai-sdk/openai';
import { embed } from '@ai-sdk/embeddings';

const sql = neon(process.env.DATABASE_URL!);

export async function storeDocument(content: any, chunks: string[]) {
  // Insert document
  const [document] = await sql`
    INSERT INTO documents (url, title, content)
    VALUES (${content.url}, ${content.title}, ${content.content})
    RETURNING id, url, title
  `;

  // Generate and store embeddings
  for (let i = 0; i < chunks.length; i++) {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: chunks[i]
    });

    await sql`
      INSERT INTO document_chunks (document_id, content, embedding)
      VALUES (${document.id}, ${chunks[i]}, ${JSON.stringify(embedding)}::vector)
    `;
  }

  return document;
}

export async function vectorSearch(query: string, limit = 5) {
  // Generate query embedding
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-ada-002'),
    value: query
  });

  // Search similar chunks
  const results = await sql`
    SELECT 
      content,
      1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
    FROM document_chunks
    WHERE 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > 0.7
    ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${limit}
  `;

  return results.map((item: any) => ({
    content: item.content,
    similarity: item.similarity
  }));
}
```

### Database RPC Function
```sql
-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Optional: Create an index for better performance
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

## UI Components (MVP)

### Landing Page
```typescript
// app/page.tsx
import ScrapeForm from '@/components/scrape-form';
import ChatInterface from '@/components/chat-interface';

export default function HomePage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">RAG Agent Demo</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">1. Add Content</h2>
          <ScrapeForm />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">2. Ask Questions</h2>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
```

### Scrape Form Component
```typescript
// components/scrape-form.tsx
'use client';

import { useState } from 'react';

export default function ScrapeForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL..."
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Add Website'}
        </button>
      </form>
      
      {result && (
        <div className="p-4 bg-green-50 rounded">
          <p>✅ Added {result.chunks_created} chunks to knowledge base</p>
        </div>
      )}
    </div>
  );
}
```

### Chat Interface Component
```typescript
// components/chat-interface.tsx
'use client';

import { useChat } from '@ai-sdk/react';

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="border rounded-lg h-96 flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded max-w-xs ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto'
                : 'bg-gray-100'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Environment Variables (MVP)

```bash
# OpenAI
OPENAI_API_KEY=sk-your-key

# Neon Database
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Deployment Configuration

### Vercel Config
```json
{
  "functions": {
    "app/api/scrape/route.js": {
      "maxDuration": 30
    },
    "app/api/chat/route.js": {
      "maxDuration": 30
    }
  }
}
```

### Package.json Dependencies
```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "@ai-sdk/openai": "latest",
    "@ai-sdk/react": "latest",
    "@neondatabase/serverless": "latest",
    "cheerio": "latest",
    "zod": "latest"
  }
}
```

## MVP Deployment Steps

1. **Setup Neon Database**:
   - Create new Neon project at neon.tech
   - Enable pgvector extension
   - Run database schema SQL
   - Get connection string

2. **Deploy to Vercel**:
   - Connect GitHub repo
   - Add environment variables (DATABASE_URL, OPENAI_API_KEY)
   - Deploy

3. **Test MVP**:
   - Add a website URL
   - Ask questions about the content
   - Verify responses use retrieved context

## Feature Limitations (MVP)

**NOT Included**:
- Authentication
- SEO analysis
- Rate limiting  
- Advanced chunking strategies
- Caching
- Error handling beyond basics
- User management
- Multiple document formats
- Content filtering
- Performance optimizations
- Monitoring
- Testing suite

**Included**:
- Basic web scraping
- Text chunking and embedding
- Vector similarity search
- RAG chat with tool use
- Simple responsive UI
- Supabase integration

This MVP can be built and deployed in 1-2 days, providing a working demonstration of RAG capabilities that can be extended with additional features later.