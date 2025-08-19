import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmation from '../components/DeleteConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmails, setUserEmails] = useState<{[key: string]: string}>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    entryId: string | null;
    hours: string;
  }>({
    visible: false,
    entryId: null,
    hours: '',
  });
  
  const { user, userData } = useAuth();
  const { projectId, projectName } = route.params || {};

  // Memoize the query to prevent unnecessary re-renders
  const tasksQuery = useMemo(() => {
    if (!user || !projectId) return null;
    
    const tasksRef = collection(db, 'tasks');
    if (userData?.role === 'admin') {
      return query(tasksRef, where('projectId', '==', projectId));
    } else {
      return query(tasksRef, where('userId', '==', user.uid), where('projectId', '==', projectId));
    }
  }, [user, userData?.role, projectId]);

  // Optimized data fetching with error handling
  const fetchTimeEntries = useCallback(async () => {
    if (!tasksQuery) return;
    
    try {
      setLoading(true);
      const querySnapshot = await getDocs(tasksQuery);
      const tasksData: TimeEntry[] = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as TimeEntry);
      });
      setTimeEntries(tasksData);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      // You could show a toast or alert here
    } finally {
      setLoading(false);
    }
  }, [tasksQuery]);

  // Set up real-time listener with optimization
  useEffect(() => {
    if (!tasksQuery) return;

    const unsubscribe = onSnapshot(
      tasksQuery,
      (querySnapshot) => {
        const tasksData: TimeEntry[] = [];
        querySnapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as TimeEntry);
        });
        setTimeEntries(tasksData);
        setLoading(false);
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tasksQuery]);

  // Fetch user emails for admin view
  const fetchUserEmails = useCallback(async () => {
    if (userData?.role !== 'admin') return;

    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const emailsMap: {[key: string]: string} = {};
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        emailsMap[doc.id] = userData.email || 'Unknown';
      });
      setUserEmails(emailsMap);
    } catch (error) {
      console.error('Error fetching user emails:', error);
    }
  }, [userData?.role]);

  // Fetch user emails when component mounts (for admin)
  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchUserEmails();
    }
  }, [userData?.role, fetchUserEmails]);

  // Pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTimeEntries();
    setRefreshing(false);
  }, [fetchTimeEntries]);

  const showDeleteConfirmation = (entryId: string, hours: string) => {
    setDeleteConfirmation({
      visible: true,
      entryId,
      hours,
    });
  };

  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({
      visible: false,
      entryId: null,
      hours: '',
    });
  };

  const confirmDeleteTimeEntry = async () => {
    if (deleteConfirmation.entryId) {
      try {
        await deleteDoc(doc(db, 'tasks', deleteConfirmation.entryId));
        
        // Update project total hours
        if (projectId) {
          const projectRef = doc(db, 'projects', projectId);
          const currentProject = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
          if (!currentProject.empty) {
            const projectData = currentProject.docs[0].data();
            const newTotalHours = Math.max(0, (projectData.totalHours || 0) - parseFloat(deleteConfirmation.hours));
            await updateDoc(projectRef, { totalHours: newTotalHours });
          }
        }
        
        hideDeleteConfirmation();
      } catch (error) {
        console.error('Failed to delete time entry:', error);
      }
    }
  };

  // Memoize total hours calculation
  const totalHours = useMemo(() => 
    timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours || '0'), 0), 
    [timeEntries]
  );

  // Calculate total earnings based on user's hourly rate
  const totalEarnings = useMemo(() => {
    if (!userData?.hourlyRate) return 0;
    return totalHours * userData.hourlyRate;
  }, [totalHours, userData?.hourlyRate]);

  const navigateToNewEntry = () => {
    navigation.navigate('NewEntry', { projectId, projectName });
  };

  // Show loading spinner while initial data loads
  if (loading && timeEntries.length === 0) {
    return <LoadingSpinner text="Loading timesheet..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Projects')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {projectName ? `${projectName} Timesheet` : 'Timesheet'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryText}>Total Hours: {totalHours.toFixed(2)}</Text>
          {userData?.hourlyRate ? (
            <>
              {/* <Text style={styles.hourlyRateText}>Rate: ₸{userData.hourlyRate.toFixed(2)}/hr</Text> */}
              <Text style={styles.earningsText}>Total: ₸{totalEarnings.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={styles.noRateText}>No hourly rate set</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={navigateToNewEntry}
        >
          <Text style={styles.addButtonText}>+ Add Entry</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.tableContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
          <Text style={[styles.headerCell, styles.taskCell]}>Task</Text>
          <Text style={[styles.headerCell, styles.hoursCell]}>Hours</Text>
          {userData?.role === 'admin' && (
            <Text style={[styles.headerCell, styles.userCell]}>User</Text>
          )}
          <Text style={[styles.headerCell, styles.actionCell]}>Actions</Text>
        </View>

        {loading && timeEntries.length === 0 ? (
          // Show skeleton loaders while loading
          Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.tableRow}>
              <SkeletonLoader width="80%" height={16} />
              <SkeletonLoader width="90%" height={16} />
              <SkeletonLoader width="60%" height={16} />
              {userData?.role === 'admin' && (
                <SkeletonLoader width="70%" height={16} />
              )}
              <SkeletonLoader width="70%" height={16} />
            </View>
          ))
        ) : (
          timeEntries.map((entry) => (
            <View key={entry.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.dateCell]}>{entry.date}</Text>
              <Text style={[styles.cell, styles.taskCell]}>{entry.task}</Text>
              <Text style={[styles.cell, styles.hoursCell]}>{entry.hours}</Text>
              {userData?.role === 'admin' && (
                <Text style={[styles.cell, styles.userCell]}>
                  {userEmails[entry.userId] || 'Unknown'}
                </Text>
              )}
              <View style={styles.actionCell}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => showDeleteConfirmation(entry.id, entry.hours)}
                >
                  <Text style={styles.deleteButtonText}>Delete🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {!loading && timeEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No time entries yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first entry to get started</Text>
          </View>
        )}
      </ScrollView>

      <DeleteConfirmation
        visible={deleteConfirmation.visible}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        onConfirm={confirmDeleteTimeEntry}
        onCancel={hideDeleteConfirmation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
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
  summaryLeft: {
    flex: 1,
    marginRight: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hourlyRateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  earningsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 5,
  },
  noRateText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
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
  rateCell: {
    flex: 0.8,
    textAlign: 'center',
  },
  actionCell: {
    flex: 0.5,
    alignItems: 'flex-start',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
  },
  userCell: {
    flex: 1,
    textAlign: 'center',
  },
});
