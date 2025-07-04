import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { createLevelDB, getLevelDB, closeLevelDB, resetCache } from '../src/infrastructure/data/cache/level-db.factory';

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
import { StylesheetNode } from '../src/domain/entities/page/content/items/stylesheet.entity';
import { SitemapType } from '../src/domain/entities/site/sitemap-type.enum';
import { environment } from 'src/infrastructure/environments/environment.server';
import { AppConfig } from 'src/infrastructure/services/config.service';

// Load server runtime configuration
const isProd = process.env['NODE_ENV'] === 'production';
const cfgFile = isProd ? 'config.prod.json' : 'config.dev.json';
let serverConfig: AppConfig;
try {
  serverConfig = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), cfgFile), 'utf-8')
  );
  console.log(`Loaded server config for seed from ${cfgFile}`);
} catch (err) {
  console.error(`Failed to load server config (${cfgFile}):`, err);
}

if(!serverConfig){
  console.error('❌ Unable to read config.json file.');
  process.exit(1);
}

const MONGODB_URI = environment.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not set in config.json file.');
  process.exit(1);
}

// 1. Define Mongoose schemas
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
  root: mongoose.Schema.Types.Mixed,
});

const SiteModel = mongoose.model('Site', siteSchema);
const PageModel = mongoose.model('Page', pageSchema);


// 2. Generate seed data
function getPageContent(index: number) {
  const pageContents = [
    {
      coreHeading: "Welcome to Our Home",
      coreParagraph1: "Our digital home showcases the latest in web technology and interactive design. Explore our unique approach to digital experiences.",
      coreParagraph2: "We believe in creating memorable, engaging digital spaces that tell your story in innovative ways.",
      coreParagraph3: "Click through our hexagonal navigation to discover more about our services and approach.",
      previewHeading: "Home",
      previewParagraph: "Your journey starts here. Click to enter our digital space."
    },
    {
      coreHeading: "About Our Platform",
      coreParagraph1: "Our platform combines cutting-edge 3D navigation with seamless content delivery for a truly unique web experience.",
      coreParagraph2: "Built using Angular and Babylon.js, we've created an immersive environment that breaks the mold of traditional websites.",
      coreParagraph3: "The hexagonal design represents our interconnected approach to digital solutions.",
      previewHeading: "Platform",
      previewParagraph: "Discover the technology behind our unique approach."
    },
    {
      coreHeading: "Our Services",
      coreParagraph1: "We offer a wide range of digital services including web development, 3D modeling, and interactive design.",
      coreParagraph2: "Each project is custom tailored to meet your specific needs and vision, ensuring a result that stands out.",
      coreParagraph3: "Our team combines technical expertise with creative insight to deliver exceptional results.",
      previewHeading: "Services",
      previewParagraph: "Explore our range of digital offerings and expertise."
    },
    {
      coreHeading: "Portfolio Showcase",
      coreParagraph1: "Browse through our collection of completed projects spanning various industries and technologies.",
      coreParagraph2: "Each case study demonstrates our problem-solving approach and attention to detail.",
      coreParagraph3: "We're proud of the diverse range of clients we've helped succeed in their digital transformation.",
      previewHeading: "Portfolio",
      previewParagraph: "See our work in action across different industries."
    },
    {
      coreHeading: "The Team Behind It",
      coreParagraph1: "Get to know the passionate developers, designers, and strategists who make our projects come to life.",
      coreParagraph2: "Our team brings together diverse backgrounds and specialties, united by a commitment to excellence.",
      coreParagraph3: "We continuously explore new technologies and approaches to stay at the cutting edge.",
      previewHeading: "Team",
      previewParagraph: "Meet the creators, developers, and visionaries."
    },
    {
      coreHeading: "Latest News & Updates",
      coreParagraph1: "Stay informed about our newest projects, technology insights, and company announcements.",
      coreParagraph2: "We regularly share our knowledge through blog posts, tutorials, and case studies.",
      coreParagraph3: "Follow our journey as we continue to push the boundaries of web technology.",
      previewHeading: "News",
      previewParagraph: "Catch up on our latest developments and insights."
    },
    {
      coreHeading: "Get in Touch",
      coreParagraph1: "Ready to start your project? We'd love to hear from you and discuss how we can help bring your vision to life.",
      coreParagraph2: "Our consultation process is designed to thoroughly understand your goals and requirements.",
      coreParagraph3: "Reach out today to schedule a conversation with our team of experts.",
      previewHeading: "Contact",
      previewParagraph: "Let's start a conversation about your project."
    }
  ];
  
  return pageContents[index - 1] || {
    coreHeading: `Page ${index} Heading`,
    coreParagraph1: `This is the main content for page ${index}.`,
    coreParagraph2: `Additional information about page ${index} goes here.`,
    coreParagraph3: `More details specific to page ${index}.`,
    previewHeading: `Page ${index}`,
    previewParagraph: `Preview of page ${index}. Click to learn more.`
  };
}

function createStylesheet(index: number): Style[] {
  // Define different color schemes for each page
  const colorSchemes = [
    { preview: '#535332ff', core: '#fdffb6', previewText: '#ffffff', coreText: '#000000' }, // Page 1
    { preview: '#5e3637ff', core: '#ffadad', previewText: '#ffffff', coreText: '#000000' }, // Page 2
    { preview: '#55422fff', core: '#ffd6a5', previewText: '#ffffff', coreText: '#000000' }, // Page 3
    { preview: '#3c5837ff', core: '#caffbf', previewText: '#ffffff', coreText: '#000000' }, // Page 4
    { preview: '#2b5053ff', core: '#64F3FF', previewText: '#ffffff', coreText: '#000000' }, // Page 5
    { preview: '#304361ff', core: '#a0c4ff', previewText: '#ffffff', coreText: '#000000' }, // Page 6
    { preview: '#573657ff', core: '#FF9BFF', previewText: '#ffffff', coreText: '#000000' }  // Page 7
  ];

  const colors = colorSchemes[index - 1];
  return [
    {
      _id: `panel-preview-${index}`,
      name: 'Preview Panel Style',
      properties: {
        backgroundColor: colors.preview,
        foregroundColor: colors.previewText,
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '15px',
        paddingBottom: '15px',
        horizontalAlignment: 'center',
        verticalAlignment: 'center',
        fillSpace: true,  // This will make it cover the hex
        textHorizontalAlignment: 'center',
        textVerticalAlignment: 'center'
      }
    },
    {
      _id: `panel-preview-hover-${index}`,
      name: 'Preview Panel Hover Style',
      properties: {
        backgroundColor: colors.preview,
        foregroundColor: colors.previewText,
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '15px',
        paddingBottom: '15px',
        horizontalAlignment: 'center',
        verticalAlignment: 'center',
        fillSpace: true,
        borderWidth: '4',  // Border width as a string that will be parsed to integer
        borderColor: '#FFFFFF', 
        borderStyle: 'solid',
        textHorizontalAlignment: 'center',
        textVerticalAlignment: 'center'
      }
    },
    {
      _id: `h1-preview-${index}`,
      name: 'Preview Heading Style',
      properties: {
        fontSize: '92',  // Increased font size
        fontWeight: 'bold',
        marginTop: '30px',
        foregroundColor: 'inherit',
        textHorizontalAlignment: 'center',
        textVerticalAlignment: 'center'
      }
    },
    {
      _id: `p-preview-${index}`,
      name: 'Preview Paragraph Style',
      properties: {
        fontSize: '48',  // Increased font size
        fontWeight: 'bold',
        marginTop: '15px',
        foregroundColor: 'inherit',
        textHorizontalAlignment: 'center',
        textVerticalAlignment: 'center'
      }
    },
    {
      _id: `panel-core-${index}`,
      name: 'Core Panel Style',
      properties: {
        backgroundColor: colors.core,
        foregroundColor: colors.coreText,
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '15px',
        paddingBottom: '15px',
        horizontalAlignment: 'center',
        verticalAlignment: 'center',
        fillSpace: true  // This will make it cover the hex
      }
    },
    {
      _id: `h1-${index}`,
      name: 'Heading Style',
      properties: {
        fontSize: '52',  // Increased font size
        fontWeight: 'bold',
        marginTop: '30px',
        foregroundColor: 'inherit',
        textHorizontalAlignment: 'center'  // Changed to center
      }
    },
    {
      _id: `p-${index}`,
      name: 'Paragraph Style',
      properties: {
        fontSize: '28',  // Increased font size
        marginTop: '15px',
        foregroundColor: 'inherit',
        textHorizontalAlignment: 'center'  // Changed to center
      }
    }
    ,
    // Anchor styles
    {
      _id: `anchor-${index}`,
      name: 'Anchor Style',
      properties: {
        foregroundColor: '#0074d9',
        textDecoration: 'underline',
        fontSize: '20',
        fontWeight: 'bold',
        textHorizontalAlignment: 'center',
        cursor: 'pointer'
      }
    },
    {
      _id: `anchor-hover-${index}`,
      name: 'Anchor Hover Style',
      properties: {
        foregroundColor: '#005fa3',
        textDecoration: 'underline',
        fontSize: '20',
        fontWeight: 'bold',
        textHorizontalAlignment: 'center',
        cursor: 'pointer'
      }
    }
  ];
}

function createPage(index: number, siteId: string): Page {
  const styles = createStylesheet(index);
  
  // Create base node with stylesheet
  const base = new BaseNode();
  base.children = [new StylesheetNode(`stylesheet-${index}`, styles)];

  // Prepare unique content for each page
  const pageContent = getPageContent(index);
  

  // Create core content with anchor node example
  const corePanel = new PanelNode([
    new H1Node(pageContent.coreHeading, `h1-${index}`),
    new PNode(pageContent.coreParagraph1, `p-${index}`),
    new PNode(pageContent.coreParagraph2, `p-${index}`),
    new PNode(pageContent.coreParagraph3, `p-${index}`),
    // Anchor node example
    new (require('../src/domain/entities/page/content/items/text/anchor.entity').AnchorNode)(
      'Visit our site',
      'https://example.com',
      '_blank',
      `anchor-${index}`
    )
  ]);
  corePanel._id = `panel-core-${index}`;

  // Create preview content (shorter version) with anchor node example
  const previewPanel = new PanelNode([
    new H1Node(pageContent.previewHeading, `h1-preview-${index}`),
    new PNode(pageContent.previewParagraph, `p-preview-${index}`),
    new (require('../src/domain/entities/page/content/items/text/anchor.entity').AnchorNode)(
      'Preview link',
      'https://example.com',
      '_blank',
      `anchor-preview-${index}`
    )
  ]);
  previewPanel._id = `panel-preview-${index}`;

  const root = new RootNode(
    base,
    new CoreNode([corePanel]),
    new PreviewNode([previewPanel]),
    new ScriptNode()
  );

  return new Page(`page-${index}`, `Page ${index}`, root, siteId);
}

async function seed() {
  try {
    if(environment.USE_LEVEL_DB){
    // Initialize LevelDB and clear cache
      await createLevelDB();
      await resetCache();
      console.log('Cache cleared successfully');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');    // Clear database
    await SiteModel.deleteMany({});
    await PageModel.deleteMany({});

    const siteId = 'site-001';    const site = new Site(
      siteId,
      'Example Site',
      'A modern web experience with 3D navigation',
      [],
      SitemapType.HEX_FLOWER,
      'page-1',
      'PAINT'
    );
    const pages: Page[] = [];
    
    for (let i = 1; i <= 7; i++) {
      const page = createPage(i, siteId);
      pages.push(page);
      site.pageOrder.push(page.id);
    }

    // Save site first
    await SiteModel.create(site.toJSON());
    console.log('✅ Site created');

    // Save pages
    const pageDocs = pages.map(p => p.toJSON());
    await PageModel.insertMany(pageDocs);
    console.log('✅ Pages created');

    console.log('✅ Seeded site and 7 pages.');
  } catch (err) {
    console.error('❌ Error seeding:', err);
  } finally {
    await mongoose.disconnect();
    if(environment.USE_LEVEL_DB){
      await closeLevelDB();
    }
    console.log('Disconnected from MongoDB and closed cache');
  }
}

seed();