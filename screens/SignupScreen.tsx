import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Input, Button } from 'react-native-elements';
import axios from 'axios';

const translateErrorMessage = (message) => {
  const translations = {
    "must be unique": "Повинен бути унікальним",
    "invalid email format": "Невірний формат електронної пошти",
    "must contain only characters, numbers, underscore": "Повинен містити лише символи, цифри, підкреслення",
    "must contain one of special characters(!@#$%^&*?)": "Повинен містити один з спеціальних символів (!@#$%^&*?)",
    "must contain at least one uppercase letter": "Повинен містити принаймні одну велику літеру",
    "must contain at least one lowercase letter": "Повинен містити принаймні одну малу літеру",
    "must be filled": "Повинно бути заповнено",
    "must contain at least one number": "Повинен містити принаймні одну цифру",
    "must be at least 8 characters": "Повинен містити принаймні 8 символів",
    "must be at least 3 characters": "Повинен містити принаймні 3 символи",
  };
  return translations[message] || message;
};

export default function Signup({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [usernameErrors, setUsernameErrors] = useState([]);
  const [emailErrors, setEmailErrors] = useState([]);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordErrors, setConfirmPasswordErrors] = useState([]);

  const handleSignup = async () => {
    let errors = {};

    if (!username) {
      if (!errors.username) errors.username = [];
      errors.username.push('* Ім\'я користувача є обов\'язковим.');
    }

    if (!email) {
      if (!errors.email) errors.email = [];
      errors.email.push('* Імейл є обов\'язковим.');
    }

    if (!password) {
      if (!errors.password) errors.password = [];
      errors.password.push('* Пароль є обов\'язковим.');
    }

    if (!confirmPassword || password !== confirmPassword) {
      if (!errors.confirmPassword) errors.confirmPassword = [];
      errors.confirmPassword.push('* Паролі не співпадають.');
    }

    setUsernameErrors(errors.username || []);
    setEmailErrors(errors.email || []);
    setPasswordErrors(errors.password || []);
    setConfirmPasswordErrors(errors.confirmPassword || []);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const response = await axios.post('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/users', {
        username: username,
        email: email,
        password: password,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Accept': '*/*',
        }
      }
    );
      if (response.data) {
        setLoading(false);
        navigation.navigate('Login');
      }
    } catch (error) {
      setLoading(false);
      const serverErrors = error.response.data.errors[0]; // [{"password": ["must contain at least one number"]}]
      if (serverErrors.username) setUsernameErrors(serverErrors.username.map(translateErrorMessage));
      if (serverErrors.email) setEmailErrors(serverErrors.email.map(translateErrorMessage));
      if (serverErrors.password) setPasswordErrors(serverErrors.password.map(translateErrorMessage));
    }
  };

  return (
    <View style={styles.container}>
      <Input
        placeholder="Ім'я користувача"
        leftIcon={{ type: 'font-awesome', name: 'user' }}
        onChangeText={setUsername}
        value={username}
        errorMessage={usernameErrors.join('\n')}
      />
      <Input
        placeholder="Email"
        leftIcon={{ type: 'font-awesome', name: 'envelope' }}
        onChangeText={setEmail}
        value={email}
        errorMessage={emailErrors.join('\n')}
      />
      <Input
        placeholder="Пароль"
        leftIcon={{ type: 'font-awesome', name: 'lock' }}
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        errorMessage={passwordErrors.join('\n')}
      />
      <Input
        placeholder="Підтвердження паролю"
        leftIcon={{ type: 'font-awesome', name: 'lock' }}
        secureTextEntry
        onChangeText={setConfirmPassword}
        value={confirmPassword}
        errorMessage={confirmPasswordErrors.join('\n')}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Зареєструватися" onPress={handleSignup} />
      )}
      <TouchableOpacity style={styles.signinContainer} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.signinText}>Уже зареєстровані? Увійти</Text>
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
  signinContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signinText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});
