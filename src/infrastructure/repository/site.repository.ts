import { Injectable } from '@angular/core';
import { SiteRepository } from '../../domain/repository/site.repository.interface';
import { Site } from '../../domain/entities/site/site.entity';
import { SiteContent } from '../../domain/aggregates/site-content.aggregate';
import { AppPageRepository } from './page.repository';
import { SiteModel } from '../data/schemas/site.schema'; // Mongoose model
import { Types } from 'mongoose';

@Injectable({
  providedIn: 'root',
})
export class AppSiteRepository implements SiteRepository {
  constructor(private readonly pageRepository: AppPageRepository) {}

  private readonly defaultSiteId: string = 'site-001';

  async findById(id: string): Promise<Site | null> {
    console.log(`Finding site by ID: ${id}`);
  //  console.log('SiteModel:', SiteModel); // Ensure the model is initialized

    try {
      const site = await SiteModel.findById(id).exec();
      if (!site) {
        console.log(`No site found for ID: ${id}`);
      } else {
        console.log(`Found site:`, site);
      }
      return site;
    } catch (err) {
      console.error('Error querying SiteModel:', err);
      return null;
    }
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    console.log(`Finding site with pages by ID: ${id}`);

    const siteIdToFetch = id || this.defaultSiteId;

    const site = await this.findById(siteIdToFetch);
    if (!site) return null;

    // Fetch pages based on the pageOrder array from the Site
    const pages = await this.pageRepository.findByIds(site.pageOrder);

    // Create and return the SiteContent aggregate
    return new SiteContent(site, pages);
  }

  async save(site: Site): Promise<Site> {
    const siteData = {
      _id: site.id, // Use the string ID directly
      name: site.name,
      description: site.description,
      pageOrder: site.pageOrder,
    };

    const siteModel = site.id
      ? await SiteModel.findByIdAndUpdate(site.id, siteData, { new: true, upsert: true }).exec()
      : await new SiteModel(siteData).save();

    return Site.fromJSON({
      id: siteModel._id, // Use the string ID directly
      name: siteModel.name,
      description: siteModel.description ?? '',
      pageOrder: siteModel.pageOrder,
    });
  }

  async delete(id: string): Promise<void> {
    await SiteModel.findByIdAndDelete(id).exec(); // Use the string ID directly
  }
}
