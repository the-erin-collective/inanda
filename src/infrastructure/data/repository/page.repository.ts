import { Injectable } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { PageModel } from '../models/page.model';
import { Page } from '../../../domain/entities/page/page.entity';

@Injectable({
  providedIn: 'root',
})
export class AppPageRepository implements PageRepository {
  async findById(id: string): Promise<Page | null> {
    const doc = await PageModel.findById(id).exec();
    if (!doc) return null;

    const obj = doc.toObject();
    return Page.fromJSON({
      id: doc._id.toString(), // Explicitly assign 'id' from '_id'
      title: obj.title ?? '',
      root: obj.root,
      siteId: obj.siteId,
    });
  }
  
  async save(page: Page): Promise<Page> {
    const doc = new PageModel({
      _id: page.id,
      title: page.title,
      root: page.root,
      siteId: page.siteId,
    });

    await doc.save();

    const savedObj = doc.toObject();
    return Page.fromJSON({
      id: doc._id.toString(),
      title: savedObj.title ?? '',
      root: savedObj.root,
      siteId: savedObj.siteId,
    });
  }

  async delete(id: string): Promise<void> {
    await PageModel.findByIdAndDelete(id).exec();
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    const docs = await PageModel.find({ _id: { $in: ids } }).exec();
    return docs.map(doc =>
      Page.fromJSON({
        id: doc._id.toString(),
        title: doc.title,
        root: doc.root,
        siteId: doc.siteId,
      })
    );
  }
}