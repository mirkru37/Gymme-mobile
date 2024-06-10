import React, { useState, useEffect } from 'react';
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
import { Button, Icon } from 'react-native-elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Sessions from '../lib/sessions';

const StatisticsScreen = () => {
  const [exercises, setExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState({ weight: null, bestWeight: null, bestReps: null });
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exerciseSets, setExerciseSets] = useState([]);
  const [previousBestWeight, setPreviousBestWeight] = useState(null);
  const [currentBestWeight, setCurrentBestWeight] = useState(null);
  const [previousBestReps, setPreviousBestReps] = useState(null);
  const [currentBestReps, setCurrentBestReps] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCard, setEditingCard] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (selectedExercises.weight) {
      fetchExerciseSets(selectedExercises.weight.id);
    }
    if (selectedExercises.bestWeight) {
      fetchExerciseSets(selectedExercises.bestWeight.id, 'bestWeight');
    }
    if (selectedExercises.bestReps) {
      fetchExerciseSets(selectedExercises.bestReps.id, 'bestReps');
    }
  }, [selectedExercises]);

  const fetchExercises = async () => {
    setLoading(true);
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
      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        fetchExercises();
      }
      console.error('Error fetching exercises:', error);
      setLoading(false);
    }
  };

  const fetchExerciseSets = async (exerciseId, cardType = 'weight') => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercise_sets?exercise_id=${exerciseId}`, {
        headers: {
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
        },
      });

      const setsByDate = response.data.data.reduce((acc, set) => {
        const date = new Date(set.date).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(set);
        return acc;
      }, {});

      const sortedDates = Object.keys(setsByDate).sort((a, b) => new Date(a) - new Date(b));
      const groupedSets = sortedDates.map(date => ({
        date,
        sets: setsByDate[date],
      }));

      if (cardType === 'weight') {
        setExerciseSets(groupedSets);
      } else if (cardType === 'bestWeight') {
        calculateBestValues(groupedSets, 'weight');
      } else if (cardType === 'bestReps') {
        calculateBestValues(groupedSets, 'reps');
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        fetchExerciseSets(exerciseId, cardType);
      }
      console.error('Error fetching exercise sets:', error);
    }
  };

  const calculateBestValues = (groupedSets, type) => {
    const values = groupedSets.flatMap(group => group.sets.map(set => set[type]));
    values.sort((a, b) => b - a);

    if (type === 'weight') {
      setPreviousBestWeight(values[1] || null);
      setCurrentBestWeight(values[0] || null);
    } else if (type === 'reps') {
      setPreviousBestReps(values[1] || null);
      setCurrentBestReps(values[0] || null);
    }
  };

  const openExerciseSelectModal = (cardType) => {
    setEditingCard(cardType);
    setModalVisible(true);
  };

  const selectExerciseForCard = (exercise) => {
    setSelectedExercises(prevState => ({ ...prevState, [editingCard]: exercise }));
    setModalVisible(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExercises().then(() => setRefreshing(false));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Прогрес ваги</Text>
          <Icon name="edit" type="font-awesome" onPress={() => openExerciseSelectModal('weight')} />
        </View>
        {selectedExercises.weight && (
          <Text style={styles.selectedExercise}>{selectedExercises.weight.name}</Text>
        )}
        {exerciseSets.length > 0 ? (
          <LineChart
            data={{
              labels: exerciseSets.map(group => group.date),
              datasets: [
                {
                  data: exerciseSets.map(group => group.sets.reduce((sum, set) => sum + set.weight, 0) / group.sets.length),
                },
              ],
            }}
            width={Dimensions.get('window').width - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix="kg"
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        ) : (
          <Text style={styles.noDataText}>No data</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Найкраща вага</Text>
          <Icon name="edit" type="font-awesome" onPress={() => openExerciseSelectModal('bestWeight')} />
        </View>
        {selectedExercises.bestWeight && (
          <Text style={styles.selectedExercise}>{selectedExercises.bestWeight.name}</Text>
        )}
        <View style={styles.bestValuesContainer}>
          {previousBestWeight !== null ? (
            <Text style={styles.previousBest}>{previousBestWeight} kg</Text>
          ) : (
            <Text style={styles.noDataText}>Немає даних</Text>
          )}
          {currentBestWeight !== null ? (
            <Text style={styles.currentBest}>{currentBestWeight} kg</Text>
          ) : (
            <Text style={styles.noDataText}>Немає даних</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Найбільше повторень</Text>
          <Icon name="edit" type="font-awesome" onPress={() => openExerciseSelectModal('bestReps')} />
        </View>
        {selectedExercises.bestReps && (
          <Text style={styles.selectedExercise}>{selectedExercises.bestReps.name}</Text>
        )}
        <View style={styles.bestValuesContainer}>
          {previousBestReps !== null ? (
            <Text style={styles.previousBest}>{previousBestReps}</Text>
          ) : (
            <Text style={styles.noDataText}>Немає даних</Text>
          )}
          {currentBestReps !== null ? (
            <Text style={styles.currentBest}>{currentBestReps}</Text>
          ) : (
            <Text style={styles.noDataText}>Немає даних</Text>
          )}
        </View>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Вибрати вправу</Text>
            <ScrollView>
              {exercises.map(exercise => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.modalItem}
                  onPress={() => selectExerciseForCard(exercise)}
                >
                  <Text style={styles.modalItemText}>{exercise.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Закрити" onPress={() => setModalVisible(false)} containerStyle={styles.modalButton} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  noDataText: {
    textAlign: 'center',
    color: 'grey',
    fontSize: 16,
    marginVertical: 20,
  },
  bestValuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  previousBest: {
    color: 'grey',
    fontSize: 16,
  },
  currentBest: {
    color: 'green',
    fontSize: 24,
    fontWeight: 'bold',
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
    color: 'black',
  },
  modalButton: {
    marginTop: 20,
  },
  selectedExercise: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default StatisticsScreen;
