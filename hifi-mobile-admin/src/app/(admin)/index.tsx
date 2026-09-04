import { View, Text, StyleSheet } from 'react-native';

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Sales</Text>
            <Text style={styles.cardValue}>$12,500</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Orders</Text>
            <Text style={styles.cardValue}>48</Text>
          </View>
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
  content: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20, 
    margin: 8, 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, color: '#666' },
  cardValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  footer: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 12, color: '#999', marginTop: 4 }
});
