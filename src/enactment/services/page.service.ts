import { inject } from '@angular/core';

import { PAGE_REPOSITORY, PageRepository } from '../../domain/repository/page.repository.interface';

export class PageService {
  constructor(private readonly repo: PageRepository = inject(PAGE_REPOSITORY)) {}

  async doSomethingWithPage(id: string) {
    const page = await this.repo.findById(id);
    console.debug(page);
  }
}