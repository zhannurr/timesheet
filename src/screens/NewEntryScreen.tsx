import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NewEntryScreenProps {
  navigation: any;
  route: any;
}

export default function NewEntryScreen({ navigation, route }: NewEntryScreenProps) {
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    projectName: '',
    task: '',
    hours: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const { projectId, projectName } = route.params || {};

  useEffect(() => {
    if (projectId && projectName) {
      setNewEntry(prev => ({ ...prev, projectId, projectName }));
    }
  }, [projectId, projectName]);

  const addTimeEntry = useCallback(async () => {
    if (!newEntry.date || !newEntry.task || !newEntry.hours) {
      alert('Please fill in all required fields (Date, Task, and Hours');
      return;
    }

    if (parseFloat(newEntry.hours) <= 0) {
      alert('Hours must be greater than 0');
      return;
    }

    if (parseFloat(newEntry.hours) > 24) {
      alert('Hours cannot exceed 24 in a single day');
      return;
    }

    try {
      setSubmitting(true);
      
      const taskData = {
        ...newEntry,
        userId: user?.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add task with timeout
      const addTaskPromise = addDoc(collection(db, 'tasks'), taskData);
      const addTaskTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Task creation timeout')), 10000)
      );
      
      await Promise.race([addTaskPromise, addTaskTimeout]);
      
      // Update project total hours with timeout
      if (projectId) {
        const projectRef = doc(db, 'projects', projectId);
        const currentProject = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
        if (!currentProject.empty) {
          const projectData = currentProject.docs[0].data();
          const newTotalHours = (projectData.totalHours || 0) + parseFloat(newEntry.hours);
          
          const updateProjectPromise = updateDoc(projectRef, { 
            totalHours: newTotalHours,
            updatedAt: new Date()
          });
          const updateProjectTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Project update timeout')), 10000)
          );
          
          await Promise.race([updateProjectPromise, updateProjectTimeout]);
        }
      }

      navigation.goBack();
      
    } catch (error) {
      console.error('Failed to add time entry:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        alert('The operation is taking longer than expected. Please check your connection and try again.');
      } else {
        alert('Failed to add time entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [newEntry, user?.uid, projectId, navigation]);

  const resetForm = useCallback(() => {
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      projectId: projectId || '',
      projectName: projectName || '',
      task: '',
      hours: '',
    });
  }, [projectId, projectName]);

  const validateHours = useCallback((text: string) => {
    const hours = parseFloat(text);
    if (isNaN(hours) || hours < 0) {
      return false;
    }
    if (hours > 24) {
      alert('Hours exceed 24. Please verify this is correct.');
    }
    return true;
  }, []);

  const handleHoursChange = useCallback((text: string) => {
    if (text === '' || validateHours(text)) {
      setNewEntry(prev => ({ ...prev, hours: text }));
    }
  }, [validateHours]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>New Time Entry</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formContainer, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Entry Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.inputPlaceholder}
              value={newEntry.date}
              onChangeText={(text) => setNewEntry({...newEntry, date: text})}
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Project</Text>
            <TextInput
              style={[
                styles.input,
                styles.disabledInput,
                {
                  backgroundColor: theme.surfaceVariant,
                  color: theme.textSecondary,
                },
              ]}
              value={newEntry.projectName}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Hours *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="0.0"
              placeholderTextColor={theme.inputPlaceholder}
              value={newEntry.hours}
              onChangeText={handleHoursChange}
              keyboardType="numeric"
              editable={!submitting}
            />
            {userData?.hourlyRate ? (
              <Text style={[styles.rateInfo, { color: theme.primary }]}>
                Your hourly rate: ₸{userData.hourlyRate.toFixed(2)}/hr
              </Text>
            ) : (
              <Text style={[styles.noRateInfo, { color: theme.textSecondary }]}>
                No hourly rate set. Contact admin to set your rate.
              </Text>
            )}
            {userData?.hourlyRate && newEntry.hours && parseFloat(newEntry.hours) > 0 && (
              <Text style={[styles.earningsPreview, { color: theme.text }]}>
                Estimated earnings: ₸{(parseFloat(newEntry.hours) * userData.hourlyRate).toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Task *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="Enter task description"
              placeholderTextColor={theme.inputPlaceholder}
              value={newEntry.task}
              onChangeText={(text) => setNewEntry({...newEntry, task: text})}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />
          </View>


          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.resetButton, 
                { backgroundColor: theme.secondary },
                submitting && styles.disabledButton
              ]} 
              onPress={resetForm}
              disabled={submitting}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                { backgroundColor: theme.success },
                submitting && styles.disabledButton
              ]} 
              onPress={addTimeEntry}
              disabled={submitting}
            >
              {submitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Entry</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Same width as backButton for balance
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  disabledInput: {
    // backgroundColor and color will be set dynamically
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  resetButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  rateInfo: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  noRateInfo: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  earningsPreview: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
});
