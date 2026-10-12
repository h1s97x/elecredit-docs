import { defineConfig } from 'vitepress';

/**
 * Elecredit（元素数智企业风控）文档站
 *
 * 读者：接入方开发者（Node / Python / 任意语言）与 AI Agent。
 * 内容边界：只讲「怎么接、怎么签、10 个端点是什么」。
 * 架构决策、内部运行手册、发布治理属于代码仓文档（elecredit-api 的 docs/ 与 wiki/），不进本站。
 *
 * 单一来源约定（重要）：
 * - 端点清单的事实源是代码仓 elecredit-cli/src/contracts/remote-capabilities.ts、
 *   sdk/elecredit/endpoints.py 与 docs/api/elecredit/。
 *   本站只做面向读者的重写；`pnpm check:endpoints` 会校验本站 api/ 下的端点页
 *   与清单一一对应（少一篇、路径写错都会失败），防止出现「代码 10 个、文档 8 个」。
 */

/** 中文分词：MiniSearch 默认按空格切词，纯中文内容会退化成整段一个 token，⌘K 搜不到东西 */
const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

/**
 * 代码仓地址（可选，由构建环境注入）。
 * 本站面向公网，**不硬编码内网地址**；未注入时「编辑此页」与仓库入口不渲染。
 */
const docsRepoUrl = process.env.DOCS_REPO_URL?.trim().replace(/\/+$/, '') || '';

/**
 * 「编辑此页」的完整前缀（可选）。
 * 各托管平台路径格式不同：GitHub 是 `<repo>/blob/main`，CNB 是 `<repo>/-/blob/main`。
 * 这里不猜平台，由构建环境直接给前缀，避免生成一个点了 404 的链接。
 */
const docsEditLink = process.env.DOCS_EDIT_LINK?.trim().replace(/\/+$/, '') || '';

export default defineConfig({
  lang: 'zh-CN',
  title: 'Elecredit',
  titleTemplate: ':title · Elecredit 企业风控数据',
  description: 'Elecredit（元素数智企业风控）REST API、Node.js CLI 与 Python SDK 接入文档',
  /**
   * GitHub Pages 对无扩展名 URL 不做重写，开启 cleanUrls 会导致内页 404。
   * 故默认关闭（链接带 .html，任何静态托管都能直接用）；
   * 托管在支持重写的平台（nginx / Netlify / Vercel）时可设 CLEAN_URLS=1 打开。
   */
  cleanUrls: process.env.CLEAN_URLS === '1',
  lastUpdated: true,
  // README 是给维护者看的（怎么本地起、怎么发布），不作为站点页面
  srcExclude: ['README.md'],
  metaChunk: true,
  head: [
    ['meta', { name: 'theme-color', content: '#0b66ff' }],
    ['meta', { name: 'robots', content: 'index,follow' }],
  ],
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/overview', activeMatch: '/guide/' },
      { text: 'API 参考', link: '/api/', activeMatch: '/api/' },
      { text: 'Node.js CLI', link: '/guide/node-cli', activeMatch: '/guide/node-cli' },
      { text: 'Python SDK', link: '/guide/python-sdk', activeMatch: '/guide/python-sdk' },
      { text: '常见问题', link: '/guide/faq', activeMatch: '/guide/faq' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          collapsed: false,
          items: [
            { text: '项目总览', link: '/guide/overview' },
            { text: '快速开始', link: '/guide/quick-start' },
          ],
        },
        {
          text: '认证与签名',
          collapsed: false,
          items: [
            { text: '凭据配置', link: '/guide/authentication' },
            { text: '签名算法', link: '/guide/signature' },
          ],
        },
        {
          text: '接入方式',
          collapsed: false,
          items: [
            { text: 'Node.js CLI', link: '/guide/node-cli' },
            { text: 'Python SDK', link: '/guide/python-sdk' },
            { text: 'Agent Skill', link: '/guide/agent-skill' },
          ],
        },
        {
          text: '排障',
          collapsed: false,
          items: [
            { text: '错误码', link: '/guide/errors' },
            { text: '常见问题', link: '/guide/faq' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API 参考',
          collapsed: false,
          items: [{ text: '总览与通用约定', link: '/api/' }],
        },
        {
          text: '工商域（A 系列）',
          collapsed: false,
          items: [
            { text: 'A07 企业模糊查询', link: '/api/fuzzy' },
            { text: 'A03 工商深度查询', link: '/api/deep' },
            { text: 'A04 大中小微划型', link: '/api/scale' },
          ],
        },
        {
          text: '税务域（B 系列）',
          collapsed: false,
          items: [{ text: 'B06 税务信用', link: '/api/tax' }],
        },
        {
          text: '招投标域（B 系列）',
          collapsed: false,
          items: [{ text: 'B04 招投标信息', link: '/api/bidding' }],
        },
        {
          text: '风险域（D 系列）',
          collapsed: false,
          items: [
            { text: 'D07 行政处罚', link: '/api/admin-punishment' },
            { text: 'D11 司法查询', link: '/api/judicial' },
          ],
        },
        {
          text: '诉讼域（D 系列）',
          collapsed: false,
          items: [{ text: 'D14 限制高消费人员', link: '/api/xgbzxr' }],
        },
        {
          text: '图谱与实控人',
          collapsed: false,
          items: [
            { text: 'F09 企业股权图谱', link: '/api/graph' },
            { text: 'P0020019 实控人', link: '/api/actual-controller' },
          ],
        },
      ],
    },

    // 搜索：本地索引（构建期生成，不依赖任何外部服务，离线/内网同样可用）
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text: string) =>
              [...segmenter.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment),
            processTerm: (term: string) => term.toLowerCase(),
          },
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
      },
    },

    outline: { level: [2, 3], label: '本页目录' },
    lastUpdated: {
      text: '最后更新',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' },
    },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    externalLinkIcon: true,
    // 未配置时不给编辑入口：宁可不显示，也不指向一个点了会 404 的地址
    editLink: docsEditLink
      ? { pattern: `${docsEditLink}/:path`, text: '在仓库中编辑此页' }
      : undefined,
    footer: {
      message: '企业风控数据接入文档',
      copyright: 'Elecredit · 元素数智',
    },
    socialLinks: docsRepoUrl ? [{ icon: 'github', link: docsRepoUrl }] : [],
  },
});
