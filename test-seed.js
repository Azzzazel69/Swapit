import { api } from './services/api';
api.seedDemoDatabase().then(() => console.log('Done')).catch(console.error);
