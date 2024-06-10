import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import Login from './screens/LoginScreen'; // Adjust the import as needed
import Signup from './screens/SignupScreen'; // Adjust the import as needed

import StatisticScreen from './screens/StatisticScreen';
import WorkoutsScreen from './screens/WorkoutsScreen';
import CreateWorkoutScreen from './screens/CreateWorkoutScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ExerciseDetail from './screens/ExerciseDetail';
import AddExercise from './screens/AddExercise';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Statistic"
        component={StatisticScreen}
        options={{
          tabBarLabel: 'Статистика',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart" color={color} size={size} />
          ),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{
          tabBarLabel: 'Тренування',
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" color={color} size={size} />
          ),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="CreateWorkout"
        component={CreateWorkoutScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus-circle" color={color} size={size * 1.5} />
          ),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesScreen}
        options={{
          tabBarLabel: 'Вправи',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dumbbell" color={color} size={size} />
          ),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профіль',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" color={color} size={size} />
          ),
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={Signup} options={{ headerShown: false }}/>
        <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }}/>
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} options={{ headerShown: false }}/>
        <Stack.Screen name="AddExercise" component={AddExercise} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
