import React from 'react'

import { StyleSheet, TouchableOpacity } from 'react-native'

import { FontAwesome5 } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { MainTabParamList, RootStackParamList } from '../../types/navigation'
import { colors } from '../theme'
import ConnectionsScreen from '../screens/ConnectionsScreen'
import NearbyRunnersScreen from '../screens/NearbyRunnersScreen'
import ProfileScreen from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator<MainTabParamList>()

const EditProfileButton = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  return (
    <TouchableOpacity
      style={s.editButton}
      onPress={() => navigation.navigate('EditProfile')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome5 name="pen" size={15} color={colors.textPrimary} />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
})

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#C8F135',
        tabBarInactiveTintColor: '#636366',
        tabBarStyle: { backgroundColor: '#1C1C1E', borderTopColor: '#38383A' },
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
          headerStyle: { backgroundColor: '#0D0D0D' },
          headerShadowVisible: false,
          headerRight: () => <EditProfileButton />,
          headerRightContainerStyle: { paddingRight: 0 },
        }}
      />
    </Tab.Navigator>
  )
}

export default MainTabNavigator
