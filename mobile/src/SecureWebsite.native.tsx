import React, { useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { websiteEntry, workspaceTarget } from './workspace-navigation';
import type { WebsiteProps } from './SecureWebsite';

const ink = '#292821', gold = '#8a7333', paper = '#faf9f5';

export default function SecureWebsite(props: WebsiteProps) {
  const entry = websiteEntry(props.mode, undefined, props.publicUrl);
  return <WorkspaceSession key={entry.url} {...props} />;
}

function WorkspaceSession({ mode, publicUrl, backRef, onClose }: WebsiteProps) {
  const entry = websiteEntry(mode, undefined, publicUrl);
  const web = useRef<WebView<object>>(null);
  const [source, setSource] = useState(entry.url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const current = useRef(entry.url);
  const showingPrompt = useRef(false);
  const explain = (message: string) => {
    if (showingPrompt.current) return;
    showingPrompt.current = true;
    const done = () => { showingPrompt.current = false; };
    Alert.alert('India Gully', message, [{ text: 'OK', onPress: done }], { cancelable: true, onDismiss: done });
  };
  const navigate = (url: string, popup = false): boolean => {
    const target = workspaceTarget(url, mode);
    if (target.kind === 'internal') {
      if (popup) setSource(target.url);
      return true;
    }
    if (target.kind === 'mailbox') explain('Google requires a separate approval for a new mailbox connection. Previously connected mailboxes work here.');
    else if (/^(mailto:|tel:)/i.test(url)) explain(url.split('?')[0].replace(/^(mailto:|tel:)/i, ''));
    else explain('This destination is outside your India Gully workspace.');
    return false;
  };
  const back = () => { if (canGoBack) web.current?.goBack(); else onClose(); };

  useImperativeHandle(backRef, () => back, [canGoBack, onClose]);
  const screen = (
    <SafeAreaView style={styles.shell} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Back in ${entry.label}`} onPress={back} style={styles.control}><Ionicons name="arrow-back" size={23} color={ink} /></Pressable>
        <View style={styles.titleBlock}><Text style={styles.brand}>INDIA GULLY</Text><Text style={styles.title}>{entry.title}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Close ${entry.label}`} onPress={onClose} style={styles.control}><Ionicons name="close" size={25} color={ink} /></Pressable>
      </View>
      {mode !== 'gullu' && <View style={styles.address}><Ionicons name="lock-closed-outline" size={12} color={gold} /><Text style={styles.addressText}>{entry.host} · {entry.caption}</Text></View>}
      {entry.demo && <View style={styles.demoNotice}><Text style={styles.demoText}>DEMO · SAMPLE DATA ONLY</Text><Text style={styles.demoCopy}>Use demo credentials. Please do not upload personal or client information.</Text></View>}
      {loading && <View style={styles.progress} accessibilityRole="progressbar"><ActivityIndicator size="small" color={gold} /><Text style={styles.progressText}>Opening {entry.title.toLowerCase()}…</Text></View>}
      {failed && <View style={styles.error} accessibilityLiveRegion="polite"><Text style={styles.errorText}>We could not load this page. Check your connection and try again.</Text><Pressable accessibilityRole="button" onPress={() => { setFailed(false); web.current?.reload(); }} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View>}
      <WebView<object>
        ref={web}
        source={{ uri: source }}
        style={styles.web}
        // Incognito avoids normal WebView cache reuse. Account/staff entries also
        // reset the app session at /login/mobile before showing login. Careers
        // opens public content directly and never requires account creation.
        incognito
        applicationNameForUserAgent="IndiaGullyApp/1.0.4"
        dataDetectorTypes={Platform.OS === 'ios' ? ['none'] : undefined}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        saveFormDataDisabled
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={request => navigate(request.url)}
        setSupportMultipleWindows
        onOpenWindow={event => { navigate(event.nativeEvent.targetUrl, true); }}
        javaScriptCanOpenWindowsAutomatically={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="never"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        geolocationEnabled={false}
        webviewDebuggingEnabled={false}
        allowsLinkPreview={false}
        mediaPlaybackRequiresUserAction
        onNavigationStateChange={state => {
          if (workspaceTarget(state.url, mode).kind !== 'internal') return;
          current.current = state.url;
          setCanGoBack(state.canGoBack);
        }}
        onLoadStart={() => { setLoading(true); setFailed(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
        onHttpError={event => { if (event.nativeEvent.url === current.current && event.nativeEvent.statusCode >= 400) { setLoading(false); setFailed(true); } }}
        onContentProcessDidTerminate={() => { setLoading(false); setFailed(true); }}
        onRenderProcessGone={() => { setLoading(false); setFailed(true); }}
        onFileDownload={() => explain('Use the document preview in this workspace to read this file.')}
      />
    </SafeAreaView>
  );
  return backRef ? screen : <Modal visible animationType="slide" onRequestClose={back} presentationStyle="fullScreen">{screen}</Modal>;
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 66, borderBottomWidth: 1, borderColor: '#dedacf' },
  control: { width: 44, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  titleBlock: { flex: 1, paddingHorizontal: 4 },
  brand: { fontSize: 9, letterSpacing: 1.6, color: gold, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', color: ink },
  address: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', padding: 7, backgroundColor: '#efe9d9' },
  addressText: { fontSize: 10, color: '#65645c', flexShrink: 1, textAlign: 'center' },
  demoNotice: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#efe9d9', borderBottomWidth: 1, borderColor: '#dedacf' },
  demoText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: ink, textAlign: 'center' },
  demoCopy: { fontSize: 11, lineHeight: 17, color: '#65645c', textAlign: 'center', marginTop: 3 },
  web: { flex: 1, backgroundColor: paper },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 10 },
  progressText: { fontSize: 12, color: '#65645c' },
  error: { padding: 16, backgroundColor: '#efe9d9', gap: 12 },
  errorText: { fontSize: 13, lineHeight: 21, color: ink },
  retry: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: ink },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
});
