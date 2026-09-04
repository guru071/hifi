import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function CartScreen() {
  const [loading, setLoading] = useState(false);
  const { getIdToken } = useAuth();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Must be logged in to checkout");

      // 1. Create order on backend to get razorpay_order_id
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [{ product_id: 'mock', quantity: 1, variant_id: 'mock-variant' }],
          shipping_address: { city: 'Villupuram', state: 'Tamilnadu', pincode: '604304', phone: '0000000000' }
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create order");
      }

      const { razorpayOrderId, amount, orderId } = await res.json();

      // 2. Open Razorpay Native Checkout
      const options = {
        description: 'HIFI Premium Customs',
        image: 'https://hificustom.goatech.tech/logo.png',
        currency: 'INR',
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy',
        amount: amount * 100,
        name: 'HIFI',
        order_id: razorpayOrderId,
        theme: { color: '#000000' }
      };

      const data = await RazorpayCheckout.open(options);

      // 3. Verify Payment
      const formData = new FormData();
      formData.append('razorpay_order_id', data.razorpay_order_id);
      formData.append('razorpay_payment_id', data.razorpay_payment_id);
      formData.append('razorpay_signature', data.razorpay_signature);
      formData.append('orderId', orderId); 

      const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (verifyRes.ok) {
        Alert.alert('Success', 'Payment verified successfully!');
      } else {
        throw new Error('Payment verification failed');
      }

    } catch (error: any) {
      Alert.alert('Error', error.description || error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your Cart is Empty</Text>
      
      {/* Mock checkout button for Native Integrations testing */}
      <TouchableOpacity 
        style={styles.checkoutButton}
        onPress={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.checkoutText}>Test Native Checkout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666', marginBottom: 20 },
  checkoutButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
