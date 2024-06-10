import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Input, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const _retrieveData = async () => {
    try {
      const access = await AsyncStorage.getItem('access_token');
      const refresh = await AsyncStorage.getItem('refresh_token');
      if (access !== null && refresh !== null) {
        return navigation.navigate('Home');
      }
    } catch (error) {
    }
  };

  _retrieveData();

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/sessions', {
        auth_by: email.includes('@') ? 'email' : 'username', // or 'username' depending on your login method
        identifier: email,
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Accept': '*/*',
        }
      });

      const { access_token, refresh_token } = response.data;

      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);
      await AsyncStorage.setItem('email', email);

      setLoading(false);
      navigation.navigate('Home');
    } catch (error) {
      setLoading(false);
      setError('Невірні дані для входу. Будь ласка, спробуйте ще раз.');
    }
  };

  return (
    <View style={styles.container}>
      <Input
        placeholder="Імя користувача/email"
        leftIcon={<Icon name="user" size={24} color="black" />}
        onChangeText={setEmail}
        value={email}
      />
      <Input
        placeholder="Пароль"
        leftIcon={<Icon name="lock" size={24} color="black" />}
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Вхід" onPress={handleLogin} />
      )}
      <TouchableOpacity style={styles.signupContainer} onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.signupText}>Ще не зареєстровані? Зареєструватися</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  signupContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

