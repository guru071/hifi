import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>You are not logged in.</Text>
        <Button title="Login / Sign Up" onPress={() => router.push('/(auth)/login')} color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Welcome, {user.displayName || user.email}</Text>
        <View style={styles.actions}>
          <Button title="Sign Out" onPress={signOut} color="#ff3b30" />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>builded by GOAT'ECH and powered by MAGHGO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, color: '#666', marginBottom: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  actions: { width: '100%', marginTop: 20 },
  footer: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 12, color: '#999', marginTop: 4 }
});
