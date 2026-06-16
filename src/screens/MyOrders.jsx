import React from 'react';
import { Price, StatusBadge, Button, Avatar, EmptyState, Countdown, Icon, YData } from '../ds';

const { orders } = YData;

const css = `
.yo{max-width:980px;margin:0 auto;padding:24px;}
.yo__h1{font-size:26px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;margin-bottom:4px;}
.yo__sub{font-size:14px;color:var(--text-muted);margin-bottom:22px;}
.yo__list{display:flex;flex-direction:column;gap:12px;}
.yo__card{display:flex;gap:16px;align-items:center;background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:14px 16px;transition:box-shadow var(--dur-fast),border-color var(--dur-fast);cursor:pointer;}
.yo__card:hover{box-shadow:var(--shadow-md);border-color:var(--border-default);}
.yo__img{width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;flex:none;background:var(--surface-sunken);}
.yo__mid{flex:1;min-width:0;}
.yo__title{font-size:14px;font-weight:700;color:var(--text-strong);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.yo__meta{font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.yo__onum{font-family:var(--font-mono);}
.yo__right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex:none;min-width:160px;}
.yo__act{display:flex;gap:8px;align-items:center;}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

export default function MyOrders({ state = 'default', onOpenOrder }) {
  ensure();
  if (state === 'empty') {
    return <div className="yo"><div className="yo__h1">Mis órdenes</div>
      <EmptyState icon={<Icon.Inbox size={26} />} title="Todavía no tenés órdenes"
        description="Cuando compres o ganes una subasta, vas a verlas acá."
        actions={<Button onClick={() => onOpenOrder && onOpenOrder('home')}>Explorar el marketplace</Button>} /></div>;
  }
  return (
    <div className="yo">
      <div className="yo__h1">Mis órdenes</div>
      <div className="yo__sub">{orders.length} órdenes · como comprador</div>
      <div className="yo__list">
        {orders.map((o) => (
          <div className="yo__card" key={o.id} onClick={() => onOpenOrder && onOpenOrder(o.id)}>
            <img className="yo__img" src={o.img} alt="" />
            <div className="yo__mid">
              <div className="yo__title">{o.title}</div>
              <div className="yo__meta"><span className="yo__onum">#{o.id}</span> · {o.date} · <Avatar name={o.party} verified size={18} /> {o.party}</div>
            </div>
            <div className="yo__right">
              <Price value={o.amount} size="md" />
              <div className="yo__act">
                {o.status === 'PENDING' && <><Countdown endsAt={o.payBy} variant="order" format="inline" /><Button variant="primary" size="sm">Pagar</Button></>}
                {o.status === 'IN_TRANSIT' && <Button variant="primary" size="sm" iconLeft={<Icon.Check size={14} />}>Confirmar</Button>}
                {o.status === 'COMPLETED' && <Button variant="secondary" size="sm" iconLeft={<Icon.Star size={14} />}>Reseñar</Button>}
                {(o.status === 'CONFIRMED' || o.status === 'CANCELLED') && <StatusBadge kind="order" status={o.status} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
