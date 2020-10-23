import { defineConfig } from 'dumi';
import sharedbConfig from './sharedb/config';
import sharedbMongoConfig from './sharedb-mongo/config';

// more config: https://d.umijs.org/config
export default defineConfig({
  title: 'ShareDB中文文档',
  mode: 'site', // doc | site
  base: '/sharedb-zh',
  publicPath: '/sharedb-zh/',
  exportStatic: {},
  styles: ['.__dumi-default-layout-toc {width: 160px !important;}'],
  resolve: {
    includes: ['.'],
  },
  locales: [
    ['zh-CN', '中文'],
    ['en-US', 'English'],
  ],
  // ssr: {},
  // exportStatic: {},
  menus: {
    sharedb: sharedbConfig,
    'sharedb-mongo': sharedbMongoConfig,
  },
  navs: [
    null,
    { title: 'Github', path: 'https://github.com/Rain120/sharedb-zh' },
  ],
});
