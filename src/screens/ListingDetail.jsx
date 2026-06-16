import React from 'react';
import { useParams } from 'react-router-dom';
import { Price, Avatar, ReputationStars, Button, StatusBadge, Tag, Dialog, DniGate, Icon, YData } from '../ds';

const { listings } = YData;

const css = `
.ld{max-width:1180px;margin:0 auto;padding:20px 24px 0;}
.ld__back{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-muted);cursor:pointer;margin-bottom:14px;}
.ld__grid{display:grid;grid-template-columns:1.15fr 1fr;gap:32px;align-items:start;}
.ld__gallery{display:flex;flex-direction:column;gap:12px;min-width:0;}
.ld__hero{position:relative;aspect-ratio:1/1;border-radius:var(--radius-xl);overflow:hidden;background:var(--surface-sunken);border:1px solid var(--border-subtle);}
.ld__hero img{width:100%;height:100%;object-fit:cover;display:block;}
.ld__herobadge{position:absolute;top:14px;left:14px;}
.ld__thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.ld__thumb{aspect-ratio:1/1;border-radius:var(--radius-md);overflow:hidden;border:2px solid var(--border-subtle);cursor:pointer;background:var(--surface-sunken);}
.ld__thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.ld__thumb--active{border-color:var(--brand);}
.ld__info{min-width:0;}
.ld__cat{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--brand);margin-bottom:8px;}
.ld__title{font-size:28px;font-weight:800;color:var(--text-strong);line-height:1.18;letter-spacing:-.02em;margin-bottom:14px;text-wrap:balance;}
.ld__buybox{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:20px;margin-bottom:18px;box-shadow:var(--shadow-sm);}
.ld__pricerow{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:16px;}
.ld__lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-subtle);margin-bottom:6px;}
.ld__buyactions{display:flex;flex-direction:column;gap:10px;}
.ld__note{font-size:12px;color:var(--text-subtle);text-align:center;display:flex;align-items:center;gap:6px;justify-content:center;}
.ld__seller{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--border-subtle);border-radius:var(--radius-lg);margin-bottom:18px;}
.ld__smeta{flex:1;min-width:0;}
.ld__sname{font-size:14px;font-weight:700;color:var(--text-strong);display:flex;align-items:center;gap:6px;}
.ld__sverif{font-size:12px;color:var(--success);font-weight:600;display:flex;align-items:center;gap:4px;}
.ld__sec{margin-bottom:18px;}
.ld__sectt{font-size:13px;font-weight:700;color:var(--text-strong);margin-bottom:10px;}
.ld__desc{font-size:14px;color:var(--text-body);line-height:1.6;}
.ld__tags{display:flex;flex-wrap:wrap;gap:7px;}
@media(max-width:960px){.ld__grid{grid-template-columns:1fr}}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

export default function ListingDetail({ verified = false, onRequireDni, onBuy, onBack, onOpenSeller }) {
  ensure();
  const { id } = useParams();
  const l = listings.find((x) => x.id === id) || listings[0];
  const gallery = [l.img, listings[(listings.indexOf(l) + 1) % listings.length].img, listings[(listings.indexOf(l) + 2) % listings.length].img, listings[(listings.indexOf(l) + 3) % listings.length].img];
  const [activeImg, setActiveImg] = React.useState(0);
  const [showGate, setShowGate] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const buy = () => { if (!verified) { setShowGate(true); return; } setShowConfirm(true); };

  return (
    <div className="ld">
      <div className="ld__back" onClick={onBack}><Icon.ChevronLeft size={16} /> Volver al marketplace</div>
      <div className="ld__grid">
        <div className="ld__gallery">
          <div className="ld__hero">
            <div className="ld__herobadge"><StatusBadge kind="listing" status={l.status || 'ACTIVE'} /></div>
            <img src={gallery[activeImg]} alt={l.title} />
          </div>
          <div className="ld__thumbs">
            {gallery.map((g, i) => (
              <div key={i} className={`ld__thumb${i === activeImg ? ' ld__thumb--active' : ''}`} onClick={() => setActiveImg(i)}>
                <img src={g} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="ld__info">
          <div className="ld__cat">{l.cat} · {l.cond}</div>
          <h1 className="ld__title">{l.title}</h1>

          <div className="ld__buybox">
            <div className="ld__pricerow">
              <div>
                <div className="ld__lbl">Precio</div>
                <Price value={l.price} size={36} />
              </div>
              <Tag>{l.cond}</Tag>
            </div>
            <div className="ld__buyactions">
              <Button variant="primary" size="lg" fullWidth iconLeft={<Icon.Wallet size={18} />} onClick={buy}>Comprar ahora</Button>
              <Button variant="secondary" size="md" fullWidth iconLeft={<Icon.Heart size={16} />}>Guardar en favoritos</Button>
              <div className="ld__note"><Icon.Shield size={13} /> Protegido por Yala hasta la entrega</div>
            </div>
          </div>

          <div className="ld__seller" onClick={onOpenSeller} style={{ cursor: 'pointer' }}>
            <Avatar name={l.seller.name} verified={l.seller.verified} size="lg" />
            <div className="ld__smeta">
              <div className="ld__sname">{l.seller.name} {l.seller.verified && <span className="ld__sverif"><Icon.Shield size={13} /> verificada</span>}</div>
              <ReputationStars value={l.seller.rating} count={l.seller.reviews} positivePct={l.seller.pct} size={15} />
            </div>
            <Button variant="secondary" size="sm">Ver perfil</Button>
          </div>

          <div className="ld__sec">
            <div className="ld__sectt">Descripción</div>
            <p className="ld__desc">Ejemplar de {l.title}. Condición {l.cond}. Conservado con cuidado y listo para enviar con embalaje protegido. Cualquier consulta, escribile al vendedor antes de comprar.</p>
          </div>

          <div className="ld__sec">
            <div className="ld__sectt">Etiquetas</div>
            <div className="ld__tags"><Tag>{l.cat}</Tag><Tag>{l.cond}</Tag><Tag>Coleccionable</Tag><Tag>Envío protegido</Tag></div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <Dialog open onClose={() => setShowConfirm(false)} tone="brand" icon={<Icon.Wallet size={20} />}
          title="Confirmá tu compra"
          description={`Vas a comprar ${l.title} por S/. ${l.price.toLocaleString('es-PE')}.`}
          footer={<><Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancelar</Button><Button variant="primary" onClick={() => { setShowConfirm(false); onBuy && onBuy(); }}>Ir a pagar</Button></>}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Se creará una orden en estado <b style={{ color: 'var(--text-strong)' }}>pendiente</b>. Tenés 48h para completar el pago con Stripe.
          </div>
        </Dialog>
      )}
      {showGate && (
        <Dialog open onClose={() => setShowGate(false)} width={500}>
          <DniGate action="comprar"
            primaryAction={<Button fullWidth onClick={() => { setShowGate(false); onRequireDni && onRequireDni(); }}>Verificar mi identidad</Button>}
            secondaryAction={<Button variant="ghost" fullWidth onClick={() => setShowGate(false)}>Ahora no</Button>} />
        </Dialog>
      )}
    </div>
  );
}
