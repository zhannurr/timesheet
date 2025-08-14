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
  
  const { user } = useAuth();
  const { projectId, projectName } = route.params || {};

  useEffect(() => {
    if (projectId && projectName) {
      setNewEntry(prev => ({ ...prev, projectId, projectName }));
    }
  }, [projectId, projectName]);

  const addTimeEntry = useCallback(async () => {
    if (!newEntry.date || !newEntry.task || !newEntry.hours) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Date, Task, and Hours)');
      return;
    }

    if (parseFloat(newEntry.hours) <= 0) {
      Alert.alert('Validation Error', 'Hours must be greater than 0');
      return;
    }

    if (parseFloat(newEntry.hours) > 24) {
      Alert.alert('Validation Error', 'Hours cannot exceed 24 in a single day');
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
        Alert.alert('Timeout Error', 'The operation is taking longer than expected. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to add time entry. Please try again.');
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
      Alert.alert('Warning', 'Hours exceed 24. Please verify this is correct.');
    }
    return true;
  }, []);

  const handleHoursChange = useCallback((text: string) => {
    if (text === '' || validateHours(text)) {
      setNewEntry(prev => ({ ...prev, hours: text }));
    }
  }, [validateHours]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Time Entry</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Entry Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={newEntry.date}
              onChangeText={(text) => setNewEntry({...newEntry, date: text})}
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={newEntry.projectName}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task description"
              value={newEntry.task}
              onChangeText={(text) => setNewEntry({...newEntry, task: text})}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hours *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              value={newEntry.hours}
              onChangeText={handleHoursChange}
              keyboardType="numeric"
              editable={!submitting}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.resetButton, submitting && styles.disabledButton]} 
              onPress={resetForm}
              disabled={submitting}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, submitting && styles.disabledButton]} 
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
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
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6c757d',
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
    backgroundColor: '#34C759',
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
});
