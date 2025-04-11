import { Injectable } from '@angular/core';
import { PageRepository } from '../../domain/repository/page.repository.interface';
import { PageModel } from '../../infrastructure/repository/models/page.model'; // Mongoose model
import { Page } from '../../domain/entities/page.entity';

@Injectable({
  providedIn: 'root',
})
export class AppPageRepository implements PageRepository {
  async findById(id: string): Promise<Page | null> {
    const doc = await PageModel.findById(id).exec();
    return doc ? doc.toObject() as Page : null;
  }

  async save(page: Page): Promise<Page> {
    const doc = new PageModel(page);
    await doc.save();
    return doc.toObject() as Page;
  }

  async delete(id: string): Promise<void> {
    await PageModel.findByIdAndDelete(id).exec();
  }
}