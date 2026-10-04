import React from 'react';
import LineIcon from './LineIcon.jsx';
import { trackEvent } from '../utils/analytics';
import { officialLinksFor } from '../utils/officialLinks.js';

// 口コミを読んだあとの「公式で出勤を見て予約する」への道（2026-10-05）。行き先の決め方は utils/officialLinks.js。
// ホームの口コミ（開いた中）・セラピストのページの2か所で同じ部品を使う。画面ごとに書き分けない。
// ⚠️ 新しいタブで開く（このサイトのタブは残す＝戻ってきて他の口コミも読める）。外部サイトであることを読み上げでも伝える。
// ⚠️ 押した数は click_outbound で数える（店へ何件送ったか＝D-003 の中立を保ったまま見せられる唯一の実績）。

const LABEL = {
  therapist_profile: '公式プロフィール',
  roster: '公式の在籍一覧',
  official: '店の公式サイト',
  schedule: '出勤表',
};

export default function OfficialLinks({ shop, therapist, notListed = false, placement, className = '', heading = true }) {
  const { primary, schedule, website } = officialLinksFor({ shop, therapist, notListed });
  if (!primary && !schedule) return null;
  const track = (kind) => () => trackEvent('click_outbound', {
    link_type: kind,
    shop_id: shop?.id || null,
    shop_name: shop?.name || null,
    therapist_id: therapist?.id || null,
    placement: placement || null,
  });
  const ext = <span className="sr-only">（公式サイト・新しいタブで開きます）</span>;
  // ⚠️ スマホ（375px）の2列では、アイコンの幅ぶん「店の公式サ…」と切れた（2026-10-05 描画して発見）。2列のときアイコンは sm 以上だけ。
  const btn = 'inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-bold transition active:scale-[0.98]';
  const both = primary && schedule;
  return (
    <div className={className} data-role="official-links">
      {heading && (
        <p className="mb-1.5 text-slate-400" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
          {notListed ? '店の公式サイトで最新の在籍を確認' : '公式サイトで出勤を見て予約'}
        </p>
      )}
      <div className={both ? 'grid grid-cols-2 gap-2' : 'flex'}>
        {primary && (
          <a
            href={primary.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={track(primary.kind)}
            className={`${btn} ${both ? '' : 'w-full'} border-pink-500 text-pink-100 hover:bg-pink-500/10`}
          >
            <LineIcon name={primary.kind === 'therapist_profile' ? 'person' : 'globe'} size={15} className={both ? 'hidden shrink-0 sm:inline' : 'shrink-0'} />
            <span className="truncate">{LABEL[primary.kind]}</span>
            <span aria-hidden="true">↗</span>{ext}
          </a>
        )}
        {schedule && (
          <a
            href={schedule.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={track('schedule')}
            className={`${btn} ${both ? '' : 'w-full'} border-slate-600 text-slate-100 hover:border-slate-400`}
          >
            <LineIcon name="clock" size={15} className={both ? 'hidden shrink-0 sm:inline' : 'shrink-0'} />
            <span className="truncate">{LABEL.schedule}</span>
            <span aria-hidden="true">↗</span>{ext}
          </a>
        )}
      </div>
      {website && (
        <a
          href={website.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={track('official')}
          className="mt-1 inline-flex min-h-11 items-center gap-1 text-slate-300 hover:text-pink-300"
          style={{ fontSize: '12px' }}
        >
          {LABEL.official}<span aria-hidden="true">↗</span>{ext}
        </a>
      )}
    </div>
  );
}
