import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { Icon, Button } from 'react-native-elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sessions from '../lib/sessions';

const AddWorkout = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    fetchExercises();
    const timerInterval = setInterval(() => {
      if (isRunning) {
        setTimer(prevTimer => prevTimer + 1);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isRunning]);

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

  const fetchExercises = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises', {
        headers: {
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
        },
      });
      setExercises(response.data.data || []);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        fetchExercises();
      }
      console.error('Error fetching exercises:', error);
    }
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addExerciseToWorkout = () => {
    const selected = exercises.filter(exercise =>
      selectedExercises.includes(exercise.id)
    );
    setWorkoutExercises([...workoutExercises, ...selected.map(ex => ({ ...ex, sets: [] }))]);
    setSelectedExercises([]);
    setModalVisible(false);
  };

  const addSet = (exerciseId) => {
    const updatedExercises = workoutExercises.map(exercise => {
      if (exercise.id === exerciseId) {
        exercise.sets.push({ reps: 0, weight: 0 });
      }
      return exercise;
    });
    setWorkoutExercises(updatedExercises);
  };

  const removeSet = (exerciseId, setIndex) => {
    const updatedExercises = workoutExercises.map(exercise => {
      if (exercise.id === exerciseId) {
        exercise.sets.splice(setIndex, 1);
      }
      return exercise;
    });
    setWorkoutExercises(updatedExercises);
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    const updatedExercises = workoutExercises.map(exercise => {
      if (exercise.id === exerciseId) {
        exercise.sets[setIndex][field] = isNaN(parseInt(value)) ? 0 : parseInt(value);
      }
      return exercise;
    });
    setWorkoutExercises(updatedExercises);
  };

  const saveWorkout = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const headers = {
        'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*',
      };

      const workoutData = {
        duration: formatTime(timer),
        exercise_sets_attributes: workoutExercises.flatMap(exercise =>
          exercise.sets.map(set => ({
            exercise_id: exercise.id,
            weight: set.weight,
            reps: set.reps,
          }))
        ),
      };

      await axios.post(
        'https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/workouts',
        workoutData,
        { headers }
      );

      setLoading(false);
      alert('Workout saved successfully!');
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        saveWorkout();
      }
      console.error('Error saving workout:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
        <Button title={isRunning ? 'Пауза' : 'Старт'} onPress={() => setIsRunning(!isRunning)} />
      </View>
      <Button title="Додати вправу" onPress={() => setModalVisible(true)} containerStyle={styles.addButton} />
      {workoutExercises.map((exercise, index) => (
        <View key={index} style={styles.exerciseContainer}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setContainer}>
              <Text style={styles.label}>К-сть</Text>
              <View style={styles.inputGroup}>
                <TouchableOpacity onPress={() => updateSet(exercise.id, setIndex, 'reps', Math.max(0, set.reps - 1))}>
                  <Icon name="minus" type="font-awesome" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={String(set.reps)}
                  keyboardType="numeric"
                  onChangeText={text => updateSet(exercise.id, setIndex, 'reps', text)}
                />
                <TouchableOpacity onPress={() => updateSet(exercise.id, setIndex, 'reps', set.reps + 1)}>
                  <Icon name="plus" type="font-awesome" />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Вага</Text>
              <View style={styles.inputGroup}>
                <TouchableOpacity onPress={() => updateSet(exercise.id, setIndex, 'weight', Math.max(0, set.weight - 1))}>
                  <Icon name="minus" type="font-awesome" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={String(set.weight)}
                  keyboardType="numeric"
                  onChangeText={text => updateSet(exercise.id, setIndex, 'weight', text)}
                />
                <TouchableOpacity onPress={() => updateSet(exercise.id, setIndex, 'weight', set.weight + 1)}>
                  <Icon name="plus" type="font-awesome" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.removeSetButton} onPress={() => removeSet(exercise.id, setIndex)}>
                <Icon name="trash" type="font-awesome" color="#ff4d4d" />
              </TouchableOpacity>
            </View>
          ))}
          <Button title="Додати підхід" onPress={() => addSet(exercise.id)} buttonStyle={styles.addSetButton} containerStyle={styles.addSetButtonContainer} />
        </View>
      ))}
      <Button title="Зберегти" onPress={saveWorkout} loading={loading} containerStyle={styles.saveButton} />
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Вибрати вправи</Text>
            <ScrollView>
              {exercises.map(exercise => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.modalItem}
                  onPress={() => {
                    if (selectedExercises.includes(exercise.id)) {
                      setSelectedExercises(selectedExercises.filter(id => id !== exercise.id));
                    } else {
                      setSelectedExercises([...selectedExercises, exercise.id]);
                    }
                  }}
                >
                  <Image source={{ uri: exercise.image?.url || '' }} style={styles.modalItemImage} />
                  <Text style={styles.modalItemText}>{exercise.name}</Text>
                  {selectedExercises.includes(exercise.id) && <Icon name="check" type="font-awesome" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtonGroup}>
              <Button title="Додати" onPress={addExerciseToWorkout} />
              <Button title="Закрити" onPress={() => setModalVisible(false)} containerStyle={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  exerciseContainer: {
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  setContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: 50,
    height: 50,
    textAlign: 'center',
    marginHorizontal: 5,
    color: 'black',
  },
  label: {
    color: 'black',
    fontSize: 12,
    marginRight: 10,
  },
  addButton: {
    marginBottom: 20,
  },
  blackText: {
    color: 'black',
  },
  addSetButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 10,
  },
  addSetButtonContainer: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  removeSetButton: {
    marginLeft: 10,
  },
  saveButton: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalItemImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  modalButton: {
    marginTop: 10,
  },
  modalButtonGroup: {
    marginTop: 20,
  },
});

export default AddWorkout;
