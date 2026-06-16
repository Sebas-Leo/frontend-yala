import React from 'react';
import { Button, Icon, YData } from '../ds';

const { notifications } = YData;

const css = `
.yn{max-width:560px;margin:0 auto;padding:24px;}
.yn__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.yn__h1{font-size:22px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;}
.yn__list{display:flex;flex-direction:column;gap:8px;}
.yn__item{display:flex;gap:12px;padding:14px;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);background:var(--surface-card);position:relative;cursor:pointer;}
.yn__item--unread{background:var(--brand-subtle);border-color:var(--brand-border);}
.yn__ic{width:36px;height:36px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;}
.yn__body{flex:1;min-width:0;padding-right:14px;}
.yn__tt{font-size:14px;font-weight:700;color:var(--text-strong);}
.yn__msg{font-size:13px;color:var(--text-muted);line-height:1.45;margin-top:2px;}
.yn__time{font-size:11px;color:var(--text-subtle);font-family:var(--font-mono);margin-top:6px;}
.yn__dot{width:8px;height:8px;border-radius:50%;background:var(--brand);position:absolute;top:16px;right:14px;}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

const TONE_BG = {
  warning: ['var(--warning-bg)', 'var(--warning)'],
  live: ['var(--live-subtle)', 'var(--live-hover)'],
  success: ['var(--success-bg)', 'var(--success)'],
  brand: ['var(--brand-subtle)', 'var(--brand)'],
};

export default function Notifications() {
  ensure();
  const [items, setItems] = React.useState(notifications);
  const unread = items.filter((n) => !n.read).length;
  const markAll = () => setItems((x) => x.map((n) => ({ ...n, read: true })));
  return (
    <div className="yn">
      <div className="yn__head">
        <div className="yn__h1">Notificaciones {unread > 0 && <span style={{ color: 'var(--live)', fontSize: 16 }}>· {unread}</span>}</div>
        <Button variant="ghost" size="sm" onClick={markAll} disabled={unread === 0}>Marcar todas como leídas</Button>
      </div>
      <div className="yn__list">
        {items.map((n) => {
          const [bg, col] = TONE_BG[n.tone] || TONE_BG.brand;
          const I = Icon[n.icon] || Icon.Bell;
          return (
            <div key={n.id} className={`yn__item${!n.read ? ' yn__item--unread' : ''}`} onClick={() => setItems((x) => x.map((m) => m.id === n.id ? { ...m, read: true } : m))}>
              <div className="yn__ic" style={{ background: bg, color: col }}><I size={18} /></div>
              <div className="yn__body">
                <div className="yn__tt">{n.title}</div>
                <div className="yn__msg">{n.msg}</div>
                <div className="yn__time">{n.time}</div>
              </div>
              {!n.read && <span className="yn__dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
