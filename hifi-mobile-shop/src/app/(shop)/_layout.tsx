import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ShopLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#6C63FF' }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'AI Explore',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="cart" 
        options={{ 
          title: 'Cart',
          tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
      
      {/* Hidden deeply nested screens that shouldn't be tabs */}
      <Tabs.Screen name="product/[id]" options={{ href: null, title: 'Product Details' }} />
      <Tabs.Screen name="checkout" options={{ href: null, title: 'Checkout' }} />
    </Tabs>
  );
}
