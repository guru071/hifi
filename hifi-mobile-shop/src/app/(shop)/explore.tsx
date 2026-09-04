import { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

export default function AIExplore() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // In a real app, this would hit an AI endpoint that uses embeddings
      // For now, we hit the standard search endpoint
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.results || []);
    } catch (e) {
      console.error("AI Search failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color="#6C63FF" />
        <Text style={styles.headerTitle}>AI Semantic Explorer</Text>
      </View>
      
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Describe what you're looking for... (e.g. 'a red dress for summer')"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>AI is analyzing your request...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query && !loading ? (
              <Text style={styles.emptyText}>No matching styles found.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push(`/(shop)/product/${item.id}`)}
            >
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: '#6C63FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#666' },
  list: { padding: 8 },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  image: { width: '100%', height: 120, resizeMode: 'cover', borderRadius: 6, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  price: { fontSize: 14, color: '#333' },
});
