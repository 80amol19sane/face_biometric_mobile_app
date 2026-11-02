import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    FlatList
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function EmployeeEnrollmentScreen() {
    const [activeTab, setActiveTab] = useState<'status' | 'search' | 'face' | 'pin'>('status');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusSearchQuery, setStatusSearchQuery] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [enrollmentList, setEnrollmentList] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // Fetch enrollment status on mount
    useEffect(() => {
        fetchEnrollmentStatus();
    }, []);

    // Filter enrollment list based on search
    const filteredEnrollmentList = enrollmentList.filter(emp =>
        emp.employee_name.toLowerCase().includes(statusSearchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(statusSearchQuery.toLowerCase())
    );

    const fetchEnrollmentStatus = async () => {
        setLoading(true);
        try {
            const serverUrl = await SecureStore.getItemAsync('server_url');

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.employee_enrollment.get_employees_with_enrollment_status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const json = await response.json();

            if (json.message && json.message.employees) {
                setEnrollmentList(json.message.employees);
            }
        } catch (error) {
            console.error('Failed to fetch enrollment status:', error);
            Alert.alert('Error', 'Failed to load enrollment status');
        } finally {
            setLoading(false);
        }
    };

    const searchEmployees = async () => {
        if (!searchQuery) {
            Alert.alert("Error", "Please enter search query");
            return;
        }

        setLoading(true);
        try {
            const serverUrl = await SecureStore.getItemAsync('server_url');

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.employee.search?query=${searchQuery}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const json = await response.json();

            if (json.message && json.message.employees) {
                setEmployees(json.message.employees);
            } else {
                Alert.alert("No Results", "No employees found");
                setEmployees([]);
            }

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to search employees");
        } finally {
            setLoading(false);
        }
    };

    const selectEmployee = (employee: any) => {
        setSelectedEmployee(employee);
        setActiveTab('face');
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true
            });

            if (!result.canceled && result.assets[0].base64) {
                setCapturedImages([...capturedImages, result.assets[0].base64]);

                if (capturedImages.length + 1 >= 3) {
                    Alert.alert("Success", "Selected 3 photos. You can now register the face.");
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const capturePhoto = async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true
            });

            if (photo && photo.base64) {
                setCapturedImages([...capturedImages, photo.base64]);

                if (capturedImages.length + 1 >= 3) {
                    Alert.alert("Success", "Captured 3 photos. You can now register the face.");
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to capture photo");
        }
    };

    const registerFace = async () => {
        if (capturedImages.length < 3) {
            Alert.alert("Error", "Please capture at least 3 photos");
            return;
        }

        setLoading(true);
        try {
            const serverUrl = await SecureStore.getItemAsync('server_url');

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.face.register_face`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: selectedEmployee.employee_id,
                    images: capturedImages
                })
            });

            const json = await response.json();

            console.log('Face registration response:', json);

            if (json.message && json.message.success) {
                Alert.alert("Success", "Face registered successfully!");
                setCapturedImages([]);
                setActiveTab('pin');
            } else {
                const errorMsg = json.message?.message || json.exc || "Face registration failed";
                console.error('Face registration error:', errorMsg);
                Alert.alert("Failed", errorMsg);
            }

        } catch (e) {
            console.error('Face registration exception:', e);
            Alert.alert("Error", "Network request failed");
        } finally {
            setLoading(false);
        }
    };

    const registerPIN = async () => {
        if (!pin || !confirmPin) {
            Alert.alert("Error", "Please enter PIN");
            return;
        }

        if (pin !== confirmPin) {
            Alert.alert("Error", "PINs do not match");
            return;
        }

        if (pin.length < 4) {
            Alert.alert("Error", "PIN must be at least 4 digits");
            return;
        }

        setLoading(true);
        try {
            const serverUrl = await SecureStore.getItemAsync('server_url');

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.pin_auth.set_pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: selectedEmployee.employee_id,
                    pin: pin
                })
            });

            const json = await response.json();

            console.log('PIN registration response:', json);

            if (json.message && json.message.success) {
                Alert.alert("Success", "PIN registered successfully!", [
                    {
                        text: "OK", onPress: () => {
                            setSelectedEmployee(null);
                            setPin('');
                            setConfirmPin('');
                            setActiveTab('search');
                        }
                    }
                ]);
            } else {
                const errorMsg = json.message?.message || json.exc || "PIN registration failed";
                console.error('PIN registration error:', errorMsg);
                Alert.alert("Failed", errorMsg);
            }

        } catch (e) {
            console.error('PIN registration exception:', e);
            Alert.alert("Error", "Network request failed");
        } finally {
            setLoading(false);
        }
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted && activeTab === 'face') {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Camera permission required</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Employee Enrollment</Text>
                    {selectedEmployee && (
                        <Text style={styles.subtitle}>{selectedEmployee.employee_name}</Text>
                    )}
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/admin/settings')}
                    style={styles.settingsButton}
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {selectedEmployee && (
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'face' && styles.tabActive]}
                        onPress={() => setActiveTab('face')}
                    >
                        <Text style={[styles.tabText, activeTab === 'face' && styles.tabTextActive]}>
                            Face
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pin' && styles.tabActive]}
                        onPress={() => setActiveTab('pin')}
                    >
                        <Text style={[styles.tabText, activeTab === 'pin' && styles.tabTextActive]}>
                            PIN
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.content}>
                {activeTab === 'status' && (
                    <View style={styles.statusContainer}>
                        <View style={styles.statusHeader}>
                            <Text style={styles.statusTitle}>Employee Enrollment Status</Text>
                            <TouchableOpacity onPress={fetchEnrollmentStatus} style={styles.refreshButton}>
                                <Text style={styles.refreshText}>🔄 Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or ID..."
                            value={statusSearchQuery}
                            onChangeText={setStatusSearchQuery}
                            autoCapitalize="none"
                        />

                        {loading ? (
                            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {/* Table Header */}
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, styles.colName]}>Name</Text>
                                    <Text style={[styles.tableHeaderText, styles.colId]}>ID</Text>
                                    <Text style={[styles.tableHeaderText, styles.colStatus]}>Face</Text>
                                    <Text style={[styles.tableHeaderText, styles.colStatus]}>PIN</Text>
                                </View>

                                <FlatList
                                    data={filteredEnrollmentList}
                                    keyExtractor={(item) => item.employee_id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.tableRow}
                                            onPress={() => {
                                                setSelectedEmployee({
                                                    employee_id: item.employee_id,
                                                    employee_name: item.employee_name
                                                });
                                                setActiveTab('search');
                                            }}
                                        >
                                            <View style={styles.colName}>
                                                <Text style={styles.tableCellName} numberOfLines={1}>
                                                    {item.employee_name}
                                                </Text>
                                                {item.department && (
                                                    <Text style={styles.tableCellDept} numberOfLines={1}>
                                                        {item.department}
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={[styles.tableCell, styles.colId]} numberOfLines={1}>
                                                {item.employee_id}
                                            </Text>
                                            <View style={[styles.colStatus, styles.centerAlign]}>
                                                <Text style={item.has_face ? styles.statusYes : styles.statusNo}>
                                                    {item.has_face ? '✓' : '✗'}
                                                </Text>
                                            </View>
                                            <View style={[styles.colStatus, styles.centerAlign]}>
                                                <Text style={item.has_pin ? styles.statusYes : styles.statusNo}>
                                                    {item.has_pin ? '✓' : '✗'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyText}>
                                                {statusSearchQuery ? 'No matching employees' : 'No employees found'}
                                            </Text>
                                        </View>
                                    }
                                />
                            </>
                        )}
                    </View>
                )}

                {activeTab === 'search' && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.input}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name or ID"
                            onSubmitEditing={searchEmployees}
                        />
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={searchEmployees}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Search</Text>
                            )}
                        </TouchableOpacity>

                        <FlatList
                            data={employees}
                            keyExtractor={(item) => item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.employeeItem}
                                    onPress={() => selectEmployee(item)}
                                >
                                    <Text style={styles.employeeName}>{item.employee_name}</Text>
                                    <Text style={styles.employeeId}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No employees found</Text>
                            }
                        />
                    </View>
                )}

                {activeTab === 'face' && selectedEmployee && (
                    <ScrollView style={styles.faceContainer} contentContainerStyle={styles.faceContent}>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            facing="front"
                        />

                        <Text style={styles.instruction}>
                            Captured: {capturedImages.length}/3 photos
                        </Text>

                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={capturePhoto}
                        >
                            <Text style={styles.captureButtonText}>📷 Capture Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pickButton}
                            onPress={pickImage}
                        >
                            <Text style={styles.pickButtonText}>🖼️ Pick from Gallery</Text>
                        </TouchableOpacity>

                        {capturedImages.length >= 3 && (
                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={registerFace}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Register Face</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                )}

                {activeTab === 'pin' && selectedEmployee && (
                    <View style={styles.pinContainer}>
                        <Text style={styles.label}>Enter PIN (4-6 digits)</Text>
                        <TextInput
                            style={styles.input}
                            value={pin}
                            onChangeText={setPin}
                            placeholder="Enter PIN"
                            keyboardType="numeric"
                            secureTextEntry
                            maxLength={6}
                        />

                        <Text style={styles.label}>Confirm PIN</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPin}
                            onChangeText={setConfirmPin}
                            placeholder="Confirm PIN"
                            keyboardType="numeric"
                            secureTextEntry
                            maxLength={6}
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={registerPIN}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Register PIN</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
    },
    settingsButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        marginTop: 4,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    tabTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    searchContainer: {
        flex: 1,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    employeeItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    employeeId: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
    faceContainer: {
        flex: 1,
    },
    faceContent: {
        paddingBottom: 20,
    },
    camera: {
        width: '100%',
        height: 400,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    instruction: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    captureButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    pickButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    pickButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    pinContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    backButton: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 14,
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    statusContainer: {
        flex: 1,
        padding: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    refreshButton: {
        padding: 8,
    },
    refreshText: {
        fontSize: 14,
        color: '#007AFF',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    colName: {
        flex: 3,
        paddingRight: 8,
    },
    colId: {
        flex: 2,
        paddingRight: 8,
    },
    colStatus: {
        flex: 1,
        alignItems: 'center',
    },
    centerAlign: {
        justifyContent: 'center',
    },
    tableCell: {
        fontSize: 11,
        color: '#333',
    },
    tableCellName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    tableCellDept: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    statusYes: {
        fontSize: 16,
        color: '#34A853',
        fontWeight: 'bold',
    },
    statusNo: {
        fontSize: 16,
        color: '#EA4335',
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
