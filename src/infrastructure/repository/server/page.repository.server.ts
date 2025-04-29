import { Injectable } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { PageModel } from '../../data/schemas/page.schema'; // Mongoose model
import { Types } from 'mongoose';
import { RootNode } from 'src/domain/entities/page/root.entity';

@Injectable({
  providedIn: 'root',
})
export class ServerPageRepository implements PageRepository {
  async findById(id: string): Promise<Page | null> {
    console.log(`Finding page by ID: ${id}`);

    if (!Types.ObjectId.isValid(id)) return null; // Validate ObjectId
    const pageModel = await PageModel.findById(id).exec();
    if (!pageModel) return null;

    return Page.fromJSON({
      id: pageModel._id.toString(), // Convert ObjectId to string
      title: pageModel.title ?? '',
      root: RootNode.fromJSON({
        base: { children: pageModel.root.base.children ?? [] },
        core: { children: pageModel.root.core.children ?? [] },
        preview: { children: pageModel.root.preview.children ?? [] },
        script: { children: pageModel.root.script.children ?? [] },
        type: pageModel.root.type,
      }), // Ensure the structure matches RootNode.fromJSON
      siteId: pageModel.siteId,
    });
  }

  async save(page: Page): Promise<Page> {
    const pageData = {
      _id: page.id, // Use the string ID directly
      title: page.title,
      root: {
        base: { children: page.root.base.children ?? [] },
        core: { children: page.root.core.children ?? [] },
        preview: { children: page.root.preview.children ?? [] },
        script: { children: page.root.script.children ?? [] },
        type: page.root.type,
      },
      siteId: page.siteId,
    };

    const pageModel = page.id
      ? await PageModel.findByIdAndUpdate(page.id, pageData, { new: true, upsert: true }).exec()
      : await new PageModel(pageData).save();

    return Page.fromJSON({
      id: pageModel._id, // Use the string ID directly
      title: pageModel.title ?? '',
      root: RootNode.fromJSON(pageModel.root),
      siteId: pageModel.siteId,
    });
  }

  async delete(id: string): Promise<void> {
    await PageModel.findByIdAndDelete(id).exec();
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    console.log(`Finding pages by IDs: ${ids}`);
    
    // Use string IDs directly in the query
    const pageModels = await PageModel.find({ _id: { $in: ids } }).exec();

    return pageModels.map(pageModel =>
      Page.fromJSON({
        id: pageModel._id, // Use the string ID directly
        title: pageModel.title,
        root: RootNode.fromJSON(pageModel.root),
        siteId: pageModel.siteId,
      })
    );
  }
}