// Browser-preview fallback. Metro selects SecureWebsite.native.tsx on phones.
import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { websiteEntry } from './workspace-navigation';
import type { WebsiteMode } from './workspace-navigation';

export default function SecureWebsite({ mode, onClose }: { mode: WebsiteMode; onClose: () => void }) {
  const entry = websiteEntry(mode);
  return <Modal visible onRequestClose={onClose}><View style={styles.page}>
    <Text accessibilityRole="header" style={styles.title}>India Gully · {entry.title}</Text>
    <Text style={styles.copy}>{entry.host}{entry.demo ? ' · DEMO · SAMPLE DATA ONLY' : ''}</Text>
    {entry.demo && <Text style={styles.copy}>Use demo credentials. Please do not upload personal or client information.</Text>}
    <Text style={styles.copy}>The Android and iOS apps keep {entry.label} inside India Gully. This browser preview opens our secure website.</Text>
    <Pressable accessibilityRole="button" onPress={() => { void Linking.openURL(entry.url); }} style={styles.button}><Text style={styles.buttonText}>{entry.previewAction}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Close ${entry.label}`} onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Close</Text></Pressable>
  </View></Modal>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#faf9f5', gap: 20 }, title: { color: '#292821', fontSize: 24 }, copy: { color: '#65645c', fontSize: 15, lineHeight: 24 }, button: { padding: 15, backgroundColor: '#292821', alignSelf: 'flex-start' }, buttonText: { color: '#ffffff' } });
