import React from 'react';
import '@livekit/components-styles';
import { LiveKitRoom, VideoTrack, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Input, Price, Icon } from '../ds';
import { useToast } from '../context/ToastContext';
import { startLive, endLive, createFlashAuction, closeFlashAuction, listComments, postComment, summarizeComments, detectProduct, transcribeChunk } from '../api/live';
import { subscribeLive, subscribeLiveChat } from '../api/realtime';
import type { FlashAuction, LiveComment, LiveToken, LiveUpdateMessage } from '../types';

const css = `
.ygl{max-width:1100px;margin:0 auto;padding:24px;}
.ygl--live{max-width:1500px;padding:12px 24px;}
.ygl__setup{max-width:520px;margin:40px auto;background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:28px;display:flex;flex-direction:column;gap:16px;}
.ygl__h{font-size:20px;font-weight:800;color:var(--text-strong);}
.ygl__sub{font-size:14px;color:var(--text-muted);}
.ygl__grid{display:flex;gap:16px;align-items:stretch;height:calc(100vh - 132px);}
.ygl__stage{flex:1;min-width:0;position:relative;background:#000;border-radius:var(--radius-lg);overflow:hidden;display:flex;align-items:center;justify-content:center;}
.ygl__stage video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;}
.ygl__placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;opacity:.7;font-family:var(--font-sans);}
.ygl__qr{position:absolute;left:14px;top:50%;transform:translateY(-50%);z-index:3;background:#fff;border-radius:var(--radius-lg);padding:10px;box-shadow:0 6px 24px rgba(0,0,0,0.35);display:flex;flex-direction:column;align-items:center;gap:6px;opacity:.92;transition:opacity .15s ease;}
.ygl__qr:hover{opacity:1;}
.ygl__qrlabel{font-size:11px;font-weight:700;color:#1a1a22;font-family:var(--font-sans);max-width:120px;text-align:center;line-height:1.2;}
.ygl__panel{display:flex;flex-direction:column;gap:14px;width:380px;flex:none;height:100%;overflow-y:auto;}
.ygl__card{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:16px;display:flex;flex-direction:column;gap:10px;}
.ygl__label{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-subtle);}
.ygl__chat{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);display:flex;flex-direction:column;height:340px;}
.ygl__chathd{padding:10px 14px;border-bottom:1px solid var(--border-subtle);font-weight:700;font-size:14px;color:var(--text-strong);display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ygl__summary{padding:10px 12px;background:var(--brand-subtle);border-bottom:1px solid var(--border-subtle);font-size:12.5px;color:var(--text-body);white-space:pre-line;line-height:1.5;max-height:150px;overflow:auto;}
.ygl__summary b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--brand);margin-bottom:4px;}
.ygl__msgs{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;}
.ygl__msg{font-size:13px;line-height:1.4;color:var(--text-body);}
.ygl__msg b{color:var(--text-strong);font-weight:700;margin-right:5px;}
.ygl__chatform{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--border-subtle);}
.ygl__voice{gap:9px;}
.ygl__voicehd{display:flex;align-items:center;gap:8px;}
.ygl__beta{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;background:var(--brand);border-radius:999px;padding:1px 7px;}
.ygl__voicerow{display:flex;gap:8px;flex-wrap:wrap;}
.ygl__voicehint{font-size:12.5px;color:var(--text-muted);line-height:1.45;}
.ygl__voicewarn{font-size:12.5px;color:var(--warning-700,#C7891A);line-height:1.45;}
.ygl__voiceheard{font-size:12px;color:var(--text-subtle);font-style:italic;background:var(--surface-sunken);border-radius:8px;padding:6px 10px;}
@media(max-width:900px){.ygl__grid{flex-direction:column;height:auto;}.ygl__stage{aspect-ratio:16/9;flex:none;}.ygl__panel{width:100%;height:auto;overflow:visible;}}
@media(max-width:600px){.ygl{padding:14px;}.ygl__chat{height:auto;max-height:50vh;}.ygl__setup{margin:16px auto;padding:20px;}.ygl__qr{display:none;}}
`;
let ic = false;
function ensure() { if (!ic) { ic = true; const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); } }

// ── Audio helpers for the mic → transcription pipeline (ADR-002 Fase 3) ──────────
// RMS (loudness) of a window; used to skip near-silent chunks so Whisper doesn't
// hallucinate random text (often CJK/"chino") on silence.
function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, samples.length));
}

// Encode mono Float32 samples as a 16-bit PCM WAV blob at the given sample rate.
// We send clean audio at the native rate (OpenAI resamples) instead of a crude
// decimation, which introduced aliasing and garbled the speech.
function encodeWav(samples: Float32Array, rate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeStr(8, 'WAVE');
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, 'data'); view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    off += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
}

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

// The seller's camera preview. Shows a QR (linking to the public live URL) so
// the seller can display it on-camera and viewers join by scanning it.
function PublisherStage({ qrUrl }: { qrUrl?: string }) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const cam = tracks.find((t) => t.publication?.kind === 'video' || t.source === Track.Source.Camera);
  return (
    <div className="ygl__stage">
      {qrUrl && (
        <div className="ygl__qr">
          <QRCodeSVG value={qrUrl} size={120} />
          <span className="ygl__qrlabel">Escanea para entrar</span>
        </div>
      )}
      {cam ? <VideoTrack trackRef={cam} /> : <div className="ygl__placeholder">Activando tu cámara…</div>}
    </div>
  );
}

interface Props { onBack?: () => void }

export default function GoLive({ onBack }: Props) {
  ensure();
  const toast = useToast();

  const [title, setTitle] = React.useState('');
  const [token, setToken] = React.useState<LiveToken | null>(null);
  const [starting, setStarting] = React.useState(false);

  const [faTitle, setFaTitle] = React.useState('');
  const [faBase, setFaBase] = React.useState('');
  const [faIncrement, setFaIncrement] = React.useState('1');
  const [auction, setAuction] = React.useState<FlashAuction | null>(null);
  const [messages, setMessages] = React.useState<LiveComment[]>([]);
  const [chatText, setChatText] = React.useState('');
  const [summary, setSummary] = React.useState<string | null>(null);
  const [summarizing, setSummarizing] = React.useState(false);

  // Voice → product (ADR-002, Fase 3): STT cross-browser con gpt-4o-mini-transcribe. Capturamos el
  // mic continuo (WebAudio), mandamos ventanas ~3s solapadas al backend, y sobre un buffer de texto
  // acumulado detectamos la frase clave con match tolerante (ignora espacios/tildes → aunque el corte
  // parta la frase se detecta). onDetected extrae atributos y llena/crea la subasta según el modo.
  const [voiceOn, setVoiceOn] = React.useState(false);
  const [autoMode, setAutoMode] = React.useState(false); // false = con confirmación, true = automático
  const [heard, setHeard] = React.useState('');
  const [detecting, setDetecting] = React.useState(false);
  // Refs so the long-lived audio callbacks read fresh values.
  const autoModeRef = React.useRef(autoMode); autoModeRef.current = autoMode;
  const tokenRef = React.useRef(token); tokenRef.current = token;
  const bufferRef = React.useRef('');
  const capturingRef = React.useRef(false);
  const partsRef = React.useRef<string[]>([]);
  const captureTimer = React.useRef<any>(null);

  // Alphanumeric-only normalization: strips accents, spaces and punctuation so the trigger phrase
  // matches even if a chunk boundary split a word ("nueva sub" + "asta" → "nuevasubasta").
  const compact = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

  // Fed by each transcribed chunk: append to a rolling buffer, detect the trigger, then capture the
  // following seconds of speech as the product description.
  const onTranscript = (text: string) => {
    if (!text || !text.trim()) return;
    setHeard(text.trim().slice(-80));
    if (capturingRef.current) {
      partsRef.current.push(text.trim());
      return;
    }
    bufferRef.current = (bufferRef.current + ' ' + text.trim()).slice(-1200);
    // Tolerant trigger: the distinctive tail "nueva subasta" rarely varies across STT results,
    // so we don't require the exact full phrase (which broke on "Iniciamos" vs "Iniciemos", etc.).
    if (compact(bufferRef.current).includes('nuevasubasta')) {
      capturingRef.current = true;
      partsRef.current = [text.trim()];
      bufferRef.current = '';
      toast.success('Frase detectada', 'Escuchando el producto…', 'Gavel');
      clearTimeout(captureTimer.current);
      captureTimer.current = setTimeout(() => {
        capturingRef.current = false;
        const desc = partsRef.current.join(' ').trim();
        partsRef.current = [];
        if (desc) onDetected(desc);
      }, 5000);
    }
  };

  const onDetected = async (description: string) => {
    const tk = tokenRef.current;
    if (!tk || !description.trim()) return;
    setDetecting(true);
    try {
      const p: any = await detectProduct(tk.streamId, description.trim());
      const canAuto = autoModeRef.current && p?.title && p?.suggestedBasePrice != null && (p?.confidence ?? 0) >= 0.6;
      if (canAuto) {
        const a = await createFlashAuction(tk.streamId, {
          title: p.title, basePrice: Number(p.suggestedBasePrice) || 1, bidIncrement: 1,
        });
        setAuction(a);
        toast.success('Subasta creada por voz', p.title, 'Gavel');
      } else {
        // Confirmation mode (or low confidence / missing price): pre-fill the form to review.
        setFaTitle(p?.title || description.trim());
        if (p?.suggestedBasePrice != null) setFaBase(String(p.suggestedBasePrice));
        toast.success('Producto detectado', 'Revisa los datos y lanza la subasta.', 'Gavel');
      }
    } catch (err: any) {
      toast.error('No se pudo detectar el producto', err?.message || 'Intenta de nuevo.');
    } finally {
      setDetecting(false);
    }
  };

  // Continuous mic capture → overlapping ~3s WAV windows → backend transcription (cross-browser).
  React.useEffect(() => {
    if (!voiceOn || !token) return undefined;
    let stopped = false;
    let ac: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let processor: any = null;
    let source: any = null;
    let chunkTimer: any = null;
    let pcm: number[] = [];        // recent mono samples at the AudioContext rate
    let sampleRate = 48000;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } as any,
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        try { await ac.resume(); } catch { /* some browsers start running already */ }
        sampleRate = ac.sampleRate;
        source = ac.createMediaStreamSource(stream);
        processor = (ac as any).createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e: any) => {
          const data = e.inputBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) pcm.push(data[i]);
          const maxKeep = sampleRate * 5; // keep the last ~5s
          if (pcm.length > maxKeep) pcm = pcm.slice(pcm.length - maxKeep);
        };
        // Route through a silent gain node so the processor keeps firing without the
        // host hearing their own mic (feedback).
        const sink = ac.createGain();
        sink.gain.value = 0;
        source.connect(processor);
        processor.connect(sink);
        sink.connect(ac.destination);

        // Every ~2s send the last ~3s of audio (=> ~1s overlap) so no word is lost at boundaries.
        chunkTimer = setInterval(() => {
          const tk = tokenRef.current;
          if (!tk || pcm.length < sampleRate) return; // wait for ~1s of audio
          const windowLen = Math.floor(sampleRate * 3);
          const slice = Float32Array.from(pcm.slice(Math.max(0, pcm.length - windowLen)));
          if (rms(slice) < 0.012) return; // skip near-silent windows (avoid STT hallucination)
          const blob = encodeWav(slice, sampleRate);
          transcribeChunk(tk.streamId, blob)
            .then((r: any) => onTranscript(r?.text || ''))
            .catch(() => { /* ignore transient errors */ });
        }, 2000);
      } catch {
        toast.error('No se pudo acceder al micrófono', 'Revisa los permisos del navegador.');
        setVoiceOn(false);
      }
    })();

    return () => {
      stopped = true;
      clearInterval(chunkTimer);
      clearTimeout(captureTimer.current);
      capturingRef.current = false;
      partsRef.current = [];
      bufferRef.current = '';
      try { processor && processor.disconnect(); } catch { /* ignore */ }
      try { source && source.disconnect(); } catch { /* ignore */ }
      try { ac && ac.close(); } catch { /* ignore */ }
      try { stream && stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOn, token]);

  React.useEffect(() => {
    if (!token) return;
    return subscribeLive<LiveUpdateMessage>(token.streamId, (msg) => {
      if (!msg) return;
      if (msg.type === 'AUCTION_CLOSED') { setAuction(msg.auction); return; }
      if (msg.auction) setAuction(msg.auction);
    });
  }, [token]);

  // Live chat: seed history (newest-first → show oldest-first) + realtime subscription.
  React.useEffect(() => {
    if (!token) return undefined;
    listComments(token.streamId, { size: 30 })
      .then((page: any) => setMessages([...(page?.content || [])].reverse()))
      .catch(() => {});
    return subscribeLiveChat<LiveComment>(token.streamId, (c) => {
      if (c) setMessages((prev) => [...prev, c]);
    });
  }, [token]);

  const runSummary = async () => {
    if (!token || summarizing) return;
    setSummarizing(true);
    try {
      const r = await summarizeComments(token.streamId, { limit: 80 });
      setSummary(r?.summary || 'Sin resumen.');
    } catch (err: any) {
      toast.error('No se pudo resumir', err?.message || 'Intenta de nuevo.');
    } finally {
      setSummarizing(false);
    }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const text = chatText.trim();
    if (!text) return;
    setChatText('');
    // The message is appended when the STOMP broadcast echoes back (no optimistic add).
    try { await postComment(token.streamId, text); }
    catch (err: any) { toast.error('No se pudo enviar', err?.message || 'Intenta de nuevo.'); }
  };

  const start = async () => {
    if (!title.trim()) { toast.error('Falta el título', 'Ponle un título a tu transmisión.'); return; }
    setStarting(true);
    try {
      const tk = await startLive({ title: title.trim() });
      setToken(tk);
      toast.success('¡Estás en vivo!', 'Tu transmisión arrancó.', 'TrendingUp');
    } catch (err: any) {
      toast.error('No se pudo iniciar', err?.message || 'Intenta de nuevo.');
    } finally {
      setStarting(false);
    }
  };

  const end = async () => {
    if (!token) return;
    try { await endLive(token.streamId); } catch { /* ignore */ }
    toast.success('Transmisión finalizada', 'Tu live terminó.');
    setToken(null);
    onBack && onBack();
  };

  const createAuction = async () => {
    if (!token) return;
    const base = parseFloat(faBase);
    if (!faTitle.trim() || isNaN(base)) { toast.error('Datos incompletos', 'Ingresa título y precio base.'); return; }
    const increment = parseFloat(faIncrement) || 1;
    try {
      const a = await createFlashAuction(token.streamId, { title: faTitle.trim(), basePrice: base, bidIncrement: increment });
      setAuction(a);
      setFaTitle(''); setFaBase(''); setFaIncrement('1');
      toast.success('Subasta flash iniciada', 'Los espectadores ya pueden pujar.', 'Gavel');
    } catch (err: any) {
      toast.error('No se pudo crear', err?.message || 'Intenta de nuevo.');
    }
  };

  const closeAuction = async () => {
    if (!auction) return;
    try {
      const a = await closeFlashAuction(auction.id);
      setAuction(a);
      toast.success(a.status === 'SOLD' ? 'Subasta vendida' : 'Subasta desierta',
        a.status === 'SOLD' ? `Ganó ${a.winnerName}.` : 'No hubo pujas.');
    } catch (err: any) {
      toast.error('No se pudo cerrar', err?.message || 'Intenta de nuevo.');
    }
  };

  if (!token) {
    return (
      <div className="ygl">
        <div className="ygl__setup">
          <div className="ygl__h">Iniciar transmisión</div>
          <div className="ygl__sub">Transmite en vivo y lanza subastas flash de tus coleccionables.</div>
          <div>
            <div className="ygl__label" style={{ marginBottom: 6 }}>Título</div>
            <Input placeholder="Ej: Ruptura de sobres Pokémon 151" value={title}
              onChange={(e: any) => setTitle(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={start} disabled={starting}
              iconLeft={Icon.TrendingUp ? <Icon.TrendingUp size={16} /> : null}>
              {starting ? 'Iniciando…' : 'Iniciar transmisión'}
            </Button>
            <Button variant="ghost" onClick={onBack}>Cancelar</Button>
          </div>
          {!LIVEKIT_URL && (
            <div style={{ fontSize: 12, color: 'var(--warning-700,#C7891A)' }}>
              Falta configurar VITE_LIVEKIT_URL: el video no se publicará.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Public URL viewers reach by scanning the QR (origin + /live/:streamId).
  const liveUrl = typeof window !== 'undefined' ? `${window.location.origin}/live/${token.streamId}` : '';

  return (
    <div className="ygl ygl--live">
      <LiveKitRoom serverUrl={token.url || LIVEKIT_URL} token={token.token} connect audio video>
        <div className="ygl__grid">
          <PublisherStage qrUrl={liveUrl} />
          <div className="ygl__panel">
            <div className="ygl__card ygl__voice">
              <div className="ygl__voicehd">
                <span className="ygl__label">Detección por voz</span>
                <span className="ygl__beta">beta</span>
              </div>
              <div className="ygl__voicerow">
                <Button size="sm" variant={voiceOn ? 'live' : 'secondary'} onClick={() => setVoiceOn((v) => !v)}>
                  {voiceOn ? (detecting ? 'Analizando…' : 'Escuchando…') : 'Activar detección por voz'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAutoMode((m) => !m)}>
                  Modo: {autoMode ? 'Automático' : 'Confirmación'}
                </Button>
              </div>
              <div className="ygl__voicehint">
                Di <b>«Iniciemos esta nueva subasta»</b> y describe el coleccionable.
                {autoMode ? ' La subasta se creará sola.' : ' Rellenamos el formulario para que lo revises.'}
              </div>
              {voiceOn && heard && <div className="ygl__voiceheard">…{heard}</div>}
            </div>
            <div className="ygl__card">
              <div className="ygl__label">Subasta flash</div>
              {auction && auction.status === 'ACTIVE' ? (
                <>
                  <div style={{ fontWeight: 800, color: 'var(--text-strong)' }}>{auction.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>{auction.totalBids} {auction.totalBids === 1 ? 'puja' : 'pujas'}</span>
                    <Price value={auction.currentPrice == null ? auction.basePrice : auction.currentPrice} />
                  </div>
                  <Button variant="secondary" onClick={closeAuction}>Cerrar subasta</Button>
                </>
              ) : (
                <>
                  <Input label="Producto" placeholder="Título del producto" value={faTitle} onChange={(e: any) => setFaTitle(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Input label="Precio base" hint="Puja inicial de la subasta" prefix="S/." mono placeholder="0" value={faBase}
                        onChange={(e: any) => setFaBase(e.target.value.replace(/[^\d.]/g, ''))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Input label="Incremento" hint="Cuánto sube cada puja" prefix="S/." mono placeholder="1" value={faIncrement}
                        onChange={(e: any) => setFaIncrement(e.target.value.replace(/[^\d.]/g, ''))} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <Button onClick={createAuction} iconLeft={Icon.Gavel ? <Icon.Gavel size={16} /> : null}>
                    Lanzar subasta flash
                  </Button>
                  {auction && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Última subasta: {auction.title} — {auction.status === 'SOLD' ? `vendida a ${auction.winnerName}` : 'desierta'}.
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="ygl__chat">
              <div className="ygl__chathd">
                <span>Chat en vivo</span>
                <Button variant="ghost" size="sm" onClick={runSummary} disabled={summarizing}
                  iconLeft={Icon.Sparkles ? <Icon.Sparkles size={14} /> : null}>
                  {summarizing ? 'Resumiendo…' : 'Resumir IA'}
                </Button>
              </div>
              {summary && (
                <div className="ygl__summary"><b>Resumen del chat</b>{summary}</div>
              )}
              <div className="ygl__msgs">
                {messages.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Aún no hay comentarios.</div>
                ) : messages.map((m) => (
                  <div className="ygl__msg" key={m.id}><b>{m.userName}</b>{m.text}</div>
                ))}
              </div>
              <form className="ygl__chatform" onSubmit={sendComment}>
                <Input placeholder="Responde a tu audiencia…" value={chatText}
                  onChange={(e: any) => setChatText(e.target.value)} style={{ flex: 1 }} />
                <Button type="submit" variant="secondary" disabled={!chatText.trim()}>Enviar</Button>
              </form>
            </div>
            <Button variant="ghost" onClick={end}
              iconLeft={Icon.X ? <Icon.X size={16} /> : null}>Terminar transmisión</Button>
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
}
