import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Button } from 'react-native-elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sessions from '../lib/sessions';

const WorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');

      const [workoutsResponse, exercisesResponse] = await Promise.all([
        axios.get('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/workouts', {
          headers: {
            'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
          },
        }),
        axios.get('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises', {
          headers: {
            'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
          },
        }),
      ]);

      setWorkouts(workoutsResponse.data.data || []);
      setExercises(exercisesResponse.data.data || []);
      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        fetchData();
      }
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  const openWorkoutDetails = (workout) => {
    setSelectedWorkout(workout);
    setModalVisible(true);
  };

  const formatTime = (time) => {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTrainedMuscles = (workout) => {
    const uniqueExerciseIds = Array.from(new Set(workout.exercise_sets.map(set => set.exercise.id)));
    const primaryMuscles = [];
    const secondaryMuscles = [];

    uniqueExerciseIds.forEach(exerciseId => {
      const exercise = exercises.find(ex => ex.id === exerciseId);
      if (exercise) {
        console.log(exercise);
        if (exercise.primary_muscle.id) {
          primaryMuscles.push(translate[exercise.primary_muscle.name] || 'Невідомо');
        }
        if (exercise.secondary_muscles) {
          exercise.secondary_muscles.forEach(muscle => {
            const muscleName = translate[muscle.name] || 'Невідомо';
            if (!secondaryMuscles.includes(muscleName)) {
              secondaryMuscles.push(muscleName);
            }
          });
        }
      }
    });

    return {
      primary: Array.from(new Set(primaryMuscles)),
      secondary: Array.from(new Set(secondaryMuscles)),
    };
  };

  const groupSetsByExercise = (sets) => {
    const grouped = sets.reduce((acc, set) => {
      if (!acc[set.exercise.id]) {
        acc[set.exercise.id] = { exercise: set.exercise, sets: [] };
      }
      acc[set.exercise.id].sets.push(set);
      return acc;
    }, {});
    return Object.values(grouped);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {workouts.map((workout) => (
            <TouchableOpacity key={workout.id} style={styles.workoutItem} onPress={() => openWorkoutDetails(workout)}>
              <Text style={styles.workoutText}>Тривалість: {formatTime(workout.duration)}</Text>
              <Text style={styles.workoutText}>Задіяні м*язи: {getTrainedMuscles(workout).primary.join(', ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {selectedWorkout && (
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.modalTitle}>Деталі</Text>
                <Text style={styles.modalText}>Тривалість: {formatTime(selectedWorkout.duration)}</Text>
                <Text style={styles.modalText}>Основні м*язи: {getTrainedMuscles(selectedWorkout).primary.join(', ')}</Text>
                <Text style={styles.modalText}>Другорядні м*язи: {getTrainedMuscles(selectedWorkout).secondary.join(', ')}</Text>
                {groupSetsByExercise(selectedWorkout.exercise_sets).map((group, index) => (
                  <View key={index} style={styles.exerciseContainer}>
                    <Text style={styles.exerciseName}>{group.exercise.name}</Text>
                    {group.sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.setContainer}>
                        <Text style={styles.modalText}>К-сть: {set.reps}</Text>
                        <Text style={styles.modalText}>Вага: {set.weight}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                <Button title="Закрити" onPress={() => setModalVisible(false)} containerStyle={styles.modalButton} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  workoutItem: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 5,
  },
  workoutText: {
    fontSize: 16,
    color: 'black',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  modalText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 10,
  },
  exerciseContainer: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  setContainer: {
    backgroundColor: '#d0d0d0',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    marginTop: 20,
  },
});

export default WorkoutsScreen;
