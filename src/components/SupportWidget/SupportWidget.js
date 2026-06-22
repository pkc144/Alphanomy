import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
} from 'react-native';
import Config from 'react-native-config';
import {useConfig} from '../../context/ConfigContext';

/**
 * In-app support widget for the mobile app (chat-first, voice optional).
 *
 * Chat: POST {BRAIN_URL}/chat -> safe reply from the AlphaQuark support brain.
 * Voice: the Vapi React Native SDK (@vapi-ai/react-native) for a WebRTC call to
 *        the same brain. The SDK is LAZY-REQUIRED so the app does NOT crash if
 *        the native module isn't linked yet (run `cd ios && pod install`, then a
 *        rebuild, to activate voice). Until then the call button is hidden and
 *        chat works fully.
 *
 * Gated by the per-advisor flag `voiceSupportUserEnabled` (supportAQ →
 * advisor_config.voice_support_user_enabled, default OFF) + `visible`
 * (authenticated). Same gate as web; carries across white-labels.
 */

const BRAIN_URL = 'https://customersupport.alphaquark.in';
const ASSISTANT_ID = '7323e900-a15e-4616-b383-c1affcde7fb9';
// Vapi PUBLIC key (safe in-app; start-call scoped). Same value as the web build.
const VAPI_PUBLIC_KEY = '5cfbb95d-830d-4365-896c-3d08f04054fd';
const ACK =
  'Thanks for reaching out! 🙏 Our team has received your message and someone will get in touch with you shortly.';

// Voice (Vapi/WebRTC) deps temporarily REMOVED for Google Play 16 KB compliance:
// @daily-co/react-native-webrtc@118 ships an UNALIGNED arm64 libjingle_peerconnection_so.so
// (4 KB pages) that fails the 16 KB page-size requirement, and @vapi-ai/react-native@0.3.0
// hard-pins that webrtc version (no 16 KB build exists yet). The widget stays CHAT-ONLY
// (voiceAvailable=false) until voice is re-added via a 16 KB-safe path — preferably the
// Vapi web SDK inside a WebView (no native .so at all), or Vapi >0.3.0 on webrtc 124+.
// To restore native voice: re-add the 4 deps (vapi/daily-js/webrtc/background-timer) and
// restore the lazy require here. See CLAUDE.md "16 KB page-size check".
let VapiCtor = null;

async function ensureMicPermission() {
  try {
    if (Platform.OS === 'android') {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone access',
          message: 'AlphaQuark Support needs your mic to start a voice call.',
          buttonPositive: 'Allow',
        },
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS prompts on first getUserMedia via the SDK
  } catch (e) {
    return false;
  }
}

export default function SupportWidget({userEmail = '', visible = false}) {
  // useConfig() returns the config object FLAT ({...config, configLoading}) —
  // not nested under `.config`. Every other consumer does `const config =
  // useConfig()`; the nested destructure here left `config` undefined, so
  // voiceSupportUserEnabled (and subdomain below) never resolved → the widget
  // was always disabled. Read it flat.
  const config = useConfig();
  const enabled = config?.voiceSupportUserEnabled === true && visible;
  const voiceAvailable = !!VapiCtor;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {from: 'bot', text: 'Hi! How can I help you today? Ask me anything, or tap 📞 to talk.'},
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle|connecting|live|error
  const vapiRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!enabled || !voiceAvailable) return undefined;
    let vapi;
    try {
      vapi = new VapiCtor(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;
      vapi.on('call-start', () => setCallStatus('live'));
      vapi.on('call-end', () => setCallStatus('idle'));
      vapi.on('error', () => setCallStatus('error'));
    } catch (e) {
      vapiRef.current = null;
    }
    return () => {
      try {
        vapi && vapi.stop();
      } catch (_) {}
    };
  }, [enabled, voiceAvailable]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollToEnd({animated: true});
  }, [messages, open]);

  if (!enabled) return null;

  const pushMsg = m => setMessages(prev => [...prev, m]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    pushMsg({from: 'user', text});
    setSending(true);
    try {
      // advisor key → brain routes chat to THIS advisor's data (white-label
      // account-aware). config.subdomain (resolved) or the env subdomain.
      const advisor =
        config?.subdomain ||
        Config?.REACT_APP_ADVISOR_SUBDOMAIN ||
        Config?.REACT_APP_HEADER_NAME ||
        '';
      const r = await fetch(`${BRAIN_URL}/chat`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({senderRef: userEmail || 'app_user', text, channel: 'in_app', advisor}),
      });
      const data = await r.json().catch(() => ({}));
      pushMsg({from: 'bot', text: data.reply || ACK});
    } catch (e) {
      pushMsg({from: 'bot', text: ACK});
    } finally {
      setSending(false);
    }
  };

  const toggleCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    if (callStatus === 'live' || callStatus === 'connecting') {
      try {
        vapi.stop();
      } catch (_) {}
      setCallStatus('idle');
      return;
    }
    const ok = await ensureMicPermission();
    if (!ok) {
      pushMsg({from: 'bot', text: 'Microphone permission is needed for a voice call. You can keep chatting here.'});
      return;
    }
    setCallStatus('connecting');
    pushMsg({from: 'bot', text: '📞 Connecting your voice call…'});
    try {
      const advisor =
        config?.subdomain ||
        Config?.REACT_APP_ADVISOR_SUBDOMAIN ||
        Config?.REACT_APP_HEADER_NAME ||
        '';
      // metadata flows into the Vapi end-of-call-report → per-advisor voice billing.
      await vapi.start(ASSISTANT_ID, {
        metadata: {advisor, senderRef: userEmail || 'app_user'},
      });
    } catch (e) {
      setCallStatus('error');
      pushMsg({from: 'bot', text: "Couldn't start the call. You can keep chatting here."});
    }
  };

  const live = callStatus === 'live';

  // ── Launcher (collapsed) ──
  if (!open) {
    return (
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 90,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#2563eb',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 4},
          zIndex: 9999,
        }}>
        <Text style={{fontSize: 24}}>💬</Text>
      </TouchableOpacity>
    );
  }

  // ── Panel (expanded) ──
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        position: 'absolute',
        right: 12,
        left: 12,
        bottom: 24,
        height: 460,
        borderRadius: 16,
        backgroundColor: '#fff',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 6},
        zIndex: 10000,
      }}>
      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: '#2563eb',
        }}>
        <Text style={{color: '#fff', fontWeight: '600', fontSize: 15}}>AlphaQuark Support</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {voiceAvailable && (
            <TouchableOpacity
              onPress={toggleCall}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: live ? '#dc2626' : '#16a34a',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <Text style={{fontSize: 15}}>{live ? '⏹️' : '📞'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setOpen(false)}>
            <Text style={{color: '#fff', fontSize: 22}}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {live && (
        <View style={{backgroundColor: '#dcfce7', paddingVertical: 6}}>
          <Text style={{color: '#166534', fontSize: 12, textAlign: 'center'}}>🎙️ Voice call live — speak now</Text>
        </View>
      )}

      {/* messages */}
      <ScrollView ref={scrollRef} style={{flex: 1, backgroundColor: '#f8fafc'}} contentContainerStyle={{padding: 12}}>
        {messages.map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              marginVertical: 5,
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: m.from === 'user' ? '#2563eb' : '#fff',
              borderWidth: m.from === 'user' ? 0 : 1,
              borderColor: '#e2e8f0',
            }}>
            <Text style={{color: m.from === 'user' ? '#fff' : '#0f172a', fontSize: 13.5, lineHeight: 19}}>{m.text}</Text>
          </View>
        ))}
        {sending && <ActivityIndicator style={{marginTop: 8}} color="#2563eb" />}
      </ScrollView>

      {/* input */}
      <View style={{flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0'}}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your question…"
          placeholderTextColor="#94a3b8"
          editable={!sending}
          onSubmitEditing={send}
          style={{
            flex: 1,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#cbd5e1',
            fontSize: 13.5,
            color: '#0f172a',
          }}
        />
        <TouchableOpacity
          onPress={send}
          disabled={sending}
          style={{
            marginLeft: 8,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#2563eb',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{color: '#fff', fontSize: 16}}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
