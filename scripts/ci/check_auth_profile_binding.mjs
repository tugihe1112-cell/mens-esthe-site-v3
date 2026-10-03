/** 実AuthProvider・useAuth・閲覧権hook・画面を模擬通信で動かし、会員とプランの応答世代を検査する。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const mutation = process.env.AUTH_PROFILE_GUARD_MUTATION;
const mutations = {
  lateSuccess: ['src/contexts/AuthContext.jsx', "if (!isCurrentProfile(request)) return;\n      setAuth((current) => isCurrentProfile(request) ? { ...current, userPlan: plan, planStatus: 'ready' } : current);", "setAuth((current) => ({ ...current, userPlan: plan, planStatus: 'ready' }));"],
  lateError: ['src/contexts/AuthContext.jsx', "if (!isCurrentProfile(request)) return;\n      console.error('プロフィール取得エラー:', error);\n      setAuth((current) => isCurrentProfile(request) ? { ...current, userPlan: null, planStatus: 'error' } : current);", "setAuth((current) => ({ ...current, userPlan: null, planStatus: 'error' }));"],
  sameUserGeneration: ['src/contexts/AuthContext.jsx', 'request.generation === profileGenerationRef.current', 'true'],
  previousPlan: ['src/contexts/AuthContext.jsx', "setAuth({ user: nextUser, userPlan: nextUser ? null : 'free', planStatus: nextUser ? 'loading' : 'anonymous', loading: false });", "setAuth((current) => ({ user: nextUser, userPlan: nextUser ? current.userPlan : 'free', planStatus: nextUser ? 'loading' : 'anonymous', loading: false }));"],
  failureFree: ['src/contexts/AuthContext.jsx', "{ ...current, userPlan: null, planStatus: 'error' }", "{ ...current, userPlan: 'free', planStatus: 'ready' }"],
  noRetry: ['src/contexts/AuthContext.jsx', 'if (userRef.current) applyUser(userRef.current);', ''],
  oldSession: ['src/contexts/AuthContext.jsx', 'sessionGeneration !== sessionGenerationRef.current', 'false', true],
  oldSignIn: ['src/contexts/AuthContext.jsx', '&& signInGeneration === signInGenerationRef.current\n      && (sessionGeneration === sessionGenerationRef.current || userRef.current?.id === result.data.user.id)', ''],
  eventQuery: ['src/contexts/AuthContext.jsx', 'if (deferProfile) {', 'if (false && deferProfile) {'],
  unmountedWrite: ['src/contexts/AuthContext.jsx', 'mountedRef.current\n    && request.generation === profileGenerationRef.current\n    && request.userId === userRef.current?.id', 'true'],
  creditsPending: ['src/hooks/useViewingCredits.js', "const planStatus = providedPlanStatus ?? 'ready';", "const planStatus = 'ready';"],
  creditsRetry: ['src/hooks/useViewingCredits.js', "if (planStatus === 'error') retryPlan?.();", "if (planStatus === 'error') setAttempt((n) => n + 1);"],
  myPlanFree: ['src/pages/MyPage.jsx', "planStatus === 'loading' ? '会員プランを確認中…' : planStatus === 'error' ? '会員プランを確認できませんでした' :", ''],
};
if (mutation) assert.ok(mutations[mutation], `Unknown auth profile sabotage ${mutation}`);
function read(file) {
  const source = fs.readFileSync(file, 'utf8');
  if (mutations[mutation]?.[0] !== file) return source;
  const [, before, after, all] = mutations[mutation];
  assert.ok(source.includes(before), `Missing auth profile sabotage target ${mutation}`);
  return all ? source.split(before).join(after) : source.replace(before, after);
}
function compile(file, dependencies, extra = {}) {
  const code = ts.transpileModule(read(file), { compilerOptions: {
    jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    process: { env: { VITE_SUPABASE_URL: 'https://qa.supabase.invalid' } },
    console: { ...console, error() {} }, setTimeout, clearTimeout, ...extra,
  })(key => {
    assert.ok(Object.hasOwn(dependencies, key), `Unexpected auth QA dependency ${key}`);
    return dependencies[key];
  }, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};
const depsEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const noop = () => null;
const Link = ({ to, children, ...props }) => React.createElement('a', { ...props, href: to }, children);
const memberA = { id: 'qa-member-a', email: 'qa-a@example.invalid', user_metadata: { display_name: 'QA会員A' } };
const memberB = { id: 'qa-member-b', email: 'qa-b@example.invalid', user_metadata: { display_name: 'QA会員B' } };
const profile = plan => ({ data: { plan }, error: null });
const session = user => ({ data: { session: user ? { user } : null }, error: null });
const viewingUtils = compile('src/utils/viewingCredits.js', {});
const privateReview = { id: 'qa-review', user_id: 'qa-another-author', is_public: false, content: 'QA非公開本文の後半確認。'.repeat(30), rating: 4 };

function harness() {
  const slots = [];
  const effects = [];
  const contexts = new Map();
  const timers = new Map();
  const initial = deferred();
  const env = { profiles: [], credits: [], signIns: [], inEvent: false, subscribed: false, signOuts: 0, callback: null, auth: null, viewing: null, page: null, invite: null, card: null, snapshots: [], publicHtml: '' };
  let cursor = 0;
  let dirty = true;
  let setterCalls = 0;
  let timerId = 0;
  const hooks = {
    ...React,
    useContext(context) { assert.ok(contexts.has(context)); return contexts.get(context); },
    useState(initialValue) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initialValue === 'function' ? initialValue() : initialValue };
      return [slots[index].value, value => {
        setterCalls += 1;
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
      }];
    },
    useRef(initialValue) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { ref: { current: initialValue } };
      return slots[index].ref;
    },
    useMemo(fn, deps) {
      const index = cursor++;
      if (!slots[index] || !depsEqual(slots[index].deps, deps)) slots[index] = { deps, value: fn() };
      return slots[index].value;
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !depsEqual(slots[index].deps, deps)) {
        const cleanup = slots[index]?.cleanup;
        slots[index] = { deps, cleanup };
        effects.push(() => { cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  const clock = {
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const client = {
    from(table) {
      assert.equal(table, 'profiles');
      // 公式のonAuthStateChange契約を実行時にも守る。
      assert.equal(env.inEvent, false, 'profile query must leave the synchronous auth event callback');
      const request = deferred();
      const builder = {
        select(columns) { assert.equal(columns, 'plan'); return builder; },
        eq(column, userId) { assert.equal(column, 'id'); request.userId = userId; return builder; },
        single() { env.profiles.push(request); return request.promise; },
      };
      return builder;
    },
    auth: {
      getSession() { return initial.promise; },
      onAuthStateChange(callback) { env.callback = callback; env.subscribed = true; return { data: { subscription: { unsubscribe() { env.subscribed = false; } } } }; },
      signInWithPassword(credentials) { const request = { ...deferred(), credentials }; env.signIns.push(request); return request.promise; },
      signOut() { env.signOuts += 1; return Promise.resolve({ error: null }); },
      signUp() { throw new Error('Real registration is outside this guard'); },
    },
  };
  const authModule = compile('src/contexts/AuthContext.jsx', { react: hooks, '../lib/supabase': { supabase: client } }, clock);
  const shared = { react: hooks, '../contexts/AuthContext': authModule, '../utils/supabaseRest': { authHeaders: async () => ({ Authorization: 'Bearer QA' }) } };
  const viewing = compile('src/hooks/useViewingCredits.js', {
    ...shared, '../utils/viewingCredits.js': { fetchViewingCredits: (url, headers) => viewingUtils.fetchViewingCredits(url, headers, async (_url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer QA');
      const request = { ...deferred(), userId: new URL(url).searchParams.get('user_id')?.slice(3) };
      env.credits.push(request);
      return request.promise;
    }) },
  }, clock);
  const viewingModule = { useViewingCredits: () => env.viewing };
  const page = compile('src/pages/MyPage.jsx', {
    ...shared, '../components/LineIcon.jsx': noop, '../compat/router': { Link, useNavigate: () => noop },
    '../hooks/useViewingCredits.js': viewingModule, '../hooks/usePostedReviewCount.js': { usePostedReviewCount: () => ({ status: 'ready', count: 1 }) },
    'lucide-react': { LogOut: noop, PenLine: noop, Heart: noop, History: noop, Shield: noop }, '../components/Header': noop, '../components/SeoHead.jsx': noop,
  });
  const invite = compile('src/components/RegisterInvite.jsx', {
    react: hooks, '../compat/router': { Link }, '../contexts/AuthContext': authModule, '../hooks/useViewingCredits': viewingModule,
    '../utils/analytics': { trackEvent: noop }, '../utils/authRedirect.js': { withReturnTo: path => path }, '../utils/registerAnalytics': { trackRegisterCtaClick: noop }, '../data/siteCopy.js': { FREE_READ_NOTE: 'QA案内' },
  });
  const card = compile('src/components/ModernReviewCard.jsx', {
    ...shared, '../contexts/AuthContext.jsx': authModule, '../compat/router': { Link, useNavigate: () => noop },
    './ReviewLikeButton.jsx': noop, './ThanksBadgeButton.jsx': noop, '../utils/analytics': { trackEvent: noop },
    './ReviewStoryContent.jsx': ({ content }) => React.createElement('p', { 'data-qa-full-review': true }, content),
    '../utils/useReturnTo': { useReturnTo: () => '/qa' }, '../utils/authRedirect.js': { withReturnTo: path => path },
    '../utils/registerAnalytics': { trackRegisterCtaClick: noop }, './RatingFingerprint.jsx': { default: noop, hasFingerprint: () => false },
    '../features/reviews/reviewStory.mjs': { countReviewStoryChars: () => 0 }, '../hooks/useViewingCredits': viewingModule,
  });
  function flush() {
    for (let loop = 0; dirty; loop += 1) {
      assert.ok(loop < 20, 'auth profile render must not loop');
      dirty = false; cursor = 0;
      const provider = authModule.AuthProvider({ children: React.createElement('p', null, 'QA公開SSR本文') });
      env.publicHtml = renderToStaticMarkup(provider.props.children);
      contexts.set(provider.type, provider.props.value);
      env.auth = authModule.useAuth();
      env.viewing = viewing.useViewingCredits();
      env.page = page.default(); env.invite = invite.default({}); env.card = card.default({ review: privateReview });
      env.snapshots.push({ userId: env.auth.user?.id || null, userPlan: env.auth.userPlan, planStatus: env.auth.planStatus, loading: env.auth.loading, viewingStatus: env.viewing.status });
      effects.splice(0).forEach(effect => effect());
    }
  }
  function walk(element, nodes = []) {
    if (!element || typeof element !== 'object') return nodes;
    if (element.type) nodes.push(element);
    React.Children.forEach(element.props?.children, child => walk(child, nodes));
    return nodes;
  }
  const api = {
    env, initial,
    render() { dirty = true; flush(); },
    async settle() {
      for (let i = 0; i < 4; i += 1) {
        for (const [id, timer] of [...timers]) if (timer.delay === 0) { timers.delete(id); timer.fn(); }
        await new Promise(resolve => setImmediate(resolve)); flush();
      }
    },
    emit(user, event = user ? 'SIGNED_IN' : 'SIGNED_OUT') {
      env.inEvent = true;
      try { const returned = env.callback(event, user ? { user } : null); assert.equal(returned, undefined); } finally { env.inEvent = false; }
      flush();
    },
    html(kind = 'page') { flush(); return renderToStaticMarkup(env[kind]); },
    fullReview() { flush(); return walk(env.card).some(node => typeof node.type === 'function' && node.props.content === privateReview.content); },
    click(label, kind = 'page') {
      flush();
      const button = walk(env[kind]).find(node => node.type === 'button' && renderToStaticMarkup(React.createElement(React.Fragment, null, node.props.children)).includes(label));
      assert.ok(button, `Missing ${kind} retry button ${label}`); button.props.onClick(); flush();
    },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
    get setterCalls() { return setterCalls; },
  };
  flush();
  return api;
}
const lastProfile = (h, user = memberA) => h.env.profiles.filter(request => request.userId === user.id).at(-1);
async function start(user = memberA) {
  const h = harness();
  assert.equal(h.env.auth.loading, true);
  assert.ok(h.env.publicHtml.includes('QA公開SSR本文'), 'public SSR children stay visible before authentication');
  h.initial.resolve(session(user)); await h.settle();
  assert.equal(h.env.auth.user?.id, user?.id);
  assert.equal(h.env.auth.loading, false, 'auth can be ready while profile is pending');
  return h;
}
function assertPending(h, user) {
  assert.equal(h.env.auth.user?.id, user.id);
  assert.equal(h.env.auth.userPlan, null, 'previous plan cannot appear even in the first render');
  assert.equal(h.env.auth.planStatus, 'loading');
  assert.equal(h.env.viewing.status, 'loading');
  assert.ok(h.html().includes('会員プランを確認中') && !h.html().includes('無料会員') && !h.html().includes('読み放題プラン'));
  assert.ok(h.html('invite').includes('閲覧権を確認しています'));
  assert.equal(h.fullReview(), false, 'unconfirmed premium cannot unlock private review UI');
}

for (const lateOutcome of ['premium', 'failure']) {
  const h = await start(); const oldA = lastProfile(h);
  assertPending(h, memberA);
  assert.equal(h.env.credits.length, 0, 'credits must wait for the same user plan');
  h.emit(memberB); assertPending(h, memberB); await h.settle();
  lastProfile(h, memberB).resolve(profile('free')); await h.settle();
  assert.equal(h.env.auth.userPlan, 'free');
  assert.equal(h.env.credits.length, 1); assert.equal(h.env.credits[0].userId, memberB.id);
  h.env.credits[0].resolve({ ok: true, json: async () => [] }); await h.settle();
  if (lateOutcome === 'failure') oldA.reject(new Error('QA old user failure')); else oldA.resolve(profile('premium'));
  await h.settle();
  assert.equal(h.env.auth.user.id, memberB.id); assert.equal(h.env.auth.userPlan, 'free'); assert.equal(h.env.auth.planStatus, 'ready');
  assert.equal(h.env.viewing.status, 'expired'); assert.equal(h.fullReview(), false);
  assert.ok(h.env.snapshots.filter(row => row.userId === memberB.id).every(row => row.userPlan !== 'premium' && row.userPlan !== 'vip'));
  h.unmount();
}
// A premium → B pending: first render must clear the previously confirmed plan.
const switchPremium = await start(); lastProfile(switchPremium).resolve(profile('premium')); await switchPremium.settle();
assert.equal(switchPremium.env.viewing.status, 'active'); assert.equal(switchPremium.fullReview(), true);
switchPremium.emit(memberB); assertPending(switchPremium, memberB); switchPremium.unmount();

// Returning to the same account cannot revive its earlier profile request either.
const returnToA = await start(); const firstA = lastProfile(returnToA);
returnToA.emit(memberB); await returnToA.settle(); const pendingB = lastProfile(returnToA, memberB);
returnToA.emit(memberA); assertPending(returnToA, memberA); await returnToA.settle();
lastProfile(returnToA).resolve(profile('free')); await returnToA.settle();
firstA.resolve(profile('premium')); pendingB.resolve(profile('vip')); await returnToA.settle();
assert.equal(returnToA.env.auth.user.id, memberA.id); assert.equal(returnToA.env.auth.userPlan, 'free'); returnToA.unmount();

// Same-user refresh requests also have independent generations. Old success and failure lose.
for (const oldFails of [false, true]) {
  const h = await start(); const old = lastProfile(h); h.env.auth.retryPlan(); h.render(); await h.settle();
  const fresh = lastProfile(h); assert.notEqual(old, fresh);
  fresh.resolve(profile('vip')); await h.settle();
  if (oldFails) old.reject(new Error('QA superseded same-user failure')); else old.resolve(profile('free'));
  await h.settle(); assert.equal(h.env.auth.userPlan, 'vip'); assert.equal(h.env.auth.planStatus, 'ready'); assert.equal(h.env.viewing.status, 'active'); h.unmount();
}
// Logout must invalidate requests through both event and the public signOut operation.
for (const byAction of [false, true]) {
  const h = await start(); const old = lastProfile(h);
  if (byAction) { await h.env.auth.signOut(); h.render(); assert.equal(h.env.signOuts, 1); } else h.emit(null);
  old.resolve(profile('premium')); await h.settle();
  assert.equal(h.env.auth.user, null); assert.equal(h.env.auth.userPlan, 'free'); assert.equal(h.env.auth.planStatus, 'anonymous'); assert.equal(h.env.viewing.status, 'anonymous'); h.unmount();
}
// The real MyPage and RegisterInvite distinguish profile failure and retry the current user's profile.
for (const retryFrom of ['page', 'invite']) {
  const h = await start(); lastProfile(h).resolve({ data: null, error: { status: 503 } }); await h.settle();
  assert.equal(h.env.auth.planStatus, 'error'); assert.equal(h.env.auth.userPlan, null); assert.equal(h.env.viewing.status, 'error');
  assert.equal(h.env.credits.length, 0); assert.equal(h.fullReview(), false);
  assert.ok(h.html().includes('会員プランを確認できませんでした') && !h.html().includes('無料会員') && !h.html().includes('閲覧権の期限切れ'));
  h.click(retryFrom === 'page' ? '会員プランを再確認' : '閲覧権を再確認する', retryFrom); await h.settle(); assertPending(h, memberA);
  lastProfile(h).resolve(profile('premium')); await h.settle(); assert.equal(h.env.auth.planStatus, 'ready'); assert.equal(h.env.viewing.status, 'active'); assert.equal(h.fullReview(), true); h.unmount();
}
for (const data of [null, { plan: 'qa-unknown-plan' }]) {
  const h = await start(); lastProfile(h).resolve({ data, error: null }); await h.settle();
  assert.equal(h.env.auth.planStatus, 'error'); assert.equal(h.env.auth.userPlan, null); assert.equal(h.env.viewing.status, 'error'); h.unmount();
}
// getSession arriving after an event must not restore an old account or end its profile checking state.
for (const oldFails of [false, true]) {
  const h = harness(); h.emit(memberB); await h.settle();
  if (oldFails) h.initial.reject(new Error('QA old session failure')); else h.initial.resolve(session(memberA));
  await h.settle(); assert.equal(h.env.auth.user.id, memberB.id); assert.equal(h.env.auth.planStatus, 'loading');
  assert.equal(h.env.profiles.filter(request => request.userId === memberA.id).length, 0); h.unmount();
}
// signIn uses the same profile loader and returns a known session without waiting for a profile response.
const login = await start(null); const signingIn = login.env.auth.signIn('qa@example.invalid', 'qa-placeholder');
login.env.signIns[0].resolve({ data: { user: memberA }, error: null }); await signingIn; login.render(); await login.settle();
assertPending(login, memberA); assert.equal(login.env.profiles.length, 1); login.unmount();
const loginEvent = await start(null); const eventLogin = loginEvent.env.auth.signIn('qa@example.invalid', 'qa-placeholder');
loginEvent.emit(memberA); await loginEvent.settle(); const oldEventProfile = lastProfile(loginEvent);
loginEvent.env.signIns[0].resolve({ data: { user: memberA }, error: null }); await eventLogin; loginEvent.render(); await loginEvent.settle();
lastProfile(loginEvent).resolve(profile('free')); await loginEvent.settle(); oldEventProfile.resolve(profile('premium')); await loginEvent.settle();
assert.equal(loginEvent.env.auth.userPlan, 'free'); loginEvent.unmount();
// Another account's event, a newer signIn, logout, or unmount wins over old signIn success.
for (const transition of ['member', 'newer-login', 'logout', 'unmount']) {
  const h = await start(null); const oldLogin = h.env.auth.signIn('qa-old@example.invalid', 'qa-placeholder');
  if (transition === 'member') h.emit(memberB);
  if (transition === 'logout') await h.env.auth.signOut();
  if (transition === 'newer-login') {
    const freshLogin = h.env.auth.signIn('qa-new@example.invalid', 'qa-placeholder'); h.env.signIns[1].resolve({ data: { user: memberB }, error: null }); await freshLogin;
  }
  if (transition === 'unmount') h.unmount();
  const writes = h.setterCalls; h.env.signIns[0].resolve({ data: { user: memberA }, error: null }); await oldLogin; await h.settle();
  assert.equal(h.env.profiles.filter(request => request.userId === memberA.id).length, 0);
  if (transition === 'unmount') assert.equal(h.setterCalls, writes); else assert.equal(h.env.auth.user?.id || null, transition === 'logout' ? null : memberB.id);
  h.unmount();
}
// Pending profile requests cannot update React state after unmount, for either outcome.
for (const fail of [false, true]) {
  const h = await start(); const old = lastProfile(h); h.unmount(); const writes = h.setterCalls;
  if (fail) old.reject(new Error('QA unmounted profile error')); else old.resolve(profile('premium'));
  await h.settle(); assert.equal(h.setterCalls, writes, 'unmounted provider must not call a state setter'); assert.equal(h.env.subscribed, false);
}
// Free accounts still use the real expires_at contract; positive cumulative days do not grant expired access.
const credits = await start(); lastProfile(credits).resolve(profile('free')); await credits.settle();
credits.env.credits[0].resolve({ ok: true, json: async () => [{ credits_days: 0, expires_at: new Date(Date.now() + 60000).toISOString() }] }); await credits.settle();
assert.equal(credits.env.viewing.status, 'active'); assert.equal(credits.fullReview(), true);
credits.env.viewing.retry(); credits.render(); await credits.settle();
credits.env.credits.at(-1).resolve({ ok: true, json: async () => [{ credits_days: 99, expires_at: new Date(Date.now() - 60000).toISOString() }] }); await credits.settle();
assert.equal(credits.env.viewing.status, 'expired'); assert.equal(credits.fullReview(), false); credits.unmount();
console.log('✅ AuthProvider: 実Provider/useAuth/閲覧権/画面の会員・同会員世代逆転、失敗→再試行、初回描画、ログアウト、アンマウント、認証復帰と期限契約を検証');
