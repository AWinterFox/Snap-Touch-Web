import firebase from 'firebase'

let config = {
  apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  // enable persistence by adding the below flag
  persistence: true
};

firebase.initializeApp(config);
export default firebase;