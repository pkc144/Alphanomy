/**
 * VoiceCallWebView — WebView-based Vapi voice call (NO native WebRTC .so).
 *
 * Runs the Vapi WEB SDK (@vapi-ai/web, loaded from a CDN) inside an invisible
 * react-native-webview — the SAME SDK the web app uses (prod
 * src/components/VoiceSupport/VoiceSupportButton.js). The OS WebView's built-in
 * WebRTC handles the audio, so there is NO native
 * `libjingle_peerconnection_so.so` in the app → no Google Play 16 KB page-size
 * problem (the reason the native @vapi-ai/react-native stack was removed — see
 * CLAUDE.md "16 KB page-size check").
 *
 * Audio-only: the WebView is 0×0 / invisible; all UI stays native in
 * SupportWidget. MOUNT to start a call; UNMOUNT to end it. Status → `onStatus`.
 *
 * COST GUARD: if the CUSTOMER is silent for `idleMs` (default 30s) and the
 * assistant isn't mid-response, the call auto-drops (status 'idle', reason
 * 'inactivity') so we don't pay for abandoned/open calls.
 *
 * Mic: getUserMedia needs (a) a SECURE CONTEXT — provided by loading under an
 * https `baseUrl` — and (b) the OS mic permission. On Android the app's
 * RECORD_AUDIO (granted by the caller before mount) lets react-native-webview
 * auto-grant the page's capture request; on iOS `mediaCapturePermissionGrantType
 * ="grant"` + NSMicrophoneUsageDescription handle it.
 */
import React, {useCallback, useRef} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';

// https origin so `window.isSecureContext` is true (getUserMedia is blocked on
// about:blank / insecure origins). The page is the inline HTML below.
const SECURE_BASE = 'https://customersupport.alphaquark.in';

const buildHtml = (publicKey, assistantId, metadataJson, idleMs) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;background:transparent">
    <script type="module">
      const post = (m) => {
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
      };
      (async () => {
        try {
          const { default: Vapi } = await import('https://esm.sh/@vapi-ai/web@2.5.2');
          const vapi = new Vapi(${JSON.stringify(publicKey)});
          window.__vapi = vapi;

          const IDLE_MS = ${idleMs};
          let lastCustomer = Date.now();   // last sign of CUSTOMER activity
          let assistantSpeaking = false;   // don't drop while the bot is talking
          let idleTimer = null;
          const stopIdle = () => { if (idleTimer) { clearInterval(idleTimer); idleTimer = null; } };
          const endCall = (reason) => {
            stopIdle();
            post({ type: 'status', status: 'idle', reason: reason });
            try { vapi.stop(); } catch (e) {}
          };

          vapi.on('call-start', () => {
            lastCustomer = Date.now();
            post({ type: 'status', status: 'live' });
            // Cost guard: poll every 3s; drop if the customer has been silent
            // for IDLE_MS and the assistant is not mid-response.
            idleTimer = setInterval(() => {
              if (!assistantSpeaking && (Date.now() - lastCustomer) > IDLE_MS) endCall('inactivity');
            }, 3000);
          });
          vapi.on('call-end', () => { stopIdle(); post({ type: 'status', status: 'idle' }); });
          vapi.on('error', (e) => { stopIdle(); post({ type: 'status', status: 'error', error: String((e && e.message) || e) }); });

          // Assistant speech bounds: while it talks, hold the idle clock; when it
          // finishes, restart the customer's response window from that moment.
          vapi.on('speech-start', () => { assistantSpeaking = true; });
          vapi.on('speech-end', () => { assistantSpeaking = false; lastCustomer = Date.now(); });
          // Any customer transcript (partial or final) = activity.
          vapi.on('message', (m) => {
            try { if (m && m.type === 'transcript' && m.role === 'user') lastCustomer = Date.now(); } catch (e) {}
          });

          // RN → page commands: { cmd: 'stop' }
          const onCmd = (ev) => {
            try { const d = JSON.parse(ev.data); if (d && d.cmd === 'stop') endCall('user'); } catch (e) {}
          };
          document.addEventListener('message', onCmd); // android
          window.addEventListener('message', onCmd);   // ios

          post({ type: 'status', status: 'connecting' });
          await vapi.start(${JSON.stringify(assistantId)}, { metadata: ${metadataJson} });
        } catch (e) {
          post({ type: 'status', status: 'error', error: String((e && e.message) || e) });
        }
      })();
    </script>
  </body>
</html>`;

export default function VoiceCallWebView({
  publicKey,
  assistantId,
  metadata,
  idleMs = 30000, // auto-drop after 30s of customer silence (cost guard)
  onStatus = () => {},
}) {
  const ref = useRef(null);

  const handleMessage = useCallback(
    (e) => {
      try {
        const d = JSON.parse(e.nativeEvent.data);
        if (d && d.type === 'status') onStatus(d.status, d.reason || d.error);
      } catch (_) {}
    },
    [onStatus],
  );

  return (
    <View
      style={{position: 'absolute', width: 0, height: 0, opacity: 0}}
      pointerEvents="none">
      <WebView
        ref={ref}
        source={{
          html: buildHtml(
            publicKey,
            assistantId,
            JSON.stringify(metadata || {}),
            idleMs,
          ),
          baseUrl: SECURE_BASE,
        }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        onMessage={handleMessage}
        style={{width: 0, height: 0}}
      />
    </View>
  );
}
