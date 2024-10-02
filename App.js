import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RNCamera} from 'react-native-camera';

const {width, height} = Dimensions.get('window');

const App = () => {
  const [box, setBox] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedFace, setDetectedFace] = useState(null);
  const [faceName, setFaceName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [faceRegistry, setFaceRegistry] = useState({});
  const cameraRef = useRef(null);

  // Fixed Center Box dimensions and position
  const fixedBoxDimensions = {
    width: width * 0.4,
    height: height * 0.3,
    x: (width - width * 0.4) / 2,
    y: (height - height * 0.3) / 2,
  };

  useEffect(() => {
    requestPermissions().then();
  }, [requestPermissions]);

  // Permissions Handling for Android
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const cameraGranted = await requestCameraPermission();
      if (!cameraGranted) {
        Alert.alert('Permissions Error', 'Camera permission is required.');
      }
    }
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera permission for face detection.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Handle Face Detection
  const handleFaceDetection = ({faces}) => {
    if (faces.length > 0) {
      const face = faces[0];
      const faceBounds = {
        x: face.bounds.origin.x,
        y: face.bounds.origin.y,
        width: face.bounds.size.width,
        height: face.bounds.size.height,
      };
      setBox(faceBounds);

      // Check if face bounding box matches the yellow box with 90% accuracy
      if (
        Math.abs(faceBounds.x - fixedBoxDimensions.x) / fixedBoxDimensions.x <=
          0.1 &&
        Math.abs(faceBounds.y - fixedBoxDimensions.y) / fixedBoxDimensions.y <=
          0.1 &&
        Math.abs(faceBounds.width - fixedBoxDimensions.width) /
          fixedBoxDimensions.width <=
          0.1 &&
        Math.abs(faceBounds.height - fixedBoxDimensions.height) /
          fixedBoxDimensions.height <=
          0.1
      ) {
        // Check if the face is already registered
        if (faceRegistry[face.faceID]) {
          setIsCameraActive(false); // Stop the camera
          Alert.alert('Face Detected', `Name: ${faceRegistry[face.faceID]}`);
        } else {
          setDetectedFace(face); // Store the detected face for later use
          setModalVisible(true); // Show modal to enter face name
          setIsCameraActive(false); // Stop the camera once the face is captured
        }
      } else {
        setDetectedFace(
          `Face detected but not accurately inside the capture box`,
        );
      }
    } else {
      setBox(null); // Clear box if no face is detected
      setDetectedFace(null);
    }
  };

  // Toggle Camera State
  const toggleCamera = () => {
    setBox(null); // Clear previous face box
    setDetectedFace(null); // Clear previous detected face data
    setFaceName(''); // Clear previous face name
    setIsCameraActive(true); // Activate the camera
  };

  // Handle face name submission
  const handleFaceNameSubmit = () => {
    if (faceName.trim()) {
      // Register the face name
      setFaceRegistry(prev => ({
        ...prev,
        [detectedFace.faceID]: faceName.trim(),
      }));
      Alert.alert('Face Registered', `Name: ${faceName}`);
      setModalVisible(false); // Close modal
    } else {
      Alert.alert('Error', 'Please enter a name for the face.');
    }
  };

  // @ts-ignore
  return (
    <View style={styles.container}>
      {isCameraActive ? (
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          type={RNCamera.Constants.Type.front}
          captureAudio={false}
          faceDetectionLandmarks={
            RNCamera.Constants.FaceDetection.Landmarks.all
          }
          faceDetectionClassifications={
            RNCamera.Constants.FaceDetection.Classifications.all
          }
          onFacesDetected={handleFaceDetection}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Camera is off</Text>
        </View>
      )}

      {/* Button to Start the Camera */}
      {!isCameraActive && (
        <TouchableOpacity style={styles.button} onPress={toggleCamera}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      )}

      {/* Draw the Fixed Center Box (Yellow Box) */}
      <View style={styles.fixedBox({...fixedBoxDimensions})} />

      {/* Draw the Moving Box (Red Box) if Face is Detected */}
      {box && (
        <View
          style={styles.bound({
            width: box.width,
            height: box.height,
            x: box.x,
            y: box.y,
          })}
        />
      )}

      {/* Modal for Entering Face Name */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Enter Face Name:</Text>
          <TextInput
            style={styles.textInput}
            value={faceName}
            onChangeText={setFaceName}
            placeholder="Face Name"
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleFaceNameSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: 'white',
  },
  button: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#0288D1',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  // Fixed Yellow Box Style
  fixedBox: ({width, height, x, y}) => ({
    position: 'absolute',
    top: y,
    left: x,
    width,
    height,
    borderWidth: 3,
    borderColor: 'yellow',
    zIndex: 2000,
  }),
  // Face Bounding Box Style (Red Box)
  bound: ({width, height, x, y}) => ({
    position: 'absolute',
    top: y,
    left: x,
    height,
    width,
    borderWidth: 3,
    borderColor: 'red',
    zIndex: 3000,
  }),
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: 'red',
    fontWeight: 'bold',
  },
});
