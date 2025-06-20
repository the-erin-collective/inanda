import { clientRepositoryFactoryProviders } from '../../infrastructure/providers/repository/client-repository-factory.providers';

// Export the providers under both the new and old names for backward compatibility
export const repositoryProviders = clientRepositoryFactoryProviders;
export { clientRepositoryFactoryProviders };