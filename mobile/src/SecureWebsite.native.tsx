import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { websiteEntry, workspaceBrowserPage, workspaceTarget } from './workspace-navigation';
import type { WebsiteMode } from './workspace-navigation';

const ink = '#292821', gold = '#8a7333', paper = '#faf9f5';

export default function SecureWebsite({ mode, onClose }: { mode: WebsiteMode; onClose: () => void }) {
  const entry = websiteEntry(mode);
  const web = useRef<WebView<object>>(null);
  const [source, setSource] = useState(entry.url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const current = useRef(entry.url);
  const currentPage = useRef(entry.url);
  const showingPrompt = useRef(false);

  const openBrowser = async (url: string) => {
    try { await WebBrowser.openBrowserAsync(url, { toolbarColor: ink, controlsColor: '#e5d7a8' }); }
    catch { Alert.alert('Could not open this page', 'Please try again when your connection is available.'); }
  };
  const offerBrowser = (title: string, message: string, url: string) => {
    if (showingPrompt.current) return;
    showingPrompt.current = true;
    const done = () => { showingPrompt.current = false; };
    Alert.alert(title, message, [
      { text: 'Stay here', style: 'cancel', onPress: done },
      { text: 'Open browser', onPress: () => { done(); void openBrowser(url); } },
    ], { cancelable: true, onDismiss: done });
  };
  const navigate = (url: string, popup = false): boolean => {
    const target = workspaceTarget(url);
    if (target.kind === 'internal') {
      if (popup) setSource(target.url);
      return true;
    }
    setLoading(false);
    if (target.kind === 'mailbox') {
      if (mode === 'staff') offerBrowser('Connect your mailbox', 'Google mailbox connections need the browser. Open My business mailbox there and choose Connect. You may need to sign in again.', target.url);
      else offerBrowser('Continue in browser', 'This connection needs the browser. Open this page there and start the connection again. You may need to sign in.', workspaceBrowserPage(currentPage.current, mode));
    }
    else if (target.kind === 'external') offerBrowser('Open an external page?', `This link opens ${target.host} in your browser. India Gully will stay open here.`, target.url);
    else if (target.kind === 'export') offerBrowser('Download this export', 'This export needs the browser. Open this workspace page there and choose the export again. You may need to sign in.', workspaceBrowserPage(currentPage.current, mode));
    else if (!showingPrompt.current) {
      showingPrompt.current = true;
      Alert.alert('This link cannot open here', 'Continue here, or use the browser option for supported external services.', [{ text: 'OK', onPress: () => { showingPrompt.current = false; } }], { cancelable: true, onDismiss: () => { showingPrompt.current = false; } });
    }
    return false;
  };
  const back = () => { if (canGoBack) web.current?.goBack(); else onClose(); };

  return <Modal visible animationType="slide" onRequestClose={back} presentationStyle="fullScreen">
    <SafeAreaView style={styles.shell} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Back in ${entry.label}`} onPress={back} style={styles.control}><Ionicons name="arrow-back" size={23} color={ink} /></Pressable>
        <View style={styles.titleBlock}><Text style={styles.brand}>INDIA GULLY</Text><Text style={styles.title}>{entry.title}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${entry.label} in browser`} onPress={() => offerBrowser('Open this page in browser?', 'Use this option for browser-only connections or downloads. Browser sign-in is separate from this app.', workspaceBrowserPage(currentPage.current, mode))} style={styles.control}><Ionicons name="open-outline" size={21} color={gold} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Close ${entry.label}`} onPress={onClose} style={styles.control}><Ionicons name="close" size={25} color={ink} /></Pressable>
      </View>
      <View style={styles.address}><Ionicons name="lock-closed-outline" size={12} color={gold} /><Text style={styles.addressText}>indiagully.com · {entry.caption}</Text></View>
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
          if (workspaceTarget(state.url).kind !== 'internal') return;
          current.current = state.url;
          if (workspaceBrowserPage(state.url, mode) === state.url) currentPage.current = state.url;
          setCanGoBack(state.canGoBack);
        }}
        onLoadStart={() => { setLoading(true); setFailed(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
        onHttpError={event => { if (event.nativeEvent.url === current.current && event.nativeEvent.statusCode >= 400) { setLoading(false); setFailed(true); } }}
        onContentProcessDidTerminate={() => { setLoading(false); setFailed(true); }}
        onRenderProcessGone={() => { setLoading(false); setFailed(true); }}
        onFileDownload={event => {
          if (workspaceTarget(event.nativeEvent.downloadUrl).kind === 'internal') {
            offerBrowser('Download this file', 'Open this workspace page in the browser and choose the download again. You may need to sign in.', workspaceBrowserPage(currentPage.current, mode));
          } else navigate(event.nativeEvent.downloadUrl);
        }}
      />
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 66, borderBottomWidth: 1, borderColor: '#dedacf' },
  control: { width: 44, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  titleBlock: { flex: 1, paddingHorizontal: 4 },
  brand: { fontSize: 9, letterSpacing: 1.6, color: gold, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', color: ink },
  address: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', padding: 7, backgroundColor: '#efe9d9' },
  addressText: { fontSize: 10, color: '#65645c' },
  web: { flex: 1, backgroundColor: paper },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 10 },
  progressText: { fontSize: 12, color: '#65645c' },
  error: { padding: 16, backgroundColor: '#efe9d9', gap: 12 },
  errorText: { fontSize: 13, lineHeight: 21, color: ink },
  retry: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: ink },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
});
