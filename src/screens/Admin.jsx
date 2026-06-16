import React from 'react';
import { Tabs, Button, Input, Avatar, Badge, Icon } from '../ds';

const css = `
.ad{max-width:920px;margin:0 auto;padding:24px;}
.ad__h1{font-size:26px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;margin-bottom:4px;}
.ad__sub{font-size:14px;color:var(--text-muted);margin-bottom:22px;}
.ad__tabs{margin-bottom:18px;}
.ad__panel{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);overflow:hidden;}
.ad__row{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--border-subtle);}
.ad__row:last-child{border-bottom:none;}
.ad__meta{flex:1;min-width:0;}
.ad__name{font-size:14px;font-weight:700;color:var(--text-strong);}
.ad__det{font-size:12px;color:var(--text-muted);margin-top:2px;}
.ad__actions{display:flex;gap:8px;flex:none;}
.ad__newcat{display:flex;gap:10px;align-items:flex-end;padding:16px 18px;border-bottom:1px solid var(--border-subtle);background:var(--surface-sunken);}
@media(max-width:560px){.ad__row{flex-wrap:wrap}}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

const PENDING_STORES = [
  { id: 's1', name: 'GeekLima', email: 'hola@geeklima.pe', date: '14 jun 2026' },
  { id: 's2', name: 'TCG Store Perú', email: 'ventas@tcgstore.pe', date: '13 jun 2026' },
];
const PENDING_SELLERS = [
  { id: 'u1', name: 'Ana Quispe', participated: 6, won: 3 },
  { id: 'u2', name: 'Bruno Díaz', participated: 5, won: 4 },
];
const CATEGORIES = ['Pokémon TCG', 'Funko Pop', 'Comics', 'Other'];

export default function Admin({ onAction }) {
  ensure();
  const [tab, setTab] = React.useState('stores');
  const act = (msg) => onAction && onAction(msg);

  return (
    <div className="ad">
      <div className="ad__h1">Panel de administración</div>
      <div className="ad__sub">Aprobá tiendas y vendedores, y gestioná las categorías del marketplace.</div>

      <div className="ad__tabs">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'stores', label: 'Tiendas', count: PENDING_STORES.length },
          { value: 'sellers', label: 'Verificaciones', count: PENDING_SELLERS.length },
          { value: 'categories', label: 'Categorías', count: CATEGORIES.length },
        ]} />
      </div>

      {tab === 'stores' && (
        <div className="ad__panel">
          {PENDING_STORES.map((s) => (
            <div className="ad__row" key={s.id}>
              <Avatar name={s.name} size={40} square />
              <div className="ad__meta">
                <div className="ad__name">{s.name} <Badge tone="warning">Pendiente</Badge></div>
                <div className="ad__det">{s.email} · solicitada el {s.date}</div>
              </div>
              <div className="ad__actions">
                <Button variant="ghost" size="sm">Ver detalle</Button>
                <Button variant="primary" size="sm" iconLeft={<Icon.Check size={15} />} onClick={() => act('Tienda aprobada — se le envió el correo de bienvenida.')}>Aprobar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sellers' && (
        <div className="ad__panel">
          {PENDING_SELLERS.map((u) => (
            <div className="ad__row" key={u.id}>
              <Avatar name={u.name} size={40} />
              <div className="ad__meta">
                <div className="ad__name">{u.name}</div>
                <div className="ad__det">{u.participated} subastas participadas · {u.won} ganadas — cumple los requisitos</div>
              </div>
              <div className="ad__actions">
                <Button variant="ghost" size="sm">Ver perfil</Button>
                <Button variant="primary" size="sm" iconLeft={<Icon.Shield size={15} />} onClick={() => act('Vendedor verificado — ya puede crear publicaciones y subastas.')}>Verificar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'categories' && (
        <div className="ad__panel">
          <div className="ad__newcat">
            <Input label="Nueva categoría" placeholder="Ej: Cartas Magic" style={{ flex: 1, minWidth: 0 }} />
            <Button variant="primary" iconLeft={<Icon.Plus size={16} />} onClick={() => act('Categoría creada.')}>Crear</Button>
          </div>
          {CATEGORIES.map((c) => (
            <div className="ad__row" key={c}>
              <div className="ad__meta"><div className="ad__name">{c}</div></div>
              <div className="ad__actions"><Button variant="ghost" size="sm" iconLeft={<Icon.Edit size={14} />}>Editar</Button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
