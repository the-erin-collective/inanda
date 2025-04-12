import { Injectable } from '@angular/core';
import { SiteRepository } from '../../domain/repository/site.repository.interface';
import { SiteModel } from '../../infrastructure/repository/models/site.model';
import { Site } from '../../domain/entities/site/site.entity';
import { AppPageRepository } from './page.repository'; 

@Injectable({
  providedIn: 'root',
})
export class AppSiteRepository implements SiteRepository {

  constructor(private pageRepository: AppPageRepository) {}

  async findById(id: string): Promise<Site | null> {
    const doc = await SiteModel.findById(id).exec();
    if (!doc) return null;

    const obj = doc.toObject();

    return Site.fromJSON({
      id: doc._id.toString(),
      name: obj.name,
      description: obj.description ?? '',
      pageOrder: obj.pageOrder,
    });
  }

  async findByIdWithPages(id: string): Promise<Site | null> {
    const site = await this.findById(id);
    if (!site) return null;

    const pages = await this.pageRepository.findByIds(site.pageOrder);
    site.pages = pages;
    return site;
  }

  async save(site: Site): Promise<Site> {
    const doc = new SiteModel({
      _id: site.id,
      name: site.name,
      description: site.description,
      pageOrder: site.pageOrder,
    });

    await doc.save();
    const savedObj = doc.toObject();

    return Site.fromJSON({
      id: doc._id.toString(),
      name: savedObj.name,
      description: savedObj.description ?? '',
      pageOrder: savedObj.pageOrder
    });
  }

  async delete(id: string): Promise<void> {
    await SiteModel.findByIdAndDelete(id).exec();
  }
}
