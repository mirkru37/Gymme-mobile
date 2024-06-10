import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { Icon, Button, Overlay } from 'react-native-elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import Sessions from '../lib/sessions';
import MusclesImage from '../lib/musclesImage';
import { launchImageLibrary } from 'react-native-image-picker';

const ExerciseDetail = ({ route, navigation }) => {
  const exerciseId  = route.params.exercise.id;
  const [exercise, setExercise] = useState(null);
  const [attachments, setAttachments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [editName, setEditName] = useState(false);
  const [editInstructions, setEditInstructions] = useState(false);
  const [editMuscles, setEditMuscles] = useState(false);
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [muscles, setMuscles] = useState([]);
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState([]);
  const [primaryMusclesOpen, setPrimaryMusclesOpen] = useState(false);
  const [secondaryMusclesOpen, setSecondaryMusclesOpen] = useState(false);

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
    fetchExerciseDetails();
  }, []);

  const fetchExerciseDetails = async () => {
    try {
      console.log('exerciseId', exerciseId);
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises/${exerciseId}`, {
        headers: {
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
      });
      const attachmentsResponse = await axios.get(`https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises/${exerciseId}/attachments`, {
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
      setMuscles(musclesResponse.data.data.muscles.map(muscle => ({
        label: muscle.name,
        value: muscle.id
      })));
      const exerciseData = response.data.data;
      setExercise(exerciseData);
      setAttachments(attachmentsResponse.data.data);
      setName(exerciseData.name);
      setInstructions(exerciseData.instructions);
      setSelectedPrimaryMuscles([exerciseData.primary_muscle.id]);
      setSelectedSecondaryMuscles(exerciseData.secondary_muscles.map(muscle => muscle.id));
      setLoading(false);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        fetchExerciseDetails();
      }
    }
  };

  const saveExerciseDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.put(`https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises/${exerciseId}`, {
        name,
        instructions,
        primary_muscle_id: selectedPrimaryMuscles[0],
        secondary_muscle_ids: selectedSecondaryMuscles
      }, {
        headers: {
          'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
      });
      fetchExerciseDetails();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await Sessions.refresh();
        saveExerciseDetails();
      }
    }
  };

  const handleImageUpload = async () => {
    const options = {
      mediaType: 'photo',
    };
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const source = { uri: response.uri };
        const data = new FormData();
        data.append('file', {
          uri: response.uri,
          type: response.type,
          name: response.fileName,
        });

        try {
          const token = await AsyncStorage.getItem('access_token');
          await axios.post(
            `https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/exercises/${exerciseId}/attachments`,
            data,
            {
              headers: {
                'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          fetchExerciseDetails();
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <ScrollView horizontal contentContainerStyle={styles.attachmentsContainer}>
            {attachments?.attachments?.map((attachment, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri: attachment.image.url }}
                  style={styles.image}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
                {imageLoading && (
                  <ActivityIndicator size="small" color="#0000ff" style={styles.imageLoader} />
                )}
              </View>
            ))}
            {
              !attachments?.attachments && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{uri: 'https://placehold.co/200x200/1ecbe1/FFF.png'}}
                    style={styles.image}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                </View>
              )
            }
          </ScrollView>
          <View style={styles.lineSeparator} />
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Назва</Text>
            {editName ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
                <TouchableOpacity onPress={() => { setEditName(false); saveExerciseDetails(); }}>
                  <Icon name="save" type="font-awesome" color="black" size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.editContainer}>
                <Text style={styles.value}>{exercise.name}</Text>
                <TouchableOpacity onPress={() => setEditName(true)}>
                  <Icon name="edit" type="font-awesome" color="black" size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Інструкції</Text>
            {editInstructions ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={instructions}
                  onChangeText={setInstructions}
                />
                <TouchableOpacity onPress={() => { setEditInstructions(false); saveExerciseDetails(); }}>
                  <Icon name="save" type="font-awesome" color="black" size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.editContainer}>
                <Text style={styles.value}>{exercise.instructions}</Text>
                <TouchableOpacity onPress={() => setEditInstructions(true)}>
                  <Icon name="edit" type="font-awesome" color="black" size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <View style={styles.editContainer}>
              <Text style={styles.label}>Задіяні м*язи</Text>
              <TouchableOpacity onPress={() => setEditMuscles(true)}>
                <Icon name="edit" type="font-awesome" color="black" size={20} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.value}>Основні: {translate[exercise.primary_muscle.name]}</Text>
          <Text style={styles.value}>Другорядні: {exercise.secondary_muscles.map(m => translate[m.name]).join(', ')}</Text>
          <Overlay isVisible={editMuscles} onBackdropPress={() => setEditMuscles(false)}>
            <View style={styles.filterContainer}>
              <Text style={styles.filterTitle}>Основні</Text>
              <DropDownPicker
                multiple
                open={primaryMusclesOpen}
                value={selectedPrimaryMuscles}
                items={muscles}
                setOpen={setPrimaryMusclesOpen}
                setValue={setSelectedPrimaryMuscles}
                placeholder="Обрати"
                containerStyle={[styles.dropdown, primaryMusclesOpen ? { zIndex: 1000 } : {}]}
                labelStyle={{ fontSize: 14 }}
              />
              <Text style={styles.filterTitle}>Другорядні</Text>
              <DropDownPicker
                multiple
                open={secondaryMusclesOpen}
                value={selectedSecondaryMuscles}
                items={muscles}
                setOpen={setSecondaryMusclesOpen}
                setValue={setSelectedSecondaryMuscles}
                placeholder="Обрати"
                containerStyle={[styles.dropdown, secondaryMusclesOpen ? { zIndex: 1000 } : {}]}
                labelStyle={{ fontSize: 14 }}
              />
              <Button title="Save" onPress={() => { setEditMuscles(false); saveExerciseDetails(); }} />
            </View>
          </Overlay>
          <Button title="Загрузити фото" onPress={handleImageUpload} buttonStyle={styles.uploadButton} />
          {/* <MusclesImage 
            selectedPrimary={selectedPrimaryMuscles.map(value => muscles.find(muscle => muscle.value === value)?.label)}
            selectedSecondary={selectedSecondaryMuscles.map(value => muscles.find(muscle => muscle.value === value)?.label)}
          /> */}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  video: {
    width: 300,
    height: 200,
    marginRight: 10,
  },
  imageContainer: {
    width: 300,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
  },
  lineSeparator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  fieldContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  value: {
    fontSize: 16,
    color: 'black',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    fontSize: 16,
    marginRight: 10,
    color: 'black',
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
  },
  uploadButton: {
    backgroundColor: '#1e90ff',
    marginTop: 20,
  },
});

export default ExerciseDetail;
