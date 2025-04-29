import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

import { Site } from '../src/domain/entities/site/site.entity';
import { Page } from '../src/domain/entities/page/page.entity';
import { RootNode } from '../src/domain/entities/page/root.entity';
import { BaseNode } from '../src/domain/entities/page/containers/base.entity';
import { CoreNode } from '../src/domain/entities/page/containers/core.entity';
import { ScriptNode } from '../src/domain/entities/page/containers/script.entity';
import { PanelNode } from '../src/domain/entities/page/content/items/panel.entity';
import { H1Node } from '../src/domain/entities/page/content/items/text/h1.entity';
import { PNode } from '../src/domain/entities/page/content/items/text/p.entity';
import { PreviewNode } from '../src/domain/entities/page/containers/preview.entity';

// Load .env if present
dotenv.config();

const MONGODB_URI = process.env['MONGO_URI'];

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not set in .env file.');
  process.exit(1);
}

// 1. Define Mongoose schemas
const siteSchema = new mongoose.Schema({
  _id: String,
  name: String,
  description: String,
  pageOrder: [String],
});

const pageSchema = new mongoose.Schema({
  _id: String,
  title: String,
  siteId: String,
  root: mongoose.Schema.Types.Mixed,
});

const SiteModel = mongoose.model('Site', siteSchema);
const PageModel = mongoose.model('Page', pageSchema);

// 2. Generate seed data
function createPage(index: number, siteId: string): Page {
  const panel = new PanelNode([ 
    new H1Node(`Page ${index} Heading`),
    new PNode(`This is paragraph ${index}.`),
  ]);

  const root = new RootNode(
    new BaseNode(),      // empty
    new CoreNode([panel]),
    new PreviewNode([panel]),
    new ScriptNode()     // empty
  );

  return new Page(`page-${index}`, `Page ${index}`, root, siteId);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await SiteModel.deleteMany({});
    await PageModel.deleteMany({});

    const siteId = 'site-001';
    const site = new Site(siteId, 'Example Site', 'Seeded site', []);
    const pages: Page[] = [];

    for (let i = 1; i <= 7; i++) {
      const page = createPage(i, siteId);
      pages.push(page);
      site.pageOrder.push(page.id);
    }

    await SiteModel.create(site.toJSON());
    await PageModel.insertMany(pages.map(p => p.toJSON()));

    console.log('✅ Seeded site and 7 pages.');
  } catch (err) {
    console.error('❌ Error seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();