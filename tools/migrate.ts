import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PersistentStorageType } from '../src/domain/constants/storage-type.enum';
import { Site } from '../src/domain/entities/site/site.entity';
import { Page } from '../src/domain/entities/page/page.entity';


// Load .env if present
dotenv.config();

const MONGODB_URI = process.env['MONGO_URI'];

// Define mongoose schemas (same as seed.ts)
const siteSchema = new mongoose.Schema({
  _id: String,
  name: String,
  description: String,
  pageOrder: [String],
  sitemapType: String,
  defaultPage: String,
  backdrop: String
});

const pageSchema = new mongoose.Schema({
  _id: String,
  title: String,
  siteId: String,
  root: mongoose.Schema.Types.Mixed
});



const SiteModel = mongoose.model('Site', siteSchema);
const PageModel = mongoose.model('Page', pageSchema);


interface MigrationOptions {
  siteId: string;
  source: PersistentStorageType;
  destination: PersistentStorageType;
  dryRun?: boolean;
}

function validateOptions(options: any): options is MigrationOptions {
  if (!options.siteId || typeof options.siteId !== 'string') {
    throw new Error('siteId is required and must be a string');
  }

  if (!options["source"] || !Object.values(PersistentStorageType).includes(options["source"])) {
    throw new Error(`source must be one of: ${Object.values(PersistentStorageType).join(', ')}`);
  }

  if (!options["destination"] || !Object.values(PersistentStorageType).includes(options["destination"])) {
    throw new Error(`destination must be one of: ${Object.values(PersistentStorageType).join(', ')}`);
  }

  return true;
}

async function migrateFromMongo(siteId: string): Promise<{ site: Site; pages: Page[] }> {
  // Find site and related data in MongoDB
  const siteMongo = await SiteModel.findById(siteId).lean();
  if (!siteMongo) throw new Error(`Site ${siteId} not found in MongoDB`);

  const pagesMongo = await PageModel.find({ siteId }).lean();

  return {
    site: new Site(
      siteMongo._id,
      siteMongo.name,
      siteMongo.description,
      siteMongo.pageOrder,
      siteMongo.sitemapType,
      siteMongo.defaultPage,
      siteMongo.backdrop
    ),
    pages: pagesMongo.map(p => new Page(p._id, p.title, p.root, p.siteId))
  };
}

async function saveToFileSystem(data: { site: Site; pages: Page[] }): Promise<void> {
const baseDir = path.join(process.cwd(), 'data', 'repository', 'sites', data.site.id);
    // Create directories if they don't exist
  await fs.mkdir(path.join(baseDir, 'pages'), { recursive: true });
  
  // Save site data using the site ID as the filename (consistent with how the repository works)
  await fs.writeFile(
    path.join(baseDir, `${data.site.id}.json`),
    JSON.stringify(data.site, null, 2)
  );
  // Save pages
  for (const page of data.pages) {
    await fs.writeFile(
      path.join(baseDir, 'pages', `${page.id}.json`),
      JSON.stringify(page, null, 2)
    );
  }
}

async function executeMigration(options: Record<string, any>): Promise<{ success: boolean }> {
  try {
    if (!validateOptions(options)) {
      return { success: false };
    }

    if (!MONGODB_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    if (options["source"] === PersistentStorageType.MONGODB && 
        options["destination"] === PersistentStorageType.FILE) {
      const data = await migrateFromMongo(options.siteId);
        if (!options["dryRun"]) {
        await saveToFileSystem(data);
        console.log('Migration completed successfully');
      } else {
        console.log('Dry run completed. Would migrate:', {
          site: data.site.id,
          pages: data.pages.length
        });
      }
    } else {
      throw new Error('Only MongoDB to File migration is currently supported');
    }

    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false };
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Parse command line arguments when run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: Record<string, any> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value;
    }
  }

  // Convert string values to enum
  if (options["source"]) options["source"] = PersistentStorageType[options["source"] as keyof typeof PersistentStorageType];
  if (options["destination"]) options["destination"] = PersistentStorageType[options["destination"] as keyof typeof PersistentStorageType];
  if (options["dryRun"]) options["dryRun"] = options["dryRun"].toLowerCase() === 'true';

  executeMigration(options).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default executeMigration;