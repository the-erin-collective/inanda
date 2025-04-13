import { Injectable, Inject } from '@angular/core';
import { SiteContent } from '../../domain/aggregates/site-content.model';
import { SITE_REPOSITORY, SiteRepository } from '../../domain/repository/site.repository.interface';
import { PAGE_REPOSITORY, PageRepository } from '../../domain/repository/page.repository.interface';

@Injectable({
  providedIn: 'root',
})
export class SiteContentService {
  constructor(
    @Inject(SITE_REPOSITORY) private siteRepository: SiteRepository,
    @Inject(PAGE_REPOSITORY) private pageRepository: PageRepository
  ) {}

  async getSiteContent(id: string): Promise<SiteContent | null> {
    const site = await this.siteRepository.findById(id);
    if (!site) return null;

    const pages = await this.pageRepository.findByIds(site.pageOrder);
    return new SiteContent(site, pages);
  }
}