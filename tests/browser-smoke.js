'use strict';
// Optional real-browser checks using synthetic data, never a user's Obsidian vault.
// Requires Playwright and Chromium (or set VP_BROWSER_CHANNEL=chrome/msedge).
// Run after scripts/build.js: node tests/browser-smoke.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');
const assert = require('assert');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const fake = Object.fromEntries(['Plugin', 'Modal', 'ItemView', 'PluginSettingTab', 'Setting', 'Notice', 'TFile', 'TFolder', 'Menu'].map((key) => [key, class {}]));
fake.addIcon = fake.setIcon = () => {};
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'obsidian') return fake;
  if (id.endsWith('kit-assets')) return {};
  return originalLoad.call(this, id, parent, main);
};
const { Store, DEFAULT_SETTINGS } = require('../src/plugin/store');
const { KitHost, STATE_DEFAULTS } = require('../src/plugin/host');
const { UsageTracker } = require('../src/core/usage');
const I = require('../src/kit/i18n');
globalThis.I18N = I;
require('../src/kit/i18n-obsidian');
require('../src/kit/i18n-zh-CN');
const box = { require: (id) => id === 'obsidian' ? fake : require(id), module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'main.js'), 'utf8') + "\nmodule.exports._assets = __require('plugin/main')('./kit-assets');", box);
const assets = box.module.exports._assets;

function fixture(language = 'zh-CN', firstRun = false) {
  const settings = new Store({ language, petName: '小纪', soundEnabled: false }, DEFAULT_SETTINGS, () => {});
  const state = new Store({ onboarded: !firstRun }, STATE_DEFAULTS, () => {});
  const usage = new UsageTracker();
  const plugin = {
    linkStats: () => ({ max: 3, total: 10 }), idleSeconds: () => 0,
    topFolders: () => ['测试笔记'], vaultNumbers: () => ({ notes: 5, chars: 12345, links: 10 }),
    baselineTotals: () => ({ c: 12345, l: 100, n: 5, s: 0 }),
    updateStatus() {}, relabel() {}, openHouse() {}, mountStage() {}, unmountStage() {},
    currentLanguage: () => I.resolveLanguage(settings.get('language'), 'zh'),
  };
  const host = new KitHost(plugin, { settings, state, usage });
  host.init();
  host.loading = false;
  host.recomputeGrowth();
  return { host, settings, state };
}

(async () => {
  const output = process.env.VP_SCREENSHOTS || path.join(root, '.test-output');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.VP_BROWSER_CHANNEL ? { channel: process.env.VP_BROWSER_CHANNEL } : {}) });
  const errors = [];
  let checked = 0;
  const hosts = [];
  async function open(kind, language = 'zh-CN', opts = {}) {
    const { host, settings, state } = fixture(language, opts.welcome);
    hosts.push(host);
    const page = await browser.newPage({ viewport: opts.narrow ? { width: 420, height: 900 } : { width: 1000, height: 880 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.exposeFunction('__getPayload', () => host.housePayload());
    await page.exposeFunction('__setSettings', (patch) => host.setSettings(patch));
    await page.exposeFunction('__onboarded', () => { state.set({ onboarded: true }); return host.housePayload(); });
    await page.setContent(`<!doctype html><html lang="${language}" class="${opts.dark ? 'theme-dark' : 'theme-light'} kc-${kind}"><head><meta charset="utf-8"><style>${kind === 'pet' ? assets.petCss : assets.houseCss}\n${assets.frameCss}</style></head><body>${kind === 'pet' ? assets.petBody : assets.houseBody}</body></html>`);
    await page.evaluate(() => {
      window.KC_OBSIDIAN = true;
      window.KC_STORE = { get: () => null, set: () => {} };
      window.callbacks = {};
      window.pet = new Proxy({}, { get(_target, key) {
        if (key === 'onboarded') return () => window.__onboarded();
        if (key.startsWith('on')) return (fn) => { window.callbacks[key] = fn; return () => {}; };
        if (key === 'get') return () => window.__getPayload();
        if (key === 'set') return (patch) => window.__setSettings(patch);
        if (key === 'copyCard' || key === 'copyText') return async () => false;
        return () => {};
      } });
    });
    await page.addScriptTag({ content: 'window.__runVaultPet = ' + assets.run.toString() });
    await page.evaluate((kind) => window.__runVaultPet(window, document, window.pet, kind), kind);
    if (kind === 'house') await page.waitForFunction(() => document.querySelector('#tabs .tx').textContent.length > 0);
    else await page.evaluate((config) => window.callbacks.onConfig(config), host.petConfig());
    return { page, host, settings };
  }
  async function clean(page, label) {
    const result = await page.evaluate(() => ({ text: document.body.innerText, width: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert.ok(!/[\uac00-\ud7a3]/.test(result.text.replace(/한국어/g, '')), label + ': Korean leaked');
    assert.ok(!/\b(?:item|ach|motion|obs|set|fr|quest|foodFx|toyHow)\.[\w.]+/.test(result.text), label + ': untranslated key');
    assert.ok(result.width <= result.viewport + 1, label + ': horizontal overflow');
    checked++;
  }
  try {
    const { page } = await open('house');
    for (const tab of ['home', 'achievements', 'wardrobe', 'shop', 'friends', 'workshop', 'stats', 'settings']) {
      await page.locator(`#tabs [data-tab="${tab}"]`).click();
      await clean(page, tab);
      await page.screenshot({ path: path.join(output, tab + '.png') });
      const subSelector = tab === 'shop' ? '[data-shop-page]' : tab === 'wardrobe' ? '[data-inv-page]' : null;
      if (subSelector) {
        const values = await page.locator(subSelector).evaluateAll((els) => els.map((e) => e.getAttribute('data-shop-page') || e.getAttribute('data-inv-page')));
        for (const value of values) {
          await page.locator(`${subSelector}[${tab === 'shop' ? 'data-shop-page' : 'data-inv-page'}="${value}"]`).click();
          await clean(page, tab + '/' + value);
        }
      }
    }
    const select = page.locator('select[data-key="language"]');
    assert.deepStrictEqual(await select.locator('option').allTextContents(), ['한국어', 'English', '简体中文', '跟随 Obsidian']);
    for (const [lang, text] of [['en', 'Home'], ['ko', '홈'], ['zh-CN', '首页'], ['auto', '首页']]) {
      await page.locator('select[data-key="language"]').selectOption(lang);
      await page.waitForFunction((text) => document.querySelector('[data-tab="home"] .tx').textContent === text, text);
      assert.strictEqual(await page.locator('html').getAttribute('lang'), lang === 'auto' ? 'zh-CN' : lang);
      checked++;
    }
    const narrow = await open('house', 'zh-CN', { narrow: true, dark: true });
    for (const tab of ['home', 'shop', 'workshop', 'settings']) {
      await narrow.page.locator(`#tabs [data-tab="${tab}"]`).click();
      await clean(narrow.page, 'narrow-dark/' + tab);
    }
    await narrow.page.screenshot({ path: path.join(output, 'narrow-dark.png') });
    const welcome = await open('house', 'zh-CN', { welcome: true });
    await welcome.page.locator('#welcome').waitFor({ state: 'visible' });
    for (let step = 0; step < 4; step++) {
      await clean(welcome.page, 'welcome/' + step);
      await welcome.page.locator('#w-next').click();
    }
    await welcome.page.locator('#welcome').waitFor({ state: 'hidden' });
    const pet = await open('pet');
    await pet.page.evaluate(() => {
      window.callbacks.onBubble({ text: '今天也一起写作吧！', kind: 'session' });
      window.callbacks.onLoading(0.5);
      window.callbacks.onState({ mood: 'active', growth: { stageKey: 'cat', level: 1 }, quiet: false, streak: 1 });
    });
    await pet.page.waitForFunction(() => document.querySelector('#bubble .text').textContent.includes('今天也一起写作吧'));
    await clean(pet.page, 'pet');
    await pet.page.screenshot({ path: path.join(output, 'pet.png') });
    assert.deepStrictEqual(errors, [], 'browser errors');
    console.log(`Browser smoke: ${checked} checks passed; screenshots: ${output}`);
  } finally {
    for (const host of hosts) host.destroy();
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
