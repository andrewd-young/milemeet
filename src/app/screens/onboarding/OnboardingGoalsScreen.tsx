import React, { useState } from 'react'

import {
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const OnboardingGoalsScreen = () => {
  const [input, setInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const { setGoals } = useOnboarding()
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'OnboardingGoals'>>()

  const addTag = (text: string) => {
    const trimmed = text.trim().replace(/,$/, '').trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setInput('')
  }

  const handleChangeText = (text: string) => {
    if (text.endsWith(',')) {
      addTag(text)
    } else {
      setInput(text)
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    const finalTags = input.trim() ? [...tags, input.trim()] : tags
    setGoals(finalTags)
    navigation.navigate('StravaConnect')
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.label}>Goals for your runs (optional)</Text>
      <View style={globalStyles.tagInputContainer}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {tags.map((tag, i) => (
            <TouchableOpacity
              key={i}
              style={globalStyles.tag}
              onPress={() => removeTag(i)}
            >
              <Text style={globalStyles.tagText}>{tag}  x</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={globalStyles.tagInput}
          value={input}
          onChangeText={handleChangeText}
          onSubmitEditing={() => addTag(input)}
          placeholder="Type a goal and press return"
          placeholderTextColor="#888"
          autoCorrect={false}
          returnKeyType="done"
          blurOnSubmit={false}
        />
      </View>
      <Text style={[globalStyles.label, { fontSize: 13, color: '#888', marginTop: 4 }]}>
        Separate goals with commas or press return
      </Text>
      <Button title="Next" onPress={handleNext} />
    </View>
  )
}

export default OnboardingGoalsScreen
