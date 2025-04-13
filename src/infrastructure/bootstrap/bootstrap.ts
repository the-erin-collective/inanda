import type { ApplicationRef } from '@angular/core';

export type BootstrapFn = () => Promise<ApplicationRef>;

let bootstrap: BootstrapFn;

export function registerBootstrap(fn: BootstrapFn) {
  bootstrap = fn;
}

export async function runBootstrap(): Promise<ApplicationRef> {
  if (!bootstrap) throw new Error('No bootstrap function registered');
  return await bootstrap();
}