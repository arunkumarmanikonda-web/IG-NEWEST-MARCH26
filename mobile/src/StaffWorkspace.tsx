// Browser-preview fallback. Metro selects StaffWorkspace.native.tsx on phones.
import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { STAFF_SIGN_IN_URL } from './domain';

export default function StaffWorkspace({ onClose }: { onClose: () => void }) {
  return <Modal visible onRequestClose={onClose}><View style={styles.page}>
    <Text style={styles.title}>India Gully · Staff workspace</Text>
    <Text style={styles.copy}>The Android and iOS apps keep staff sign-in inside the app. This browser preview opens our secure website.</Text>
    <Pressable accessibilityRole="button" onPress={() => { void Linking.openURL(STAFF_SIGN_IN_URL); }} style={styles.button}><Text style={styles.buttonText}>Open staff sign-in</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Close staff workspace" onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Close</Text></Pressable>
  </View></Modal>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#faf9f5', gap: 20 }, title: { color: '#292821', fontSize: 24 }, copy: { color: '#65645c', fontSize: 15, lineHeight: 24 }, button: { padding: 15, backgroundColor: '#292821', alignSelf: 'flex-start' }, buttonText: { color: '#ffffff' } });
