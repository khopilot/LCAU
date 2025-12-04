import { crawlSite } from './crawler';
import { processAndChunk } from './chunker';
import { indexToVectorize } from './indexer';
import { IFC_BASE_URL } from '@lcau/shared';

async function main() {
  console.log('🚀 Starting IFC website crawler...\n');

  const startTime = Date.now();

  try {
    // Step 1: Crawl the website
    console.log('📥 Step 1: Crawling website...');
    const pages = await crawlSite(IFC_BASE_URL, {
      maxPages: 200,
      concurrency: 3,
      delay: 500,
    });
    console.log(`   ✓ Crawled ${pages.length} pages\n`);

    // Step 2: Process and chunk content
    console.log('📝 Step 2: Processing and chunking content...');
    const chunks = await processAndChunk(pages, {
      maxChunkSize: 1000,
      overlap: 100,
    });
    console.log(`   ✓ Created ${chunks.length} chunks\n`);

    // Step 3: Index to Vectorize
    console.log('📊 Step 3: Indexing to Vectorize...');
    await indexToVectorize(chunks);
    console.log(`   ✓ Indexed ${chunks.length} chunks to Vectorize\n`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Crawl completed in ${duration}s`);
    console.log(`   Pages: ${pages.length}`);
    console.log(`   Chunks: ${chunks.length}`);
  } catch (error) {
    console.error('❌ Crawl failed:', error);
    process.exit(1);
  }
}

main();
