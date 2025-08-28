export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">AI SDK SEO Assistant</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Web Scraping</h2>
          <p className="text-gray-600">Scrape website content for RAG processing</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Chat Interface</h2>
          <p className="text-gray-600">Ask questions about scraped content</p>
        </div>
      </div>
    </main>
  )
}