// Expo web preview. The native app uses the embedded WebView implementation.
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { websiteEntry } from './workspace-navigation';
import type { WebsiteMode } from './workspace-navigation';

export type WebsiteProps = {
  mode: WebsiteMode;
  publicUrl?: string;
  backRef?: React.RefObject<(() => void) | null>;
  onClose: () => void;
};

export default function SecureWebsite({ mode, publicUrl, backRef, onClose }: WebsiteProps) {
  const entry = websiteEntry(mode, undefined, publicUrl);
  const screen = <View style={styles.page}>
    <Text accessibilityRole="header" style={styles.title}>India Gully · {entry.title}</Text>
    <Text style={styles.copy}>{entry.host}{entry.demo ? ' · DEMO · SAMPLE DATA ONLY' : ''}</Text>
    {entry.demo && <Text style={styles.copy}>Use demo credentials. Please do not upload personal or client information.</Text>}
    <a href={entry.url} target="_self">{entry.previewAction}</a>
    <Pressable accessibilityRole="button" accessibilityLabel={`Close ${entry.label}`} onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Close</Text></Pressable>
  </View>;
  return backRef ? screen : <Modal visible onRequestClose={onClose}>{screen}</Modal>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#faf9f5', gap: 20 }, title: { color: '#292821', fontSize: 24 }, copy: { color: '#65645c', fontSize: 15, lineHeight: 24 }, button: { padding: 15, backgroundColor: '#292821', alignSelf: 'flex-start' }, buttonText: { color: '#ffffff' } });
