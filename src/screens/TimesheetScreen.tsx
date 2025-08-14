import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

interface TimeEntry {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  task: string;
  hours: string;

  userId: string;
}

export default function TimesheetScreen({ navigation, route }: { navigation: any; route: any }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<TimeEntry, 'id' | 'userId'>>({
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    projectName: '',
    task: '',
    hours: '',

  });
  
  const { user } = useAuth();
  const { projectId, projectName } = route.params || {};

  useEffect(() => {
    if (user && projectId) {
      setNewEntry(prev => ({ ...prev, projectId, projectName }));
      
      const tasksRef = collection(db, 'tasks');
      // Only show tasks created by the current user
      const q = query(tasksRef, where('userId', '==', user.uid), where('projectId', '==', projectId));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData: TimeEntry[] = [];
        querySnapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as TimeEntry);
        });
        setTimeEntries(tasksData);
      });

      return () => unsubscribe();
    }
  }, [user, projectId]);

  const addTimeEntry = async () => {
    if (!newEntry.date || !newEntry.task || !newEntry.hours) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        ...newEntry,
        userId: user?.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'tasks'), taskData);
      
      // Update project total hours
      if (projectId) {
        const projectRef = doc(db, 'projects', projectId);
        const currentProject = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
        if (!currentProject.empty) {
          const projectData = currentProject.docs[0].data();
          const newTotalHours = (projectData.totalHours || 0) + parseFloat(newEntry.hours);
          await updateDoc(projectRef, { totalHours: newTotalHours });
        }
      }

      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        projectId: projectId || '',
        projectName: projectName || '',
        task: '',
        hours: '',

      });
      setShowAddForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add time entry');
    }
  };

  const deleteTimeEntry = async (id: string, hours: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this time entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'tasks', id));
            
            // Update project total hours
            if (projectId) {
              const projectRef = doc(db, 'projects', projectId);
              const currentProject = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
              if (!currentProject.empty) {
                const projectData = currentProject.docs[0].data();
                const newTotalHours = Math.max(0, (projectData.totalHours || 0) - parseFloat(hours));
                await updateDoc(projectRef, { totalHours: newTotalHours });
              }
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete time entry');
          }
        }}
      ]
    );
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours || '0'), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {projectName ? `${projectName} Timesheet` : 'Timesheet'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total Hours: {totalHours}</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>
            {showAddForm ? 'Cancel' : '+ Add Entry'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Task"
            value={newEntry.task}
            onChangeText={(text) => setNewEntry({...newEntry, task: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Hours"
            value={newEntry.hours}
            onChangeText={(text) => setNewEntry({...newEntry, hours: text})}
            keyboardType="numeric"
          />
        
          <TouchableOpacity style={styles.saveButton} onPress={addTimeEntry}>
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
          <Text style={[styles.headerCell, styles.taskCell]}>Task</Text>
          <Text style={[styles.headerCell, styles.hoursCell]}>Hours</Text>
          <Text style={[styles.headerCell, styles.actionCell]}>Actions</Text>
        </View>

        {timeEntries.map((entry) => (
          <View key={entry.id} style={styles.tableRow}>
            <Text style={[styles.cell, styles.dateCell]}>{entry.date}</Text>
            <Text style={[styles.cell, styles.taskCell]}>{entry.task}</Text>
            <Text style={[styles.cell, styles.hoursCell]}>{entry.hours}</Text>
            <View style={styles.actionCell}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteTimeEntry(entry.id, entry.hours)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 10,
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerSpacer: {
    width: 44, // Same width as menuButton for balance
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cell: {   
    fontSize: 14,   
    color: '#333',
  },
  dateCell: {
    flex: 1,
  },
  projectCell: {
    flex: 1.5,
  },
  taskCell: {
    flex: 1.5,
  },
  hoursCell: {
    flex: 0.5,
    textAlign: 'center',
  },
  actionCell: {
    flex: 0.5,
    alignItems: 'center',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
});
