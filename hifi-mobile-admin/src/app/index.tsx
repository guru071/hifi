import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Informe email e senha.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://hificustom.goatech.tech'}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.error || 'Credenciais inválidas');
      }
      // Armazenar o token em hardware seguro
      await SecureStore.setItemAsync('hifi_admin_jwt', data.token);
      router.replace('/dashboard');
    } catch (err: any) {
      Alert.alert('Falha na Autenticação', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HIFI Admin</Text>
      <Text style={styles.subtitle}>Acesso Restrito</Text>
      <TextInput
        style={styles.input}
        placeholder="Email do Administrador"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>
    </View>
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
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  }
});
