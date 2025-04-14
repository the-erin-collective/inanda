import { Injectable } from '@angular/core';
import { SiteRepository } from '../../../domain/repository/site.repository.interface';
import { SiteModel } from '../models/site.model'; // MikroORM entity
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteContent } from '../../../domain/aggregates/site-content.aggregate';
import { AppPageRepository } from './page.repository';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Injectable({
  providedIn: 'root',
})
export class AppSiteRepository implements SiteRepository {
  constructor(
    private readonly orm: MikroORM,
    private readonly pageRepository: AppPageRepository
  ) {}

  private get em(): EntityManager {
    return this.orm.em.fork(); // Use a forked EntityManager for thread safety
  }

  async findById(id: string): Promise<Site | null> {
    const objectId = new ObjectId(id); // Convert string to ObjectId
    const siteModel = await this.em.findOne(SiteModel, { id: objectId });
    if (!siteModel) return null;

    return Site.fromJSON({
      id: siteModel.id.toString(), // Convert ObjectId back to string
      name: siteModel.name,
      description: siteModel.description ?? '',
      pageOrder: siteModel.pageOrder,
    });
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    const site = await this.findById(id);
    if (!site) return null;

    // Fetch pages based on the pageOrder array from the Site
    const pages = await this.pageRepository.findByIds(site.pageOrder);

    // Create and return the SiteContent aggregate
    return new SiteContent(site, pages);
  }

  async save(site: Site): Promise<Site> {
    const objectId = site.id ? new ObjectId(site.id) : undefined; // Convert string to ObjectId if id exists
    const siteModel = this.em.create(SiteModel, {
      id: objectId,
      name: site.name,
      description: site.description,
      pageOrder: site.pageOrder,
    });

    await this.em.persistAndFlush(siteModel);

    return Site.fromJSON({
      id: siteModel.id.toString(), // Convert ObjectId back to string
      name: siteModel.name,
      description: siteModel.description ?? '',
      pageOrder: siteModel.pageOrder,
    });
  }

  async delete(id: string): Promise<void> {
    const objectId = new ObjectId(id); // Convert string to ObjectId
    const siteModel = await this.em.findOne(SiteModel, { id: objectId });
    if (siteModel) {
      await this.em.removeAndFlush(siteModel);
    }
  }
}
