/**
 * VoiceCallWebView — loads the SELF-HOSTED Vapi voice page from the support
 * brain (customersupport.alphaquark.in/voice) inside an invisible
 * react-native-webview.
 *
 * The brain serves both the page AND a pre-bundled Vapi WEB SDK
 * (/voice-sdk.js) — so there is NO third-party CDN at call-time and the page is
 * a guaranteed https SECURE CONTEXT for getUserMedia. The OS WebView's built-in
 * WebRTC handles audio → NO native libjingle .so → no Google Play 16 KB
 * page-size problem (the reason the native @vapi-ai/react-native stack was
 * removed — see CLAUDE.md "16 KB page-size check"). The page also runs the 30s
 * customer-silence cost guard. Source: aq-support-brain src/server/app.ts
 * (`/voice` + `/voice-sdk.js` + VOICE_PAGE).
 *
 * Audio-only: the WebView is 0×0 / invisible; UI stays native in SupportWidget.
 * MOUNT to start a call; UNMOUNT to end it. Status → `onStatus(status, reason)`
 * ('inactivity' when the cost guard auto-dropped a silent call).
 *
 * Mic: the app's RECORD_AUDIO (granted by the caller before mount) lets
 * react-native-webview auto-grant the page's capture request on Android; on iOS
 * `mediaCapturePermissionGrantType="grant"` + NSMicrophoneUsageDescription.
 */
import React, {useCallback, useRef} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';

const VOICE_PAGE = 'https://customersupport.alphaquark.in/voice';

export default function VoiceCallWebView({
  publicKey,
  assistantId,
  metadata,
  idleMs = 30000, // auto-drop after 30s of customer silence (cost guard)
  onStatus = () => {},
}) {
  const ref = useRef(null);

  const uri =
    VOICE_PAGE +
    '?pk=' +
    encodeURIComponent(publicKey || '') +
    '&aid=' +
    encodeURIComponent(assistantId || '') +
    '&meta=' +
    encodeURIComponent(JSON.stringify(metadata || {})) +
    '&idle=' +
    encodeURIComponent(String(idleMs));

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
        source={{uri}}
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
