import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>HIFI Admin</Text>
      <Text style={styles.subtitle}>Secure Access Only</Text>
      <Link href="/dashboard" style={styles.link}>
        <Text style={styles.linkText}>Go to Dashboard</Text>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  link: {
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  linkText: {
    color: '#fff',
    fontWeight: '600',
  }
});
