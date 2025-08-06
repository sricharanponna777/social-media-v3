import React from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

let colorScheme1;

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  colorScheme1 = colorScheme;
  console.log('Color scheme:', colorScheme);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Our App!</Text>
      <Text style={styles.subtitle}>Connect with friends, share your moments, and explore.</Text>
      <Button
        onPress={() => router.replace('/login')} //
        // color="#007AFF" 
        style={styles.login}
      >
        Login
      </Button>
      <Button
        onPress={() => router.replace('/register')} //
        // color="#007AFF" 
        style={styles.register}
      >
        Register
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  login: {
    backgroundColor: colorScheme1 === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)',
    padding: 10,
    borderRadius: '12.5%',
    marginTop: 20,
  },
  register: {
    backgroundColor: colorScheme1 === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)',
    padding: 10,
    borderRadius: '12.5%',
    marginTop: 20,
  },
});
