import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-elements';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sessions from '../lib/sessions';

const AddExercise = ({ navigation }) => {
  const [exerciseName, setExerciseName] = useState('');
  const [description, setDescription] = useState('');
  const [muscles, setMuscles] = useState([]);
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState([]);
  const [primaryMusclesOpen, setPrimaryMusclesOpen] = useState(false);
  const [secondaryMusclesOpen, setSecondaryMusclesOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const translate = {
    'triceps': 'трицепс',
    'biceps': 'біцепс',
    'forearms': 'підпліччя',
    'deltoids': 'дельтовидні',
    'pectorals': 'грудні',
    'quadriceps': 'квадрицепс',
    'hamstrings': 'надколінні зв\'язки',
    'calves': 'литки',
    'abs': 'прес',
    'chest': 'груди',
    'back': 'спина',
    'shoulders': 'плечі',
    'obliques': 'боки',
  }

  useEffect(() => {
    fetchMuscles();
  }, []);

  const fetchMuscles = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/muscles', {
        headers: {
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
      });
      setMuscles(response.data.data.muscles.map(muscle => ({
        label: translate[muscle.name] || muscle.name,
        value: muscle.id
      })));
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        fetchMuscles();
      }
      console.error('Error fetching muscles:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const headers = {
        'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      };

      const exerciseData = {
        name: exerciseName,
        instructions: description,
        primary_muscle_id: selectedPrimaryMuscles[0],
        secondary_muscle_ids: selectedSecondaryMuscles
      };

      await axios.post(
        'https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises',
        exerciseData,
        { headers }
      );

      setLoading(false);
      alert('Успіх!');
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        handleSubmit();
      }
      console.error('Error creating exercise:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Створити вправу</Text>
      <TextInput
        style={styles.input}
        placeholder="Назва"
        value={exerciseName}
        onChangeText={setExerciseName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Інструкції"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#888"
        multiline
      />
      <Text style={styles.label}>Основні м*язи</Text>
      <DropDownPicker
        multiple
        open={primaryMusclesOpen}
        value={selectedPrimaryMuscles}
        items={muscles}
        setOpen={setPrimaryMusclesOpen}
        setValue={setSelectedPrimaryMuscles}
        placeholder="Обрати"
        containerStyle={styles.dropdown}
        labelStyle={{ fontSize: 14 }}
      />
      <Text style={styles.label}>Другорядні м*язи</Text>
      <DropDownPicker
        multiple
        open={secondaryMusclesOpen}
        value={selectedSecondaryMuscles}
        items={muscles}
        setOpen={setSecondaryMusclesOpen}
        setValue={setSelectedSecondaryMuscles}
        placeholder="Обрати"
        containerStyle={styles.dropdown}
        labelStyle={{ fontSize: 14 }}
      />
      <Button
        title="Створити"
        onPress={handleSubmit}
        loading={loading}
        buttonStyle={styles.addButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
    color: 'black',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  dropdown: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#1e90ff',
  },
});

export default AddExercise;
