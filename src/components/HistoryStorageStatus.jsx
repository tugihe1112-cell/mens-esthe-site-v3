import React from 'react';

export default function HistoryStorageStatus({ historyLoading, readError, saveError, deleteError, retryHistory, clearHistory }) {
  return (
    <div className="space-y-3 mb-5 text-sm">
      {historyLoading && <p role="status" className="text-slate-400">閲覧履歴を読み込み中です。</p>}
      {readError && <div role="alert" className="border border-amber-500/30 p-3 text-amber-200">
        <p>閲覧履歴を読み込めませんでした。端末の保存領域を確認して、再読込してください。</p>
        <button type="button" onClick={retryHistory} disabled={historyLoading} className="mt-2 min-h-11 underline">履歴を再読込</button>
      </div>}
      {saveError && <div role="alert" className="border border-amber-500/30 p-3 text-amber-200">
        <p>閲覧履歴を保存できませんでした。表示中の履歴は、この画面に保持しています。</p>
        {!readError && <button type="button" onClick={retryHistory} disabled={historyLoading} className="mt-2 min-h-11 underline">履歴を再読込</button>}
      </div>}
      {deleteError && <div role="alert" className="border border-red-500/30 p-3 text-red-300">
        <p>閲覧履歴を削除できませんでした。履歴はそのまま残っています。</p>
        <button type="button" onClick={clearHistory} disabled={historyLoading} className="mt-2 min-h-11 underline">削除を再試行</button>
      </div>}
    </div>
  );
}
