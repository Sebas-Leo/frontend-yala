import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Icon } from '../ds';
import { forgotPassword, resetPassword } from '../api/auth';
import { useToast } from '../context/ToastContext';

const css = `
.fp{min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;padding:32px 20px;}
.fp__card{width:100%;max-width:420px;background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:28px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:16px;}
.fp__title{font-size:22px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;}
.fp__sub{font-size:14px;color:var(--text-muted);line-height:1.5;margin-top:-8px;}
.fp__ok{font-size:13px;color:var(--success,#1B9C6B);background:var(--success-bg,#E9F8F1);border-radius:10px;padding:10px 12px;line-height:1.5;}
.fp__err{font-size:13px;color:var(--danger);background:var(--danger-bg,#FDECEC);border-radius:10px;padding:10px 12px;}
.fp__foot{font-size:13px;color:var(--text-muted);text-align:center;}
.fp__link{color:var(--brand,#4338CA);font-weight:700;cursor:pointer;}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

export default function ForgotPassword() {
  ensure();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresa tu correo.'); return; }
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el código. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!code.trim()) { setError('Ingresa el código que te enviamos.'); return; }
    if (newPassword.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    setBusy(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      toast.success('Contraseña actualizada', 'Ya puedes ingresar con tu nueva contraseña.', 'Check');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Código inválido o expirado.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fp">
      {step === 1 ? (
        <form className="fp__card" onSubmit={requestCode}>
          <div className="fp__title">Recuperar contraseña</div>
          <div className="fp__sub">Ingresa el correo de tu cuenta y te enviaremos un código de verificación.</div>
          {error && <div className="fp__err">{error}</div>}
          <Input label="Email" type="email" placeholder="tu@email.com" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="primary" size="lg" fullWidth type="submit" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar código'}
          </Button>
          <div className="fp__foot"><span className="fp__link" onClick={() => navigate('/login')}>Volver a ingresar</span></div>
        </form>
      ) : (
        <form className="fp__card" onSubmit={doReset}>
          <div className="fp__title">Ingresa el código</div>
          <div className="fp__ok">Si <b>{email}</b> tiene una cuenta, te enviamos un código de 6 dígitos. Revisa tu correo (vence en 15 minutos).</div>
          {error && <div className="fp__err">{error}</div>}
          <Input label="Código de verificación" placeholder="123456" inputMode="numeric" required
            value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))} />
          <Input label="Nueva contraseña" type="password" placeholder="••••••••" required
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Button variant="primary" size="lg" fullWidth type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Restablecer contraseña'}
          </Button>
          <div className="fp__foot">
            <span className="fp__link" onClick={() => { setError(''); requestCode(new Event('submit') as any); }}>Reenviar código</span>
            {'  ·  '}
            <span className="fp__link" onClick={() => navigate('/login')}>Volver</span>
          </div>
        </form>
      )}
    </div>
  );
}
