// utils/soundNotification.ts
/**
 * Emite un tono sonoro agradable y no intrusivo utilizando la API nativa AudioContext.
 * Diseñado con dos frecuencias armónicas suaves (D5 -> A5) para avisar al auditor
 * cuando culmina una auditoría en segundo plano.
 * No requiere archivos de audio externos.
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tono principal cálido (D5: 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.09, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tono secundario armónico (A5: 880.00 Hz) con ligero delay para efecto campana
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.09, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch {
    // Si las políticas de reproducción automática del navegador restringen el audio sin interacción previa,
    // se maneja silenciosamente sin interrumpir el flujo.
  }
}
