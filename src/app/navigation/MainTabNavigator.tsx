import React from 'react'

import { TouchableOpacity } from 'react-native'

import { FontAwesome5 } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { MainTabParamList, RootStackParamList } from '../../types/navigation'
import ConnectionsScreen from '../screens/ConnectionsScreen'
import NearbyRunnersScreen from '../screens/NearbyRunnersScreen'
import ProfileScreen from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator<MainTabParamList>()

const EditProfileButton = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  return (
    <TouchableOpacity
      style={{ padding: 8, marginRight: 8 }}
      onPress={() => navigation.navigate('EditProfile')}
    >
      <FontAwesome5 name="cog" size={20} color="#666" />
    </TouchableOpacity>
  )
}

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1fb28a',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="NearbyRunners"
        component={NearbyRunnersScreen}
        options={{
          tabBarLabel: 'Runners',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="running" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{
          tabBarLabel: 'Connections',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="comments" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-circle" size={size} color={color} />
          ),
          headerShown: true,
          headerTitle: '',
          headerRight: () => <EditProfileButton />,
        }}
      />
    </Tab.Navigator>
  )
}

export default MainTabNavigator
