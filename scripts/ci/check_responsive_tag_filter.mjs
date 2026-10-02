/** A08/A10: 実フックの幅変更・キーボード・後始末と、店舗/ブランドの共通配線を検査する。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TAG_CATEGORIES } from '../../src/data/constants.js';
import { summarizeReviews } from '../../src/utils/reviewIdentity.js';

const hookPath = 'src/hooks/useResponsiveFilterSheet.js';
const sidebarPath = 'src/components/TagFilterSidebar.jsx';
const hookSource = fs.readFileSync(hookPath, 'utf8');
const sidebarSource = fs.readFileSync(sidebarPath, 'utf8');
const pages = ['src/pages/ShopDetailPage.jsx', 'src/pages/BrandPage.jsx'];

function compile(source, dependencies, globals = {}) {
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React,
    esModuleInterop: true,
  } }).outputText;
  const compiled = { exports: {} };
  const run = vm.runInNewContext(`(function(require,module,exports){${output}\n})`, globals);
  run((name) => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`);
    return dependencies[name];
  }, compiled, compiled.exports);
  return compiled.exports;
}

function browser(width = 768, overflow = 'scroll') {
  const keyListeners = new Set();
  const mediaListeners = new Set();
  const doc = {
    body: { style: { overflow } }, activeElement: null,
    addEventListener(type, callback) { assert.equal(type, 'keydown'); keyListeners.add(callback); },
    removeEventListener(type, callback) { assert.equal(type, 'keydown'); keyListeners.delete(callback); },
  };
  const element = (name) => ({
    name, isConnected: true, visible: true,
    focus() { doc.activeElement = this; },
    getClientRects() { return this.visible ? [1] : []; },
  });
  const opener = element('opener');
  const closeButton = element('close');
  const tagButton = element('last tag');
  const panel = element('panel');
  panel.querySelectorAll = () => [closeButton, tagButton];
  panel.contains = (target) => [panel, closeButton, tagButton].includes(target);
  const media = {
    matches: width >= 1024,
    addEventListener(type, callback) { assert.equal(type, 'change'); mediaListeners.add(callback); },
    removeEventListener(type, callback) { assert.equal(type, 'change'); mediaListeners.delete(callback); },
  };
  const win = { matchMedia(query) {
    assert.equal(query, '(min-width: 1024px)', 'JS and lg CSS must use the same boundary');
    return media;
  } };
  doc.activeElement = opener;
  return {
    doc, win, panel, opener, closeButton, tagButton, keyListeners, mediaListeners,
    resize(nextWidth) {
      media.matches = nextWidth >= 1024;
      opener.visible = !media.matches;
      closeButton.visible = !media.matches;
      for (const listener of mediaListeners) listener({ matches: media.matches });
    },
    key(key, shiftKey = false) {
      const event = { key, shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
      for (const listener of keyListeners) listener(event);
      return event;
    },
  };
}

// Reactのeffect順とcleanupを保った小さなホスト。実フック本文を実行し、公開stateとDOMを確認する。
function hookHost(source, env) {
  const slots = [];
  let cursor = 0;
  let pending = [];
  let changed = false;
  const sameDeps = (left, right) => left && right && left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initial };
      return [slots[index].value, (value) => {
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (!Object.is(next, slots[index].value)) changed = true;
        slots[index].value = next;
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useId() { cursor++; return 'qa-filter'; },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        pending.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const hookModule = compile(source, { react: hooks }, { window: env.win, document: env.doc });
  const host = {
    state: null,
    render(pageKey = 'page-a') {
      for (let attempts = 0; attempts < 5; attempts++) {
        cursor = 0; pending = []; changed = false;
        host.state = hookModule.useResponsiveFilterSheet(pageKey);
        host.state.openerRef.current = env.opener;
        host.state.panelRef.current = env.panel;
        pending.forEach((effect) => effect());
        if (!changed) return host.state;
      }
      assert.fail('filter hook did not settle');
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
  host.render();
  return host;
}

function verifyHook(source) {
  for (const [start, end] of [[768, 1024], [390, 1440]]) {
    const env = browser(start);
    const host = hookHost(source, env);
    host.state.open(); host.render();
    assert.equal(host.state.isOpen, true);
    assert.equal(env.doc.body.style.overflow, 'hidden');
    assert.equal(env.doc.activeElement, env.closeButton, 'initial focus belongs inside the dialog');
    env.tagButton.focus();
    assert.equal(env.key('Tab').prevented, true);
    assert.equal(env.doc.activeElement, env.closeButton, 'Tab must not leave modal');
    assert.equal(env.key('Tab', true).prevented, true);
    assert.equal(env.doc.activeElement, env.tagButton);
    env.opener.focus();
    env.key('Tab');
    assert.equal(env.doc.activeElement, env.closeButton, 'outside focus must return inside modal');
    env.resize(end);
    assert.equal(env.doc.body.style.overflow, 'scroll', 'desktop resize immediately releases body');
    host.render();
    assert.equal(host.state.isOpen, false);
    assert.equal(env.keyListeners.size, 0);
    assert.equal(env.mediaListeners.size, 0);
    assert.equal(env.doc.activeElement, env.panel, 'desktop must not focus the hidden opener');
    host.state.open(); host.render();
    assert.equal(host.state.isOpen, false, 'desktop cannot open a mobile dialog');
    env.resize(start);
    host.state.open(); host.render();
    assert.equal(env.key('Escape').prevented, true);
    host.render();
    assert.equal(host.state.isOpen, false);
    assert.equal(env.doc.body.style.overflow, 'scroll');
    assert.equal(env.doc.activeElement, env.opener, 'Escape returns focus to the opener');
    host.state.open(); host.render();
    host.state.close(); host.render();
    assert.equal(env.doc.activeElement, env.opener, 'close/backdrop callbacks return focus');
    host.state.open(); host.render();
    host.render('page-b');
    assert.equal(host.state.isOpen, false, 'changing shop/brand route releases the old dialog');
    assert.equal(env.doc.body.style.overflow, 'scroll');
    host.state.open(); host.render('page-b');
    env.opener.isConnected = false;
    host.unmount();
    assert.equal(env.doc.body.style.overflow, 'scroll', 'unmount releases body even when opener is gone');
    assert.equal(env.keyListeners.size, 0);
    assert.equal(env.mediaListeners.size, 0);
  }
  const env = browser(390, '');
  const host = hookHost(source, env);
  host.state.open(); host.render(); host.unmount();
  assert.equal(env.doc.body.style.overflow, '', 'restore the exact prior inline style');
  const empty = browser(); empty.panel.querySelectorAll = () => [];
  const emptyHost = hookHost(source, empty);
  emptyHost.state.open(); emptyHost.render();
  assert.equal(empty.doc.activeElement, empty.panel);
  assert.equal(empty.key('Tab').prevented, true);
  emptyHost.unmount();
}

function jsxProps(node, tree) {
  return Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute)
    .map((attribute) => [attribute.name.getText(tree), attribute.initializer?.getText(tree)]));
}
function verifyPage(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let filter, opener, memo;
  function visit(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node))) {
      if (node.tagName.getText(tree) === 'TagFilterSidebar') filter = node;
      if (node.tagName.getText(tree) === 'TagFilterButton') opener = node;
    }
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'tagCounts') memo = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(filter && opener && memo, `${filename}: shared filter and counts must exist`);
  assert.match(source, /useResponsiveFilterSheet\((?:shopId|brandId)\)/, `${filename}: real hook call required`);
  const filterProps = jsxProps(filter, tree);
  const buttonProps = jsxProps(opener, tree);
  for (const [name, value] of Object.entries({ onClose: '{closeFilter}', isOpen: '{isFilterOpen}', panelRef: '{filterPanelRef}', dialogId: '{filterDialogId}' })) {
    assert.equal(filterProps[name], value, `${filename}: sidebar ${name}`);
  }
  for (const [name, value] of Object.entries({ onOpen: '{openFilter}', isOpen: '{isFilterOpen}', openerRef: '{filterOpenerRef}', dialogId: '{filterDialogId}' })) {
    assert.equal(buttonProps[name], value, `${filename}: opener ${name}`);
  }
  assert.doesNotMatch(source, /document\.body\.style\.overflow\s*=/, 'pages must use shared lock cleanup');
  const tag = TAG_CATEGORIES[0].tags[0];
  const people = [{ id: 'person-a' }, { id: 'person-b' }];
  const reviewTagMap = {
    'person-a': summarizeReviews([{ tags: [tag] }, { tags: [tag] }]).tags,
    'person-b': summarizeReviews([{ tags: [tag] }]).tags,
  };
  const count = vm.runInNewContext(`(${memo.arguments[0].getText(tree)})()`, {
    TAG_CATEGORIES, therapists: people, roster: people, reviewTagMap,
  });
  assert.equal(count[tag], 2, '2 reviews on A + 1 on B must still count 2 people');
  return { tag, count };
}

function verifySidebar(source, count, tag) {
  const sidebarModule = compile(source, { react: React, '../data/constants': { TAG_CATEGORIES } });
  const html = renderToStaticMarkup(React.createElement(sidebarModule.TagFilterSidebar, {
    tagCounts: count, isOpen: true, dialogId: 'qa-tags', onClose() {},
  }));
  assert.ok(html.includes('数字は、そのタグが付いたセラピストの人数です。'));
  assert.ok(!html.includes('数字は付いた口コミの件数'));
  assert.ok(html.includes(`${tag}<span class="text-slate-400">2</span>`));
  assert.ok(html.includes('role="dialog"') && html.includes('aria-modal="true"') && html.includes('aria-labelledby="qa-tags-title"'));
  for (const css of ['lg:inset-auto', 'lg:bottom-auto', 'lg:sticky', 'lg:block']) assert.ok(html.includes(css), `desktop needs ${css}`);
  const empty = renderToStaticMarkup(React.createElement(sidebarModule.TagFilterSidebar, { tagCounts: {} }));
  assert.ok(empty.includes('<aside') && empty.includes('lg:block') && empty.includes(tag), '0-tag desktop sidebar must remain present');
  assert.ok(!empty.includes('role="dialog"'), 'closed sidebar is not a modal');
  const opener = renderToStaticMarkup(React.createElement(sidebarModule.TagFilterButton, { isOpen: true, dialogId: 'qa-tags' }));
  assert.ok(opener.includes('aria-expanded="true"') && opener.includes('aria-controls="qa-tags"') && opener.includes('lg:hidden'));
}

verifyHook(hookSource);
let fixture;
for (const filename of pages) fixture = verifyPage(fs.readFileSync(filename, 'utf8'), filename);
verifySidebar(sidebarSource, fixture.count, fixture.tag);

// 妨害検証: 実ソースの独立した契約を壊し、各動作検査が確実に失敗することを確認する。
assert.throws(() => verifyHook(hookSource.replace('(min-width: 1024px)', '(min-width: 768px)')), /same boundary/);
assert.throws(() => verifyHook(hookSource.replaceAll('doc.body.style.overflow = previousOverflow;', '')), /releases body/);
assert.throws(() => verifyHook(hookSource.replace("event.key === 'Escape'", "event.key === 'Unused'")), /false !== true/);
assert.throws(() => verifyHook(hookSource.replace('focus(returnTarget);', '')), /Escape returns focus/);
assert.throws(() => verifyHook(hookSource.replace("desktop.removeEventListener('change', onBoundaryChange);", '')), /1 !== 0/);
assert.throws(() => verifySidebar(sidebarSource.replace('lg:bottom-auto', ''), fixture.count, fixture.tag), /desktop needs/);
assert.throws(() => verifySidebar(sidebarSource.replace('セラピストの人数', '口コミの件数'), fixture.count, fixture.tag));
assert.throws(() => verifyPage(fs.readFileSync(pages[1], 'utf8').replace('onOpen={openFilter}', 'onOpen={() => {}}'), pages[1]), /opener onOpen/);

console.log('✅ タグシート: 768→1024/390→1440・Escape/Tab・フォーカス・unmount/経路変更・共通配線・人物数・8妨害検証');
