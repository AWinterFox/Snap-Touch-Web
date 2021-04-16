import React from 'react';
import Camera, { FACING_MODES } from './lib';
import './reset.css';
import firebase from './firebase'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      visible: false
    }
    this._bootstrapAsync()
  }

  _bootstrapAsync = async () => {
    firebase.auth().signInAnonymously().then((data) => {
      const urlParams = new URLSearchParams(window.location.search);
      const myParam = urlParams.get('id');
      global.id = myParam
      global.uid = data.user.uid
      if (myParam == undefined) {
        window.location.href = "https://snaptouchmenot.com/";
      } else {
        this.getit()
      }
    })
  }

  getit() {
    firebase.firestore()
      .collection('transaction')
      .where("users", "array-contains", global.uid)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          firebase.firestore()
            .collection('transaction')
            .add({
              users: [global.uid, global.id],
              initiator: global.uid,
              photos: [],
              social: ""
            }).then((doc) => {
              this.setState({
                visible: true,
                docu: doc.id
              })
              firebase.firestore()
                .collection('transaction')
                .where("users", "array-contains", global.uid)
                .onSnapshot((snapshot) => {
                  snapshot.docChanges().forEach(change => {

                    if (change.type === 'removed') {
                      this.setState({ receivedImages: [], visible: false }, () => {
                        window.location.href = "https://snaptouchmenot.com/";
                      })
                    }

                  })
                })
            })

        } else {
          snapshot.forEach((snap) => {
            snap.data().photos.forEach((item) => {
              firebase.storage()
                .refFromURL(item)
                .delete()
            })

            firebase.firestore()
              .collection('transaction')
              .doc(snap.id)
              .delete()
              .then(() => {
                firebase.firestore()
                  .collection('transaction')
                  .add({
                    users: [global.uid, global.id],
                    initiator: global.uid,
                    photos: [],
                    social: ""
                  }).then((doc) => {
                    this.setState({
                      visible: true,
                      docu: doc.id
                    })
                  })
              })
          })
        }
      })
  }
  handleTakePhoto(dataUri) {
    // Do stuff with the photo...
    this.uploadImage(dataUri)
    console.log('takePhoto');
  }

  randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  async uploadImage(item) {

    const name = this.randomString(10, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789')
    const response = await fetch(item);
    const blob = await response.blob();

    var ref = firebase.storage().ref().child(name + ".jpeg");

    ref.put(blob).then((itemBlob) => {
      itemBlob.ref.getDownloadURL().then((url) => {
        firebase.firestore()
          .collection('transaction')
          .doc(this.state.docu)
          .update({ photos: firebase.firestore.FieldValue.arrayUnion(url) })
      })
    })
  }

  async close() {
    firebase.firestore()
      .collection('transaction')
      .where("users", "array-contains", global.uid)
      .get()
      .then(async (snapshot) => {
        snapshot.forEach(async (item, int) => {

          item.data().photos.forEach((item) => {
            firebase.storage()
              .refFromURL(item)
              .delete()
          })
          firebase.firestore()
            .collection('transaction')
            .doc(item.id)
            .delete()
            .then(() => {
              alert("deleted")
              this.setState({ visible: false })
              window.location.href = "https://snaptouchmenot.com/";

            })
        })
      })
  }

  render() {
    if (this.state.visible) {


      return (
        <div style={{ flex: 1, maxHeight: '100%', overflow: "hidden"}}>
          <Camera
            isFullscreen
            isMaxResolution
            isImageMirror={false}
            idealFacingMode={FACING_MODES.ENVIRONMENT}
            onTakePhoto={(dataUri) => { this.handleTakePhoto(dataUri); }}
          />
        </div>

      );
    } else {
      return null
    }
  }

}

export default App;
