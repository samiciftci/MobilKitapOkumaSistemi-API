// src/AdminGuard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from './AuthContext';

// Higher-Order Component (HOC) şeklinde kullanım
export const AdminGuard = (WrappedComponent: React.FC<any>): React.FC<any> => {
  return (props: any) => {
    const { user } = useAuth();

    if (!user || !user.isAdmin) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>
            Bu ekrana yalnızca admin kullanıcılar erişebilir.
          </Text>
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});
