import { StyleSheet } from 'react-native'

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    padding: 20,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  // Typography
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#6b7280',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#111827',
  },

  // Input styles
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  inputCentered: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    textAlign: 'center',
    color: '#111827',
    backgroundColor: '#ffffff',
  },

  // Button styles
  inlineButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  inlineButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    margin: 4,
    backgroundColor: '#ffffff',
    minWidth: 80,
    alignItems: 'center',
  },
  inlineButtonSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  inlineButtonText: {
    color: '#111827',
    fontSize: 14,
  },
  inlineButtonTextSelected: {
    color: '#fff',
    fontSize: 14,
  },

  // Distance stepper styles
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginRight: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 20,
    color: '#111827',
    lineHeight: 24,
  },
  stepperValue: {
    width: 36,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },

  // Tag input styles
  tagInputContainer: {
    width: '100%',
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagInput: {
    color: '#111827',
    fontSize: 16,
    padding: 8,
  },
  tag: {
    backgroundColor: '#d1fae5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
  },
  tagText: {
    color: '#3ca897',
    fontSize: 14,
  },

  // Profile styles
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 70,
    height: 70,
  },
  profileName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  sectionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    paddingLeft: 2,
  },
  profileFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileFieldRowLast: {
    borderBottomWidth: 0,
  },
  profileFieldIcon: {
    width: 24,
    marginRight: 12,
  },
  profileFieldContent: {
    flex: 1,
  },
  profileFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  profileFieldValue: {
    fontSize: 16,
    color: '#222',
  },
  profileFieldValueEmpty: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  appConnectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  appConnectionRowLast: {
    borderBottomWidth: 0,
  },
  appConnectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appConnectionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    marginLeft: 12,
  },
  appConnectionStatus: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  settingsButton: {
    padding: 8,
  },
  // Nearby runner cards
  runnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  runnerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  runnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  runnerHeaderText: {
    flex: 1,
  },
  runnerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  runnerNeighborhood: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  runnerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  runnerChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ecfdf3',
    marginRight: 8,
  },
  runnerChipText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  runnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
  },
  runnerPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
    marginRight: 6,
  },
  runnerPillValue: {
    fontSize: 13,
    color: '#1e293b',
  },
  runnerGoalsRow: {
    marginTop: 10,
  },
  runnerGoalsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  runnerGoalsText: {
    fontSize: 14,
    color: '#111827',
  },
})
