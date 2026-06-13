import { MockProvider } from './mock';
// import { BigQueryProvider } from './bigquery'; // Uncomment to use BigQuery

export const dataProvider = new MockProvider();
// export const dataProvider = new BigQueryProvider(); // Swap to this for production
