import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SearchBar, Button, Icon, Overlay } from 'react-native-elements';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sessions from '../lib/sessions';

const ExercisesScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [muscles, setMuscles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState([]);
  const [primaryMusclesOpen, setPrimaryMusclesOpen] = useState(false);
  const [secondaryMusclesOpen, setSecondaryMusclesOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    fetchData();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [search, selectedPrimaryMuscles, selectedSecondaryMuscles]);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const exerciseResponse = await axios.get('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises', {
        headers: {
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
      });
      const musclesResponse = await axios.get('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/muscles', {
        headers: {
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
      });
      setExercises(exerciseResponse.data.data);
      setFilteredExercises(exerciseResponse.data.data);
      setMuscles(musclesResponse.data.data.muscles.map(muscle => ({
        label: translate[muscle.name] || muscle.name,
        value: muscle.id
      })));
      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        fetchData();
      } else {
        console.error(error);
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  const filterExercises = () => {
    let filtered = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedPrimaryMuscles.length === 0 || selectedPrimaryMuscles.includes(exercise.primary_muscle.id)) &&
      (selectedSecondaryMuscles.length === 0 || exercise.secondary_muscles.some(m => selectedSecondaryMuscles.includes(m.id)))
    );
    setFilteredExercises(filtered);
  };

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}>
      <View style={styles.exerciseItem}>
        <Image
          source={{ uri: item.preview_image || 'https://placehold.co/60x60/1ecbe1/FFF.png' }}
          style={styles.exerciseImage}
        />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.muscleText}>Основні: {translate[item.primary_muscle.name]}</Text>
          <Text style={styles.muscleText}>Додаткові: {item.secondary_muscles.map(m => translate[m.name] || m.name).join(', ')}</Text>
        </View>
        <TouchableOpacity>
          <Icon name="edit" type="font-awesome" color="black" size={20} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getSelectedMusclesLabel = (selectedMuscles) => {
    if (selectedMuscles.length === 0) {
      return 'Обрані м\'язи';
    }
    const selectedLabels = selectedMuscles.map(value => muscles.find(muscle => muscle.value === value)?.label);
    return selectedLabels.join(', ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Пошук вправ..."
          onChangeText={setSearch}
          value={search}
          lightTheme
          round
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInputContainer}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Icon name="filter" type="font-awesome" color={"black"} size={24} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddExercise')}>
        <Icon name="plus" type="font-awesome" color="white" size={30} />
      </TouchableOpacity>
      <Overlay isVisible={filterVisible} onBackdropPress={() => setFilterVisible(false)}>
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Основні м*язи</Text>
          <DropDownPicker
            multiple
            open={primaryMusclesOpen}
            value={selectedPrimaryMuscles}
            items={muscles}
            setOpen={setPrimaryMusclesOpen}
            setValue={setSelectedPrimaryMuscles}
            placeholder="Обрати"
            containerStyle={styles.dropdown}
            multipleText={getSelectedMusclesLabel(selectedPrimaryMuscles)}
          />
          <Text style={styles.filterTitle}>Додаткові м*язи</Text>
          <DropDownPicker
            multiple
            open={secondaryMusclesOpen}
            value={selectedSecondaryMuscles}
            items={muscles}
            setOpen={setSecondaryMusclesOpen}
            setValue={setSelectedSecondaryMuscles}
            placeholder="Обрати"
            multipleText={getSelectedMusclesLabel(selectedSecondaryMuscles)}
            containerStyle={styles.dropdown1}
          />
          <Button title="Застосувати" onPress={() => setFilterVisible(false)} />
        </View>
      </Overlay>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.noExercisesText}>Немає вправ</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  searchBarInputContainer: {
    backgroundColor: 'transparent',
  },
  filterButton: {
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: 'blue',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  filterContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: 'black',
  },
  dropdown: {
    marginBottom: 20,
    zIndex: 1000
  },
  dropdown1: {
    marginBottom: 20,
    zIndex: 999
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginRight: 10,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  muscleText: {
    fontSize: 14,
    color: '#666',
  },
  noExercisesText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#999',
  },
});

export default ExercisesScreen;
