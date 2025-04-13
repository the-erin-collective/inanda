import { Site } from '../entities/site/site.entity';
import { Page } from '../entities/page/page.entity';

export class SiteContent {
  constructor(
    public readonly site: Site,
    public readonly pages: Page[],
  ) {}
}