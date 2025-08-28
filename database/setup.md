# Database Setup Instructions

## 1. Create Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project/database
3. Note your database connection string from the dashboard
4. The connection string format will be:
   ```
   postgresql://username:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
   ```

## 2. Configure Environment Variables

Add to your `.env.local` file:
```bash
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
```

## 3. Run Database Schema

You have two options to set up the database schema:

### Option A: Using Neon Console (Recommended)
1. Go to your Neon project dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Execute the SQL

### Option B: Using psql command line
```bash
psql $DATABASE_URL -f database/schema.sql
```

## 4. Verify Setup

The schema creates:
- `documents` table: Stores original scraped web content
- `document_chunks` table: Stores text chunks with vector embeddings
- Indexes: HNSW index for vector similarity search, document_id index for joins

## 5. Test Connection

Run this from your Next.js project to test the connection:
```bash
npm run type-check  # Should pass without database connection errors
```

## Schema Details

- **pgvector extension**: Enables vector storage and similarity search
- **VECTOR(1536)**: Matches OpenAI text-embedding-ada-002 dimensions
- **HNSW index**: Optimized for fast vector similarity queries using cosine distance
- **Cascade deletion**: Deleting a document removes all its chunks

The database is now ready for the RAG system implementation.