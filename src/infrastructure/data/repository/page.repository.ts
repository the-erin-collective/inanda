import { Injectable } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { PageModel } from '../models/page.model'; // MikroORM entity
import { ObjectId } from '@mikro-orm/mongodb'; // Import ObjectId for conversion
import { RootNode } from 'src/domain/entities/page/root.entity';

@Injectable({
  providedIn: 'root',
})
export class AppPageRepository implements PageRepository {
  constructor(private readonly orm: MikroORM) {}

  private get em(): EntityManager {
    return this.orm.em.fork(); // Use a forked EntityManager for thread safety
  }

  async findById(id: string): Promise<Page | null> {
    const objectId = new ObjectId(id); // Convert string to ObjectId
    const pageModel = await this.em.findOne(PageModel, { id: objectId });
    if (!pageModel) return null;

    return Page.fromJSON({
      id: pageModel.id.toString(), // Convert ObjectId back to string
      title: pageModel.title ?? '',
      root:  RootNode.fromJSON(pageModel.root),
      siteId: pageModel.siteId,
    });
  }

  async save(page: Page): Promise<Page> {
    const objectId = page.id ? new ObjectId(page.id) : undefined; // Convert string to ObjectId if id exists
    const pageModel = this.em.create(PageModel, {
      id: objectId,
      title: page.title,
      root: page.root.toJSON(), // Convert RootNode to JSON
      siteId: page.siteId,
    });

    await this.em.persistAndFlush(pageModel);

    return Page.fromJSON({
      id: pageModel.id.toString(), // Convert ObjectId back to string
      title: pageModel.title ?? '',
      root: RootNode.fromJSON(pageModel.root),
      siteId: pageModel.siteId,
    });
  }

  async delete(id: string): Promise<void> {
    const objectId = new ObjectId(id); // Convert string to ObjectId
    const pageModel = await this.em.findOne(PageModel, { id: objectId });
    if (pageModel) {
      await this.em.removeAndFlush(pageModel);
    }
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    const objectIds = ids.map(id => new ObjectId(id)); // Convert array of strings to ObjectIds
    const pageModels = await this.em.find(PageModel, { id: { $in: objectIds } });
    return pageModels.map(pageModel =>
      Page.fromJSON({
        id: pageModel.id.toString(), // Convert ObjectId back to string
        title: pageModel.title,
        root: RootNode.fromJSON(pageModel.root),
        siteId: pageModel.siteId,
      })
    );
  }
}