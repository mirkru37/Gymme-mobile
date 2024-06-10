import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button, Icon } from 'react-native-elements';

const ProfileScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');

  const translations = {
    settings: 'Налаштування',
    logout: 'Вихід',
  };

  const retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('email');
      if (value !== null) {
        setUsername(value);
      }
    } catch (error) {
      // Error retrieving data
    }
  };

  useEffect(() => {
    retrieveData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: `https://robohash.org/${username}` }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{username}</Text>
          <TouchableOpacity>
            <Icon name="edit" type="font-awesome" color="black" size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.settingsContainer}>
        <Button
          title={translations.settings}
          type="clear"
          onPress={() => console.log('Navigate to Settings')}
        />
        <Button
          title={translations.logout}
          buttonStyle={styles.logoutButton}
          onPress={() => {
            AsyncStorage.clear();
            navigation.navigate('Login');
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#8a9593',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 20,
    color: 'black',
    marginRight: 10,
  },
  settingsContainer: {
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  logoutButton: {
    backgroundColor: 'red',
    marginTop: 10,
  },
});

export default ProfileScreen;
